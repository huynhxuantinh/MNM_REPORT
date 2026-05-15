import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import learningApi from "@/api/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const UnitCard = ({
  unit,
  onStart,
  onStartCheckpoint,
  startingLessonId,
  startingCheckpointUnitId,
  disabled,
}) => {
  const completedLessons = unit.progress?.completed_lessons ?? 0;
  const totalLessons = unit.lesson_count ?? unit.lessons?.length ?? 0;
  const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const isCompleted = !!unit.progress?.completed_at;
  const checkpointPassed = !!unit.progress?.checkpoint_passed;
  const canStartCheckpoint = unit.unlocked && totalLessons > 0 && completedLessons >= totalLessons && !checkpointPassed;

  return (
    <SbCard
      sx={{
        border: `1px solid ${unit.unlocked ? `${colors.greenAccent}33` : "rgba(0,0,0,0.08)"}`,
        opacity: unit.unlocked ? 1 : 0.7,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks }}>
            Unit {unit.order_index}: {unit.title}
          </Typography>
          {unit.unlocked ? (
            isCompleted ? (
              <Chip
                icon={<CheckCircleRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label="Done"
                size="small"
                sx={{ bgcolor: `${colors.greenAccent}20`, color: colors.greenAccent, fontWeight: 700 }}
              />
            ) : (
              <Chip label="Unlocked" size="small" sx={{ bgcolor: `${colors.gold}20`, color: colors.gold, fontWeight: 700 }} />
            )
          ) : (
            <Chip icon={<LockRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Locked" size="small" />
          )}
        </Stack>

        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
          {unit.description || "No description."}
        </Typography>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Progress
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 700 }}>
              {completedLessons}/{totalLessons}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 3,
              bgcolor: "rgba(0,0,0,0.1)",
              "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
            }}
          />
        </Box>

        <Stack spacing={1}>
          {(unit.lessons || []).map((item) => (
            <Stack
              key={`${unit.id}-${item.order_index}-${item.lesson?.id}`}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1}
              sx={{ p: 1.25, borderRadius: 2, bgcolor: "background.default" }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  Lesson {item.order_index}: {item.lesson?.title}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                  {item.lesson?.level || "A1"}
                </Typography>
              </Box>
              <SbButton
                size="small"
                variant="primary"
                startIcon={<PlayArrowRoundedIcon />}
                disabled={!unit.unlocked || disabled}
                loading={startingLessonId === item.lesson?.id}
                onClick={() => onStart(item.lesson?.id)}
              >
                Start
              </SbButton>
            </Stack>
          ))}
        </Stack>

        {canStartCheckpoint && (
          <SbButton
            variant="outlined"
            startIcon={<FactCheckRoundedIcon />}
            disabled={disabled}
            loading={startingCheckpointUnitId === unit.id}
            onClick={() => onStartCheckpoint(unit.id)}
          >
            Start Checkpoint
          </SbButton>
        )}
        {checkpointPassed && (
          <Alert severity="success" sx={{ py: 0 }}>
            Checkpoint passed
          </Alert>
        )}
      </Stack>
    </SbCard>
  );
};

