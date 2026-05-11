import express from "express";
import multer from "multer";

import { createViva } from "../controler/vivia/createViva.js";
import { getallViva } from "../controler/vivia/showAllVIva.js";
import { updateViva } from "../controler/vivia/updateViva.js";
import { deleteViva } from "../controler/vivia/deleteViva.js";
import { getOneViva } from "../controler/vivia/getOneViva.js";
import { callgeminiapi } from "../controler/vivia/callgeminapi.js";
import {
	generateResumeQuestions,
	getVivaResumeSubmissions,
	saveResumeQuestions,
	uploadStudentResume,
} from "../controler/vivia/resume.controller.js";
// for crete viva
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Configure multer for file uploads
const resumeUpload = multer({
	dest: "uploads/",
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "application/pdf") {
			cb(null, true);
			return;
		}
		cb(new Error("Only PDF resumes are allowed"));
	},
});
router.post("/createViva",createViva);
router.get("/getallViva/:classid",getallViva);
router.get("/getOneViva/:vivaid",getOneViva);
router.put("/updateViva/:vivaid",updateViva);
router.delete("/deleteViva/:vivaid",deleteViva);
router.post("/upload-resume/:vivaid", resumeUpload.single("resume"), uploadStudentResume);
router.get("/resumes/:vivaid", getVivaResumeSubmissions);
router.post("/generate-resume-questions/:vivaid", generateResumeQuestions);
router.post("/save-resume-questions/:vivaid", saveResumeQuestions);
// gemini api call 
router.post("/send-to-gemini", upload.single("audio"), callgeminiapi);

export default router;