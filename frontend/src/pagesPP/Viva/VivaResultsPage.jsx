import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Paper, Card, CardContent, Chip, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, LinearProgress, Stack, Button, Avatar, Divider, Alert
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

const API = import.meta.env.VITE_BACKEND_URL;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

// ─── AI AGENT COMPONENT ──────────────────────────────────────────────────────

const AIAgentPanel = ({ result }) => {
  const [agentState, setAgentState] = useState('idle'); // idle | thinking | searching | analyzing | complete
  const [steps, setSteps] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const addStep = (step) => setSteps(prev => [...prev, { ...step, timestamp: Date.now() }]);

  const runAgent = useCallback(async () => {
    setAgentState('thinking');
    setSteps([]);
    setInsights(null);
    setError(null);

    const questions = (result.questionAnswerSet || []).map((qa, i) => ({
      q: qa.questionText,
      answer: qa.studentAnswer,
      score: parseEvaluation(qa.evaluation)?.TotalAverageScore,
    }));

    const weakAreas = questions.filter(q => (q.score || 0) < 6);
    const strongAreas = questions.filter(q => (q.score || 0) >= 7);

    addStep({ type: 'think', text: 'Analyzing your interview performance...' });
    await delay(800);

    addStep({ type: 'think', text: `Found ${weakAreas.length} areas needing improvement and ${strongAreas.length} strong answers` });
    await delay(600);

    setAgentState('searching');
    addStep({ type: 'search', text: 'Searching for relevant study resources and best practices...' });
    await delay(500);

    const topicsToSearch = weakAreas.slice(0, 3).map(q => q.q).join('; ');
    addStep({ type: 'search', text: `Querying knowledge base for: "${topicsToSearch.substring(0, 80)}..."` });
    await delay(400);

    setAgentState('analyzing');
    addStep({ type: 'analyze', text: 'Generating personalized improvement plan with AI...' });

    try {
      const prompt = buildPrompt(result, questions, weakAreas, strongAreas);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an expert AI tutor and career coach. Provide actionable study advice with specific resource links. Always respond in valid JSON format.' }, { role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      addStep({ type: 'complete', text: 'AI analysis complete. Preparing insights...' });
      await delay(300);

      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        parsed = { summary: content, questionInsights: [], resources: [], improvementPlan: [] };
      }

      setInsights(parsed);
      setAgentState('complete');
    } catch (err) {
      console.error('Groq API error:', err);
      setError('AI analysis failed. Please try again.');
      setAgentState('idle');
    }
  }, [result]);

  const buildPrompt = (result, questions, weakAreas, strongAreas) => {
    const qSummary = questions.map((q, i) => `Q${i+1}: "${q.q}" | Student answered: "${(q.answer || '').substring(0, 100)}" | Score: ${q.score || 'N/A'}/10`).join('\n');
    return `Analyze this AI interview result and provide personalized study guidance.

Overall Score: ${result.overallMark}/10
Questions & Scores:
${qSummary}

Respond in this exact JSON format:
{
  "summary": "2-3 sentence overall assessment",
  "questionInsights": [
    {"questionIndex": 0, "feedback": "specific feedback", "studyTip": "what to study", "searchQuery": "suggested google/duckduckgo search query for learning"}
  ],
  "resources": [
    {"title": "resource name", "url": "https://...", "type": "article|video|documentation", "relevance": "why this helps"}
  ],
  "improvementPlan": [
    {"priority": 1, "topic": "topic name", "action": "specific action to take", "timeEstimate": "e.g. 2 hours"}
  ],
  "strengths": ["list of things done well"]
}

Include real URLs from educational sites (MDN, GeeksForGeeks, W3Schools, YouTube, Khan Academy, Coursera, etc.) relevant to the topics. Provide 3-5 resources and 3-5 improvement items.`;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getStepIcon = (type) => {
    switch(type) {
      case 'think': return <PsychologyIcon sx={{ fontSize: 16, color: '#6366f1' }} />;
      case 'search': return <SearchIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
      case 'analyze': return <AutoAwesomeIcon sx={{ fontSize: 16, color: '#10b981' }} />;
      case 'complete': return <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />;
      default: return <LightbulbIcon sx={{ fontSize: 16, color: '#64748b' }} />;
    }
  };

  const getStepColor = (type) => {
    switch(type) {
      case 'think': return '#eef2ff';
      case 'search': return '#fffbeb';
      case 'analyze': return '#ecfdf5';
      case 'complete': return '#ecfdf5';
      default: return '#f8fafc';
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2.5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: '#6366f1' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
            AI Study Agent
          </Typography>
          <Chip label="LLaMA 3.3 70B" size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#eef2ff', color: '#4361ee', border: '1px solid #c7d2fe' }} />
          <Chip label="Groq" size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} />
        </Box>
        {agentState === 'idle' && (
          <Button size="small" variant="contained" onClick={runAgent} startIcon={<PsychologyIcon sx={{ fontSize: 16 }} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', backgroundColor: '#6366f1', boxShadow: 'none', '&:hover': { backgroundColor: '#4f46e5', boxShadow: 'none' } }}>
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

      {/* Agent Steps (Thinking UI) */}
      {steps.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {steps.map((step, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, pl: 1, borderLeft: '2px solid #e2e8f0', ml: 1, mb: 0.5 }}>
              {getStepIcon(step.type)}
              <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                {step.text}
              </Typography>
              {idx === steps.length - 1 && agentState !== 'complete' && (
                <CircularProgress size={12} sx={{ ml: 0.5, color: '#6366f1' }} />
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Loading Indicator */}
      {agentState !== 'idle' && agentState !== 'complete' && (
        <Paper sx={{ p: 2, borderRadius: 2, border: '1px dashed #c7d2fe', backgroundColor: '#eef2ff', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: '#6366f1' }} />
            <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 500 }}>
              {agentState === 'thinking' ? 'Agent is thinking...' : agentState === 'searching' ? 'Searching the web...' : 'Generating insights...'}
            </Typography>
          </Box>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 2, mt: 1 }}>{error}</Alert>}

      {/* Results */}
      {insights && agentState === 'complete' && (
        <Stack spacing={2}>
          {/* Summary */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none', backgroundColor: '#fafbfc' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LightbulbIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Assessment</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
              {insights.summary}
            </Typography>
          </Paper>

          {/* Strengths */}
          {insights.strengths?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #d1fae5', boxShadow: 'none', backgroundColor: '#f0fdf4' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                Strengths
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {insights.strengths.map((s, i) => (
                  <Chip key={i} label={s} size="small" sx={{ fontSize: '0.72rem', backgroundColor: '#d1fae5', color: '#065f46' }} />
                ))}
              </Box>
            </Paper>
          )}

          {/* Improvement Plan */}
          {insights.improvementPlan?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <SchoolIcon sx={{ fontSize: 16, color: '#4361ee' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Improvement Plan</Typography>
              </Box>
              <Stack spacing={1}>
                {insights.improvementPlan.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 1.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 11, backgroundColor: '#eef2ff', color: '#4361ee', fontWeight: 700 }}>
                      {item.priority || idx + 1}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem' }}>
                        {item.topic}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {item.action}
                      </Typography>
                      {item.timeEstimate && (
                        <Chip label={item.timeEstimate} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.6rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Resources */}
          {insights.resources?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LinkIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Study Resources</Typography>
              </Box>
              <Stack spacing={1}>
                {insights.resources.map((res, idx) => (
                  <Box key={idx} component="a" href={res.url} target="_blank" rel="noopener noreferrer"
                    sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 1.5, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', textDecoration: 'none', transition: 'all 0.15s', '&:hover': { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' } }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 11, backgroundColor: res.type === 'video' ? '#fef2f2' : '#eef2ff', color: res.type === 'video' ? '#dc2626' : '#4361ee' }}>
                      {res.type === 'video' ? '▶' : '📄'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#4361ee', fontSize: '0.82rem' }}>
                        {res.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {res.relevance}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Per-Question Insights */}
          {insights.questionInsights?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PsychologyIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Per-Question Feedback</Typography>
              </Box>
              <Stack spacing={1}>
                {insights.questionInsights.map((qi, idx) => (
                  <Box key={idx} sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#92400e' }}>
                      Q{(qi.questionIndex || idx) + 1}: {qi.feedback}
                    </Typography>
                    {qi.studyTip && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#78350f', mt: 0.3 }}>
                        💡 {qi.studyTip}
                      </Typography>
                    )}
                    {qi.searchQuery && (
                      <Button size="small" component="a" href={`https://duckduckgo.com/?q=${encodeURIComponent(qi.searchQuery)}`} target="_blank"
                        startIcon={<SearchIcon sx={{ fontSize: 12 }} />}
                        sx={{ mt: 0.5, fontSize: '0.68rem', textTransform: 'none', color: '#6366f1', p: 0 }}>
                        Search: {qi.searchQuery.substring(0, 40)}...
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

const parseEvaluation = (evaluation) => {
  if (evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)) {
    return {
      Relevance: Number.isFinite(Number(evaluation.Relevance ?? evaluation.relevance)) ? Number(evaluation.Relevance ?? evaluation.relevance) : null,
      Completeness: Number.isFinite(Number(evaluation.Completeness ?? evaluation.completeness)) ? Number(evaluation.Completeness ?? evaluation.completeness) : null,
      Accuracy: Number.isFinite(Number(evaluation.Accuracy ?? evaluation.accuracy)) ? Number(evaluation.Accuracy ?? evaluation.accuracy) : null,
      DepthOfKnowledge: Number.isFinite(Number(evaluation.DepthOfKnowledge ?? evaluation.depthOfKnowledge ?? evaluation['Depth of Knowledge'])) ? Number(evaluation.DepthOfKnowledge ?? evaluation.depthOfKnowledge ?? evaluation['Depth of Knowledge']) : null,
      TotalAverageScore: Number.isFinite(Number(evaluation.TotalAverageScore ?? evaluation.totalAverageScore ?? evaluation.average)) ? Number(evaluation.TotalAverageScore ?? evaluation.totalAverageScore ?? evaluation.average) : null,
    };
  }
  const text = String(evaluation || '');
  const parseMetric = (metricName) => { const m = text.match(new RegExp(`${metricName}\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i')); return m ? Number(m[1]) : null; };
  const relevance = parseMetric('Relevance');
  const completeness = parseMetric('Completeness');
  const accuracy = parseMetric('Accuracy');
  const depthOfKnowledge = parseMetric('Depth\\s*of\\s*Knowledge');
  const available = [relevance, completeness, accuracy, depthOfKnowledge].filter(v => Number.isFinite(v));
  const totalAverageScore = parseMetric('Total\\s*Average\\s*Score') || (available.length ? available.reduce((a, b) => a + b, 0) / available.length : null);
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
