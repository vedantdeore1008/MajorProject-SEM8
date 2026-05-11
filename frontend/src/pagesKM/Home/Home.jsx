import React from 'react'
import { Box, Button, Typography, Container, Grid, Card, CardContent, Avatar, useTheme, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { motion } from 'framer-motion'
import { styled, keyframes } from '@mui/system'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import MicIcon from '@mui/icons-material/Mic'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SecurityIcon from '@mui/icons-material/Security'
import SchoolIcon from '@mui/icons-material/School'
import PsychologyIcon from '@mui/icons-material/Psychology'
import { useNavigate } from 'react-router'

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

const GlassCard = styled(Card)(() => ({
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 20,
  padding: '32px 24px',
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(.25,.8,.25,1)',
  cursor: 'default',
  '&:hover': {
    transform: 'translateY(-8px)',
    background: 'rgba(255,255,255,0.12)',
    boxShadow: '0 20px 60px rgba(99,102,241,0.25)',
    border: '1px solid rgba(99,102,241,0.4)',
  },
}))

const GradientText = styled(Typography)(() => ({
  background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 800,
}))

const Home = () => {
  const theme = useTheme()
  const navigate = useNavigate()

  const features = [
    { icon: <RecordVoiceOverIcon sx={{ fontSize: 36 }} />, title: 'Voice-Cloned Questions', desc: 'LMNT TTS creates a realistic clone of your teacher\'s voice to ask questions, delivering authentic viva experiences at scale.', color: '#818cf8' },
    { icon: <MicIcon sx={{ fontSize: 36 }} />, title: 'Live Speech Recognition', desc: 'Browser-native STT captures student answers in real-time with live transcript display — zero latency, zero cloud cost.', color: '#34d399' },
    { icon: <PsychologyIcon sx={{ fontSize: 36 }} />, title: 'AI-Powered Evaluation', desc: 'Gemini 1.5 Flash scores responses on Relevance, Completeness, Accuracy & Depth using RAG-grounded curriculum context.', color: '#f472b6' },
    { icon: <VisibilityIcon sx={{ fontSize: 36 }} />, title: 'Smart Proctoring', desc: 'COCO-SSD object detection monitors for phones, books, multiple faces & tab-switching with timestamped violation logs.', color: '#fbbf24' },
    { icon: <AssessmentIcon sx={{ fontSize: 36 }} />, title: 'Detailed Analytics', desc: 'Per-question rubric breakdown, class performance trends, proctoring dashboards, and downloadable PDF transcripts.', color: '#60a5fa' },
    { icon: <SecurityIcon sx={{ fontSize: 36 }} />, title: 'Integrity Verified', desc: 'Eden AI plagiarism detection flags AI-generated answers. Proctoring evidence enables fair post-viva review by teachers.', color: '#a78bfa' },
  ]

  const steps = [
    { num: '01', title: 'Teacher Creates Class', desc: 'Set up a classroom and share the join code with students.' },
    { num: '02', title: 'Upload Q&A Set', desc: 'Upload an Excel/CSV with questions and model answers for the viva.' },
    { num: '03', title: 'Student Starts Viva', desc: 'Student joins, captures face, and begins the AI interview session.' },
    { num: '04', title: 'AI Evaluates & Reports', desc: 'Each answer is scored in real-time. Full transcript and analytics generated.' },
  ]

  const techStack = [
    'React + Vite', 'Node.js + Express', 'Flask Microservice', 'MongoDB Atlas',
    'Gemini 1.5 Flash', 'LMNT Voice Cloning', 'TensorFlow.js COCO-SSD', 'ChromaDB RAG',
    'Socket.io', 'JWT Auth', 'Redux Toolkit', 'Material-UI'
  ]

  return (
    <Box sx={{ background: '#0a0a1a', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <Box sx={{
        position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.12) 0%, transparent 50%), #0a0a1a',
      }}>
        {/* Animated orbs */}
        <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)', animation: `${pulse} 4s ease-in-out infinite`, filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.2), transparent 70%)', animation: `${pulse} 5s ease-in-out infinite 1s`, filter: 'blur(40px)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <Typography variant="overline" sx={{ color: '#818cf8', letterSpacing: 4, fontSize: '0.85rem', mb: 2, display: 'block' }}>
                  AI-POWERED ORAL EXAMINATION
                </Typography>
                <GradientText variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, lineHeight: 1.15, mb: 3 }}>
                  Viva AI Interview System
                </GradientText>
                <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 400, lineHeight: 1.7, mb: 4, maxWidth: 560 }}>
                  Transform traditional oral exams into scalable, automated experiences with voice cloning, real-time speech recognition, AI evaluation, and computer-vision proctoring.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" size="large" onClick={() => navigate('/login')}
                    sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 3, px: 5, py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', '&:hover': { boxShadow: '0 12px 40px rgba(99,102,241,0.5)', transform: 'translateY(-2px)' }, transition: 'all 0.3s' }}>
                    Get Started
                  </Button>
                  <Button variant="outlined" size="large" onClick={() => navigate('/register')}
                    sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#e2e8f0', borderRadius: 3, px: 5, py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', '&:hover': { borderColor: '#818cf8', background: 'rgba(99,102,241,0.08)' } }}>
                    Register
                  </Button>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}>
                <Box sx={{ animation: `${float} 6s ease-in-out infinite`, position: 'relative' }}>
                  <Box sx={{ width: 320, height: 320, borderRadius: '50%', background: 'conic-gradient(from 180deg, #6366f1, #a855f7, #ec4899, #6366f1)', p: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                      <SmartToyIcon sx={{ fontSize: 80, color: '#818cf8' }} />
                      <Typography variant="h6" sx={{ color: '#c084fc', fontWeight: 700 }}>VIVA AI</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Intelligent Assessment</Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── FEATURES ── */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f2e 100%)' }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Typography variant="overline" align="center" display="block" sx={{ color: '#818cf8', letterSpacing: 4, mb: 1 }}>CAPABILITIES</Typography>
            <GradientText variant="h3" align="center" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 2 }}>Powered by Cutting-Edge AI</GradientText>
            <Typography align="center" sx={{ color: '#64748b', mb: 6, maxWidth: 600, mx: 'auto' }}>
              Every component is purpose-built for authentic, scalable, integrity-verified oral examinations.
            </Typography>
          </motion.div>
          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  <GlassCard elevation={0}>
                    <Avatar sx={{ width: 64, height: 64, mb: 2, mx: 'auto', background: `${f.color}22`, color: f.color }}>{f.icon}</Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 1 }}>{f.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.7 }}>{f.desc}</Typography>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── HOW IT WORKS ── */}
      <Box sx={{ py: 12, background: '#0a0a1a' }}>
        <Container maxWidth="md">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Typography variant="overline" align="center" display="block" sx={{ color: '#818cf8', letterSpacing: 4, mb: 1 }}>WORKFLOW</Typography>
            <GradientText variant="h3" align="center" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 6 }}>How It Works</GradientText>
          </motion.div>
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center', p: 3, borderRadius: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', '&:hover': { background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }, transition: 'all 0.3s' }}>
                <Typography variant="h3" sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #6366f1, #a855f7)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', minWidth: 80 }}>{s.num}</Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f1f5f9', mb: 0.5 }}>{s.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>{s.desc}</Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Container>
      </Box>

      {/* ── TECH STACK ── */}
      <Box sx={{ py: 10, background: 'linear-gradient(180deg, #0f0f2e 0%, #0a0a1a 100%)' }}>
        <Container maxWidth="lg">
          <Typography variant="overline" align="center" display="block" sx={{ color: '#818cf8', letterSpacing: 4, mb: 1 }}>ARCHITECTURE</Typography>
          <GradientText variant="h3" align="center" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 5 }}>Built With Modern Tech</GradientText>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            {techStack.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Box sx={{ px: 3, py: 1.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#c084fc', fontSize: '0.9rem', fontWeight: 600, '&:hover': { borderColor: '#818cf8', background: 'rgba(99,102,241,0.1)' }, transition: 'all 0.3s', cursor: 'default' }}>
                  {t}
                </Box>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── CTA ── */}
      <Box sx={{ py: 12, background: '#0a0a1a', textAlign: 'center' }}>
        <Container maxWidth="sm">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <SchoolIcon sx={{ fontSize: 56, color: '#818cf8', mb: 2 }} />
            <GradientText variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 2 }}>Ready to Transform Viva Exams?</GradientText>
            <Typography sx={{ color: '#64748b', mb: 4, lineHeight: 1.8 }}>
              Join as a teacher to create AI-powered interviews, or as a student to experience the future of oral assessment.
            </Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/register')}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 3, px: 6, py: 1.5, fontSize: '1.1rem', fontWeight: 700, textTransform: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', '&:hover': { boxShadow: '0 12px 40px rgba(99,102,241,0.55)' } }}>
              Sign Up Free
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{ py: 4, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#475569' }}>
          © {new Date().getFullYear()} Viva AI Interview System — Final Year Project
        </Typography>
      </Box>
    </Box>
  )
}

export default Home
