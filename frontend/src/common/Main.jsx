import React, { useState, Suspense, lazy } from 'react';
import {
  Typography,
  Box,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import AssessmentIcon from '@mui/icons-material/Assessment';
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

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);
  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    };
  }, [pathname]);
  return router;
}

export default function Main() {
  const { userInfo } = useSelector((state) => state.user);
  const { data } = useGetAllClassesQuery(userInfo?._id, { skip: !userInfo?._id });
  const dispatch = useDispatch();
  const [teachingMenuAnchor, setTeachingMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(userInfo?.name || '');
  const [editEmail, setEditEmail] = useState(userInfo?.email || '');
  const [editPic, setEditPic] = useState(userInfo?.profile_pic || '');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const router = useDemoRouter('/dashboard');

  const handleSignOut = async () => {
    try {
      await axios.get(`${API}/user/logout-user`, { withCredentials: true });
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
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

  const routerNavigate = useRouterNavigate();

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Home', icon: <HomeIcon />, path: '/class' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 }, py: 0.5 }}>
          {/* Brand */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: '#4361ee', letterSpacing: -0.5, cursor: 'pointer' }}
            onClick={() => router.navigate('/dashboard')}
          >
            Viva<span style={{ color: '#1e293b' }}>AI</span>
          </Typography>

          {/* Center Nav */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => router.navigate(item.path)}
                sx={{
                  color: router.pathname === item.path ? '#4361ee' : '#64748b',
                  backgroundColor: router.pathname === item.path ? '#eef2ff' : 'transparent',
                  borderRadius: 2,
                  px: 2,
                  py: 0.8,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
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
                borderRadius: 2,
                px: 2,
                py: 0.8,
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f1f5f9', color: '#4361ee' },
              }}
            >
              AI Interview
            </Button>
            {userInfo?.role === 'student' && (
              <Button
                startIcon={<AssessmentIcon />}
                onClick={() => routerNavigate('/viva-results')}
                sx={{
                  color: '#64748b',
                  backgroundColor: 'transparent',
                  borderRadius: 2,
                  px: 2,
                  py: 0.8,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#f1f5f9', color: '#4361ee' },
                }}
              >
                My Results
              </Button>
            )}

            <Menu
              anchorEl={teachingMenuAnchor}
              open={Boolean(teachingMenuAnchor)}
              onClose={() => setTeachingMenuAnchor(null)}
              PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', mt: 1 } }}
            >
              {data?.classes?.length ? data.classes.map((classItem) => (
                <MenuItem
                  key={classItem._id}
                  onClick={() => {
                    router.navigate(`/class/${classItem._id}`);
                    setTeachingMenuAnchor(null);
                  }}
                  sx={{ fontSize: '0.875rem', py: 1.2 }}
                >
                  {classItem.name}
                </MenuItem>
              )) : (
                <MenuItem disabled sx={{ fontSize: '0.875rem' }}>No classes available</MenuItem>
              )}
            </Menu>
          </Box>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                {userInfo?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                {userInfo?.role}
              </Typography>
            </Box>
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} size="small">
              <Avatar
                alt={userInfo?.name}
                src={userInfo?.profile_pic}
                sx={{ width: 36, height: 36, border: '2px solid #eef2ff' }}
              />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', mt: 1, minWidth: 180 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  {userInfo?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {userInfo?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleEditProfile} sx={{ py: 1.2 }}>
                <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>Edit Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleSignOut} sx={{ py: 1.2 }}>
                <ListItemIcon><ExitToAppIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', color: '#ef4444' }}>Sign Out</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

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
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1e293b', pb: 0 }}>
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar
                src={editPic}
                alt={editName}
                sx={{ width: 64, height: 64, border: '3px solid #eef2ff' }}
              />
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Profile Picture URL"
                  fullWidth
                  size="small"
                  value={editPic}
                  onChange={(e) => setEditPic(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </Box>
            <TextField
              label="Full Name"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              fullWidth
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Role"
              fullWidth
              value={userInfo?.role || ''}
              disabled
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setEditOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              backgroundColor: '#4361ee',
              fontWeight: 600,
              px: 3,
              '&:hover': { backgroundColor: '#3730a3' },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
