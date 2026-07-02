import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  Grid,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import {
  CheckCircleRounded as CheckCircleRoundedIcon,
  PlayArrowRounded as PlayArrowRoundedIcon,
  PauseRounded as PauseRoundedIcon,
  StopRounded as StopRoundedIcon,
  FastForwardRounded as FastForwardRoundedIcon,
  ReplayRounded as ReplayRoundedIcon,
  RecordVoiceOverRounded as RecordVoiceOverRoundedIcon,
  StarRounded as StarRoundedIcon,
  EditRounded as EditRoundedIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const buildAnswerValue = (question, answer) => {
  if (!question) return {};
  if (question.question_type === "fill_blank") {
    return { text: answer || "" };
  }
  return { option: answer || "" };
};

const extractAnswerValue = (question, answerRow) => {
  if (!question || !answerRow?.submitted_answer) return "";
  if (question.question_type === "fill_blank") {
    return answerRow.submitted_answer.text || "";
  }
  return answerRow.submitted_answer.option || "";
};

const getCorrectAnswerValue = (question) => {
  const correctAnswer = question?.correct_answer || {};
  if (question?.question_type === "fill_blank") {
    return correctAnswer.text || "";
  }
  return correctAnswer.option || "";
};

const normalizeAnswer = (value) => String(value || "").trim().toLowerCase();

// Waveform animation for the audio player
const waveAnimation = keyframes`
  0% { height: 10%; }
  50% { height: 100%; }
  100% { height: 10%; }
`;

const ListeningSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.9);
  const [ttsWarning, setTtsWarning] = useState("");
  const [finishPayload, setFinishPayload] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const transcriptRef = useRef(null);

  const { data: payload, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["listening-module-session", sessionId],
    queryFn: () => learningApi.getListeningModuleSession(sessionId).then((response) => response.data),
    staleTime: 0,
  });

  const session = payload;
  const passage = payload?.passage;
  const questions = useMemo(
    () => (passage?.questions || []).slice().sort((a, b) => a.order_index - b.order_index),
    [passage?.questions],
  );

  useEffect(() => {
    if (!payload?.answers || !questions.length) return;
    const next = {};
    questions.forEach((question) => {
      const answerRow = payload.answers.find((item) => item.question_id === question.id);
      if (answerRow) next[question.id] = extractAnswerValue(question, answerRow);
    });
    setSelectedAnswers(next);
  }, [payload?.answers, questions]);

  useEffect(() => {
    if (passage?.tts_rate) setTtsRate(passage.tts_rate);
  }, [passage?.tts_rate]);

  const speakTranscript = useCallback(
    (restart = true) => {
      const text = passage?.transcript || "";
      if (!text) return;
      if (
        typeof window === "undefined" ||
        !window.speechSynthesis ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setTtsWarning("Thiết bị hiện tại không hỗ trợ trình đọc văn bản.");
        return;
      }

      const voices =
        typeof window.speechSynthesis.getVoices === "function"
          ? window.speechSynthesis.getVoices()
          : [];
      const preferredLang = passage?.tts_lang || "en-US";
      const voice =
        voices.find((item) => item.lang === preferredLang) ||
        voices.find((item) => item.lang?.startsWith("en-GB")) ||
        voices.find((item) => item.lang?.startsWith("en"));

      if (voices.length > 0 && !voice) {
        setTtsWarning("Thiết bị không có giọng đọc tiếng Anh phù hợp.");
        return;
      }

      setTtsWarning("");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferredLang;
      utterance.rate = ttsRate;
      if (voice) utterance.voice = voice;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onpause = () => setIsPlaying(false);
      utterance.onresume = () => setIsPlaying(true);
      utterance.onerror = () => setIsPlaying(false);

      if (restart) window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [passage?.transcript, passage?.tts_lang, ttsRate],
  );

  const togglePlay = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
    } else {
      speakTranscript(true);
    }
  };

  const stopPlay = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const question of questions) {
        const localValue = selectedAnswers[question.id];
        await learningApi.answerListeningModuleSession(sessionId, {
          question_id: question.id,
          submitted_answer: buildAnswerValue(question, localValue),
        });
      }
      const finish = await learningApi.finishListeningModuleSession(sessionId);
      return finish.data;
    },
    onSuccess: (data) => {
      setFinishPayload(data);
      setShowTranscript(true);
      refetch();
    },
  });

  const answeredCount = useMemo(
    () => questions.filter((question) => String(selectedAnswers[question.id] || "").trim().length > 0).length,
    [questions, selectedAnswers],
  );
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const isCompleted = session?.status === "completed";
  const result = finishPayload || (isCompleted ? session : null);
  const showResults = Boolean(finishPayload) || isCompleted;
  
  const summary = finishPayload?.summary || {
    score_pct: session?.score_pct || 0,
    total_questions: questions.length,
    answered_questions: payload?.answers?.length || 0,
    correct_answers: payload?.answers?.filter((a) => a.is_correct).length || 0,
    xp_earned: session?.xp_earned || 0,
    total_xp: 0,
    level: 1,
  };

  const resultScore = Number(summary.score_pct || 0);
  const resultPassed = resultScore >= 70;
  const submittedAnswerMap = useMemo(
    () => new Map((payload?.answers || []).map((answer) => [answer.question_id, answer])),
    [payload?.answers],
  );
  const isLearningActivity = Boolean(
    finishPayload?.activity_progress || session?.unit_activity,
  );
  const activityId = finishPayload?.activity_progress?.activity || session?.unit_activity;
  const backTarget = isLearningActivity ? "/learning" : "/listening";
  const backLabel = isLearningActivity ? "Về lộ trình" : "Về danh sách nghe";

  const retryMutation = useMutation({
    mutationFn: async () => {
      if (activityId) {
        const response = await learningApi.startActivity(activityId);
        return response.data?.session?.id;
      }
      const response = await learningApi.startListeningPassageSession(passage.id);
      return response.data?.id;
    },
    onSuccess: (newSessionId) => {
      if (!newSessionId) return;
      queryClient.invalidateQueries({ queryKey: ["listening-module-session", sessionId] });
      if (isLearningActivity) {
        queryClient.invalidateQueries({ queryKey: ["learning-path-v2"] });
      }
      navigate(`/listening/session/${newSessionId}`);
    },
  });

  const handleBackToSource = useCallback(() => {
    if (isLearningActivity) {
      queryClient.invalidateQueries({ queryKey: ["learning-path-v2"] });
      queryClient.invalidateQueries({ queryKey: ["home-learning-path"] });
    }
    navigate(backTarget);
  }, [backTarget, isLearningActivity, navigate, queryClient]);

  const handleShowTranscript = useCallback(() => {
    setShowTranscript(true);
    window.setTimeout(() => {
      transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: colors.greenAccent }} />
      </Box>
    );
  }

  if (isError || !session || !passage) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Stack spacing={2}>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error?.response?.data?.detail || "Không tải được bài nghe."}
          </Alert>
          <SbButton variant="outlined" onClick={() => refetch()}>
            Thử lại
          </SbButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1300, mx: "auto", p: { xs: 2, md: 4 } }}>
      
      {/* HEADER SECTION */}
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 900, 
              fontSize: { xs: "1.5rem", md: "2rem" }, 
              color: isDark ? "white" : colors.greenStarbucks,
              letterSpacing: "-0.02em",
              mb: 1
            }}
          >
            {passage.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", useFlexGap: true }}>
            <Chip icon={<RecordVoiceOverRoundedIcon sx={{ fontSize: "16px !important" }}/>} label="Listening" size="small" sx={{ bgcolor: `${colors.greenAccent}20`, color: colors.greenStarbucks, fontWeight: 800 }} />
            <Chip label={passage.level} size="small" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", fontWeight: 700 }} />
            <Chip label={passage.topic || "general"} size="small" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", fontWeight: 700 }} />
            <Chip label={`${passage.estimated_seconds || 30}s`} size="small" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", fontWeight: 700 }} />
            <Chip label={`${questions.length} câu hỏi`} size="small" sx={{ bgcolor: `${colors.gold}20`, color: colors.gold, fontWeight: 800 }} />
          </Stack>
        </Box>
        <SbButton
          variant="outlined"
          onClick={handleBackToSource}
          sx={{ flexShrink: 0, borderRadius: "50px" }}
          data-cy="listening-back-btn"
        >
          {backLabel}
        </SbButton>
      </Stack>

      {/* 2-COLUMN LAYOUT */}
      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: AUDIO PLAYER & TRANSCRIPT */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Stack spacing={3}>
              
              {/* Audio Player Card */}
              <SbCard 
                sx={{ 
                  p: 3, 
                  bgcolor: isDark ? colors.greenHouse : "#1E3932",
                  color: "white",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
                }}
              >
                {/* Decorative background circle */}
                <Box sx={{
                  position: "absolute",
                  top: "-20%",
                  right: "-10%",
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(203,162,88,0.2) 0%, rgba(0,0,0,0) 70%)",
                  pointerEvents: "none",
                }} />

                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", mb: 3 }}>
                  Audio Player
                </Typography>

                {/* Animated Waveform */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, height: 40, mb: 3 }}>
                  {[...Array(20)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 4,
                        bgcolor: isPlaying ? colors.gold : "rgba(255,255,255,0.2)",
                        borderRadius: 2,
                        animation: isPlaying ? `${waveAnimation} ${0.5 + (i % 5) * 0.1}s infinite ease-in-out` : "none",
                        height: isPlaying ? "100%" : "20%",
                        transition: "all 0.3s ease"
                      }}
                    />
                  ))}
                </Box>

                {/* Controls */}
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
                  <IconButton onClick={() => stopPlay()} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }}}>
                    <StopRoundedIcon fontSize="medium" />
                  </IconButton>
                  
                  <Box
                    onClick={togglePlay}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: colors.gold,
                      color: "#1E3932",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: `0 4px 16px ${colors.gold}40`,
                      transition: "transform 0.1s",
                      "&:active": { transform: "scale(0.95)" },
                      "&:hover": { bgcolor: "#bfa050" }
                    }}
                  >
                    {isPlaying ? <PauseRoundedIcon sx={{ fontSize: 36 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 36 }} />}
                  </Box>
                  
                  <IconButton onClick={() => speakTranscript(true)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }}}>
                    <ReplayRoundedIcon fontSize="medium" />
                  </IconButton>
                </Stack>

                {/* Speed Controls */}
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                  <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Tốc độ:</Typography>
                  <Chip 
                    label="0.8x" 
                    clickable 
                    onClick={() => setTtsRate(0.8)}
                    sx={{ 
                      bgcolor: ttsRate === 0.8 ? "white" : "rgba(255,255,255,0.1)",
                      color: ttsRate === 0.8 ? "#1E3932" : "white",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                    }} 
                  />
                  <Chip 
                    label="1.0x" 
                    clickable 
                    onClick={() => setTtsRate(1)}
                    sx={{ 
                      bgcolor: ttsRate === 1 ? "white" : "rgba(255,255,255,0.1)",
                      color: ttsRate === 1 ? "#1E3932" : "white",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                    }} 
                  />
                </Stack>

                {!!ttsWarning && <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, py: 0 }}>{ttsWarning}</Alert>}
              </SbCard>

              {/* Transcript Card (Only visible after submitting) */}
              {showResults && (
                <SbCard sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : `${colors.greenAccent}20`}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, color: isDark ? "white" : colors.greenStarbucks }}>
                      Transcript
                    </Typography>
                    <SbButton 
                      size="small" 
                      variant="outlined" 
                      data-cy="listening-transcript-toggle" 
                      onClick={() => setShowTranscript((prev) => !prev)}
                      sx={{ borderRadius: "50px", fontSize: "0.75rem", height: 30 }}
                    >
                      {showTranscript ? "Ẩn" : "Hiện"}
                    </SbButton>
                  </Stack>
                  
                  {showTranscript ? (
                    <Stack ref={transcriptRef} spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
                      <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.7, color: "text.primary" }}>
                        {passage.transcript}
                      </Typography>
                      {!!passage.translation_vi && (
                        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.6, fontStyle: "italic", p: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderRadius: 2 }}>
                          {passage.translation_vi}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", fontStyle: "italic" }}>
                      Transcript đang bị ẩn. Bấm "Hiện" để xem lại bài nghe.
                    </Typography>
                  )}
                </SbCard>
              )}
            </Stack>
          </Box>
        </Grid>
        
        {/* RIGHT COLUMN: QUESTIONS & RESULTS */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* Result View (Shown at top if completed) */}
            {showResults && (
              <SbCard
                sx={{
                  border: "2px solid " + (resultPassed ? colors.greenAccent : colors.red) + "33",
                  bgcolor: isDark 
                    ? (resultPassed ? "rgba(0, 137, 83, 0.1)" : "rgba(229, 57, 53, 0.1)") 
                    : (resultPassed ? "rgba(0, 137, 83, 0.04)" : "rgba(229, 57, 53, 0.04)"),
                  p: { xs: 3, md: 4 },
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="center" justifyContent="center">
                  
                  {/* Score Circle */}
                  <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={120}
                      thickness={4}
                      sx={{ color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={resultScore}
                      size={120}
                      thickness={4}
                      sx={{
                        color: resultPassed ? colors.greenAccent : colors.red,
                        position: "absolute",
                        left: 0,
                        strokeLinecap: "round",
                      }}
                    />
                    <Box
                      sx={{
                        top: 0, left: 0, bottom: 0, right: 0,
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h4" component="div" sx={{ fontWeight: 900, color: resultPassed ? colors.greenAccent : colors.red, lineHeight: 1 }}>
                        {resultScore}%
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", mt: 0.5 }}>Điểm số</Typography>
                    </Box>
                  </Box>

                  {/* Summary Details */}
                  <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", color: resultPassed ? colors.greenAccent : colors.red, mb: 1 }}>
                      {resultPassed ? "Tuyệt vời! Bạn đã vượt qua bài nghe." : "Chưa đạt. Hãy cố gắng lần sau!"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.95rem", color: "text.secondary", mb: 2.5 }}>
                      Bạn trả lời đúng <strong>{summary.correct_answers}</strong> trên tổng số <strong>{summary.total_questions}</strong> câu hỏi.
                    </Typography>
                    
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" }, mb: 3 }}>
                      {!!summary.xp_earned && (
                        <Chip icon={<StarRoundedIcon sx={{ fontSize: "16px !important", color: `${colors.gold} !important` }}/>} label={"+" + summary.xp_earned + " XP"} sx={{ bgcolor: `${colors.gold}20`, color: colors.gold, fontWeight: 800 }} />
                      )}
                      {!!summary.total_xp && (
                        <Chip label={"Tổng XP: " + summary.total_xp} sx={{ fontWeight: 700 }}/>
                      )}
                      {!!summary.total_xp && (
                        <Chip label={"Level " + (summary.level || 1)} sx={{ fontWeight: 700 }}/>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1.5} justifyContent={{ xs: "center", md: "flex-start" }}>
                      <SbButton variant="primary" onClick={handleBackToSource} sx={{ borderRadius: "50px" }} data-cy="listening-result-back-btn">
                        Tiếp tục học
                      </SbButton>
                      <SbButton variant="outlined" onClick={() => retryMutation.mutate()} loading={retryMutation.isPending} sx={{ borderRadius: "50px" }}>
                        Làm lại
                      </SbButton>
                    </Stack>
                  </Box>

                </Stack>
              </SbCard>
            )}

            {/* Progress Header */}
            {!showResults && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                    Bài tập ({questions.length} câu)
                  </Typography>
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", fontWeight: 700 }}>
                    {answeredCount} / {questions.length}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                    "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
                  }}
                />
              </Box>
            )}

            {/* Questions List */}
            <Stack spacing={3}>
              {questions.map((question, index) => {
                const correctValue = getCorrectAnswerValue(question);
                const selectedValue = selectedAnswers[question.id] || "";
                const submittedAnswer = submittedAnswerMap.get(question.id);
                const isTextCorrect = showResults && normalizeAnswer(selectedValue) === normalizeAnswer(correctValue);

                return (
                  <SbCard
                    key={question.id}
                    sx={{
                      p: 3,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
                      borderRadius: 4,
                      boxShadow: "none",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 2.5, color: isDark ? "white" : colors.greenStarbucks }}>
                      <Box component="span" sx={{ color: colors.greenAccent, mr: 1 }}>{question.order_index}.</Box>
                      {question.prompt}
                    </Typography>

                    {(question.question_type === "multiple_choice" || question.question_type === "true_false") && (
                      <Grid container spacing={1.5}>
                        {(question.choices_json || []).map((choice) => {
                          const isSelected = selectedValue === choice;
                          const isCorrectChoice = showResults && normalizeAnswer(choice) === normalizeAnswer(correctValue);
                          const isWrongChoice = showResults && isSelected && !isCorrectChoice;
                          
                          let bg = theme.palette.background.default;
                          let border = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
                          let color = "text.primary";
                          
                          if (isCorrectChoice) {
                            bg = `${colors.greenAccent}20`;
                            border = colors.greenAccent;
                            color = colors.greenStarbucks;
                            if (isDark) color = theme.palette.primary.light;
                          } else if (isWrongChoice) {
                            bg = "rgba(229, 57, 53, 0.1)";
                            border = colors.red;
                            color = colors.red;
                          } else if (isSelected && !showResults) {
                            bg = `${colors.greenAccent}15`;
                            border = colors.greenAccent;
                            color = colors.greenStarbucks;
                            if (isDark) color = "white";
                          }

                          return (
                            <Grid item xs={12} sm={question.question_type === "true_false" ? 6 : 12} key={choice}>
                              <Box
                                onClick={() => !showResults && setSelectedAnswers((prev) => ({ ...prev, [question.id]: choice }))}
                                sx={{
                                  p: 2,
                                  borderRadius: 3,
                                  border: `2px solid ${border}`,
                                  bgcolor: bg,
                                  color: color,
                                  cursor: showResults ? "default" : "pointer",
                                  transition: "all 0.2s",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  "&:hover": {
                                    bgcolor: !showResults && !isSelected ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)") : bg,
                                  }
                                }}
                              >
                                <Typography sx={{ fontWeight: isSelected || isCorrectChoice ? 800 : 600, fontSize: "0.95rem" }}>
                                  {choice}
                                </Typography>
                                {isCorrectChoice && <CheckCircleRoundedIcon color="success" />}
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}

                    {question.question_type === "fill_blank" && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          placeholder="Nhập đáp án của bạn..."
                          value={selectedAnswers[question.id] || ""}
                          disabled={showResults}
                          onChange={(event) =>
                            setSelectedAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
                          }
                          fullWidth
                          variant="outlined"
                          InputProps={{
                            startAdornment: <EditRoundedIcon sx={{ mr: 1.5, color: showResults ? "text.disabled" : colors.greenAccent }} />,
                            sx: { 
                              borderRadius: 4, 
                              fontWeight: 700,
                              fontSize: "1.05rem",
                              bgcolor: showResults ? "transparent" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,117,74,0.03)"),
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                bgcolor: showResults ? "transparent" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,117,74,0.06)"),
                              },
                              "&.Mui-focused": {
                                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                                boxShadow: `0 4px 20px ${colors.greenAccent}30`,
                              }
                            }
                          }}
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderWidth: "2px",
                              borderColor: showResults ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)") : (isDark ? "rgba(255,255,255,0.1)" : `${colors.greenAccent}40`),
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: showResults ? "transparent" : colors.greenAccent,
                            },
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: colors.greenAccent,
                            },
                          }}
                        />
                        {showResults && (
                          <Alert 
                            severity={submittedAnswer?.is_correct || isTextCorrect ? "success" : "error"}
                            sx={{ mt: 2.5, borderRadius: 3, border: "1px solid", borderColor: "transparent" }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                              Đáp án đúng: <Box component="span" sx={{ color: "text.primary" }}>{correctValue || "Chưa có đáp án mẫu"}</Box>
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </SbCard>
                );
              })}
            </Stack>

            {/* Submit Section */}
            {!showResults && (
              <Box sx={{ pt: 2, display: "flex", justifyContent: "flex-end" }}>
                <SbButton
                  variant="primary"
                  disabled={!allAnswered}
                  loading={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                  data-cy="listening-submit-btn"
                  sx={{ 
                    borderRadius: "50px", 
                    px: 6, 
                    py: 1.5, 
                    fontSize: "1.05rem",
                    boxShadow: allAnswered ? `0 8px 24px ${colors.greenAccent}40` : "none"
                  }}
                >
                  Nộp bài
                </SbButton>
              </Box>
            )}
            
            {!!submitMutation.error && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {submitMutation.error?.response?.data?.detail || "Không thể nộp bài nghe."}
              </Alert>
            )}

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ListeningSessionPage;
