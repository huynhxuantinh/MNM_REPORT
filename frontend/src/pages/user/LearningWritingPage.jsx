import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackRoundedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  EditNoteRounded as EditNoteRoundedIcon,
  SendRounded as SendRoundedIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const draftKey = (activityId) => `learning_writing_draft_${activityId}`;

const getSubmissionFromPayload = (payload) => payload?.submission || null;

const LearningWritingPage = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const initialPayload = location.state?.startedPayload || null;
  const activity = location.state?.activity || null;
  const unit = location.state?.unit || null;

  const [startPayload, setStartPayload] = useState(initialPayload);
  const [answerText, setAnswerText] = useState(() => localStorage.getItem(draftKey(activityId)) || "");
  const [submitResult, setSubmitResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const startMutation = useMutation({
    mutationFn: () => learningApi.startActivity(activityId).then((response) => response.data),
    onSuccess: (payload) => {
      setStartPayload(payload);
      const submission = getSubmissionFromPayload(payload);
      const savedDraft = localStorage.getItem(draftKey(activityId));
      if (!savedDraft && submission?.answer_text) {
        setAnswerText(submission.answer_text);
      }
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.detail || "Không thể mở bài viết.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => learningApi.submitWritingActivity(activityId, { answer_text: answerText }).then((response) => response.data),
    onSuccess: (payload) => {
      setSubmitResult(payload);
      localStorage.removeItem(draftKey(activityId));
      qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
      qc.invalidateQueries({ queryKey: ["learning-path"] });
      qc.invalidateQueries({ queryKey: ["home-learning-path"] });
      qc.invalidateQueries({ queryKey: ["daily-goal"] });
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
      window.setTimeout(() => navigate("/learning"), 1500);
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.detail || "Không thể nộp bài viết.");
    },
  });

  const submission = getSubmissionFromPayload(startPayload);
  const finalSubmission = submitResult?.submission || submission;
  const isSubmitted = finalSubmission?.status === "submitted" || finalSubmission?.status === "reviewed";
  const wordCount = useMemo(() => answerText.trim().split(/\s+/).filter(Boolean).length, [answerText]);
  const minWords = Number(activity?.metadata?.min_words || 3);
  const canSubmit = wordCount >= minWords && !submitMutation.isPending && !isSubmitted;
  const progress = Math.min(100, Math.round((wordCount / minWords) * 100));

  useEffect(() => {
    if (!initialPayload && activityId) {
      startMutation.mutate();
    }
  }, [activityId]);

  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(draftKey(activityId), answerText);
    }
  }, [activityId, answerText, isSubmitted]);

  if (startMutation.isPending && !startPayload) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: colors.greenAccent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 920, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
              <Chip icon={<EditNoteRoundedIcon sx={{ fontSize: "16px !important" }} />} label="Writing" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 800 }} />
              {unit?.title && <Chip label={`Unit ${unit.order_index}: ${unit.title}`} sx={{ fontWeight: 700 }} />}
            </Stack>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.6rem", md: "2rem" }, color: colors.greenStarbucks }}>
              {activity?.title || "Bài viết"}
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
              Viết câu trả lời ngắn, nộp bài để hoàn thành activity và nhận XP.
            </Typography>
          </Box>
          <SbButton variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/learning")}>
            Về lộ trình
          </SbButton>
        </Stack>

        {errorMessage && <Alert severity="error" sx={{ borderRadius: 3 }} onClose={() => setErrorMessage("")}>{errorMessage}</Alert>}

        {isSubmitted && (
          <Alert severity="success" icon={<CheckCircleRoundedIcon />} sx={{ borderRadius: 3 }}>
            Bài viết đã được nộp{submitResult?.already_submitted ? " trước đó" : " thành công"}. XP hiện tại: {submitResult?.user?.xp ?? "--"}.
          </Alert>
        )}

        <SbCard sx={{ border: `1px solid ${colors.greenAccent}22` }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 900, color: colors.greenStarbucks, mb: 0.75 }}>
                Đề bài
              </Typography>
              <Typography sx={{ color: "text.primary", lineHeight: 1.7 }}>
                {finalSubmission?.prompt || activity?.description || "Write a short answer for this activity."}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontWeight: 800 }}>Bài làm của bạn</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: wordCount >= minWords ? colors.greenAccent : "text.secondary", fontWeight: 800 }}>
                  {wordCount}/{minWords} từ tối thiểu
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mb: 1.5, height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.1)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }}
              />
              <TextField
                fullWidth
                multiline
                minRows={8}
                value={answerText}
                disabled={isSubmitted}
                onChange={(event) => setAnswerText(event.target.value)}
                placeholder="Nhập bài viết của bạn ở đây..."
                inputProps={{ maxLength: 5000 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "background.default",
                  },
                }}
              />
              <Typography sx={{ mt: 0.75, fontSize: "0.8rem", color: "text.secondary" }}>
                Draft được lưu trên trình duyệt cho đến khi bạn nộp bài.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <SbButton variant="outlined" onClick={() => navigate("/learning")}>
                Để sau
              </SbButton>
              <SbButton
                variant="primary"
                startIcon={<SendRoundedIcon />}
                disabled={!canSubmit}
                loading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Nộp bài
              </SbButton>
            </Stack>
          </Stack>
        </SbCard>
      </Stack>
    </Box>
  );
};

export default LearningWritingPage;
