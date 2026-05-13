import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Video_analysis from "./VideoAnalysis.jsx";
import {
  Button, Skeleton, Box, Typography, Paper, Alert, CircularProgress, Chip,
  LinearProgress, IconButton, Card, CardContent, Stack
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import CallEndIcon from "@mui/icons-material/CallEnd";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import HearingIcon from "@mui/icons-material/Hearing";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";
import AlertAgreeDisagree from "./AlerttAgreeDisagree.jsx";
import { useSelector } from "react-redux";
import { PYTHON_URL } from "../../redux/constants";

const API = import.meta.env.VITE_BACKEND_URL;

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [questionload, setQuestionload] = useState(false);
  const { username, interviewId, vivadata } = location.state || {};
  const [questionSet, setQuestionSet] = useState([]);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [easyPool, setEasyPool] = useState([]);
  const [mediumPool, setMediumPool] = useState([]);
  const [hardPool, setHardPool] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState("easy");
  const [askedCounts, setAskedCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [allowedCounts, setAllowedCounts] = useState({ easy: 1, medium: 0, hard: 0 });
  const [attemptsPerDifficulty, setAttemptsPerDifficulty] = useState({ easy: 0, medium: 0, hard: 0 });
  const [micOn, setMicOn] = useState(false);
  const [qHistory, setQHistory] = useState([]);
  const [c_answer, setCurrentAnswer] = useState("");
  const [c_question, setCurrentQuestion] = useState("");
  const [timer, setTimer] = useState(0);
  const [timeofthinking, setTimeOfThinking] = useState(0);
  const [started, setStarted] = useState(false);
  const [loadendViva, setLoadendViva] = useState(false);
  const [endVideo, setEndVideo] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isVivaEnded, setIsVivaEnded] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [report, setReport] = useState(null);
  const [askQuestion, setAskQuestion] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [teacherQuestionsReady, setTeacherQuestionsReady] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [vivaStatus, setVivaStatus] = useState("idle"); // idle | speaking | listening | processing | complete
  const [audioPermission, setAudioPermission] = useState(null); // null | granted | denied
  const [startingViva, setStartingViva] = useState(false);
  const [fetchingQuestions, setFetchingQuestions] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [coldStartTimer, setColdStartTimer] = useState(0);
  const [coldStartStage, setColdStartStage] = useState(0);

  const { vivaId } = useParams();
  const { userInfo } = useSelector((state) => state.user);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const saveAttemptedRef = useRef(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const isListeningRef = useRef(false);

  const finalizeViva = (reportData = null) => {
    if (saveAttemptedRef.current) return;
    saveAttemptedRef.current = true;
    const fallbackReport = reportData || {
      allDetectedObjects: {
        phoneDetectedCount: 0, laptopDetectedCount: 0,
        bookDetectedCount: 0, multipleUsersDetectedCount: 0,
        tabSwitchingDetectedCount: 0,
      },
    };
    setReport(fallbackReport);
    setReportReady(true);
  };

  // Cold start timer + staged messages
  useEffect(() => {
    if (coldStartTimer > 0) {
      const interval = setInterval(() => {
        setColdStartTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [coldStartTimer > 0]);

  useEffect(() => {
    if (coldStartTimer <= 0) { setColdStartStage(0); return; }
    if (coldStartTimer >= 40) setColdStartStage(5);
    else if (coldStartTimer >= 30) setColdStartStage(4);
    else if (coldStartTimer >= 20) setColdStartStage(3);
    else if (coldStartTimer >= 12) setColdStartStage(2);
    else if (coldStartTimer >= 5) setColdStartStage(1);
    else setColdStartStage(0);
  }, [coldStartTimer]);

  const speakText = async (text, rate = 0.95) => {
    setVivaStatus("speaking");
    try {
      const response = await fetch(`${PYTHON_URL}/generate_speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (data.speech) {
        setColdStartTimer(0);
        const byteCharacters = atob(data.speech);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        audio.addEventListener("ended", () => {
          setTimer(timeofthinking * 60);
          setMicOn(true);
          setVivaStatus("listening");
          startAudioRecording();
          URL.revokeObjectURL(audioUrl);
        });
        setCurrentQuestion(text);
        setQuestionload(false);
        setStarted(true);
        setStartingViva(false);
      } else {
        throw new Error("No speech data received from the API");
      }
    } catch (error) {
      console.error("Error with Flask TTS, falling back to browser voice:", error);
      setColdStartTimer(0);
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = rate;
        utterance.pitch = 1.0;
        const voices = synth.getVoices();
        const preferred = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
          voices.find(v => v.name.includes("Natural") && v.lang.startsWith("en")) ||
          voices.find(v => v.name.includes("Microsoft") && v.lang.startsWith("en") && v.name.includes("Online")) ||
          voices.find(v => v.lang.startsWith("en-") && !v.localService) ||
          voices.find(v => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
        utterance.onend = () => {
          setTimer(timeofthinking * 60);
          setMicOn(true);
          setVivaStatus("listening");
          startAudioRecording();
        };
        utterance.onerror = () => { setMicOn(false); setStartingViva(false); };
        synth.speak(utterance);
        setCurrentQuestion(text);
        setQuestionload(false);
        setStarted(true);
        setStartingViva(false);
      } else {
        setMicOn(false);
        setStartingViva(false);
      }
    }
  };

  const parseEvaluationScore = (evaluation) => {
    try {
      if (!evaluation) return 0;
      if (typeof evaluation === 'object' && !Array.isArray(evaluation)) {
        const numVals = [];
        ['TotalAverageScore','TotalAverage','totalAverageScore','totalAverage','average'].forEach(k => {
          if (evaluation[k] && !isNaN(Number(evaluation[k]))) numVals.push(Number(evaluation[k]));
        });
        ['Relevance','relevance','Completeness','completeness','Accuracy','accuracy','DepthOfKnowledge','depthOfKnowledge'].forEach(k => {
          if (evaluation[k] && !isNaN(Number(evaluation[k]))) numVals.push(Number(evaluation[k]));
        });
        if (numVals.length) return numVals.reduce((a, b) => a + b, 0) / numVals.length;
        return 0;
      }
      const text = String(evaluation || '');
      const m = text.match(/Total\s*Average\s*(?:Score)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i);
      if (m) return Number(m[1]);
      const numbers = Array.from(text.matchAll(/(Relevance|Completeness|Accuracy|Depth(?: of )?Knowledge)\s*[:=-]?\s*(\d+(?:\.\d+)?)/ig)).map(x => Number(x[2]));
      if (numbers.length) return numbers.reduce((a, b) => a + b, 0) / numbers.length;
      const anyNum = text.match(/(\d+(?:\.\d+)?)/);
      if (anyNum) return Number(anyNum[1]);
      return 0;
    } catch { return 0; }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported - will use audio file only");
      return;
    }

    // Stop any existing recognition first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    isListeningRef.current = true;
    let finalTranscript = "";

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + " ";
          } else {
            interim = t;
          }
        }
        transcriptRef.current = (finalTranscript + interim).trim();
        setLiveTranscript(transcriptRef.current);
      };

      recognition.onerror = (event) => {
        console.warn("SpeechRecognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          isListeningRef.current = false;
          setAudioPermission('denied');
        }
        // For network/no-speech errors, let onend handle restart
      };

      recognition.onend = () => {
        // Use ref (not state) to avoid stale closure
        if (isListeningRef.current) {
          setTimeout(() => {
            if (isListeningRef.current) {
              try {
                const newRecog = createRecognition();
                newRecog.start();
                recognitionRef.current = newRecog;
              } catch (e) {
                console.warn("Failed to restart recognition:", e);
              }
            }
          }, 100);
        }
      };

      return recognition;
    };

    try {
      const recognition = createRecognition();
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Failed to start SpeechRecognition:", err);
      isListeningRef.current = false;
    }
  };

  const stopSpeechRecognition = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    const captured = transcriptRef.current;
    transcriptRef.current = "";
    setLiveTranscript("");
    return captured;
  };

  const startAudioRecording = () => {
    transcriptRef.current = "";
    setLiveTranscript("");

    // Start speech recognition
    startSpeechRecognition();

    // Also start MediaRecorder as backup
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
      }
    }).then((stream) => {
      streamRef.current = stream;

      // Verify audio tracks are active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        console.warn("No active audio tracks found");
      }

      const preferredMimeTypes = [
        "audio/webm;codecs=opus", "audio/webm",
        "audio/ogg;codecs=opus", "audio/ogg",
        "audio/mp4", "audio/mpeg", ""
      ];
      let supportedMimeType = null;
      for (const t of preferredMimeTypes) {
        try {
          if (!t || MediaRecorder.isTypeSupported(t)) { supportedMimeType = t || undefined; break; }
        } catch { /* skip */ }
      }
      const options = supportedMimeType ? { mimeType: supportedMimeType } : undefined;
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onerror = (e) => console.error("MediaRecorder error:", e);
      mediaRecorder.start(1000);
    }).catch((error) => {
      console.error("Error accessing microphone:", error);
    });
  };

  const stopAudioRecording = async () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      const finalize = () => {
        try {
          if (audioChunksRef.current.length === 0) {
            console.warn("No audio chunks recorded");
            resolve(null);
            return;
          }
          const recordedMimeType = recorder.mimeType || audioChunksRef.current[0]?.type || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: recordedMimeType });
          if (audioBlob.size < 100) {
            console.warn("Audio blob too small:", audioBlob.size);
            resolve(null);
            return;
          }
          const extension = recordedMimeType.includes("ogg") ? "ogg" : recordedMimeType.includes("mp4") ? "mp4" : "webm";
          const file = new File([audioBlob], `recording_${Date.now()}.${extension}`, { type: recordedMimeType });
          resolve(file);
        } catch (err) {
          console.error("Error creating audio file:", err);
          resolve(null);
        }
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      if (recorder.state === "recording") {
        recorder.requestData();
      }
      recorder.onstop = finalize;
      try {
        if (recorder.state !== "inactive") recorder.stop();
        else finalize();
      } catch { finalize(); }
    });
  };

  const checkAudioPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setAudioPermission('granted');
      return true;
    } catch {
      setAudioPermission('denied');
      return false;
    }
  };

  useEffect(() => { checkAudioPermission(); }, []);

  const fetchQuestionSet = async () => {
    setFetchingQuestions(true);
    try {
      const response = await axios.get(`${API}/viva/getOneViva/${vivaId}`, { params: { studentId: userInfo?._id } });
      const fetchedQuestions = response?.data?.questionAnswerSet || [];
      const resumeStatus = response?.data?.studentResumeStatus || {};
      const easy = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "easy");
      const medium = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "medium");
      const hard = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "hard");
      const total = Number(response?.data?.numberOfQuestionsToAsk) || fetchedQuestions.length || 0;
      const allowedHard = Math.max(1, Math.floor(total * 0.2));
      const allowedEasy = 1;
      const allowedMedium = Math.max(0, total - allowedEasy - allowedHard);
      setQuestionSet(fetchedQuestions);
      setRemainingQuestions(fetchedQuestions);
      setEasyPool(easy); setMediumPool(medium); setHardPool(hard);
      setTimeOfThinking(response?.data?.timeofthinking || 0);
      setAskQuestion(total);
      setResumeUploaded(Boolean(resumeStatus.uploaded));
      setTeacherQuestionsReady(Boolean(resumeStatus.preparedByTeacher) || Boolean(response?.data?.isPersonalizedQuestionSet));
      setAllowedCounts({ easy: allowedEasy, medium: allowedMedium, hard: allowedHard });
      if (resumeStatus.uploaded && !resumeStatus.preparedByTeacher) {
        setResumeMessage("Resume uploaded. Waiting for teacher to prepare your personalized questions.");
      } else if (resumeStatus.preparedByTeacher || response?.data?.isPersonalizedQuestionSet) {
        setResumeMessage("Your personalized interview questions are ready. Click Start to begin.");
      } else {
        setResumeMessage("Upload your resume PDF to get personalized questions.");
      }
    } catch (error) { console.error("Error Fetching viva:", error); }
    finally { setFetchingQuestions(false); }
  };

  useEffect(() => { if (userInfo?._id) fetchQuestionSet(); }, [userInfo?._id]);

  const handleResumeUpload = async () => {
    if (!resumeFile) { setResumeMessage("Please select a PDF file."); return; }
    try {
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("studentId", userInfo?._id || "");
      formData.append("studentName", userInfo?.name || "");
      await axios.post(`${API}/viva/upload-resume/${vivaId}`, formData);
      setResumeUploaded(true);
      setResumeMessage("Resume uploaded! Teacher will finalize your question set.");
      await fetchQuestionSet();
    } catch (error) { setResumeMessage(error?.response?.data?.message || "Upload failed."); }
    finally { setResumeUploading(false); }
  };

  const startViva = async () => {
    if (!teacherQuestionsReady) { setResumeMessage("Please wait for the teacher to finalize your questions."); return; }
    setStartingViva(true);
    setColdStartTimer(1);
    const hasAudio = await checkAudioPermission();
    if (!hasAudio) { setStartingViva(false); setColdStartTimer(0); return; }
    setCurrentDifficulty("easy");
    setAskedCounts({ easy: 0, medium: 0, hard: 0 });
    setAttemptsPerDifficulty({ easy: 0, medium: 0, hard: 0 });
    selectNextQuestion();
  };

  const selectNextQuestion = () => {
    if (isVivaEnded || questionsAsked >= askQuestion) { handleAgree(); return; }
    const pickFromPool = (pool) => { if (!pool || pool.length === 0) return null; const idx = Math.floor(Math.random() * pool.length); return { item: pool[idx], idx }; };
    let chosen = null; let chosenDifficulty = currentDifficulty;
    if (currentDifficulty === "easy" && askedCounts.easy < allowedCounts.easy) { const pick = pickFromPool(easyPool); if (pick) { chosen = pick; chosenDifficulty = "easy"; } }
    if (!chosen && currentDifficulty === "medium" && askedCounts.medium < allowedCounts.medium) { const pick = pickFromPool(mediumPool); if (pick) { chosen = pick; chosenDifficulty = "medium"; } }
    if (!chosen && currentDifficulty === "hard" && askedCounts.hard < allowedCounts.hard) { const pick = pickFromPool(hardPool); if (pick) { chosen = pick; chosenDifficulty = "hard"; } }
    if (!chosen) { let pick = pickFromPool(easyPool); if (pick && askedCounts.easy < allowedCounts.easy) { chosen = pick; chosenDifficulty = "easy"; } }
    if (!chosen) { let pick = pickFromPool(mediumPool); if (pick && askedCounts.medium < allowedCounts.medium) { chosen = pick; chosenDifficulty = "medium"; } }
    if (!chosen) { let pick = pickFromPool(hardPool); if (pick && askedCounts.hard < allowedCounts.hard) { chosen = pick; chosenDifficulty = "hard"; } }
    if (!chosen) { handleAgree(); return; }
    const selectedQuestion = chosen.item;
    if (chosenDifficulty === "easy") setEasyPool((p) => p.filter((_, i) => i !== chosen.idx));
    if (chosenDifficulty === "medium") setMediumPool((p) => p.filter((_, i) => i !== chosen.idx));
    if (chosenDifficulty === "hard") setHardPool((p) => p.filter((_, i) => i !== chosen.idx));
    speakText(selectedQuestion.questionText);
    setCurrentAnswer(selectedQuestion.answer);
    setQuestionsAsked((prev) => prev + 1);
    setAskedCounts((prev) => ({ ...prev, [chosenDifficulty]: (prev[chosenDifficulty] || 0) + 1 }));
    setCurrentDifficulty(chosenDifficulty);
  };

  const handleNextQuestion = async () => {
    if (isVivaEnded) return;
    setTimer(0); setLoading(true); setQuestionload(true); setMicOn(false);
    setVivaStatus("processing");

    const speechTranscript = stopSpeechRecognition();
    const audioFile = await stopAudioRecording();

    if ((!speechTranscript || speechTranscript.length < 3) && (!audioFile || audioFile.size < 100)) {
      console.warn("No speech or audio captured");
      setQHistory((prev) => [...prev, { questionText: c_question, modelAnswer: c_answer, studentAnswer: "No speech detected", evaluation: { Relevance: 0, Completeness: 0, Accuracy: 0, DepthOfKnowledge: 0, TotalAverageScore: 0, rawText: "No speech detected" } }]);
      setQuestionload(false);
      if (!isVivaEnded) selectNextQuestion();
      return;
    }

    const formData = new FormData();
    formData.append("question", c_question);
    formData.append("modelAnswer", c_answer);
    if (speechTranscript && speechTranscript.length >= 3) {
      formData.append("transcript", speechTranscript);
    }
    if (audioFile && audioFile.size >= 100) {
      formData.append("audio", audioFile);
    }
    try {
      const response = await axios.post(`${API}/viva/send-to-gemini`, formData);
      const evalText = response?.data?.evaluation;
      setQHistory((prev) => [...prev, { questionText: c_question, modelAnswer: c_answer, studentAnswer: response?.data?.transcript, evaluation: evalText }]);
      const score = parseEvaluationScore(evalText);
      const PASS_THRESHOLD = 6.0;
      const current = currentDifficulty || 'easy';
      if (score >= PASS_THRESHOLD) {
        if (current === 'easy' && allowedCounts.medium > 0) setCurrentDifficulty('medium');
        else if (current === 'medium' && askedCounts.medium + 1 >= allowedCounts.medium && allowedCounts.hard > 0) setCurrentDifficulty('hard');
        else if (current === 'hard') setCurrentDifficulty('hard');
      } else {
        setAttemptsPerDifficulty((prev) => ({ ...prev, [current]: (prev[current] || 0) + 1 }));
        const attempts = attemptsPerDifficulty[current] || 0;
        if (attempts + 1 >= 1) {
          if (current === 'easy' && allowedCounts.medium > 0) setCurrentDifficulty('medium');
          else if (current === 'medium' && allowedCounts.hard > 0) setCurrentDifficulty('hard');
        }
      }
    } catch (error) {
      const errorPayload = error?.response?.data;
      const errorText = typeof errorPayload?.details === "string" && errorPayload.details.trim().length ? errorPayload.details : typeof errorPayload?.error === "string" && errorPayload.error.trim().length ? errorPayload.error : error?.message || "Unknown error";
      setQHistory((prev) => [...prev, { questionText: c_question, modelAnswer: c_answer, studentAnswer: `ERROR: ${errorText}`, evaluation: `ERROR: ${errorText}` }]);
      const current = currentDifficulty || 'easy';
      setAttemptsPerDifficulty((prev) => ({ ...prev, [current]: (prev[current] || 0) + 1 }));
      const attempts = attemptsPerDifficulty[current] || 0;
      if (attempts + 1 >= 1) {
        if (current === 'easy' && allowedCounts.medium > 0) setCurrentDifficulty('medium');
        else if (current === 'medium' && allowedCounts.hard > 0) setCurrentDifficulty('hard');
      }
    } finally {
      if (!isVivaEnded) selectNextQuestion();
      setQuestionload(false);
    }
  };

  const endViva = () => setOpenDialog(true);

  const handleAgree = async () => {
    setEndVideo(true); setOpenDialog(false); setLoadendViva(true);
    speechSynthesis.cancel();
    setCurrentQuestion("Interview completed successfully!");
    setIsVivaEnded(true); setVivaStatus("complete");
    window.setTimeout(() => finalizeViva(), 1000);
  };

  const handleDisagree = () => setOpenDialog(false);

  useEffect(() => {
    if (reportReady && report) {
      const saveResults = async () => {
        try {
          const response = await axios.post(`${API}/vivaresult/addvivaresult`, {
            vivaId, studentId: userInfo?._id, studentName: userInfo?.name,
            totalQuestions: questionSet?.length, questionAnswerSet: qHistory,
            dateOfViva: Date.now(), proctoredFeedback: report?.allDetectedObjects,
          });
          if (response.status === 200 || response.status === 201) {
            navigate("/viva-results", { state: { resultId: response?.data?.data?._id } });
          } else { navigate('/main'); }
        } catch (error) { console.error("Error saving viva results:", error); navigate('/main'); }
      };
      saveResults();
    }
  }, [reportReady, report]);

  useEffect(() => {
    if (timer > 1) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else if (timer === 1 && started) { handleNextQuestion(); }
  }, [timer, started]);

  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop()); window.speechSynthesis.cancel(); };
  }, []);

  const getDifficultyColor = (diff) => {
    if (diff === 'easy') return '#10b981';
    if (diff === 'medium') return '#f59e0b';
    return '#ef4444';
  };

  const getStatusLabel = () => {
    switch (vivaStatus) {
      case 'speaking': return { text: 'AI is asking...', color: '#6366f1', icon: <VolumeUpIcon sx={{ fontSize: 18 }} /> };
      case 'listening': return { text: 'Listening to you', color: '#10b981', icon: <HearingIcon sx={{ fontSize: 18 }} /> };
      case 'processing': return { text: 'Evaluating answer...', color: '#f59e0b', icon: <AutorenewIcon sx={{ fontSize: 18, animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> };
      case 'complete': return { text: 'Interview Complete', color: '#10b981', icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> };
      default: return { text: 'Ready to start', color: '#64748b', icon: null };
    }
  };

  const progress = askQuestion > 0 ? (questionsAsked / askQuestion) * 100 : 0;
  const statusInfo = getStatusLabel();

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc", p: { xs: 1.5, md: 3 } }}>
      {/* Top Bar */}
      <Paper sx={{ mb: 2, p: 2, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: { xs: '1rem', md: '1.15rem' } }}>
            AI Interview
          </Typography>
          {started && (
            <Chip
              label={`${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}`}
              size="small"
              sx={{ fontWeight: 600, backgroundColor: `${getDifficultyColor(currentDifficulty)}15`, color: getDifficultyColor(currentDifficulty) }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {started && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2, backgroundColor: `${statusInfo.color}10`, border: `1px solid ${statusInfo.color}30` }}>
              {statusInfo.icon}
              <Typography variant="body2" sx={{ fontWeight: 600, color: statusInfo.color, fontSize: '0.8rem' }}>
                {statusInfo.text}
              </Typography>
            </Box>
          )}
          {started && !loadendViva && (
            <Button variant="contained" color="error" size="small" endIcon={<CallEndIcon />} onClick={endViva}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
              End Interview
            </Button>
          )}
        </Box>
      </Paper>

      {/* Progress Bar */}
      {started && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              Question {Math.min(questionsAsked, askQuestion)} of {askQuestion}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress}
            sx={{ height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: '#4361ee' } }} />
        </Box>
      )}

      {/* Audio Permission Warning */}
      {audioPermission === 'denied' && !started && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Microphone access required</Typography>
          <Typography variant="caption">Please allow microphone access in your browser settings and refresh the page. The interview needs audio to capture your answers.</Typography>
        </Alert>
      )}

      {/* Loading Questions */}
      {fetchingQuestions && (
        <Paper sx={{ mb: 2, p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
          <CircularProgress size={28} sx={{ color: '#4361ee', mb: 1.5 }} />
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Loading interview data from server...</Typography>
        </Paper>
      )}

      {/* Resume Upload Section */}
      {userInfo?.role === "student" && !started && !fetchingQuestions && (
        <Paper sx={{ mb: 2, p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Alert severity={teacherQuestionsReady ? "success" : "info"} sx={{ mb: 2, borderRadius: 2 }}>
            {resumeMessage}
          </Alert>
          {!teacherQuestionsReady && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
              <Button variant="outlined" component="label" size="small" startIcon={<UploadFileIcon />}
                disabled={resumeUploading || teacherQuestionsReady}
                sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b' }}>
                Select Resume
                <input type="file" hidden accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
              </Button>
              {resumeFile && <Chip size="small" label={resumeFile.name} sx={{ backgroundColor: '#f1f5f9' }} />}
              <Button variant="contained" size="small" disabled={resumeUploading || !resumeFile || teacherQuestionsReady}
                onClick={handleResumeUpload} sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: '#4361ee', '&:hover': { backgroundColor: '#3730a3' } }}>
                {resumeUploading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : "Upload"}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Cold Start Loading Overlay */}
      {startingViva && coldStartTimer > 0 && (
        <Paper sx={{ mb: 2, p: 3, borderRadius: 3, border: '1px solid #e0e7ff', boxShadow: '0 4px 20px rgba(67,97,238,0.08)', backgroundColor: '#fafbff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={28} sx={{ color: '#4361ee' }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Setting up your AI Interview
            </Typography>
            <Chip label={`${coldStartTimer}s`} size="small" sx={{ ml: 'auto', backgroundColor: '#eef2ff', color: '#4361ee', fontWeight: 600 }} />
          </Box>
          <Box sx={{ pl: 1 }}>
            {[
              { label: 'Preparing AI Engine', done: coldStartStage >= 1 },
              { label: 'Scanning your resume & profile', done: coldStartStage >= 2 },
              { label: 'Building relevant questions based on difficulty', done: coldStartStage >= 3 },
              { label: 'Setting up proctoring & anti-cheat monitors', done: coldStartStage >= 4 },
              { label: 'Initializing voice synthesis engine', done: coldStartStage >= 5 },
            ].map((step, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                {step.done ? (
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
                ) : i === coldStartStage ? (
                  <AutorenewIcon sx={{ fontSize: 18, color: '#4361ee', animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                ) : (
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e2e8f0' }} />
                )}
                <Typography variant="body2" sx={{ color: step.done ? '#10b981' : i === coldStartStage ? '#4361ee' : '#94a3b8', fontWeight: step.done || i === coldStartStage ? 600 : 400 }}>
                  {step.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <LinearProgress variant="determinate" value={Math.min((coldStartStage / 5) * 100, 100)} sx={{ mt: 2, height: 4, borderRadius: 2, backgroundColor: '#e0e7ff', '& .MuiLinearProgress-bar': { backgroundColor: '#4361ee', borderRadius: 2 } }} />
        </Paper>
      )}

      <AlertAgreeDisagree open={openDialog} title="End Interview" description="Are you sure you want to end this interview? Your answers so far will be saved and evaluated." confirmText="Yes, End" cancelText="Continue" onConfirm={handleAgree} onCancel={handleDisagree} />

      {/* Main Content */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "340px 1fr" }, gap: 2, overflow: 'hidden' }}>
        {/* Left: Video */}
        <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: started ? '#10b981' : '#94a3b8' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
              {started ? 'Proctoring Active' : 'Camera Feed'}
            </Typography>
            {started && micOn && (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'blink 1s infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, fontSize: '0.65rem' }}>REC</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', minHeight: { xs: 220, md: 300 }, maxHeight: { xs: 280, md: 360 } }}>
            <Video_analysis endVideo={endVideo} onAnalysisComplete={(report) => { setReport(report); setReportReady(true); finalizeViva(report); }} />
          </Box>
        </Paper>

        {/* Right: Question & Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, overflow: 'hidden' }}>
          {/* Question Card */}
          <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {started ? `Question ${questionsAsked}` : 'Interview Question'}
              </Typography>
              {started && timer > 0 && (
                <Chip
                  label={`${Math.floor(timer / 60).toString().padStart(2, "0")}:${(timer % 60).toString().padStart(2, "0")}`}
                  size="small"
                  sx={{ fontWeight: 700, fontFamily: 'monospace', backgroundColor: timer < 30 ? '#fef2f2' : '#f0fdf4', color: timer < 30 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}
                />
              )}
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 }, flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              {questionload ? (
                <Box sx={{ width: '100%' }}>
                  <Skeleton animation="wave" height={22} width="90%" sx={{ mb: 1 }} />
                  <Skeleton animation="wave" height={22} width="75%" sx={{ mb: 1 }} />
                  <Skeleton animation="wave" height={22} width="60%" />
                </Box>
              ) : (
                <Typography variant="body1" sx={{
                  color: '#1e293b', lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1.05rem' },
                  wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', width: '100%',
                }}>
                  {c_question || (teacherQuestionsReady ? "Press Start Interview to begin your AI-powered viva session." : "Upload your resume and wait for the teacher to prepare your questions.")}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Controls */}
          {!loadendViva && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                {!started ? (
                  <Button variant="contained" onClick={startViva} startIcon={startingViva ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PlayArrowIcon />} disabled={!teacherQuestionsReady || audioPermission === 'denied' || startingViva || fetchingQuestions}
                    sx={{ backgroundColor: '#4361ee', borderRadius: 2, px: 3, py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', boxShadow: 'none', '&:hover': { backgroundColor: '#3730a3', boxShadow: 'none' } }}>
                    {startingViva ? 'Preparing...' : 'Start Interview'}
                  </Button>
                ) : micOn ? (
                  <Button onClick={handleNextQuestion} variant="contained" startIcon={<MicIcon />}
                    sx={{ backgroundColor: '#10b981', borderRadius: 2, px: 3, py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', boxShadow: 'none', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(16,185,129,0)' } }, '&:hover': { backgroundColor: '#059669', boxShadow: 'none' } }}>
                    Submit Answer
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#6366f1' }} />
                    <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 500 }}>
                      {vivaStatus === 'speaking' ? 'AI is speaking...' : 'Processing...'}
                    </Typography>
                  </Box>
                )}

                {/* Mic indicator */}
                {started && micOn && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'blink 1s infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Recording</Typography>
                  </Box>
                )}
              </Box>

              {/* Live transcript display */}
              {started && micOn && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', minHeight: 50 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <HearingIcon sx={{ fontSize: 16, color: liveTranscript ? '#10b981' : '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: liveTranscript ? '#10b981' : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {liveTranscript ? 'Speech Detected' : 'Listening... (speak clearly)'}
                    </Typography>
                    {liveTranscript && <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981', ml: 'auto' }} />}
                  </Box>
                  <Typography variant="body2" sx={{ color: liveTranscript ? '#1e293b' : '#64748b', fontStyle: liveTranscript ? 'normal' : 'italic', lineHeight: 1.5 }}>
                    {liveTranscript || 'Your answer will appear here as you speak. If nothing appears, check your microphone permissions in the browser address bar.'}
                  </Typography>
                  {!liveTranscript && (
                    <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1 }}>
                      Tip: Click the lock/mic icon in the address bar to ensure microphone access is allowed.
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          )}

          {/* Completion Card */}
          {loadendViva && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #d1fae5', boxShadow: 'none', p: 3, backgroundColor: '#f0fdf4', textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Interview Complete
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Saving your results and generating your score...
              </Typography>
              <CircularProgress size={24} sx={{ mt: 2, color: '#4361ee' }} />
            </Paper>
          )}

          {/* Answer History */}
          {qHistory.length > 0 && !loadendViva && (
            <Paper sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', p: 2, maxHeight: 200, overflowY: 'auto' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1.5 }}>
                Previous Questions ({qHistory.length})
              </Typography>
              <Stack spacing={1}>
                {qHistory.map((item, idx) => {
                  const score = parseEvaluationScore(item.evaluation);
                  return (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1.5, backgroundColor: '#fafbfc', border: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1 }}>
                        Q{idx + 1}: {item.questionText}
                      </Typography>
                      <Chip label={`${score.toFixed(1)}/10`} size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', minWidth: 50, backgroundColor: score >= 7 ? '#d1fae5' : score >= 4 ? '#fef3c7' : '#fee2e2', color: score >= 7 ? '#059669' : score >= 4 ? '#d97706' : '#dc2626' }} />
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Interview;
