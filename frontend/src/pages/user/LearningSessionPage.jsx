import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { CancelRounded as CancelRoundedIcon } from "@mui/icons-material";
import { ReplayRounded as ReplayRoundedIcon } from "@mui/icons-material";
import { FavoriteRounded as FavoriteRoundedIcon } from "@mui/icons-material";
import { HeartBrokenRounded as HeartBrokenIcon } from "@mui/icons-material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { setUser } from "@/features/auth/authSlice";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const FEEDBACK_DELAY_CORRECT_MS = 250;
const FEEDBACK_DELAY_WRONG_MS = 380;
const SESSION_TYPE_LABELS = {
  lesson: "Bài học",
  checkpoint: "Checkpoint",
};
const DIFFICULTY_LABELS = {
  easy: "Dễ",
  normal: "Thường",
  hard: "Khó",
};
const STATUS_LABELS = {
  started: "Đang học",
  completed: "Hoàn thành",
  abandoned: "Bỏ dở",
};
const DIFFICULTY_REASON_LABELS = {
  high_accuracy_and_fast_response: "Độ chính xác cao và phản hồi nhanh",
  balanced_recent_performance: "Hiệu suất gần đây cân bằng",
  low_accuracy_or_wrong_streak: "Độ chính xác thấp hoặc nhiều lỗi liên tiếp",
};

const getSessionTypeLabel = (value) => SESSION_TYPE_LABELS[value] || value || "Bài học";
const getDifficultyLabel = (value) => DIFFICULTY_LABELS[value] || value || "Thường";
const getStatusLabel = (value) => STATUS_LABELS[value] || value || "Đang học";
const getDifficultyReasonLabel = (value) => {
  if (!value) return DIFFICULTY_REASON_LABELS.balanced_recent_performance;
  if (DIFFICULTY_REASON_LABELS[value]) return DIFFICULTY_REASON_LABELS[value];
  return value.replaceAll("_", " ");
};

const isTypingTarget = (target) => {
  if (!target || typeof target !== "object") return false;
  const tagName = target.tagName?.toLowerCase?.();
  return tagName === "input" || tagName === "textarea" || !!target.isContentEditable;
};

const SessionSummary = ({ session, result, onBack, backLabel = "Về lộ trình học" }) => {
  const passed = !!result?.passed;
  const isCheckpoint = session?.session_type === "checkpoint";
  const summary = result?.summary || {};
  const accuracyByType = summary?.accuracy_by_type || {};
  const reviewWords = summary?.review_words || [];
  const isListeningLesson = session?.lesson_skill_tag === "listening";
  const totalAnswered = session?.total_answered ?? summary?.total_answered ?? 0;
  const correctAnswered = session?.correct_answered ?? summary?.correct_answered ?? 0;
  const earnedXp = session?.xp_earned ?? result?.xp_earned ?? summary?.xp_earned ?? 0;
  const accuracyPct = summary?.accuracy_pct ?? (totalAnswered > 0 ? Math.round((correctAnswered / totalAnswered) * 100) : 0);

  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: "auto", py: 4, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks }}>
        {isCheckpoint ? "Kết quả checkpoint" : "Hoàn thành phiên học"}
      </Typography>
      <SbCard>
        <Stack spacing={1.2}>
          <Typography>Tổng câu: {totalAnswered}</Typography>
          <Typography>Đúng: {correctAnswered}</Typography>
          <Typography>XP nhận được: {earnedXp}</Typography>
          <Typography>Độ chính xác: {accuracyPct}%</Typography>
          {isCheckpoint && result && (
            <Typography sx={{ fontWeight: 700, color: passed ? colors.greenAccent : colors.red }}>
              Điểm: {result.score_pct}% | {passed ? "Đạt" : "Chưa đạt"}
            </Typography>
          )}
        </Stack>
      </SbCard>

      {Object.keys(accuracyByType).length > 0 && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>Độ chính xác theo dạng bài</Typography>
            {Object.entries(accuracyByType).map(([type, row]) => (
              <Typography key={type} sx={{ fontSize: "0.9rem" }}>
                {type}: {row.correct}/{row.total} ({row.accuracy_pct}%)
              </Typography>
            ))}
          </Stack>
        </SbCard>
      )}

      {reviewWords.length > 0 && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700, color: colors.red }}>Từ cần ôn lại</Typography>
            {reviewWords.map((word) => (
              <Typography key={word.id} sx={{ fontSize: "0.9rem" }}>
                {word.text} - {word.definition_vi || word.definition_en}
              </Typography>
            ))}
          </Stack>
        </SbCard>
      )}

      {isListeningLesson && !!session?.lesson_listening_transcript && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>Transcript</Typography>
            <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.7 }}>
              {session.lesson_listening_transcript}
            </Typography>
            {!!session?.lesson_listening_translation_vi && (
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.7 }}>
                {session.lesson_listening_translation_vi}
              </Typography>
            )}
          </Stack>
        </SbCard>
      )}

      <SbButton variant="primary" onClick={onBack}>{backLabel}</SbButton>
    </Stack>
  );
};

