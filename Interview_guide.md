# AI-Powered LMS — Complete Interview-Ready Technical Document

---

## 1. One-line elevator pitch

An AI-powered Learning Management System that automates written and viva assessments through OCR, RAG-based evaluation, voice-cloned interviews, and YOLOv8 proctoring—delivering instant, curriculum-grounded feedback at scale while ensuring academic integrity.

---

## 2. 30–45 second verbal opener

I built an AI-enhanced Learning Management System that transforms traditional classroom assessment workflows. Teachers create classes, upload curriculum notes, and publish assignments or viva sessions. Students submit PDF answers or participate in voice-based viva interviews. The system uses OCR to extract text from submissions, retrieves relevant context from teacher notes using a RAG pipeline with vector embeddings stored in ChromaDB, and employs Gemini 1.5 Flash to score responses against a detailed rubric covering language quality, logical reasoning, critical thinking, and factual accuracy. For viva sessions, I implemented voice cloning using LMNT TTS to generate realistic teacher-like questions, React Speech Recognition to capture student responses, and YOLOv8-based proctoring to detect cheating behaviors like multiple faces or phone usage. The architecture is MERN stack with a dedicated Flask microservice handling all AI workloads, ensuring the Node backend remains responsive while AI processing scales independently. All results, feedback, transcripts, and integrity flags are stored in MongoDB with comprehensive dashboards for both teachers and students.

**Key interview talking point:**  
"We separated AI processing into a Flask microservice to keep the Node backend fast and scalable, grounded all evaluations in teacher notes via RAG to eliminate hallucinations, and added realistic viva experiences with voice cloning and automated proctoring."

---

## 3. Tech stack

### **React (Frontend)**
**Why chosen:** React provides a mature component ecosystem, excellent state management through Redux, fast virtual DOM rendering for complex dashboards, and seamless integration with Material-UI for polished educational interfaces. The single-page application model ensures smooth navigation between classrooms, assignments, and live viva sessions without page reloads.

**Why NOT Angular:** Angular has a steeper learning curve, heavier bundle sizes, and unnecessary complexity for our use case. Vue was considered but has a smaller ecosystem for enterprise-grade authentication and real-time features.

### **Node.js + Express.js (Backend)**
**Why chosen:** Node.js provides non-blocking I/O perfect for handling concurrent PDF uploads, WebSocket connections for live viva sessions, and fan-out API calls to the Flask AI microservice. Express offers minimal, flexible routing with robust middleware support for authentication, validation, and error handling.

**Why NOT Django/FastAPI:** Django and FastAPI are Python-centric and would require rewriting the entire backend logic. Since our frontend is JavaScript-based and MongoDB integrates naturally with Node, a Python backend would introduce unnecessary language context-switching and complicate the development workflow. We isolated Python to the AI microservice only.

### **MongoDB**
**Why chosen:** MongoDB's flexible document schema perfectly fits our evolving data model where submissions contain nested feedback arrays, viva reports include variable-length transcripts, and RAG chunks store vector embeddings alongside metadata. The JSON-like document structure aligns naturally with JavaScript objects, and indexing strategies on `classroomId`, `assignmentId`, and `studentId` enable fast queries.

**Why NOT PostgreSQL:** PostgreSQL requires rigid schema migrations for every data model change. Our submission feedback structure evolved multiple times during development (adding plagiarism scores, rubric breakdowns, proctoring events), which would have required frequent migrations. MongoDB's schema-less design accelerated iteration.

### **Flask (AI Microservice)**
**Why chosen:** Flask is lightweight, Python-native, and integrates seamlessly with AI/ML libraries like LangChain, ChromaDB, OpenCV (YOLOv8), and Google Generative AI. It acts as a dedicated AI processing layer, isolating heavy compute workloads from the Node backend and enabling independent scaling.

**Why NOT FastAPI:** FastAPI offers better async performance, but Flask's simpler synchronous model was sufficient for our batch-oriented AI tasks. Flask's extensive community support and battle-tested ecosystem made integration faster. We can migrate to FastAPI later if async throughput becomes a bottleneck.

### **ChromaDB (RAG Vector Database)**
**Why chosen:** ChromaDB provides an embedded-friendly, Python-native vector database with simple APIs for storing and retrieving embeddings. It requires minimal setup, supports metadata filtering, and handles similarity search efficiently for our RAG pipeline where teacher notes are chunked, embedded, and retrieved during evaluation.

**Why NOT FAISS/Pinecone:** FAISS requires custom persistence and indexing logic, adding development overhead. Pinecone is cloud-hosted, introducing latency and subscription costs. ChromaDB offers local-first storage with production-ready persistence, making it ideal for rapid prototyping and deployment.

### **GOTOCR**
**Why chosen:** GOTOCR is a specialized OCR engine optimized for structured documents like PDFs and scanned answer sheets. It outperforms generic LLM-based OCR (which can hallucinate text) and provides more predictable, cost-stable results compared to cloud-based OCR APIs.

**Why NOT Tesseract/LLM OCR:** Tesseract requires extensive tuning for different document types and struggles with low-quality scans. LLM-based OCR (feeding images directly to Gemini/GPT-4 Vision) is slower, more expensive, and prone to hallucinating non-existent text. GOTOCR strikes the right balance of accuracy and cost.

### **Gemini 1.5 Flash LLM**
**Why chosen:** Gemini 1.5 Flash offers fast inference, strong reasoning capabilities, and cost-effective pricing for educational evaluation tasks. It handles rubric-based scoring, generates detailed feedback, and supports tool-use features for structured outputs. The 1M token context window allows processing long documents without chunking.

**Why NOT GPT-4/Local LLMs:** GPT-4 provides superior reasoning but is significantly more expensive and slower, making it impractical for evaluating hundreds of submissions. Local LLMs (LLaMA, Mistral) require GPU infrastructure and lack the nuanced reasoning needed for grading complex answers. Gemini Flash balances speed, cost, and quality.

### **Eden AI Content Detector**
**Why chosen:** Eden AI aggregates multiple AI-content detection models (GPTZero, Originality.AI, etc.) and provides a normalized risk score. This multi-model approach reduces false positives compared to single-vendor detectors and offers robust plagiarism flagging across different writing styles.

**Why NOT GPTZero alone:** Single detectors have higher false-positive rates and can be gamed by students using paraphrasing tools. Eden AI's ensemble approach provides more reliable detection with detailed confidence breakdowns.

### **LMNT TTS (Voice Cloning)**
**Why chosen:** LMNT TTS delivers high-fidelity voice cloning with controllable speech parameters (speed, tone, emphasis). Teachers upload a 5-minute audio sample, and LMNT generates a realistic voice profile used for viva questions. The API is stable, offers low latency, and handles educational content naturally.

**Why NOT ElevenLabs/Azure TTS:** ElevenLabs is excellent but more expensive and has stricter licensing for educational use. Azure TTS lacks the same voice cloning quality and requires more setup. LMNT struck the best balance for our use case.

### **YOLOv8 (Proctoring)**
**Why chosen:** YOLOv8 is a state-of-the-art real-time object detection model that accurately identifies phones, multiple faces, and other proctoring violations. It runs efficiently on CPU or GPU, provides bounding box coordinates, and has pre-trained weights for common objects.

**Why NOT OpenCV Haar Cascades/MediaPipe:** Haar Cascades are outdated and miss modern edge cases (phones at angles, partially visible faces). MediaPipe focuses on pose estimation and lacks robust object detection. YOLOv8 provides modern accuracy with minimal integration effort.

### **React Speech Recognition**
**Why chosen:** React Speech Recognition provides a simple browser-based API wrapper around the Web Speech API, enabling real-time transcription of student viva responses without requiring server-side STT infrastructure. It works across modern browsers and reduces latency.

