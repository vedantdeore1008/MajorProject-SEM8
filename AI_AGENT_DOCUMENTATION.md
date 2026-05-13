# VivaAI - Agentic AI Study Agent: Complete Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Agentic AI Principles Applied](#agentic-ai-principles-applied)
3. [Agent Execution Pipeline (Detailed)](#agent-execution-pipeline)
4. [Tool Calling & Parallelism](#tool-calling--parallelism)
5. [Reasoning-Action-Thought Loop (ReAct)](#reasoning-action-thought-loop-react)
6. [Libraries & Tools Used](#libraries--tools-used)
7. [Deployment Architecture](#deployment-architecture)
8. [Request Flow (End-to-End)](#request-flow-end-to-end)
9. [Environment Configuration](#environment-configuration)

---

## Architecture Overview

The VivaAI Study Agent is a **multi-phase agentic AI system** that performs autonomous reasoning, tool usage, web search, and synthesis to provide personalized study recommendations after a student completes an AI-powered viva (interview).

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                        │
│                  Deployed on: Vercel                              │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ GiveViva.jsx│  │VivaResults   │  │  SavedResourcesPage.jsx │ │
│  │ (Interview) │  │Page.jsx      │  │  (Persistent Storage)   │ │
│  │             │  │ (AI Agent)   │  │                         │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│         │                │                      │                 │
│         ▼                ▼                      ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Agent Orchestration Layer                       │ │
│  │  • Phase Management (init → think → search → analyze)       │ │
│  │  • Step Logging & Trace Visualization                       │ │
│  │  • Error Recovery & Fallback Logic                          │ │
│  │  • Result Caching (localStorage, 24hr TTL)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  Render Backend │  │  Groq Cloud API  │  │ Serper.dev API       │
│  (Node/Express) │  │  (LLaMA 3.3 70B) │  │ (Google Search)      │
│  • MongoDB      │  │  • Reasoning     │  │ • Web Search         │
│  • Gemini API   │  │  • Synthesis     │  │ • Video Search       │
│  • Groq API     │  │  • JSON Output   │  │ • Verified URLs      │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## Agentic AI Principles Applied

### 1. Autonomy
The agent operates **without human intervention** once triggered. It autonomously:
- Identifies weak areas from interview scores
- Decides which topics to research
- Selects appropriate search queries
- Synthesizes findings into actionable plans

### 2. Reasoning (Chain-of-Thought)
The agent demonstrates explicit reasoning at each step:
```
Step 1: "Processing 9 questions and answers from your session"
Step 2: "Performance breakdown: 3 excellent, 4 moderate, 2 needs improvement"
Step 3: "Identified 2 knowledge gap(s): 'CNN vs MLP differences', 'RAG pipeline architecture'"
Step 4: "Mapping knowledge gaps to learning objectives and study topics..."
Step 5: "Key topics to research: 'CNN vs MLP neural networks', 'RAG pipeline FAISS'"
```

### 3. Tool Usage (Function Calling)
The agent uses **multiple tools** to gather information:

| Tool | Purpose | API |
|------|---------|-----|
| `searchWithSerper()` | Web search for articles/docs | Serper.dev Google Search API |
| `searchYouTube()` | Video tutorial search | Serper.dev Video Search API |
| `buildSearchFallbackLinks()` | Fallback URL generation | Internal logic |
| `Groq LLM Call` | AI reasoning & synthesis | Groq Cloud (LLaMA 3.3 70B) |

### 4. Observation-Action Loop
The agent follows a strict **Observe → Think → Act → Observe** cycle:

```
OBSERVE: Student scored 3/10 on "Explain RAG pipeline architecture"
THINK:   "This is a weak area - need to find resources on RAG pipelines"
ACT:     Execute searchWithSerper("RAG pipeline tutorial guide explanation")
OBSERVE: Found 4 results from towardsdatascience.com, medium.com, youtube.com
THINK:   "These are relevant. Also need video content for visual learning."
ACT:     Execute searchYouTube("RAG pipeline FAISS tutorial explained")
OBSERVE: Found 3 video tutorials
ACT:     Send all data to LLaMA 3.3 for synthesis
OBSERVE: Received structured improvement plan
```

### 5. Parallel Tool Execution
The agent executes **multiple search queries in sequence with overlap**:
```javascript
// Parallel-like execution: multiple queries dispatched per topic
for (let i = 0; i < Math.min(topicsToStudy.length, 4); i++) {
  const webResults = await searchWithSerper(searchQuery, 4);  // Web articles
}
const vids = await searchYouTube(mainVideoQuery);  // Concurrent video search
```

### 6. Memory & Caching
The agent implements **short-term and long-term memory**:
- **Short-term**: Step trace maintained in React state during execution
- **Long-term**: Results cached in `localStorage` with 24-hour TTL
- **Persistent**: Save All stores complete agent output in saved resources

```javascript
const ANALYSIS_CACHE_KEY = 'vivaai_analysis_cache';
// Cache with 24hr TTL to avoid redundant API calls
if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) return entry.data;
```

### 7. Structured Output (JSON Schema Enforcement)
The agent enforces strict **output schema** from the LLM:
```json
{
  "summary": "4-6 sentence assessment",
  "questionInsights": [{ "questionIndex", "feedback", "studyTip", "keyConceptsMissed" }],
  "resources": [{ "title", "url", "type", "relevance", "difficulty" }],
  "improvementPlan": [{ "priority", "topic", "action", "timeEstimate", "expectedOutcome" }],
  "strengths": ["detailed strength descriptions"],
  "weeklyPlan": { "week1": "...", "week2": "...", "week3": "..." }
}
```

### 8. Error Recovery & Graceful Degradation
The agent handles failures gracefully:
- If Serper API is unavailable → generates curated search links as fallback
- If Groq API fails → displays error with retry option
- If JSON parsing fails → wraps raw content into structured format
- If no weak areas found → analyzes all questions instead

---

## Agent Execution Pipeline

### Phase 1: Initialization (Agent Boot)
```
[0.0s] Initializing AI Study Agent...
[0.6s] Loading interview context: "Machine Learning Viva"
[1.1s] Processing 9 questions and answers from your session
```
- Loads result data from MongoDB via backend API
- Parses evaluation scores for each question
- Categorizes questions into strong/moderate/weak

### Phase 2: Deep Analysis (Reasoning Phase)
```
[1.5s] Performing deep analysis of your interview responses...
[2.2s] Performance breakdown: 3 excellent, 4 moderate, 2 needs improvement
[2.7s] Average score: 6.4/10 — Overall mark: 5.80/10
[3.2s] Identified 2 knowledge gap(s): "CNN architecture", "RAG pipeline"
[3.8s] Mapping knowledge gaps to learning objectives and study topics...
[4.4s] Key topics to research: "CNN architecture layers", "RAG FAISS pipeline"
```

**Reasoning Logic:**
```javascript
const weakAreas = questions.filter(q => (q.score || 0) < 6);
const mediumAreas = questions.filter(q => (q.score || 0) >= 6 && (q.score || 0) < 8);
const strongAreas = questions.filter(q => (q.score || 0) >= 8);

// Extract learning topics from question text
const topicsToStudy = weakAreas.map(w =>
  w.q.replace(/^(what|how|explain|describe|define)\s+(is|are|the|a)?\s*/i, '')
    .substring(0, 60)
);
```

### Phase 3: Web Search (Tool Calling Phase)
```
[4.8s] Connecting to Google Search API (Serper.dev)...
[5.3s] Executing 5 search queries across web and video...
[5.6s] [1/4] Searching: "CNN architecture layers tutorial guide explanation"
[6.4s] Found 4 results — towardsdatascience.com, medium.com, geeksforgeeks.org
[6.8s] [2/4] Searching: "RAG FAISS pipeline tutorial guide explanation"
[7.5s] Found 4 results — pinecone.io, langchain.com, youtube.com
[8.2s] Searching for video tutorials on YouTube...
[9.0s] Found 3 video tutorials: "CNN Explained Simply", "RAG Pipeline Tutorial"
[9.3s] Total: 8 web results + 3 videos collected
[9.8s] Verifying and validating all collected resource URLs...
[10.3s] 11 verified resources ready for AI analysis
```

**Search Tool Implementation:**
```javascript
const searchWithSerper = async (query, numResults = 5) => {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: numResults }),
  });
  const data = await response.json();
  return (data.organic || []).map(r => ({
    title: r.title, url: r.link, snippet: r.snippet,
    domain: new URL(r.link).hostname.replace('www.', ''),
  }));
};
```

### Phase 4: AI Synthesis (LLM Reasoning Phase)
```
[10.7s] Sending performance data and resources to LLaMA 3.3 70B via Groq...
[11.2s] Generating comprehensive performance assessment...
[11.6s] Creating personalized study plan with prioritized topics...
[12.0s] Mapping search results to specific question weaknesses...
[14.5s] Receiving AI response and parsing structured insights...
[15.0s] Structuring response into actionable sections...
```

**LLM Call (Groq API):**
```javascript
const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert AI Study Agent...' },
      { role: 'user', content: prompt }  // Contains: scores + questions + search results
    ],
    temperature: 0.7,
    max_tokens: 4000,
  }),
});
```

### Phase 5: Result Synthesis & Caching
```
[15.5s] Analysis complete. 10 resources, 5 improvement steps, 9 question insights generated.
[15.8s] Agent finished in 16s — Results ready
```

- Merges Serper search results with AI-suggested resources
- Prioritizes verified URLs over AI-generated ones
- Caches complete output in localStorage
- Renders structured UI with expandable sections

---

## Tool Calling & Parallelism

### Tool Registry
| Tool Name | Input | Output | Latency |
|-----------|-------|--------|---------|
| `searchWithSerper(query, num)` | Search query string | Array of `{title, url, snippet, domain}` | ~800ms |
| `searchYouTube(query)` | Video search query | Array of `{title, url, duration, domain}` | ~600ms |
| `buildSearchFallbackLinks(topics)` | Topic strings | Array of curated search URLs | <1ms |
| `Groq LLM (llama-3.3-70b)` | Full prompt with context | Structured JSON response | ~3-5s |

### Execution Pattern
```
┌────────────────────────────────────────────────────────────────┐
│ Phase 3: Tool Calls (Sequential with Batching)                  │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Search Query 1 ──────►  [Web Results 1]                        │
│  Search Query 2 ──────►  [Web Results 2]                        │
│  Search Query 3 ──────►  [Web Results 3]                        │
│  Search Query 4 ──────►  [Web Results 4]                        │
│  Video Search   ──────►  [Video Results]                        │
│                                                                  │
│  All results aggregated ──► Passed to Phase 4 (LLM)            │
├────────────────────────────────────────────────────────────────┤
│ Phase 4: LLM Synthesis (Single Call with Full Context)           │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Interview Data] + [Search Results] + [Video Results]          │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  LLaMA 3.3 70B (via Groq API)                          │    │
│  │  • Analyzes each question individually                  │    │
│  │  • Maps resources to weaknesses                         │    │
│  │  • Generates improvement plan                           │    │
│  │  • Creates 3-week study schedule                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  Structured JSON Output (summary, insights, resources, plan)    │
└────────────────────────────────────────────────────────────────┘
```

---

## Reasoning-Action-Thought Loop (ReAct)

The agent implements the **ReAct (Reasoning + Acting)** paradigm:

### Iteration 1: Problem Identification
```
THOUGHT: "Student scored 3/10 on Q4 about CNN architecture. This indicates a fundamental gap."
ACTION: Classify as weak area, extract topic "CNN architecture"
OBSERVATION: Topic added to research queue
```

### Iteration 2: Information Gathering
```
THOUGHT: "Need authoritative resources on CNN architecture for this student's level"
ACTION: Call searchWithSerper("CNN architecture layers tutorial guide explanation", 4)
OBSERVATION: Found results from towardsdatascience.com, analyticsvidhya.com
```

### Iteration 3: Knowledge Synthesis
```
THOUGHT: "Have 11 verified resources. Need to create a personalized plan connecting specific weaknesses to specific resources."
ACTION: Call Groq LLM with full context (questions + scores + search results)
OBSERVATION: Received structured JSON with per-question feedback, mapped resources, and weekly plan
```

### Iteration 4: Output Validation
```
THOUGHT: "Verify AI didn't hallucinate URLs. Prioritize URLs from actual search results."
ACTION: Cross-reference AI resource URLs with Serper results, flag unverified ones
OBSERVATION: 8/10 resources are verified from search, 2 are AI-suggested
```

---

## Libraries & Tools Used

### Frontend (React Application)
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| Material-UI (MUI) | 5.x | UI component library |
| Redux Toolkit | 1.9.x | Global state management |
| RTK Query | Built-in | API data fetching & caching |
| Axios | 1.7.x | HTTP client for backend API |
| React Router DOM | 6.x | Client-side routing |
| Framer Motion | 10.x | Animations |

### Backend (Node.js Server)
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4.21.x | HTTP server framework |
| Mongoose | 8.10.x | MongoDB ODM |
| @google/generative-ai | 0.21.x | Google Gemini API client |
| Axios | 1.7.x | HTTP client (Groq API calls) |
| pdf-parse | 1.1.1 | PDF text extraction from resumes |
| Multer | 1.4.5 | File upload handling |
| bcryptjs | 2.4.x | Password hashing |
| jsonwebtoken | 9.0.x | JWT authentication |
| cors | 2.8.x | Cross-origin resource sharing |
| dotenv | 16.4.x | Environment variable management |
| Cloudinary | 2.5.x | Image/file cloud storage |

### External AI/Search APIs
| Service | Model/Endpoint | Purpose |
|---------|---------------|---------|
| Groq Cloud | `llama-3.3-70b-versatile` | LLM reasoning, question generation, evaluation |
| Google Gemini | `gemini-2.5-flash` | PDF analysis, viva evaluation, resume scanning |
| Serper.dev | Google Search API | Real-time web search for study resources |
| Serper.dev | Video Search API | YouTube video discovery |

---

## Deployment Architecture

### Frontend — Vercel
```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                          │
│  URL: https://major-project-sem-8.vercel.app                │
├─────────────────────────────────────────────────────────────┤
│  Build: npm run build (Vite)                                 │
│  Output: dist/ (static SPA)                                  │
│  Framework: React (Vite)                                     │
│                                                              │
│  Environment Variables:                                      │
│  ├─ VITE_BACKEND_URL = https://viva-backend-ezk4.onrender.com│
│  ├─ VITE_GROQ_API_KEY = gsk_...                             │
│  ├─ VITE_SERPER_API_KEY = (for Google search)               │
│  ├─ VITE_CLOUDINARY_CLOUD_NAME = dxor5y4pf                  │
│  └─ VITE_UPLOAD_PRESET = ChitChat-app-file                  │
│                                                              │
│  Auto-deploy: Connected to GitHub main branch               │
│  CDN: Vercel Edge Network (global)                          │
└─────────────────────────────────────────────────────────────┘
```

### Backend — Render
```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER (Backend)                           │
│  URL: https://viva-backend-ezk4.onrender.com                │
├─────────────────────────────────────────────────────────────┤
│  Runtime: Node.js 22.x                                       │
│  Start: node index.js                                        │
│  Type: Web Service (Free tier)                              │
│                                                              │
│  Environment Variables:                                      │
│  ├─ MONGO_URI = mongodb+srv://...                           │
│  ├─ GEMINI_API_KEY = (Google AI Studio key)                 │
│  ├─ GROQ_API_KEY = gsk_...                                  │
│  ├─ JWT_SECRET = (auth token signing)                       │
│  ├─ Frontend_URL = https://major-project-sem-8.vercel.app   │
│  └─ CLOUDINARY_* = (image upload config)                    │
│                                                              │
│  Auto-deploy: Connected to GitHub main branch               │
│  Cold Start: ~30-60s (free tier spins down after inactivity)│
│  Ephemeral Storage: Files deleted on redeploy               │
└─────────────────────────────────────────────────────────────┘
```

### Database — MongoDB Atlas
```
┌─────────────────────────────────────────────────────────────┐
│                  MongoDB Atlas (Cloud)                        │
├─────────────────────────────────────────────────────────────┤
│  Cluster: Shared (M0 Free Tier)                             │
│  Region: AWS Mumbai (ap-south-1)                            │
│                                                              │
│  Collections:                                                │
│  ├─ users (student/teacher accounts, auth)                  │
│  ├─ vivas (interview configs, questions, resume data)       │
│  ├─ vivaresults (scores, evaluations, proctoring data)      │
│  ├─ classes (class management, enrollments)                 │
│  └─ ... (other collections)                                 │
│                                                              │
│  Key Schema: Viva.resumeSubmissions[] stores:               │
│  ├─ resumeText (extracted PDF content, persists forever)    │
│  ├─ questionAnswerSet (AI-generated 3/3/3 questions)        │
│  └─ preparedByTeacher (approval gate for student)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow (End-to-End)

### Flow 1: Student Uploads Resume → Questions Generated
```
Student Browser                    Vercel (Frontend)           Render (Backend)           Groq/Gemini
     │                                   │                          │                        │
     │──POST /viva/upload-resume──────────────────────────────────►│                        │
     │  (multipart: PDF file + studentId)                          │                        │
     │                                                              │──pdf-parse(buffer)─►│  │
     │                                                              │◄─resumeText (4000ch)│  │
     │                                                              │                        │
     │                                                              │──POST /v1/chat/completions──►│
     │                                                              │  (resumeText + prompt)       │
     │                                                              │◄─9 questions JSON────────────│
     │                                                              │                        │
     │                                                              │──MongoDB.save()──────►│  │
     │                                                              │  (resumeText + questions)    │
     │◄─201 {questionsGenerated: 9}────────────────────────────────│                        │
```

### Flow 2: AI Study Agent Execution
```
Student Browser                    Serper.dev              Groq Cloud (LLaMA 3.3)
     │                                │                          │
     │──[Click "Run AI Agent"]         │                          │
     │                                 │                          │
     │──Phase 1: Init (local)          │                          │
     │──Phase 2: Reasoning (local)     │                          │
     │                                 │                          │
     │──Phase 3: Search────────────────►│                          │
     │  POST /search {q: topic1}       │                          │
     │◄─{organic: [{title,link}...]}───│                          │
     │                                 │                          │
     │──POST /search {q: topic2}───────►│                          │
     │◄─{organic: [...]}───────────────│                          │
     │                                 │                          │
     │──POST /videos {q: topics}───────►│                          │
     │◄─{videos: [...]}────────────────│                          │
     │                                 │                          │
     │──Phase 4: Synthesis─────────────────────────────────────────►│
     │  POST /v1/chat/completions                                  │
     │  {model: "llama-3.3-70b-versatile",                         │
     │   messages: [system_prompt, full_context_with_search_results]}│
     │◄─{choices: [{message: {content: JSON}}]}────────────────────│
     │                                 │                          │
     │──Phase 5: Cache & Render        │                          │
     │  localStorage.setItem(cache)    │                          │
     │  Render UI with insights        │                          │
```

### Flow 3: Viva Interview Execution
```
Student Browser              Render Backend              Gemini API / Groq API
     │                            │                           │
     │──GET /viva/getOneViva/{id}─►│                           │
     │  ?studentId=xxx            │──MongoDB.findById()       │
     │◄─{questionAnswerSet,       │  (check preparedByTeacher)│
     │   isPersonalizedQuestionSet│                           │
     │   numberOfQuestionsToAsk:9}│                           │
     │                            │                           │
     │──[Student answers Q1]      │                           │
     │──POST /viva/send-to-gemini─►│                           │
     │  (audio WAV + question +   │──Gemini: transcribe+eval──►│
     │   model answer)            │◄─{transcript, evaluation}──│
     │◄─{transcript, evaluation}──│                           │
     │                            │                           │
     │──[Repeat for Q2...Q9]      │                           │
     │                            │                           │
     │──POST /vivaresult/add──────►│                           │
     │  (all 9 Q&A + scores +     │──MongoDB.save()           │
     │   proctoring feedback)     │                           │
     │◄─{success: true}───────────│                           │
```

---

## Environment Configuration

### Frontend (.env)
```env
VITE_BACKEND_URL=https://viva-backend-ezk4.onrender.com
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxx
VITE_SERPER_API_KEY=xxxxxxxxxxxxx
VITE_CLOUDINARY_CLOUD_NAME=dxor5y4pf
VITE_UPLOAD_PRESET=ChitChat-app-file
```

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
JWT_SECRET=your_jwt_secret
Frontend_URL=https://major-project-sem-8.vercel.app
```

---

## Summary: Why This is Agentic AI

| Agentic Property | Implementation |
|-----------------|----------------|
| **Autonomy** | Agent runs independently once triggered, no human guidance needed during execution |
| **Reasoning** | Explicit chain-of-thought: identify weak areas → extract topics → plan searches |
| **Tool Use** | 4 external tools: Serper Web Search, Serper Video Search, Groq LLM, Fallback Generator |
| **Planning** | Multi-phase execution plan: Init → Think → Search → Analyze → Synthesize |
| **Memory** | Short-term (step trace), Long-term (24hr cache), Persistent (saved resources) |
| **Observation** | Processes tool outputs (search results) and adapts behavior based on findings |
| **Structured Output** | Enforces JSON schema on LLM output for reliable UI rendering |
| **Error Recovery** | Graceful degradation: API failure → fallback links; Parse error → raw content wrap |
| **Transparency** | Full agent trace visible to user (thinking steps, search queries, timing) |
| **Persistence** | Complete agent output (reasoning + resources + plan) saved for future reference |

---

*Generated for VivaAI - AI-Powered Interview & Study Platform*
*Architecture: React (Vercel) + Node.js/Express (Render) + MongoDB Atlas + Groq + Gemini + Serper*
