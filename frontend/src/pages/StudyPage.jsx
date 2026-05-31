import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { SbButton, SbCard } from "@/components/ui";
import learningApi from "@/api/learningApi";

/**
 * Legacy compatibility route.
 * Old links: /learning/:id/study
 * New flow: create learning session then redirect to /learning/session/:sessionId
 */
const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const startSessionMutation = useMutation({
    mutationFn: (lessonId) =>
      learningApi.startLearningSession(lessonId, "legacy_study_route").then((r) => r.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`, { replace: true });
    },
  });

  useEffect(() => {
    if (!id) {
      navigate("/learning", { replace: true });
      return;
    }
    startSessionMutation.mutate(Number(id));
  }, [id, navigate, startSessionMutation]);

  if (startSessionMutation.isError) {
    const message = startSessionMutation.error?.response?.data?.detail || "Không thể bắt đầu phiên học.";
    return (
      <Box sx={{ maxWidth: 680, mx: "auto", py: 4 }}>
        <SbCard>
          <Stack spacing={2}>
            <Alert severity="error">{message}</Alert>
            <Stack direction="row" spacing={1}>
              <SbButton
                variant="primary"
                onClick={() => id && startSessionMutation.mutate(Number(id))}
                loading={startSessionMutation.isPending}
              >
                Thử lại
              </SbButton>
              <SbButton variant="outlined" onClick={() => navigate("/learning")}>
                Về lộ trình
              </SbButton>
            </Stack>
          </Stack>
        </SbCard>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography color="text.secondary">Đang chuyển sang phiên học mới...</Typography>
      </Stack>
    </Box>
  );
};

export default StudyPage;