**Why NOT Google Cloud STT/Whisper:** Cloud-based STT adds latency and costs. Whisper (OpenAI) requires server-side processing and model hosting. Browser-native speech recognition keeps the viva workflow lightweight and responsive.

### **JWT Authentication**
**Why chosen:** JSON Web Tokens enable stateless authentication across our microservices architecture. The token contains user role (teacher/student) and is verified by both Node and Flask services. JWTs scale horizontally without session storage and support role-based access control (RBAC).

**Why NOT Session Cookies/OAuth:** Session-based auth requires centralized session stores (Redis) and doesn't scale well across Node + Flask boundaries. OAuth is overkill for our use case and adds unnecessary complexity. JWTs provide the right balance of security and simplicity.

---

## 4. User-visible features (with mini explanations)

### **Classroom creation**
Teachers create virtual classrooms, assign subjects, and upload curriculum notes (PDFs, documents). Students join using unique class codes. The system automatically generates embeddings from uploaded notes and stores them in ChromaDB for future RAG-based evaluations.

### **Assignment posting & submission**
Teachers publish assignments with due dates, rubric criteria, and reference notes. Students upload PDF answer sheets, which trigger the automated evaluation pipeline. The system handles concurrent submissions and provides real-time status updates.

### **Automated PDF assessment evaluation (RAG + OCR + LLM)**
When a student submits a PDF, the system extracts text via GOTOCR, queries ChromaDB for relevant teacher notes, and uses Gemini 1.5 Flash to score each answer against a rubric covering clarity, logic, evidence, and language. Feedback is structured per question with specific improvement suggestions.

### **Plagiarism/AI-content detection**
Every submission is analyzed by Eden AI's content detector, which returns a risk score (0.0–1.0) indicating the likelihood of AI-generated or plagiarized content. Scores above a threshold (e.g., 0.7) flag the submission for teacher review with detailed rationale.

### **Personalized feedback generation**
Beyond scores, the LLM generates actionable feedback tailored to each student's answer. Feedback highlights strengths, identifies gaps in reasoning, and suggests specific concepts to review from the teacher's notes—mimicking a teacher's personalized guidance.

### **AI-powered viva with teacher voice cloning**
Teachers upload a short audio sample (5 minutes), and LMNT TTS creates a realistic voice clone. During viva sessions, this cloned voice asks questions generated from teacher notes. Students hear their teacher's voice, creating an authentic oral examination experience.

### **YOLOv8-based proctoring**
During viva sessions, the student's webcam feed is analyzed frame-by-frame using YOLOv8. The system detects multiple faces (suggesting proxy test-takers), phones (potential cheating), and suspicious movements. Violations are logged with timestamps but don't interrupt the session, allowing teachers to review afterward.

### **Real-time transcript + viva scoring**
React Speech Recognition captures student responses and sends them to the Flask AI service. The LLM evaluates responses against the same rubric used for written assessments, providing instant scores and feedback. The full transcript, including questions, answers, scores, and proctoring events, is stored in MongoDB.

### **AI quiz generator, mindmaps, & 3D classrooms**
The system offers additional AI-powered tools: automatic quiz generation from uploaded notes, mindmap visualization of topics, and 3D virtual classroom environments for immersive learning. These features enhance engagement and provide diverse learning modalities.

### **Teacher dashboard & student dashboard**
Teachers access analytics showing class performance trends, individual student progress, flagged submissions, and proctoring violations. Students see their scores, detailed feedback, improvement suggestions, and performance over time. Dashboards are interactive with charts, filters, and export options.

---

## 5. High-level architecture (Markdown diagram + explanation)

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                   React SPA (Port 5173)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Material-UI components                                  │  │
│  │ • Redux state management                                  │  │
│  │ • React Speech Recognition (viva microphone capture)     │  │
│  │ • Webcam feed (proctoring)                               │  │
│  │ • Dashboard charts & analytics                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────┬───────────┘
             │ HTTP REST + WebSocket (Socket.io)      │
             ↓                                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER (Node.js)                    │
│                   Express.js (Port 4000)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes: /user, /class, /assignment, /viva, /quiz         │  │
│  │ Middleware: JWT auth, file upload (Multer), CORS         │  │
│  │ Controllers: Orchestrate AI calls & database operations  │  │
│  │ Socket.io: Real-time notifications & viva events         │  │
│  └──────────────────────────────────────────────────────────┘  │
└───┬────────────────────────────────┬────────────────────────┬───┘
    │ Mongoose ODM                   │ HTTP POST              │
    ↓                                ↓                        │
┌─────────────────┐     ┌──────────────────────────────────┐ │
│   MongoDB       │     │  FLASK AI MICROSERVICE           │ │
│   Database      │     │     (Port 5000)                  │ │
│  ┌───────────┐  │     │  ┌────────────────────────────┐ │ │
│  │ users     │  │     │  │ • GOTOCR (PDF extraction)  │ │ │
│  │ classes   │  │     │  │ • ChromaDB (RAG retrieval) │ │ │
│  │ assigns   │  │     │  │ • Gemini API (evaluation)  │ │ │
│  │ submits   │  │     │  │ • Eden AI (plagiarism)     │ │ │
│  │ vivas     │  │     │  │ • LMNT TTS (voice clone)   │ │ │
│  │ reports   │  │     │  │ • YOLOv8 (proctoring)      │ │ │
│  └───────────┘  │     │  └────────────────────────────┘ │ │
└─────────────────┘     └──────────────┬───────────────────┘ │
                                       │                      │
                                       ↓                      │
                        ┌────────────────────────────┐        │
                        │      ChromaDB              │        │
                        │  (Vector Embeddings)       │        │
                        │  • Teacher notes chunks    │        │
                        │  • Similarity search       │        │
                        └────────────────────────────┘        │
                                                               │
                        External APIs ←────────────────────────┘
                        • Google Gemini 1.5 Flash
                        • Eden AI Content Detector
                        • LMNT TTS API
                        • YouTube Data API
