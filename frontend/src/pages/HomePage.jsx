import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Skeleton, LinearProgress,
  Chip, Divider, useMediaQuery, useTheme,
} from "@mui/material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import { SbCard, SbButton, SbBadge } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLevelThreshold = (n) => 100 * n * (n + 1) / 2;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

const LEVEL_COLORS = ["#d4e9e2", colors.greenAccent, colors.greenStarbucks, colors.gold];

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, color, sub, loading }) => (
  <SbCard sx={{ height: "100%" }}>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ color, display: "flex", alignItems: "center" }}>{icon}</Box>
        {sub && (
          <Typography sx={{ fontSize: "0.72rem", color: colors.textBlackSoft, fontWeight: 600 }}>
            {sub}
          </Typography>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="text" width="60%" height={40} />
      ) : (
        <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>
          {value}
        </Typography>
      )}
      <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
        {label}
      </Typography>
    </Box>
  </SbCard>
);

// ── XP progress card ──────────────────────────────────────────────────────────

const XpCard = ({ user, loading }) => {
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const prev = getLevelThreshold(level - 1);
  const next = getLevelThreshold(level);
  const pct = next > prev ? Math.round(((xp - prev) / (next - prev)) * 100) : 100;

  return (
    <SbCard sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BoltRoundedIcon sx={{ color: colors.greenAccent, fontSize: 24 }} />
          <Chip
            label={`Level ${level}`}
            size="small"
            sx={{ bgcolor: colors.greenAccent, color: "#fff", fontWeight: 700, fontSize: "0.72rem" }}
          />
        </Box>
        {loading ? (
          <Skeleton variant="text" width="70%" height={40} />
        ) : (
          <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: colors.greenAccent, lineHeight: 1 }}>
            {xp.toLocaleString()} XP
          </Typography>
        )}
        <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
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

// ── Chart ─────────────────────────────────────────────────────────────────────

