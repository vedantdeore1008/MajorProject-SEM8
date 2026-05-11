# 🎨 QUICK UML REFERENCE GUIDE
## Kaizen HackXplore - Visual Architecture Guide

---

## 📋 Document Index

This comprehensive SRS document includes **14 UML diagrams** and complete system specification:

### **UML Diagrams Included:**

1. ✅ **Use Case Diagram** (Section 2.1)
   - Shows all actors: Teachers, Students, System
   - All 30+ use cases and their relationships
   - Interactions for authentication, classroom, assessment, recommendations, projects, communication

2. ✅ **Class Diagram** (Section 2.2)
   - 10 core data entities with attributes and methods
   - All relationships with multiplicities
   - Inheritance and composition patterns
   - Complete OOP structure

3. ✅ **Sequence Diagram - Assignment Submission** (Section 2.3)
   - 27-step workflow from upload to recommendation
   - Frontend → Backend → Flask → External APIs
   - Error handling and data flows

4. ✅ **Sequence Diagram - Quiz Workflow** (Section 2.4)
   - Quiz creation from PDF (auto-generation)
   - Student quiz submission
   - Auto-evaluation and proctoring

5. ✅ **Sequence Diagram - Viva with AI Voice** (Section 2.5)
   - Voice-cloned question delivery
   - Student response recording & evaluation
   - Facial recognition proctoring
   - Real-time feedback generation

6. ✅ **Sequence Diagram - Course Recommendation** (Section 2.6)
   - Topic extraction from feedback
   - Article resource generation
   - YouTube video search integration
   - Topic-specific recommendations

7. ✅ **Activity Diagram - Assignment Evaluation** (Section 2.7)
   - OCR + PyMuPDF text extraction
   - Plagiarism checking
   - AI scoring (1-10 scale)
   - Feedback & recommendation generation

8. ✅ **Activity Diagram - Timetable Generation** (Section 2.8)
   - Genetic algorithm initialization
   - Fitness evaluation
   - Selection, crossover, mutation
   - Schedule optimization

9. ✅ **State Machine Diagram - Project Lifecycle** (Section 2.9)
   - 8 project states
   - Transitions with conditions
   - Acceptance, rejection, collaboration, completion

10. ✅ **Component Diagram** (Section 2.10)
    - 4 major layers: Frontend, Backend, Database, AI Service
    - External services integration
    - All interdependencies

11. ✅ **Deployment Diagram** (Section 2.11)
    - Physical node distribution
    - Port mappings (Frontend: 5173, Backend: 4000, Flask: 5000)
    - Database servers and cloud services

12. ✅ **Entity-Relationship Diagram** (Section 2.12)
    - 11 entities with all attributes
    - 1-to-many and many-to-many relationships
    - Embedded vs. referenced documents

13. ✅ **Data Flow Diagram Level 1** (Section 2.13)
    - High-level data flows
    - External system interactions
    - User-System-Database interactions

14. ✅ **Sequence Diagram - Project Collaboration** (Section 2.14)
    - Real-time Google Docs collaboration
    - GitHub integration
    - Teacher feedback workflow

---

## 🏗️ SYSTEM ARCHITECTURE AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                       │
│                    React SPA @ Port 5173                         │
└────────┬────────────────────────────────────────────────────────┘
         │ HTTP REST + WebSocket
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND LAYER (Express.js)                      │
│                   Node.js Server @ Port 4000                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • User Authentication (JWT)                             │   │
│  │ • Class Management                                       │   │
│  │ • Assignment Submission & Storage                        │   │
│  │ • Quiz & Viva Management                                 │   │
│  │ • Project Collaboration                                  │   │
│  │ • Real-time WebSocket (Socket.io)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────┬──────────────────────────┘
         │ HTTP REST                   │ HTTP REST
         ↓                             ↓
    ┌─────────┐              ┌──────────────────┐
    │ MongoDB │              │ Flask AI Service │
    │ Database│              │  @ Port 5000     │
    └─────────┘              └────────┬─────────┘
       Data                   ┌────────┴──────────────────────┐
     Storage                  │ AI/ML Functions:              │
                              │ • PDF Processing (OCR)        │
                              │ • RAG Pipeline                 │
                              │ • Topic Extraction (NLP)      │
                              │ • YouTube Search              │
                              │ • Voice Cloning               │
                              │ • Plagiarism Detection        │
                              └────────┬──────────────────────┘
                                       │ HTTP
                                       ↓
                              ┌─────────────────┐
                              │  External APIs  │
                              │ • Google AI     │
                              │ • YouTube API   │
                              │ • LMNT Voice    │
                              │ • OpenCV        │
                              └─────────────────┘
