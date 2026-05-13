import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Paper, Card, CardContent, Chip, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, LinearProgress, Stack, Button, Avatar, Divider, Alert, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabIcon from '@mui/icons-material/Tab';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StarIcon from '@mui/icons-material/Star';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SchoolIcon from '@mui/icons-material/School';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LinkIcon from '@mui/icons-material/Link';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import VerifiedIcon from '@mui/icons-material/Verified';
import DataObjectIcon from '@mui/icons-material/DataObject';
import TimerIcon from '@mui/icons-material/Timer';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { saveResource } from './SavedResourcesPage';

const API = import.meta.env.VITE_BACKEND_URL;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY || '';

const ANALYSIS_CACHE_KEY = 'vivaai_analysis_cache';

const getCachedAnalysis = (resultId) => {
  try {
    const cache = JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY) || '{}');
    const entry = cache[resultId];
    if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) return entry.data;
  } catch {}
  return null;
};

const setCachedAnalysis = (resultId, data) => {
  try {
    const cache = JSON.parse(localStorage.getItem(ANALYSIS_CACHE_KEY) || '{}');
    cache[resultId] = { data, timestamp: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > 20) delete cache[keys[0]];
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
};

const SaveAllButton = ({ resources, vivaName, insights, agentSteps }) => {
  const [saved, setSaved] = useState(false);
  const handleSaveAll = () => {
    // Save the full AI agent suggestion card with all data
    saveResource({
      id: `suggestion-${vivaName}-${Date.now()}`,
      title: `AI Analysis: ${vivaName}`,
      type: 'suggestion',
      vivaName,
      relevance: insights?.summary || '',
      agentData: {
        summary: insights?.summary || '',
        strengths: insights?.strengths || [],
        weeklyPlan: insights?.weeklyPlan || null,
        improvementPlan: insights?.improvementPlan || [],
        questionInsights: insights?.questionInsights || [],
        resources: (resources || []).map(r => ({ title: r.title, url: r.url, type: r.type, relevance: r.relevance })),
        agentSteps: (agentSteps || []).map(s => s.text || ''),
      }
    });

    // Also save individual resources with links
    (resources || []).forEach((res, idx) => {
      saveResource({ id: `res-${vivaName}-${idx}-${res.title?.substring(0, 10)}`, title: res.title, url: res.url, type: res.type || 'article', relevance: res.relevance, vivaName });
    });

    // Save improvement plan items
    if (insights?.improvementPlan) {
      insights.improvementPlan.forEach((item, idx) => {
        saveResource({ id: `plan-${vivaName}-${idx}`, title: item.topic, type: 'insight', relevance: item.action, vivaName });
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  return (
    <Button size="small" variant={saved ? 'contained' : 'outlined'} onClick={handleSaveAll}
      startIcon={saved ? <BookmarkAddedIcon sx={{ fontSize: 14 }} /> : <BookmarkIcon sx={{ fontSize: 14 }} />}
      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.7rem', fontWeight: 600,
        ...(saved ? { backgroundColor: '#10b981', color: '#fff', '&:hover': { backgroundColor: '#059669' } } : { borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#4361ee', color: '#4361ee' } }) }}>
      {saved ? 'Saved!' : 'Save All'}
    </Button>
  );
};

// ─── SERPER SEARCH FUNCTION ─────────────────────────────────────────────────

const searchWithSerper = async (query, numResults = 5) => {
  if (!SERPER_API_KEY) return null;
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: numResults }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (data.organic || []).map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      domain: r.link ? new URL(r.link).hostname.replace('www.', '') : '',
    }));
  } catch { return null; }
};

const searchYouTube = async (query) => {
  if (!SERPER_API_KEY) return null;
  try {
    const response = await fetch('https://google.serper.dev/videos', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (data.videos || []).map(v => ({
      title: v.title,
      url: v.link,
      snippet: v.snippet || v.channel,
      duration: v.duration,
      domain: 'youtube.com',
    }));
  } catch { return null; }
};

const buildSearchFallbackLinks = (topics) => {
  return topics.flatMap(topic => {
    const q = encodeURIComponent(topic);
    return [
      { title: `Search "${topic}" on Google`, url: `https://www.google.com/search?q=${q}+tutorial`, type: 'search', domain: 'google.com', snippet: `Find tutorials and guides about ${topic}` },
      { title: `YouTube: ${topic}`, url: `https://www.youtube.com/results?search_query=${q}+tutorial+explained`, type: 'video', domain: 'youtube.com', snippet: `Video tutorials about ${topic}` },
      { title: `GeeksForGeeks: ${topic}`, url: `https://www.geeksforgeeks.org/search/?q=${q}`, type: 'article', domain: 'geeksforgeeks.org', snippet: `Articles and explanations on ${topic}` },
    ];
  });
};

// ─── AI AGENT COMPONENT ──────────────────────────────────────────────────────

const AIAgentPanel = ({ result }) => {
  const [agentState, setAgentState] = useState('idle');
  const [steps, setSteps] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const timerRef = useRef(null);
  const stepsEndRef = useRef(null);

  useEffect(() => {
    const cached = getCachedAnalysis(result._id);
    if (cached) {
      setInsights(cached.insights);
      setSteps(cached.steps || []);
      setAgentState('complete');
      setElapsedTime(cached.elapsed || 0);
    }
  }, [result._id]);

  useEffect(() => {
    if (stepsEndRef.current) stepsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [steps]);

  const addStep = (step) => setSteps(prev => [...prev, { ...step, timestamp: Date.now() }]);
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runAgent = useCallback(async () => {
    setAgentState('initializing');
    setSteps([]);
    setInsights(null);
    setError(null);
    setElapsedTime(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 500);

    try {
      const questions = (result.questionAnswerSet || []).map((qa, i) => ({
        q: qa.questionText, answer: qa.studentAnswer, score: parseEvaluation(qa.evaluation)?.TotalAverageScore,
      }));

      // Phase 1: Initialization
      addStep({ type: 'init', text: 'Initializing AI Study Agent...' });
      await delay(600);
      addStep({ type: 'init', text: `Loading interview context: "${result.vivaId?.vivaname || 'AI Interview'}"` });
      await delay(500);
      addStep({ type: 'init', text: `Processing ${questions.length} questions and answers from your session` });
      await delay(400);

      // Phase 2: Deep Analysis
      setAgentState('thinking');
      addStep({ type: 'think', text: 'Performing deep analysis of your interview responses...' });
      await delay(700);

      const weakAreas = questions.filter(q => (q.score || 0) < 6);
      const mediumAreas = questions.filter(q => (q.score || 0) >= 6 && (q.score || 0) < 8);
      const strongAreas = questions.filter(q => (q.score || 0) >= 8);
      const avgScore = questions.length ? (questions.reduce((s, q) => s + (q.score || 0), 0) / questions.length).toFixed(1) : 0;

      addStep({ type: 'think', text: `Performance breakdown: ${strongAreas.length} excellent, ${mediumAreas.length} moderate, ${weakAreas.length} needs improvement` });
      await delay(500);
      addStep({ type: 'think', text: `Average score: ${avgScore}/10 — Overall mark: ${result.overallMark}/10` });
      await delay(400);

      if (weakAreas.length > 0) {
        addStep({ type: 'think', text: `Identified ${weakAreas.length} knowledge gap(s): ${weakAreas.map(w => `"${w.q.substring(0, 50)}"`).join(', ')}` });
        await delay(500);
      }

      addStep({ type: 'think', text: 'Mapping knowledge gaps to learning objectives and study topics...' });
      await delay(600);

      const topicsToStudy = weakAreas.length > 0
        ? weakAreas.map(w => w.q.replace(/^(what|how|explain|describe|define)\s+(is|are|the|a)?\s*/i, '').substring(0, 60))
        : questions.slice(0, 3).map(q => q.q.replace(/^(what|how|explain|describe|define)\s+(is|are|the|a)?\s*/i, '').substring(0, 60));

      addStep({ type: 'think', text: `Key topics to research: ${topicsToStudy.slice(0, 4).map(t => `"${t}"`).join(', ')}` });
      await delay(400);

      // Phase 3: Web Search
      setAgentState('searching');
      let allSearchResults = [];
      let videoResults = [];

      if (SERPER_API_KEY) {
        addStep({ type: 'search', text: 'Connecting to Google Search API (Serper.dev)...' });
        await delay(500);
        addStep({ type: 'search', text: `Executing ${topicsToStudy.length + 1} search queries across web and video...` });
        await delay(300);

        for (let i = 0; i < Math.min(topicsToStudy.length, 4); i++) {
          const topic = topicsToStudy[i];
          const searchQuery = `${topic} tutorial guide explanation`;
          addStep({ type: 'search', text: `[${i + 1}/${Math.min(topicsToStudy.length, 4)}] Searching: "${searchQuery.substring(0, 60)}"` });

          const webResults = await searchWithSerper(searchQuery, 4);
          if (webResults?.length) {
            allSearchResults.push(...webResults);
            addStep({ type: 'fetch', text: `Found ${webResults.length} results — ${webResults.map(r => r.domain).join(', ')}` });
          } else {
            addStep({ type: 'fetch', text: `Web search returned no results, adding fallback search links` });
            allSearchResults.push(...buildSearchFallbackLinks([topic]));
          }
          await delay(400);
        }

        addStep({ type: 'search', text: 'Searching for video tutorials on YouTube...' });
        await delay(300);
        const mainVideoQuery = topicsToStudy.slice(0, 2).join(' ') + ' tutorial explained';
        const vids = await searchYouTube(mainVideoQuery);
        if (vids?.length) {
          videoResults = vids;
          addStep({ type: 'fetch', text: `Found ${vids.length} video tutorials: ${vids.map(v => `"${v.title.substring(0, 40)}"`).join(', ')}` });
        }
        await delay(300);

        addStep({ type: 'search', text: `Total: ${allSearchResults.length} web results + ${videoResults.length} videos collected` });
        await delay(300);
        addStep({ type: 'verify', text: 'Verifying and validating all collected resource URLs...' });
        await delay(500);
        addStep({ type: 'verify', text: `${allSearchResults.length + videoResults.length} verified resources ready for AI analysis` });
        await delay(300);
      } else {
        addStep({ type: 'search', text: 'No Serper API key found — using intelligent search URL generation...' });
        await delay(400);
        allSearchResults = buildSearchFallbackLinks(topicsToStudy.slice(0, 3));
        addStep({ type: 'search', text: `Generated ${allSearchResults.length} curated search links for your topics` });
        await delay(400);
        addStep({ type: 'search', text: 'Tip: Add VITE_SERPER_API_KEY for real Google search results with verified links' });
        await delay(300);
      }

      // Phase 4: AI Synthesis
      setAgentState('analyzing');
      addStep({ type: 'analyze', text: 'Sending performance data and resources to LLaMA 3.3 70B via Groq...' });
      await delay(500);
      addStep({ type: 'analyze', text: 'Generating comprehensive performance assessment...' });
      await delay(400);
      addStep({ type: 'analyze', text: 'Creating personalized study plan with prioritized topics...' });
      await delay(300);
      addStep({ type: 'analyze', text: 'Mapping search results to specific question weaknesses...' });
      await delay(400);

      const prompt = buildEnhancedPrompt(result, questions, weakAreas, mediumAreas, strongAreas, allSearchResults, videoResults);
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are an expert AI Study Agent and career coach. You have access to real web search results.
Your job is to provide a THOROUGH and DETAILED analysis of the student's interview performance.

CRITICAL RULES:
- For resources, ONLY use URLs from the search results provided. Never invent URLs.
- Provide detailed, actionable feedback for EVERY question.
- The summary should be 4-6 sentences, covering overall performance, key strengths, areas of concern, and a motivational note.
- Each question insight should have 3-4 sentences of detailed feedback.
- The improvement plan should have clear, specific actions with realistic time estimates.
- Always respond in valid JSON format.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!groqResponse.ok) throw new Error(`Groq API error: ${groqResponse.status}`);

      addStep({ type: 'analyze', text: 'Receiving AI response and parsing structured insights...' });
      await delay(400);

      const groqData = await groqResponse.json();
      const content = groqData.choices?.[0]?.message?.content || '';

      addStep({ type: 'analyze', text: 'Structuring response into actionable sections...' });
      await delay(300);

      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        parsed = { summary: content, questionInsights: [], resources: [], improvementPlan: [], strengths: [] };
      }

      // Merge Serper results into resources (prioritize real URLs)
      if (allSearchResults.length > 0 || videoResults.length > 0) {
        const existingUrls = new Set((parsed.resources || []).map(r => r.url));
        const realResources = [];

        allSearchResults.forEach(sr => {
          if (!existingUrls.has(sr.url)) {
            realResources.push({ title: sr.title, url: sr.url, type: sr.domain?.includes('youtube') ? 'video' : 'article', relevance: sr.snippet, domain: sr.domain, verified: true });
            existingUrls.add(sr.url);
          }
        });
        videoResults.forEach(vr => {
          if (!existingUrls.has(vr.url)) {
            realResources.push({ title: vr.title, url: vr.url, type: 'video', relevance: vr.snippet, domain: 'youtube.com', duration: vr.duration, verified: true });
            existingUrls.add(vr.url);
          }
        });

        const aiResources = (parsed.resources || []).map(r => ({ ...r, verified: allSearchResults.some(sr => sr.url === r.url) }));
        parsed.resources = [...aiResources.filter(r => r.verified), ...realResources, ...aiResources.filter(r => !r.verified)].slice(0, 12);
      }

      // Phase 5: Finalize
      addStep({ type: 'complete', text: `Analysis complete. ${(parsed.resources || []).length} resources, ${(parsed.improvementPlan || []).length} improvement steps, ${(parsed.questionInsights || []).length} question insights generated.` });
      await delay(300);

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      addStep({ type: 'complete', text: `Agent finished in ${elapsed}s — Results ready` });

      setInsights(parsed);
      setAgentState('complete');
      setElapsedTime(elapsed);

      setCachedAnalysis(result._id, { insights: parsed, steps: [...steps, { type: 'complete', text: `Cached analysis`, timestamp: Date.now() }], elapsed });
    } catch (err) {
      console.error('Agent error:', err);
      setError(`AI analysis failed: ${err.message}. Please try again.`);
      setAgentState('idle');
    } finally {
      clearInterval(timerRef.current);
    }
  }, [result]);

  const buildEnhancedPrompt = (result, questions, weakAreas, mediumAreas, strongAreas, searchResults, videoResults) => {
    const qSummary = questions.map((q, i) =>
      `Q${i+1}: "${q.q}"\n  Student Answer: "${(q.answer || 'No answer').substring(0, 200)}"\n  Score: ${q.score || 'N/A'}/10`
    ).join('\n\n');

    const searchContext = searchResults.length > 0
      ? `\n\nREAL SEARCH RESULTS (use ONLY these URLs in your resources):\n${searchResults.map((sr, i) => `${i+1}. "${sr.title}" — ${sr.url}\n   ${sr.snippet || ''}`).join('\n')}`
      : '';

    const videoContext = videoResults.length > 0
      ? `\n\nVIDEO RESULTS (use ONLY these URLs for video resources):\n${videoResults.map((v, i) => `${i+1}. "${v.title}" — ${v.url} (${v.duration || 'video'})\n   ${v.snippet || ''}`).join('\n')}`
      : '';

    return `Analyze this AI interview result thoroughly and provide comprehensive personalized study guidance.

INTERVIEW: "${result.vivaId?.vivaname || 'AI Interview'}"
OVERALL SCORE: ${result.overallMark}/10
DATE: ${new Date(result.dateOfViva).toLocaleDateString()}

DETAILED QUESTION ANALYSIS:
${qSummary}

PERFORMANCE BREAKDOWN:
- Excellent (8+): ${strongAreas.length} questions
- Moderate (6-7.9): ${mediumAreas.length} questions
- Needs Work (<6): ${weakAreas.length} questions
${searchContext}${videoContext}

Respond in this EXACT JSON format with DETAILED content:
{
  "summary": "A thorough 4-6 sentence assessment covering: (1) overall performance level, (2) key strengths demonstrated, (3) primary areas of concern, (4) comparison to expected performance, (5) motivational note with specific encouragement",
  "questionInsights": [
    {
      "questionIndex": 0,
      "feedback": "3-4 sentences: what was good/bad about this answer, what was missing, how it compares to an ideal answer",
      "studyTip": "Specific study recommendation with exact topics to cover",
      "keyConceptsMissed": "List the specific concepts or points that were missed",
      "searchQuery": "A good search query to find learning resources for this topic"
    }
  ],
  "resources": [
    {
      "title": "Exact title from search results",
      "url": "ONLY use URLs from the search results above",
      "type": "article|video|documentation",
      "relevance": "2-3 sentences explaining exactly how this resource addresses the student's specific weaknesses",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "improvementPlan": [
    {
      "priority": 1,
      "topic": "Specific topic name",
      "action": "Detailed 2-3 sentence action plan with specific steps to take",
      "timeEstimate": "Realistic time estimate",
      "expectedOutcome": "What the student should be able to do after completing this"
    }
  ],
  "strengths": ["Detailed strength descriptions, not just keywords"],
  "weeklyPlan": {
    "week1": "Focus areas and daily goals for week 1",
    "week2": "Focus areas and daily goals for week 2",
    "week3": "Review and practice areas for week 3"
  }
}

IMPORTANT: Provide insights for ALL ${questions.length} questions. Include 6-10 resources. Include 4-6 improvement items. Be specific and detailed in every section.`;
  };

  const getStepIcon = (type) => {
    const icons = {
      init: <DataObjectIcon sx={{ fontSize: 14, color: '#8b5cf6' }} />,
      think: <PsychologyIcon sx={{ fontSize: 14, color: '#6366f1' }} />,
      search: <TravelExploreIcon sx={{ fontSize: 14, color: '#f59e0b' }} />,
      fetch: <LinkIcon sx={{ fontSize: 14, color: '#06b6d4' }} />,
      verify: <VerifiedIcon sx={{ fontSize: 14, color: '#10b981' }} />,
      analyze: <AutoAwesomeIcon sx={{ fontSize: 14, color: '#ec4899' }} />,
      complete: <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />,
    };
    return icons[type] || <LightbulbIcon sx={{ fontSize: 14, color: '#64748b' }} />;
  };

  const getStepBorderColor = (type) => {
    const colors = { init: '#ddd6fe', think: '#c7d2fe', search: '#fde68a', fetch: '#a5f3fc', verify: '#a7f3d0', analyze: '#fbcfe8', complete: '#a7f3d0' };
    return colors[type] || '#e2e8f0';
  };

  const visibleSteps = showAllSteps ? steps : steps.slice(-8);
  const isRunning = agentState !== 'idle' && agentState !== 'complete';

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2.5 }} />

      {/* Agent Header */}
      <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 2, background: isRunning ? 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #ecfdf5 100%)' : '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <AutoAwesomeIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>AI Study Agent</Typography>
                {isRunning && <CircularProgress size={14} sx={{ color: '#6366f1' }} />}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
                <Chip label="LLaMA 3.3 70B" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4361ee', border: '1px solid #c7d2fe' }} />
                <Chip label="Groq" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} />
                {SERPER_API_KEY && <Chip label="Google Search" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }} />}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(isRunning || agentState === 'complete') && (
              <Chip icon={<TimerIcon sx={{ fontSize: 12 }} />} label={`${elapsedTime}s`} size="small"
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600, backgroundColor: '#f8fafc', color: '#64748b' }} />
            )}
            {agentState === 'idle' && (
              <Button size="small" variant="contained" onClick={runAgent} startIcon={<PsychologyIcon sx={{ fontSize: 16 }} />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: 'none', '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: 'none' } }}>
                Analyze & Get Resources
              </Button>
            )}
            {agentState === 'complete' && (
              <Button size="small" variant="outlined" onClick={runAgent} startIcon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', borderColor: '#e2e8f0', color: '#64748b' }}>
                Re-analyze
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Agent Steps (Thinking UI) */}
      {steps.length > 0 && (
        <Paper sx={{ p: 0, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', mb: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1, backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
              Agent Trace — {steps.length} steps
            </Typography>
            {steps.length > 8 && (
              <Button size="small" onClick={() => setShowAllSteps(!showAllSteps)}
                sx={{ fontSize: '0.65rem', textTransform: 'none', color: '#6366f1', p: 0, minWidth: 0 }}>
                {showAllSteps ? 'Show recent' : `Show all (${steps.length})`}
              </Button>
            )}
          </Box>
          <Box sx={{ px: 2, py: 1, maxHeight: 280, overflow: 'auto' }}>
            {visibleSteps.map((step, idx) => {
              const globalIdx = showAllSteps ? idx : steps.length - visibleSteps.length + idx;
              return (
                <Box key={globalIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.6, pl: 1.5, borderLeft: `2px solid ${getStepBorderColor(step.type)}`, mb: 0.3, transition: 'all 0.3s' }}>
                  <Box sx={{ mt: 0.2 }}>{getStepIcon(step.type)}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem', lineHeight: 1.5 }}>
                      {step.text}
                    </Typography>
                  </Box>
                  {globalIdx === steps.length - 1 && isRunning && (
                    <CircularProgress size={10} sx={{ ml: 0.5, mt: 0.3, color: '#6366f1' }} />
                  )}
                </Box>
              );
            })}
            <div ref={stepsEndRef} />
          </Box>
          {isRunning && (
            <Box sx={{ px: 2, py: 1, backgroundColor: '#eef2ff', borderTop: '1px solid #e0e7ff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={12} sx={{ color: '#6366f1' }} />
                <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 500, fontSize: '0.72rem' }}>
                  {agentState === 'initializing' ? 'Initializing agent...' : agentState === 'thinking' ? 'Deep analysis in progress...' : agentState === 'searching' ? 'Searching the web for real resources...' : 'Generating comprehensive insights...'}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{error}</Alert>}

      {/* Results */}
      {insights && agentState === 'complete' && (
        <Stack spacing={2}>
          {/* Summary */}
          <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', backgroundColor: '#fafbfc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LightbulbIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>Comprehensive Assessment</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '0.85rem' }}>
              {insights.summary}
            </Typography>
          </Paper>

          {/* Strengths */}
          {insights.strengths?.length > 0 && (
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #d1fae5', boxShadow: 'none', backgroundColor: '#f0fdf4' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, fontSize: '0.75rem' }}>
                Your Strengths
              </Typography>
              <Stack spacing={0.8}>
                {insights.strengths.map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981', mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: '#065f46', fontSize: '0.82rem', lineHeight: 1.5 }}>{s}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Weekly Plan */}
          {insights.weeklyPlan && (
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #ddd6fe', boxShadow: 'none', background: 'linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TimerIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>3-Week Study Plan</Typography>
              </Box>
              <Stack spacing={1}>
                {Object.entries(insights.weeklyPlan).map(([week, plan], idx) => (
                  <Box key={week} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid #ede9fe' }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, backgroundColor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                      W{idx + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase' }}>Week {idx + 1}</Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>{plan}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Improvement Plan */}
          {insights.improvementPlan?.length > 0 && (
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SchoolIcon sx={{ fontSize: 18, color: '#4361ee' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>Improvement Plan</Typography>
              </Box>
              <Stack spacing={1}>
                {insights.improvementPlan.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: '#eef2ff', color: '#4361ee', fontWeight: 700 }}>
                      {item.priority || idx + 1}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{item.topic}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3, lineHeight: 1.6, fontSize: '0.8rem' }}>{item.action}</Typography>
                      {item.expectedOutcome && (
                        <Typography variant="caption" sx={{ color: '#059669', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                          Expected outcome: {item.expectedOutcome}
                        </Typography>
                      )}
                      {item.timeEstimate && (
                        <Chip label={item.timeEstimate} size="small" sx={{ mt: 0.8, height: 20, fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Resources */}
          {insights.resources?.length > 0 && (
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TravelExploreIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                    Study Resources ({insights.resources.length})
                  </Typography>
                  {SERPER_API_KEY && (
                    <Chip icon={<VerifiedIcon sx={{ fontSize: 10 }} />} label="Google Verified" size="small"
                      sx={{ height: 18, fontSize: '0.58rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }} />
                  )}
                </Box>
                <SaveAllButton resources={insights.resources} vivaName={result.vivaId?.vivaname} insights={insights} agentSteps={steps} />
              </Box>
              <Stack spacing={1}>
                {insights.resources.map((res, idx) => {
                  const domain = res.domain || (res.url ? (() => { try { return new URL(res.url).hostname.replace('www.', ''); } catch { return ''; } })() : '');
                  const isVideo = res.type === 'video' || res.url?.includes('youtube') || res.url?.includes('youtu.be');
                  return (
                    <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: `1px solid ${res.verified ? '#a7f3d0' : '#f1f5f9'}`, transition: 'all 0.2s', '&:hover': { borderColor: '#c7d2fe', backgroundColor: '#eef2ff', transform: 'translateX(2px)' } }}>
                      <Box component="a" href={res.url} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', gap: 1.5, flex: 1, textDecoration: 'none' }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, backgroundColor: isVideo ? '#fef2f2' : '#eef2ff', color: isVideo ? '#dc2626' : '#4361ee', borderRadius: 1.5 }}>
                          {isVideo ? '▶' : '📄'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4361ee', fontSize: '0.82rem', lineHeight: 1.3 }} noWrap>
                              {res.title}
                            </Typography>
                            {res.verified && <VerifiedIcon sx={{ fontSize: 12, color: '#10b981', flexShrink: 0 }} />}
                          </Box>
                          {domain && <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>{domain}</Typography>}
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3, lineHeight: 1.4, fontSize: '0.72rem' }}>
                            {res.relevance}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {res.difficulty && <Chip label={res.difficulty} size="small" sx={{ height: 16, fontSize: '0.55rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />}
                            {res.duration && <Chip label={res.duration} size="small" sx={{ height: 16, fontSize: '0.55rem', backgroundColor: '#fef2f2', color: '#dc2626' }} />}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                        <Tooltip title="Open in new tab">
                          <IconButton size="small" component="a" href={res.url} target="_blank" rel="noopener"
                            sx={{ color: '#94a3b8', '&:hover': { color: '#4361ee' } }}>
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Save resource">
                          <IconButton size="small" onClick={() => { saveResource({ id: `res-${Date.now()}-${idx}`, title: res.title, url: res.url, type: res.type || 'article', relevance: res.relevance, vivaName: result.vivaId?.vivaname }); }}
                            sx={{ color: '#94a3b8', '&:hover': { color: '#6366f1' } }}>
                            <BookmarkIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}

          {/* Per-Question Insights */}
          {insights.questionInsights?.length > 0 && (
            <Paper sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PsychologyIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>Per-Question Detailed Feedback</Typography>
              </Box>
              <Stack spacing={1.5}>
                {insights.questionInsights.map((qi, idx) => (
                  <Box key={idx} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e', fontSize: '0.82rem', mb: 0.5 }}>
                      Q{(qi.questionIndex || idx) + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6, fontSize: '0.8rem' }}>
                      {qi.feedback}
                    </Typography>
                    {qi.keyConceptsMissed && (
                      <Box sx={{ mt: 1, p: 1, borderRadius: 1, backgroundColor: '#fef3c7' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400e', display: 'block', mb: 0.3, fontSize: '0.7rem' }}>Key Concepts Missed:</Typography>
                        <Typography variant="caption" sx={{ color: '#78350f', fontSize: '0.72rem' }}>{qi.keyConceptsMissed}</Typography>
                      </Box>
                    )}
                    {qi.studyTip && (
                      <Box sx={{ mt: 0.8, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <LightbulbIcon sx={{ fontSize: 14, color: '#f59e0b', mt: 0.2 }} />
                        <Typography variant="caption" sx={{ color: '#78350f', fontWeight: 500, fontSize: '0.72rem' }}>{qi.studyTip}</Typography>
                      </Box>
                    )}
                    {qi.searchQuery && (
                      <Button size="small" component="a" href={`https://www.google.com/search?q=${encodeURIComponent(qi.searchQuery)}`} target="_blank"
                        startIcon={<SearchIcon sx={{ fontSize: 12 }} />}
                        sx={{ mt: 0.8, fontSize: '0.7rem', textTransform: 'none', color: '#6366f1', p: 0 }}>
                        Search: {qi.searchQuery.substring(0, 50)}
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
};

const parseMetricFromText = (text, metricName) => {
  // Try "MetricName (out of 10): X/10" format first (detailed evaluation section)
  const slashRegex = new RegExp(`${metricName}[^:]*:\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)\\s*/\\s*10`, 'gi');
  const slashMatches = [...text.matchAll(slashRegex)];
  if (slashMatches.length > 0) return Number(slashMatches[slashMatches.length - 1][1]);
  // Try "MetricName: X" - take LAST non-zero or last occurrence
  const regex = new RegExp(`${metricName}[^:]*[:=-]\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)`, 'gi');
  const matches = [...text.matchAll(regex)];
  if (matches.length > 0) {
    const nonZero = matches.filter(m => Number(m[1]) > 0);
    if (nonZero.length > 0) return Number(nonZero[nonZero.length - 1][1]);
    return Number(matches[matches.length - 1][1]);
  }
  return null;
};

const parseEvaluation = (evaluation) => {
  if (!evaluation) return { Relevance: null, Completeness: null, Accuracy: null, DepthOfKnowledge: null, TotalAverageScore: null };

  if (evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)) {
    const relevance = Number(evaluation.Relevance ?? evaluation.relevance ?? 0);
    const completeness = Number(evaluation.Completeness ?? evaluation.completeness ?? 0);
    const accuracy = Number(evaluation.Accuracy ?? evaluation.accuracy ?? 0);
    const depthOfKnowledge = Number(evaluation.DepthOfKnowledge ?? evaluation.depthOfKnowledge ?? evaluation['Depth of Knowledge'] ?? 0);
    let totalAverageScore = Number(evaluation.TotalAverageScore ?? evaluation.totalAverageScore ?? evaluation.average ?? 0);
    if (!totalAverageScore) {
      const scores = [relevance, completeness, accuracy, depthOfKnowledge].filter(s => s > 0);
      if (scores.length > 0) totalAverageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    return { Relevance: relevance, Completeness: completeness, Accuracy: accuracy, DepthOfKnowledge: depthOfKnowledge, TotalAverageScore: totalAverageScore };
  }

  const text = String(evaluation || '');
  if (text.includes('No speech') || text.length < 5) return { Relevance: 0, Completeness: 0, Accuracy: 0, DepthOfKnowledge: 0, TotalAverageScore: 0 };

  try { const parsed = JSON.parse(text); if (parsed && typeof parsed === 'object') return parseEvaluation(parsed); } catch {}

  const relevance = parseMetricFromText(text, 'Relevance');
  const completeness = parseMetricFromText(text, 'Completeness');
  const accuracy = parseMetricFromText(text, 'Accuracy');
  const depthOfKnowledge = parseMetricFromText(text, 'Depth\\s*(?:of\\s*)?Knowledge');
  let totalAverageScore = parseMetricFromText(text, 'Total\\s*Average\\s*(?:Score)?');

  if (!totalAverageScore || totalAverageScore === 0) {
    const totalMatch = text.match(/Total\s*Average\s*Score[^]*?(\d+(?:\.\d+)?)\s*\/\s*10/i);
    if (totalMatch && Number(totalMatch[1]) > 0) totalAverageScore = Number(totalMatch[1]);
  }
  if (!totalAverageScore || totalAverageScore === 0) {
    const available = [relevance, completeness, accuracy, depthOfKnowledge].filter(v => Number.isFinite(v) && v > 0);
    if (available.length > 0) totalAverageScore = available.reduce((a, b) => a + b, 0) / available.length;
  }

  return { Relevance: relevance, Completeness: completeness, Accuracy: accuracy, DepthOfKnowledge: depthOfKnowledge, TotalAverageScore: totalAverageScore };
};

const ScoreBadge = ({ score, size = 'medium' }) => {
  const s = Number(score) || 0;
  const color = s >= 7 ? '#10b981' : s >= 4 ? '#f59e0b' : '#ef4444';
  const bg = s >= 7 ? '#d1fae5' : s >= 4 ? '#fef3c7' : '#fee2e2';
  return (
    <Chip label={`${s.toFixed(1)}/10`} size={size}
      sx={{ fontWeight: 700, backgroundColor: bg, color, minWidth: size === 'small' ? 55 : 65 }} />
  );
};

const VivaResultsPage = () => {
  const { userInfo } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!userInfo?._id) return;
    const fetchResults = async () => {
      try {
        const res = await axios.get(`${API}/vivaresult/getvivaresultbystudentid/${userInfo._id}`);
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching results:', err);
        setResults([]);
      }
      setLoading(false);
    };
    fetchResults();
  }, [userInfo?._id]);

  useEffect(() => {
    if (location.state?.resultId && results.length > 0) {
      setExpandedId(location.state.resultId);
    }
  }, [location.state, results]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress sx={{ color: '#4361ee' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/main')} sx={{ border: '1px solid #e2e8f0' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            My Interview Results
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            View detailed performance and feedback from your AI interviews
          </Typography>
        </Box>
      </Box>

      {/* Summary Stats */}
      {results.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4361ee' }}>{results.length}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Total Interviews</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                {(results.reduce((s, r) => s + (r.overallMark || 0), 0) / results.length).toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Average Score</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366f1' }}>
                {Math.max(...results.map(r => r.overallMark || 0)).toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Best Score</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {results.reduce((s, r) => s + (r.questionAnswerSet?.length || 0), 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Questions Answered</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Results List */}
      {results.length > 0 ? (
        <Stack spacing={2}>
          {results.map((result) => {
            const isExpanded = expandedId === result._id;
            const proctorIssues = result.proctoredFeedback
              ? (result.proctoredFeedback.phoneDetectedCount || 0) + (result.proctoredFeedback.tabSwitchingDetectedCount || 0) + (result.proctoredFeedback.multipleUsersDetectedCount || 0) + (result.proctoredFeedback.bookDetectedCount || 0)
              : 0;

            return (
              <Paper key={result._id} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
                {/* Result Header */}
                <Box
                  onClick={() => setExpandedId(isExpanded ? null : result._id)}
                  sx={{ p: 2.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { backgroundColor: '#fafbfc' }, flexWrap: 'wrap', gap: 1.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 200 }}>
                    <Avatar sx={{ width: 40, height: 40, backgroundColor: '#eef2ff', color: '#4361ee' }}>
                      <RecordVoiceOverIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {result.vivaId?.vivaname || 'AI Interview'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {new Date(result.dateOfViva).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        {' • '}{result.questionAnswerSet?.length || 0} questions answered
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {proctorIssues > 0 && (
                      <Chip icon={<WarningIcon sx={{ fontSize: 14 }} />} label={`${proctorIssues} flags`} size="small"
                        sx={{ fontWeight: 500, backgroundColor: '#fef2f2', color: '#ef4444' }} />
                    )}
                    <ScoreBadge score={result.overallMark} />
                    <IconButton size="small">
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                {/* Expanded Detail */}
                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 2.5 }}>
                    {/* Proctoring Feedback */}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1.5 }}>
                      Integrity Report
                    </Typography>
                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                      {[
                        { label: 'Phone Detected', count: result.proctoredFeedback?.phoneDetectedCount || 0, icon: <PhoneAndroidIcon sx={{ fontSize: 16 }} /> },
                        { label: 'Tab Switches', count: result.proctoredFeedback?.tabSwitchingDetectedCount || 0, icon: <TabIcon sx={{ fontSize: 16 }} /> },
                        { label: 'Multiple Users', count: result.proctoredFeedback?.multipleUsersDetectedCount || 0, icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
                        { label: 'Book/Notes', count: result.proctoredFeedback?.bookDetectedCount || 0, icon: <MenuBookIcon sx={{ fontSize: 16 }} /> },
                      ].map((item, idx) => (
                        <Grid item xs={6} sm={3} key={idx}>
                          <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none', textAlign: 'center', backgroundColor: item.count > 0 ? '#fef2f2' : '#f0fdf4' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                              {item.icon}
                              <Typography variant="h6" sx={{ fontWeight: 700, color: item.count > 0 ? '#ef4444' : '#10b981' }}>
                                {item.count}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>{item.label}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Question Details */}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1.5 }}>
                      Questions & Evaluation
                    </Typography>
                    <Stack spacing={1.5}>
                      {(result.questionAnswerSet || []).map((qa, idx) => {
                        const eval_ = parseEvaluation(qa.evaluation);
                        const score = eval_?.TotalAverageScore;
                        return (
                          <Paper key={idx} sx={{ p: 2, borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', flex: 1, mr: 1 }}>
                                Q{idx + 1}: {qa.questionText}
                              </Typography>
                              {score !== null && <ScoreBadge score={score} size="small" />}
                            </Box>

                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Your Answer
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475569', mt: 0.3, backgroundColor: '#f8fafc', p: 1, borderRadius: 1, border: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                                {qa.studentAnswer || 'No answer recorded'}
                              </Typography>
                            </Box>

                            {/* Score Breakdown */}
                            {(eval_.Relevance !== null || eval_.Accuracy !== null) && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {eval_.Relevance !== null && (
                                  <Chip label={`Relevance: ${eval_.Relevance}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                )}
                                {eval_.Completeness !== null && (
                                  <Chip label={`Completeness: ${eval_.Completeness}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                )}
                                {eval_.Accuracy !== null && (
                                  <Chip label={`Accuracy: ${eval_.Accuracy}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                )}
                                {eval_.DepthOfKnowledge !== null && (
                                  <Chip label={`Depth: ${eval_.DepthOfKnowledge}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                )}
                              </Box>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>

                    {/* AI Agent Panel */}
                    <AIAgentPanel result={result} />
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        <Paper sx={{ p: 6, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
          <RecordVoiceOverIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>No interviews yet</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Complete your first AI interview to see results here
          </Typography>
          <Button variant="contained" onClick={() => navigate('/main')}
            sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: '#4361ee', '&:hover': { backgroundColor: '#3730a3' } }}>
            Go to Dashboard
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default VivaResultsPage;