```

### **Communication Flow Explanation**

#### **React ↔ Node/Express**
The React frontend makes REST API calls to the Node backend for all user actions (login, create class, submit assignment, start viva). File uploads (PDFs, audio samples) use multipart/form-data and are handled by Multer middleware. Real-time features like live viva updates and notifications use Socket.io WebSocket connections.

#### **Node/Express ↔ MongoDB**
Node uses Mongoose ODM to interact with MongoDB. All user authentication, classroom data, assignments, submissions, viva transcripts, and proctoring logs are stored as JSON documents. Mongoose schemas define validation rules and relationships (e.g., `assignmentId` references an assignment document).

#### **Node/Express ↔ Flask AI Microservice**
When AI processing is needed (evaluate submission, generate viva questions, detect plagiarism), Node makes HTTP POST requests to Flask endpoints (`/get_student_score`, `/generate-feedback`, `/recommend-videos`, etc.). Node includes the JWT token in headers so Flask can verify authorization. Flask processes the request and returns JSON responses with scores, feedback, or proctoring events.

#### **Flask ↔ ChromaDB ↔ LLM APIs**
When teacher notes are uploaded, Flask chunks the text, generates embeddings using Google Generative AI Embeddings, and stores them in ChromaDB with metadata (source file, page number). During evaluation, Flask performs similarity search in ChromaDB to retrieve relevant chunks, then sends these chunks + student answer + rubric to Gemini 1.5 Flash for scoring and feedback generation.

#### **Viva Flow: Browser Microphone → React Speech Recognition → Node → Flask**
1. Student clicks "Start Viva" in React.
2. React Speech Recognition captures audio and transcribes it to text in real-time.
3. Transcribed text is sent via WebSocket (Socket.io) to Node.
4. Node batches questions and responses, then sends them to Flask for evaluation.
5. Flask uses RAG to retrieve context, generates follow-up questions using the voice-cloned profile, and scores responses.
6. Results are returned to Node, stored in MongoDB, and pushed to React via WebSocket.

#### **JWT Authentication Flow**
1. User logs in via React → Node `/user/login` endpoint.
2. Node verifies credentials (bcrypt password hash), generates a JWT containing `userId` and `role` (teacher/student), and returns it to React.
3. React stores JWT in localStorage and includes it in the `Authorization: Bearer <token>` header for all subsequent requests.
4. Node middleware verifies JWT signature and extracts user info for route-level authorization.
5. When Node calls Flask, it includes the JWT so Flask can verify the request is authorized.

#### **Proctoring Pipeline: Camera → React → Flask → YOLOv8**
1. During viva, React captures webcam frames (1 frame per second).
2. Frames are base64-encoded and sent to Node, which forwards them to Flask `/api/capture-face`.
3. Flask decodes frames, runs YOLOv8 inference to detect objects (phone, person).
4. Detection results (bounding boxes, labels, confidence scores) are logged with timestamps.
5. Violations (multiple faces, phone detected) are stored in MongoDB under the viva report's `proctoring` field.
6. Teachers review proctoring events post-viva via the dashboard.

---

## 6. Detailed data flow (end-to-end)

### **(A) Written Assessment Flow**

#### **Step 1: Teacher uploads curriculum notes**
- **Action:** Teacher navigates to a classroom and uploads PDF notes via React.
- **React → Node:** Multipart POST to `/upload` with PDF file.
- **Node:** Saves PDF to `/uploads` directory, stores file path in MongoDB under `classrooms.notes[]`.
- **Node → Flask:** POST to `/upload` with file path.
- **Flask:** Extracts text using `extract_text_from_pdf()`, chunks text (500–1000 tokens with 50-token overlap), generates embeddings via Google Generative AI, stores in ChromaDB with metadata (`notesId`, `chunkId`, `source`).
- **Flask → Node:** Returns success confirmation.
- **Node → React:** Updates UI to show "Notes uploaded & embedded."

#### **Step 2: Teacher creates assignment**
- **Action:** Teacher fills assignment form (title, due date, rubric weights, reference notes).
- **React → Node:** POST to `/assignment/create` with assignment data.
- **Node:** Creates new document in `assignments` collection with `classId`, `title`, `dueDate`, `rubric`, `ragNotesId` (references the ChromaDB notes).
- **Node → React:** Returns assignment ID and success message.

#### **Step 3: Student submits PDF answer sheet**
- **Action:** Student uploads PDF via the assignment submission page.
- **React → Node:** Multipart POST to `/assignment/submit` with `assignmentId`, `studentId`, PDF file.
- **Node:** Saves PDF to `/uploads`, creates `submissions` document with `fileUrl`, status "processing."
- **Node → React:** Returns "Submission received, evaluating…" with loading indicator.

#### **Step 4: Node triggers AI evaluation**
- **Node → Flask:** POST to `/get_student_score` with:
  ```json
  {
    "answersheet": "<PDF binary>",
    "question_paper": "<reference PDF binary>",
    "assignmentId": "...",
    "studentId": "..."
  }
  ```

#### **Step 5: Flask AI pipeline execution**
- **OCR Phase:**
  - Flask calls `process_pdf()` on both answer sheet and question paper.
  - Tries `pdf2image` + OCR first; falls back to PyMuPDF if unavailable.
  - Extracts text: `answer_text = "Q1: Photosynthesis is... Q2: Mitochondria are..."`.
  - Splits text by question markers (`Q1`, `Q2`, etc.) using `process_questions()`.

- **RAG Phase:**
  - For each question, Flask queries ChromaDB: `get_chroma_context(question, k=3)`.
  - Retrieves top 3 relevant chunks from teacher notes.
  - Example retrieval: `["Photosynthesis involves light reactions...", "Calvin cycle produces glucose...", "Chloroplasts are organelles..."]`.

- **LLM Evaluation Phase:**
  - For each question-answer pair, Flask constructs prompt:
    ```
    Evaluate the student's answer strictly based on the provided context and rubric.
    
    Question: {question}
    Student Answer: {answer}
    Context: {retrieved_chunks}
    
    Rubric:
    - Clarity (0-10): Is the answer clear and well-structured?
    - Logic (0-10): Is the reasoning sound?
    - Evidence (0-10): Are facts from context used correctly?
    - Language (0-10): Grammar, spelling, coherence.
    
    Return JSON: {"score": X, "feedback": "..."}
    ```
  - Gemini 1.5 Flash returns:
    ```json
    {
      "score": 8.5,
      "feedback": "Good understanding of light reactions. However, you missed mentioning the Calvin cycle's role in glucose production. Review the section on carbon fixation."
    }
    ```

- **Plagiarism Detection Phase:**
  - Flask sends full answer text to Eden AI Content Detector.
  - Eden returns: `{"riskScore": 0.35, "flags": ["low AI probability"]}`.

- **Aggregation:**
  - Flask compiles results for all questions: `[{questionNo: 1, score: 8.5, feedback: "..."}, ...]`.
  - Calculates total score: `sum(scores) / len(questions) * 10`.
  - Returns to Node:
    ```json
    {
      "total_score": 78.5,
      "max_total_score": 100,
      "percentage_score": 78.5,
      "results": [...],
      "plagiarism": {"riskScore": 0.35, "flags": [...]}
    }
    ```

#### **Step 6: Node stores results & updates UI**
- **Node:** Updates `submissions` document with `evaluation`, `plagiarism`, status "completed".
- **Node → React (via Socket.io):** Emits `evaluationComplete` event.
- **React:** Refreshes dashboard, shows scores, per-question feedback, and plagiarism flags.
- **Teacher view:** Dashboard shows aggregated class performance, flagged submissions.

#### **Fallback Handling & Resilience:**
- **OCR Failure:** If `process_pdf()` returns "No text extracted," Node marks submission as "OCR failed" and notifies student to re-upload a clearer PDF.
- **ChromaDB Empty:** If no notes are embedded, Flask falls back to evaluating based on the question text alone (less accurate, but doesn't crash).
- **LLM Timeout:** Flask sets a 30-second timeout on Gemini API calls. If exceeded, retries once, then returns partial results with a warning.
- **Microservice Unreachable:** If Flask is down, Node queues the evaluation job and retries every 5 minutes (max 3 retries).
- **Logging:** All steps log with request IDs: `[INFO] [req-abc123] OCR completed: 1234 chars extracted`.

---

### **(B) Viva Interview Flow**

#### **Step 1: Teacher uploads voice sample**
- **Action:** Teacher records and uploads 5-minute audio sample in classroom settings.
- **React → Node:** Multipart POST to `/class/upload-voice` with audio file.
- **Node:** Saves audio to `/uploads/voices`, creates `voiceProfiles` document with `teacherId`, `filePath`.
- **Node → Flask:** POST to `/generate_speech` test endpoint to verify voice sample quality.
- **Flask:** Calls LMNT TTS API to create voice profile: `POST https://api.lmnt.com/v1/voice/clone` with audio file.
- **LMNT:** Returns `voiceId: "xyz-teacher-voice-123"`.
- **Flask → Node:** Returns voice profile ID.
- **Node:** Updates `voiceProfiles` with `lmntVoiceId`, status "ready".

#### **Step 2: Teacher schedules viva session**
- **Action:** Teacher creates viva session with topic, duration, question count.
- **React → Node:** POST to `/viva/create` with `classId`, `topic`, `duration`, `numberOfQuestions`, `ragNotesId`.
- **Node:** Creates `vivaSessions` document, status "scheduled".
- **Node → Flask:** POST to `/generate-viva-questions` with `ragNotesId`, `numberOfQuestions`.
- **Flask:** Queries ChromaDB for topic-relevant chunks, uses Gemini to generate questions:
  ```
  Generate 5 oral examination questions based on the following notes. Questions should be open-ended and test understanding.
  
  Notes: {retrieved_chunks}
  
  Return JSON array: [{"question": "...", "expectedPoints": [...]}, ...]
  ```