```

---

## 🎯 KEY WORKFLOWS

### **Assignment Submission Flow**
```
Student Submits PDF
    ↓
Backend Stores File
    ↓
Flask Extracts Text (OCR + PyMuPDF)
    ↓
Plagiarism Check
    ↓
RAG Evaluation (Compare with Expected Answer)
    ↓
AI Scores Each Question (1-10)
    ↓
Generate Detailed Feedback
    ↓
Extract Topics → Find Course Resources
    ↓
Display Results & Recommendations
```

### **Course Recommendation Flow**
```
Assignment Feedback Generated
    ↓
Extract Main Topics (NLP Analysis)
    ↓
Generate Article URLs (Khan Academy, Coursera, MIT, Wikipedia, Scholar)
    ↓
Generate YouTube Search Terms (Gemini)
    ↓
Search YouTube API
    ↓
Return Topic-Specific Videos
    ↓
Display Resources to Student
```

### **Viva Assessment Flow**
```
Start Viva Session
    ↓
Initialize Facial Recognition (Proctoring)
    ↓
For Each Question:
    ├─ Generate Voice-Cloned Audio
    ├─ Stream to Student
    ├─ Record Student Response
    ├─ Convert Speech-to-Text
    ├─ Compare with Expected Answer
    ├─ Score Response
    └─ Generate Feedback
    ↓
Detect Proctoring Violations
    ↓
Generate Final Report
    ↓
Display Results
```

---

## 📊 DATA ENTITIES & RELATIONSHIPS

### **Core Entities (10 total)**

| Entity | Purpose | Key Fields |
|--------|---------|-----------|
| **User** | Authentication & Profile | name, email, role (teacher/student) |
| **Class** | Course Container | name, classCode, teacher, students[] |
| **Assignment** | Homework with Feedback | title, PDFs, submissions[], feedback[] |
| **Submission** | Student Response | studentId, file, plagiarism, score, feedback |
| **Feedback** | AI Assessment | question, answer, evaluation, score |
| **Quiz** | Auto-generated Assessment | questions[], answers, results |
| **QuizResult** | Student Quiz Performance | scores, proctoring data |
| **Viva** | Oral Exam | Q&A pairs, voice-cloned questions |
| **VivaResult** | Student Viva Performance | responses[], scores |
| **Lecture** | Video Content | title, youtube link, comments[] |
| **Comment** | Discussion Thread | user, lecture, text |
| **Post** | Forum Post | user, class, description, likes[], comments[] |
| **Project** | Collaboration | teacher, student, status, google doc, github |
| **Timetable** | Schedule | userId, schedule items[] |

---

## 🔄 KEY RELATIONSHIPS

```
User (1) ───── teaches/enrolls ────→ (many) Class
Class (1) ───── contains ────→ (many) Assignment
Class (1) ───── contains ────→ (many) Quiz
Class (1) ───── contains ────→ (many) Viva
Class (1) ───── contains ────→ (many) Lecture
Class (1) ───── contains ────→ (many) Post

Assignment (1) ───── receives ────→ (many) Submission
Submission (1) ───── generates ────→ (many) Feedback

Quiz (1) ───── produces ────→ (many) QuizResult
Viva (1) ───── produces ────→ (many) VivaResult

Lecture (1) ───── receives ────→ (many) Comment
Post (1) ───── receives ────→ (many) PostComment

