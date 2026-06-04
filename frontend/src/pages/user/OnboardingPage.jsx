import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Stack, Alert, CircularProgress } from "@mui/material";
import { QuizRounded as QuizIcon } from "@mui/icons-material";
import { SchoolRounded as SchoolIcon } from "@mui/icons-material";
import { SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";

const normalize = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const isPlacementConflictError = (err) => {
  const statusCode = Number(err?.response?.status || 0);
  const detail = normalize(err?.response?.data?.detail);
  if (!detail.includes("placement")) return false;

  const placementConflictKeywords = ["ket qua", "da co", "already", "completed"];

  return [400, 409].includes(statusCode) && placementConflictKeywords.some((keyword) => detail.includes(keyword));
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: placementStatus, isLoading: placementLoading } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((r) => r.data),
    staleTime: 0,
  });

  useEffect(() => {
    if (!placementLoading && !placementStatus?.should_show_onboarding) {
      navigate("/learning", { replace: true });
    }
  }, [placementLoading, placementStatus, navigate]);

  const skipMutation = useMutation({
    mutationFn: () => learningApi.skipPlacement().then((r) => r.data),
    onSuccess: () => {
      qc.setQueryData(["placement-status"], (prev) => ({
        ...(prev || {}),
        has_completed_placement: true,
        should_show_onboarding: false,
      }));
      qc.invalidateQueries({ queryKey: ["placement-status"] });
      qc.invalidateQueries({ queryKey: ["learning-path"] });
      navigate("/learning", { replace: true });
    },
    onError: (err) => {
      if (isPlacementConflictError(err)) {
        qc.setQueryData(["placement-status"], (prev) => ({
          ...(prev || {}),
          has_completed_placement: true,
          should_show_onboarding: false,
        }));
        qc.invalidateQueries({ queryKey: ["placement-status"] });
        qc.invalidateQueries({ queryKey: ["learning-path"] });
        navigate("/learning", { replace: true });
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <Box>
          <Typography
            sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", sm: "2.2rem" }, color: colors.greenStarbucks, lineHeight: 1.2 }}
          >
            Chào mừng đến NoroStu!
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1.5, fontSize: "1rem" }}>
            Bạn muốn bắt đầu như thế nào?
          </Typography>
        </Box>

        <SbCard
          sx={{
            border: `2px solid ${colors.greenAccent}`,
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": { boxShadow: `0 4px 20px ${colors.greenAccent}30`, transform: "translateY(-2px)" },
          }}
          onClick={() => navigate("/learning/placement")}
        >
          <Stack direction="row" spacing={2.5} alignItems="center" sx={{ textAlign: "left" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                bgcolor: `${colors.greenAccent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <QuizIcon sx={{ fontSize: 28, color: colors.greenAccent }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks }}>
                Kiểm tra trình độ
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>
                Làm bài kiểm tra ngắn (~5 phút) để hệ thống đề xuất lộ trình phù hợp với bạn.
              </Typography>
            </Box>
          </Stack>
        </SbCard>

        <SbCard
          sx={{
            border: "2px solid rgba(0,0,0,0.08)",
            cursor: skipMutation.isPending ? "default" : "pointer",
            transition: "all 0.2s",
            "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
            opacity: skipMutation.isPending ? 0.7 : 1,
          }}
          onClick={() => {
            if (!skipMutation.isPending) skipMutation.mutate();
          }}
        >
          <Stack direction="row" spacing={2.5} alignItems="center" sx={{ textAlign: "left" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                bgcolor: "rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {skipMutation.isPending ? <CircularProgress size={24} sx={{ color: "text.secondary" }} /> : <SchoolIcon sx={{ fontSize: 28, color: "text.secondary" }} />}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "text.primary" }}>
                Bắt đầu từ cơ bản (A1)
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mt: 0.5 }}>
                Bỏ qua kiểm tra và bắt đầu học từ đầu. Bạn có thể làm bài kiểm tra sau bất cứ lúc nào.
              </Typography>
            </Box>
          </Stack>
        </SbCard>

        {skipMutation.isError && !isPlacementConflictError(skipMutation.error) && (
          <Alert severity="error">{skipMutation.error?.response?.data?.detail ?? "Đã có lỗi xảy ra, thử lại."}</Alert>
        )}
      </Stack>
    </Box>
  );
};

export default OnboardingPage;
