import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { CancelRounded as CancelRoundedIcon } from "@mui/icons-material";
import { ReplayRounded as ReplayRoundedIcon } from "@mui/icons-material";
import { FavoriteRounded as FavoriteRoundedIcon } from "@mui/icons-material";
import { VolumeUpRounded as VolumeUpRoundedIcon } from "@mui/icons-material";
import learningApi from "@/api/learningApi";
import { setUser } from "@/features/auth/authSlice";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const FEEDBACK_DELAY_CORRECT_MS = 1200;
const FEEDBACK_DELAY_WRONG_MS = 1800;
const SESSION_TYPE_LABELS = {
  lesson: "Bài học",
  checkpoint: "Checkpoint",
};
const DIFFICULTY_LABELS = {
  easy: "Dễ",
  normal: "Thường",
  hard: "Khó",
};
const DIFFICULTY_REASON_LABELS = {
  high_accuracy_and_fast_response: "Độ chính xác cao và phản hồi nhanh",
  balanced_recent_performance: "Hiệu suất gần đây cân bằng",
  low_accuracy_or_wrong_streak: "Độ chính xác thấp hoặc nhiều lỗi liên tiếp",
};

const getSessionTypeLabel = (value) => SESSION_TYPE_LABELS[value] || value || "Bài học";
const getDifficultyLabel = (value) => DIFFICULTY_LABELS[value] || value || "Thường";
const getDifficultyReasonLabel = (value) => {
  if (!value) return DIFFICULTY_REASON_LABELS.balanced_recent_performance;
  if (DIFFICULTY_REASON_LABELS[value]) return DIFFICULTY_REASON_LABELS[value];
  return value.replaceAll("_", " ");
};

const SessionSummary = ({ session, result, onBack }) => {
  const passed = !!result?.passed;
  const isCheckpoint = session?.session_type === "checkpoint";
  const summary = result?.summary;
  const accuracyByType = summary?.accuracy_by_type || {};
  const reviewWords = summary?.review_words || [];

  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: "auto", py: 4, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks }}>
        {isCheckpoint ? "Kết quả checkpoint" : "Hoàn thành phiên học"}
      </Typography>
      <SbCard>
        <Stack spacing={1.2}>
          <Typography>Tổng câu: {session?.total_answered ?? 0}</Typography>
          <Typography>Đúng: {session?.correct_answered ?? 0}</Typography>
          <Typography>XP nhận được: {session?.xp_earned ?? 0}</Typography>
          <Typography>Độ chính xác: {summary?.accuracy_pct ?? 0}%</Typography>
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

      <SbButton variant="primary" onClick={onBack}>Về lộ trình học</SbButton>
    </Stack>
  );
};

const LearningSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [orderedTokens, setOrderedTokens] = useState([]);
  const [usedTokenIndexes, setUsedTokenIndexes] = useState(new Set());
  const [finishPayload, setFinishPayload] = useState(null);
  const [frustrationGuard, setFrustrationGuard] = useState(null);
  const stepStartedAtRef = useRef(Date.now());
  const invalidateLearningCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["learning-recover-session"] });
    queryClient.invalidateQueries({ queryKey: ["home-recover-session"] });
    queryClient.invalidateQueries({ queryKey: ["learning-path"] });
    queryClient.invalidateQueries({ queryKey: ["daily-goal"] });
    queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const { data: payload, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-session", sessionId],
    queryFn: () => learningApi.getLearningSession(sessionId).then((response) => response.data),
  });

  const session = payload?.session;
  const attempts = payload?.attempts || [];
  const exercises = payload?.exercises || [];
  const heartsInfo = payload?.hearts;
  const difficultyHint = payload?.difficulty_hint;
  const currentHearts = feedback?.hearts ?? heartsInfo?.current ?? 0;
  const maxHearts = heartsInfo?.max ?? 10;

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
    stepStartedAtRef.current = Date.now();
  }, [currentStepIndex]);

  const checkpointSubmitMutation = useMutation({
    mutationFn: () => learningApi.submitCheckpoint(sessionId).then((response) => response.data),
    onSuccess: (data) => {
      setFinishPayload(data);
      invalidateLearningCaches();
      refetch();
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => learningApi.finishLearningSession(sessionId).then((response) => response.data),
    onSuccess: (data) => {
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
      navigate("/learning");
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
      if (data.feedback) setFeedback(data.feedback);
      if (data?.frustration_guard?.show_easy_mode_cta) {
        setFrustrationGuard(data.frustration_guard);
      } else {
        setFrustrationGuard(null);
      }
      const delay = data?.feedback?.is_correct ? FEEDBACK_DELAY_CORRECT_MS : FEEDBACK_DELAY_WRONG_MS;
      setTimeout(() => {
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
      }, delay);
    },
  });

  const currentExercise = useMemo(() => exercises[currentStepIndex] || null, [exercises, currentStepIndex]);

  const buildSubmittedAnswer = () => {
    if (!currentExercise) return {};
    if (currentExercise.exercise_type === "mc_meaning") return { option: textAnswer };
    if (currentExercise.exercise_type === "listen_choose_word") return { option: textAnswer };
    if (currentExercise.exercise_type === "fill_blank") return { text: textAnswer };
    if (currentExercise.exercise_type === "word_order") return { tokens: orderedTokens };
    return {};
  };

  const canSubmit = useMemo(() => {
    if (!currentExercise) return false;
    if (currentExercise.exercise_type === "word_order") return orderedTokens.length > 0;
    return textAnswer.trim().length > 0;
  }, [currentExercise, textAnswer, orderedTokens]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentExercise || !canSubmit || answerMutation.isPending) return;
    answerMutation.mutate({
      step_index: currentExercise.step_index,
      submitted_answer: buildSubmittedAnswer(),
      response_ms: Math.max(100, Date.now() - stepStartedAtRef.current),
    });
  }, [answerMutation, canSubmit, currentExercise, orderedTokens, textAnswer]);

  useEffect(() => {
    const handleEnterSubmit = (event) => {
      if (event.key !== "Enter") return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.isComposing) return;
      if (!currentExercise || !canSubmit) return;
      if (answerMutation.isPending || finishMutation.isPending || checkpointSubmitMutation.isPending) return;
      event.preventDefault();
      handleSubmitAnswer();
    };
    window.addEventListener("keydown", handleEnterSubmit);
    return () => window.removeEventListener("keydown", handleEnterSubmit);
  }, [
    answerMutation.isPending,
    canSubmit,
    checkpointSubmitMutation.isPending,
    currentExercise,
    finishMutation.isPending,
    handleSubmitAnswer,
  ]);

  const addToken = (token, index) => {
    setOrderedTokens((prev) => [...prev, token]);
    setUsedTokenIndexes((prev) => new Set([...prev, index]));
  };

  const resetTokens = () => {
    setOrderedTokens([]);
    setUsedTokenIndexes(new Set());
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !session) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error?.response?.data?.detail || "Cannot load session."}</Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>Thử lại</SbButton>
      </Stack>
    );
  }

  if (session.status === "completed" || finishPayload) {
    return (
      <SessionSummary
        session={session}
        result={finishPayload}
        onBack={() => {
          invalidateLearningCaches();
          navigate("/learning");
        }}
      />
    );
  }

  if (!currentExercise) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">No exercise found for this session.</Alert>
        <SbButton variant="outlined" onClick={() => navigate("/learning")}>Quay lại</SbButton>
      </Stack>
    );
  }

  const progress = exercises.length ? Math.round(((currentStepIndex + 1) / exercises.length) * 100) : 0;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720, mx: "auto" }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: colors.greenStarbucks }}>
          {session.lesson_title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{session.unit_title}</Typography>
          <Chip size="small" label={getSessionTypeLabel(session.session_type)} />
          <Chip size="small" label={`Độ khó: ${getDifficultyLabel(session.difficulty)}`} />
          <Chip
            size="small"
            color={currentHearts > 0 ? "default" : "error"}
            icon={<FavoriteRoundedIcon />}
            label={`${currentHearts}/${maxHearts}`}
          />
        </Stack>
      </Box>

      {!!difficultyHint?.context && (
        <Alert severity="info">
          Tự động chỉnh độ khó: {getDifficultyLabel(difficultyHint.difficulty || session.difficulty)}. Lý do:{" "}
          {getDifficultyReasonLabel(difficultyHint.context.reason)}.
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end">
        <SbButton
          variant="outlined"
          onClick={() => quitMutation.mutate()}
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

          {currentExercise.exercise_type === "mc_meaning" && (
            <Stack spacing={1}>
              {(currentExercise.choices || []).map((option) => (
                <SbButton
                  key={option}
                  variant={textAnswer === option ? "primary" : "outlined"}
                  onClick={() => setTextAnswer(option)}
                  sx={{ justifyContent: "flex-start" }}
                >
                  {option}
                </SbButton>
              ))}
            </Stack>
          )}

          {currentExercise.exercise_type === "listen_choose_word" && (
            <Stack spacing={1}>
              <SbButton
                variant="outlined"
                startIcon={<VolumeUpRoundedIcon />}
                onClick={() => {
                  const text = currentExercise.audio_text || "";
                  if (typeof window !== "undefined" && window.speechSynthesis && text) {
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.lang = "en-US";
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(utter);
                  }
                }}
              >
                Phát âm thanh
              </SbButton>
              {(currentExercise.choices || []).map((option) => (
                <SbButton
                  key={option}
                  variant={textAnswer === option ? "primary" : "outlined"}
                  onClick={() => setTextAnswer(option)}
                  sx={{ justifyContent: "flex-start" }}
                >
                  {option}
                </SbButton>
              ))}
            </Stack>
          )}

          {currentExercise.exercise_type === "fill_blank" && (
            <TextField
              label="Nhập đáp án"
              value={textAnswer}
              onChange={(event) => setTextAnswer(event.target.value)}
              fullWidth
            />
          )}

          {currentExercise.exercise_type === "word_order" && (
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

          <SbButton
            variant="primary"
            disabled={!canSubmit}
            loading={answerMutation.isPending || finishMutation.isPending || checkpointSubmitMutation.isPending}
            onClick={handleSubmitAnswer}
          >
            Gửi đáp án
          </SbButton>
        </Stack>
      </SbCard>

      {feedback && (
        <Alert severity={feedback.is_correct ? "success" : "error"} icon={feedback.is_correct ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}>
          {feedback.is_correct
            ? `Đúng! +${feedback.awarded_xp} XP`
            : `Sai, từ này sẽ được đưa vào ôn tập sớm. -${feedback.heart_cost ?? 1} tim`}
          {feedback.server_eval_ms !== undefined ? ` (server ${feedback.server_eval_ms} ms)` : ""}
        </Alert>
      )}

      {!!answerMutation.error && <Alert severity="error">{answerMutation.error?.response?.data?.detail || "Gửi đáp án thất bại."}</Alert>}
      {!!finishMutation.error && <Alert severity="error">{finishMutation.error?.response?.data?.detail || "Kết thúc phiên học thất bại."}</Alert>}
      {!!checkpointSubmitMutation.error && <Alert severity="error">{checkpointSubmitMutation.error?.response?.data?.detail || "Nộp checkpoint thất bại."}</Alert>}
      {!!quitMutation.error && <Alert severity="error">{quitMutation.error?.response?.data?.detail || "Thoát phiên học thất bại."}</Alert>}
      {!!switchEasyMutation.error && <Alert severity="error">{switchEasyMutation.error?.response?.data?.detail || "Chuyển chế độ dễ thất bại."}</Alert>}
    </Stack>
  );
};

export default LearningSessionPage;
