import React, { useState, useRef } from 'react';
import './ClassPage.css';
import {
  useGetClassDetailsQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useLeaveClassMutation,
} from '../../redux/api/classApiSlice';
import {
  Box,
  Typography,
  Modal,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  UploadFile as UploadFileIcon,
  Delete as DeleteIcon,
  ExitToApp as LeaveIcon,
  PlayCircle as PlayIcon,
  YouTube,
  VideoFile,
  Person as TeacherIcon,
  Class as ClassIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import {
  useDeleteLectureMutation,
  useGetLecturesByClassQuery,
  useUploadLectureMutation,
} from '../../redux/api/lectureApiSlice';
import { useSelector } from 'react-redux';
import AssignmentPage from './AssignmentPage';
import CommunityPage from './communityPage';
import CreateViva from '../../pagesPP/Viva/CreateViva';
import ShowAllViva from '../../pagesPP/Viva/AllVivaById';
import TakePicture from '../../pagesPP/Viva/TakePicture';
import HomeQuiz from '../../pagesPP/Quiz/QuizManagement';
import VideoMetting from '../../pagesPP/VideoCall/VideoMetting';
import SelfStudy from './SelfStudy';
import { motion } from 'framer-motion';
import FaceCapture from './RegisterFace';
import Course from '../../pages_rajas/Course';
import Mindmap from '../../pages_rajas/Mindmap';
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const SlideTabs = ({ value, setValue }) => {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      onMouseLeave={() => {
        setPosition((pv) => ({
          ...pv,
          opacity: 0,
        }));
      }}
      className="relative mx-auto flex w-fit rounded-full border-2 border-grey p-1" 
      style={{fontFamily:"Montserrat-regular",backgroundColor:'#D8DFE5'}}
    >
      <Tab setPosition={setPosition} onClick={() => setValue(0)} isActive={value === 0}>
        AI Interview Feature
      </Tab>
      {/* Add new Register Face tab */}

      <Cursor position={position} />
    </ul>
  );
};

const Tab = ({ children, setPosition, onClick, isActive }) => {
  const ref = useRef(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref?.current) return;

        const { width } = ref.current.getBoundingClientRect();

        setPosition({
          left: ref.current.offsetLeft,
          width,
          opacity: 1,
        });
      }}
      onClick={onClick}
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase text-white mix-blend-difference md:px-5 md:py-3 md:text-base ${
        isActive ? 'text-blue-50' : ''
      }`}
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }) => {
  return (
    <motion.li
      animate={{
        ...position,
      }}
      className="absolute z-0 h-7 text-white rounded-full md:h-12"
     style={{backgroundColor:"#B7C1C3"}}/>
  );
};

const ClassPage = ({ classId }) => {
  const { data: classData, isLoading, error } = useGetClassDetailsQuery(classId);
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const { userInfo } = useSelector((state) => state.user);
  const [lectureData, setLectureData] = useState({
    title: '',
    description: '',
    youtubeLink: '',
    video: null,
  });
  const [uploadLecture] = useUploadLectureMutation();
  const { data: lectures, refetch } = useGetLecturesByClassQuery(classId);
  const [deleteLecture] = useDeleteLectureMutation();
  const [updateClass] = useUpdateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [leaveClass] = useLeaveClassMutation();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleUploadLecture = () => {
    setOpenModal(true);
  };

  const handleInputChange = (e) => {
    setLectureData({ ...lectureData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setLectureData({ ...lectureData, video: e.target.files[0] });
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('title', lectureData.title);
    formData.append('description', lectureData.description);
    formData.append('youtubeLink', lectureData.youtubeLink);
    formData.append('video', lectureData.video);
    formData.append('classId', classId);
    formData.append('teacherId', userInfo._id);
    try {
      await uploadLecture(formData).unwrap();
      setSnackbarMessage('Lecture uploaded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setOpenModal(false);
      refetch();
    } catch (error) {
      setSnackbarMessage('Error uploading lecture');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    setLectureData({ title: '', description: '', youtubeLink: '', video: null });
  };

  const handleDeleteLecture = async (lectureId) => {
    try {
      await deleteLecture(lectureId).unwrap();
      setSnackbarMessage('Lecture deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      refetch();
    } catch (error) {
      setSnackbarMessage('Error deleting lecture');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteClass = async () => {
    try {
      const teacherId = userInfo._id;
      await deleteClass({ classId, teacherId }).unwrap();
      setSnackbarMessage('Class deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/main');
    } catch (error) {
      setSnackbarMessage('Error deleting class');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleLeaveClass = async () => {
    try {
      await leaveClass({ classId, studentId: userInfo._id }).unwrap();
      setSnackbarMessage('Left class successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/main');
    } catch (error) {
      setSnackbarMessage('Error leaving class');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Typography variant="h6">Loading class details...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Typography variant="h6" color="error">Error loading class details</Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Keep the SlideTabs exactly as is */}
      <SlideTabs value={value} setValue={setValue} />

      {/* Tab Content */}
      <CustomTabPanel value={value} index={0}>
        <ShowAllViva classId={classId} />
      </CustomTabPanel>

      {/* Upload Lecture Modal - Redesigned */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          outline: 'none'
        }}>
          <Typography variant="h6" component="h2" mb={3} fontWeight="bold">
            Upload New Lecture
          </Typography>
          
          <TextField
            name="title"
            label="Lecture Title"
            fullWidth
            margin="normal"
            value={lectureData.title}
            onChange={handleInputChange}
            variant="outlined"
          />
          
          <TextField
            name="description"
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={lectureData.description}
            onChange={handleInputChange}
            variant="outlined"
          />
          
          <TextField
            name="youtubeLink"
            label="YouTube Video Link"
            fullWidth
            margin="normal"
            value={lectureData.youtubeLink}
            onChange={handleInputChange}
            variant="outlined"
            placeholder="https://www.youtube.com/watch?v=..."
            InputProps={{
              startAdornment: <YouTube color="error" sx={{ mr: 1 }} />
            }}
          />
          
          <Typography variant="body2" color="text.secondary" mt={2} mb={1}>
            Or upload a video file:
          </Typography>
          
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<UploadFileIcon />}
            sx={{ mb: 3 }}
          >
            Select Video File
            <input
              type="file"
              accept="video/*"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          
          {lectureData.video && (
            <Typography variant="body2" color="text.secondary">
              Selected: {lectureData.video.name}
            </Typography>
          )}
          
          <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
            <Button 
              variant="outlined" 
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!lectureData.title || (!lectureData.youtubeLink && !lectureData.video)}
              sx={{ 
                backgroundColor: '#5e35b1',
                '&:hover': { backgroundColor: '#4527a0' }
              }}
            >
              Upload Lecture
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for Notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClassPage;