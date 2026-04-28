import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Card, CardContent, Skeleton, LinearProgress,
} from "@mui/material";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import CollectionsBookmarkRoundedIcon from "@mui/icons-material/CollectionsBookmarkRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import adminApi from "@/api/adminApi";

const ADMIN_BG = "#1a1f3a";

const InfoCard = ({ icon, label, value, sub, color, loading, barValue, barMax }) => (
  <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "10px",
          bgcolor: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Box sx={{ color, display: "flex" }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>
          {label}
        </Typography>
      </Box>

      {loading ? (
        <Skeleton width="50%" height={36} />
      ) : (
        <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: ADMIN_BG, lineHeight: 1 }}>
          {value?.toLocaleString() ?? "—"}
        </Typography>
      )}

      {sub && !loading && (
        <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mt: 0.5 }}>
          {sub}
        </Typography>
      )}

      {barValue != null && barMax != null && !loading && (
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={barMax > 0 ? Math.round((barValue / barMax) * 100) : 0}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: `${color}20`,
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
            }}
          />
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.5 }}>
            {barMax > 0 ? Math.round((barValue / barMax) * 100) : 0}% đã public
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const AdminContent = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 30_000,
  });

  const s = data ?? {};

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
          Nội dung hệ thống
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
          Tổng quan các tài nguyên học tập trong nền tảng
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<LibraryBooksRoundedIcon />}
            label="Từ vựng"
            value={s.total_words}
            sub="Tổng số từ trong cơ sở dữ liệu"
            color="#8e24aa"
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<CollectionsBookmarkRoundedIcon />}
            label="Bộ từ vựng"
            value={s.total_wordsets}
            sub="WordSet do giáo viên / admin tạo"
            color="#6d4c41"
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<MenuBookRoundedIcon />}
            label="Bài học"
            value={s.total_lessons}
            sub={`${s.published_lessons ?? 0} bài đã public`}
            color="#1e88e5"
            loading={isLoading}
            barValue={s.published_lessons}
            barMax={s.total_lessons}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<AssignmentRoundedIcon />}
            label="Bài giao"
            value={s.total_assignments}
            sub="Tổng assignment giáo viên đã giao"
            color="#f4511e"
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<RepeatRoundedIcon />}
            label="Tổng lượt ôn tập"
            value={s.total_reviews}
            sub={`${s.reviews_today ?? 0} lượt ôn hôm nay`}
            color="#00897b"
            loading={isLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <InfoCard
            icon={<QuizRoundedIcon />}
            label="Bài kiểm tra"
            value={s.total_quiz_results}
            sub="Tổng kết quả quiz học sinh đã làm"
            color="#e91e63"
            loading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminContent;
