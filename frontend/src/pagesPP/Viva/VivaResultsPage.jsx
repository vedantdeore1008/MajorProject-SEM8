import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Paper, Card, CardContent, Chip, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, LinearProgress, Stack, Button, Avatar, Divider
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

const API = import.meta.env.VITE_BACKEND_URL;

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
