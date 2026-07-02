import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/system";
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
  LocalCafeRounded as CafeIcon,
  StarRounded as StarIcon,
  EmojiEventsRounded as TrophyIcon,
  TrendingUpRounded as TrendIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import { SbButton, SbCard } from "@/components/ui";
import { colors } from "@/styles/theme";

const LEARNING_UX_HINT_KEY = "learning_ux_hint_dismissed_v2";

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 117, 74, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 117, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 117, 74, 0); }
`;

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

const getLevelTitle = (level) => {
  const code = level?.level || "";
  const name = level?.name || "";
  if (!name) return code || "Level";
  if (code && name.toLowerCase().startsWith(code.toLowerCase())) {
    return name.slice(code.length).replace(/^[\s·.-]+/, "").trim() || name;
  }
  return name;
};

const ActivityCard = ({ activity, unit, onStart, startingActivityId, isLast }) => {
  const theme = useTheme();
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
    <Box sx={{ display: "flex", position: "relative" }}>
      {/* Timeline track */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: 2, minWidth: 46 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            bgcolor: isCompleted ? meta.color : (isLocked ? (theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)") : `${meta.color}15`),
            color: isCompleted ? "white" : (isLocked ? "text.disabled" : meta.color),
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            boxShadow: !isLocked ? `0 4px 12px ${meta.color}30` : "none",
            zIndex: 2,
            border: `2px solid ${isCompleted ? meta.color : (isLocked ? "transparent" : meta.color)}`,
          }}
        >
          <Icon fontSize="medium" />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: isCompleted ? meta.color : (theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
              my: 0.5,
              minHeight: 24,
            }}
          />
        )}
      </Box>

      {/* Content Card */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          mb: isLast ? 0 : 2,
          borderRadius: 1,
          bgcolor: theme.palette.background.default,
          border: `1px solid ${isLocked ? theme.palette.divider : `${meta.color}25`}`,
          opacity: isLocked ? 0.6 : 1,
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          "&:hover": !isLocked ? {
            transform: "translateY(-2px)",
            boxShadow: theme.palette.mode === "dark" 
              ? "0 8px 20px rgba(0, 0, 0, 0.4)" 
              : "0 8px 20px rgba(0, 98, 65, 0.05)",
            borderColor: meta.color,
          } : {},
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }} noWrap>
                {activity.title}
              </Typography>
              <Chip 
                label={meta.label} 
                size="small" 
                sx={{ 
                  height: 20, 
                  bgcolor: `${meta.color}12`, 
                  color: meta.color, 
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  border: `1px solid ${meta.color}20`
                }} 
              />
              {activity.is_required && (
                <Chip 
                  label="Bắt buộc" 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontWeight: 700, 
                    fontSize: "0.7rem",
                    bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                  }} 
                />
              )}
            </Stack>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }} noWrap>
              {activity.description || "Hoạt động học tập"} · {activity.estimated_minutes || 5} phút · {statusText[status] || status}
            </Typography>
          </Box>

          <SbButton
            size="small"
            variant={isLocked ? "outlined" : isCompleted ? "outlined" : "primary"}
            startIcon={isLocked ? <LockRoundedIcon /> : isCompleted ? <CheckCircleRoundedIcon /> : <PlayArrowRoundedIcon />}
            loading={isStarting}
            disabled={isLocked}
            data-cy={`learning-activity-start-${activity.id}`}
            onClick={() => onStart(activity, unit)}
            sx={{ 
              minWidth: 112,
              alignSelf: { xs: "stretch", sm: "auto" },
              borderRadius: "50px",
              height: 36,
              boxShadow: !isLocked && !isCompleted ? `0 4px 12px ${meta.color}30` : "none",
            }}
          >
            {buttonLabel}
          </SbButton>
        </Stack>
      </Box>
    </Box>
  );
};

const UnitCard = ({ unit, onStartActivity, startingActivityId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const activities = unit.activities || [];
  const completed = activities.filter((activity) => getStatus(activity) === "completed").length;
  const progress = activities.length ? Math.round((completed / activities.length) * 100) : 0;

  return (
    <SbCard
      sx={{
        borderRadius: 1,
        p: 3,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${unit.unlocked ? (isDark ? "rgba(0, 117, 74, 0.25)" : `${colors.greenAccent}20`) : theme.palette.divider}`,
        boxShadow: isDark 
          ? "0 4px 20px rgba(0,0,0,0.25)" 
          : "0 10px 30px rgba(0, 98, 65, 0.03)",
        opacity: unit.unlocked ? 1 : 0.75,
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "hidden",
        "&::before": unit.unlocked ? {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          bgcolor: colors.greenStarbucks,
        } : {},
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 900, 
                color: unit.unlocked ? (isDark ? theme.palette.primary.light : colors.greenStarbucks) : "text.secondary",
                fontSize: "1.15rem",
                mb: 0.5
              }}
            >
              Unit {unit.order_index}: {unit.title}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.5 }}>
              {unit.description || "Hoàn thành từng hoạt động để mở khóa unit tiếp theo."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0}>
            {unit.placement_recommended && (
              <Chip 
                label="Gợi ý" 
                size="small" 
                sx={{ 
                  bgcolor: isDark ? "rgba(203, 162, 88, 0.15)" : `${colors.gold}18`, 
                  color: isDark ? "#dfc49d" : colors.gold, 
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  border: `1px solid ${isDark ? "rgba(203, 162, 88, 0.3)" : `${colors.gold}30`}`
                }} 
              />
            )}
            {unit.unlocked ? (
              <Chip 
                label="Đã mở" 
                size="small" 
                sx={{ 
                  bgcolor: `${colors.greenAccent}12`, 
                  color: colors.greenAccent, 
                  fontWeight: 800,
                  fontSize: "0.7rem"
                }} 
              />
            ) : (
              <Chip 
                icon={<LockRoundedIcon sx={{ fontSize: "12px !important" }} />} 
                label="Khóa" 
                size="small" 
                sx={{ fontSize: "0.7rem", fontWeight: 700 }}
              />
            )}
          </Stack>
        </Stack>

        <Box sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", p: 2, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 700 }}>Tiến độ bài học</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: unit.unlocked ? "primary.main" : "text.secondary", fontWeight: 800 }}>
              {completed}/{activities.length} hoạt động ({progress}%)
            </Typography>
          </Stack>
          <Box sx={{ position: "relative", height: 6, borderRadius: 3, bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
             <Box sx={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progress}%`, bgcolor: colors.greenAccent, transition: "width 0.3s" }} />
          </Box>
        </Box>

        <Stack spacing={0} sx={{ mt: 2 }}>
          {activities.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>Unit này chưa có hoạt động nào.</Alert>
          ) : activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              unit={unit}
              onStart={onStartActivity}
              startingActivityId={startingActivityId}
              isLast={index === activities.length - 1}
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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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
  const selectedLevelTitle = getLevelTitle(selectedLevel);

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
        navigate(`/learning/quiz/${variables.activity.id}`, {
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
    onSuccess: (payload) => {
      navigate(`/learning/session/${payload.session?.id}`);
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
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Không tải được lộ trình học. Vui lòng tải lại trang hoặc thử lại sau.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Stack spacing={4}>
        {/* ROW 1: HEADER & WIDGETS */}
        <Grid container spacing={4}>
          {/* Header & Selector */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3.5}>
              <Box>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontWeight: 900, 
                    color: isDark ? "white" : colors.greenStarbucks,
                    fontSize: { xs: "1.8rem", md: "2.5rem" },
                    letterSpacing: "-0.03em",
                    mb: 1
                  }}
                >
                  Lộ trình học tập
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.95rem", maxWidth: 640 }}>
                  Học một cách bài bản qua các trình độ. Rèn luyện toàn diện từ vựng, ngữ pháp, nghe và viết thông qua các hoạt động tương tác.
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 850, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                  Chọn trình độ học
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
                  {levels.map((level) => {
                    const isSelected = selectedLevel?.id === level.id;
                    const total = getActivityCount(level.units || []);
                    const done = getCompletedActivityCount(level.units || []);
                    const pct = total ? Math.round((done / total) * 100) : 0;

                    return (
                      <Box
                        key={level.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLevelId(level.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedLevelId(level.id);
                          }
                        }}
                        sx={{
                          cursor: "pointer",
                          borderRadius: "50px",
                          py: 1,
                          px: 2.5,
                          bgcolor: isSelected 
                            ? colors.greenAccent 
                            : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0, 98, 65, 0.05)"),
                          color: isSelected ? "white" : (isDark ? "rgba(255,255,255,0.8)" : colors.greenStarbucks),
                          border: `1px solid ${isSelected ? colors.greenAccent : (isDark ? "rgba(255,255,255,0.08)" : `${colors.greenAccent}18`)}`,
                          boxShadow: isSelected 
                            ? `0 6px 16px ${colors.greenAccent}30` 
                            : "none",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          whiteSpace: "nowrap",
                          outline: "none",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            bgcolor: isSelected 
                              ? colors.greenAccent 
                              : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0, 98, 65, 0.08)"),
                            borderColor: colors.greenAccent,
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${colors.gold}`,
                          }
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>
                          {level.level}
                        </Typography>
                        <Box 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: "50%", 
                            bgcolor: isSelected ? "rgba(255,255,255,0.2)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color: isSelected ? "white" : "text.secondary"
                          }}
                        >
                          {pct}%
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </Grid>
          
          {/* Right Column: Widgets */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Placement & Quick start card */}
              <SbCard sx={{ p: 3, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : `${colors.greenAccent}15`}` }}>
                <Typography sx={{ fontWeight: 850, fontSize: "1rem", mb: 2, color: isDark ? "white" : colors.greenStarbucks }}>
                  Học tập nhanh
                </Typography>
                <Stack spacing={1.5}>
                  <SbButton
                    variant="primary"
                    fullWidth
                    startIcon={<PlayArrowRoundedIcon />}
                    loading={startActivityMutation.isPending && startingActivityId === nextActivity?.activity?.id}
                    onClick={handleQuickStart}
                    sx={{ 
                      height: 46, 
                      borderRadius: "50px", 
                      fontSize: "0.9rem",
                      animation: `${pulseAnimation} 2s infinite`,
                    }}
                  >
                    Tiếp tục học
                  </SbButton>
                  <SbButton
                    variant="outlined"
                    fullWidth
                    startIcon={<FactCheckRoundedIcon />}
                    onClick={() => navigate("/learning/placement")}
                    sx={{ height: 46, borderRadius: "50px", fontSize: "0.9rem" }}
                  >
                    Placement Test
                  </SbButton>
                </Stack>
              </SbCard>

              {/* Recovery alert */}
              {recoverableSession && (
                <Alert
                  severity="warning"
                  icon={<TrophyIcon sx={{ color: "#d97706" }} />}
                  sx={{ 
                    borderRadius: 4, 
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                    bgcolor: isDark ? "rgba(217, 119, 6, 0.05)" : "rgba(217, 119, 6, 0.02)",
                    "& .MuiAlert-message": { width: "100%" }
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#d97706", mb: 0.5 }}>
                    Phiên học đang dang dở
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
                    {recoverableSession.lesson_title || `Session #${recoverableSession.id}`}
                  </Typography>
                  <SbButton
                    size="small"
                    variant="primary"
                    loading={resumeMutation.isPending}
                    onClick={() => resumeMutation.mutate(recoverableSession.id)}
                    sx={{ 
                      bgcolor: "#d97706", 
                      "&:hover": { bgcolor: "#b45309" }, 
                      borderRadius: "50px",
                      height: 30,
                      fontSize: "0.75rem"
                    }}
                  >
                    Học tiếp ngay
                  </SbButton>
                </Alert>
              )}

              {/* Daily Goal Card (Starbucks Rewards style) */}
              {dailyGoal && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 5,
                    bgcolor: isDark ? colors.greenHouse : "#1E3932",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "-20%",
                      right: "-10%",
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(203,162,88,0.15) 0%, rgba(0,0,0,0) 70%)",
                      pointerEvents: "none",
                    }
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                          <CafeIcon sx={{ fontSize: 18, color: colors.gold }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                          Mục tiêu hàng ngày
                        </Typography>
                      </Stack>
                      <Chip 
                        icon={<StarIcon sx={{ color: `${colors.gold} !important`, fontSize: "14px" }} />}
                        label={`+${dailyGoal.reward_xp} XP`} 
                        size="small"
                        sx={{ 
                          bgcolor: "rgba(203, 162, 88, 0.18)", 
                          color: colors.goldLight, 
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          border: "1px solid rgba(203, 162, 88, 0.3)"
                        }} 
                      />
                    </Stack>

                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: "0.8rem", color: colors.textWhiteSoft, fontWeight: 700 }}>
                          Tiến trình học từ
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 850, color: colors.goldLight }}>
                          {dailyGoal.progress_words}/{dailyGoal.target_words} từ
                        </Typography>
                      </Stack>
                      <Box sx={{ position: "relative", height: 7, borderRadius: 4, bgcolor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${dailyGoal.target_words ? Math.min(100, Math.round((dailyGoal.progress_words / dailyGoal.target_words) * 100)) : 0}%`, bgcolor: colors.gold, transition: "width 0.3s" }} />
                      </Box>
                    </Box>

                    <SbButton
                      variant={canClaimGoal ? "primary" : "outlined"}
                      disabled={!canClaimGoal}
                      fullWidth
                      loading={claimDailyGoalMutation.isPending}
                      onClick={() => claimDailyGoalMutation.mutate()}
                      sx={{
                        mt: 1,
                        height: 38,
                        borderRadius: "50px",
                        bgcolor: dailyGoal.reward_claimed 
                          ? "rgba(255,255,255,0.08)" 
                          : (canClaimGoal ? colors.gold : "transparent"),
                        color: dailyGoal.reward_claimed 
                          ? "rgba(255,255,255,0.4)" 
                          : (canClaimGoal ? "black" : colors.gold),
                        borderColor: dailyGoal.reward_claimed 
                          ? "transparent" 
                          : (canClaimGoal ? colors.gold : "rgba(203, 162, 88, 0.5)"),
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        "&:hover": {
                          bgcolor: dailyGoal.reward_claimed 
                            ? "rgba(255,255,255,0.08)" 
                            : (canClaimGoal ? "#bfa050" : "rgba(203, 162, 88, 0.1)"),
                          borderColor: canClaimGoal ? "#bfa050" : colors.gold,
                        }
                      }}
                    >
                      {dailyGoal.reward_claimed ? "Đã nhận phần thưởng" : canClaimGoal ? "Nhận phần thưởng" : "Chưa đạt mục tiêu"}
                    </SbButton>
                  </Stack>
                </Box>
              )}

              {/* Dynamic Alerts / Tips */}
              {!uxHintDismissed && (
                <Alert
                  severity="info"
                  icon={<InfoOutlinedIcon />}
                  onClose={handleDismissHint}
                  sx={{ 
                    borderRadius: 4,
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0, 0, 0, 0.05)",
                    bgcolor: theme.palette.background.paper,
                    color: "text.primary"
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 0.5 }}>
                    Mách nhỏ cho bạn
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5 }}>
                    Mỗi Unit được chia thành các hoạt động riêng biệt giúp bạn tập trung học sâu hơn và ghi nhớ tốt hơn.
                  </Typography>
                </Alert>
              )}

              {placementStatus?.placement_completed && data?.recommended_level && (
                <Alert 
                  severity="success" 
                  icon={<TrendIcon />}
                  sx={{ borderRadius: 4 }}
                >
                  Placement gợi ý bạn bắt đầu ở level <strong>{data.recommended_level}</strong>.
                </Alert>
              )}

              {notice && (
                <Alert 
                  severity="info" 
                  sx={{ borderRadius: 4 }} 
                  onClose={() => setNotice("")}
                >
                  {notice}
                </Alert>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* ROW 2: MAIN BANNER */}
        <Box>
          <SbCard
            sx={{
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : `${colors.greenAccent}15`}`,
              bgcolor: theme.palette.background.paper,
              p: { xs: 2.5, md: 3.5 },
              boxShadow: isDark 
                ? "0 8px 32px rgba(0,0,0,0.3)" 
                : "0 12px 30px rgba(0, 70, 46, 0.04)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: "0 0 auto 0",
                height: 4,
                background: `linear-gradient(90deg, ${colors.greenStarbucks}, ${colors.greenAccent}, ${colors.gold})`,
              },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <Chip
                    label={`${selectedUnits.length} Units`}
                    size="small"
                    sx={{ 
                      bgcolor: isDark ? "rgba(0, 117, 74, 0.15)" : `${colors.greenAccent}12`, 
                      color: isDark ? theme.palette.primary.light : colors.greenStarbucks, 
                      fontWeight: 900,
                      fontSize: "0.75rem"
                    }}
                  />
                  <Chip
                    label={`${totalActivities} Activities`}
                    size="small"
                    sx={{ 
                      bgcolor: isDark ? "rgba(203, 162, 88, 0.15)" : `${colors.gold}15`, 
                      color: isDark ? "#dfc49d" : colors.gold, 
                      fontWeight: 800,
                      fontSize: "0.75rem"
                    }}
                  />
                </Stack>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 900, 
                    color: isDark ? "white" : colors.greenStarbucks, 
                    fontSize: { xs: "1.4rem", md: "1.75rem" },
                    letterSpacing: "-0.02em" 
                  }}
                >
                  {selectedLevelTitle}
                </Typography>
                <Typography sx={{ color: "text.secondary", mt: 1, fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {selectedLevel?.description || "Chọn một trình độ để xem lộ trình học chi tiết."}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: { xs: "100%", md: 240 },
                  p: 2.5,
                  borderRadius: 4,
                  bgcolor: isDark ? "rgba(0, 98, 65, 0.1)" : `${colors.greenStarbucks}05`,
                  border: `1px solid ${isDark ? "rgba(0, 117, 74, 0.2)" : `${colors.greenAccent}12`}`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 800, mb: 0.5 }}>Tiến trình chung</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 700 }}>
                    Đã học {completedActivities}/{totalActivities}
                  </Typography>
                </Box>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={60}
                    thickness={5}
                    sx={{ color: isDark ? "rgba(255,255,255,0.06)" : `${colors.greenStarbucks}12` }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={levelProgress}
                    size={60}
                    thickness={5}
                    sx={{
                      color: colors.greenAccent,
                      position: "absolute",
                      left: 0,
                      strokeLinecap: "round",
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.primary" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                      {levelProgress}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </SbCard>
        </Box>

        {/* ROW 3: UNITS LIST */}
        <Box>
          {selectedUnits.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>Trình độ này đang được cập nhật nội dung bài học.</Alert>
          ) : (
            <Stack spacing={4}>
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
        </Box>

      </Stack>
    </Box>
  );
};

export default LearningPage;