const HeartsEmptyScreen = ({ heartsInfo, onBack, onRefillReady }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, heartsInfo?.next_refill_seconds ?? 0));
  const onRefillReadyRef = useRef(onRefillReady);
  onRefillReadyRef.current = onRefillReady;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      onRefillReadyRef.current?.();
    }
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, textAlign: "center" }}>
      <HeartBrokenIcon sx={{ fontSize: 80, color: colors.red, mb: 2 }} />
      <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", color: colors.red, mb: 1 }}>
        Bạn đã hết tim!
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 3 }}>
        Tim sẽ được nạp lại sau:
      </Typography>
      {secondsLeft > 0 ? (
        <Typography sx={{ fontWeight: 900, fontSize: "3rem", color: colors.greenStarbucks, fontVariantNumeric: "tabular-nums" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Typography>
      ) : (
        <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: colors.greenAccent }}>
          Tim đã được nạp lại! Đang làm mới...
        </Typography>
      )}
      <Typography sx={{ color: "text.secondary", mt: 1.5, mb: 4, fontSize: "0.875rem" }}>
        {heartsInfo?.current ?? 0}/{heartsInfo?.max ?? 10} tim · Nạp mỗi {heartsInfo?.refill_interval_minutes ?? 10} phút
      </Typography>
      <SbButton variant="outlined" onClick={onBack} sx={{ color: colors.red }}>
        Thoát phiên học
      </SbButton>
    </Box>
  );
};

