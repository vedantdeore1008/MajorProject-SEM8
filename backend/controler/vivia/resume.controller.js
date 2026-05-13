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

Use only the information inferable from the resume skills/projects/experience.
Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"questions": [{"difficulty": "easy", "questionText": "...", "answer": "..."}, ...]}`;

const parseAIQuestions = (rawText) => {
  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    else throw new Error("AI response was not valid JSON");
  }
  return normalizeQuestionSet(parsed?.questions || []);
};

const extractPdfText = async (resumePath) => {
  const pdfBuffer = fs.readFileSync(resumePath);
  const data = await pdfParse(pdfBuffer);
  return data.text || "";
};

const generateWithGemini = async (resumePath) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const pdfBytes = fs.readFileSync(resumePath);

  // Try with inline PDF first
  try {
    const result = await model.generateContent([
      RESUME_PROMPT,
      { inlineData: { mimeType: "application/pdf", data: pdfBytes.toString("base64") } },
    ]);
    return parseAIQuestions(String(result?.response?.text?.() || ""));
  } catch (pdfErr) {
    console.warn("[resume-questions] Gemini PDF inline failed, trying with extracted text:", pdfErr?.message);
  }

  // Fallback: extract text and send as plain text to Gemini
  const resumeText = await extractPdfText(resumePath);
  if (!resumeText || resumeText.trim().length < 30) {
    throw new Error("Could not extract text from resume for Gemini text fallback");
  }

  const result = await model.generateContent(
    `${RESUME_PROMPT}\n\n--- STUDENT RESUME ---\n${resumeText.substring(0, 5000)}\n--- END RESUME ---`
  );
  return parseAIQuestions(String(result?.response?.text?.() || ""));
};

const generateWithGroq = async (resumePath) => {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const resumeText = await extractPdfText(resumePath);
  if (!resumeText || resumeText.trim().length < 30) {
    throw new Error("Could not extract meaningful text from resume PDF");
  }

  // Send up to 4000 chars of actual resume text
  const resumeContent = resumeText.substring(0, 4000);
  console.log("[resume-questions] Extracted PDF text length:", resumeText.length, "| Sending:", resumeContent.length);

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "system",
        content: "You generate technical viva interview questions strictly based on the resume provided. Questions MUST relate to the skills, projects, technologies, and experience mentioned in the resume. Return ONLY valid JSON."
      }, {
        role: "user",
        content: `${RESUME_PROMPT}\n\n--- STUDENT RESUME ---\n${resumeContent}\n--- END RESUME ---`
      }],
      temperature: 0.3,
      max_tokens: 3000,
    },
    { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
  );

  const content = response.data?.choices?.[0]?.message?.content || "";
  return parseAIQuestions(content);
};

const generateThreeThreeThreeFromResume = async (resumePath) => {
  let lastError = null;

  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      const questions = await generateWithGemini(resumePath);
      const { valid } = validateThreeThreeThree(questions);
      if (valid) return questions;
      lastError = new Error("Gemini did not return valid 3/3/3 set");
    } catch (err) {
      console.warn("[resume-questions] Gemini failed:", err?.message);
      lastError = err;
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      console.log("[resume-questions] Trying Groq fallback...");
      const questions = await generateWithGroq(resumePath);
      const { valid } = validateThreeThreeThree(questions);
      if (valid) return questions;
      lastError = new Error("Groq did not return valid 3/3/3 set");
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
    const existingIndex = viva.resumeSubmissions.findIndex(
      (item) => String(item.studentId) === String(studentId)
    );

    const nextSubmission = {
      studentId: String(studentId),
      studentName: String(studentName || "").trim(),
      resumeUrl,
      resumeFileName: req.file.originalname,
      questionAnswerSet: [],
      preparedByTeacher: false,
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };

    // attempt to auto-generate AI draft questions immediately (non-blocking)
    try {
      const resumeFilePath = path.join(process.cwd(), resumeUrl.replace(/^\//, ""));
      if (fs.existsSync(resumeFilePath)) {
        const generated = await generateThreeThreeThreeFromResume(resumeFilePath);
        if (Array.isArray(generated) && generated.length === 9) {
          nextSubmission.questionAnswerSet = generated;
          nextSubmission.preparedByTeacher = false; // draft generated by AI
        }
      }
    } catch (aiErr) {
      console.error("AI draft generation failed (continuing):", aiErr?.message || aiErr);
    }

    if (existingIndex >= 0) {
      const oldResume = viva.resumeSubmissions[existingIndex]?.resumeUrl;
      const oldResumePath = oldResume ? path.join(process.cwd(), oldResume.replace(/^\//, "")) : "";
      viva.resumeSubmissions[existingIndex] = {
        ...viva.resumeSubmissions[existingIndex].toObject(),
        ...nextSubmission,
      };

      if (oldResumePath && fs.existsSync(oldResumePath)) {
        fs.unlinkSync(oldResumePath);
      }
    } else {
      viva.resumeSubmissions.push(nextSubmission);
    }

    await viva.save();

    return res.status(201).json({
      message: "Resume uploaded successfully",
      success: true,
      data: nextSubmission,
    });
  } catch (error) {
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
    const resumePath = path.join(process.cwd(), String(submission.resumeUrl || "").replace(/^\//, ""));

    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: "Resume file not found on server", success: false });
    }

    const questionAnswerSet = await generateThreeThreeThreeFromResume(resumePath);
    submission.questionAnswerSet = questionAnswerSet;
    submission.preparedByTeacher = false;
    submission.updatedAt = new Date();

    await viva.save();

    return res.status(200).json({
      success: true,
      message: "AI draft generated. Teacher can review and save.",
      data: submission,
    });
  } catch (error) {
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
