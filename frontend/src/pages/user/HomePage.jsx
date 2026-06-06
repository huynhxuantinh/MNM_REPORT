import { lazy, Suspense, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  LinearProgress,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { BoltRounded as BoltRoundedIcon } from "@mui/icons-material";
import { LocalFireDepartmentRounded as LocalFireDepartmentRoundedIcon } from "@mui/icons-material";
import { MenuBookRounded as MenuBookRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { ArrowForwardRounded as ArrowForwardRoundedIcon } from "@mui/icons-material";
import { PlayArrowRounded as PlayArrowRoundedIcon } from "@mui/icons-material";
import { RepeatRounded as RepeatRoundedIcon } from "@mui/icons-material";
import { EmojiEventsRounded as EmojiEventsRoundedIcon } from "@mui/icons-material";
import { SbCard, SbButton, SbBadge } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";

const ReviewActivityChart = lazy(() => import("@/components/dashboard/ReviewActivityChart"));

const getLevelThreshold = (n) => (100 * n * (n + 1)) / 2;

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const ReviewBanner = ({ summary, loading, onStart, onLearn }) => {
  const dueToday = summary?.due_today ?? 0;
  const reviewedToday = summary?.reviewed_today ?? 0;
  const total = dueToday + reviewedToday;
  const pct = total > 0 ? Math.round((reviewedToday / total) * 100) : (reviewedToday > 0 ? 100 : 0);
  const allDone = !loading && dueToday === 0;

  if (loading) {
    return (
      <Box sx={{ borderRadius: "20px", overflow: "hidden" }}>
        <Skeleton variant="rectangular" height={120} />
      </Box>
    );
  }

  if (allDone) {
    const isCompletedToday = reviewedToday > 0;
    return (
      <Box
        sx={{
          borderRadius: "20px",
          background: `linear-gradient(135deg, ${colors.greenStarbucks} 0%, ${colors.greenAccent} 100%)`,
          p: { xs: 2.5, md: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          boxShadow: `0 8px 32px ${colors.greenStarbucks}40`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <EmojiEventsRoundedIcon sx={{ color: colors.gold, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", lineHeight: 1.2 }}>
              {isCompletedToday ? "Tuyệt vời! Bạn đã ôn xong hôm nay" : "Hôm nay chưa có từ cần ôn"}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", mt: 0.25 }}>
              {isCompletedToday
                ? `${reviewedToday} từ đã ôn. Quay lại ngày mai nhé.`
                : "Hãy học bài mới để tạo tiến độ cho ngày mai."}
            </Typography>
          </Box>
        </Box>
        <SbButton
          variant="outlined"
          size="small"
          onClick={onLearn ?? onStart}
          sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.1)" }, whiteSpace: "nowrap" }}
        >
          Học bài mới
        </SbButton>
      </Box>
    );
  }

  const urgencyBg = dueToday > 20
    ? "linear-gradient(135deg, #b71c1c 0%, #e53935 100%)"
    : dueToday > 5
      ? `linear-gradient(135deg, #e65100 0%, ${colors.gold} 100%)`
      : `linear-gradient(135deg, ${colors.greenStarbucks} 0%, ${colors.greenAccent} 100%)`;

  return (
    <Box
      sx={{
        borderRadius: "20px",
        background: urgencyBg,
        p: { xs: 2.5, md: 3 },
        boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <RepeatRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "2rem", color: "#fff", lineHeight: 1 }}>
                {dueToday}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.85)" }}>
                từ cần ôn hôm nay
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", mt: 0.25 }}>
              {reviewedToday > 0 ? `Đã ôn ${reviewedToday}. Còn ${dueToday} từ nữa.` : "Bắt đầu buổi ôn tập nhé."}
            </Typography>
          </Box>
        </Box>

        <SbButton
          variant="primary"
          size="medium"
          startIcon={<PlayArrowRoundedIcon />}
          onClick={onStart}
          sx={{
            bgcolor: "background.paper",
            color: colors.greenStarbucks,
            fontWeight: 800,
            px: 3,
            "&:hover": { bgcolor: "rgba(255,255,255,0.9)", transform: "scale(1.03)" },
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
        >
          Ôn ngay
        </SbButton>
      </Box>

      {total > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>
              Tiến độ hôm nay
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
              {reviewedToday}/{total} ({pct}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": { bgcolor: "background.paper", borderRadius: 4 },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const StatCard = ({ icon, value, label, color, sub, loading }) => (
  <SbCard sx={{ height: "100%" }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
        {sub && <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>{sub}</Typography>}
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
      )}
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{label}</Typography>
    </Box>
  </SbCard>
);

const XpCard = ({ user, loading }) => {
  const level = Math.max(1, user?.level ?? 1);
  const xp = user?.xp ?? 0;
  const prev = getLevelThreshold(level - 1);
  const next = getLevelThreshold(level);
  const pct = next > prev ? Math.round(((xp - prev) / (next - prev)) * 100) : 100;

  return (
    <SbCard sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BoltRoundedIcon sx={{ color: colors.greenAccent, fontSize: 24 }} />
          <Chip label={`Level ${level}`} size="small" sx={{ bgcolor: colors.greenAccent, color: "#fff", fontWeight: 700, fontSize: "0.72rem" }} />
        </Box>
        {loading ? (
          <Skeleton variant="text" width="70%" height={40} />
        ) : (
          <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: colors.greenAccent, lineHeight: 1 }}>
            {xp.toLocaleString()} XP
          </Typography>
        )}
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          Còn {Math.max(0, next - xp)} XP lên Level {level + 1}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,117,74,0.12)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }}
        />
      </Box>
    </SbCard>
  );
};

const LessonCard = ({ lesson, onStartSession, isStarting }) => {
  const isCompleted = !!lesson.user_progress?.completed_at;
  const isStarted = !!lesson.user_progress?.started_at;
  const canStart = lesson.can_start !== false;

  return (
    <SbCard
      sx={{
        transition: "box-shadow 0.2s",
        opacity: canStart ? 1 : 0.8,
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 0.75, mb: 0.5, flexWrap: "wrap" }}>
              {lesson.level && (
                <Chip
                  label={lesson.level}
                  size="small"
                  sx={{ bgcolor: colors.greenLight, color: colors.greenHouse, fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
              )}
              {isCompleted && (
                <Chip
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: "12px !important" }} />}
                  label="Hoàn thành"
                  size="small"
                  sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
              )}
              {!canStart && (
                <Chip
                  label="Đang khóa"
                  size="small"
                  sx={{ bgcolor: "rgba(0,0,0,0.08)", color: "text.secondary", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
              )}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "text.primary", lineHeight: 1.3 }}>
              {lesson.title}
            </Typography>
          </Box>
          <MenuBookRoundedIcon sx={{ color: colors.greenLight, fontSize: 22, flexShrink: 0, mt: 0.25 }} />
        </Box>

        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{lesson.word_count} từ</Typography>

        <SbButton
          variant={isCompleted ? "outlined" : "primary"}
          size="small"
          fullWidth
          disabled={!canStart}
          loading={isStarting}
          onClick={() => onStartSession?.(lesson.id)}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ mt: 0.5 }}
        >
          {!canStart ? "Mở khóa ở Lộ trình học" : isCompleted ? "Học lại" : isStarted ? "Tiếp tục" : "Học ngay"}
        </SbButton>
      </Box>
    </SbCard>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const { data: placementStatus, isLoading: placementLoading } = useQuery({
    queryKey: ["placement-status"],
    queryFn: () => learningApi.getPlacementStatus().then((r) => r.data),
    staleTime: 0,
    enabled: user?.role === "user",
  });

  useEffect(() => {
    if (!placementLoading && placementStatus && placementStatus.should_show_onboarding) {
      navigate("/learning/onboarding", { replace: true });
    }
  }, [placementLoading, placementStatus, navigate]);

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["review-summary"],
    queryFn: () => learningApi.getReviewSummary().then((r) => r.data),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ["review-history"],
    queryFn: () => learningApi.getReviewHistory(30).then((r) => r.data),
    staleTime: 300_000,
  });

  const { data: lessonsData, isLoading: lessLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => learningApi.getLessons({ page_size: 6 }).then((r) => r.data),
    staleTime: 120_000,
  });
  const { data: learningPathData } = useQuery({
    queryKey: ["home-learning-path"],
    queryFn: () => learningApi.getLearningPath().then((r) => r.data),
    staleTime: 60_000,
  });
  const { data: recoverData, refetch: refetchRecover } = useQuery({
    queryKey: ["home-recover-session"],
    queryFn: () => learningApi.getRecoverableSession().then((r) => r.data),
    staleTime: 30_000,
  });
  const resumeMutation = useMutation({
    mutationFn: (sessionId) => learningApi.resumeLearningSession(sessionId, "home_page").then((r) => r.data),
    onSuccess: (payload) => navigate(`/learning/session/${payload.session?.id}`),
  });
  const { data: dailyGoalData, isLoading: goalLoading } = useQuery({
    queryKey: ["home-daily-goal"],
    queryFn: () => learningApi.getDailyGoal().then((r) => r.data),
    staleTime: 60_000,
  });

  const dueToday = summary?.due_today ?? 0;
  const reviewDue = summary?.reviewed_today ?? 0;
  const streak = summary?.streak ?? user?.streak?.current_streak ?? 0;

  const lessonUnlockMap = useMemo(() => {
    const map = new Map();
    const units = learningPathData?.units || [];
    units.forEach((unit) => {
      (unit.lessons || []).forEach((item) => {
        const lessonId = item?.lesson?.id ?? item?.lesson_id ?? null;
        const isPublished = item?.lesson?.is_published !== false;
        if (!lessonId || !isPublished) return;
        map.set(lessonId, !!unit.unlocked);
      });
    });
    return map;
  }, [learningPathData]);

  const lessons = useMemo(
    () => (lessonsData?.results ?? []).map((lesson) => ({
      ...lesson,
      can_start: lessonUnlockMap.has(lesson.id) ? lessonUnlockMap.get(lesson.id) : true,
    })),
    [lessonsData, lessonUnlockMap]
  );
  const totalWords = history?.reduce((s, d) => s + d.count, 0) ?? 0;
  const totalReviewDays = history?.filter((d) => d.count > 0).length ?? 0;

  const handleStartLessonSession = (lessonId) => {
    if (!lessonId) return;
    navigate(`/learning/${lessonId}/study`);
  };
  const recoverSession = recoverData?.session;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", md: "1.6rem" }, color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
          {greet()}, {user?.full_name || user?.username || "bạn"}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mt: 0.25 }}>
          {sumLoading
            ? "Đang tải..."
            : dueToday === 0
              ? (reviewDue > 0
                ? `Hôm nay bạn đã ôn ${reviewDue} từ. Xuất sắc.`
                : "Hôm nay chưa có từ cần ôn. Học bài mới nhé.")
              : (reviewDue > 0
                ? `Hôm nay bạn đã ôn ${reviewDue} từ. Hãy tiếp tục.`
                : `Bạn có ${dueToday} từ cần ôn hôm nay.`)}
        </Typography>
      </Box>

      {!!recoverData?.has_recoverable_session && !!recoverSession && (
        <SbCard sx={{ border: `1px solid ${colors.gold}66`, bgcolor: `${colors.gold}12` }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks }}>
                Tiếp tục phiên học
              </Typography>
              <Typography sx={{ fontSize: "0.86rem", color: "text.secondary" }}>
                Bạn còn dở bài: {recoverSession.lesson_title} (bước {recoverData.next_step_index || 1}).
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <SbButton size="small" variant="outlined" onClick={() => refetchRecover()}>
                Làm mới
              </SbButton>
              <SbButton
                size="small"
                variant="primary"
                loading={resumeMutation.isPending}
                onClick={() => resumeMutation.mutate(recoverSession.id)}
              >
                Tiếp tục
              </SbButton>
            </Box>
          </Box>
        </SbCard>
      )}

      <ReviewBanner
        summary={summary}
        loading={sumLoading}
        onStart={() => navigate("/review")}
        onLearn={() => navigate("/learning")}
      />

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <XpCard user={user} loading={sumLoading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: 24 }} />}
            color={streak > 0 ? colors.gold : "text.secondary"}
            value={streak}
            label="Ngày học liên tiếp"
            sub={streak >= 7 ? "Milestone" : undefined}
            loading={sumLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<RepeatRoundedIcon sx={{ fontSize: 24 }} />}
            color={colors.greenStarbucks}
            value={reviewDue}
            label="Từ đã ôn hôm nay"
            sub={dueToday > 0 ? `Còn ${dueToday}` : undefined}
            loading={sumLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 24 }} />}
            color={colors.greenHouse}
            value={totalReviewDays}
            label="Ngày có ôn tập (30 ngày)"
            loading={histLoading}
          />
        </Grid>
      </Grid>

      {!!dailyGoalData && (
        <SbCard>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks }}>Tiến độ mục tiêu ngày</Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                {dailyGoalData.today?.studied_minutes ?? 0}/{dailyGoalData.today?.goal_minutes ?? dailyGoalData.target_minutes} phút
              </Typography>
            </Box>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={goalLoading ? 0 : Math.min(
                  100,
                  Math.round(
                    ((dailyGoalData.today?.studied_minutes ?? 0) /
                      Math.max(1, dailyGoalData.today?.goal_minutes ?? dailyGoalData.target_minutes ?? 1)) *
                      100
                  )
                )}
                size={56}
                thickness={4.8}
                sx={{ color: colors.greenAccent }}
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
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                  {Math.min(
                    100,
                    Math.round(
                      ((dailyGoalData.today?.studied_minutes ?? 0) /
                        Math.max(1, dailyGoalData.today?.goal_minutes ?? dailyGoalData.target_minutes ?? 1)) *
                        100
                    )
                  )}
                  %
                </Typography>
              </Box>
            </Box>
          </Box>
        </SbCard>
      )}

      <SbCard>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
              Hoạt động ôn tập
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              30 ngày qua. {totalWords} từ đã ôn
            </Typography>
          </Box>
          <SbBadge type="xp" value={`+${totalWords * 5}`} label={`+${totalWords * 5} XP`} />
        </Box>
        <Suspense fallback={<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />}>
          <ReviewActivityChart data={history} loading={histLoading} />
        </Suspense>
      </SbCard>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Bài học của tôi
          </Typography>
          <SbButton variant="outlined" size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate("/learning")}>
            Xem tất cả
          </SbButton>
        </Box>

        {lessLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : lessons.length === 0 ? (
          <SbCard variant="cream" sx={{ textAlign: "center", py: 4 }}>
            <MenuBookRoundedIcon sx={{ fontSize: 40, color: colors.greenLight, mb: 1 }} />
            <Typography sx={{ color: "text.secondary" }}>
              Chưa có bài học nào. Hãy khám phá thư viện bài học.
            </Typography>
            <SbButton variant="primary" sx={{ mt: 2 }} onClick={() => navigate("/learning")}>
              Khám phá bài học
            </SbButton>
          </SbCard>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Grid container spacing={2}>
              {lessons.map((lesson) => (
                <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                  <LessonCard
                    lesson={lesson}
                    onStartSession={handleStartLessonSession}
                    isStarting={false}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;