- **Flask → Node:** Returns generated questions.
- **Node:** Updates `vivaSessions` with `questions[]`, status "ready".

#### **Step 3: Student starts viva**
- **Action:** Student clicks "Start Viva" in React.
- **React:** Requests microphone and webcam permissions, initializes React Speech Recognition.
- **React → Node (WebSocket):** Emits `vivaStart` event with `vivaId`, `studentId`.
- **Node:** Creates `vivaReports` document with `transcript: []`, `proctoring: {events: []}`, status "in-progress".
- **Node → Flask:** POST to `/generate_speech` with first question text + voice profile ID.
- **Flask → LMNT:** POST to generate audio bytes.
- **LMNT → Flask:** Returns base64-encoded MP3.
- **Flask → Node → React:** Sends audio data.
- **React:** Plays audio via HTML5 `<audio>` element—student hears teacher's cloned voice asking question.

#### **Step 4: Student responds**
- **Action:** Student speaks answer into microphone.
- **React Speech Recognition:** Transcribes audio to text in real-time: `"Photosynthesis is the process by which plants convert light energy into chemical energy..."`.
- **React → Node (WebSocket):** Streams text chunks as student speaks.
- **Node:** Buffers text, detects end of answer (2-second pause or explicit "Next Question" button click).

#### **Step 5: Concurrent proctoring**
- **React:** Captures webcam frames (1 FPS), base64-encodes them.
- **React → Node → Flask:** POST to `/api/capture-face` with image data.
- **Flask:** Decodes image, runs YOLOv8 inference:
  ```python
  results = yolo_model(image)
  detections = [{"label": "person", "confidence": 0.95, "bbox": [...]}, 
                {"label": "cell phone", "confidence": 0.87, "bbox": [...]}]
  ```
- **Flask:** Logs violations: If `cell phone` detected → `{"type": "phoneDetected", "timestamp": "...", "confidence": 0.87}`.
- **Flask → Node:** Returns proctoring events.
- **Node:** Appends events to `vivaReports.proctoring.events[]`.

#### **Step 6: Flask evaluates response**
- **Node → Flask:** POST to `/evaluate-viva-response` with:
  ```json
  {
    "question": "Explain photosynthesis.",
    "studentAnswer": "Photosynthesis is the process by which plants...",
    "ragNotesId": "...",
    "rubric": {"clarity": 10, "accuracy": 10, "depth": 10}
  }
  ```
- **Flask:** Retrieves relevant chunks from ChromaDB, prompts Gemini:
  ```
  Question: {question}
  Student Response: {studentAnswer}
  Context: {retrieved_chunks}
  
  Evaluate based on:
  - Clarity (0-10)
  - Accuracy (0-10): Are facts correct per context?
  - Depth (0-10): Does the student demonstrate deep understanding?
  
  Return JSON: {"scores": {...}, "feedback": "..."}
  ```
- **Gemini:** Returns:
  ```json
  {
    "scores": {"clarity": 9, "accuracy": 8, "depth": 7},
    "feedback": "Excellent clarity and mostly accurate. However, you could expand on the Calvin cycle's role in carbon fixation for deeper understanding."
  }
  ```
- **Flask → Node:** Returns evaluation result.

#### **Step 7: Iterative Q&A loop**
- **Node:** Generates next question using voice clone, repeats Steps 4–6.
- **Loop continues** for the configured number of questions or until time limit.

#### **Step 8: Viva completion & storage**
- **Action:** Student clicks "End Viva" or time expires.
- **React → Node (WebSocket):** Emits `vivaEnd` event.
- **Node:** Aggregates all scores, feedback, and proctoring events.
- **Node:** Updates `vivaReports`:
  ```json
  {
    "transcript": [
      {"question": "...", "answer": "...", "scores": {...}, "feedback": "..."},
      ...
    ],
    "overallScore": 82.5,
    "proctoring": {
      "multipleFaces": false,
      "phoneDetected": true,
      "events": [{"type": "phoneDetected", "timestamp": "..."}]
    },
    "status": "completed"
  }
  ```
- **Node → React (WebSocket):** Emits `vivaComplete` with final report.
- **React:** Displays viva transcript, scores, feedback, and proctoring flags.

#### **Fallback Handling & Resilience:**
- **Microphone Failure:** If speech recognition fails to initialize, React shows fallback text input field for typed answers.
- **Webcam Failure:** If camera access is denied, viva continues without proctoring; report notes "proctoring unavailable."
- **Speech Recognition Errors:** If transcription is garbled, React shows live transcript so student can correct via text edit before submission.
- **YOLO Misdetections:** False positives (e.g., detecting a textbook as a "phone") are logged but don't auto-fail the student. Teachers review events with screenshots.
- **Flask Timeout:** If Flask doesn't respond within 10 seconds, Node retries once, then logs partial results and notifies student of technical issues.
- **Voice Clone Latency:** If LMNT TTS is slow, Node shows "Generating question audio…" spinner to manage expectations.

---

## 7. Database schema (with JSON-like examples)

### **users**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439011')",
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@university.edu",
  "password": "$2b$10$hashed_password_here",
  "role": "teacher",
  "profilePic": "https://cdn.example.com/profiles/sarah.jpg",
  "createdAt": "2024-09-15T08:30:00Z",
  "updatedAt": "2024-12-11T10:15:00Z"
}
```
**Explanation:** Stores all user accounts (teachers and students). The `role` field enables role-based access control. Passwords are hashed using bcrypt. Indexed on `email` (unique) for fast login queries.

---

### **classrooms**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439012')",
  "name": "Advanced Biology 301",
  "subject": "Cellular Biology",
  "teacherId": "ObjectId('507f1f77bcf86cd799439011')",
  "studentIds": [
    "ObjectId('507f1f77bcf86cd799439020')",
    "ObjectId('507f1f77bcf86cd799439021')"
  ],
  "classCode": "BIO301-FALL24",
  "notes": [
    {
      "title": "Chapter 3: Photosynthesis",
      "url": "/uploads/notes/photosynthesis.pdf",
      "ragNotesId": "ObjectId('507f1f77bcf86cd799439030')"
    }
  ],
  "isPublic": false,
  "createdAt": "2024-09-01T00:00:00Z"
}
```
**Explanation:** Represents a virtual classroom. The `classCode` is a unique identifier students use to join. The `notes` array contains references to uploaded curriculum materials with associated RAG embeddings. Indexed on `classCode` (unique) and `teacherId` for fast teacher queries.

---

