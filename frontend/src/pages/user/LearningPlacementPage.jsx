import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const PLACEMENT_DRAFT_KEY = "learning_placement_draft_v1";

const LearningPlacementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [placementResult, setPlacementResult] = useState(null);
  const [submitHint, setSubmitHint] = useState("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

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
    mutationFn: (payload) => learningApi.submitPlacement(payload, "placement_page").then((response) => response.data),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PLACEMENT_DRAFT_KEY);
      }
      setSubmitHint("");
      setPlacementResult(data);
      queryClient.invalidateQueries({ queryKey: ["placement-status"] });
      queryClient.invalidateQueries({ queryKey: ["learning-path"] });
      queryClient.invalidateQueries({ queryKey: ["learning-path-v2"] });
      queryClient.invalidateQueries({ queryKey: ["home-learning-path-v2"] });
    },
    onError: (err) => {
      const detail = String(err?.response?.data?.detail || "").toLowerCase();
      if (detail.includes("het han")) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PLACEMENT_DRAFT_KEY);
        }
        setAnswers({});
        setSubmitHint("Bộ câu hỏi cũ đã hết hạn. Hệ thống đã tải bộ câu hỏi mới, vui lòng làm lại.");
        refetch();
      }
    },
  });

  const handleGoToLearningPath = () => {
    queryClient.invalidateQueries({ queryKey: ["learning-path-v2"] });
    queryClient.invalidateQueries({ queryKey: ["home-learning-path-v2"] });
    navigate("/learning", { replace: true });
  };

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
    if (!questions.length) return;
    const firstUnansweredIndex = questions.findIndex((q) => !answers[q.question_id]);
    setActiveQuestionIndex(firstUnansweredIndex >= 0 ? firstUnansweredIndex : Math.max(questions.length - 1, 0));
  }, [answers, questions]);

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

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      if (placementResult) return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.isComposing) return;
      if (!questions.length) return;
      if (submitMutation.isPending) return;

      const digit = Number(event.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= 4) {
        const question = questions[activeQuestionIndex];
        const option = question?.choices?.[digit - 1];
        if (!question || !option) return;
        event.preventDefault();
        handleAnswerChange(question.question_id, option);
        setActiveQuestionIndex((prev) => Math.min(prev + 1, Math.max(questions.length - 1, 0)));
        return;
      }

      if (event.key === "Enter" && answeredCount >= 5) {
        event.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [activeQuestionIndex, answeredCount, placementResult, questions, submitMutation.isPending]);

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
          {error?.response?.data?.detail || "Không tải được câu hỏi placement."}
        </Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Thử lại
        </SbButton>
      </Stack>
    );
  }

  if (placementResult?.result) {
    return (
      <Stack spacing={2.5} sx={{ maxWidth: 680, mx: "auto" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Hoàn thành placement
        </Typography>
        <SbCard>
          <Stack spacing={1}>
            <Typography>
              Trình độ gợi ý: <strong>{placementResult.result.recommended_level || "A1"}</strong>
            </Typography>
            <Typography>
              Điểm: <strong>{placementResult.result.score_pct}%</strong>
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
              Nên bắt đầu bài đầu tiên ngay để giữ đà học.
            </Typography>
          </Stack>
        </SbCard>
        <Stack direction="row" spacing={1.5}>
          <SbButton variant="outlined" onClick={handleGoToLearningPath}>
            Để sau
          </SbButton>
          <SbButton
            variant="primary"
            onClick={handleGoToLearningPath}
          >
            Vào lộ trình
          </SbButton>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 860, mx: "auto" }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Bài kiểm tra xếp lớp
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          Hoàn thành bài xếp lớp để tối ưu độ khó. Đã trả lời {answeredCount}/{questions.length}.
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", mt: 0.5 }}>
          Phím tắt: 1-4 để chọn đáp án cho câu hiện tại, Enter để nộp nhanh.
        </Typography>
        {!!statusData?.has_completed_placement && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Bạn đã có kết quả placement trước đó (level: {statusData?.recommended_level || "N/A"}). Có thể làm lại.
          </Alert>
        )}
        {!!submitHint && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            {submitHint}
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
              Câu {index + 1}: {question.prompt}
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
          {submitMutation.error?.response?.data?.detail || "Không thể nộp placement."}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5}>
          <SbButton variant="outlined" onClick={handleGoToLearningPath}>
          Lưu & quay lại
        </SbButton>
        <SbButton
          variant="primary"
          disabled={answeredCount < 5}
          loading={submitMutation.isPending}
          onClick={handleSubmit}
        >
          Nộp placement
        </SbButton>
      </Stack>
    </Stack>
  );
};

export default LearningPlacementPage;

