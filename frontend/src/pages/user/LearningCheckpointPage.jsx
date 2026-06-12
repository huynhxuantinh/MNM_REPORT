import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { FactCheckRounded as FactCheckRoundedIcon } from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const LearningCheckpointPage = () => {
  const { activityId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [started, setStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activity = location.state?.activity || null;
  const unit = location.state?.unit || null;
  const startedPayload = location.state?.startedPayload || null;
  const initialUnitId = startedPayload?.unit_id || unit?.id || null;

  const startCheckpointMutation = useMutation({
    mutationFn: ({ unitId, currentActivityId }) =>
      learningApi.startCheckpoint(unitId, currentActivityId).then((response) => response.data),
    onSuccess: (payload) => {
      qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
      qc.invalidateQueries({ queryKey: ["home-learning-path"] });
      navigate(`/learning/session/${payload.id}`, {
        replace: true,
        state: { checkpointActivityId: Number(activityId) },
      });
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.detail || "Khong the mo checkpoint.");
    },
  });

  const startActivityMutation = useMutation({
    mutationFn: () => learningApi.startActivity(activityId).then((response) => response.data),
    onSuccess: (payload) => {
      if (payload.kind !== "checkpoint" || !payload.unit_id) {
        setErrorMessage("Activity nay khong phai checkpoint hop le.");
        return;
      }
      startCheckpointMutation.mutate({ unitId: payload.unit_id, currentActivityId: Number(activityId) });
    },
    onError: (error) => {
      setErrorMessage(error?.response?.data?.detail || "Khong the khoi dong checkpoint.");
    },
  });

  useEffect(() => {
    if (started || !activityId) return;
    setStarted(true);
    setErrorMessage("");
    if (initialUnitId) {
      startCheckpointMutation.mutate({ unitId: initialUnitId, currentActivityId: Number(activityId) });
      return;
    }
    startActivityMutation.mutate();
  }, [activityId, initialUnitId, started]);

  const isLoading = startActivityMutation.isPending || startCheckpointMutation.isPending;
  const title = useMemo(() => activity?.title || "Checkpoint", [activity?.title]);

  const retry = () => {
    setStarted(false);
    setErrorMessage("");
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", px: { xs: 0, sm: 1 } }}>
      <SbCard sx={{ border: `1px solid ${colors.greenAccent}33` }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "20px",
              bgcolor: `${colors.greenAccent}18`,
              color: colors.greenAccent,
              display: "grid",
              placeItems: "center",
            }}
          >
            {isLoading ? <CircularProgress size={30} color="inherit" /> : <FactCheckRoundedIcon fontSize="large" />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.45rem", color: colors.greenStarbucks }}>
              Dang mo {title}
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.75 }}>
              He thong dang tao checkpoint rieng cho unit nay. Vui long doi trong giay lat.
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error" sx={{ width: "100%", borderRadius: 2 }}>{errorMessage}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            {errorMessage && <SbButton variant="primary" onClick={retry}>Thu lai</SbButton>}
            <SbButton variant="outlined" onClick={() => navigate("/learning")}>Ve lo trinh</SbButton>
          </Stack>
        </Stack>
      </SbCard>
    </Box>
  );
};

export default LearningCheckpointPage;