User (1) ───── has ────→ (1) Timetable
User (1) ───── requests/mentors ────→ (many) Project
```

---

## 🚀 API ENDPOINTS BY FEATURE

### **User Management (6 endpoints)**
```
POST   /user/register
POST   /user/login
GET    /user/details
PUT    /user/update
POST   /user/logout
POST   /user/search
```

### **Classroom (5+ endpoints)**
```
POST   /class/create
GET    /class/all
POST   /class/join
PUT    /class/:id
DELETE /class/:id
```

### **Assignment (10+ endpoints)**
```
POST   /assignment/upload
GET    /assignment/class/:classId
POST   /assignment/submit-answer
GET    /assignment/submissions/:id
PUT    /assignment/:id/result
GET    /assignment/result/:assignmentId/:studentId
POST   /assignment/store-feedback
GET    /assignment/feedback/:id/:sid
POST   /get-text-resources        [Flask]
POST   /recommend-videos          [Flask]
```

### **Quiz (8+ endpoints)**
```
POST   /quiz/create
GET    /quiz/:classId
POST   /quizresult/add
GET    /quizresult/student/:id
```

### **Viva (8+ endpoints)**
```
POST   /viva/create
GET    /viva/:classId
POST   /vivaresult/add
GET    /vivaresult/student/:id
POST   /generate-speech           [Flask]
```

### **Lecture & Discussion (8+ endpoints)**
```
POST   /lecture/upload
GET    /lecture/class/:classId
POST   /comment/create
GET    /comment/lecture/:lectureId
```

### **Projects (5+ endpoints)**
```
GET    /api/projects/teachers
POST   /api/projects/request
GET    /api/projects/student/:id
PUT    /api/projects/:id/respond
```

### **Timetable (4 endpoints)**
```
POST   /timetable/save
GET    /timetable/user/:userId
PUT    /timetable/update
DELETE /timetable/user/:userId
```

---

## 📈 FEATURE MATRIX

| Feature | Teacher | Student | Automated |
|---------|---------|---------|-----------|
| Create/Manage Classes | ✅ | ❌ | ❌ |
| Join Classes | ❌ | ✅ | ❌ |
| Upload Lectures | ✅ | ❌ | ❌ |
| Create Assignments | ✅ | ❌ | ❌ |
| Submit Assignments | ❌ | ✅ | ❌ |
| **Auto-evaluate Assignments** | ❌ | ❌ | ✅ |
| **Generate Feedback** | ❌ | ❌ | ✅ |
| **Auto-generate Quizzes from PDF** | ❌ | ❌ | ✅ |
| Take Quizzes | ❌ | ✅ | ❌ |
| **Auto-score Quizzes** | ❌ | ❌ | ✅ |
| Create Vivas | ✅ | ❌ | ❌ |
| **Generate Voice-Cloned Questions** | ❌ | ❌ | ✅ |
| Conduct Vivas | ❌ | ✅ | ❌ |
| **Auto-evaluate Viva Responses** | ❌ | ❌ | ✅ |
| **Generate Course Recommendations** | ❌ | ❌ | ✅ |
| **Generate Timetables** | ✅ | ❌ | ✅ |
| Request Project Guidance | ❌ | ✅ | ❌ |
| Respond to Project Requests | ✅ | ❌ | ❌ |
| Collaborate on Projects | ✅ | ✅ | ❌ |
| Post Discussion | ✅ | ✅ | ❌ |
| View Performance Analytics | ✅ | ✅ | ❌ |

---

## 🛠️ TECHNOLOGY STACK QUICK REFERENCE

```
┌─────────────────────────────────────────┐
│ FRONTEND                                 │
│ React 18 + Vite + Tailwind CSS          │
│ Redux for State Management               │
│ Material-UI Components                   │
│ WebSocket (Socket.io Client)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ BACKEND                                  │
│ Express.js (Node.js)                     │
│ Mongoose ODM (MongoDB)                   │
│ JWT Authentication                       │
│ Multer File Upload                       │
│ Socket.io Real-time                      │
│ CORS Middleware                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ AI/ML SERVICE                            │
│ Python 3.x + Flask                       │
│ PyMuPDF + pdf2image (PDF Processing)     │
│ LangChain + ChromaDB (RAG Pipeline)      │
│ Google Generative AI (Gemini)            │
│ NLTK + spaCy (NLP)                       │
│ OpenCV (Facial Recognition)              │
│ YouTube Data API                         │
│ LMNT API (Voice Cloning)                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ DATABASES                                │
│ MongoDB (Primary - Document Store)       │
│ ChromaDB (Vector Store - Embeddings)     │
│ Elasticsearch (Optional - Full-Text)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ DEPLOYMENT & INFRASTRUCTURE              │
│ Docker (Containerization)                │
│ AWS/GCP (Cloud Hosting)                  │
│ Load Balancer (Horizontal Scaling)       │
│ CDN (Static Asset Delivery)              │
└─────────────────────────────────────────┘
```

---

## 🔐 SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────┐
│ AUTHENTICATION & AUTHORIZATION              │
├─────────────────────────────────────────────┤
│ 1. User Login → Email & Password            │
│ 2. Verify Credentials                       │
│ 3. Generate JWT Token (24hr expiry)         │
│ 4. Store in HttpOnly Cookie                 │
│ 5. Include in Authorization Header          │
│ 6. Validate on Each Request                 │
│ 7. Extract User ID & Role                   │
│ 8. Role-based Middleware Check              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DATA PROTECTION                             │
├─────────────────────────────────────────────┤
│ • Passwords: bcryptjs hashing               │
│ • HTTPS/TLS: Encrypted transport            │
│ • CORS: Cross-origin restriction            │
│ • Input Validation: Schema validation       │
│ • SQL Injection Prevention: Mongoose ODM    │
│ • XSS Prevention: React auto-escaping       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ FILE UPLOAD SECURITY                        │
├─────────────────────────────────────────────┤
│ • File type validation                      │
│ • Size limits (e.g., 50MB max)              │
│ • Virus scanning (optional)                 │
│ • Random file naming                        │
│ • Serve from separate domain                │
└─────────────────────────────────────────────┘
```

