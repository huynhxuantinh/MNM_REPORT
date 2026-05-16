import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { LockRounded as LockRoundedIcon } from "@mui/icons-material";
import { PlayArrowRounded as PlayArrowRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { FactCheckRounded as FactCheckRoundedIcon } from "@mui/icons-material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
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
  const [quickStudyLoading, setQuickStudyLoading] = useState(false);
  const [quickStudyError, setQuickStudyError] = useState("");

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
    mutationFn: (lessonId) => learningApi.startLearningSession(lessonId, "learning_path").then((response) => response.data),
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
    mutationFn: (sessionId) => learningApi.resumeLearningSession(sessionId, "learning_page").then((response) => response.data),
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
  const studiedMinutes = dailyGoalData?.today?.studied_minutes ?? 0;
  const goalMinutes = dailyGoalData?.today?.goal_minutes ?? dailyGoalData?.target_minutes ?? 10;
  const progressPercent = Math.min(100, Math.round((studiedMinutes / Math.max(1, goalMinutes)) * 100));
  const overMinutes = Math.max(0, studiedMinutes - goalMinutes);
  const isGoalAchieved = !!dailyGoalData?.today?.is_achieved || studiedMinutes >= goalMinutes;
  const isGoalClaimed = !!dailyGoalData?.today?.claimed_at;

  const handleStartSession = (lessonId) => {
    if (!lessonId) return;
    startMutation.mutate(lessonId);
  };
  const handleStartCheckpoint = (unitId) => {
    if (!unitId) return;
    checkpointStartMutation.mutate(unitId);
  };
  const recoverSession = recoverData?.session;
  const getNextLessonId = () => {
    const unlockedUnits = [...units]
      .filter((unit) => !!unit?.unlocked)
      .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
    for (const unit of unlockedUnits) {
      const lessonLinks = [...(unit?.lessons || [])]
        .filter((item) => !!item?.lesson?.id)
        .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0));
      if (!lessonLinks.length) continue;
      const completed = Math.max(0, unit?.progress?.completed_lessons ?? 0);
      const nextLink = lessonLinks[Math.min(completed, lessonLinks.length - 1)];
      if (nextLink?.lesson?.id) return nextLink.lesson.id;
    }
    return null;
  };

  const handleQuickStudy = async () => {
    if (quickStudyLoading || resumeMutation.isPending || startMutation.isPending) return;
    setQuickStudyError("");
    if (recoverData?.has_recoverable_session && recoverSession?.id) {
      resumeMutation.mutate(recoverSession.id);
      return;
    }

    setQuickStudyLoading(true);
    try {
      const reviewData = await learningApi.getReviewList().then((response) => response.data);
      const dueCount = (reviewData?.words || []).length;
      if (dueCount > 0) {
        navigate("/review");
        return;
      }
      const lessonId = getNextLessonId();
      if (!lessonId) {
        setQuickStudyError("Hiện chưa có bài học phù hợp để bắt đầu.");
        return;
      }
      startMutation.mutate(lessonId);
    } catch (err) {
      setQuickStudyError(err?.response?.data?.detail || "Không thể bắt đầu học nhanh.");
    } finally {
      setQuickStudyLoading(false);
    }
  };

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
          Lộ trình học
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
          {data?.name || "Khóa học"} · {units.length} unit
        </Typography>
      </Box>

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
                Tiếp tục phiên học
              </SbButton>
              <SbButton
                size="small"
                variant="text"
                onClick={() => refetchRecover()}
              >
                Làm mới
              </SbButton>
            </Stack>
          )}
        >
          Bạn đang có phiên học chưa xong: {recoverSession.lesson_title} (bước {recoverData.next_step_index || 1}).
        </Alert>
      )}

      {!!placementStatus && !placementStatus.has_completed_placement && (
        <Alert
          severity="info"
          action={
            <SbButton size="small" variant="outlined" onClick={() => navigate("/learning/placement")}>
              Bắt đầu Placement
            </SbButton>
          }
        >
          Bạn chưa hoàn thành placement. Làm placement trước để hệ thống đề xuất độ khó phù hợp.
        </Alert>
      )}

      {!!dailyGoalData && (
        <SbCard>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
              Mục tiêu ngày
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
              }}
            />
            <Typography sx={{ fontSize: "0.9rem" }}>
              {studiedMinutes}/{goalMinutes} phút
              {overMinutes > 0 ? ` (vượt +${overMinutes})` : ""}
            </Typography>
            {isGoalAchieved && (
              <Typography sx={{ fontSize: "0.82rem", color: colors.greenAccent, fontWeight: 700 }}>
                Đã hoàn thành mục tiêu hôm nay
              </Typography>
            )}
            <Typography sx={{ fontSize: "0.9rem" }}>
              Hearts: {dailyGoalData.hearts?.current ?? 0}/{dailyGoalData.hearts?.max ?? 10}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography sx={{ fontSize: "0.9rem" }}>
                Streak Freeze: {dailyGoalData.streak?.freeze_count ?? 0}
              </Typography>
              <Tooltip
                arrow
                title="Nếu bạn nghỉ 1 ngày, hệ thống sẽ tự dùng 1 freeze để giữ streak không bị reset."
              >
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
              </Tooltip>
            </Stack>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              Dùng để bảo vệ streak khi lỡ nghỉ học 1 ngày.
            </Typography>
            <SbButton
              size="small"
              variant="primary"
              loading={quickStudyLoading || resumeMutation.isPending}
              onClick={handleQuickStudy}
            >
              Học tiếp 5 phút
            </SbButton>
            <SbButton
              size="small"
              variant="outlined"
              disabled={!isGoalAchieved || isGoalClaimed}
              loading={claimDailyGoalMutation.isPending}
              onClick={() => claimDailyGoalMutation.mutate()}
            >
              {isGoalClaimed ? "Đã nhận thưởng" : `Nhận +${dailyGoalData.reward_xp ?? 0} XP`}
            </SbButton>
            {isGoalClaimed && (
              <Alert severity="success" sx={{ py: 0 }}>
                Bạn đã nhận thưởng daily goal hôm nay.
              </Alert>
            )}
            <SbButton
              size="small"
              variant="outlined"
              loading={claimFreezeMutation.isPending}
              onClick={() => claimFreezeMutation.mutate()}
            >
              Mua Freeze (-50 XP)
            </SbButton>
            {!!claimDailyGoalMutation.error && (
              <Alert severity="error">
                {claimDailyGoalMutation.error?.response?.data?.detail || "Không thể nhận thưởng daily goal."}
              </Alert>
            )}
            {!!claimFreezeMutation.error && (
              <Alert severity="error">
                {claimFreezeMutation.error?.response?.data?.detail || "Không thể mua streak freeze."}
              </Alert>
            )}
          </Stack>
        </SbCard>
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
      {!!quickStudyError && (
        <Alert severity="error">{quickStudyError}</Alert>
      )}

      {units.length === 0 && (
        <Alert severity="info">
          ChÆ°a cĂ³ learning path. Cháº¡y lá»‡nh seed: <strong>python manage.py seed_learning_path</strong>
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