### **assignments**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439040')",
  "classId": "ObjectId('507f1f77bcf86cd799439012')",
  "title": "Midterm: Cellular Respiration",
  "description": "Answer all questions based on Chapter 4 notes.",
  "dueDate": "2024-11-20T23:59:59Z",
  "rubric": {
    "clarity": 25,
    "logic": 25,
    "evidence": 30,
    "language": 20
  },
  "ragNotesId": "ObjectId('507f1f77bcf86cd799439030')",
  "questionPaperUrl": "/uploads/assignments/midterm-questions.pdf",
  "createdAt": "2024-11-01T10:00:00Z"
}
```
**Explanation:** Defines an assignment with grading rubric and reference to teacher notes for RAG-based evaluation. The `ragNotesId` links to the ChromaDB-embedded notes. Indexed on `classId` and `dueDate` for dashboard queries.

---

### **submissions**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439050')",
  "assignmentId": "ObjectId('507f1f77bcf86cd799439040')",
  "studentId": "ObjectId('507f1f77bcf86cd799439020')",
  "fileUrl": "/uploads/submissions/student-20-midterm.pdf",
  "ocrText": "Q1: Cellular respiration is the process by which cells break down glucose...",
  "evaluation": [
    {
      "questionNo": 1,
      "score": 8.5,
      "maxScore": 10,
      "feedback": "Good explanation of glycolysis. However, you missed mentioning the role of NAD+ in electron transport. Review section 4.3.",
      "rubricScores": {
        "clarity": 9,
        "logic": 8,
        "evidence": 8,
        "language": 9
      }
    },
    {
      "questionNo": 2,
      "score": 7.0,
      "maxScore": 10,
      "feedback": "Partially correct. The Krebs cycle produces ATP, but you incorrectly stated it occurs in the cytoplasm—it happens in the mitochondrial matrix.",
      "rubricScores": {
        "clarity": 8,
        "logic": 6,
        "evidence": 6,
        "language": 8
      }
    }
  ],
  "plagiarism": {
    "riskScore": 0.42,
    "flags": ["moderate AI probability", "sentence similarity to online sources"],
    "detailedReport": "https://edenai.com/reports/abc123"
  },
  "totalScore": 77.5,
  "percentageScore": 77.5,
  "status": "completed",
  "submittedAt": "2024-11-18T14:30:00Z",
  "evaluatedAt": "2024-11-18T14:32:15Z"
}
```
**Explanation:** Stores student submissions with full evaluation results. The `evaluation` array contains per-question scores and feedback. Plagiarism detection results are stored separately. Indexed on `assignmentId` and `studentId` for fast lookups. The nested `rubricScores` break down performance across rubric criteria.

---

### **vivaSessions**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439060')",
  "classId": "ObjectId('507f1f77bcf86cd799439012')",
  "teacherId": "ObjectId('507f1f77bcf86cd799439011')",
  "title": "Oral Exam: Photosynthesis & Respiration",
  "topic": "Chapters 3-4",
  "duration": 15,
  "numberOfQuestions": 5,
  "ragNotesId": "ObjectId('507f1f77bcf86cd799439030')",
  "voiceProfileId": "ObjectId('507f1f77bcf86cd799439070')",
  "questions": [
    {
      "questionNo": 1,
      "text": "Explain the light-dependent reactions of photosynthesis.",
      "expectedPoints": ["thylakoid membranes", "water splitting", "NADPH and ATP production"]
    },
    {
      "questionNo": 2,
      "text": "Describe the role of the mitochondria in cellular respiration.",
      "expectedPoints": ["Krebs cycle", "electron transport chain", "ATP synthesis"]
    }
  ],
  "scheduledAt": "2024-11-25T09:00:00Z",
  "status": "ready",
  "createdAt": "2024-11-20T12:00:00Z"
}
```
**Explanation:** Represents a scheduled viva session. The `questions` array contains AI-generated questions based on teacher notes. The `voiceProfileId` links to the teacher's voice clone. Indexed on `classId` and `scheduledAt`.

---

### **vivaReports**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439080')",
  "vivaSessionId": "ObjectId('507f1f77bcf86cd799439060')",
  "studentId": "ObjectId('507f1f77bcf86cd799439020')",
  "studentName": "Alex Chen",
  "transcript": [
    {
      "questionNo": 1,
      "question": "Explain the light-dependent reactions of photosynthesis.",
      "answer": "The light-dependent reactions occur in the thylakoid membranes where chlorophyll absorbs light energy. This energy splits water molecules, releasing oxygen. The electrons are transferred through the electron transport chain, producing NADPH and ATP which are used in the Calvin cycle.",
      "scores": {
        "clarity": 9,
        "accuracy": 9,
        "depth": 8
      },
      "totalScore": 8.7,
      "feedback": "Excellent answer! You correctly identified the location, the process of water splitting, and the products. To improve depth, you could mention the role of photosystem I and II.",
      "duration": 45,
      "timestamp": "2024-11-25T09:03:15Z"
    },
    {
      "questionNo": 2,
      "question": "Describe the role of the mitochondria in cellular respiration.",
      "answer": "Mitochondria are the powerhouses of the cell where the Krebs cycle happens. They produce ATP.",
      "scores": {
        "clarity": 7,
        "accuracy": 6,
        "depth": 5
      },
      "totalScore": 6.0,
      "feedback": "Correct that mitochondria produce ATP via the Krebs cycle, but your answer lacks depth. You didn't mention the electron transport chain or oxidative phosphorylation. Review section 4.4 for a more complete understanding.",
      "duration": 20,
      "timestamp": "2024-11-25T09:05:30Z"
    }
  ],
  "proctoring": {
    "multipleFaces": false,
    "phoneDetected": true,
    "events": [
      {
        "type": "phoneDetected",
        "timestamp": "2024-11-25T09:04:10Z",
        "confidence": 0.89,
        "frameUrl": "/uploads/proctoring/frame-abc123.jpg"
      },
      {
        "type": "faceNotVisible",
        "timestamp": "2024-11-25T09:06:45Z",
        "confidence": 1.0,
        "frameUrl": "/uploads/proctoring/frame-def456.jpg"
      }
    ]
  },
  "overallScore": 73.5,
  "averageScores": {
    "clarity": 8.0,
    "accuracy": 7.5,
    "depth": 6.5
  },
  "totalDuration": 780,
  "status": "completed",
  "completedAt": "2024-11-25T09:15:00Z"
}
```
**Explanation:** Stores the complete viva interview transcript with per-question scores and feedback. The `proctoring` object contains detected violations with timestamps and frame screenshots. The `averageScores` provide a rubric breakdown across all questions. Indexed on `vivaSessionId` and `studentId`.

---

### **ragChunks (embedded context storage)**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439090')",
  "notesId": "ObjectId('507f1f77bcf86cd799439030')",
  "chunkId": "chunk-003",
  "text": "The Calvin cycle, also known as the light-independent reactions, occurs in the stroma of chloroplasts. It uses ATP and NADPH from the light-dependent reactions to fix carbon dioxide into glucose through a series of enzymatic reactions involving RuBisCO.",
  "embedding": [0.023, -0.045, 0.178, ...],
  "metadata": {
    "sourceFile": "photosynthesis.pdf",
    "pageNumber": 5,
    "chunkIndex": 3,
    "totalChunks": 12
  },
  "createdAt": "2024-09-15T10:30:00Z"
}
```
**Explanation:** Stores chunked text from teacher notes along with vector embeddings for RAG retrieval. The `embedding` array (768-dimensional vector from Google Generative AI Embeddings) is used for similarity search in ChromaDB. Metadata helps trace context back to source documents. Indexed on `notesId` for bulk retrieval operations.

---

### **voiceProfiles**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439070')",
  "teacherId": "ObjectId('507f1f77bcf86cd799439011')",
  "teacherName": "Dr. Sarah Johnson",
  "audioSampleUrl": "/uploads/voices/sarah-voice-sample.mp3",
  "lmntVoiceId": "xyz-teacher-voice-123",
  "sampleDuration": 310,
  "quality": "high",
  "status": "ready",
  "createdAt": "2024-10-01T14:00:00Z",
  "expiresAt": "2025-10-01T14:00:00Z"
}
```
**Explanation:** Stores teacher voice cloning profiles. The `lmntVoiceId` is returned by LMNT TTS after training on the audio sample. Voice samples are retained for 1 year (`expiresAt`) for privacy compliance. Indexed on `teacherId` for fast lookups during viva session creation.

---

### **Indexing Strategies**

