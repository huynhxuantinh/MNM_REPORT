import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Chip, Skeleton, Pagination,
  Stack, InputAdornment, LinearProgress, Tooltip,
} from "@mui/material";
import SearchRoundedIcon  from "@mui/icons-material/SearchRounded";
import QuizRoundedIcon    from "@mui/icons-material/QuizRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import adminApi from "@/api/adminApi";

const ADMIN_BG     = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE    = 20;

const scoreColor = (score) => {
  if (score >= 80) return "#43a047";
  if (score >= 50) return "#fb8c00";
  return "#e53935";
};

const scoreLabel = (score) => {
  if (score >= 80) return "Xuất sắc";
  if (score >= 50) return "Trung bình";
  return "Chưa đạt";
};

const fmtDate = (dt) =>
  dt ? new Date(dt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

const AdminQuizResults = () => {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const params = {
    search:    search || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-quiz-results", params],
    queryFn:  () => adminApi.getQuizResults(params).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });

  const results  = data?.results ?? [];
  const total    = data?.count ?? 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Kết quả kiểm tra
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            {total.toLocaleString()} lượt làm bài trong hệ thống
            {avgScore !== null && (
              <Chip
                icon={<EmojiEventsRoundedIcon sx={{ fontSize: 14 }} />}
                label={`Điểm TB trang này: ${avgScore}/100`}
                size="small"
                sx={{ ml: 1.5, fontWeight: 700, fontSize: "0.75rem", bgcolor: `${scoreColor(avgScore)}18`, color: scoreColor(avgScore) }}
              />
            )}
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm theo tên hoặc email học sinh…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ width: 340 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Học sinh</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Bài kiểm tra</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Điểm</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Đúng / Tổng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Thời gian</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={28} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : results.map((r) => (
                  <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: ADMIN_BG }}>
                        {r.user_name || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        {r.user_email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <QuizRoundedIcon sx={{ fontSize: 16, color: ADMIN_ACCENT, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: "0.875rem" }}>{r.quiz_title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={scoreLabel(r.score)}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: scoreColor(r.score) }}>
                            {Math.round(r.score)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={r.score}
                            sx={{
                              width: 56, height: 4, borderRadius: 2,
                              bgcolor: `${scoreColor(r.score)}20`,
                              "& .MuiLinearProgress-bar": { bgcolor: scoreColor(r.score), borderRadius: 2 },
                            }}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${r.correct_answers} / ${r.total_questions}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: `${scoreColor(r.score)}15`,
                          color: scoreColor(r.score),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                      {fmtDate(r.completed_at)}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && results.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Không tìm thấy kết quả nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={numPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
};

export default AdminQuizResults;
