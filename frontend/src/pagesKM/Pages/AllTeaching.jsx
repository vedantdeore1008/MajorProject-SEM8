import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Button, Dialog, Card, CardContent, Typography, TextField,
  DialogTitle, DialogContent, DialogActions, Grid, CircularProgress,
  Paper, Chip, Avatar, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CreateClass from './CreateClass';
import {
  useGetAllClassesQuery,
  useJoinClassMutation,
  useGetAllPublicClassesQuery,
} from '../../redux/api/classApiSlice';

const AllTeaching = ({ navigate }) => {
  const { userInfo } = useSelector((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [classCode, setClassCode] = useState('');

  const {
    data: userClasses,
    isLoading: isUserClassesLoading,
    error: userClassesError,
    refetch: refetchUserClasses,
  } = useGetAllClassesQuery(userInfo?._id, { skip: !userInfo?._id });

  const {
    data: publicClassesData,
    isLoading: isPublicClassesLoading,
    error: publicClassesError,
    refetch: refetchPublicClasses,
  } = useGetAllPublicClassesQuery(
    { userId: userInfo?._id, role: userInfo?.role },
    { skip: !userInfo?._id }
  );

  const [joinClass, { isLoading: isJoining }] = useJoinClassMutation();

  const handleJoinClass = async (classId = null) => {
    if (!classId && !classCode) { alert('Please enter a class code.'); return; }
    try {
      const response = await joinClass({ classCode, studentId: userInfo._id, classId }).unwrap();
      alert(response.message);
      setIsJoinModalOpen(false);
      refetchUserClasses();
      refetchPublicClasses();
    } catch (error) { alert(error.data?.message || 'Failed to join class.'); }
    setClassCode('');
  };

  const privateClasses = [...(userClasses?.classes?.filter((c) => !c.isPublic) || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const publicClasses = [...(publicClassesData?.classes || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (isUserClassesLoading || isPublicClassesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#4361ee' }} />
      </Box>
    );
  }

  if (userClassesError || publicClassesError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Error loading classes. Please try again.</Typography>
      </Box>
    );
  }

  const ClassCard = ({ classItem, showJoin = false }) => {
    const colors = ['#4361ee', '#6366f1', '#7c3aed', '#2563eb', '#0891b2', '#059669'];
    const colorIdx = (classItem?.name?.charCodeAt(0) || 0) % colors.length;
    const accent = colors[colorIdx];

    return (
      <Card
        onClick={!showJoin ? () => navigate(`/class/${classItem._id}`) : undefined}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: !showJoin ? 'pointer' : 'default',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            borderColor: accent,
            boxShadow: `0 8px 25px ${accent}18`,
            transform: 'translateY(-4px)',
          },
        }}
      >
        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ width: 44, height: 44, backgroundColor: `${accent}12`, color: accent, borderRadius: 2.5, fontWeight: 700, fontSize: 18 }}>
              {classItem?.name?.[0]?.toUpperCase() || 'C'}
            </Avatar>
            {classItem.classCode && (
              <Chip label={classItem.classCode} size="small" sx={{ fontSize: '0.68rem', fontWeight: 600, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} />
            )}
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.3, fontSize: '0.95rem', lineHeight: 1.3 }}>
            {classItem?.name || 'Unnamed Class'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', mb: 2, display: 'block' }}>
            {classItem.subject || 'General'}
          </Typography>
          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon sx={{ fontSize: 15, color: accent }} />
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                {classItem.teacher?.name || 'Teacher'}
              </Typography>
            </Box>
            <Chip
              icon={<PeopleIcon sx={{ fontSize: 13 }} />}
              label={classItem.students?.length || 0}
              size="small"
              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #f1f5f9', '& .MuiChip-icon': { color: '#94a3b8' } }}
            />
          </Box>
        </CardContent>
        {showJoin && (
          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <Button fullWidth variant="contained" onClick={() => handleJoinClass(classItem._id)} disabled={isJoining} size="small"
              startIcon={!isJoining && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, py: 1, backgroundColor: accent, boxShadow: 'none', '&:hover': { backgroundColor: `${accent}dd`, boxShadow: `0 4px 12px ${accent}30` } }}>
              {isJoining ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Join Class'}
            </Button>
          </Box>
        )}
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>My Classes</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {userInfo.role === 'teacher' ? 'Manage your classrooms and AI interviews' : 'Your enrolled classes and available courses'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {userInfo.role === 'teacher' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, backgroundColor: '#4361ee', boxShadow: 'none', px: 2.5, '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
              Create Class
            </Button>
          )}
          {userInfo.role === 'student' && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setIsJoinModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#4361ee', color: '#4361ee' } }}>
              Join with Code
            </Button>
          )}
        </Box>
      </Box>

      {/* Create Class Dialog */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <CreateClass refetch={refetchUserClasses} onClose={() => setIsModalOpen(false)} />
      </Dialog>

      {/* Join Dialog */}
      <Dialog open={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>Join Private Class</DialogTitle>
        <DialogContent>
          <TextField name="classCode" label="Class Code" fullWidth margin="normal" variant="outlined" value={classCode}
            onChange={(e) => setClassCode(e.target.value)} placeholder="Enter the code shared by your teacher"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsJoinModalOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button onClick={() => handleJoinClass()} disabled={isJoining} variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, backgroundColor: '#4361ee', px: 3, boxShadow: 'none', '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
            {isJoining ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Your Classes */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon sx={{ fontSize: 18, color: '#64748b' }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>Your Classes</Typography>
          <Chip label={privateClasses.length} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
        </Box>
        {privateClasses.length > 0 ? (
          <Grid container spacing={2}>
            {privateClasses.filter(c => c && c._id).map((classItem) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={classItem._id}>
                <ClassCard classItem={classItem} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <ClassIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {userInfo.role === 'teacher' ? 'Create your first class to get started' : 'No classes yet. Join a class or ask your teacher for a code.'}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Public Classes (for students) */}
      {userInfo.role === 'student' && publicClasses.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PublicIcon sx={{ fontSize: 18, color: '#64748b' }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>Available Public Classes</Typography>
            <Chip label={publicClasses.length} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
          </Box>
          <Grid container spacing={2}>
            {publicClasses.filter(c => c && c._id).map((classItem) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={classItem._id}>
                <ClassCard classItem={classItem} showJoin />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AllTeaching;
