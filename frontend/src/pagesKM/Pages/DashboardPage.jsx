import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Paper,
  Stack,
  Divider,
  Chip,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import StarIcon from '@mui/icons-material/Star';

class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <Box sx={{ p: 3, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Chart unavailable</Typography></Box>;
    }
    return this.props.children;
  }
}

const API = import.meta.env.VITE_BACKEND_URL;

const COLORS = {
  primary: '#4361ee',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  viva: '#6366f1',
  quiz: '#8b5cf6',
  muted: '#64748b',
};

const StatCard = ({ icon, label, value, subtitle, color, trend }) => (
  <Card sx={{
    borderRadius: 3,
    border: '1px solid #e2e8f0',
    boxShadow: 'none',
    height: '100%',
    transition: 'all 0.2s',
    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transform: 'translateY(-2px)' },
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: `${color}12`,
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 24, color } })}
        </Box>
      </Box>
      {trend !== undefined && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(trend, 100)}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: '#f1f5f9',
              '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 2 },
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

// ─── STUDENT DASHBOARD ───────────────────────────────────────────────────────

const StudentDashboard = ({ userInfo }) => {
  const [vivaResults, setVivaResults] = useState([]);
  const [dueDates, setDueDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userInfo?._id) return;
    const fetchData = async () => {
      try {
        const [vivaRes, dueDateRes] = await Promise.all([
          axios.get(`${API}/vivaresult/getvivaresultbystudentid/${userInfo._id}`).catch(() => ({ data: [] })),
          axios.get(`${API}/dashboard/getduedate/${userInfo._id}`).catch(() => ({ data: { vivas: [], quizzes: [], assignments: [] } })),
        ]);

        const vResults = Array.isArray(vivaRes.data) ? vivaRes.data : [];
        setVivaResults(vResults);

        const combined = [
          ...(dueDateRes?.data?.vivas || []).map((item) => ({ ...item, type: 'Viva' })),
          ...(dueDateRes?.data?.quizzes || []).map((item) => ({ ...item, type: 'Quiz' })),
          ...(dueDateRes?.data?.assignments || []).map((item) => ({ ...item, type: 'Assignment' })),
        ];
        combined.sort((a, b) => new Date(a.duedate || 0) - new Date(b.duedate || 0));
        const upcoming = combined.filter((d) => new Date(d.duedate) >= new Date());
        setDueDates(upcoming);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Could not load some dashboard data');
      }
      setLoading(false);
    };
    fetchData();
  }, [userInfo?._id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const avgScore = vivaResults.length > 0
    ? (vivaResults.reduce((sum, r) => sum + (r.overallMark || 0), 0) / vivaResults.length).toFixed(1)
    : 0;

  const bestScore = vivaResults.length > 0
    ? Math.max(...vivaResults.map((r) => r.overallMark || 0))
    : 0;

  const lineChartData = [...vivaResults].slice(0, 10).reverse().map((v) => ({
    date: new Date(v.dateOfViva).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: v.overallMark || 0,
    name: v.vivaId?.vivaname || 'Viva',
  }));

  const upcomingVivas = dueDates.filter((d) => d.type === 'Viva');

  return (
    <Box>
      {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<RecordVoiceOverIcon />}
            label="Vivas Completed"
            value={vivaResults.length}
            subtitle="Total interviews taken"
            color={COLORS.viva}
            trend={Math.min(vivaResults.length * 10, 100)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            label="Average Score"
            value={`${avgScore}/10`}
            subtitle="Across all vivas"
            color={COLORS.primary}
            trend={avgScore * 10}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<StarIcon />}
            label="Best Score"
            value={`${bestScore}/10`}
            subtitle="Highest achievement"
            color={COLORS.success}
            trend={bestScore * 10}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScheduleIcon />}
            label="Upcoming Vivas"
            value={upcomingVivas.length}
            subtitle={dueDates.length > 0 ? `${dueDates.length} total tasks` : 'No pending tasks'}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Performance Trend
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Your viva scores over time
              </Typography>
              {lineChartData.length > 0 ? (
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(value, name, props) => [`${value}/10`, props.payload.name]}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={COLORS.viva}
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: COLORS.viva, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, stroke: COLORS.viva, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                    No viva results yet. Complete a viva to see your performance here.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Schedule */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Upcoming Schedule
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Pending vivas and tasks
              </Typography>
              <Stack spacing={2} sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {dueDates.length > 0 ? dueDates.slice(0, 6).map((due, idx) => (
                  <Paper key={idx} sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid #f1f5f9',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#e2e8f0', backgroundColor: '#fafbfc' },
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Chip
                          label={due.type}
                          size="small"
                          sx={{
                            mb: 0.5,
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: due.type === 'Viva' ? `${COLORS.viva}15` : `${COLORS.quiz}15`,
                            color: due.type === 'Viva' ? COLORS.viva : COLORS.quiz,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {due.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {due.classname}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {new Date(due.duedate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  </Paper>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      All caught up! No upcoming tasks.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Vivas Table */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Completed Vivas
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Your interview history and scores
              </Typography>
              {vivaResults.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Viva Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Questions</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>Integrity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vivaResults.slice(0, 10).map((result, idx) => {
                        const proctorIssues = result.proctoredFeedback
                          ? (result.proctoredFeedback.phoneDetectedCount || 0) +
                            (result.proctoredFeedback.tabSwitchingDetectedCount || 0) +
                            (result.proctoredFeedback.multipleUsersDetectedCount || 0)
                          : 0;
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafbfc' } }}>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                {result.vivaId?.vivaname || 'Viva'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {new Date(result.dateOfViva).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {result.totalQuestions}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Chip
                                label={`${result.overallMark || 0}/10`}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  backgroundColor: (result.overallMark || 0) >= 7 ? `${COLORS.success}15` : (result.overallMark || 0) >= 4 ? `${COLORS.warning}15` : `${COLORS.error}15`,
                                  color: (result.overallMark || 0) >= 7 ? COLORS.success : (result.overallMark || 0) >= 4 ? COLORS.warning : COLORS.error,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              {proctorIssues === 0 ? (
                                <Chip label="Clean" size="small" sx={{ fontWeight: 500, backgroundColor: `${COLORS.success}12`, color: COLORS.success }} />
                              ) : (
                                <Chip
                                  icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                  label={`${proctorIssues} flags`}
                                  size="small"
                                  sx={{ fontWeight: 500, backgroundColor: `${COLORS.warning}12`, color: COLORS.warning }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                    No completed vivas yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    Join a class and take your first AI interview to see results here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── TEACHER DASHBOARD ───────────────────────────────────────────────────────

const TeacherDashboard = ({ userInfo }) => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo?._id) return;
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/teacher/${userInfo._id}`);
        setDashData(res.data);
      } catch (err) {
        console.error('Teacher dashboard error:', err);
        setDashData({ classes: [], vivas: [], recentResults: [], stats: { totalClasses: 0, totalVivas: 0, totalStudents: 0, avgScore: 0, totalAttempts: 0 } });
      }
      setLoading(false);
    };
    fetchData();
  }, [userInfo?._id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const { classes = [], vivas = [], recentResults = [], stats = {} } = dashData || {};

  const scoreDistribution = recentResults.reduce((acc, r) => {
    const bucket = (r.overallMark || 0) >= 8 ? 'Excellent' : (r.overallMark || 0) >= 6 ? 'Good' : (r.overallMark || 0) >= 4 ? 'Average' : 'Needs Work';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'Excellent (8-10)', value: scoreDistribution['Excellent'] || 0, color: COLORS.success },
    { name: 'Good (6-7)', value: scoreDistribution['Good'] || 0, color: COLORS.primary },
    { name: 'Average (4-5)', value: scoreDistribution['Average'] || 0, color: COLORS.warning },
    { name: 'Needs Work (0-3)', value: scoreDistribution['Needs Work'] || 0, color: COLORS.error },
  ].filter((d) => d.value > 0);

  const vivaBarData = vivas.slice(0, 8).map((v) => ({
    name: v.vivaname?.length > 12 ? v.vivaname.substring(0, 12) + '...' : v.vivaname,
    questions: v.numberOfQuestionsToAsk,
  }));

  return (
    <Box>
      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ClassIcon />}
            label="Classes"
            value={stats.totalClasses}
            subtitle="Active classrooms"
            color={COLORS.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<RecordVoiceOverIcon />}
            label="Vivas Created"
            value={stats.totalVivas}
            subtitle="AI interviews set up"
            color={COLORS.viva}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PeopleIcon />}
            label="Students"
            value={stats.totalStudents}
            subtitle="Across all classes"
            color={COLORS.secondary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            label="Avg Score"
            value={`${stats.avgScore}/10`}
            subtitle={`${stats.totalAttempts} total attempts`}
            color={COLORS.success}
            trend={stats.avgScore * 10}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Student Results */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Recent Student Results
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Latest viva submissions from your students
              </Typography>
              {recentResults.length > 0 ? (
                <TableContainer sx={{ maxHeight: 360 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', backgroundColor: '#fafbfc' }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', backgroundColor: '#fafbfc' }}>Viva</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', backgroundColor: '#fafbfc' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', backgroundColor: '#fafbfc' }}>Score</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b', backgroundColor: '#fafbfc' }}>Integrity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentResults.map((result, idx) => {
                        const proctorIssues = result.proctoredFeedback
                          ? (result.proctoredFeedback.phoneDetectedCount || 0) +
                            (result.proctoredFeedback.tabSwitchingDetectedCount || 0) +
                            (result.proctoredFeedback.multipleUsersDetectedCount || 0) +
                            (result.proctoredFeedback.bookDetectedCount || 0)
                          : 0;
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#fafbfc' } }}>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: `${COLORS.primary}20`, color: COLORS.primary }}>
                                  {result.studentName?.[0]?.toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {result.studentName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {result.vivaId?.vivaname || 'Viva'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {new Date(result.dateOfViva).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              <Chip
                                label={`${result.overallMark || 0}/10`}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  backgroundColor: (result.overallMark || 0) >= 7 ? `${COLORS.success}15` : (result.overallMark || 0) >= 4 ? `${COLORS.warning}15` : `${COLORS.error}15`,
                                  color: (result.overallMark || 0) >= 7 ? COLORS.success : (result.overallMark || 0) >= 4 ? COLORS.warning : COLORS.error,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid #f8fafc' }}>
                              {proctorIssues === 0 ? (
                                <Chip label="Clean" size="small" sx={{ fontWeight: 500, backgroundColor: `${COLORS.success}12`, color: COLORS.success }} />
                              ) : (
                                <Chip
                                  icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                  label={`${proctorIssues} flags`}
                                  size="small"
                                  sx={{ fontWeight: 500, backgroundColor: `${COLORS.error}12`, color: COLORS.error }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#94a3b8' }}>
                    No student results yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    Create a viva and have students complete it to see results here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Score Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Score Distribution
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                How students are performing
              </Typography>
              {pieData.length > 0 ? (
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value} students`, name]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>No data yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Created Vivas List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Your Vivas
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                AI interviews you've created
              </Typography>
              <Stack spacing={1.5} sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {vivas.length > 0 ? vivas.slice(0, 8).map((viva, idx) => (
                  <Paper key={idx} sx={{
                    p: 2, borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none',
                    '&:hover': { borderColor: '#e2e8f0' },
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {viva.vivaname}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {viva.className} • {viva.numberOfQuestionsToAsk} questions
                        </Typography>
                      </Box>
                      <Chip
                        label={new Date(viva.duedate) > new Date() ? 'Active' : 'Ended'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          backgroundColor: new Date(viva.duedate) > new Date() ? `${COLORS.success}12` : '#f1f5f9',
                          color: new Date(viva.duedate) > new Date() ? COLORS.success : '#94a3b8',
                        }}
                      />
                    </Box>
                  </Paper>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>No vivas created yet</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Classes Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Your Classes
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Classrooms you manage
              </Typography>
              <Stack spacing={1.5} sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {classes.length > 0 ? classes.map((cls, idx) => (
                  <Paper key={idx} sx={{
                    p: 2, borderRadius: 2, border: '1px solid #f1f5f9', boxShadow: 'none',
                    '&:hover': { borderColor: '#e2e8f0' },
                  }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {cls.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {cls.subject || 'General'} • {cls.studentCount} students
                        </Typography>
                      </Box>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, backgroundColor: `${COLORS.secondary}15`, color: COLORS.secondary }}>
                        {cls.studentCount}
                      </Avatar>
                    </Box>
                  </Paper>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>No classes created yet</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── MAIN WRAPPER ────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { userInfo } = useSelector((state) => state.user);
  const isTeacher = userInfo?.role === 'teacher';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
          {isTeacher ? 'Teacher Dashboard' : 'Student Dashboard'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          {isTeacher
            ? 'Overview of your classes, vivas, and student performance'
            : 'Overview of your viva performance and upcoming tasks'}
        </Typography>
      </Box>

      {isTeacher ? <TeacherDashboard userInfo={userInfo} /> : <StudentDashboard userInfo={userInfo} />}
    </Box>
  );
};

export default DashboardPage;
