import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Skeleton, Alert, TextField,
  InputAdornment, Chip, LinearProgress, Tooltip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, CircularProgress,
} from "@mui/material";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import PeopleRoundedIcon       from "@mui/icons-material/PeopleRounded";
import BoltRoundedIcon         from "@mui/icons-material/BoltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import CheckCircleRoundedIcon  from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon     from "@mui/icons-material/ScheduleRounded";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLevelXp   = (lv) => (100 * lv * (lv + 1)) / 2;
const xpProgress   = (xp, lv) => {
  const next = getLevelXp(lv);
  const prev = getLevelXp(lv - 1);
  return next > prev ? Math.round(((xp - prev) / (next - prev)) * 100) : 100;
};

const avatarLetter = (s) =>
  (s?.full_name || s?.username || s?.email || "?")[0].toUpperCase();

const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

// ── StudentDetailDialog ───────────────────────────────────────────────────────

const StudentDetailDialog = ({ open, onClose, student, assignments }) => {
  const studentAssignments = assignments.filter(
    (a) => a.student === student?.id || a.student_email === student?.email,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: colors.greenAccent, width: 48, height: 48, fontWeight: 700, fontSize: "1.2rem" }}>
            {avatarLetter(student)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
              {student?.full_name || student?.username}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              {student?.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {/* Stats row */}
        <Box sx={{
          display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5,
          p: 2, bgcolor: `${colors.greenAccent}08`, borderRadius: "12px",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <BoltRoundedIcon sx={{ fontSize: 16, color: colors.greenAccent }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
              {student?.xp ?? 0} XP
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: colors.greenStarbucks }}>
              Level {student?.level ?? 1}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Danh sách bài được giao */}
        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: colors.greenStarbucks, mb: 1.5 }}>
          Bài học được giao ({studentAssignments.length})
        </Typography>

        {studentAssignments.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft, textAlign: "center", py: 3 }}>
            Chưa có bài học nào.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {studentAssignments.map((a) => (
              <Box
                key={a.id}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  p: 1.5, borderRadius: "10px",
                  border: "1px solid rgba(0,0,0,0.07)",
                  bgcolor: a.is_completed ? `${colors.greenAccent}08` : "#fafafa",
                }}
              >
                {a.is_completed
                  ? <CheckCircleRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20, flexShrink: 0 }} />
                  : <ScheduleRoundedIcon sx={{ color: colors.textBlackSoft, fontSize: 20, flexShrink: 0 }} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }} noWrap>
                    {a.lesson_title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }}>
                    Hạn: {a.due_date ? fmtDate(a.due_date) : "Không hạn"}
                  </Typography>
                </Box>
                <Chip
                  label={a.is_completed ? "Xong" : "Chưa xong"}
                  size="small"
                  sx={{
                    height: 20, fontWeight: 700, fontSize: "0.72rem", flexShrink: 0,
                    bgcolor: a.is_completed ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                    color: a.is_completed ? colors.greenAccent : colors.textBlackSoft,
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <SbButton variant="outlined" onClick={onClose}>Đóng</SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── Main TeacherStudents ──────────────────────────────────────────────────────

const TeacherStudents = () => {
  const [search, setSearch]   = useState("");
  const [detailDlg, setDetailDlg] = useState({ open: false, student: null });

  // Danh sách học sinh
  const { data: studentData, isLoading: loadingStudents, isError: studentError } = useQuery({
    queryKey: ["teacher-students", search],
    queryFn: () =>
      teacherApi.getStudents({ search: search || undefined, page_size: 100 }).then((r) => r.data),
    staleTime: 30_000,
  });

  // Assignments — để hiển thị số bài được giao và chi tiết
  const { data: assignData, isLoading: loadingAssign } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => teacherApi.getAssignments().then((r) => r.data),
    staleTime: 60_000,
  });

  const students    = studentData?.results ?? [];
  const assignments = assignData?.results ?? assignData ?? [];

  // Đếm số bài được giao cho từng học sinh
  const assignCountMap = {};
  assignments.forEach((a) => {
    assignCountMap[a.student] = (assignCountMap[a.student] ?? 0) + 1;
  });

  const isLoading = loadingStudents || loadingAssign;

  return (
    <Box>
      {/* Header + search */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Danh sách học sinh
          </Typography>
          {!loadingStudents && (
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              {students.length} học sinh
            </Typography>
          )}
        </Box>
        <TextField
          size="small"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: colors.textBlackSoft }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
      </Box>

      {studentError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách học sinh. Vui lòng thử lại.
        </Alert>
      )}

      {/* Bảng */}
      <TableContainer component={Paper} sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{
              "& th": {
                fontWeight: 700, fontSize: "0.8rem",
                color: colors.greenStarbucks,
                bgcolor: `${colors.greenAccent}0d`,
                borderBottom: `2px solid ${colors.greenAccent}22`,
                py: 1.5,
              },
            }}>
              <TableCell>Học sinh</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>Level</TableCell>
              <TableCell sx={{ width: 160 }}>Tiến độ XP</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Bài được giao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : students.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 7 }}>
                      <PeopleRoundedIcon sx={{ fontSize: 48, color: colors.greenAccent, opacity: 0.25, mb: 1 }} />
                      <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.875rem" }}>
                        {search ? "Không tìm thấy học sinh phù hợp." : "Chưa có học sinh nào."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : students.map((s) => {
                    const lv   = s.level ?? 1;
                    const xp   = s.xp ?? 0;
                    const prog = xpProgress(xp, lv);
                    const assignCount = assignCountMap[s.id] ?? 0;

                    return (
                      <TableRow
                        key={s.id}
                        hover
                        sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                        onClick={() => setDetailDlg({ open: true, student: s })}
                      >
                        {/* Tên + email */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: colors.greenAccent, width: 34, height: 34, fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>
                              {avatarLetter(s)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: colors.textBlack }}>
                                {s.full_name || s.username}
                              </Typography>
                              <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }}>
                                {s.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Level */}
                        <TableCell align="center">
                          <Chip
                            label={`Lv. ${lv}`}
                            size="small"
                            sx={{
                              height: 22, fontWeight: 700, fontSize: "0.75rem",
                              bgcolor: `${colors.greenAccent}18`,
                              color: colors.greenAccent,
                            }}
                          />
                        </TableCell>

                        {/* XP progress */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={prog}
                              sx={{
                                flex: 1, height: 6, borderRadius: 3,
                                bgcolor: "rgba(0,0,0,0.08)",
                                "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
                              }}
                            />
                            <Typography sx={{ fontSize: "0.74rem", color: colors.textBlackSoft, minWidth: 32, textAlign: "right" }}>
                              {xp} XP
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Số bài giao */}
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks, fontSize: "0.9rem" }}>
                            {assignCount}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Chi tiết học sinh */}
      {detailDlg.student && (
        <StudentDetailDialog
          open={detailDlg.open}
          onClose={() => setDetailDlg({ open: false, student: null })}
          student={detailDlg.student}
          assignments={assignments}
        />
      )}
    </Box>
  );
};

export default TeacherStudents;
