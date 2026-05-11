import React from 'react'
import { Box, Button, Typography, Container, Grid, Card, CardContent, Avatar, Chip, Divider } from '@mui/material'
import { motion } from 'framer-motion'
import { styled, keyframes } from '@mui/system'
import MicIcon from '@mui/icons-material/Mic'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SecurityIcon from '@mui/icons-material/Security'
import SchoolIcon from '@mui/icons-material/School'
import PsychologyIcon from '@mui/icons-material/Psychology'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PersonIcon from '@mui/icons-material/Person'
import GroupsIcon from '@mui/icons-material/Groups'
import { useNavigate } from 'react-router'

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`

const MotionBox = motion(Box)

const Home = () => {
  const navigate = useNavigate()
  const accent = '#4361ee'
  const accentLight = '#e8edff'
  const accentSoft = '#f0f4ff'

  const features = [
    { icon: <RecordVoiceOverIcon />, title: 'Voice-Cloned Questions', desc: 'LMNT TTS clones your teacher\'s voice to ask questions — authentic viva at scale.', color: '#4361ee' },
    { icon: <MicIcon />, title: 'Real-Time Speech Recognition', desc: 'Browser-native STT transcribes answers live with zero latency and visual feedback.', color: '#7209b7' },
    { icon: <PsychologyIcon />, title: 'AI Evaluation (Gemini)', desc: 'Rubric-based scoring on Relevance, Completeness, Accuracy & Depth of Knowledge.', color: '#f72585' },
    { icon: <VisibilityIcon />, title: 'Smart Proctoring', desc: 'COCO-SSD detects phones, books, multiple faces & tab-switches with timestamps.', color: '#ff6d00' },
    { icon: <AssessmentIcon />, title: 'Analytics & Reports', desc: 'Per-question breakdown, class trends, proctoring logs, and downloadable PDF reports.', color: '#00b4d8' },
    { icon: <SecurityIcon />, title: 'Integrity Checks', desc: 'Eden AI flags AI-generated responses. Teachers review proctoring evidence post-viva.', color: '#2ec4b6' },
  ]

  const steps = [
    { num: '1', title: 'Create a Classroom', desc: 'Teacher creates a class and shares the unique join code with students.', icon: <SchoolIcon /> },
    { num: '2', title: 'Upload Q&A Set', desc: 'Upload an Excel/CSV with questions and model answers for the AI interview.', icon: <SmartToyIcon /> },
    { num: '3', title: 'Student Takes Viva', desc: 'Student joins, captures face for proctoring, and starts the AI-driven viva session.', icon: <PersonIcon /> },
    { num: '4', title: 'AI Scores & Reports', desc: 'Each response is evaluated in real-time. Full analytics and transcripts are generated.', icon: <AssessmentIcon /> },
  ]

  const stats = [
    { label: 'Voice Cloning', value: 'LMNT TTS', sub: '<300ms latency' },
    { label: 'AI Model', value: 'Gemini 1.5', sub: 'Flash inference' },
    { label: 'Proctoring', value: 'COCO-SSD', sub: 'Real-time detection' },
    { label: 'RAG Pipeline', value: 'ChromaDB', sub: 'Curriculum-grounded' },
  ]

  return (
    <Box sx={{ background: '#fff', color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <Box sx={{ py: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #eee' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: accent, letterSpacing: -0.5 }}>
          Viva<span style={{ color: '#1a1a2e' }}>AI</span>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button onClick={() => navigate('/login')} sx={{ color: '#555', fontWeight: 600, textTransform: 'none', fontSize: '0.95rem' }}>Sign In</Button>
          <Button variant="contained" onClick={() => navigate('/register')} sx={{ background: accent, borderRadius: 3, px: 3, textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(67,97,238,0.3)', '&:hover': { background: '#3651d4', boxShadow: '0 6px 20px rgba(67,97,238,0.4)' } }}>
            Get Started
          </Button>
        </Box>
      </Box>

      {/* ── HERO ── */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 14 }, background: `linear-gradient(135deg, ${accentSoft} 0%, #fff 50%, #f8f0ff 100%)` }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <MotionBox initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <Chip label="AI-Powered Oral Examination" sx={{ mb: 3, background: accentLight, color: accent, fontWeight: 600, fontSize: '0.8rem', px: 1 }} />
                <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.12, mb: 3, color: '#1a1a2e', fontSize: { xs: '2rem', md: '3.2rem' } }}>
                  Transform Viva Exams<br />
                  with <span style={{ color: accent }}>Artificial Intelligence</span>
                </Typography>
                <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 400, lineHeight: 1.75, mb: 4, maxWidth: 520 }}>
                  Voice-cloned questions, real-time speech recognition, AI-powered evaluation, and computer-vision proctoring — all in one platform.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/register')}
                    sx={{ background: accent, borderRadius: 3, px: 4, py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 30px rgba(67,97,238,0.3)', '&:hover': { background: '#3651d4', transform: 'translateY(-2px)', boxShadow: '0 12px 36px rgba(67,97,238,0.4)' }, transition: 'all 0.3s' }}>
                    Start Free
                  </Button>
                  <Button variant="outlined" size="large" onClick={() => navigate('/login')}
                    sx={{ borderColor: '#d1d5db', color: '#374151', borderRadius: 3, px: 4, py: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '1rem', '&:hover': { borderColor: accent, color: accent, background: accentLight } }}>
                    Sign In
                  </Button>
                </Box>
              </MotionBox>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <MotionBox initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }}
                sx={{ animation: `${float} 5s ease-in-out infinite` }}>
                <Box sx={{ width: 300, height: 300, borderRadius: '50%', background: `linear-gradient(135deg, ${accentLight}, #f3e8ff)`, border: `3px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1, boxShadow: `0 30px 80px ${accent}15` }}>
                  <SmartToyIcon sx={{ fontSize: 72, color: accent }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: accent }}>VIVA AI</Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500 }}>Intelligent Assessment</Typography>
                </Box>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── STATS BAR ── */}
      <Box sx={{ py: 4, background: accent, color: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            {stats.map((s, i) => (
              <Grid item xs={6} md={3} key={i} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.value}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>{s.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{s.sub}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURES ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#fafbff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="CAPABILITIES" sx={{ mb: 2, background: accentLight, color: accent, fontWeight: 600, letterSpacing: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: { xs: '1.7rem', md: '2.4rem' } }}>
              Everything You Need for AI Vivas
            </Typography>
            <Typography sx={{ color: '#6b7280', mt: 1, maxWidth: 500, mx: 'auto' }}>
              Purpose-built for authentic, scalable, integrity-verified oral examinations.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <MotionBox initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #eee', height: '100%', transition: 'all 0.3s', '&:hover': { borderColor: f.color, boxShadow: `0 8px 30px ${f.color}15`, transform: 'translateY(-4px)' } }}>
                    <Avatar sx={{ width: 52, height: 52, mb: 2, background: `${f.color}12`, color: f.color }}>{f.icon}</Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>{f.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.7 }}>{f.desc}</Typography>
                  </Card>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#fff' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="WORKFLOW" sx={{ mb: 2, background: accentLight, color: accent, fontWeight: 600, letterSpacing: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a1a2e', fontSize: { xs: '1.7rem', md: '2.4rem' } }}>
              How It Works
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {steps.map((s, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <MotionBox initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                  <Box sx={{ display: 'flex', gap: 2.5, p: 3, borderRadius: 4, border: '1px solid #f0f0f0', background: '#fafbff', transition: 'all 0.3s', '&:hover': { borderColor: `${accent}44`, background: accentLight } }}>
                    <Avatar sx={{ width: 48, height: 48, background: `${accent}12`, color: accent, fontWeight: 800, fontSize: '1.1rem' }}>{s.num}</Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1a2e', mb: 0.5 }}>{s.title}</Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</Typography>
                    </Box>
                  </Box>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── FOR TEACHERS & STUDENTS ── */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#fafbff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <MotionBox initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Card elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e8edff', height: '100%', background: '#fff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 48, height: 48, background: `${accent}12`, color: accent }}><SchoolIcon /></Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>For Teachers</Typography>
                  </Box>
                  {['Create classes & upload question banks (Excel/CSV)', 'Set up voice profiles for authentic AI questioning', 'Review AI-drafted resume-based questions per student', 'Access proctoring logs with visual violation evidence', 'View class-wide analytics and per-student breakdown', 'Download PDF transcripts with rubric-scored evaluations'].map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                      <CheckCircleOutlineIcon sx={{ color: accent, fontSize: 20, mt: 0.3 }} />
                      <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.6 }}>{t}</Typography>
                    </Box>
                  ))}
                </Card>
              </MotionBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <MotionBox initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
                <Card elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #f3e8ff', height: '100%', background: '#fff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 48, height: 48, background: '#f3e8ff', color: '#7209b7' }}><GroupsIcon /></Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>For Students</Typography>
                  </Box>
                  {['Join classes with a simple code & upload resume for personalized Qs', 'Hear questions in your teacher\'s cloned voice via AI TTS', 'Speak answers naturally — live transcript confirms system is listening', 'Get instant rubric-based feedback after each response', 'Review past viva transcripts & track performance trends', 'Adaptive difficulty: easy → medium → hard based on performance'].map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                      <CheckCircleOutlineIcon sx={{ color: '#7209b7', fontSize: 20, mt: 0.3 }} />
                      <Typography variant="body2" sx={{ color: '#4b5563', lineHeight: 1.6 }}>{t}</Typography>
                    </Box>
                  ))}
                </Card>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CTA ── */}
      <Box sx={{ py: { xs: 8, md: 10 }, background: `linear-gradient(135deg, ${accent} 0%, #7209b7 100%)`, textAlign: 'center', color: '#fff' }}>
        <Container maxWidth="sm">
          <MotionBox initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.7rem', md: '2.3rem' } }}>
              Ready to Modernize Viva Exams?
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 4, lineHeight: 1.8 }}>
              Join as a teacher to create AI-powered interviews, or as a student to experience the future of oral assessment.
            </Typography>
            <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/register')}
              sx={{ background: '#fff', color: accent, borderRadius: 3, px: 5, py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '1.05rem', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', '&:hover': { background: '#f0f0ff', transform: 'translateY(-2px)' }, transition: 'all 0.3s' }}>
              Sign Up Free
            </Button>
          </MotionBox>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{ py: 4, borderTop: '1px solid #eee', textAlign: 'center', background: '#fafbff' }}>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          © {new Date().getFullYear()} Viva AI Interview System — AI-Powered Oral Examination Platform
        </Typography>
      </Box>
    </Box>
  )
}

export default Home
