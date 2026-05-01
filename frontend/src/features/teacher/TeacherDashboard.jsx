import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Skeleton, Chip, Alert,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: () => teacherApi.getTeacherStats().then((r) => r.data),
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

      {/* Bảng chi tiết */}
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
