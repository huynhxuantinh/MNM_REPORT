import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Skeleton, Chip, Alert,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Stack,
} from "@mui/material";
import MenuBookRoundedIcon    from "@mui/icons-material/MenuBookRounded";
import AssignmentRoundedIcon  from "@mui/icons-material/AssignmentRounded";
import PeopleRoundedIcon      from "@mui/icons-material/PeopleRounded";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
};
const KPI_DAY_OPTIONS = [7, 28, 56];
const KPI_FIELDS = [
  { key: "dau", label: "DAU", suffix: "" },
  { key: "sessions_per_dau", label: "Sessions/DAU", suffix: "" },
  { key: "session_completion_rate", label: "Session Completion", suffix: "%" },
  { key: "checkpoint_pass_rate", label: "Checkpoint Pass", suffix: "%" },
  { key: "d1_retention_rate", label: "D1 Retention", suffix: "%" },
  { key: "d7_retention_rate", label: "D7 Retention", suffix: "%" },
  { key: "w4_retention_rate", label: "W4 Retention", suffix: "%" },
];
const ONBOARDING_FIELDS = [
  { key: "placement_enter_users", label: "Placement Enter", suffix: "" },
  { key: "placement_submit_users", label: "Placement Submit", suffix: "" },
  { key: "first_lesson_start_users", label: "First Lesson Start", suffix: "" },
  { key: "placement_abandon_users", label: "Placement Abandon", suffix: "" },
  { key: "submit_conversion_rate", label: "Enter -> Submit", suffix: "%" },
  { key: "first_lesson_conversion_rate", label: "Submit -> First Lesson", suffix: "%" },
  { key: "full_conversion_rate", label: "Enter -> First Lesson", suffix: "%" },
  { key: "placement_abandon_rate", label: "Abandon Rate", suffix: "%" },
];