---

## 📊 PERFORMANCE OPTIMIZATION STRATEGIES

```
Frontend:
  ✅ Code splitting & lazy loading
  ✅ Image optimization
  ✅ Minification & compression
  ✅ Caching strategies (Service Worker)
  ✅ CDN for static assets

Backend:
  ✅ Database indexing
  ✅ Query optimization
  ✅ Connection pooling
  ✅ Caching (Redis optional)
  ✅ Async processing for long tasks

AI Service:
  ✅ Batch processing
  ✅ Model caching
  ✅ Lazy initialization
  ✅ GPU acceleration (optional)
  ✅ Result caching
```

---

## 🎓 LEARNING OUTCOMES FOR STUDENTS

After using Kaizen ERP, students should be able to:

1. ✅ **Understand Assessment Quality**: Receive AI-powered feedback on strengths & weaknesses
2. ✅ **Personalized Learning**: Get topic-specific course recommendations
3. ✅ **Track Progress**: View analytics dashboards and performance trends
4. ✅ **Practice Orally**: Conduct voice-cloned practice vivaswith AI evaluation
5. ✅ **Collaborate Effectively**: Work on projects with real-time documentation
6. ✅ **Self-assess**: Take auto-generated quizzes with instant feedback

---

## 🏆 INNOVATIVE FEATURES SUMMARY

| Feature | Innovation | Impact |
|---------|-----------|--------|
| **AI Assignment Evaluation** | RAG + Gemini API | Eliminates manual grading, instant feedback |
| **Auto-generated Quizzes** | PDF → Intelligent Q/A extraction | Time-saving, diverse questions |
| **Voice-Cloned Viva** | Teacher voice + AI questions | Realistic practice, scalable |
| **Proctoring Integration** | Facial recognition + anomaly detection | Exam integrity, cheating prevention |
| **Topic-Specific Recommendations** | NLP + topic extraction | Personalized learning paths |
| **YouTube Integration** | API search with custom terms | Curated educational videos |
| **Timetable Automation** | Genetic algorithm optimization | Conflict-free schedules |
| **Real-time Collaboration** | Google Docs + GitHub | Seamless mentorship |
| **Plagiarism Detection** | External API + semantic analysis | Academic integrity |
| **3D Avatar Bot** | Voice synthesis + chatbot | Interactive learning support |

---

## 📚 DOCUMENT STRUCTURE

