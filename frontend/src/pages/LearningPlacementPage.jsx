import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import learningApi from "@/api/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const PLACEMENT_DRAFT_KEY = "learning_placement_draft_v1";

const getFirstUnlockedLesson = (pathData) => {
  const units = (pathData?.units || [])
    .filter((unit) => !!unit?.unlocked)
    .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
  for (const unit of units) {
    const lessonLinks = (unit?.lessons || [])
      .filter((item) => !!item?.lesson?.id)
      .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
    if (lessonLinks.length > 0) {
      return lessonLinks[0].lesson;
    }
  }
  return null;
};

const LearningPlacementPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [placementResult, setPlacementResult] = useState(null);

  const { data: statusData } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((response) => response.data),
  });

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["placement-questions"],
    queryFn: () => learningApi.getPlacementQuestions(12).then((response) => response.data),
  });

  const submitMutation = useMutation({
    mutationFn: (payload) => learningApi.submitPlacement(payload).then((response) => response.data),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PLACEMENT_DRAFT_KEY);
      }
      setPlacementResult(data);
    },
  });
  const startFirstLessonMutation = useMutation({
    mutationFn: async () => {
      const pathData = await learningApi.getLearningPath().then((response) => response.data);
      const firstLesson = getFirstUnlockedLesson(pathData);
      if (!firstLesson?.id) {
        throw new Error("Khong tim thay lesson mo khoa de bat dau.");
      }
      return learningApi.startLearningSession(firstLesson.id).then((response) => response.data);
    },
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });

  const questions = useMemo(() => questionsData?.questions || [], [questionsData]);
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => answers[key]).length,
    [answers]
  );
  const progress = useMemo(
    () => (questions.length ? Math.round((answeredCount / questions.length) * 100) : 0),
    [answeredCount, questions.length]
  );

  useEffect(() => {
    if (typeof window === "undefined" || questions.length === 0) return;
    const raw = window.localStorage.getItem(PLACEMENT_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const allowed = new Set(questions.map((q) => String(q.question_id)));
      const restored = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (allowed.has(String(key)) && typeof value === "string") {
          restored[key] = value;
        }
      });
      if (Object.keys(restored).length > 0) {
        setAnswers(restored);
      }
    } catch {
      // ignore broken draft
    }
  }, [questions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PLACEMENT_DRAFT_KEY, JSON.stringify(answers));
  }, [answers]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const payload = questions
      .map((q) => ({
        question_id: q.question_id,
        option: answers[q.question_id] || "",
      }))
      .filter((item) => item.option);
    submitMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">
          {error?.response?.data?.detail || "Cannot load placement questions."}
        </Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Retry
        </SbButton>
      </Stack>
    );
  }

  if (placementResult?.result) {
    return (
      <Stack spacing={2.5} sx={{ maxWidth: 680, mx: "auto" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Placement Completed
        </Typography>
        <SbCard>
          <Stack spacing={1}>
            <Typography>
              Recommended level: <strong>{placementResult.result.recommended_level || "A1"}</strong>
            </Typography>
            <Typography>
              Score: <strong>{placementResult.result.score_pct}%</strong>
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Nen bat dau bai dau tien ngay de giu momentum.
            </Typography>
          </Stack>
        </SbCard>
        {!!startFirstLessonMutation.error && (
          <Alert severity="error">
            {startFirstLessonMutation.error?.response?.data?.detail
              || startFirstLessonMutation.error?.message
              || "Cannot start first lesson."}
          </Alert>
        )}
        <Stack direction="row" spacing={1.5}>
          <SbButton variant="outlined" onClick={() => navigate("/learning")}>
            Later
          </SbButton>
          <SbButton
            variant="primary"
            loading={startFirstLessonMutation.isPending}
            onClick={() => startFirstLessonMutation.mutate()}
          >
            Start First Lesson Now
          </SbButton>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 860, mx: "auto" }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Placement Test
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          Hoan thanh bai xep lop de toi uu do kho. Da tra loi {answeredCount}/{questions.length}.
        </Typography>
        {!!statusData?.has_completed_placement && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Ban da co ket qua placement truoc do (level: {statusData?.recommended_level || "N/A"}). Co the lam lai.
          </Alert>
        )}
      </Box>

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

      {questions.map((question, index) => (
        <SbCard key={question.question_id}>
          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>
              Cau {index + 1}: {question.prompt}
            </Typography>
            <FormControl>
              <RadioGroup
                value={answers[question.question_id] || ""}
                onChange={(event) => handleAnswerChange(question.question_id, event.target.value)}
              >
                {(question.choices || []).map((choice, choiceIndex) => (
                  <FormControlLabel
                    key={`${question.question_id}-${choiceIndex}`}
                    value={choice}
                    control={<Radio />}
                    label={choice}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Stack>
        </SbCard>
      ))}

      {!!submitMutation.error && (
        <Alert severity="error">
          {submitMutation.error?.response?.data?.detail || "Cannot submit placement."}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5}>
        <SbButton variant="outlined" onClick={() => navigate("/learning")}>
          Save & Back
        </SbButton>
        <SbButton
          variant="primary"
          disabled={answeredCount < 5}
          loading={submitMutation.isPending}
          onClick={handleSubmit}
        >
          Submit Placement
        </SbButton>
      </Stack>
    </Stack>
  );
};

export default LearningPlacementPage;
