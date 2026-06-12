import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  CheckCircleRounded as CheckCircleRoundedIcon,
  EditNoteRounded as EditNoteRoundedIcon,
  FactCheckRounded as FactCheckRoundedIcon,
  HeadphonesRounded as HeadphonesRoundedIcon,
  InfoOutlined as InfoOutlinedIcon,
  LockRounded as LockRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  PlayArrowRounded as PlayArrowRoundedIcon,
  QuizRounded as QuizRoundedIcon,
  SchoolRounded as SchoolRoundedIcon,
  WorkspacePremiumRounded as WorkspacePremiumRoundedIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const LEARNING_UX_HINT_KEY = "learning_ux_hint_dismissed_v2";

const activityMeta = {
  vocab: { label: "Từ vựng", icon: MenuBookRoundedIcon, color: colors.greenAccent },
  grammar: { label: "Ngữ pháp", icon: SchoolRoundedIcon, color: "#2563eb" },
  listening: { label: "Nghe", icon: HeadphonesRoundedIcon, color: "#0f766e" },
  writing: { label: "Viết", icon: EditNoteRoundedIcon, color: "#b45309" },
  quiz: { label: "Quiz", icon: QuizRoundedIcon, color: "#7c3aed" },
  checkpoint: { label: "Checkpoint", icon: WorkspacePremiumRoundedIcon, color: "#dc2626" },
};

const statusText = {
  locked: "Khóa",
  available: "Sẵn sàng",
  started: "Đang học",
  completed: "Hoàn thành",
};

const getStatus = (activity) => activity?.status || activity?.progress?.status || (activity?.unlocked ? "available" : "locked");

const getActivityCount = (units = []) => units.reduce((sum, unit) => sum + (unit.activities?.length || 0), 0);

const getCompletedActivityCount = (units = []) => units.reduce(
  (sum, unit) => sum + (unit.activities || []).filter((activity) => getStatus(activity) === "completed").length,
  0,
);

const findNextActivity = (units = []) => {
  for (const unit of units) {
    if (!unit.unlocked) continue;
    const next = (unit.activities || []).find((activity) => activity.unlocked && getStatus(activity) !== "completed");
    if (next) return { activity: next, unit };
  }
  for (const unit of units) {
    if (!unit.unlocked) continue;
    const first = (unit.activities || []).find((activity) => activity.unlocked);
    if (first) return { activity: first, unit };
  }
  return null;
};

const ActivityCard = ({ activity, unit, onStart, startingActivityId }) => {
  const status = getStatus(activity);
  const meta = activityMeta[activity.activity_type] || activityMeta.vocab;
  const Icon = meta.icon;
  const isLocked = !activity.unlocked || status === "locked";
  const isCompleted = status === "completed";
  const isStarting = startingActivityId === activity.id;

  const buttonLabel = isLocked
    ? "Khóa"
    : isCompleted
      ? "Làm lại"
      : status === "started"
        ? "Tiếp tục"
        : "Bắt đầu";

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: "background.default",
        border: `1px solid ${isLocked ? "rgba(0,0,0,0.08)" : `${meta.color}33`}`,
        opacity: isLocked ? 0.58 : 1,
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "14px",
              bgcolor: `${meta.color}18`,
              color: meta.color,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontWeight: 800, color: "text.primary" }} noWrap>
                {activity.title}
              </Typography>
              <Chip label={meta.label} size="small" sx={{ height: 22, bgcolor: `${meta.color}16`, color: meta.color, fontWeight: 800 }} />
              {activity.is_required && <Chip label="Bắt buộc" size="small" sx={{ height: 22, fontWeight: 700 }} />}
            </Stack>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }} noWrap>
              {activity.description || "Hoạt động học tập"} · {activity.estimated_minutes || 5} phút · {statusText[status] || status}
            </Typography>
          </Box>
        </Stack>

        <SbButton
          size="small"
          variant={isLocked ? "outlined" : "primary"}
          startIcon={isLocked ? <LockRoundedIcon /> : isCompleted ? <CheckCircleRoundedIcon /> : <PlayArrowRoundedIcon />}
          loading={isStarting}
          disabled={isLocked}
          data-cy={`learning-activity-start-${activity.id}`}
          onClick={() => onStart(activity, unit)}
          sx={{ minWidth: 112 }}
        >
          {buttonLabel}
        </SbButton>
      </Stack>
    </Box>
  );
};

