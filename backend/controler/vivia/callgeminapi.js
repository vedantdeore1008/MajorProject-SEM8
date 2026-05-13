import multer from "multer";
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (GEMINI_API_KEY) {
  const masked = `${String(GEMINI_API_KEY).slice(0, 4)}...${String(GEMINI_API_KEY).slice(-4)}`;
  console.log("GEMINI_API_KEY:", masked);
}

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined in the environment variables.");
  process.exit(1);
}

// Groq API Key (backup when Gemini hits rate limits) - set GROQ_API_KEY in env vars
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Groq fallback evaluation function
const evaluateWithGroq = async (question, modelAnswer, userTranscript) => {
  const prompt = `You are a scoring assistant. Evaluate the user's answer based on the following parameters.
Return ONLY valid JSON with this exact format (no markdown, no code blocks):
{"Relevance": X, "Completeness": X, "Accuracy": X, "DepthOfKnowledge": X, "TotalAverageScore": X}
where X is a number from 0 to 10.

Question: ${question}
Model Answer: ${modelAnswer}
User Answer: ${userTranscript}`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    },
    {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || "";
  console.log("[viva/groq-fallback] response:", content.slice(0, 200));

  let parsedEval;
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) parsedEval = JSON.parse(jsonMatch[0]);
  } catch {}

  return parsedEval || content;
};

// Controller function for handling the Gemini API call
export const callgeminiapi = async (req, res) => {
  const audioFile = req.file;
  try {
    const { question, modelAnswer, transcript: clientTranscript } = req.body;

    console.log("[viva/send-to-gemini] request", {
      hasQuestion: typeof question === "string" && question.trim().length > 0,
      hasClientTranscript: typeof clientTranscript === "string" && clientTranscript.trim().length > 0,
      clientTranscriptLength: String(clientTranscript || "").length,
      hasAudioFile: !!audioFile,
      audioSize: audioFile?.size || 0,
    });

    let userTranscript = "";

    // If the frontend already captured a transcript via Web Speech API, use it directly
    if (clientTranscript && clientTranscript.trim().length > 2) {
      userTranscript = clientTranscript.trim();
      console.log("[viva/send-to-gemini] using client transcript:", userTranscript.slice(0, 200));
    } else if (audioFile && audioFile.size > 500) {
      // Fall back to Gemini audio transcription
      let audioMimeType = (audioFile.mimetype || "audio/webm").split(";")[0];
      // Detect WAV from filename if mimetype is generic
      if (audioFile.originalname && audioFile.originalname.endsWith('.wav')) {
        audioMimeType = "audio/wav";
      }
      console.log("[viva/send-to-gemini] using audio file:", {
        originalname: audioFile.originalname,
        mimetype: audioMimeType,
        size: audioFile.size,
      });

      const audioData = fs.readFileSync(audioFile.path, { encoding: "base64" });

      try {
        const transcriptResponse = await model.generateContent([
          "Transcribe the following audio file into text. If you cannot hear any speech, respond with exactly: NO_SPEECH_DETECTED",
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioData,
            },
          },
        ]);

        userTranscript = transcriptResponse.response.text();
        console.log("[viva/send-to-gemini] gemini transcript:", userTranscript.slice(0, 200));

        if (userTranscript.includes("NO_SPEECH_DETECTED") || userTranscript.toLowerCase().includes("no discernible speech") || userTranscript.toLowerCase().includes("no audio")) {
          userTranscript = "";
        }
      } catch (transcriptError) {
        console.error("[viva/send-to-gemini] transcript error:", transcriptError?.message);
      }
    }

    if (!userTranscript || userTranscript.trim().length < 3) {
      console.log("[viva/send-to-gemini] no transcript available, returning low score");
      return res.json({
        transcript: "(No speech detected - please ensure your microphone is working and speak clearly)",
        evaluation: {
          Relevance: 0,
          Completeness: 0,
          Accuracy: 0,
          DepthOfKnowledge: 0,
          TotalAverageScore: 0,
          rawText: "No speech was detected. Please check your microphone settings and try speaking louder."
        },
      });
    }

    // Evaluate the transcript — try Gemini first, fall back to Groq
    let evaluationResult = null;
    let usedProvider = "gemini";

    try {
      const prompt = `
        You are a human scoring assistant. Evaluate the user's answer based on the following parameters.
        Return ONLY valid JSON with this exact format (no markdown, no code blocks):
        {"Relevance": X, "Completeness": X, "Accuracy": X, "DepthOfKnowledge": X, "TotalAverageScore": X}
        where X is a number from 0 to 10.

        Question: ${question}
        Model Answer: ${modelAnswer}
        User Answer: ${userTranscript}
      `;

      const evaluationResponse = await model.generateContent([prompt]);
      let rawResult = evaluationResponse.response.text();
      console.log("[viva/send-to-gemini] gemini evaluation:", rawResult.slice(0, 200));

      let parsedEval;
      try {
        const jsonMatch = rawResult.match(/\{[\s\S]*?\}/);
        if (jsonMatch) parsedEval = JSON.parse(jsonMatch[0]);
      } catch {}

      evaluationResult = parsedEval || rawResult;
    } catch (geminiError) {
      console.warn("[viva/send-to-gemini] Gemini failed, switching to Groq backup:", geminiError?.message);
      usedProvider = "groq";

      try {
        evaluationResult = await evaluateWithGroq(question, modelAnswer, userTranscript);
      } catch (groqError) {
        console.error("[viva/send-to-gemini] Groq also failed:", groqError?.message);
        // Return a graceful response instead of crashing
        return res.json({
          transcript: userTranscript,
          evaluation: {
            Relevance: 5,
            Completeness: 5,
            Accuracy: 5,
            DepthOfKnowledge: 5,
            TotalAverageScore: 5,
            rawText: "Evaluation service temporarily unavailable. Default score assigned."
          },
        });
      }
    }

    console.log("[viva/send-to-gemini] final evaluation via:", usedProvider);

    res.json({
      transcript: userTranscript,
      evaluation: evaluationResult,
    });
  } catch (error) {
    console.error("[viva/send-to-gemini] error:", error?.message);
    // Even on critical error, return a valid response so the interview doesn't break
    res.json({
      transcript: "(Error processing answer)",
      evaluation: {
        Relevance: 0,
        Completeness: 0,
        Accuracy: 0,
        DepthOfKnowledge: 0,
        TotalAverageScore: 0,
        rawText: `Error: ${error?.message || "Unknown error"}`
      },
    });
  } finally {
    try {
      if (audioFile?.path && fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded audio:", cleanupError);
    }
  }
};