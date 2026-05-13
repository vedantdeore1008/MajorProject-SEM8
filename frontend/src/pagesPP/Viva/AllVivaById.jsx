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
  const [resumePreview, setResumePreview] = useState({ open: false, url: '', name: '' });
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
    const text = String(value || '');
    // Try to find "MetricName (out of 10): X/10" or "MetricName: X/10" format first (detailed evaluation)
    const slashRegex = new RegExp(`${metricName}[^:]*:\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)\\s*/\\s*10`, 'gi');
    const slashMatches = [...text.matchAll(slashRegex)];
    if (slashMatches.length > 0) {
      return Number(slashMatches[slashMatches.length - 1][1]);
    }
    // Try "MetricName: X" format - take the LAST occurrence (detailed section comes after summary)
    const regex = new RegExp(`${metricName}[^:]*[:=-]\\s*(?:\\*\\*)?\\s*(\\d+(?:\\.\\d+)?)`, 'gi');
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      // If there are multiple matches, prefer non-zero ones or use the last one
      const nonZero = matches.filter(m => Number(m[1]) > 0);
      if (nonZero.length > 0) return Number(nonZero[nonZero.length - 1][1]);
      return Number(matches[matches.length - 1][1]);
    }
    return null;
  };

  const parseEvaluation = (evaluation) => {
    if (!evaluation) return { Relevance: null, Completeness: null, Accuracy: null, DepthOfKnowledge: null, TotalAverageScore: null, rawText: '' };

    // Handle JSON object directly from backend
    if (evaluation && typeof evaluation === 'object' && !Array.isArray(evaluation)) {
      const relevance = Number(evaluation.Relevance ?? evaluation.relevance ?? 0);
      const completeness = Number(evaluation.Completeness ?? evaluation.completeness ?? 0);
      const accuracy = Number(evaluation.Accuracy ?? evaluation.accuracy ?? 0);
      const depthOfKnowledge = Number(
        evaluation.DepthOfKnowledge ??
        evaluation.depthOfKnowledge ??
        evaluation['Depth of Knowledge'] ?? 0
      );
      let totalAverageScore = Number(
        evaluation.TotalAverageScore ??
        evaluation.totalAverageScore ??
        evaluation.average ?? 0
      );

      // Calculate average if total is 0 but individual scores exist
      if (!totalAverageScore || totalAverageScore === 0) {
        const scores = [relevance, completeness, accuracy, depthOfKnowledge].filter(s => s > 0);
        if (scores.length > 0) totalAverageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }

      return {
        Relevance: Number.isFinite(relevance) ? relevance : null,
        Completeness: Number.isFinite(completeness) ? completeness : null,
        Accuracy: Number.isFinite(accuracy) ? accuracy : null,
        DepthOfKnowledge: Number.isFinite(depthOfKnowledge) ? depthOfKnowledge : null,
        TotalAverageScore: Number.isFinite(totalAverageScore) ? totalAverageScore : null,
        rawText: typeof evaluation.rawText === 'string' ? evaluation.rawText : JSON.stringify(evaluation),
      };
    }

    // Handle string format
    const text = String(evaluation || '');
    if (text.includes('No speech') || text.includes('no discernible') || text.length < 5) {
      return { Relevance: 0, Completeness: 0, Accuracy: 0, DepthOfKnowledge: 0, TotalAverageScore: 0, rawText: text };
    }

    // Try parsing as JSON string
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') return parseEvaluation(parsed);
    } catch {}

    const relevance = parseMetric(text, 'Relevance');
    const completeness = parseMetric(text, 'Completeness');
    const accuracy = parseMetric(text, 'Accuracy');
    const depthOfKnowledge = parseMetric(text, 'Depth\\s*(?:of\\s*)?Knowledge');
    let totalAverageScore = parseMetric(text, 'Total\\s*Average\\s*(?:Score)?');

    // Also try to find "X / 10" at the end after "Total Average Score"
    if (!Number.isFinite(totalAverageScore) || totalAverageScore === 0) {
      const totalMatch = text.match(/Total\s*Average\s*Score[^]*?(\d+(?:\.\d+)?)\s*\/\s*10/i);
      if (totalMatch && Number(totalMatch[1]) > 0) totalAverageScore = Number(totalMatch[1]);
    }

    // Calculate from individual scores if still not found
    if (!Number.isFinite(totalAverageScore) || totalAverageScore === 0) {
      const available = [relevance, completeness, accuracy, depthOfKnowledge].filter((v) => Number.isFinite(v) && v > 0);
      if (available.length > 0) totalAverageScore = available.reduce((sum, val) => sum + val, 0) / available.length;
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
    const totalQuestions = Number(student?.totalQuestions) || 0;
    const attempted = (student?.questionAnswerSet || []).length;

    // Parse scores from each attempted question
    const parsedScores = (student?.questionAnswerSet || [])
      .map((question) => {
        const eval_ = question?.evaluation;
        if (!eval_) return 0;
        const parsed = parseEvaluation(eval_);
        if (parsed?.TotalAverageScore != null && Number.isFinite(parsed.TotalAverageScore)) {
          return parsed.TotalAverageScore;
        }
        return 0;
      });

    if (parsedScores.length > 0) {
      const attemptedTotal = parsedScores.reduce((sum, value) => sum + value, 0);
      // Penalty: divide by total questions (not just attempted) so unattempted = 0
      const divisor = Math.max(totalQuestions, attempted, 1);
      return attemptedTotal / divisor;
    }

    const savedScore = Number(student?.overallMark);
    if (Number.isFinite(savedScore)) return savedScore;

    return 0;
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
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: '1800px', mx: 'auto' }}>
    {/* Header Section */}
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      mb: 3, flexWrap: 'wrap', gap: 2
    }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>AI Interview</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
          {role === 'teacher' ? 'Create and manage AI interviews for your students' : 'View and take your AI interviews'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small"
          sx={{ minWidth: 110, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}>
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
        {role === 'teacher' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}
            sx={{ backgroundColor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
            Create Interview
          </Button>
        )}
      </Box>
    </Box>

    {/* Viva Cards/Table */}
    <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                {role !== 'student' && <TableCell width="50px" />}
                <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Viva Name</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Questions</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Time</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Due Date</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Status</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vivas
                .filter((viva) => statusFilter === 'all' || viva.status === statusFilter)
                .map((viva, index) => (
                  <React.Fragment key={viva._id}>
                    <TableRow hover sx={{ '&:hover': { backgroundColor: '#fafbfc' } }}>
                      {role !== 'student' && (
                        <TableCell>
                          <IconButton onClick={() => handleRowClick(index, viva._id)} size="small" sx={{ color: '#64748b' }}>
                            {openRows[index] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                      )}
                      <TableCell>
                        {editMode === viva._id ? (
                          <TextField size="small" fullWidth value={editedData.vivaname}
                            onChange={(e) => setEditedData({ ...editedData, vivaname: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{viva.vivaname}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={viva.questionAnswerSet.length} size="small"
                          sx={{ fontWeight: 600, backgroundColor: '#eef2ff', color: '#4361ee', border: '1px solid #c7d2fe' }} />
                      </TableCell>
                      <TableCell align="center">
                        {editMode === viva._id ? (
                          <TextField size="small" type="number" sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            value={editedData.timeofthinking}
                            onChange={(e) => setEditedData({ ...editedData, timeofthinking: e.target.value })} />
                        ) : (
                          <Typography variant="body2" sx={{ color: '#64748b' }}>{viva.timeofthinking} min</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {editMode === viva._id ? (
                          <TextField size="small" type="date" value={editedData.duedate?.split('T')[0] || editedData.updatedAt?.split('T')[0] || ''}
                            onChange={(e) => setEditedData({ ...editedData, duedate: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: '#64748b' }}>{new Date(viva.duedate || viva.updatedAt).toLocaleDateString()}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const isActive = viva.status === 'Active' || new Date(viva.duedate) > new Date();
                          return (
                            <Chip label={isActive ? 'Active' : 'Inactive'} size="small"
                              sx={{ fontWeight: 600, backgroundColor: isActive ? '#ecfdf5' : '#fef2f2', color: isActive ? '#059669' : '#dc2626', border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}` }} />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {role === 'student' ? (
                          <Button variant="contained" startIcon={<StartIcon />} onClick={() => handleStartViva(viva._id)} size="small"
                            sx={{ backgroundColor: '#10b981', borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { backgroundColor: '#059669', boxShadow: 'none' } }}>
                            Start
                          </Button>
                        ) : editMode === viva._id ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Save"><IconButton onClick={() => handleSave(viva._id)} sx={{ color: '#4361ee' }}><SaveIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Cancel"><IconButton onClick={handleCancel} sx={{ color: '#ef4444' }}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        ) : (
                          <Tooltip title="Edit"><IconButton onClick={() => handleEdit(viva)} sx={{ color: '#4361ee' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Student Details */}
                    {role !== 'student' && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Collapse in={openRows[index]} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <PersonIcon sx={{ fontSize: 20, color: '#4361ee' }} />
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                  Student Results ({students[viva._id]?.data?.length || 0})
                                </Typography>
                              </Box>

                              {students[viva._id]?.data?.length > 0 ? (
                                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ backgroundColor: '#fff' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Student</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Questions</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Attempted</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Date</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Score</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {students[viva._id].data.map((student) => {
                                        const score = getFinalScore(student);
                                        return (
                                        <TableRow key={student._id} hover sx={{ '&:hover': { backgroundColor: '#fafbfc' } }}>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Avatar sx={{ width: 30, height: 30, fontSize: 12, backgroundColor: '#eef2ff', color: '#4361ee' }}>
                                                {student.studentName?.[0]?.toUpperCase() || 'S'}
                                              </Avatar>
                                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>{student.studentName}</Typography>
                                            </Box>
                                          </TableCell>
                                          <TableCell align="center"><Typography variant="body2" sx={{ color: '#64748b' }}>{student.totalQuestions}</Typography></TableCell>
                                          <TableCell align="center"><Typography variant="body2" sx={{ color: '#64748b' }}>{student.questionAnswerSet.length}</Typography></TableCell>
                                          <TableCell align="center"><Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem' }}>{new Date(student.dateOfViva).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Typography></TableCell>
                                          <TableCell align="center">
                                            <Chip label={formatScore(score)} size="small"
                                              sx={{ fontWeight: 600, backgroundColor: score >= 7 ? '#ecfdf5' : score >= 4 ? '#fffbeb' : '#fef2f2', color: score >= 7 ? '#059669' : score >= 4 ? '#d97706' : '#dc2626', border: `1px solid ${score >= 7 ? '#a7f3d0' : score >= 4 ? '#fde68a' : '#fecaca'}` }} />
                                          </TableCell>
                                          <TableCell align="center">
                                            <Button variant="outlined" size="small" startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                                              onClick={() => { setSelectedStudent(student); setIsStudentModalOpen(true); }}
                                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#c7d2fe', color: '#4361ee', '&:hover': { borderColor: '#4361ee', backgroundColor: '#eef2ff' } }}>
                                              Preview
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center', mb: 3, boxShadow: 'none' }}>
                                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>No students have taken this viva yet.</Typography>
                                </Paper>
                              )}

                              <Divider sx={{ my: 2 }} />

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <DescriptionIcon sx={{ fontSize: 20, color: '#6366f1' }} />
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                  Resume Submissions ({resumeSubmissions[viva._id]?.length || 0})
                                </Typography>
                              </Box>

                              {resumeSubmissions[viva._id]?.length > 0 ? (
                                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ backgroundColor: '#fff' }}>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Resume</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>E/M/H</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Actions</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {resumeSubmissions[viva._id].map((submission) => {
                                        const easy = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'easy').length;
                                        const medium = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'medium').length;
                                        const hard = (submission.questionAnswerSet || []).filter((q) => q.difficulty === 'hard').length;
                                        return (
                                          <TableRow key={submission._id || submission.studentId} hover sx={{ '&:hover': { backgroundColor: '#fafbfc' } }}>
                                            <TableCell><Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>{submission.studentName || submission.studentId}</Typography></TableCell>
                                            <TableCell>
                                              {submission.resumeUrl ? (
                                                <Button variant="text" size="small"
                                                  onClick={() => setResumePreview({ open: true, url: `${API}${submission.resumeUrl}`, name: submission.studentName || 'Student' })}
                                                  startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                                                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#4361ee' }}>
                                                  View PDF
                                                </Button>
                                              ) : (
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>No resume</Typography>
                                              )}
                                            </TableCell>
                                            <TableCell align="center">
                                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                <Chip label={easy} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#ecfdf5', color: '#059669', minWidth: 24 }} />
                                                <Chip label={medium} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#fffbeb', color: '#d97706', minWidth: 24 }} />
                                                <Chip label={hard} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#dc2626', minWidth: 24 }} />
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Chip label={submission.preparedByTeacher ? 'Ready' : 'Pending'} size="small"
                                                sx={{ fontWeight: 600, fontSize: '0.7rem', backgroundColor: submission.preparedByTeacher ? '#ecfdf5' : '#fffbeb', color: submission.preparedByTeacher ? '#059669' : '#d97706', border: `1px solid ${submission.preparedByTeacher ? '#a7f3d0' : '#fde68a'}` }} />
                                            </TableCell>
                                            <TableCell align="center">
                                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Button size="small" variant="outlined" startIcon={<AutoDraftIcon sx={{ fontSize: 14 }} />}
                                                  onClick={() => handleGenerateDraft(viva._id, submission.studentId)}
                                                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', borderColor: '#ddd6fe', color: '#7c3aed', '&:hover': { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' } }}>
                                                  AI Draft
                                                </Button>
                                                <Button size="small" variant="contained" onClick={() => openQuestionEditor(viva._id, submission)}
                                                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', backgroundColor: '#4361ee', boxShadow: 'none', '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
                                                  Edit 3/3/3
                                                </Button>
                                              </Box>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : (
                                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: 'none' }}>
                                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>No resume uploaded yet by students.</Typography>
                                </Paper>
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
      <Paper sx={{ p: 6, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>No interviews found</Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          {role === 'teacher' ? 'Create your first AI interview to get started' : 'No interviews available yet'}
        </Typography>
        {role === 'teacher' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}
            sx={{ backgroundColor: '#4361ee', borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
            Create Your First Interview
          </Button>
        )}
      </Paper>
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

    {/* Resume Preview Modal */}
    <Modal open={resumePreview.open} onClose={() => setResumePreview({ open: false, url: '', name: '' })}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '95%', md: '80%' }, maxWidth: 900, height: '85vh',
        bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Resume — {resumePreview.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" component="a" href={resumePreview.url} target="_blank" rel="noreferrer" size="small"
              startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#e2e8f0', color: '#4361ee' }}>
              Open in New Tab
            </Button>
            <IconButton onClick={() => setResumePreview({ open: false, url: '', name: '' })} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: 0 }}>
          <iframe
            src={resumePreview.url}
            title="Resume Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
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
width: { xs: '95%', sm: '85%', md: '80%' },
maxWidth: '1000px',
bgcolor: 'background.paper',
boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
p: { xs: 2, md: 4 },
borderRadius: 3,
maxHeight: '90vh',
overflowY: 'auto',
border: '1px solid #e2e8f0',
};

export default AllVivaById;