```
UML_DIAGRAMS_AND_SRS.md
├── Executive Summary
├── Part 1: Codebase Structure & Functional Requirements
│   ├── System Architecture Overview (3 layers)
│   ├── Data Models (10 entities)
│   └── Key Features by Actor (Teachers/Students/System)
│
├── Part 2: UML Diagrams (14 diagrams)
│   ├── 2.1  Use Case Diagram
│   ├── 2.2  Class Diagram
│   ├── 2.3  Sequence: Assignment Submission
│   ├── 2.4  Sequence: Quiz Workflow
│   ├── 2.5  Sequence: Viva with AI Voice
│   ├── 2.6  Sequence: Course Recommendation
│   ├── 2.7  Activity: Assignment Evaluation
│   ├── 2.8  Activity: Timetable Generation
│   ├── 2.9  State Machine: Project Lifecycle
│   ├── 2.10 Component Diagram
│   ├── 2.11 Deployment Diagram
│   ├── 2.12 Entity-Relationship Diagram
│   ├── 2.13 Data Flow Diagram
│   └── 2.14 Sequence: Project Collaboration
│
├── Part 3: Architectural Patterns & Decisions
│   ├── Authentication & Authorization
│   ├── File Upload & Processing
│   ├── Error Handling
│   ├── Database Relationships
│   ├── AI/ML Integration
│   ├── Real-time Communication
│   └── API Design
│
├── Part 4: API Endpoints Mapping (50+ endpoints)
├── Part 5: Functional Requirements (10 categories)
├── Part 6: Non-Functional Requirements
├── Part 7: Technology Stack Summary
├── Part 8: Integration Points
├── Part 9: Data Schemas Summary
└── Conclusion & Metadata
```

---

## 🎯 HOW TO USE THIS DOCUMENT

### **For Developers**
1. Read **Part 1** to understand system structure
2. Reference **Sequence Diagrams** for workflow implementation
3. Use **Class Diagram** for database schema
4. Check **API Endpoints** for endpoint specifications
5. Review **Component Diagram** for system interactions

### **For Project Managers**
1. Review **Use Case Diagram** for feature scope
2. Check **Functional Requirements** for deliverables
3. Reference **State Machine** for project workflow
4. Use **Feature Matrix** for prioritization

### **For QA/Testing**
1. Study **Sequence Diagrams** for test scenarios
2. Review **API Endpoints** for endpoint testing
3. Check **Activity Diagrams** for edge cases
4. Use **Data Schemas** for test data generation

### **For Business Analysts**
1. Review **Executive Summary** for high-level overview
2. Check **Use Case Diagram** for user interactions
3. Reference **Feature Matrix** for feature comparison
4. Review **Non-Functional Requirements** for SLAs

---

## 🔗 CROSS-REFERENCES

- **Assignment Workflow**: See Sections 2.3, 2.7, 2.14 (Collaboration)
- **Quiz System**: See Sections 2.4, 2.9 (State), Part 5 - F4
- **Viva System**: See Sections 2.5, 2.9 (State), Part 5 - F5
- **Recommendations**: See Sections 2.6, Part 5 - F6
- **Project Collaboration**: See Sections 2.14, 2.9 (State), Part 5 - F8
- **Database Schema**: See Sections 2.2 (Class), 2.12 (ERD), Part 9
- **API Integration**: See Sections 2.10 (Component), 2.11 (Deployment), Part 4
- **Security**: See Part 6 (Non-functional), Part 3 (Authentication)

---

## 📞 DOCUMENT METADATA

| Field | Value |
|-------|-------|
| **Document Name** | UML_DIAGRAMS_AND_SRS.md |
| **System Name** | Kaizen HackXplore |
| **System Type** | AI-Driven College ERP |
| **Version** | 1.0 |
| **Date Created** | December 2, 2025 |
| **Total Diagrams** | 14 |
| **Total API Endpoints** | 50+ |
| **Core Entities** | 14 |
| **Functional Requirements** | 50+ |
| **Technology Stack Items** | 20+ |

---

## 🌟 HIGHLIGHTS

✨ **Complete End-to-End Documentation**
- From high-level use cases to detailed sequence diagrams
- Backend architecture to AI service integration
- Database schemas to deployment infrastructure

✨ **Production-Ready Specifications**
- Detailed API endpoint mapping
- Security architecture
- Performance requirements
- Scalability patterns

✨ **Developer-Friendly Format**
- PlantUML diagrams (can be rendered online)
- Copyable code snippets
- Clear explanations for each section
- Cross-references throughout

✨ **Comprehensive Coverage**
- All 3 system layers documented
- 14 different UML diagram types
- 50+ functional requirements
- Technology decisions explained

---

**This document is the complete SRS for Kaizen HackXplore project and can be used for:**
- Architecture review
- Code generation
- Test case design
- Team onboarding
- Stakeholder communication
- Deployment planning