- **users:** Unique index on `email`; compound index on `(role, createdAt)` for admin dashboards.
- **classrooms:** Unique index on `classCode`; index on `teacherId` for teacher-specific queries.
- **assignments:** Compound index on `(classId, dueDate)` for fast dashboard rendering of upcoming assignments.
- **submissions:** Compound index on `(assignmentId, studentId)` (unique) to prevent duplicate submissions; index on `status` for filtering.
- **vivaSessions:** Compound index on `(classId, scheduledAt)` for calendar views.
- **vivaReports:** Compound index on `(vivaSessionId, studentId)` (unique); index on `status` for in-progress tracking.
- **ragChunks:** Index on `notesId` for bulk retrieval; text index on `text` field for keyword search.
- **voiceProfiles:** Index on `teacherId`; TTL index on `expiresAt` for automatic cleanup.

### **Data Modeling Decisions**

**Why Document-Based (MongoDB) Over Relational (PostgreSQL):**
1. **Schema Flexibility:** The `evaluation` and `transcript` arrays in submissions and viva reports have variable lengths and nested structures. Relational databases would require multiple JOIN tables, increasing query complexity.
2. **Rapid Iteration:** During development, we frequently added fields (e.g., `plagiarism.detailedReport`, `proctoring.events[]`). MongoDB's schema-less design allowed instant changes without migrations.
3. **Nested Data:** Feedback, proctoring events, and rubric scores are tightly coupled with their parent documents. Embedding them in MongoDB provides atomic reads/writes and better performance.
4. **JSON-Native:** The entire application (React, Node, Flask) operates on JSON. MongoDB's BSON format aligns perfectly, eliminating serialization overhead.

**Trade-offs Acknowledged:**
- **No Foreign Key Constraints:** We manually enforce referential integrity in application logic (e.g., checking `assignmentId` exists before creating a submission).
- **Aggregation Queries:** Complex analytics (e.g., "average scores per class per month") require MongoDB aggregation pipelines, which have a learning curve compared to SQL.
- **Transaction Support:** Multi-document transactions (e.g., creating a submission + updating class stats atomically) are less mature in MongoDB compared to PostgreSQL.

**Mitigation:**
- Use Mongoose schema validation to enforce data integrity at the application level.
- Pre-compute common analytics and store them in separate `analytics` collections.
- Rely on MongoDB's single-document ACID guarantees for critical operations.

---

**End of Section 7. Document complete through all 7 required sections.**

---

## 8. Component responsibilities

### React frontend
- Responsible: User interface, form handling, client-side validation, real-time interactions via Socket.io, microphone/webcam capture for viva, rendering dashboards and reports.
- Must NOT: Perform grading logic, store secrets, call LLMs directly, bypass auth, manipulate server-side scores.
- Why separation: Keeps UI responsive and secure; heavy compute stays server-side; prevents leakage of API keys and logic integrity.

### Node routes/controllers
- Responsible: HTTP endpoints, request validation, orchestration of workflows (upload → evaluate), coordinating with service layer, returning normalized JSON responses.
- Must NOT: Contain AI logic, directly query external AI APIs, embed database queries inline without services, hold long-running tasks.
- Why separation: Controllers remain thin and testable; business rules live in services; improves maintainability.

### Node service layer
- Responsible: Business logic (assignment lifecycle, viva orchestration), integration with Flask AI endpoints, database operations via repositories/ODM, retries and circuit breaking.
- Must NOT: Serve HTTP directly, mix presentation concerns, store credentials in code, manage sockets directly.
- Why separation: Centralizes domain rules; enables reuse across controllers; simplifies testing and scaling.

### Flask AI microservice
- Responsible: OCR, RAG embedding and retrieval, LLM prompting and scoring, plagiarism detection, voice generation, YOLOv8 proctoring.
- Must NOT: Handle user auth sessions, manage classroom CRUD, expose raw model keys to clients, perform UI rendering.
- Why separation: Isolates heavy compute; allows independent scaling and model iteration without touching the Node app.

### ChromaDB
- Responsible: Store and retrieve vector embeddings for teacher notes; perform similarity search with metadata filtering.
- Must NOT: Store user identities or submission documents; execute business logic; act as primary datastore.
- Why separation: Purpose-built vector store keeps RAG fast and focused; MongoDB remains source of truth.

### MongoDB
- Responsible: Persist users, classes, assignments, submissions, viva sessions and reports, proctoring events.
- Must NOT: Perform embedding similarity search; store raw LLM prompts/responses without summarization; enforce UI logic.
- Why separation: Clear data ownership; transactional reads/writes; analytics-friendly aggregation.

### Voice cloning module (LMNT TTS)
- Responsible: Train teacher voice profiles and synthesize question audio on demand.
- Must NOT: Store long-term raw audio beyond retention policies; run client-side; bypass consent.
- Why separation: Encapsulates sensitive audio workflows and licensing; replaceable without changing core app.

### Proctoring module (YOLOv8)
- Responsible: Detect phones, multiple faces, face absence; emit timestamped events with confidence.
- Must NOT: Auto-punish students; block sessions on false positives; store continuous raw video.
- Why separation: Keeps integrity checks auditable and review-based; avoids overreach and privacy issues.

### Authentication & authorization module (JWT)
- Responsible: Issue/verify tokens; enforce role-based access (teacher/student); protect routes and microservice calls.
- Must NOT: Embed tokens in URLs; store secrets client-side; grant broad scopes without necessity.
- Why separation: Security boundary clearly defined; consistent auth across Node and Flask.

---

## 9. AI assessment system (deep explanation)

### From teacher notes to embeddings in ChromaDB
1) Ingestion: Teacher uploads PDF notes; Node stores file path; Flask loads the PDF.
2) Extraction: Flask uses PyMuPDF or pdf2image+OCR to obtain text with page metadata.
3) Chunking: Text is split using a RecursiveCharacter splitter into overlapping segments sized ~500–1000 tokens with 10–15% overlap to preserve context across boundaries.
4) Embedding: Each chunk is embedded using Google Generative AI Embeddings, producing a high-dimensional vector (e.g., 768 dims).
5) Persistence: Chunks are stored in ChromaDB with fields: `text`, `embedding`, `notesId`, `pageNumber`, `chunkIndex`, `sourceFile`.

### Chunking strategy
- Size: 500–1000 tokens balances semantic richness with retrieval precision.
- Overlap: 50–100 tokens mitigate boundary loss, ensuring concepts spanning pages remain discoverable.
- Semantics: Keep headings with subsequent paragraphs; avoid splitting tables mid-row; normalize whitespace.

### Retrieval strategy (similarity search)
- Query vector: Student answer or question is embedded.
- k-NN: Retrieve top-k chunks (k=3–5) via cosine similarity.
- Filters: Constrain by `notesId` and optionally by `page ranges` relevant to an assignment.
- Consolidation: Merge chunks, deduplicate overlapping ideas, and pass to the LLM as grounded context.

### Rubric-based scoring
- Criteria: Language quality, logical coherence, critical thinking, spelling/grammar, relevance to notes.
- Weighting: Example weights (language 20%, logic 25%, critical thinking 25%, spelling 10%, relevance 20%).
- Prompting: Structured prompt instructs the LLM to return JSON with per-criterion scores and narrative feedback strictly grounded in provided context.
- Aggregation: Total score = weighted sum; per-question feedback cites source chunks (page numbers) when applicable.

### Why RAG improves accuracy
- Grounding reduces hallucinations by constraining the LLM to verified teacher material.
- Consistency: Evaluations remain aligned with curriculum, not general web knowledge.
- Explainability: Feedback references specific chunks, improving trust and auditability.

### Limitations & mitigations
- Limitation: If notes are sparse or outdated, RAG may miss correct but external facts. Mitigation: Allow teacher to upload supplemental sources; flag low-context coverage.
- Limitation: Embedding drift across versions. Mitigation: Version embeddings per notes upload; reindex when models change.
- Limitation: Long answers exceed context. Mitigation: Summarize answers per question before retrieval; sliding window evaluation.
- Limitation: Ambiguous questions. Mitigation: Add disambiguation step prompting the LLM to request clarification or expand the context window.

---

## 10. OCR + AI-content detection (detailed)

