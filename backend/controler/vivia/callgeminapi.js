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
  process.exit(1); // Exit the process if the API key is missing
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Controller function for handling the Gemini API call
export const callgeminiapi = async (req, res) => {
  const audioFile = req.file; // Uploaded audio file
  try {
    const { question, modelAnswer } = req.body;

    // Check if the audio file is present
    if (!audioFile) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioMimeType = (audioFile.mimetype || "audio/webm").split(";")[0];

    console.log("[viva/send-to-gemini] request", {
      hasQuestion: typeof question === "string" && question.trim().length > 0,
      questionChars: String(question || "").length,
      modelAnswerChars: String(modelAnswer || "").length,
      file: {
        originalname: audioFile.originalname,
        mimetype: audioFile.mimetype,
        size: audioFile.size,
      },
    });

    // Step 1: Read the audio file as base64
    const audioData = fs.readFileSync(audioFile.path, { encoding: "base64" });

    const transcriptPrompt = "Convert the following audio file into a transcript:";
    let userTranscript = "";

    try {
      // Step 2: Generate a transcript from the audio file
      const transcriptResponse = await model.generateContent([
        transcriptPrompt,
        {
          inlineData: {
            mimeType: audioMimeType,
            data: audioData, // Base64-encoded audio file
          },
        },
      ]);

      userTranscript = transcriptResponse.response.text();

      console.log("[viva/send-to-gemini] transcript", {
        chars: String(userTranscript || "").length,
        preview: String(userTranscript || "").slice(0, 200),
      });
    } catch (transcriptError) {
      console.error("[viva/send-to-gemini] transcript error", {
        message: transcriptError?.message,
      });
      throw transcriptError;
    }

    // Step 3: Evaluate the transcript using the custom prompt
    const prompt = `
      You are a human scoring assistant. Evaluate the user's audio file transcript based on the following parameters:
      - Relevance (out of 10)
      - Completeness (out of 10)
      - Accuracy (out of 10)
      - Depth of Knowledge (out of 10)
      Also, calculate the total average score out of 10 as the final output.

      Model Answer: ${modelAnswer}
      User Answer: ${userTranscript}
    `;

    const evaluationResponse = await model.generateContent([prompt]);
    const evaluationResult = evaluationResponse.response.text();

    console.log("[viva/send-to-gemini] evaluation", {
      chars: String(evaluationResult || "").length,
      preview: String(evaluationResult || "").slice(0, 160),
    });

    // Step 4: Send the evaluation result back to the client
    res.json({
      transcript: userTranscript,
      evaluation: evaluationResult,
    });
  } catch (error) {
    console.error("[viva/send-to-gemini] error", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(500).json({
      error: "Failed to fetch response from Gemini API",
      details: error?.message,
    });
  } finally {
    // Always attempt cleanup of uploaded file
    try {
      if (audioFile?.path && fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup uploaded audio:", cleanupError);
    }
  }
};