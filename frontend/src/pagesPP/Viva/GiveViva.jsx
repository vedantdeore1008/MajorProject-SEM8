import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Video_analysis from "./VideoAnalysis.jsx";
import { Button, Skeleton, Box, Typography, Paper, Alert, CircularProgress, Chip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import CallEndIcon from "@mui/icons-material/CallEnd";
import axios from "axios";
import AlertAgreeDisagree from "./AlerttAgreeDisagree.jsx";
import { useSelector } from "react-redux";

const API = import.meta.env.VITE_BACKEND_URL;

const Interview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [questionload, setQuestionload] = useState(false);
  const { username, interviewId, vivadata } = location.state || {};
  const [questionSet, setQuestionSet] = useState([]); // All questions from API
  const [remainingQuestions, setRemainingQuestions] = useState([]); // Questions left to ask
  const [easyPool, setEasyPool] = useState([]);
  const [mediumPool, setMediumPool] = useState([]);
  const [hardPool, setHardPool] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState("easy");
  const [askedCounts, setAskedCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [allowedCounts, setAllowedCounts] = useState({ easy: 1, medium: 0, hard: 0 });
  const [attemptsPerDifficulty, setAttemptsPerDifficulty] = useState({ easy: 0, medium: 0, hard: 0 });
  const [micOn, setMicOn] = useState(false);
  const [qHistory, setQHistory] = useState([]); // Store Gemini API responses
  const [c_answer, setCurrentAnswer] = useState("");
  const [c_question, setCurrentQuestion] = useState("");
  const [timer, setTimer] = useState(0);
  const [timeofthinking, setTimeOfThinking] = useState(0);
  const [started, setStarted] = useState(false);
  const [loadendViva, setLoadendViva] = useState(false);
  const [endVideo, setEndVideo] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isVivaEnded, setIsVivaEnded] = useState(false);
  const [reportReady, setReportReady] = useState(false); // New state to track report readiness
  const [report, setReport] = useState(null);
  const[askQuestion,setAskQuestion]=useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0); // Track the number of questions asked
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [teacherQuestionsReady, setTeacherQuestionsReady] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");

  const { vivaId } = useParams();
  const { userInfo } = useSelector((state) => state.user); // Access user role from Redux

  // Audio recording state and refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const saveAttemptedRef = useRef(false);

  useEffect(() => {
    console.log("[GiveViva][DEBUG] mounted", {
      ts: new Date().toISOString(),
      vivaId,
      userId: userInfo?._id,
    });
  }, []);

  useEffect(() => {
    console.log("[GiveViva][DEBUG] qHistory", {
      count: Array.isArray(qHistory) ? qHistory.length : null,
      last: qHistory?.length
        ? {
            questionPreview: String(qHistory[qHistory.length - 1]?.questionText || "").slice(0, 60),
            transcriptPreview: String(qHistory[qHistory.length - 1]?.studentAnswer || "").slice(0, 60),
            evaluationPreview: String(qHistory[qHistory.length - 1]?.evaluation || "").slice(0, 80),
          }
        : null,
    });
  }, [qHistory]);

  const finalizeViva = (reportData = null) => {
    if (saveAttemptedRef.current) {
      return;
    }

    saveAttemptedRef.current = true;

    const fallbackReport = reportData || {
      allDetectedObjects: {
        phoneDetectedCount: 0,
        laptopDetectedCount: 0,
        bookDetectedCount: 0,
        multipleUsersDetectedCount: 0,
        tabSwitchingDetectedCount: 0,
      },
    };

    setReport(fallbackReport);
    setReportReady(true);
  };

  // Speech synthesis function with audio recording
  const speakText = async (text, rate = 0.95) => {
    try {
      // Make a POST request to the backend API
      const response = await fetch("http://127.0.0.1:5000/generate_speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }), // Send the text to the backend
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      // Parse the JSON response
      const data = await response.json();
  
      // Check if the response contains the base64-encoded audio
      if (data.speech) {
        // Convert the base64 string to a Blob
        const byteCharacters = atob(data.speech); // Decode base64
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: "audio/mp3" });
  
        // Create a URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);
  
        // Create an Audio object and play the audio
        const audio = new Audio(audioUrl);
        audio.play();
  
        // Handle audio events (e.g., when playback ends)
        audio.addEventListener("ended", () => {
          setTimer(timeofthinking * 60);
          setMicOn(true);
          startAudioRecording();
          console.log("Audio playback finished.");
          URL.revokeObjectURL(audioUrl); // Clean up the object URL
        });
  
        // Update state
        setCurrentQuestion(text);
        setQuestionload(false);
        setStarted(true);
      } else {
        throw new Error("No speech data received from the API");
      }
    } catch (error) {
      console.error("Error with API call or speech synthesis:", error);
  
      // Fallback to browser's speech synthesis
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel(); // Cancel any ongoing speech
  
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "hi-IN";
        utterance.rate = rate;
  
        utterance.onend = () => {
          setTimer(timeofthinking * 60);
          setMicOn(true);
          startAudioRecording();
        };
  
        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event);
          setMicOn(false);
        };
  
        synth.speak(utterance);
  
        // Update state
        setCurrentQuestion(text);
        setQuestionload(false);
        setStarted(true);
      } else {
        console.error("Speech synthesis is not supported in this browser.");
        setMicOn(false);
      }
    }
  };

  // Parse evaluation text/object to estimate a numeric score (0-10)
  const parseEvaluationScore = (evaluation) => {
    try {
      if (!evaluation) return 0;
      if (typeof evaluation === 'object' && !Array.isArray(evaluation)) {
        const keys = Object.keys(evaluation);
        const numVals = [];
        ['TotalAverageScore','TotalAverage','totalAverageScore','totalAverage','average','TotalAverageScore'].forEach(k => {
          if (evaluation[k] && !isNaN(Number(evaluation[k]))) numVals.push(Number(evaluation[k]));
        });
        ['Relevance','relevance','Completeness','completeness','Accuracy','accuracy','DepthOfKnowledge','depthOfKnowledge','Depth of Knowledge'].forEach(k=>{
          if (evaluation[k] && !isNaN(Number(evaluation[k]))) numVals.push(Number(evaluation[k]));
        });
        if (numVals.length) return numVals.reduce((a,b)=>a+b,0)/numVals.length;
        return 0;
      }

      const text = String(evaluation || '');
      // try to capture TotalAverageScore or Total Average
      const m = text.match(/Total\s*Average\s*(?:Score)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i);
      if (m) return Number(m[1]);
      // capture numeric metrics and average
      const numbers = Array.from(text.matchAll(/(Relevance|Completeness|Accuracy|Depth(?: of )?Knowledge)\s*[:=-]?\s*(\d+(?:\.\d+)?)/ig)).map(x=>Number(x[2]));
      if (numbers.length) return numbers.reduce((a,b)=>a+b,0)/numbers.length;
      // fallback: find first number
      const anyNum = text.match(/(\d+(?:\.\d+)?)/);
      if (anyNum) return Number(anyNum[1]);
      return 0;
    } catch (e) {
      return 0;
    }
  }


  // Start audio recording
  const startAudioRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("[GiveViva][DEBUG] getUserMedia not supported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const preferredMimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/ogg",
        ];

        const supportedMimeType = preferredMimeTypes.find((t) => {
          try {
            return MediaRecorder.isTypeSupported(t);
          } catch {
            return false;
          }
        });

        const options = supportedMimeType ? { mimeType: supportedMimeType } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);

        console.log("[GiveViva][DEBUG] recorder started", {
          selectedMimeType: supportedMimeType || null,
          actualMimeType: mediaRecorder.mimeType,
        });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  };

  // Stop recording and process audio
  const stopAudioRecording = async () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.onstop = () => {
          try {
            const recordedMimeType =
              mediaRecorderRef.current?.mimeType ||
              audioChunksRef.current?.[0]?.type ||
              "audio/webm";

            const audioBlob = new Blob(audioChunksRef.current, {
              type: recordedMimeType,
            });

            const extension = recordedMimeType.includes("ogg") ? "ogg" : "webm";

            // Create a File object from the Blob
            const file = new File(
              [audioBlob],
              `recording_${Date.now()}.${extension}`,
              {
                type: recordedMimeType,
              }
            );

            console.log("[GiveViva][DEBUG] recorder stopped", {
              recordedMimeType,
              size: file.size,
              name: file.name,
            });

            resolve(file);
            audioChunksRef.current = [];
          } catch (error) {
            console.error("Error processing audio:", error);
            resolve(null);
          }

          // Stop and clean up the audio stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  // Fetch question set from API
  const fetchQuestionSet = async () => {
    try {
      const response = await axios.get(`${API}/viva/getOneViva/${vivaId}`, {
        params: {
          studentId: userInfo?._id,
        },
      });

      const fetchedQuestions = response?.data?.questionAnswerSet || [];
      const resumeStatus = response?.data?.studentResumeStatus || {};

      // Partition into difficulty pools
      const easy = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "easy");
      const medium = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "medium");
      const hard = fetchedQuestions.filter((q) => String(q.difficulty || "").toLowerCase() === "hard");

      // Determine allowed counts: prioritize medium, limit hard
      const total = Number(response?.data?.numberOfQuestionsToAsk) || fetchedQuestions.length || 0;
      const allowedHard = Math.max(1, Math.floor(total * 0.2));
      const allowedEasy = 1; // always start with one easy
      const allowedMedium = Math.max(0, total - allowedEasy - allowedHard);

      setQuestionSet(fetchedQuestions);
      setRemainingQuestions(fetchedQuestions);
      setEasyPool(easy);
      setMediumPool(medium);
      setHardPool(hard);
      setTimeOfThinking(response?.data?.timeofthinking || 0);
      setAskQuestion(total);
      setResumeUploaded(Boolean(resumeStatus.uploaded));
      setTeacherQuestionsReady(Boolean(resumeStatus.preparedByTeacher) || Boolean(response?.data?.isPersonalizedQuestionSet));
      setAllowedCounts({ easy: allowedEasy, medium: allowedMedium, hard: allowedHard });

      if (resumeStatus.uploaded && !resumeStatus.preparedByTeacher) {
        setResumeMessage("Resume uploaded. AI draft is being prepared (automatic). Teacher can edit if needed.");
      } else if (resumeStatus.preparedByTeacher || response?.data?.isPersonalizedQuestionSet) {
        setResumeMessage("Your personalized AI interview questions are ready.");
      } else {
        setResumeMessage("Upload your resume PDF to continue.");
      }
    } catch (error) {
      console.error("Error Fetching viva:", error);
    }
  };

  useEffect(() => {
    if (userInfo?._id) {
      fetchQuestionSet();
    }
  }, [userInfo?._id]);

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeMessage("Please select a PDF resume before uploading.");
      return;
    }

    try {
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("studentId", userInfo?._id || "");
      formData.append("studentName", userInfo?.name || "");

      await axios.post(`${API}/viva/upload-resume/${vivaId}`, formData);
      setResumeUploaded(true);
      setResumeMessage("Resume uploaded successfully. Teacher will now prepare your question set.");
      await fetchQuestionSet();
    } catch (error) {
      setResumeMessage(error?.response?.data?.message || "Failed to upload resume.");
    } finally {
      setResumeUploading(false);
    }
  };

  // Start the viva session
  const startViva = async () => {
    if (!teacherQuestionsReady) {
      setResumeMessage("You can start only after the teacher finalizes your resume-based 3/3/3 questions.");
      return;
    }

    // initialize progression state
    setCurrentDifficulty("easy");
    setAskedCounts({ easy: 0, medium: 0, hard: 0 });
    setAttemptsPerDifficulty({ easy: 0, medium: 0, hard: 0 });
    selectNextQuestion();
  };
  // Select next question based on currentDifficulty and allowed counts
  const selectNextQuestion = () => {
    if (isVivaEnded || questionsAsked >= askQuestion) {
      handleAgree();
      return;
    }

    const totalAsked = questionsAsked;
    if (totalAsked >= askQuestion) {
      handleAgree();
      return;
    }

    const pickFromPool = (pool) => {
      if (!pool || pool.length === 0) return null;
      const idx = Math.floor(Math.random() * pool.length);
      return { item: pool[idx], idx };
    };

    let chosen = null;
    let chosenDifficulty = currentDifficulty;

    // Try current difficulty first
    if (currentDifficulty === "easy" && askedCounts.easy < allowedCounts.easy) {
      const pick = pickFromPool(easyPool);
      if (pick) {
        chosen = pick;
        chosenDifficulty = "easy";
      }
    }

    if (!chosen && currentDifficulty === "medium" && askedCounts.medium < allowedCounts.medium) {
      const pick = pickFromPool(mediumPool);
      if (pick) {
        chosen = pick;
        chosenDifficulty = "medium";
      }
    }

    if (!chosen && currentDifficulty === "hard" && askedCounts.hard < allowedCounts.hard) {
      const pick = pickFromPool(hardPool);
      if (pick) {
        chosen = pick;
        chosenDifficulty = "hard";
      }
    }

    // fallback order: easy -> medium -> hard
    if (!chosen) {
      let pick = pickFromPool(easyPool);
      if (pick && askedCounts.easy < allowedCounts.easy) {
        chosen = pick;
        chosenDifficulty = "easy";
      }
    }

    if (!chosen) {
      let pick = pickFromPool(mediumPool);
      if (pick && askedCounts.medium < allowedCounts.medium) {
        chosen = pick;
        chosenDifficulty = "medium";
      }
    }

    if (!chosen) {
      let pick = pickFromPool(hardPool);
      if (pick && askedCounts.hard < allowedCounts.hard) {
        chosen = pick;
        chosenDifficulty = "hard";
      }
    }

    if (!chosen) {
      // no questions left in pools or allowed counts reached
      handleAgree();
      return;
    }

    const selectedQuestion = chosen.item;

    // remove selected from corresponding pool
    if (chosenDifficulty === "easy") setEasyPool((p) => p.filter((_, i) => i !== chosen.idx));
    if (chosenDifficulty === "medium") setMediumPool((p) => p.filter((_, i) => i !== chosen.idx));
    if (chosenDifficulty === "hard") setHardPool((p) => p.filter((_, i) => i !== chosen.idx));

    // speak and set state
    speakText(selectedQuestion.questionText);
    setCurrentAnswer(selectedQuestion.answer);
    setQuestionsAsked((prev) => prev + 1);
    setAskedCounts((prev) => ({ ...prev, [chosenDifficulty]: (prev[chosenDifficulty] || 0) + 1 }));
    // track which difficulty was asked last
    setCurrentDifficulty(chosenDifficulty);
  };

  // Handle next question
  const handleNextQuestion = async () => {
    if (isVivaEnded) {
      return; // Do not process further if the viva has ended
    }
    setTimer(0);
    setLoading(true);
    setQuestionload(true);
    setMicOn(false);

    // Stop audio recording and get the audio file
    const audioFile = await stopAudioRecording();

    if (!audioFile) {
      console.error("No audio recorded; skipping Gemini evaluation.");
      setQuestionload(false);
      if (!isVivaEnded) {
        selectNextQuestion();
      }
      return;
    }

    // Create a FormData object
    const formData = new FormData();
    formData.append("question", c_question);
    formData.append("modelAnswer", c_answer);
    formData.append("audio", audioFile); // Append the audio file

    console.log("[GiveViva][DEBUG] sending to gemini", {
      questionPreview: String(c_question || "").slice(0, 80),
      modelAnswerChars: String(c_answer || "").length,
      audio: {
        name: audioFile?.name,
        type: audioFile?.type,
        size: audioFile?.size,
      },
    });

    try {
      const response = await axios.post(`${API}/viva/send-to-gemini`, formData);

      console.log("[GiveViva][DEBUG] gemini response", {
        transcriptChars: String(response?.data?.transcript || "").length,
        evaluationChars: String(response?.data?.evaluation || "").length,
        evaluationPreview: String(response?.data?.evaluation || "").slice(0, 140),
      });
      // Store Gemini API response
      const evalText = response?.data?.evaluation;
      setQHistory((prev) => [
        ...prev,
        {
          questionText: c_question,
          modelAnswer: c_answer,
          studentAnswer: response?.data?.transcript,
          evaluation: evalText,
        },
      ]);

      // Decide progression based on numeric score
      const score = parseEvaluationScore(evalText);
      const PASS_THRESHOLD = 6.0; // out of 10
      const current = currentDifficulty || 'easy';

      if (score >= PASS_THRESHOLD) {
        // move up when possible
        if (current === 'easy' && allowedCounts.medium > 0) {
          setCurrentDifficulty('medium');
        } else if (current === 'medium') {
          // if still medium quota available, keep medium, otherwise move to hard if allowed
          if (askedCounts.medium + 1 >= allowedCounts.medium && allowedCounts.hard > 0) {
            setCurrentDifficulty('hard');
          } else {
            setCurrentDifficulty('medium');
          }
        } else if (current === 'hard') {
          setCurrentDifficulty('hard');
        }
      } else {
        // failed: allow one retry per difficulty then move on
        setAttemptsPerDifficulty((prev) => {
          const next = { ...prev };
          next[current] = (next[current] || 0) + 1;
          return next;
        });

        const attempts = attemptsPerDifficulty[current] || 0;
        if ((attempts + 1) >= 1) {
          // move to next difficulty
          if (current === 'easy' && allowedCounts.medium > 0) setCurrentDifficulty('medium');
          else if (current === 'medium' && allowedCounts.hard > 0) setCurrentDifficulty('hard');
          else setCurrentDifficulty(current); // no further level
        } else {
          setCurrentDifficulty(current); // retry same difficulty
        }
      }
    } catch (error) {
      const errorPayload = error?.response?.data;
      const errorText =
        typeof errorPayload?.details === "string" && errorPayload.details.trim().length
          ? errorPayload.details
          : typeof errorPayload?.error === "string" && errorPayload.error.trim().length
          ? errorPayload.error
          : error?.message || "Unknown error";

      console.error(
        "Error sending data to Gemini API:",
        errorPayload || error
      );

      // Save a placeholder entry so the teacher can see WHY evaluation is missing.
      setQHistory((prev) => [
        ...prev,
        {
          questionText: c_question,
          modelAnswer: c_answer,
          studentAnswer: `ERROR: ${errorText}`,
          evaluation: `ERROR: ${errorText}`,
        },
      ]);

      // treat as a failed attempt and advance difficulty if retries exhausted
      const current = currentDifficulty || 'easy';
      setAttemptsPerDifficulty((prev) => {
        const next = { ...prev };
        next[current] = (next[current] || 0) + 1;
        return next;
      });
      const attempts = attemptsPerDifficulty[current] || 0;
      if ((attempts + 1) >= 1) {
        if (current === 'easy' && allowedCounts.medium > 0) setCurrentDifficulty('medium');
        else if (current === 'medium' && allowedCounts.hard > 0) setCurrentDifficulty('hard');
      }

      console.log("[GiveViva][DEBUG] stored error placeholder", {
        questionPreview: String(c_question || "").slice(0, 80),
        errorText,
      });
    } finally {
      // setLoading(false);
      if (!isVivaEnded) {
        selectNextQuestion(); // Move to the next question only if the viva hasn't ended
      }
      setQuestionload(false);
    }
  };

  // End the viva session
  const endViva = async () => {
    setOpenDialog(true);
  };

  // Handle user agreeing to end the viva
  const handleAgree = async () => {
    setEndVideo(true);
    setOpenDialog(false);
    setLoadendViva(true);
    speechSynthesis.cancel();
    setCurrentQuestion("Successfully completed Viva!");
    setIsVivaEnded(true); // Mark the viva as ended

    // If the video-analysis report never comes back, still finalize so the student can exit.
    window.setTimeout(() => {
      finalizeViva();
    }, 1000);
  };

  // Effect to save results once the report is ready
  useEffect(() => {
    if (reportReady && report) {
      const saveResults = async () => {
        try {
          console.log("[GiveViva][DEBUG] saving viva result", {
            vivaId,
            studentId: userInfo?._id,
            questionSetCount: questionSet?.length,
            qHistoryCount: qHistory?.length,
            proctor: report?.allDetectedObjects,
          });
          const response = await axios.post(`${API}/vivaresult/addvivaresult`, {
            vivaId,
            studentId: userInfo?._id,
            studentName: userInfo?.name,
            totalQuestions: questionSet?.length,
            questionAnswerSet: qHistory, // All Gemini API responses
            dateOfViva: Date.now(),
            proctoredFeedback: report?.allDetectedObjects,
          });

          console.log("[GiveViva][DEBUG] save response", {
            status: response?.status,
            id: response?.data?.data?._id,
            overallMark: response?.data?.data?.overallMark,
          });

          if (response.status === 200 || response.status === 201) {
            navigate("/main", { state: { qHistory } }); // Pass qHistory to the end screen
          } else {
            console.error("Failed to save viva results:", response.data);
            navigate('/main');
          }
        } catch (error) {
          console.error("Error saving viva results:", error);
        }
      };

      saveResults();
    }
  }, [reportReady, report, qHistory, userInfo, vivaId, questionSet, navigate]);

  // Handle user disagreeing to end the viva
  const handleDisagree = () => {
    setOpenDialog(false);
  };

  // Timer effect
  useEffect(() => {
    if (timer > 1) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(countdown);
    } else if (timer === 1 && started) {
      handleNextQuestion(); // Automatically move to the next question when time is up
    }
  }, [timer, started]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 3,
        backgroundColor: "#f5f7fa",
      }}
    >
      <Paper
        sx={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: 3,
          width: "100%",
          maxWidth: "1400px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        {userInfo?.role === "student" && (
          <Box sx={{ mb: 2 }}>
            <Alert severity={teacherQuestionsReady ? "success" : "info"} sx={{ mb: 1 }}>
              {resumeMessage}
            </Alert>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
              <Button variant="outlined" component="label" size="small" disabled={resumeUploading || teacherQuestionsReady}>
                Select Resume PDF
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </Button>
              {resumeFile && <Chip size="small" label={resumeFile.name} />}
              <Button
                variant="contained"
                size="small"
                disabled={resumeUploading || !resumeFile || teacherQuestionsReady}
                onClick={handleResumeUpload}
                startIcon={resumeUploading ? <CircularProgress size={14} /> : null}
              >
                {resumeUploading ? "Uploading..." : resumeUploaded ? "Re-upload Resume" : "Upload Resume"}
              </Button>
            </Box>
          </Box>
        )}

        {/* Header with End Viva Button */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          mb: 2,
          position: "relative",
          "&:after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: "#e0e0e0"
          }
        }}>
          {started && (
            <Button
              variant="contained"
              color="error"
              endIcon={<CallEndIcon />}
              onClick={endViva}
              sx={{ 
                fontSize: "14px", 
                padding: "8px 16px",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#d32f2f"
                }
              }}
            >
              End Viva
            </Button>
          )}
        </Box>
  
        <AlertAgreeDisagree
          open={openDialog}
          title="End Viva Confirmation"
          description="Are you sure you want to end the Viva? This action cannot be undone."
          confirmText="Yes, End Viva"
          cancelText="No, Continue"
          onConfirm={handleAgree}
          onCancel={handleDisagree}
        />
  
        {/* Main Content Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr", md: "40% 60%" },
            gap: 3,
            mt: 2
          }}
        >
          {/* Video Column */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
              padding: 2,
              minHeight: "400px",
              border: "1px solid #e9ecef"
            }}
          >
            <Video_analysis
              endVideo={endVideo}
              onAnalysisComplete={(report) => {
                setReport(report);
                setReportReady(true);
                finalizeViva(report);
              }}
            />
          </Box>
  
          {/* Content Column */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              backgroundColor: "white",
              borderRadius: "12px",
              padding: 3,
              border: "1px solid #e9ecef",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)"
            }}
          >
            {/* Question Display */}
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  color: "#212121",
                  fontSize: "1.1rem"
                }}
              >
                Current Question
              </Typography>
              <Box
                sx={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  padding: 2,
                  minHeight: "200px",
                  maxHeight: "250px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0"
                }}
              >
                {questionload ? (
                  <Box>
                    <Skeleton animation="wave" height={24} variant="text" width="95%" />
                    <Skeleton animation="wave" height={24} variant="text" width="85%" />
                    <Skeleton animation="wave" height={24} variant="text" width="90%" />
                  </Box>
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: "#424242",
                      lineHeight: 1.6,
                      fontSize: "1rem"
                    }}
                  >
                    {c_question || "Click the Start Viva button to begin your session"}
                  </Typography>
                )}
              </Box>
            </Box>
  
            {/* Buttons and Timer */}
            {!loadendViva && (
              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {!started ? (
                      <Button
                        variant="contained"
                        onClick={startViva}
                        sx={{
                          backgroundColor: "#1976d2",
                          color: "white",
                          borderRadius: "8px",
                          padding: "10px 24px",
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          boxShadow: "none",
                          "&:hover": {
                            backgroundColor: "#1565c0",
                            boxShadow: "none"
                          }
                        }}
                      >
                        Start Viva
                      </Button>
                    ) : (
                      micOn && (
                        <Button
                          onClick={handleNextQuestion}
                          endIcon={<MicIcon />}
                          variant="contained"
                          color="primary"
                          sx={{ 
                            fontSize: "0.9rem", 
                            padding: "10px 16px",
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 500,
                            boxShadow: "none",
                            "&:hover": {
                              boxShadow: "none"
                            }
                          }}
                        >
                          Next Question
                        </Button>
                      )
                    )}
                  </Box>
  
                  {/* Timer */}
                  {started && (
                    <Box sx={{ 
                      display: "flex", 
                      gap: 1,
                      backgroundColor: "#263238",
                      borderRadius: "8px",
                      padding: "8px 12px"
                    }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          color: "white",
                          minWidth: "50px"
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {Math.floor(timer / 60).toString().padStart(2, "0")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                          min
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: "white", alignSelf: "center" }}>
                        :
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          color: "white",
                          minWidth: "50px"
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {(timer % 60).toString().padStart(2, "0")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#b0bec5" }}>
                          sec
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Interview;
