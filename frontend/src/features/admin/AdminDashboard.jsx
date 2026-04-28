import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Card, CardContent, Skeleton, Divider, Chip,
} from "@mui/material";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CastForEducationRoundedIcon from "@mui/icons-material/CastForEducationRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import adminApi from "@/api/adminApi";

const ADMIN_ACCENT = "#5c6bc0";
const ADMIN_BG     = "#1a1f3a";

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color, loading, sub }) => (
  <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: "12px",
          bgcolor: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{ color, display: "flex" }}>{icon}</Box>
        </Box>
      </Box>

      {loading ? (
        <>
          <Skeleton width="60%" height={36} />
          <Skeleton width="80%" height={20} sx={{ mt: 0.5 }} />
        </>
      ) : (
        <>
          <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: ADMIN_BG, lineHeight: 1 }}>
            {value?.toLocaleString() ?? "—"}
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.5 }}>
            {label}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.25 }}>
              {sub}
            </Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

// ── Section heading ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: ADMIN_BG, mb: 2, mt: 1 }}>
    {children}
  </Typography>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 30_000,
  });

  const s = data ?? {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
          Tổng quan hệ thống
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
          Thống kê toàn bộ hoạt động của nền tảng
        </Typography>
      </Box>

      {/* ── Users ── */}
      <SectionTitle>Người dùng</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<PeopleRoundedIcon />}
            label="Tổng người dùng"
            value={s.total_users}
            color={ADMIN_ACCENT}
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<PersonRoundedIcon />}
            label="Học sinh"
            value={s.students}
            color="#43a047"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<CastForEducationRoundedIcon />}
            label="Giáo viên"
            value={s.teachers}
            color="#fb8c00"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<AdminPanelSettingsRoundedIcon />}
            label="Admin"
            value={s.admins}
            color="#e53935"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<TrendingUpRoundedIcon />}
            label="Mới tuần này"
            value={s.new_users_this_week}
            color="#00acc1"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <StatCard
            icon={<PeopleRoundedIcon />}
            label="Đang hoạt động"
            value={s.active_users}
            color="#7cb342"
            loading={isLoading}
            sub={`${s.inactive_users ?? 0} bị vô hiệu hóa`}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── Content ── */}
      <SectionTitle>Nội dung học tập</SectionTitle>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<LibraryBooksRoundedIcon />}
            label="Tổng từ vựng"
            value={s.total_words}
            color="#8e24aa"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<MenuBookRoundedIcon />}
            label="Bài học"
            value={s.total_lessons}
            color="#1e88e5"
            loading={isLoading}
            sub={`${s.published_lessons ?? 0} đã public`}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<AssignmentRoundedIcon />}
            label="Bài giao"
            value={s.total_assignments}
            color="#f4511e"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<LibraryBooksRoundedIcon />}
            label="Bộ từ vựng"
            value={s.total_wordsets}
            color="#6d4c41"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── Activity ── */}
      <SectionTitle>Hoạt động học tập</SectionTitle>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<RepeatRoundedIcon />}
            label="Lượt ôn hôm nay"
            value={s.reviews_today}
            color="#00897b"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<RepeatRoundedIcon />}
            label="Tổng lượt ôn"
            value={s.total_reviews}
            color="#039be5"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard
            icon={<QuizRoundedIcon />}
            label="Bài kiểm tra"
            value={s.total_quiz_results}
            color="#e91e63"
            loading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
