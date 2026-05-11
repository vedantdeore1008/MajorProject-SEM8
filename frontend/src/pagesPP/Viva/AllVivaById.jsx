import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Typography,
  Modal,
  Select,
  MenuItem,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Avatar,
  Card,
  CardContent,
  Divider,
  useTheme,
  Tooltip,
  Badge,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  AutoFixHigh as AutoDraftIcon
} from '@mui/icons-material';
import CreateViva from './CreateViva'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router'
import { jsPDF } from 'jspdf' // For PDF generation
import 'jspdf-autotable' // For table support in PDF

const API = import.meta.env.VITE_BACKEND_URL

const AllVivaById = ({ classId }) => {
  const theme = useTheme();
  const [vivas, setVivas] = useState([]);
  const [openRows, setOpenRows] = useState({});
  const [students, setStudents] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editMode, setEditMode] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [resumeSubmissions, setResumeSubmissions] = useState({});
  const [questionEditor, setQuestionEditor] = useState({
    open: false,
    vivaId: '',
    studentId: '',
    studentName: '',
    questionAnswerSet: [],
  });
  const { userInfo } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const role = userInfo?.role;

  const parseMetric = (value, metricName) => {
    const regex = new RegExp(`${metricName}\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
    const match = String(value || '').match(regex);
    return match ? Number(match[1]) : null;
  };

  const parseEvaluation = (evaluation) => {
    if (evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)) {
      const relevance = Number(evaluation.Relevance ?? evaluation.relevance);
      const completeness = Number(evaluation.Completeness ?? evaluation.completeness);
      const accuracy = Number(evaluation.Accuracy ?? evaluation.accuracy);
      const depthOfKnowledge = Number(
        evaluation.DepthOfKnowledge ??
        evaluation.depthOfKnowledge ??
        evaluation['Depth of Knowledge']
      );
      const totalAverageScore = Number(
        evaluation.TotalAverageScore ??
        evaluation.totalAverageScore ??
        evaluation.average
      );

      return {
        Relevance: Number.isFinite(relevance) ? relevance : null,
        Completeness: Number.isFinite(completeness) ? completeness : null,
        Accuracy: Number.isFinite(accuracy) ? accuracy : null,
        DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : null,
        TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : null,
        rawText: typeof evaluation.rawText === 'string' ? evaluation.rawText : '',
      };
    }

    const text = String(evaluation || '');
    const relevance = parseMetric(text, 'Relevance');
    const completeness = parseMetric(text, 'Completeness');
    const accuracy = parseMetric(text, 'Accuracy');
    const depthOfKnowledge = parseMetric(text, 'Depth\\s*of\\s*Knowledge');
    let totalAverageScore = parseMetric(text, 'Total\\s*Average\\s*Score\\s*\\(?out\\s*of\\s*10\\)?');

    if (!Number.isFinite(totalAverageScore)) {
      const available = [relevance, completeness, accuracy, depthOfKnowledge].filter((v) => Number.isFinite(v));
      totalAverageScore = available.length ? available.reduce((sum, val) => sum + val, 0) / available.length : null;
    }

    return {
      Relevance: Number.isFinite(relevance) ? relevance : null,
      Completeness: Number.isFinite(completeness) ? completeness : null,
      Accuracy: Number.isFinite(accuracy) ? accuracy : null,
      DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : null,
      TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : null,
      rawText: text,
    };
  };

  const formatScore = (score) => {
    const numericScore = Number(score);
    return Number.isFinite(numericScore) ? numericScore.toFixed(2) : 'N/A';
  };

  const getFinalScore = (student) => {
    const savedScore = Number(student?.overallMark);
    if (Number.isFinite(savedScore) && savedScore > 0) {
      return savedScore;
    }

    const parsedScores = (student?.questionAnswerSet || [])
      .map((question) => parseEvaluation(question?.evaluation)?.TotalAverageScore)
      .filter((value) => Number.isFinite(value));

    if (parsedScores.length > 0) {
      return parsedScores.reduce((sum, value) => sum + value, 0) / parsedScores.length;
    }

    return savedScore;
  };
  // useEffect(() => {
  //   if (userInfo?.role) {
  //     setRole(userInfo.role)
  //     // console.log("Role updated:", userInfo.role);
  //   }
  // }, [userInfo?.role])
  useEffect(() => {
    const fetchAllVivas = async () => {
      try {
        const response = await axios.get(`${API}/viva/getallViva/${classId}`)
        setVivas(response.data)
        console.log(response.data)
      } catch (error) {
        console.error('Error fetching vivas:', error)
      }
    }
    fetchAllVivas()
  }, [classId])

  const fetchRegisteredStudents = async (vivaId) => {
    try {
      const response = await axios.get(
        `${API}/vivaresult/getvivaresult/${vivaId}`
      )
      console.log(response?.data?.data)
      setStudents((prev) => ({ ...prev, [vivaId]: response?.data }))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchResumeSubmissions = async (vivaId) => {
    try {
      const response = await axios.get(`${API}/viva/resumes/${vivaId}`)
      setResumeSubmissions((prev) => ({
        ...prev,
        [vivaId]: response?.data?.data || [],
      }))
    } catch (error) {
      console.error('Error fetching resume submissions:', error)
    }
  }

  const handleRowClick = (index, vivaId) => {
    setOpenRows((prev) => ({ ...prev, [index]: !prev[index] }))
    if (!students[vivaId]) fetchRegisteredStudents(vivaId)
    if (!resumeSubmissions[vivaId]) fetchResumeSubmissions(vivaId)
    console.log(vivaId)
  }

  const openQuestionEditor = (vivaId, submission) => {
    const existingSet = (submission.questionAnswerSet || []).map((q) => ({
      questionText: q.questionText || '',
      answer: q.answer || '',
      difficulty: q.difficulty || 'medium',
    }))

    const defaultSet = [
      ...Array.from({ length: 3 }, () => ({ questionText: '', answer: '', difficulty: 'easy' })),
      ...Array.from({ length: 3 }, () => ({ questionText: '', answer: '', difficulty: 'medium' })),
      ...Array.from({ length: 3 }, () => ({ questionText: '', answer: '', difficulty: 'hard' })),
    ]

    setQuestionEditor({
      open: true,
      vivaId,
      studentId: submission.studentId,
      studentName: submission.studentName,
      questionAnswerSet: existingSet.length > 0 ? existingSet : defaultSet,
    })
  }

  const handleGenerateDraft = async (vivaId, studentId) => {
    try {
      await axios.post(`${API}/viva/generate-resume-questions/${vivaId}`, { studentId })
      await fetchResumeSubmissions(vivaId)
    } catch (error) {
      console.error('Error generating draft questions:', error)
      window.alert(error?.response?.data?.message || 'Failed to generate AI draft questions.')
    }
  }

  const updateEditorQuestion = (index, field, value) => {
    setQuestionEditor((prev) => {
      const updated = [...prev.questionAnswerSet]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      return { ...prev, questionAnswerSet: updated }
    })
  }

  const saveTeacherQuestionSet = async () => {
    try {
      await axios.post(`${API}/viva/save-resume-questions/${questionEditor.vivaId}`, {
        studentId: questionEditor.studentId,
        questionAnswerSet: questionEditor.questionAnswerSet,
      })
      await fetchResumeSubmissions(questionEditor.vivaId)
      setQuestionEditor({
        open: false,
        vivaId: '',
        studentId: '',
        studentName: '',
        questionAnswerSet: [],
      })
    } catch (error) {
      console.error('Error saving teacher question set:', error)
      window.alert(error?.response?.data?.message || 'Failed to save teacher question set.')
    }
  }

  const handleStatusChange = async (vivaId, newStatus) => {
    try {
      await axios.put(`${API}/viva/updateViva/${vivaId}`, {
        status: newStatus,
      })
      setVivas((prev) =>
        prev.map((viva) =>
          viva._id === vivaId ? { ...viva, status: newStatus } : viva
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEdit = (viva) => {
    setEditMode(viva._id)
    setEditedData({ ...viva })
  }

  const handleSave = async (vivaId) => {
    try {
      await axios.put(`${API}/viva/updateViva/${vivaId}`, editedData)
      setVivas((prev) =>
        prev.map((viva) => (viva._id === vivaId ? { ...editedData } : viva))
      )
      setEditMode(null)
    } catch (error) {
      console.error('Error updating viva:', error)
    }
  }

  const handleCancel = () => {
    setEditMode(null)
  }
  const handleStartViva = (vivaId) => {
    navigate(`/takepicture/${vivaId}`)
  }

  const StudentDetailsModal = ({ student, open, onClose }) => {
    if (!student) return null
    // Function to download PDF
    const downloadPDF = () => {
      const doc = new jsPDF()

      // Add student details
      doc.setFontSize(16)
      doc.text('Student Details', 10, 10)
      doc.setFontSize(12)
      doc.text(`Name: ${student.studentName}`, 10, 20)
      doc.text(`Viva ID: ${student.vivaId}`, 10, 30)
      doc.text(
        `Date of Viva: ${new Date(student.dateOfViva).toLocaleString()}`,
        10,
        40
      )
      doc.text(`Total Questions: ${student.totalQuestions}`, 10, 50)
      doc.text(
        `Questions Attempted: ${student.questionAnswerSet.length}`,
        10,
        60
      )
      doc.text(`Overall Mark: ${formatScore(getFinalScore(student))}`, 10, 70)

      // Add proctored feedback
      doc.setFontSize(16)
      doc.text('Proctored Feedback', 10, 90)
      doc.setFontSize(12)
      doc.text(
        `Book Detected Count: ${student?.proctoredFeedback?.bookDetectedCount}`,
        10,
        100
      )
      doc.text(
        `Laptop Detected Count: ${student?.proctoredFeedback?.laptopDetectedCount}`,
        10,
        110
      )
      doc.text(
        `Multiple Users Detected Count: ${student?.proctoredFeedback?.multipleUsersDetectedCount}`,
        10,
        120
      )
      doc.text(
        `Phone Detected Count: ${student?.proctoredFeedback?.phoneDetectedCount}`,
        10,
        130
      )
      doc.text(
        `Tab Switching Detected Count: ${student?.proctoredFeedback?.tabSwitchingDetectedCount}`,
        10,
        140
      )

      // Add question details table
      doc.setFontSize(16)
      doc.text('Question Details', 10, 160)

      const tableData = student.questionAnswerSet.map((question) => {
        const parsedEvaluation = parseEvaluation(question.evaluation)
        return [
        question.questionText,
        question.modelAnswer,
        question.studentAnswer,
        `Relevance: ${parsedEvaluation.Relevance ?? 0}/10\nCompleteness: ${parsedEvaluation.Completeness ?? 0}/10\nAccuracy: ${parsedEvaluation.Accuracy ?? 0}/10\nDepth of Knowledge: ${parsedEvaluation.DepthOfKnowledge ?? 0}/10\nTotal Average: ${parsedEvaluation.TotalAverageScore ?? 0}/10`,
      ]
      })

      doc.autoTable({
        startY: 170,
        head: [['Question', 'Model Answer', 'Student Answer', 'Evaluation']],
        body: tableData,
      })

      // Save the PDF
      doc.save(`student_report_${student.studentName}.pdf`)
    }

    return (
      <Modal open={open} onClose={onClose}>
        <Box sx={modalStyle}>
          {/* Student Details Section */}
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Student Details
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Name:</strong> {student.studentName}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Viva ID:</strong> {student.vivaId}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Date of Viva:</strong>{' '}
            {new Date(student.dateOfViva).toLocaleString()}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Total Questions:</strong> {student.totalQuestions}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Questions Attempted:</strong>{' '}
            {student.questionAnswerSet.length}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Overall Mark:</strong> {formatScore(student.overallMark)}
          </Typography>

          {/* Proctored Feedback Section */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mt: 3, fontWeight: 'bold' }}
          >
            Proctored Feedback
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Book Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.bookDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Laptop Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.laptopDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Multiple Users Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.multipleUsersDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Phone Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.phoneDetectedCount}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Tab Switching Detected Count:</strong>{' '}
              {student?.proctoredFeedback?.tabSwitchingDetectedCount}
            </Typography>
          </Box>

      {/* Question Details Table */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        Question Details
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Question</strong>
              </TableCell>
              <TableCell>
                <strong>Model Answer</strong>
              </TableCell>
              <TableCell>
                <strong>Student Answer</strong>
              </TableCell>
              <TableCell>
                <strong>Evaluation</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {student.questionAnswerSet.map((question, index) => (
              <TableRow key={question._id}>
                <TableCell>{question.questionText}</TableCell>
                <TableCell>{question.modelAnswer}</TableCell>
                <TableCell>{question.studentAnswer}</TableCell>
                <TableCell>
                  {(() => {
                    const parsedEvaluation = parseEvaluation(question.evaluation)
                    return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Relevance:</strong> {parsedEvaluation.Relevance ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Completeness:</strong> {parsedEvaluation.Completeness ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Accuracy:</strong> {parsedEvaluation.Accuracy ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Depth of Knowledge:</strong> {parsedEvaluation.DepthOfKnowledge ?? 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Average Score:</strong> {parsedEvaluation.TotalAverageScore ?? 'N/A'}
                    </Typography>
                    {parsedEvaluation.rawText ? (
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                        {parsedEvaluation.rawText}
                      </Typography>
                    ) : null}
                  </Box>
                    )
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

          {/* Buttons Section */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={downloadPDF}>
              Download PDF
            </Button>
            <Button variant="contained" color="secondary" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    )
  }
  const getStatusColor = (status) => {
    return status === 'Active' ? 'success' : 'error';
  };
  return (
    <Box sx={{ p: 3, maxWidth: '1800px', mx: 'auto' }}>
    {/* Header Section */}
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
      flexWrap: 'wrap',
      gap: 2
    }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 'bold',
        color: 'black',
        fontFamily: 'Montserrat-Regular'
      }}>
        AI Interview Feature
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
        
        {role === 'teacher' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsModalOpen(true)}
            sx={{
              backgroundColor: '#C89365',
              '&:hover': {
                backgroundColor: '#c9bbae'
              }
            }}
          >
            Create AI Interview
          </Button>
        )}
      </Box>
    </Box>

    {/* Viva Cards/Table */}
    <Card elevation={3} sx={{ mb: 4 }}>
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                {role !== 'student' && <TableCell width="50px" />}
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Viva Name</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Questions</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Thinking Time</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Due Date</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Status</Typography></TableCell>
                <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vivas
                .filter((viva) => statusFilter === 'all' || viva.status === statusFilter)
                .map((viva, index) => (
                  <React.Fragment key={viva._id}>
                    <TableRow hover>
                      {role !== 'student' && (
                        <TableCell>
                          <IconButton
                            onClick={() => handleRowClick(index, viva._id)}
                            size="small"
                          >
                            {openRows[index] ? (
                              <KeyboardArrowUpIcon />
                            ) : (
                              <KeyboardArrowDownIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      )}

                      <TableCell>
                        {editMode === viva._id ? (
                          <TextField
                            size="small"
                            fullWidth
                            value={editedData.vivaname}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                vivaname: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <Typography fontWeight="medium">{viva.vivaname}</Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip 
                          label={viva.questionAnswerSet.length} 
                          style={{backgroundColor:'#C89365',color:'white'}}
                          size="small"
                        />
                      </TableCell>

                      <TableCell align="center">
                        {editMode === viva._id ? (
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: 80 }}
                            value={editedData.timeofthinking}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                timeofthinking: e.target.value,
                              })
                            }
                          />
                        ) : (
                          `${viva.timeofthinking} min`
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {editMode === viva._id ? (
                          <TextField
                            size="small"
                            type="date"
                            value={editedData.updatedAt.split('T')[0]}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                updatedAt: e.target.value,
                              })
                            }
                          />
                        ) : (
                          new Date(viva.updatedAt).toLocaleDateString()
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={viva.status === 'Active' ? 'Active' : 'Inactive'}
                          color={getStatusColor(viva.status)}
                          size="small"
                        />
                      </TableCell>

                      <TableCell align="center">
                        {role === 'student' ? (
                          <Button
                            variant="contained"
                            startIcon={<StartIcon />}
                            onClick={() => handleStartViva(viva._id)}
                            size="small"
                            sx={{
                              backgroundColor: theme.palette.success.main,
                              '&:hover': {
                                backgroundColor: theme.palette.success.dark
                              }
                            }}
                          >
                            Start
                          </Button>
                        ) : editMode === viva._id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Save">
                              <IconButton 
                                onClick={() => handleSave(viva._id)}
                                color="primary"
                              >
                                <SaveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton 
                                onClick={handleCancel}
                                color="error"
                              >
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title="Edit">
                            <IconButton 
                              onClick={() => handleEdit(viva)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Student Details */}
                    {role !== 'student' && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={openRows[index]} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, backgroundColor: theme.palette.grey[50] }}>
                              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Registered Students: {students[viva._id]?.data?.length || 0}
                              </Typography>

                              {students[viva._id]?.data?.length > 0 ? (
                                <TableContainer component={Paper} elevation={0}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Student</TableCell>
                                        <TableCell align="center">Questions</TableCell>
                                        <TableCell align="center">Attempted</TableCell>
                                        <TableCell align="center">Date/Time</TableCell>
                                        <TableCell align="center">Score</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {students[viva._id].data.map((student) => (
                                        <TableRow key={student._id} hover>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Avatar sx={{ width: 32, height: 32 }}>
                                                <PersonIcon fontSize="small" />
                                              </Avatar>
                                              <Typography style={{fontFamily:'Montserrat-Regular'}} >{student.studentName}</Typography>
                                            </Box>
                                          </TableCell>
                                          <TableCell align="center">{student.totalQuestions}</TableCell>
                                          <TableCell align="center">{student.questionAnswerSet.length}</TableCell>
                                          <TableCell align="center">
                                            {new Date(student.dateOfViva).toLocaleString()}
                                          </TableCell>
                                          <TableCell align="center">
                                            <Chip 
                                              label={formatScore(getFinalScore(student))} 
                                              style={{backgroundColor:'#C89365',color:'white'}}
                                              size="small"
                                            />
                                          </TableCell>
                                          <TableCell align="center">
                                            <Button
                                              variant="outlined"
                                              startIcon={<DescriptionIcon />}
                                              onClick={() => {
                                                setSelectedStudent(student);
                                                setIsStudentModalOpen(true);
                                              }}
                                              size="small"
                                              
                                              style={{color:'#C89365',borderColor:'#C89365',fontFamily:'Montserrat-Regular'}}
                                            >
                                              Details
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No students have taken this viva yet.
                                </Typography>
                              )}

                              <Divider sx={{ my: 3 }} />

                              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Resume Submissions: {resumeSubmissions[viva._id]?.length || 0}
                              </Typography>

                              {resumeSubmissions[viva._id]?.length > 0 ? (
                                <TableContainer component={Paper} elevation={0}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Student</TableCell>
                                        <TableCell>Resume</TableCell>
                                        <TableCell align="center">Easy</TableCell>
                                        <TableCell align="center">Medium</TableCell>
                                        <TableCell align="center">Hard</TableCell>
                                        <TableCell align="center">Prepared</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {resumeSubmissions[viva._id].map((submission) => {
                                        const easy = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'easy').length
                                        const medium = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'medium').length
                                        const hard = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'hard').length

                                        return (
                                          <TableRow key={submission._id || submission.studentId} hover>
                                            <TableCell>{submission.studentName || submission.studentId}</TableCell>
                                            <TableCell>
                                              <Button
                                                variant="text"
                                                component="a"
                                                href={`${API}${submission.resumeUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                size="small"
                                              >
                                                View Resume
                                              </Button>
                                            </TableCell>
                                            <TableCell align="center">{easy}</TableCell>
                                            <TableCell align="center">{medium}</TableCell>
                                            <TableCell align="center">{hard}</TableCell>
                                            <TableCell align="center">
                                              <Chip
                                                label={submission.preparedByTeacher ? 'Yes' : 'No'}
                                                color={submission.preparedByTeacher ? 'success' : 'default'}
                                                size="small"
                                              />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  startIcon={<AutoDraftIcon fontSize="small" />}
                                                  onClick={() => handleGenerateDraft(viva._id, submission.studentId)}
                                                >
                                                  AI Draft
                                                </Button>
                                                <Button
                                                  size="small"
                                                  variant="contained"
                                                  onClick={() => openQuestionEditor(viva._id, submission)}
                                                >
                                                  Edit 3/3/3
                                                </Button>
                                              </Box>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No resume uploaded yet by students.
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>

    {/* Empty State */}
    {vivas.length === 0 && (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 4,
        textAlign: 'center'
      }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No vivas found for this class
        </Typography>
        {role === 'teacher' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsModalOpen(true)}
            sx={{ mt: 2 }}
          >
            Create Your First Viva
          </Button>
        )}
      </Box>
    )}

    {/* Modals */}
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <Box sx={modalStyle}>
        <CreateViva onClose={() => setIsModalOpen(false)} classId={classId} />
      </Box>
    </Modal>

    <StudentDetailsModal
      student={selectedStudent}
      open={isStudentModalOpen}
      onClose={() => setIsStudentModalOpen(false)}
    />

    <Modal
      open={questionEditor.open}
      onClose={() =>
        setQuestionEditor({
          open: false,
          vivaId: '',
          studentId: '',
          studentName: '',
          questionAnswerSet: [],
        })
      }
    >
      <Box sx={modalStyle}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Prepare Questions for {questionEditor.studentName || questionEditor.studentId}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Keep exactly 3 easy, 3 medium and 3 hard questions. These will be asked by the AI interviewer.
        </Typography>

        {(questionEditor.questionAnswerSet || []).map((q, index) => (
          <Card key={index} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={q.difficulty || 'medium'}
                  label="Difficulty"
                  onChange={(e) => updateEditorQuestion(index, 'difficulty', e.target.value)}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={`Question ${index + 1}`}
                value={q.questionText}
                onChange={(e) => updateEditorQuestion(index, 'questionText', e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Model Answer"
                value={q.answer}
                onChange={(e) => updateEditorQuestion(index, 'answer', e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>
          </Card>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() =>
              setQuestionEditor({
                open: false,
                vivaId: '',
                studentId: '',
                studentName: '',
                questionAnswerSet: [],
              })
            }
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveTeacherQuestionSet}>
            Save 3/3/3 Set
          </Button>
        </Box>
      </Box>
    </Modal>
  </Box>
);
};

const modalStyle = {
position: 'absolute',
top: '50%',
left: '50%',
transform: 'translate(-50%, -50%)',
width: '80%',
maxWidth: '1000px',
bgcolor: 'background.paper',
boxShadow: 24,
p: 4,
borderRadius: 2,
maxHeight: '90vh',
overflowY: 'auto',
};

export default AllVivaById;