const UnitCard = ({ unit, onStartActivity, startingActivityId }) => {
  const activities = unit.activities || [];
  const completed = activities.filter((activity) => getStatus(activity) === "completed").length;
  const progress = activities.length ? Math.round((completed / activities.length) * 100) : 0;

  return (
    <SbCard
      sx={{
        border: `1px solid ${unit.unlocked ? `${colors.greenAccent}33` : "rgba(0,0,0,0.08)"}`,
        opacity: unit.unlocked ? 1 : 0.72,
      }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.08rem", color: colors.greenStarbucks }}>
              Unit {unit.order_index}: {unit.title}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.88rem", mt: 0.4 }}>
              {unit.description || "Hoàn thành từng hoạt động để mở khóa unit tiếp theo."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            {unit.placement_recommended && (
              <Chip label="Gợi ý" size="small" sx={{ bgcolor: `${colors.greenStarbucks}16`, color: colors.greenStarbucks, fontWeight: 800 }} />
            )}
            {unit.unlocked ? (
              <Chip label="Đã mở" size="small" sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 800 }} />
            ) : (
              <Chip icon={<LockRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Khóa" size="small" />
            )}
          </Stack>
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Tiến độ unit</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 800 }}>
              {completed}/{activities.length} hoạt động
            </Typography>
          </Stack>
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
        </Box>

        <Stack spacing={1}>
          {activities.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>Unit này chưa có activity.</Alert>
          ) : activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              unit={unit}
              onStart={onStartActivity}
              startingActivityId={startingActivityId}
            />
          ))}
        </Stack>
      </Stack>
    </SbCard>
  );
};

const LearningPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [notice, setNotice] = useState("");
  const [uxHintDismissed, setUxHintDismissed] = useState(() => localStorage.getItem(LEARNING_UX_HINT_KEY) === "1");

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["learning-path-v2"],
    queryFn: () => learningApi.getLearningPathV2().then((response) => response.data),
    staleTime: 30_000,
  });

  const { data: recoverData, refetch: refetchRecover } = useQuery({
    queryKey: ["learning-session-recover"],
    queryFn: () => learningApi.getRecoverableSession().then((response) => response.data),
    retry: false,
    staleTime: 20_000,
  });

  const { data: dailyGoalData, refetch: refetchDailyGoal } = useQuery({
    queryKey: ["daily-goal"],
    queryFn: () => learningApi.getDailyGoal().then((response) => response.data),
    staleTime: 30_000,
  });

  const { data: placementStatus } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((response) => response.data),
    staleTime: 30_000,
  });

  const levels = useMemo(() => data?.levels || [], [data]);
  const selectedLevel = useMemo(
    () => levels.find((level) => level.id === selectedLevelId) || levels[0] || null,
    [levels, selectedLevelId],
  );
  const selectedUnits = selectedLevel?.units || [];
  const totalActivities = getActivityCount(selectedUnits);
  const completedActivities = getCompletedActivityCount(selectedUnits);
  const levelProgress = totalActivities ? Math.round((completedActivities / totalActivities) * 100) : 0;

  useEffect(() => {
    if (!levels.length || selectedLevelId) return;
    const recommendedLevel = levels.find((level) => level.level === data?.recommended_level);
    setSelectedLevelId((recommendedLevel || levels[0]).id);
  }, [data?.recommended_level, levels, selectedLevelId]);

  const startActivityMutation = useMutation({
    mutationFn: ({ activity }) => learningApi.startActivity(activity.id).then((response) => response.data),
    onSuccess: (payload, variables) => {
      setNotice("");
      refetch();
      refetchRecover();
      qc.invalidateQueries({ queryKey: ["home-learning-path"] });
      qc.invalidateQueries({ queryKey: ["learning-path"] });

      if (payload.kind === "learning_session" && payload.id) {
        navigate(`/learning/session/${payload.id}`);
        return;
      }
      if (payload.kind === "listening_session" && payload.session?.id) {
        navigate(`/listening/session/${payload.session.id}`);
        return;
      }
      if (payload.kind === "checkpoint") {
        navigate(`/learning/checkpoint/${variables.activity.id}`, {
          state: {
            activity: variables.activity,
            unit: variables.unit,
            startedPayload: payload,
          },
        });
        return;
      }
      if (payload.kind === "quiz") {
        navigate(`/quiz?activity_id=${variables.activity.id}${payload.quiz_id ? `&quiz_id=${payload.quiz_id}` : ""}`, {
          state: {
            activityQuiz: {
              activity: variables.activity,
              unit: variables.unit,
              quiz_id: payload.quiz_id,
              startedPayload: payload,
            },
          },
        });
        return;
      }
      if (payload.kind === "writing_submission") {
        navigate(`/learning/writing/${variables.activity.id}`, {
          state: {
            activity: variables.activity,
            unit: variables.unit,
            startedPayload: payload,
          },
        });
        return;
      }
      setNotice("Activity đã được mở nhưng chưa có màn hình phù hợp.");
    },
    onError: (error) => {
      setNotice(error?.response?.data?.detail || "Không thể mở activity này. Vui lòng thử lại.");
    },
  });

  const claimDailyGoalMutation = useMutation({
    mutationFn: () => learningApi.claimDailyGoal().then((response) => response.data),
    onSuccess: () => {
      refetchDailyGoal();
      qc.invalidateQueries({ queryKey: ["profile-stats"] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (sessionId) => learningApi.resumeLearningSession(sessionId).then((response) => response.data),
    onSuccess: (session) => {
      navigate(`/learning/session/${session.id}`);
    },
  });

  const nextActivity = useMemo(() => findNextActivity(selectedUnits), [selectedUnits]);
  const startingActivityId = startActivityMutation.variables?.activity?.id || null;
  const recoverableSession = recoverData?.session;
  const dailyGoal = dailyGoalData?.goal;
  const canClaimGoal = dailyGoalData?.can_claim_reward;

  const handleDismissHint = () => {
    localStorage.setItem(LEARNING_UX_HINT_KEY, "1");
    setUxHintDismissed(true);
  };

  const handleQuickStart = () => {
    if (!nextActivity) {
      setNotice("Level này chưa có activity khả dụng.");
      return;
    }
    startActivityMutation.mutate(nextActivity);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: colors.greenAccent }} />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Không tải được lộ trình học. Vui lòng thử lại.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.7rem", md: "2.15rem" }, color: colors.greenStarbucks }}>
              Lộ trình học
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
              Chọn level A1/A2, học từng unit theo chuỗi từ vựng, nghe, ngữ pháp, viết và quiz.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <SbButton
              variant="outlined"
              startIcon={<FactCheckRoundedIcon />}
              onClick={() => navigate("/learning/placement")}
            >
              Placement test
            </SbButton>
            <SbButton
              variant="primary"
              startIcon={<PlayArrowRoundedIcon />}
              loading={startActivityMutation.isPending && startingActivityId === nextActivity?.activity?.id}
              onClick={handleQuickStart}
            >
              Bắt đầu tiếp
            </SbButton>
          </Stack>
        </Stack>

        {!uxHintDismissed && (
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            action={<SbButton size="small" variant="outlined" onClick={handleDismissHint}>Đã hiểu</SbButton>}
            sx={{ borderRadius: 3 }}
          >
            Lộ trình mới được chia theo level. Mỗi unit gồm nhiều activity riêng để tránh trộn phần học, nghe, viết và quiz vào cùng một màn hình.
          </Alert>
        )}

        {notice && <Alert severity="info" sx={{ borderRadius: 3 }} onClose={() => setNotice("")}>{notice}</Alert>}

        {placementStatus?.placement_completed && data?.recommended_level && (
          <Alert severity="success" sx={{ borderRadius: 3 }}>
            Placement gợi ý bạn bắt đầu ở level {data.recommended_level}.
          </Alert>
        )}

        {recoverableSession && (
          <Alert
            severity="warning"
            sx={{ borderRadius: 3 }}
            action={(
              <SbButton
                size="small"
                variant="outlined"
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate(recoverableSession.id)}
              >
                Tiếp tục
              </SbButton>
            )}
          >
            Bạn có phiên học chưa hoàn thành: {recoverableSession.lesson_title || `Session #${recoverableSession.id}`}.
          </Alert>
        )}

        {dailyGoal && (
          <SbCard sx={{ border: `1px solid ${colors.greenAccent}22` }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Chip label="Mục tiêu ngày" size="small" sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 800 }} />
                  <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                    {dailyGoal.progress_words}/{dailyGoal.target_words} từ · {dailyGoal.reward_xp} XP
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={dailyGoal.target_words ? Math.min(100, Math.round((dailyGoal.progress_words / dailyGoal.target_words) * 100)) : 0}
                  sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.1)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }}
                />
              </Box>
              <SbButton
                variant={canClaimGoal ? "primary" : "outlined"}
                disabled={!canClaimGoal}
                loading={claimDailyGoalMutation.isPending}
                onClick={() => claimDailyGoalMutation.mutate()}
              >
                {dailyGoal.reward_claimed ? "Đã nhận" : canClaimGoal ? "Nhận thưởng" : "Chưa đủ"}
              </SbButton>
            </Stack>
          </SbCard>
        )}

        <SbCard sx={{ bgcolor: colors.greenStarbucks, color: "white", border: "none" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "1.25rem" }}>
                {selectedLevel?.name || "Chưa có level"}
              </Typography>
              <Typography sx={{ opacity: 0.82, mt: 0.5 }}>
                {selectedLevel?.description || "Chọn một level để xem unit và activity."}
              </Typography>
            </Box>
            <Box sx={{ minWidth: { xs: "100%", md: 240 } }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: "0.85rem", opacity: 0.8 }}>Tiến độ level</Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800 }}>{completedActivities}/{totalActivities}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={levelProgress}
                sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.22)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }}
              />
            </Box>
          </Stack>
        </SbCard>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {levels.map((level) => {
            const isSelected = selectedLevel?.id === level.id;
            const total = getActivityCount(level.units || []);
            const done = getCompletedActivityCount(level.units || []);
            return (
              <Tooltip title={`${done}/${total} activity`} key={level.id} arrow>
                <Chip
                  clickable
                  label={`${level.level || "Level"} · ${level.name}`}
                  onClick={() => setSelectedLevelId(level.id)}
                  sx={{
                    height: 36,
                    px: 0.5,
                    fontWeight: 800,
                    bgcolor: isSelected ? colors.greenAccent : "background.paper",
                    color: isSelected ? "white" : colors.greenStarbucks,
                    border: `1px solid ${isSelected ? colors.greenAccent : `${colors.greenAccent}33`}`,
                    "&:hover": { bgcolor: isSelected ? colors.greenAccent : `${colors.greenAccent}12` },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>

        {selectedUnits.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>Level này chưa có unit.</Alert>
        ) : (
          <Stack spacing={2}>
            {selectedUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onStartActivity={(activity, itemUnit) => startActivityMutation.mutate({ activity, unit: itemUnit })}
                startingActivityId={startingActivityId}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default LearningPage;