const LearningSessionPage = ({ mode = "learning" }) => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [orderedTokens, setOrderedTokens] = useState([]);
  const [usedTokenIndexes, setUsedTokenIndexes] = useState(new Set());
  const [finishPayload, setFinishPayload] = useState(null);
  const [completedSessionSnapshot, setCompletedSessionSnapshot] = useState(null);
  const [frustrationGuard, setFrustrationGuard] = useState(null);
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);
  const [heartsState, setHeartsState] = useState(null);
  const [submittedStepIndex, setSubmittedStepIndex] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.9);
  const [ttsWarning, setTtsWarning] = useState("");
  const stepStartedAtRef = useRef(Date.now());
  const keyboardSelectedOptionRef = useRef("");
  const nextStepTimeoutRef = useRef(null);

  const isListeningSessionRoute = mode === "listening" || location.pathname.startsWith("/listening/session/");
  const backPath = isListeningSessionRoute ? "/listening" : "/learning";
  const backLabel = isListeningSessionRoute ? "Về phần luyện nghe" : "Về lộ trình học";

  const invalidateLearningCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["learning-recover-session"] });
    queryClient.invalidateQueries({ queryKey: ["home-recover-session"] });
    queryClient.invalidateQueries({ queryKey: ["learning-path"] });
    queryClient.invalidateQueries({ queryKey: ["listening-path"] });
    queryClient.invalidateQueries({ queryKey: ["daily-goal"] });
    queryClient.invalidateQueries({ queryKey: ["home-daily-goal"] });
    queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const { data: payload, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-session", sessionId],
    queryFn: () => (
      isListeningSessionRoute
        ? learningApi.getListeningSession(sessionId).then((response) => response.data)
        : learningApi.getLearningSession(sessionId).then((response) => response.data)
    ),
  });

  const session = payload?.session;
  const attempts = payload?.attempts || [];
  const exercises = payload?.exercises || [];
  const heartsInfo = heartsState ?? payload?.hearts;
  const difficultyHint = payload?.difficulty_hint;
  const currentHearts = heartsInfo?.current ?? 0;
  const maxHearts = heartsInfo?.max ?? 10;

  useEffect(() => {
    if (payload?.hearts) setHeartsState(payload.hearts);
  }, [payload?.hearts]);

  useEffect(() => {
    const answered = new Set(attempts.map((item) => item.step_index));
    let idx = 0;
    for (let i = 0; i < exercises.length; i += 1) {
      if (!answered.has(exercises[i].step_index)) {
        idx = i;
        break;
      }
      idx = Math.min(i + 1, exercises.length - 1);
    }
    setCurrentStepIndex(idx);
  }, [attempts, exercises]);

  useEffect(() => {
    setTextAnswer("");
    setOrderedTokens([]);
    setUsedTokenIndexes(new Set());
    keyboardSelectedOptionRef.current = "";
    stepStartedAtRef.current = Date.now();
    setSubmittedStepIndex(null);
    answerMutation.reset();
  }, [currentStepIndex]);

  useEffect(() => {
    setFeedback(null);
    setFrustrationGuard(null);
    setSubmittedStepIndex(null);
    setShowTranscript(false);
    setTtsWarning("");
    setCompletedSessionSnapshot(null);
    answerMutation.reset();
  }, [sessionId]);

  useEffect(() => () => {
    if (nextStepTimeoutRef.current) {
      clearTimeout(nextStepTimeoutRef.current);
      nextStepTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const checkpointSubmitMutation = useMutation({
    mutationFn: () => learningApi.submitCheckpoint(sessionId).then((response) => response.data),
    onSuccess: (data) => {
      setCompletedSessionSnapshot(session);
      setFinishPayload(data);
      invalidateLearningCaches();
      refetch();
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => learningApi.finishLearningSession(sessionId).then((response) => response.data),
    onSuccess: (data) => {
      setCompletedSessionSnapshot(session);
      setFinishPayload(data);
      if (data?.user?.xp !== undefined) {
        dispatch(setUser({ xp: data.user.xp, level: data.user.level }));
      }
      invalidateLearningCaches();
      refetch();
    },
  });

  const quitMutation = useMutation({
    mutationFn: () => learningApi.quitLearningSession(sessionId, "user_clicked_quit").then((response) => response.data),
    onSuccess: () => {
      invalidateLearningCaches();
      navigate(backPath);
    },
  });

  const switchEasyMutation = useMutation({
    mutationFn: () => learningApi.switchSessionEasy(sessionId).then((response) => response.data),
    onSuccess: () => {
      setFrustrationGuard(null);
      refetch();
    },
  });

  const answerMutation = useMutation({
    mutationFn: (answerPayload) => learningApi.answerLearningSession(sessionId, answerPayload).then((response) => response.data),
    onSuccess: (data) => {
      if (data.hearts) setHeartsState(data.hearts);
      if (data.feedback) setFeedback(data.feedback);
      if (data?.frustration_guard?.show_easy_mode_cta) {
        setFrustrationGuard(data.frustration_guard);
      } else {
        setFrustrationGuard(null);
      }
      const delay = data?.feedback?.is_correct ? FEEDBACK_DELAY_CORRECT_MS : FEEDBACK_DELAY_WRONG_MS;
      if (nextStepTimeoutRef.current) {
        clearTimeout(nextStepTimeoutRef.current);
      }
      nextStepTimeoutRef.current = setTimeout(() => {
        const isLast = currentStepIndex >= exercises.length - 1;
        if (isLast) {
          if (session?.session_type === "checkpoint") {
            checkpointSubmitMutation.mutate();
          } else {
            finishMutation.mutate();
          }
        } else {
          setCurrentStepIndex((prev) => prev + 1);
          refetch();
        }
        setFeedback(null);
        nextStepTimeoutRef.current = null;
      }, delay);
    },
    onError: (err) => {
      const data = err?.response?.data;
      if (err?.response?.status === 429 && data?.hearts) {
        setHeartsState(data.hearts);
      }
    },
  });

  useEffect(() => {
    if (!exercises.length || session?.status !== "started" || finishPayload) return;
    const answered = new Set(attempts.map((item) => item.step_index));
    const allAnswered = exercises.every((exercise) => answered.has(exercise.step_index));
    if (!allAnswered || finishMutation.isPending || checkpointSubmitMutation.isPending) return;

    if (session?.session_type === "checkpoint") {
      checkpointSubmitMutation.mutate();
    } else {
      finishMutation.mutate();
    }
  }, [
    attempts,
    checkpointSubmitMutation,
    exercises,
    finishMutation,
    finishPayload,
    session?.session_type,
    session?.status,
  ]);

  const currentExercise = useMemo(() => exercises[currentStepIndex] || null, [exercises, currentStepIndex]);
  const isListeningLesson = session?.lesson_skill_tag === "listening";
  const listeningTranscript = session?.lesson_listening_transcript || "";
  const listeningTranslation = session?.lesson_listening_translation_vi || "";
  const listeningDuration = session?.lesson_listening_estimated_seconds || 30;

  useEffect(() => {
    setTtsRate(session?.lesson_listening_tts_rate || 0.9);
  }, [session?.lesson_listening_tts_rate, sessionId]);

  const speakText = useCallback((text, restart = true) => {
    if (!text) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTtsWarning("Thiết bị không hỗ trợ giọng đọc tiếng Anh phù hợp.");
      return;
    }
    if (typeof SpeechSynthesisUtterance === "undefined") {
      setTtsWarning("Thiết bị hiện tại chưa hỗ trợ trình đọc văn bản.");
      return;
    }
    const voices = typeof window.speechSynthesis.getVoices === "function"
      ? window.speechSynthesis.getVoices()
      : [];
    const preferredLang = session?.lesson_listening_tts_lang || "en-US";
    const voice = voices.find((item) => item.lang === preferredLang)
      || voices.find((item) => item.lang?.startsWith("en-GB"))
      || voices.find((item) => item.lang?.startsWith("en"));

    if (voices.length > 0 && !voice) {
      setTtsWarning("Thiết bị không hỗ trợ giọng đọc tiếng Anh phù hợp.");
      return;
    }

    setTtsWarning("");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preferredLang;
    utterance.rate = ttsRate;
    if (voice) utterance.voice = voice;
    if (restart) window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [session?.lesson_listening_tts_lang, ttsRate]);

  const buildSubmittedAnswer = (answerOverride = null) => {
    if (!currentExercise) return {};
    if (currentExercise.exercise_type === "mc_meaning") {
      return { option: answerOverride ?? textAnswer };
    }
    if (currentExercise.exercise_type === "listen_choose_word") {
      return { option: answerOverride ?? textAnswer };
    }
    if ((currentExercise.exercise_type === "fill_blank" || currentExercise.exercise_type === "grammar_fill_blank")) return { text: textAnswer };
    if ((currentExercise.exercise_type === "word_order" || currentExercise.exercise_type === "grammar_sentence_order")) return { tokens: orderedTokens };
    return {};
  };

  const canSubmit = useMemo(() => {
    if (!currentExercise) return false;
    if ((currentExercise.exercise_type === "word_order" || currentExercise.exercise_type === "grammar_sentence_order")) return orderedTokens.length > 0;
    return textAnswer.trim().length > 0;
  }, [currentExercise, textAnswer, orderedTokens]);

  const handleSubmitAnswer = useCallback((answerOverride = null) => {
    const submitted = buildSubmittedAnswer(answerOverride);
    const hasAnswer = (() => {
      if (!currentExercise) return false;
      if ((currentExercise.exercise_type === "word_order" || currentExercise.exercise_type === "grammar_sentence_order")) return (submitted.tokens || []).length > 0;
      if ((currentExercise.exercise_type === "fill_blank" || currentExercise.exercise_type === "grammar_fill_blank")) return String(submitted.text || "").trim().length > 0;
      return String(submitted.option || "").trim().length > 0;
    })();

    if (!currentExercise || !hasAnswer || answerMutation.isPending) return;
      answerMutation.mutate({
        step_index: currentExercise.step_index,
        submitted_answer: submitted,
        response_ms: Math.max(100, Date.now() - stepStartedAtRef.current),
      });
      setSubmittedStepIndex(currentExercise.step_index);
    }, [answerMutation, currentExercise, orderedTokens, textAnswer]);

  const addToken = useCallback((token, index) => {
    setOrderedTokens((prev) => [...prev, token]);
    setUsedTokenIndexes((prev) => new Set([...prev, index]));
  }, []);

  const resetTokens = useCallback(() => {
    setOrderedTokens([]);
    setUsedTokenIndexes(new Set());
  }, []);

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.isComposing) return;
      if (!currentExercise) return;
      if (feedback) return;
      if (answerMutation.isPending || finishMutation.isPending || checkpointSubmitMutation.isPending) return;

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 4) {
        if (isTypingTarget(event.target) && (currentExercise.exercise_type === "fill_blank" || currentExercise.exercise_type === "grammar_fill_blank")) return;

        if (currentExercise.exercise_type === "mc_meaning" || currentExercise.exercise_type === "listen_choose_word") {
          const option = (currentExercise.choices || [])[digit - 1];
          if (!option) return;
          event.preventDefault();
          setTextAnswer(option);
          keyboardSelectedOptionRef.current = option;
          return;
        }

        if ((currentExercise.exercise_type === "word_order" || currentExercise.exercise_type === "grammar_sentence_order")) {
          const availableTokens = (currentExercise.tokens || [])
            .map((token, index) => ({ token, index }))
            .filter((item) => !usedTokenIndexes.has(item.index));
          const selected = availableTokens[digit - 1];
          if (!selected) return;
          event.preventDefault();
          addToken(selected.token, selected.index);
        }
        return;
      }

      if (event.key !== "Enter") return;
      const keyboardOption = keyboardSelectedOptionRef.current;
      const canSubmitByKeyboardOption = (
        (currentExercise.exercise_type === "mc_meaning" || currentExercise.exercise_type === "listen_choose_word")
        && !!keyboardOption
      );
      if (!canSubmit && !canSubmitByKeyboardOption) return;
      event.preventDefault();
      handleSubmitAnswer(canSubmitByKeyboardOption ? keyboardOption : null);
    };
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [
    addToken,
    answerMutation.isPending,
    canSubmit,
    checkpointSubmitMutation.isPending,
    currentExercise,
    feedback,
    finishMutation.isPending,
    handleSubmitAnswer,
    usedTokenIndexes,
  ]);

  const handleQuitConfirm = () => {
    setQuitDialogOpen(false);
    quitMutation.mutate();
  };

  const handleBack = () => {
    invalidateLearningCaches();
    navigate(backPath);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (finishPayload) {
    return (
      <SessionSummary
        session={completedSessionSnapshot || session}
        result={finishPayload}
        onBack={handleBack}
        backLabel={backLabel}
      />
    );
  }

  if (isError || !session) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error?.response?.data?.detail || "Không tải được phiên học."}</Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>Thử lại</SbButton>
      </Stack>
    );
  }

  if (session.status === "completed") {
    return (
      <SessionSummary
        session={session}
        result={finishPayload || { summary: { accuracy_pct: session.total_answered > 0 ? Math.round((session.correct_answered / session.total_answered) * 100) : 0 } }}
        onBack={handleBack}
        backLabel={backLabel}
      />
    );
  }

  if (!currentExercise) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">Không tìm thấy câu hỏi cho phiên học này.</Alert>
        <SbButton variant="outlined" onClick={() => navigate(backPath)}>Quay lại</SbButton>
      </Stack>
    );
  }

  const progress = exercises.length ? Math.round(((currentStepIndex + 1) / exercises.length) * 100) : 0;
  const heartsLoaded = heartsState !== null || payload?.hearts !== undefined;
  const isHeartsEmpty = heartsLoaded && currentHearts <= 0 && !feedback;

  return (
    <>
      <Stack spacing={2.5} sx={{ maxWidth: 720, mx: "auto" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: colors.greenStarbucks }}>
            {session.lesson_title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{session.unit_title}</Typography>
            <Chip size="small" label={getSessionTypeLabel(session.session_type)} />
            <Chip size="small" label={`Độ khó: ${getDifficultyLabel(session.difficulty)}`} />
            <Chip size="small" color="success" label={getStatusLabel(session.status)} />
            <Chip
              size="small"
              color={currentHearts > 0 ? "default" : "error"}
              icon={<FavoriteRoundedIcon />}
              label={`${currentHearts}/${maxHearts}`}
            />
          </Stack>
        </Box>

        {isHeartsEmpty ? (
          <HeartsEmptyScreen
            heartsInfo={heartsInfo}
            onBack={handleBack}
            onRefillReady={() => {
              refetch();
            }}
          />
        ) : (
          <>
            {isListeningLesson && (
              <SbCard>
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label="Listening" color="primary" size="small" />
                      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                        {listeningDuration}s
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <SbButton size="small" variant="outlined" onClick={() => speakText(listeningTranscript, true)}>
                        Nghe
                      </SbButton>
                      <SbButton
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (typeof window !== "undefined" && window.speechSynthesis) {
                            window.speechSynthesis.pause();
                          }
                        }}
                      >
                        Tạm dừng
                      </SbButton>
                      <SbButton size="small" variant="outlined" onClick={() => speakText(listeningTranscript, true)}>
                        Đọc lại
                      </SbButton>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <SbButton size="small" variant={ttsRate === 0.8 ? "primary" : "outlined"} onClick={() => setTtsRate(0.8)}>
                      0.8x
                    </SbButton>
                    <SbButton size="small" variant={ttsRate === 1 ? "primary" : "outlined"} onClick={() => setTtsRate(1)}>
                      1.0x
                    </SbButton>
                  </Stack>
                  <SbButton
                    size="small"
                    variant="text"
                    onClick={() => setShowTranscript((prev) => !prev)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {showTranscript ? "Ẩn transcript" : "Xem transcript"}
                  </SbButton>
                  {showTranscript && (
                    <Stack spacing={0.75}>
                      <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
                        {listeningTranscript}
                      </Typography>
                      {!!listeningTranslation && (
                        <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", lineHeight: 1.7 }}>
                          {listeningTranslation}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </SbCard>
            )}

            {!!ttsWarning && (
              <Alert severity="warning">{ttsWarning}</Alert>
            )}

            {!!difficultyHint?.context && (
              <Alert severity="info">
                Tự động chỉnh độ khó: {getDifficultyLabel(difficultyHint.difficulty || session.difficulty)}. Lý do:{" "}
                {getDifficultyReasonLabel(difficultyHint.context.reason)}.
              </Alert>
            )}

            <Stack direction="row" justifyContent="flex-end">
              <SbButton
                variant="outlined"
                onClick={() => setQuitDialogOpen(true)}
                loading={quitMutation.isPending}
                sx={{ color: colors.red }}
              >
                Thoát phiên học
              </SbButton>
            </Stack>

            {!!frustrationGuard?.show_easy_mode_cta && (
              <Alert
                severity="warning"
                action={(
                  <SbButton
                    size="small"
                    variant="outlined"
                    loading={switchEasyMutation.isPending}
                    onClick={() => switchEasyMutation.mutate()}
                  >
                    Chuyển sang dễ
                  </SbButton>
                )}
              >
                Bạn đang sai liên tiếp {frustrationGuard.wrong_streak} câu. Nên chuyển sang chế độ dễ để học mượt hơn.
              </Alert>
            )}
            {!frustrationGuard?.show_easy_mode_cta && (feedback?.wrong_streak || 0) >= 2 && (
              <Alert severity="warning">
                Bạn đang sai liên tiếp {feedback.wrong_streak} câu. Hãy đọc kỹ đề bài và chọn đáp án chậm hơn.
              </Alert>
            )}

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
              }}
            />
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Câu {currentStepIndex + 1}/{exercises.length}
            </Typography>

            <SbCard>
              <Stack spacing={2}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>{currentExercise.prompt}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  Phím tắt: 1-4 để chọn nhanh, Enter để gửi đáp án.
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  Tiến độ được tự lưu sau mỗi câu. Nếu thoát giữa chừng, bạn có thể tiếp tục lại sau.
                </Typography>

                {currentExercise.exercise_type === "mc_meaning" && (
                  <Stack spacing={1}>
                    {(currentExercise.choices || []).map((option) => (
                      <SbButton
                        key={option}
                        variant={textAnswer === option ? "primary" : "outlined"}
                        onClick={() => {
                          setTextAnswer(option);
                          keyboardSelectedOptionRef.current = option;
                        }}
                        sx={{ justifyContent: "flex-start" }}
                      >
                        {option}
                      </SbButton>
                    ))}
                  </Stack>
                )}

                {currentExercise.exercise_type === "listen_choose_word" && (
                  <Stack spacing={1}>
                    {!isListeningSessionRoute && (
                      <SbButton
                        variant="outlined"
                        startIcon={<VolumeUpRoundedIcon />}
                        onClick={() => speakText(currentExercise.audio_text || "", true)}
                      >
                        Phát âm thanh
                      </SbButton>
                    )}
                    {isListeningSessionRoute && (
                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                        Dùng cụm điều khiển ở phía trên để nghe lại đoạn audio.
                      </Typography>
                    )}
                    {(currentExercise.choices || []).map((option) => (
                      <SbButton
                        key={option}
                        variant={textAnswer === option ? "primary" : "outlined"}
                        onClick={() => {
                          setTextAnswer(option);
                          keyboardSelectedOptionRef.current = option;
                        }}
                        sx={{ justifyContent: "flex-start" }}
                      >
                        {option}
                      </SbButton>
                    ))}
                  </Stack>
                )}

                {(currentExercise.exercise_type === "fill_blank" || currentExercise.exercise_type === "grammar_fill_blank") && (
                  <TextField
                    label="Nhập đáp án"
                    value={textAnswer}
                    onChange={(event) => setTextAnswer(event.target.value)}
                    fullWidth
                  />
                )}

                {(currentExercise.exercise_type === "word_order" || currentExercise.exercise_type === "grammar_sentence_order") && (
                  <Stack spacing={1.5}>
                    <Box sx={{ minHeight: 48, p: 1.2, borderRadius: 2, bgcolor: "background.default" }}>
                      <Typography sx={{ fontSize: "0.95rem" }}>
                        {orderedTokens.length ? orderedTokens.join(" ") : "Chưa chọn từ"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(currentExercise.tokens || []).map((token, index) => (
                        <SbButton
                          key={`${token}-${index}`}
                          size="small"
                          variant="outlined"
                          disabled={usedTokenIndexes.has(index)}
                          onClick={() => addToken(token, index)}
                        >
                          {token}
                        </SbButton>
                      ))}
                    </Stack>
                    <SbButton variant="outlined" size="small" startIcon={<ReplayRoundedIcon />} onClick={resetTokens}>
                      Làm lại
                    </SbButton>
                  </Stack>
                )}

                <Stack spacing={0.75}>
                  <SbButton
                    variant="primary"
                    disabled={!canSubmit}
                    loading={answerMutation.isPending || finishMutation.isPending || checkpointSubmitMutation.isPending}
                    onClick={() => handleSubmitAnswer()}
                  >
                    Gửi đáp án
                  </SbButton>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", textAlign: "center" }}>
                    Phím tắt: <strong>1-4</strong> chọn đáp án · <strong>Enter</strong> gửi nhanh
                  </Typography>
                </Stack>
              </Stack>
            </SbCard>

            {feedback && (
              <Alert severity={feedback.is_correct ? "success" : "error"} icon={feedback.is_correct ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}>
                {feedback.is_correct
                  ? `Đúng! +${feedback.awarded_xp} XP`
                  : `Sai, từ này sẽ được đưa vào ôn tập sớm. -${feedback.heart_cost ?? 1} tim`}
              </Alert>
            )}

              {!!answerMutation.error && submittedStepIndex === currentExercise?.step_index && answerMutation.error?.response?.status !== 429 && (
                <Alert severity="error">{answerMutation.error?.response?.data?.detail || "Gửi đáp án thất bại."}</Alert>
              )}
            {!!finishMutation.error && <Alert severity="error">{finishMutation.error?.response?.data?.detail || "Kết thúc phiên học thất bại."}</Alert>}
            {!!checkpointSubmitMutation.error && <Alert severity="error">{checkpointSubmitMutation.error?.response?.data?.detail || "Nộp checkpoint thất bại."}</Alert>}
            {!!quitMutation.error && <Alert severity="error">{quitMutation.error?.response?.data?.detail || "Thoát phiên học thất bại."}</Alert>}
            {!!switchEasyMutation.error && <Alert severity="error">{switchEasyMutation.error?.response?.data?.detail || "Chuyển chế độ dễ thất bại."}</Alert>}
          </>
        )}
      </Stack>

      <Dialog open={quitDialogOpen} onClose={() => setQuitDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Thoát phiên học?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary" }}>
            Phiên học sẽ bị hủy, nhưng các câu đã làm vẫn được lưu để bạn có thể tiếp tục lại sau. Bạn có chắc muốn thoát không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SbButton variant="outlined" onClick={() => setQuitDialogOpen(false)} disabled={quitMutation.isPending}>
            Tiếp tục học
          </SbButton>
          <SbButton
            variant="primary"
            onClick={handleQuitConfirm}
            loading={quitMutation.isPending}
            sx={{ bgcolor: colors.red, "&:hover": { bgcolor: "#c0392b" } }}
          >
            Thoát
          </SbButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LearningSessionPage;




