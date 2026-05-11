import React, { useMemo, useState } from 'react';
import { extendTheme } from '@mui/material/styles';
import { 
  Typography, 
  Box,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  AppBar,
  Toolbar
} from '@mui/material';
import { Person } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AutoAwesome } from '@mui/icons-material';
import { Code } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SchoolIcon from '@mui/icons-material/School';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupWorkIcon from '@mui/icons-material/GroupWork'; // New icon for projects
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { logout } from '../redux/features/auth/authSlice';
import { useGetAllClassesQuery } from '../redux/api/classApiSlice';
import DashboardPage from '../pagesKM/Pages/DashboardPage';
import AllTeaching from '../pagesKM/Pages/AllTeaching';
import CreateClass from '../pagesKM/Pages/CreateClass';
import UsersPage from '../pagesKM/Pages/UsersPage';
import TimetablePage from '../pagesKM/Pages/TimetablePage';
import ClassPage from '../pagesKM/Pages/ClassPage';
import StudentProjectPage from '../pagesKM/Pages/StudentProjectPage'; // Import student page
import TeacherProjectPage from '../pagesKM/Pages/TeacherProjectPage'; // Import teacher page

const API = import.meta.env.VITE_BACKEND_URL;

const demoTheme = extendTheme({
  colorSchemes: { light: true },
  colorSchemeSelector: 'class',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

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

export default function Main(props) {
  const { userInfo } = useSelector((state) => state.user);
  const { data } = useGetAllClassesQuery(userInfo._id);
  const dispatch = useDispatch();
  const [teachingMenuAnchor, setTeachingMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const router = useDemoRouter('/ai-interview');
  const [session, setSession] = useState({
    user: {
      name: userInfo.name,
      email: userInfo.email,
      image: userInfo.profile_pic,
    },
  });

  const handleSignOut = async () => {
    try {
      const URL = `${API}/user/logout-user`;
      await axios.get(URL, { withCredentials: true });
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTeachingMenuOpen = (event) => {
    setTeachingMenuAnchor(event.currentTarget);
  };

  const handleTeachingMenuClose = () => {
    setTeachingMenuAnchor(null);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Centered Navbar */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          padding: '0.5rem 2rem'
        }}>
          {/* App Title - Left Side */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#4361ee',
              letterSpacing: -0.5,
            }}
          >
            Viva<span style={{ color: '#1a1a2e' }}>AI</span>
          </Typography>

          {/* Centered Navigation */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <Button
              startIcon={<DashboardIcon />}
              onClick={() => router.navigate('/dashboard')}
              sx={{
                color: router.pathname === '/dashboard' ? '#4361ee' : '#6b7280',
                backgroundColor: router.pathname === '/dashboard' ? '#e8edff' : 'transparent',
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f0f4ff', color: '#4361ee' },
              }}
            >
              Dashboard
            </Button>

            <Button
              startIcon={<HomeIcon />}
              onClick={() => router.navigate('/class')}
              sx={{
                color: router.pathname === '/class' ? '#4361ee' : '#6b7280',
                backgroundColor: router.pathname === '/class' ? '#e8edff' : 'transparent',
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f0f4ff', color: '#4361ee' },
              }}
            >
              Home
            </Button>

            <Button
              startIcon={<AutoAwesome />}
              onClick={handleTeachingMenuOpen}
              sx={{
                color: '#6b7280',
                backgroundColor: 'transparent',
                borderRadius: 2.5,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#f0f4ff', color: '#4361ee' },
              }}
            >
              AI Interview
            </Button>
            <Menu
              anchorEl={teachingMenuAnchor}
              open={Boolean(teachingMenuAnchor)}
              onClose={handleTeachingMenuClose}
            >
              {data?.classes?.length ? data.classes.map((classItem) => (
                <MenuItem 
                  key={classItem._id}
                  onClick={() => {
                    router.navigate(`/class/${classItem._id}`);
                    handleTeachingMenuClose();
                  }}
                >
                  {classItem.name}
                </MenuItem>
              )) : (
                <MenuItem disabled>No classes available</MenuItem>
              )}
            </Menu>
          </Box>

          {/* Right Side - User Profile and Sign Out */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handleUserMenuOpen}
            >
              <Avatar
                alt={userInfo?.name}
                src={userInfo?.profile_pic}
                sx={{ width: 38, height: 38, border: '2px solid #e8edff' }}
              />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleSignOut}>
                <ExitToAppIcon sx={{ mr: 1 }} />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: { xs: 1, md: 3 }, py: 1, backgroundColor: '#f8fafc' }}>
        <AppProvider
          session={session}
          router={router}
          theme={demoTheme}
        >
          {router.pathname === '/ai-interview' && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">Select a class from AI Interview Feature</Typography>
            </Box>
          )}
          {router.pathname === '/dashboard' && <DashboardPage />}
          {router.pathname === '/class' && <AllTeaching navigate={router.navigate} />}
          {router.pathname === '/createClass' && <CreateClass />}
          {router.pathname === '/students' && <UsersPage />}
          {router.pathname === '/timetable' && <TimetablePage />}
          {router.pathname === '/projects' && (
            userInfo?.role === 'teacher' ? 
              <TeacherProjectPage currentUser={userInfo} /> : 
              <StudentProjectPage currentUser={userInfo} />
          )}
          {router.pathname?.startsWith('/class/') && (
            <ClassPage classId={router.pathname.split('/')[2]} />
          )}
          {router.pathname === '/expertise' && <ExpertisePage />}
        </AppProvider>
      </Box>
    </Box>
  );
}