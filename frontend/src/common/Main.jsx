import React, { useState, Suspense, lazy } from 'react';
import {
  Typography, Box, Button, Avatar, IconButton, Menu, MenuItem, AppBar, Toolbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider,
  ListItemIcon, ListItemText, Snackbar, Alert, CircularProgress,
  Drawer, List, ListItemButton, useMediaQuery, useTheme, Collapse,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SchoolIcon from '@mui/icons-material/School';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import axios from 'axios';
import { logout, setCredentials } from '../redux/features/auth/authSlice';
import { useGetAllClassesQuery } from '../redux/api/classApiSlice';
import AllTeaching from '../pagesKM/Pages/AllTeaching';
import CreateClass from '../pagesKM/Pages/CreateClass';
import ClassPage from '../pagesKM/Pages/ClassPage';

const DashboardPage = lazy(() => import('../pagesKM/Pages/DashboardPage'));

const API = import.meta.env.VITE_BACKEND_URL;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);
  const router = React.useMemo(() => ({
    pathname,
    searchParams: new URLSearchParams(),
    navigate: (path) => setPathname(String(path)),
  }), [pathname]);
  return router;
}

export default function Main() {
  const { userInfo } = useSelector((state) => state.user);
  const { data } = useGetAllClassesQuery(userInfo?._id, { skip: !userInfo?._id });
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [teachingMenuAnchor, setTeachingMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(userInfo?.name || '');
  const [editEmail, setEditEmail] = useState(userInfo?.email || '');
  const [editPic, setEditPic] = useState(userInfo?.profile_pic || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [interviewExpanded, setInterviewExpanded] = useState(true);

  const router = useDemoRouter('/dashboard');
  const routerNavigate = useRouterNavigate();

  const handleSignOut = async () => {
    try {
      await axios.get(`${API}/user/logout-user`, { withCredentials: true });
      dispatch(logout());
    } catch (error) {
      dispatch(logout());
    }
  };

  const handleEditProfile = () => {
    setEditName(userInfo?.name || '');
    setEditEmail(userInfo?.email || '');
    setEditPic(userInfo?.profile_pic || '');
    setEditOpen(true);
    setUserMenuAnchor(null);
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET || 'ChitChat-app-file');
      formData.append('cloud_name', CLOUD_NAME || 'dxor5y4pf');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME || 'dxor5y4pf'}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) setEditPic(data.secure_url);
    } catch (err) {
      setSnackbar({ open: true, message: 'Image upload failed', severity: 'error' });
    }
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/user/update-user`,
        { name: editName, email: editEmail, profile_pic: editPic },
        { withCredentials: true }
      );
      if (res.data?.data) {
        dispatch(setCredentials(res.data.data));
        setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      }
      setEditOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    }
    setSaving(false);
  };

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', action: () => router.navigate('/dashboard') },
    { label: 'Classes', icon: <HomeIcon />, path: '/class', action: () => router.navigate('/class') },
  ];

  const handleNavClick = (action) => {
    action();
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, md: 4 }, py: 0.5 }}>
          {/* Left: Brand + Hamburger on mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#1e293b' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: '#4361ee', letterSpacing: -0.5, cursor: 'pointer', fontSize: { xs: '1.1rem', md: '1.25rem' } }}
              onClick={() => router.navigate('/dashboard')}
            >
              Viva<span style={{ color: '#1e293b' }}>AI</span>
            </Typography>
          </Box>

          {/* Center Nav - hidden on mobile */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={item.action}
                  sx={{
                    color: router.pathname === item.path ? '#4361ee' : '#64748b',
                    backgroundColor: router.pathname === item.path ? '#eef2ff' : 'transparent',
                    borderRadius: 2, px: 2, py: 0.8, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none',
                    '&:hover': { backgroundColor: '#f1f5f9', color: '#4361ee' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                startIcon={<AutoAwesomeIcon />}
                onClick={(e) => setTeachingMenuAnchor(e.currentTarget)}
                sx={{
                  color: router.pathname?.startsWith('/class/') ? '#4361ee' : '#64748b',
                  backgroundColor: router.pathname?.startsWith('/class/') ? '#eef2ff' : 'transparent',
                  borderRadius: 2, px: 2, py: 0.8, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#4361ee' },
                }}
              >
                AI Interview
              </Button>
              {userInfo?.role === 'student' && (
                <Button startIcon={<AssessmentIcon />} onClick={() => routerNavigate('/viva-results')}
                  sx={{ color: '#64748b', borderRadius: 2, px: 2, py: 0.8, fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', '&:hover': { backgroundColor: '#f1f5f9', color: '#4361ee' } }}>
                  My Results
                </Button>
              )}
              <Menu anchorEl={teachingMenuAnchor} open={Boolean(teachingMenuAnchor)} onClose={() => setTeachingMenuAnchor(null)}
                PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', mt: 1 } }}>
                {data?.classes?.length ? data.classes.map((classItem) => (
                  <MenuItem key={classItem._id} onClick={() => { router.navigate(`/class/${classItem._id}`); setTeachingMenuAnchor(null); }} sx={{ fontSize: '0.875rem', py: 1.2 }}>
                    {classItem.name}
                  </MenuItem>
                )) : <MenuItem disabled sx={{ fontSize: '0.875rem' }}>No classes available</MenuItem>}
              </Menu>
            </Box>
          )}

          {/* Right: User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>{userInfo?.name}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>{userInfo?.role}</Typography>
            </Box>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} size="small">
              <Avatar alt={userInfo?.name} src={userInfo?.profile_pic} sx={{ width: 36, height: 36, border: '2px solid #eef2ff' }} />
            </IconButton>
            <Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}
              PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', mt: 1, minWidth: 180 } }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{userInfo?.name}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{userInfo?.email}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleEditProfile} sx={{ py: 1.2 }}>
                <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>Edit Profile</ListItemText>
              </MenuItem>
              {userInfo?.role === 'student' && (
                <MenuItem onClick={() => { routerNavigate('/saved-resources'); setUserMenuAnchor(null); }} sx={{ py: 1.2 }}>
                  <ListItemIcon><BookmarkIcon fontSize="small" sx={{ color: '#6366f1' }} /></ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>Saved Resources</ListItemText>
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleSignOut} sx={{ py: 1.2 }}>
                <ListItemIcon><ExitToAppIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', color: '#ef4444' }}>Sign Out</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 300, borderRadius: '0 16px 16px 0', display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#4361ee' }}>Viva<span style={{ color: '#1e293b' }}>AI</span></Typography>
          <IconButton onClick={() => setMobileOpen(false)}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1.5, pt: 1.5, flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleNavClick(item.action)}
              sx={{ borderRadius: 2, mb: 0.5, backgroundColor: router.pathname === item.path ? '#eef2ff' : 'transparent', color: router.pathname === item.path ? '#4361ee' : '#475569' }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
            </ListItemButton>
          ))}

          {/* AI Interview with expandable class list */}
          <ListItemButton onClick={() => setInterviewExpanded(!interviewExpanded)}
            sx={{ borderRadius: 2, mb: 0.5, color: router.pathname?.startsWith('/class/') ? '#4361ee' : '#475569', backgroundColor: router.pathname?.startsWith('/class/') ? '#eef2ff' : 'transparent' }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><AutoAwesomeIcon /></ListItemIcon>
            <ListItemText primary="AI Interview" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
            {interviewExpanded ? <ExpandLessIcon sx={{ fontSize: 20 }} /> : <ExpandMoreIcon sx={{ fontSize: 20 }} />}
          </ListItemButton>

          <Collapse in={interviewExpanded} timeout="auto">
            <Box sx={{ pl: 1, pr: 0.5, pb: 1 }}>
              {data?.classes?.length ? data.classes.map((classItem) => (
                <ListItemButton key={classItem._id}
                  onClick={() => { router.navigate(`/class/${classItem._id}`); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2, mb: 0.5, py: 1, pl: 2,
                    backgroundColor: router.pathname === `/class/${classItem._id}` ? '#f0f4ff' : '#f8fafc',
                    border: router.pathname === `/class/${classItem._id}` ? '1px solid #c7d2fe' : '1px solid #f1f5f9',
                    '&:hover': { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
                  }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SchoolIcon sx={{ fontSize: 18, color: router.pathname === `/class/${classItem._id}` ? '#4361ee' : '#94a3b8' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={classItem.name}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.85rem', color: router.pathname === `/class/${classItem._id}` ? '#4361ee' : '#1e293b' }}
                  />
                </ListItemButton>
              )) : (
                <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>No classes yet</Typography>
                </Box>
              )}
              <ListItemButton onClick={() => { router.navigate('/class'); setMobileOpen(false); }}
                sx={{ borderRadius: 2, py: 0.8, pl: 2, color: '#4361ee', '&:hover': { backgroundColor: '#eef2ff' } }}>
                <ListItemText primary="View All Classes" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8rem', color: '#4361ee' }} />
              </ListItemButton>
            </Box>
          </Collapse>

          {userInfo?.role === 'student' && (
            <ListItemButton onClick={() => { routerNavigate('/viva-results'); setMobileOpen(false); }} sx={{ borderRadius: 2, mb: 0.5, color: '#475569' }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><AssessmentIcon /></ListItemIcon>
              <ListItemText primary="My Results" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
            </ListItemButton>
          )}
        </List>
        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={userInfo?.profile_pic} sx={{ width: 36, height: 36 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{userInfo?.name}</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>{userInfo?.role}</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {router.pathname === '/dashboard' && (
          <Suspense fallback={<Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress sx={{ color: '#4361ee' }} /></Box>}>
            <DashboardPage />
          </Suspense>
        )}
        {router.pathname === '/class' && <AllTeaching navigate={router.navigate} />}
        {router.pathname === '/createClass' && <CreateClass />}
        {router.pathname?.startsWith('/class/') && (
          <ClassPage classId={router.pathname.split('/')[2]} />
        )}
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1e293b', pb: 0 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {/* Profile Picture Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar src={editPic} alt={editName} sx={{ width: 80, height: 80, border: '3px solid #eef2ff' }} />
                {uploading && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '50%' }}>
                    <CircularProgress size={24} sx={{ color: '#4361ee' }} />
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small" disabled={uploading}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#4361ee', '&:hover': { borderColor: '#4361ee', backgroundColor: '#eef2ff' } }}>
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={handleUploadPic} />
                </Button>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>JPG, PNG up to 5MB</Typography>
              </Box>
            </Box>
            <TextField label="Or paste image URL" fullWidth size="small" value={editPic} onChange={(e) => setEditPic(e.target.value)}
              placeholder="https://example.com/photo.jpg" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Full Name" fullWidth value={editName} onChange={(e) => setEditName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Email" fullWidth value={editEmail} onChange={(e) => setEditEmail(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Role" fullWidth value={userInfo?.role || ''} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={saving}
            sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: '#4361ee', fontWeight: 600, px: 3, '&:hover': { backgroundColor: '#3730a3' } }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
