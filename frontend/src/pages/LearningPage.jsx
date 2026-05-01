import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Tabs, Tab, Skeleton,
  Chip, InputAdornment, TextField,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { SbCard, SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const LEVEL_CHIP = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#212121" },
};

// ── Lesson card ───────────────────────────────────────────────────────────────

const LessonCard = ({ lesson, assignment }) => {
  const navigate = useNavigate();
  const isCompleted = !!lesson.user_progress?.completed_at;
  const isStarted   = !!lesson.user_progress?.started_at;
  const dueDate     = assignment?.due_date;
  const isOverdue   = dueDate && new Date(dueDate) < new Date();
  const lvl = LEVEL_CHIP[lesson.level] ?? { bg: colors.greenLight, color: colors.greenHouse };

  return (
    <SbCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${isOverdue ? colors.red + "44" : "transparent"}`,
        transition: "box-shadow 0.2s, transform 0.15s",
        "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
      }}
      noPadding
    >
      {/* Colored header strip */}
      <Box sx={{ height: 5, bgcolor: isCompleted ? colors.greenAccent : isStarted ? colors.gold : colors.greenLight, borderRadius: "12px 12px 0 0" }} />

      <Box sx={{ p: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
        {/* Badges */}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {lesson.level && (
            <Chip label={lesson.level} size="small"
              sx={{ bgcolor: lvl.bg, color: lvl.color, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
          )}
          {isCompleted && (
            <Chip icon={<CheckCircleRoundedIcon sx={{ fontSize: "12px !important" }} />}
              label="Đã hoàn thành" size="small"
              sx={{ bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
          )}
          {assignment && !isCompleted && (
            <Chip icon={<AssignmentRoundedIcon sx={{ fontSize: "12px !important" }} />}
              label="Được giao" size="small"
              sx={{ bgcolor: `${colors.gold}22`, color: colors.gold, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
          )}
        </Box>

        {/* Title */}
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary", lineHeight: 1.4, flex: 1 }}>
          {lesson.title}
        </Typography>

        {/* Meta */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            📚 {lesson.word_count ?? "?"} từ
            {lesson.created_by_name ? ` · ${lesson.created_by_name}` : ""}
          </Typography>
          {dueDate && (
            <Typography sx={{ fontSize: "0.8125rem", color: isOverdue ? colors.red : "text.secondary", fontWeight: isOverdue ? 700 : 400 }}>
              🗓 Hạn: {fmtDate(dueDate)}{isOverdue ? " — Quá hạn!" : ""}
            </Typography>
          )}
        </Box>

        {/* Action button */}
        <SbButton
          variant={isCompleted ? "outlined" : "primary"}
          size="small"
          fullWidth
          startIcon={<PlayArrowRoundedIcon />}
          endIcon={!isCompleted && <ArrowForwardRoundedIcon />}
          onClick={() => navigate(`/learning/${lesson.id}/study`)}
          sx={{ mt: 0.5 }}
        >
          {isCompleted ? "Học lại" : isStarted ? "Tiếp tục học" : "Bắt đầu học"}
        </SbButton>
      </Box>
    </SbCard>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <SbCard sx={{ height: 200 }} noPadding>
    <Box sx={{ height: 5, bgcolor: colors.greenLight, borderRadius: "12px 12px 0 0" }} />
    <Box sx={{ p: "16px 20px" }}>
      <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={24} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="50%" height={18} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 6 }} />
    </Box>
  </SbCard>
);

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ tab }) => (
  <Box sx={{ textAlign: "center", py: 6 }}>
    {tab === 0
      ? <MenuBookRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 1 }} />
      : <AssignmentRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 1 }} />}
    <Typography sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
      {tab === 0 ? "Chưa có bài học nào" : "Chưa có bài được giao"}
    </Typography>
    <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
      {tab === 0
        ? "Hãy khám phá thư viện hoặc hỏi giáo viên để được giao bài."
        : "Giáo viên của bạn chưa giao bài học nào."}
    </Typography>
  </Box>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const LearningPage = () => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");

  const { data: lessonsData, isLoading: lessLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => learningApi.getLessons().then((r) => r.data),
    staleTime: 120_000,
  });

  const { data: assignmentsData, isLoading: assignLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => learningApi.getAssignments().then((r) => r.data),
    staleTime: 120_000,
  });

  const lessons     = lessonsData?.results ?? [];
  const assignments = assignmentsData?.results ?? [];

  // Map lesson id → assignment
  const assignMap = {};
  assignments.forEach((a) => { assignMap[a.lesson] = a; });

  // Filter by search
  const filterFn = (l) =>
    !search || l.title.toLowerCase().includes(search.toLowerCase());

  const shownLessons     = lessons.filter(filterFn);
  const shownAssignments = assignments.filter((a) =>
    !search || a.lesson_title?.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = tab === 0 ? lessLoading : assignLoading;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
            Bài học
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            {lessons.length} bài học · {assignments.length} bài được giao
          </Typography>
        </Box>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Tìm kiếm bài học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 240 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "50px",
              bgcolor: "background.paper",
              fontSize: "0.875rem",
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: `1px solid rgba(0,0,0,0.08)`,
          "& .MuiTab-root": { fontWeight: 700, fontSize: "0.875rem", textTransform: "none", minWidth: 100 },
          "& .Mui-selected": { color: `${colors.greenAccent} !important` },
          "& .MuiTabs-indicator": { bgcolor: colors.greenAccent },
        }}
      >
        <Tab label={`Tất cả bài học (${lessons.length})`} />
        <Tab label={`Bài được giao (${assignments.length})`} />
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : tab === 0 ? (
        shownLessons.length === 0 ? (
          <EmptyState tab={0} />
        ) : (
          <Grid container spacing={2}>
            {shownLessons.map((lesson) => (
              <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                <LessonCard lesson={lesson} assignment={assignMap[lesson.id]} />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        shownAssignments.length === 0 ? (
          <EmptyState tab={1} />
        ) : (
          <Grid container spacing={2}>
            {shownAssignments.map((a) => {
              const lessonObj = {
                id: a.lesson,
                title: a.lesson_title,
                word_count: 0,
                level: "",
                created_by_name: a.teacher_email,
                user_progress: a.completed_at ? { completed_at: a.completed_at } : null,
              };
              return (
                <Grid item xs={12} sm={6} md={4} key={a.id}>
                  <LessonCard lesson={lessonObj} assignment={a} />
                </Grid>
              );
            })}
          </Grid>
        )
      )}
    </Box>
  );
};

export default LearningPage;
