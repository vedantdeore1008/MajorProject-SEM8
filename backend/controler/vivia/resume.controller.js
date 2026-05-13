import fs from "fs";
import path from "path";
import { createRequire } from "module";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Viva from "../../model/viva.model.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const normalizeQuestionSet = (questionAnswerSet = []) => {
  return questionAnswerSet
    .map((item) => ({
      questionText: String(item?.questionText || "").trim(),
      answer: String(item?.answer || "").trim(),
      difficulty: ["easy", "medium", "hard"].includes(String(item?.difficulty || "").toLowerCase())
        ? String(item.difficulty).toLowerCase()
        : "medium",
    }))
    .filter((item) => item.questionText && item.answer);
};

const validateThreeThreeThree = (questionAnswerSet = []) => {
  const normalized = normalizeQuestionSet(questionAnswerSet);
  const counts = normalized.reduce(
    (acc, current) => {
      acc[current.difficulty] += 1;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  const valid = counts.easy === 3 && counts.medium === 3 && counts.hard === 3;
  return { valid, normalized, counts };
};

const buildResumeUrl = (filename) => `/uploads/${filename}`;

const RESUME_PROMPT = `You are preparing technical viva interview questions based on a student's resume.
Generate exactly 9 questions with model answers:
- 3 easy (basic concepts from their skills/technologies)
- 3 medium (applied knowledge from their projects/experience)
- 3 hard (deep technical questions about their work)

IMPORTANT: Questions MUST be directly related to the skills, projects, technologies, and experience mentioned in the resume below.
Return ONLY valid JSON in this exact format (no markdown, no code blocks, no explanation):
{"questions": [{"difficulty": "easy", "questionText": "...", "answer": "..."}, {"difficulty": "easy", "questionText": "...", "answer": "..."}, {"difficulty": "easy", "questionText": "...", "answer": "..."}, {"difficulty": "medium", "questionText": "...", "answer": "..."}, {"difficulty": "medium", "questionText": "...", "answer": "..."}, {"difficulty": "medium", "questionText": "...", "answer": "..."}, {"difficulty": "hard", "questionText": "...", "answer": "..."}, {"difficulty": "hard", "questionText": "...", "answer": "..."}, {"difficulty": "hard", "questionText": "...", "answer": "..."}]}`;

const parseAIQuestions = (rawText) => {
  let cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error("AI response was not valid JSON: " + cleaned.substring(0, 200));
  }
  return normalizeQuestionSet(parsed?.questions || []);
};

const extractPdfText = async (filePath) => {
  const pdfBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(pdfBuffer);
  return (data.text || "").trim();
};

// Generate questions from resume TEXT (not file path - works even after file is deleted)
const generateQuestionsFromText = async (resumeText) => {
  if (!resumeText || resumeText.length < 30) {
    throw new Error("Resume text is too short or empty to generate questions");
  }

  const textToUse = resumeText.substring(0, 5000);
  let lastError = null;

  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      console.log("[resume-questions] Trying Gemini with text...");
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(
        `${RESUME_PROMPT}\n\n--- STUDENT RESUME CONTENT ---\n${textToUse}\n--- END RESUME ---`
      );
      const questions = parseAIQuestions(String(result?.response?.text?.() || ""));
      const { valid } = validateThreeThreeThree(questions);
      if (valid) {
        console.log("[resume-questions] Gemini generated 9 valid questions");
        return questions;
      }
      lastError = new Error("Gemini returned " + questions.length + " questions instead of 9");
    } catch (err) {
      console.warn("[resume-questions] Gemini failed:", err?.message);
      lastError = err;
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      console.log("[resume-questions] Trying Groq fallback with text...");
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "system",
            content: "You generate technical viva interview questions strictly based on the resume provided. Questions MUST directly relate to the skills, projects, technologies, and experience mentioned in the resume. Return ONLY valid JSON, nothing else."
          }, {
            role: "user",
            content: `${RESUME_PROMPT}\n\n--- STUDENT RESUME CONTENT ---\n${textToUse}\n--- END RESUME ---`
          }],
          temperature: 0.3,
          max_tokens: 3000,
        },
        { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
      );

      const content = response.data?.choices?.[0]?.message?.content || "";
      const questions = parseAIQuestions(content);
      const { valid } = validateThreeThreeThree(questions);
      if (valid) {
        console.log("[resume-questions] Groq generated 9 valid questions");
        return questions;
      }
      lastError = new Error("Groq returned " + questions.length + " questions instead of 9");
    } catch (err) {
      console.error("[resume-questions] Groq also failed:", err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error("No AI provider available for question generation");
};

export const uploadStudentResume = async (req, res) => {
  try {
    const { vivaid } = req.params;
    const { studentId, studentName } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF is required", success: false });
    }

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required", success: false });
    }

    const viva = await Viva.findById(vivaid);
    if (!viva) {
      return res.status(404).json({ message: "Viva not found", success: false });
    }

    const fileName = path.basename(req.file.path);
    const resumeUrl = buildResumeUrl(fileName);
    const resumeFilePath = req.file.path;

    // Extract text from PDF and store it permanently in DB
    let resumeText = "";
    try {
      resumeText = await extractPdfText(resumeFilePath);
      console.log("[resume-upload] Extracted text length:", resumeText.length);
    } catch (extractErr) {
      console.error("[resume-upload] PDF text extraction failed:", extractErr?.message);
    }

    const existingIndex = viva.resumeSubmissions.findIndex(
      (item) => String(item.studentId) === String(studentId)
    );

    const nextSubmission = {
      studentId: String(studentId),
      studentName: String(studentName || "").trim(),
      resumeUrl,
      resumeFileName: req.file.originalname,
      resumeText,
      questionAnswerSet: [],
      preparedByTeacher: false,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    // Auto-generate questions from the extracted resume text
    let generationError = null;
    if (resumeText && resumeText.length >= 30) {
      try {
        const generated = await generateQuestionsFromText(resumeText);
        if (Array.isArray(generated) && generated.length === 9) {
          nextSubmission.questionAnswerSet = generated;
          console.log("[resume-upload] Auto-generated 9 questions successfully");
        }
      } catch (aiErr) {
        generationError = aiErr?.message || "Unknown AI error";
        console.error("[resume-upload] AI question generation failed:", generationError);
      }
    } else {
      generationError = "Could not extract text from PDF (text too short or empty)";
    }

    if (existingIndex >= 0) {
      const oldResume = viva.resumeSubmissions[existingIndex]?.resumeUrl;
      const oldResumePath = oldResume ? path.join(process.cwd(), oldResume.replace(/^\//, "")) : "";
      viva.resumeSubmissions[existingIndex] = {
        ...viva.resumeSubmissions[existingIndex].toObject(),
        ...nextSubmission,
      };
      if (oldResumePath && fs.existsSync(oldResumePath)) {
        try { fs.unlinkSync(oldResumePath); } catch {}
      }
    } else {
      viva.resumeSubmissions.push(nextSubmission);
    }

    await viva.save();

    return res.status(201).json({
      message: nextSubmission.questionAnswerSet.length === 9
        ? "Resume uploaded and 9 questions generated from your resume!"
        : "Resume uploaded but question generation failed: " + (generationError || "unknown"),
      success: true,
      questionsGenerated: nextSubmission.questionAnswerSet.length,
      data: nextSubmission,
    });
  } catch (error) {
    console.error("[resume-upload] Fatal error:", error);
    return res.status(500).json({ message: error.message || "Server error", success: false });
  }
};

export const getVivaResumeSubmissions = async (req, res) => {
  try {
    const { vivaid } = req.params;
    const viva = await Viva.findById(vivaid);

    if (!viva) {
      return res.status(404).json({ message: "Viva not found", success: false });
    }

    return res.status(200).json({
      success: true,
      data: viva.resumeSubmissions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error", success: false });
  }
};

export const generateResumeQuestions = async (req, res) => {
  try {
    const { vivaid } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required", success: false });
    }

    const viva = await Viva.findById(vivaid);
    if (!viva) {
      return res.status(404).json({ message: "Viva not found", success: false });
    }

    const submissionIndex = viva.resumeSubmissions.findIndex(
      (item) => String(item.studentId) === String(studentId)
    );

    if (submissionIndex < 0) {
      return res.status(404).json({ message: "Resume submission not found", success: false });
    }

    const submission = viva.resumeSubmissions[submissionIndex];

    // Use stored resumeText from DB (persists across Render deploys)
    let resumeText = submission.resumeText || "";

    // If no stored text, try reading from filesystem as fallback
    if (!resumeText || resumeText.length < 30) {
      const resumePath = path.join(process.cwd(), String(submission.resumeUrl || "").replace(/^\//, ""));
      if (fs.existsSync(resumePath)) {
        try {
          resumeText = await extractPdfText(resumePath);
          submission.resumeText = resumeText;
        } catch {}
      }
    }

    if (!resumeText || resumeText.length < 30) {
      return res.status(400).json({
        message: "Cannot generate questions - resume text not available. Please re-upload the resume.",
        success: false,
      });
    }

    const questionAnswerSet = await generateQuestionsFromText(resumeText);
    submission.questionAnswerSet = questionAnswerSet;
    submission.preparedByTeacher = false;
    submission.updatedAt = new Date();

    await viva.save();

    return res.status(200).json({
      success: true,
      message: "AI generated 9 questions from resume successfully!",
      questionsGenerated: questionAnswerSet.length,
      data: submission,
    });
  } catch (error) {
    console.error("[generate-resume-questions] Error:", error);
    return res.status(500).json({ message: error.message || "Failed to generate questions", success: false });
  }
};

export const saveResumeQuestions = async (req, res) => {
  try {
    const { vivaid } = req.params;
    const { studentId, questionAnswerSet } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required", success: false });
    }

    const validation = validateThreeThreeThree(questionAnswerSet);
    if (!validation.valid) {
      return res.status(400).json({
        message: `Provide exactly 3 easy, 3 medium, 3 hard questions. Received easy=${validation.counts.easy}, medium=${validation.counts.medium}, hard=${validation.counts.hard}`,
        success: false,
      });
    }

    const viva = await Viva.findById(vivaid);
    if (!viva) {
      return res.status(404).json({ message: "Viva not found", success: false });
    }

    const submission = viva.resumeSubmissions.find(
      (item) => String(item.studentId) === String(studentId)
    );

    if (!submission) {
      return res.status(404).json({ message: "Resume submission not found", success: false });
    }

    submission.questionAnswerSet = validation.normalized;
    submission.preparedByTeacher = true;
    submission.updatedAt = new Date();

    await viva.save();

    return res.status(200).json({
      success: true,
      message: "Teacher question set saved successfully",
      data: submission,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Server error", success: false });
  }
};
