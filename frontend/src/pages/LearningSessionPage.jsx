import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import learningApi from "@/api/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const FEEDBACK_DELAY_MS = 180;

const SessionSummary = ({ session, result, onBack }) => {
  const passed = !!result?.passed;
  const isCheckpoint = session?.session_type === "checkpoint";
  const summary = result?.summary;
  const accuracyByType = summary?.accuracy_by_type || {};
  const reviewWords = summary?.review_words || [];

  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: "auto", py: 4, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks }}>
        {isCheckpoint ? "Checkpoint Result" : "Session Completed"}
      </Typography>
      <SbCard>
        <Stack spacing={1.2}>
          <Typography>Total: {session?.total_answered ?? 0}</Typography>
          <Typography>Correct: {session?.correct_answered ?? 0}</Typography>
          <Typography>XP earned: {session?.xp_earned ?? 0}</Typography>
          <Typography>Accuracy: {summary?.accuracy_pct ?? 0}%</Typography>
          {isCheckpoint && result && (
            <Typography sx={{ fontWeight: 700, color: passed ? colors.greenAccent : colors.red }}>
              Score: {result.score_pct}% | {passed ? "Passed" : "Not passed"}
            </Typography>
          )}
        </Stack>
      </SbCard>

      {Object.keys(accuracyByType).length > 0 && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>Accuracy By Type</Typography>
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
            <Typography sx={{ fontWeight: 700, color: colors.red }}>Words To Review</Typography>
            {reviewWords.map((word) => (
              <Typography key={word.id} sx={{ fontSize: "0.9rem" }}>
                {word.text} - {word.definition_vi || word.definition_en}
              </Typography>
            ))}
          </Stack>
        </SbCard>
      )}

      <SbButton variant="primary" onClick={onBack}>Back To Learning Path</SbButton>
    </Stack>
  );
};

const LearningSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [orderedTokens, setOrderedTokens] = useState([]);
  const [finishPayload, setFinishPayload] = useState(null);
  const [frustrationGuard, setFrustrationGuard] = useState(null);
  const stepStartedAtRef = useRef(Date.now());

  const { data: payload, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-session", sessionId],
    queryFn: () => learningApi.getLearningSession(sessionId).then((response) => response.data),
  });

  const session = payload?.session;
  const attempts = payload?.attempts || [];
  const exercises = payload?.exercises || [];
  const heartsInfo = payload?.hearts;
  const currentHearts = feedback?.hearts ?? heartsInfo?.current ?? 0;
  const maxHearts = heartsInfo?.max ?? 5;

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
    stepStartedAtRef.current = Date.now();
  }, [currentStepIndex]);

  const checkpointSubmitMutation = useMutation({
    mutationFn: () => learningApi.submitCheckpoint(sessionId).then((response) => response.data),
    onSuccess: (data) => {
      setFinishPayload(data);
      refetch();
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => learningApi.finishLearningSession(sessionId).then((response) => response.data),
    onSuccess: (data) => {
      setFinishPayload(data);
      refetch();
    },
  });
  const quitMutation = useMutation({
    mutationFn: () => learningApi.quitLearningSession(sessionId, "user_clicked_quit").then((response) => response.data),
    onSuccess: () => {
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
      setFeedback(data.feedback);
      if (data?.frustration_guard?.show_easy_mode_cta) {
        setFrustrationGuard(data.frustration_guard);
      } else {
        setFrustrationGuard(null);
      }
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
      }, FEEDBACK_DELAY_MS);
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

  const handleSubmitAnswer = () => {
    if (!currentExercise || !canSubmit || answerMutation.isPending) return;
    answerMutation.mutate({
      step_index: currentExercise.step_index,
      submitted_answer: buildSubmittedAnswer(),
      response_ms: Math.max(100, Date.now() - stepStartedAtRef.current),
    });
  };

  const addToken = (token) => {
    setOrderedTokens((prev) => [...prev, token]);
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
        <SbButton variant="outlined" onClick={() => refetch()}>Retry</SbButton>
      </Stack>
    );
  }

  if (session.status === "completed" || finishPayload) {
    return <SessionSummary session={session} result={finishPayload} onBack={() => navigate("/learning")} />;
  }

  if (!currentExercise) {
    return (
      <Stack spacing={2}>
        <Alert severity="warning">No exercise found for this session.</Alert>
        <SbButton variant="outlined" onClick={() => navigate("/learning")}>Back</SbButton>
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
          <Chip size="small" label={session.session_type} />
          <Chip
            size="small"
            color={currentHearts > 0 ? "default" : "error"}
            icon={<FavoriteRoundedIcon />}
            label={`${currentHearts}/${maxHearts}`}
          />
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="flex-end">
        <SbButton
          variant="outlined"
          onClick={() => quitMutation.mutate()}
          loading={quitMutation.isPending}
          sx={{ color: colors.red }}
        >
          Quit Session
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
              Switch To Easy
            </SbButton>
          )}
        >
          Ban dang sai lien tiep {frustrationGuard.wrong_streak} cau. Nen chuyen sang Easy mode de tiep tuc muot hon.
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
        Cau {currentStepIndex + 1}/{exercises.length}
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
                Play Audio
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
              label="Nhap dap an"
              value={textAnswer}
              onChange={(event) => setTextAnswer(event.target.value)}
              fullWidth
            />
          )}

          {currentExercise.exercise_type === "word_order" && (
            <Stack spacing={1.5}>
              <Box sx={{ minHeight: 48, p: 1.2, borderRadius: 2, bgcolor: "background.default" }}>
                <Typography sx={{ fontSize: "0.95rem" }}>
                  {orderedTokens.length ? orderedTokens.join(" ") : "Chua chon tu"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {(currentExercise.tokens || []).map((token, index) => (
                  <SbButton key={`${token}-${index}`} size="small" variant="outlined" onClick={() => addToken(token)}>
                    {token}
                  </SbButton>
                ))}
              </Stack>
              <SbButton variant="outlined" size="small" startIcon={<ReplayRoundedIcon />} onClick={() => setOrderedTokens([])}>
                Reset
              </SbButton>
            </Stack>
          )}

          <SbButton
            variant="primary"
            disabled={!canSubmit}
            loading={answerMutation.isPending || finishMutation.isPending || checkpointSubmitMutation.isPending}
            onClick={handleSubmitAnswer}
          >
            Submit
          </SbButton>
        </Stack>
      </SbCard>

      {feedback && (
        <Alert severity={feedback.is_correct ? "success" : "error"} icon={feedback.is_correct ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}>
          {feedback.is_correct
            ? `Dung! +${feedback.awarded_xp} XP`
            : `Sai, tu nay se duoc day vao review som. -${feedback.heart_cost ?? 1} heart`}
          {feedback.server_eval_ms !== undefined ? ` (server ${feedback.server_eval_ms} ms)` : ""}
        </Alert>
      )}

      {!!answerMutation.error && <Alert severity="error">{answerMutation.error?.response?.data?.detail || "Submit answer failed."}</Alert>}
      {!!finishMutation.error && <Alert severity="error">{finishMutation.error?.response?.data?.detail || "Finish lesson session failed."}</Alert>}
      {!!checkpointSubmitMutation.error && <Alert severity="error">{checkpointSubmitMutation.error?.response?.data?.detail || "Submit checkpoint failed."}</Alert>}
      {!!quitMutation.error && <Alert severity="error">{quitMutation.error?.response?.data?.detail || "Quit session failed."}</Alert>}
      {!!switchEasyMutation.error && <Alert severity="error">{switchEasyMutation.error?.response?.data?.detail || "Switch easy mode failed."}</Alert>}
    </Stack>
  );
};

export default LearningSessionPage;