const fmtDate = (dt) =>
  dt ? new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color, loading }) => (
  <Box
    sx={{
      bgcolor: "background.paper",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: "14px",
      p: 2.5,
      display: "flex",
      alignItems: "center",
      gap: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}
  >
    <Box
      sx={{
        width: 50, height: 50, borderRadius: "13px",
        bgcolor: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        sx={{ fontSize: "1.8rem", fontWeight: 800, color: colors.greenStarbucks, lineHeight: 1 }}
      >
        {loading ? <Skeleton width={48} height={36} /> : (value ?? 0)}
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

const KpiCard = ({ label, value, suffix = "", loading }) => (
  <Box
    sx={{
      bgcolor: "background.paper",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: "12px",
      p: 1.8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}
  >
    <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 0.4 }}>
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800, color: colors.greenStarbucks, fontSize: "1.15rem" }}>
      {loading ? <Skeleton width={68} height={30} /> : `${value ?? 0}${suffix}`}
    </Typography>
  </Box>
);

// ── RecentLessonsTable ────────────────────────────────────────────────────────

const RecentLessonsTable = ({ lessons, loading }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.greenStarbucks, mb: 1.5 }}>
      Bài học gần đây
    </Typography>
    <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.78rem", color: colors.greenStarbucks, bgcolor: `${colors.greenAccent}0a` } }}>
            <TableCell>Tiêu đề</TableCell>
            <TableCell align="center">Cấp độ</TableCell>
            <TableCell align="center">Số từ</TableCell>
            <TableCell align="center">Trạng thái</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton height={18} /></TableCell>
                  ))}
                </TableRow>
              ))
            : lessons.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary", fontSize: "0.85rem" }}>
                    Chưa có bài học nào.
                  </TableCell>
                </TableRow>
              )
              : lessons.map((l) => {
                  const lc = LEVEL_COLOR[l.level] ?? {};
                  return (
                    <TableRow key={l.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }} noWrap>
                          {l.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {l.level
                          ? <Chip label={l.level} size="small" sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, fontSize: "0.72rem", height: 20 }} />
                          : "—"}
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks, fontSize: "0.85rem" }}>
                          {l.word_count ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={l.is_published ? "Công bố" : "Nháp"}
                          size="small"
                          sx={{
                            height: 20, fontSize: "0.72rem", fontWeight: 700,
                            bgcolor: l.is_published ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                            color: l.is_published ? colors.greenAccent : "text.secondary",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// ── RecentAssignmentsTable ────────────────────────────────────────────────────

const RecentAssignmentsTable = ({ assignments, loading }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.greenStarbucks, mb: 1.5 }}>
      Giao bài gần đây
    </Typography>
    <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.78rem", color: colors.greenStarbucks, bgcolor: `${colors.greenAccent}0a` } }}>
            <TableCell>Học sinh</TableCell>
            <TableCell>Bài học</TableCell>
            <TableCell align="center">Hạn nộp</TableCell>
            <TableCell align="center">Trạng thái</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><Skeleton height={18} /></TableCell>
                  ))}
                </TableRow>
              ))
            : assignments.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: "text.secondary", fontSize: "0.85rem" }}>
                    Chưa giao bài cho ai.
                  </TableCell>
                </TableRow>
              )
              : assignments.map((a) => (
                  <TableRow key={a.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }} noWrap>
                        {a.student_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.85rem" }} noWrap>
                        {a.lesson_title}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                        {a.due_date ? fmtDate(a.due_date) : "Không hạn"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={a.is_completed ? "Hoàn thành" : "Chưa xong"}
                        size="small"
                        sx={{
                          height: 20, fontSize: "0.72rem", fontWeight: 700,
                          bgcolor: a.is_completed ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                          color: a.is_completed ? colors.greenAccent : "text.secondary",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// ── Main TeacherDashboard ─────────────────────────────────────────────────────

const TeacherDashboard = () => {
  const [kpiDays, setKpiDays] = useState(28);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: () => teacherApi.getTeacherStats().then((r) => r.data),
    staleTime: 60_000,
  });
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    isError: isKpiError,
  } = useQuery({
    queryKey: ["learning-kpi-baseline", kpiDays],
    queryFn: () => teacherApi.getLearningKPIBaseline(kpiDays).then((r) => r.data),
    staleTime: 60_000,
  });
  const {
    data: funnelData,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
  } = useQuery({
    queryKey: ["learning-onboarding-funnel", kpiDays],
    queryFn: () => teacherApi.getOnboardingFunnel(kpiDays).then((r) => r.data),
    staleTime: 60_000,
  });

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: "10px" }}>
        Không thể tải dữ liệu. Vui lòng thử lại sau.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks, mb: 2.5 }}>
        Tổng quan
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<MenuBookRoundedIcon sx={{ color: colors.greenAccent, fontSize: 26 }} />}
            label="Bài học đã tạo"
            value={data?.lesson_count}
            color={colors.greenAccent}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<AssignmentRoundedIcon sx={{ color: "#f5a623", fontSize: 26 }} />}
            label="Bài đang giao"
            value={data?.assignment_count}
            color="#f5a623"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<PeopleRoundedIcon sx={{ color: "#4a90d9", fontSize: 26 }} />}
            label="Học sinh được giao"
            value={data?.student_count}
            color="#4a90d9"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.greenStarbucks }}>
            Learning KPI Baseline
          </Typography>
          {KPI_DAY_OPTIONS.map((day) => (
            <Chip
              key={day}
              size="small"
              label={`${day}d`}
              clickable
              onClick={() => setKpiDays(day)}
              sx={{
                fontWeight: 700,
                bgcolor: kpiDays === day ? `${colors.greenAccent}22` : "rgba(0,0,0,0.06)",
                color: kpiDays === day ? colors.greenAccent : "text.secondary",
              }}
            />
          ))}
        </Stack>
        {isKpiError ? (
          <Alert severity="warning" sx={{ borderRadius: "10px" }}>
            Khong the tai KPI baseline.
          </Alert>
        ) : (
          <Grid container spacing={1.5}>
            {KPI_FIELDS.map((item) => (
              <Grid key={item.key} item xs={6} sm={4} lg={3}>
                <KpiCard
                  label={item.label}
                  value={kpiData?.kpis?.[item.key]}
                  suffix={item.suffix}
                  loading={isKpiLoading}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Bảng chi tiết */}
      <Box sx={{ mb: 3.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.greenStarbucks, mb: 1.25 }}>
          Onboarding Funnel
        </Typography>
        {isFunnelError ? (
          <Alert severity="warning" sx={{ borderRadius: "10px" }}>
            Khong the tai onboarding funnel.
          </Alert>
        ) : (
          <Grid container spacing={1.5}>
            {ONBOARDING_FIELDS.map((item) => (
              <Grid key={item.key} item xs={6} sm={4} lg={3}>
                <KpiCard
                  label={item.label}
                  value={funnelData?.funnel?.[item.key]}
                  suffix={item.suffix}
                  loading={isFunnelLoading}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <RecentLessonsTable
            lessons={data?.recent_lessons ?? []}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <RecentAssignmentsTable
            assignments={data?.recent_assignments ?? []}
            loading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