const LearningPage = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-path"],
    queryFn: () => learningApi.getLearningPath().then((response) => response.data),
  });
  const { data: placementStatus } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((response) => response.data),
  });
  const { data: recoverData, refetch: refetchRecover } = useQuery({
    queryKey: ["learning-recover-session"],
    queryFn: () => learningApi.getRecoverableSession().then((response) => response.data),
  });

  const startMutation = useMutation({
    mutationFn: (lessonId) => learningApi.startLearningSession(lessonId).then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });
  const checkpointStartMutation = useMutation({
    mutationFn: (unitId) => learningApi.startCheckpoint(unitId).then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });
  const resumeMutation = useMutation({
    mutationFn: (sessionId) => learningApi.resumeLearningSession(sessionId).then((response) => response.data),
    onSuccess: (payload) => {
      navigate(`/learning/session/${payload.session?.id}`);
    },
  });
  const { data: dailyGoalData, refetch: refetchDailyGoal } = useQuery({
    queryKey: ["daily-goal"],
    queryFn: () => learningApi.getDailyGoal().then((response) => response.data),
  });
  const claimDailyGoalMutation = useMutation({
    mutationFn: () => learningApi.claimDailyGoal().then((response) => response.data),
    onSuccess: () => {
      refetchDailyGoal();
    },
  });
  const claimFreezeMutation = useMutation({
    mutationFn: () => learningApi.claimStreakFreeze().then((response) => response.data),
    onSuccess: () => {
      refetchDailyGoal();
    },
  });

  const units = useMemo(() => data?.units || [], [data]);
  const startingLessonId = startMutation.variables;
  const startingCheckpointUnitId = checkpointStartMutation.variables;

  const handleStartSession = (lessonId) => {
    if (!lessonId) return;
    startMutation.mutate(lessonId);
  };
  const handleStartCheckpoint = (unitId) => {
    if (!unitId) return;
    checkpointStartMutation.mutate(unitId);
  };
  const recoverSession = recoverData?.session;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    const message = error?.response?.data?.detail || "Cannot load learning path.";
    return (
      <Stack spacing={2}>
        <Alert severity="error">{message}</Alert>
        <SbButton variant="outlined" onClick={() => refetch()}>
          Retry
        </SbButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: colors.greenStarbucks }}>
          Learning Path
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          {data?.name || "Course"} · {units.length} units
        </Typography>
      </Box>

      {!!dailyGoalData && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
              Daily Goal
            </Typography>
            <Typography sx={{ fontSize: "0.9rem" }}>
              {dailyGoalData.today?.studied_minutes ?? 0}/{dailyGoalData.today?.goal_minutes ?? dailyGoalData.target_minutes} minutes
            </Typography>
            <Typography sx={{ fontSize: "0.9rem" }}>
              Hearts: {dailyGoalData.hearts?.current ?? 0}/{dailyGoalData.hearts?.max ?? 5}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem" }}>
              Streak Freeze: {dailyGoalData.streak?.freeze_count ?? 0}
            </Typography>
            <SbButton
              size="small"
              variant="outlined"
              disabled={!dailyGoalData.today?.is_achieved || !!dailyGoalData.today?.claimed_at}
              loading={claimDailyGoalMutation.isPending}
              onClick={() => claimDailyGoalMutation.mutate()}
            >
              {dailyGoalData.today?.claimed_at ? "Claimed" : `Claim +${dailyGoalData.reward_xp ?? 0} XP`}
            </SbButton>
            <SbButton
              size="small"
              variant="outlined"
              loading={claimFreezeMutation.isPending}
              onClick={() => claimFreezeMutation.mutate()}
            >
              Buy Freeze (-50 XP)
            </SbButton>
            {!!claimDailyGoalMutation.error && (
              <Alert severity="error">
                {claimDailyGoalMutation.error?.response?.data?.detail || "Cannot claim daily goal."}
              </Alert>
            )}
            {!!claimFreezeMutation.error && (
              <Alert severity="error">
                {claimFreezeMutation.error?.response?.data?.detail || "Cannot buy streak freeze."}
              </Alert>
            )}
          </Stack>
        </SbCard>
      )}

      {!!placementStatus && !placementStatus.has_completed_placement && (
        <Alert
          severity="info"
          action={
            <SbButton size="small" variant="outlined" onClick={() => navigate("/learning/placement")}>
              Start Placement
            </SbButton>
          }
        >
          Ban chua hoan thanh placement. Nen lam placement de he thong xep do kho phu hop.
        </Alert>
      )}

      {!!recoverData?.has_recoverable_session && !!recoverSession && (
        <Alert
          severity="warning"
          action={(
            <Stack direction="row" spacing={1}>
              <SbButton
                size="small"
                variant="outlined"
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate(recoverSession.id)}
              >
                Continue Session
              </SbButton>
              <SbButton
                size="small"
                variant="text"
                onClick={() => refetchRecover()}
              >
                Refresh
              </SbButton>
            </Stack>
          )}
        >
          Ban dang co phien hoc dang do: {recoverSession.lesson_title} (step {recoverData.next_step_index || 1}).
        </Alert>
      )}

      {!!startMutation.error && (
        <Alert severity="error">
          {startMutation.error?.response?.data?.detail || "Cannot start session."}
        </Alert>
      )}
      {!!checkpointStartMutation.error && (
        <Alert severity="error">
          {checkpointStartMutation.error?.response?.data?.detail || "Cannot start checkpoint."}
        </Alert>
      )}
      {!!resumeMutation.error && (
        <Alert severity="error">
          {resumeMutation.error?.response?.data?.detail || "Cannot resume session."}
        </Alert>
      )}

      {units.length === 0 && (
        <Alert severity="info">
          Chưa có learning path. Chạy lệnh seed: <strong>python manage.py seed_learning_path</strong>
        </Alert>
      )}

      {units.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          onStart={handleStartSession}
          onStartCheckpoint={handleStartCheckpoint}
          startingLessonId={startingLessonId}
          startingCheckpointUnitId={startingCheckpointUnitId}
          disabled={startMutation.isPending || checkpointStartMutation.isPending}
        />
      ))}
    </Stack>
  );
};

export default LearningPage;