### Why GOTOCR over LLM OCR
- Deterministic: Traditional OCR avoids hallucinating non-existent text.
- Cost: Cheaper and predictable versus vision-capable LLM calls.
- Performance: Faster for bulk PDFs; leverages CPU-friendly pipelines.
- Robustness: Tuned for scanned academic documents; fewer layout-induced errors.

### Eden API workflow
1) Flask assembles full extracted text per submission.
2) Sends to Eden AI Content Detector endpoint.
3) Receives normalized `riskScore` and model-wise breakdown.
4) Stores the score and report URL in `submissions.plagiarism`.

### Sample AI-content output JSON
```json
{
  "riskScore": 0.73,
  "details": {
    "originality_ai": 0.68,
    "gptzero": 0.71,
    "crossplag": 0.76
  },
  "explanations": [
    "Perplexity too low across segments",
    "High overlap with known AI patterns"
  ],
  "reportUrl": "https://edenai.com/reports/xyz123"
}
```

### Thresholding logic & student blocking
- Thresholds: `riskScore >= 0.70` → flag; `>= 0.85` → hard block pending teacher review.
- Flow: Node marks submission `flagged`; student receives notice; teacher can override with justification.

### Teacher-facing plagiarism reports
- Dashboard section lists flagged submissions with risk scores, model breakdowns, and links to detailed reports.
- Provides excerpt-level highlights showing suspicious segments for manual inspection.

---

## 11. AI Viva + Voice Cloning (very detailed)

### Voice cloning lifecycle
1) Upload: Teacher provides a ~5-minute audio sample via React; Node stores it securely.
2) Clone: Flask calls LMNT TTS to create `voiceId` from the sample.
3) Profile: `voiceProfiles` document persists `voiceId`, quality metrics, and retention window.

### RAG-based question generation
- Flask retrieves topic-relevant chunks from ChromaDB and prompts Gemini to produce open-ended questions with expected points.

### Transcript pipeline
- React Speech Recognition transcribes answers; text streams via Socket.io to Node, which batches and forwards to Flask.

### Proctoring (YOLOv8)
- Webcam frames sampled at ~1 FPS; Flask runs YOLOv8 to detect `person` count and `cell phone` objects; events logged with confidence and snapshot URLs.

### Viva evaluation (LLM + RAG)
- For each Q/A, Flask retrieves context chunks and prompts the LLM to score clarity, accuracy, and depth, returning JSON plus narrative feedback.

### MongoDB storage
- `vivaReports` persist transcript entries, per-criterion scores, overall score, duration, and proctoring events.

### Why it simulates real viva
- Natural teacher voice via cloning, dynamic follow-ups grounded in notes, real-time transcript visibility, and integrity monitoring create an authentic oral exam environment.

---

## 12. Important dependencies & why they matter
- React: Interactive dashboards and smooth UX.
- Vite: Fast development server and bundling.
- Redux: Predictable state management across complex views.
- Express.js: Minimal, robust HTTP server with middleware.
- Mongoose: ODM for schema validation and queries.
- Flask: Python-native microservice for AI workloads.
- LangChain: Utilities for chunking and prompt composition.
- ChromaDB: Efficient local vector store for RAG.
- Google Generative AI (Gemini + Embeddings): Scoring and embeddings generation.
- Eden AI: Ensemble AI-content detection for integrity.
- LMNT TTS: High-fidelity voice cloning API.
- YOLOv8 + OpenCV: Real-time object detection for proctoring.
- Socket.io: Real-time viva and notifications.
- Multer: File uploads handling in Node.

---

## 13. Error handling, reliability & logging

### Strategies
- Input validation: Controllers enforce required fields, file type checks, size limits; reject malformed requests early.
- AI timeouts: Flask sets 30s timeout on Gemini; retries once with exponential backoff; returns partial results with warning tags.
- Microservice retries: Node uses retry policy (e.g., 3 attempts with jitter); circuit breaker opens on repeated failures to protect the backend.
- Database failures: Graceful degradation—queue writes, return "processing" status; background job reconciles.
- Corrupted PDFs: OCR pipeline detects unreadable files; mark submission "OCR failed" with remediation tips; allow re-upload.
- Speech recognition failures: Frontend fallback to manual text input; server notes "transcription unreliable." 
- YOLO misdetections: Confidence thresholds and debouncing; requires two consecutive detections before logging a violation; teachers can override.

### Logging & monitoring
- Structured logs: `{timestamp, reqId, userId, action, status, duration, error}` across Node and Flask.
- Correlation IDs: Propagate `reqId` from frontend → Node → Flask → back for traceability.
- Levels: Info for normal ops, Warning for retries/timeouts, Error for hard failures.
- Storage: Centralized log sink (file/ELK) with retention policies.
- Alerts: Threshold-based alerts for Flask downtime, elevated plagiarism rates, YOLO error spikes.

---

## 14. Challenges faced & solutions

- RAG hallucinations → Constrained prompts to cite chunks; reject answers without chunk references.
- Embedding accuracy → Tried multiple embedding models; standardized on Generative AI embeddings; added overlap and heading-aware splits.
- Microservice delays → Implemented async job queue and circuit breaker; cached recent evaluation results.
- Voice cloning quality → Required minimum sample duration and SNR checks; provided teacher guidance and re-record options.
- Proctoring false positives → Tuned confidence thresholds; multi-frame confirmation; manual review workflow.
- Real-time transcript issues → Buffered text with heartbeat detection; allowed manual corrections before finalization.
- MongoDB schema evolution → Used Mongoose schemas with optional fields; migration scripts to backfill new properties.
- Scaling concerns → Separated AI workloads; enabled horizontal scaling for Flask; added rate limiting and queue back-pressure in Node.

---

## 14. Security & secrets management

- JWT role-based access control: Tokens include `userId` and `role` (teacher/student). Route guards enforce RBAC (e.g., only teachers can create assignments, schedule viva). Tokens are short-lived with refresh flow; `Authorization: Bearer <jwt>` is required for Node and forwarded to Flask for microservice calls.
- Protecting API keys: LLM (Gemini), Eden, and LMNT keys are stored as environment variables on the server-side only; never exposed to the frontend. Keys are rotated periodically and scoped with least privilege. Flask and Node read keys via secure env injection.
- Environment variables & secret stores: `.env` used for local dev; production uses platform secret managers (e.g., Azure Key Vault or AWS Secrets Manager). Access controlled via IAM roles; no secrets committed to VCS.
- Handling voice samples securely: Teacher audio stored in restricted buckets or encrypted volumes with access limited to teacher and system processes. Retention policy set (e.g., 12 months) with opt-out deletion. Audio at rest is encrypted (AES-256), and in transit via HTTPS.
- Network boundaries (Node ↔ Flask): Private network or VPC peering between services; Flask not publicly exposed—accessible only from Node’s subnet/security group. CORS strictly limited; rate limiting applied to all Flask endpoints.

---

## 15. Testing strategy

- Unit tests (Node services): Validate assignment creation, submission orchestration, plagiarism threshold decisions, and retry logic with mocked Flask responses.
- Unit tests (Flask AI pipeline): Test chunking, embedding, retrieval, scoring prompt shaping, Eden API parsing, and YOLO event extraction with fixtures.
- Integration tests (Node ↔ Flask): Spin up Flask test server; run end-to-end submission evaluation; assert MongoDB writes and response structures.
- Snapshot tests (React): Capture UI states for dashboards, viva screen, error banners; prevent regressions in layout and content.
- Proctoring tests: Feed synthetic frames with known objects (phone/person) to YOLO; assert detection confidence, debouncing and event logging.
- Edge cases: Empty submissions (reject with clear error), extremely long PDFs (paginate processing), multiple faces (log violation without auto-fail), no microphone (fallback to text input), OCR failure (request re-upload).