const ReviewChart = ({ data, loading }) => {
  if (loading) return <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />;
  if (!data?.length) return null;

  const formatted = data.map((d, i) => ({
    ...d,
    label: i % 5 === 0 ? fmtDate(d.date) : "",
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={colors.greenAccent} stopOpacity={0.28} />
            <stop offset="95%" stopColor={colors.greenAccent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: colors.textBlackSoft }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: colors.textBlackSoft }} axisLine={false} tickLine={false} />
        <ChartTooltip
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 12 }}
          formatter={(v) => [v, "Từ đã ôn"]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? fmtDate(payload[0].payload.date) : ""}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={colors.greenAccent}
          strokeWidth={2}
          fill="url(#reviewGrad)"
          dot={false}
          activeDot={{ r: 4, fill: colors.greenAccent }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ── Lesson card (small) ───────────────────────────────────────────────────────

const LessonCard = ({ lesson, assignment }) => {
  const navigate = useNavigate();

  const isCompleted = !!lesson.user_progress?.completed_at;
  const isStarted   = !!lesson.user_progress?.started_at;
  const dueDate     = assignment?.due_date;
  const isOverdue   = dueDate && new Date(dueDate) < new Date();

  return (
    <SbCard
      sx={{
        border: `1px solid ${isOverdue ? colors.red + "44" : "transparent"}`,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.12)" },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {/* Header row */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 0.75, mb: 0.5, flexWrap: "wrap" }}>
              {lesson.level && (
                <Chip label={lesson.level} size="small"
                  sx={{ bgcolor: colors.greenLight, color: colors.greenHouse, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
              )}
              {assignment && (
                <Chip icon={<AssignmentRoundedIcon sx={{ fontSize: "12px !important" }} />}
                  label="Được giao" size="small"
                  sx={{ bgcolor: `${colors.gold}22`, color: colors.gold, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
              )}
              {isCompleted && (
                <Chip icon={<CheckCircleRoundedIcon sx={{ fontSize: "12px !important" }} />}
                  label="Hoàn thành" size="small"
                  sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
              )}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: colors.textBlack, lineHeight: 1.3 }}>
              {lesson.title}
            </Typography>
          </Box>
          <MenuBookRoundedIcon sx={{ color: colors.greenLight, fontSize: 22, flexShrink: 0, mt: 0.25 }} />
        </Box>

        {/* Meta */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
            {lesson.word_count} từ
          </Typography>
          {dueDate && (
            <Typography sx={{ fontSize: "0.8rem", color: isOverdue ? colors.red : colors.textBlackSoft, fontWeight: isOverdue ? 700 : 400 }}>
              · Hạn: {fmtDate(dueDate)}
              {isOverdue ? " (Quá hạn!)" : ""}
            </Typography>
          )}
        </Box>

        {/* Action */}
        <SbButton
          variant={isCompleted ? "outlined" : "primary"}
          size="small"
          fullWidth
          onClick={() => navigate(`/learning/${lesson.id}/study`)}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ mt: 0.5 }}
        >
          {isCompleted ? "Học lại" : isStarted ? "Tiếp tục" : "Học ngay"}
        </SbButton>
      </Box>
    </SbCard>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["review-summary"],
    queryFn: () => learningApi.getReviewSummary().then((r) => r.data),
    staleTime: 60_000,
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

  const { data: assignmentsData, isLoading: assignLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => learningApi.getAssignments().then((r) => r.data),
    staleTime: 120_000,
  });

  const dueCount  = summary?.reviewed_today !== undefined
    ? (summary?.due_tomorrow ?? 0)   // actually we need due count from review list
    : 0;
  const reviewDue = summary?.reviewed_today ?? 0;
  const streak    = summary?.streak ?? user?.streak?.current_streak ?? 0;

  // Map assignment by lesson id
  const assignMap = {};
  (assignmentsData?.results ?? []).forEach((a) => {
    assignMap[a.lesson] = a;
  });

  const lessons = lessonsData?.results ?? [];

  // Total words learned = total reviews
  const totalWords = history?.reduce((s, d) => s + d.count, 0) ?? 0;
  const totalReviewDays = history?.filter((d) => d.count > 0).length ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", md: "1.6rem" }, color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
            {greet()}, {user?.full_name || user?.username || "bạn"}! 🌱
          </Typography>
          <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.9rem", mt: 0.25 }}>
            {sumLoading
              ? "Đang tải..."
              : reviewDue > 0
              ? `Hôm nay bạn đã ôn ${reviewDue} từ. Hãy tiếp tục!`
              : "Chưa ôn tập hôm nay. Bắt đầu ngay nhé!"}
          </Typography>
        </Box>

        {/* Today's review CTA */}
        <SbButton
          variant="primary"
          size={isMobile ? "small" : "medium"}
          startIcon={<PlayArrowRoundedIcon />}
          onClick={() => navigate("/review")}
          sx={{ whiteSpace: "nowrap" }}
        >
          Ôn tập hôm nay
        </SbButton>
      </Box>

      {/* ── Stat cards row ─────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <XpCard user={user} loading={sumLoading} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: 24 }} />}
            color={streak > 0 ? colors.gold : colors.textBlackSoft}
            value={streak}
            label="Ngày học liên tiếp"
            sub={streak >= 7 ? "🏆 Milestone!" : undefined}
            loading={sumLoading}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            icon={<MenuBookRoundedIcon sx={{ fontSize: 24 }} />}
            color={colors.greenStarbucks}
            value={reviewDue}
            label="Từ đã ôn hôm nay"
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

      {/* ── Activity chart ─────────────────────────────────────────────────── */}
      <SbCard>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
              Hoạt động ôn tập
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              30 ngày qua • {totalWords} từ đã ôn
            </Typography>
          </Box>
          <SbBadge type="xp" value={`+${totalWords * 5}`} label={`+${totalWords * 5} XP`} />
        </Box>
        <ReviewChart data={history} loading={histLoading} />
      </SbCard>

      {/* ── Lessons section ────────────────────────────────────────────────── */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Bài học của tôi
          </Typography>
          <SbButton
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => navigate("/learning")}
          >
            Xem tất cả
          </SbButton>
        </Box>

        {lessLoading || assignLoading ? (
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
            <Typography sx={{ color: colors.textBlackSoft }}>
              Chưa có bài học nào. Hãy khám phá thư viện bài học!
            </Typography>
            <SbButton variant="primary" sx={{ mt: 2 }} onClick={() => navigate("/learning")}>
              Khám phá bài học
            </SbButton>
          </SbCard>
        ) : (
          <Grid container spacing={2}>
            {lessons.map((lesson) => (
              <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                <LessonCard lesson={lesson} assignment={assignMap[lesson.id]} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── Assignments section ────────────────────────────────────────────── */}
      {(assignmentsData?.results?.length ?? 0) > 0 && (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks, mb: 2 }}>
            Bài được giao
          </Typography>
          <Grid container spacing={2}>
            {(assignmentsData?.results ?? []).slice(0, 3).map((a) => {
              const lessonObj = { id: a.lesson, title: a.lesson_title, word_count: 0, level: "" };
              return (
                <Grid item xs={12} sm={6} md={4} key={a.id}>
                  <LessonCard lesson={lessonObj} assignment={a} />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

    </Box>
  );
};

export default HomePage;