---

## 16. Challenges faced & solutions

- RAG hallucinations → Enforced chunk citation and rubric grounding; reject feedback lacking references.
- Embedding accuracy → Tuned chunk sizes and overlaps; normalized text; switched to stable embedding model; reindexed notes per version.
- Microservice communication delays → Added request timeouts, retries with jitter, and circuit breaker; queued evaluations asynchronously.
- Voice cloning quality → Minimum sample duration and noise checks; provided recording guidelines; allowed multi-sample averaging.
- Proctoring false positives → Multi-frame confirmation and confidence thresholds; teacher override workflow with snapshots.
- Real-time transcript issues → Heartbeat-based segmentation; local transcript editing before submit; display confidence indicators.
- MongoDB schema evolution → Optional fields and defaults; migration scripts; analytics denormalization for heavy queries.
- Scaling concerns → Horizontal scaling of Flask; GPU pool for YOLO/embeddings; batching evaluations; caching recent context.
- OCR variability → Dual pipeline (PyMuPDF, pdf2image+OCR) fallback; page-level error isolation; student prompts for clearer scans.
- LLM latency/cost → Use Gemini Flash; prompt compression; reuse context windows; throttle peak loads via queueing.

---

## 17. Demo plan (2–4 minutes)

Step 1 — Classroom & notes (30s)
- Say: "I’ll start by creating a Biology 301 classroom and uploading chapter notes. Behind the scenes, the system extracts text, chunks it, and stores embeddings in ChromaDB."

Step 2 — Assignment & submission (40s)
- Say: "Next, I create a midterm assignment with a rubric. A student uploads their PDF answer. The system runs OCR, retrieves relevant notes via RAG, and scores each answer using Gemini, returning grounded feedback."

Step 3 — Viva with voice cloning (40s)
- Say: "For the viva, I upload a short voice sample. The system clones it via LMNT TTS. During the viva, the cloned teacher voice asks questions; the student’s microphone transcribes responses, and we score clarity, accuracy, and depth—stored as a full transcript."

Step 4 — Proctoring & dashboard (30s)
- Say: "While the viva runs, YOLOv8 detects integrity issues like phone usage or multiple faces. All events are timestamped. Finally, the teacher dashboard shows scores, feedback, and any flagged behavior."

Step 5 — Integrity & security (20s)
- Say: "Eden AI checks for AI-generated content; high-risk submissions are flagged for review. JWT enforces role-based access, and all secrets are server-side only."

---

## 18. Common interview questions & strong model answers

1) What is RAG and why use it? → Retrieval-Augmented Generation grounds LLM outputs in teacher notes, reducing hallucinations and aligning evaluations with curriculum.
2) How do you create embeddings from notes? → Extract text, chunk with overlap, embed with Generative AI, and store vectors + metadata in ChromaDB.
3) How is similarity search performed? → k-NN using cosine similarity; filter by `notesId`; consolidate top-k chunks as context.
4) How do you score answers? → LLM returns structured per-criterion scores (language, logic, critical thinking, spelling, relevance) and narrative feedback based on provided context.
5) Why a Flask microservice? → Isolates heavy AI workloads, enables independent scaling, and keeps Node responsive.
6) How do you handle OCR failures? → Dual pipeline, page-level fallbacks, mark as 'OCR failed' with remediation instructions.
7) How does YOLOv8 integrate? → Flask processes frames, detects objects, logs violations with confidence and timestamps; no auto-fail.
8) What about voice cloning ethics? → Consent required, retention limits, encryption at rest, and teacher control for deletion.
9) How do you secure secrets? → Env-based secret stores, no client exposure, rotation, IAM-scoped access.
10) How do you scale evaluations? → Queue jobs, batch processing, GPU nodes for embeddings/YOLO, horizontal Flask scaling.
11) How do you manage MongoDB schema changes? → Mongoose validations, optional fields, migration scripts, analytics denormalization.
12) How do you ensure low latency? → Use Gemini Flash, cache recent contexts, optimize chunk sizes, limit k in retrieval.
13) What monitoring is in place? → Structured logs, correlation IDs, alerts for downtime and error spikes, dashboards for plagiarism and proctoring.
14) How do you test microservices? → Integration tests spin up Flask, invoke Node endpoints, assert end-to-end behavior and storage.
15) Why JWT over sessions? → Stateless, cross-service compatibility, role claims; avoids centralized session store complexities.

---

## 19. Scaling & production roadmap

- Kubernetes deployment: Separate deployments for frontend, Node, Flask; HPA for Flask based on CPU/GPU utilization; ClusterIP networking for private Node↔Flask communication.
- GPU inference nodes: Dedicated GPU pools for YOLO and embeddings; node taints and tolerations to schedule AI workloads appropriately.
- Distributed ChromaDB: Clustered setup or managed vector DB when scaling; shard by `notesId`; periodic compaction.
- CDN for assets: Serve static assets (images, PDFs after processing, audio prompts) via CDN for faster global access.
- Queue-based async evaluation: Use message queues (e.g., RabbitMQ or SQS) to decouple submission uploads from AI processing; workers consume jobs and update MongoDB.
- Canary deployments: Gradually roll out new LLM prompts or embedding models; monitor metrics; rollback on anomalies.
- Observability: Prometheus metrics for request latencies, queue backlog, YOLO detection counts; Grafana dashboards; tracing with OpenTelemetry.
- Rate limiting & back-pressure: Apply per-user limits; queue overflow handling; circuit breakers between Node and Flask.
- Backup & disaster recovery: Scheduled MongoDB backups; snapshot embeddings; restore playbooks.

---

## 20. Resume bullets

- Designed and delivered an AI-powered LMS integrating MERN with a Flask microservice to automate written and viva assessments at scale.
- Built a RAG pipeline using ChromaDB and Generative AI embeddings to ground LLM evaluations in teacher notes, reducing hallucinations and improving accuracy.
- Implemented YOLOv8-based proctoring and React Speech Recognition to enable real-time, integrity-aware viva sessions with full transcripts.
- Integrated LMNT TTS for high-fidelity teacher voice cloning, creating realistic viva experiences with secure audio handling and retention policies.
- Engineered robust reliability: retries, circuit breakers, structured logging, and end-to-end tests across Node ↔ Flask.
- Secured the platform with JWT RBAC, secret management, VPC boundaries, and encrypted storage for sensitive assets.

---

## 21. One-page cheat sheet

Architecture: MERN frontend and backend with a dedicated Flask microservice for AI tasks. React handles UI, uploads, and real-time viva interactions. Node orchestrates workflows, enforces JWT-based RBAC, and persists data in MongoDB. Flask performs OCR, RAG retrieval via ChromaDB, LLM scoring, Eden AI plagiarism checks, LMNT voice synthesis, and YOLOv8 proctoring. ChromaDB stores embeddings from teacher notes, enabling similarity-based context retrieval.

AI pipeline: Teacher notes are extracted, chunked (~500–1000 tokens, 10–15% overlap), embedded, and stored in ChromaDB. Student submissions undergo OCR, and each answer is evaluated with RAG-constrained prompts, returning per-criterion scores and narrative feedback. Eden AI provides AI-content risk scores; flagged submissions appear on dashboards.

Viva system: Teachers clone their voice via LMNT; Flask generates question audio. React captures mic and webcam; transcripts stream to Node, which forwards to Flask for scoring (clarity, accuracy, depth). YOLOv8 detects integrity issues (phones, multiple faces); events with timestamps and confidence are stored.

RAG & Proctoring: RAG ensures grounded, curriculum-aligned evaluation. Proctoring is review-centric, logging events without auto-failing students to minimize false positives.

Key strengths: Grounded evaluation, microservice isolation for AI workloads, strong integrity checks, secure secret management, scalable architecture with queues and GPU nodes, comprehensive logging and testing.


