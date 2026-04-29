import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, Skeleton, Alert, Snackbar, IconButton, Tooltip,
  TextField, InputAdornment, Checkbox, CircularProgress,
  ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import AddRoundedIcon          from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon       from "@mui/icons-material/DeleteRounded";
import AssignmentRoundedIcon   from "@mui/icons-material/AssignmentRounded";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import PeopleRoundedIcon       from "@mui/icons-material/PeopleRounded";
import GroupsRoundedIcon       from "@mui/icons-material/GroupsRounded";
import { SbButton, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

const useToast = () => {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const show = useCallback(
    (message, severity = "success") => setToast({ open: true, message, severity }),
    [],
  );
  const close = () => setToast((p) => ({ ...p, open: false }));
  return { toast, show, close };
};

const Toast = ({ toast, onClose }) => (
  <Snackbar open={toast.open} autoHideDuration={3000} onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
    <Alert severity={toast.severity} onClose={onClose} sx={{ borderRadius: "10px", fontWeight: 600 }}>
      {toast.message}
    </Alert>
  </Snackbar>
);

// ── AssignDialog — giao bài mới ───────────────────────────────────────────────

const AssignDialog = ({ open, onClose, onSave, onSaveClass, saving, error }) => {
  const [mode, setMode]             = useState("students"); // "students" | "class"
  const [lessonId, setLessonId]     = useState("");
  const [studentIds, setStudentIds] = useState([]);
  const [classId, setClassId]       = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const { data: lessonData, isLoading: loadingLessons } = useQuery({
    queryKey: ["teacher-lessons-for-assign"],
    queryFn: () =>
      teacherApi.getLessons({ ordering: "-created_at", page_size: 100 }).then((r) => r.data),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: studentData, isLoading: loadingStudents, isFetching: fetchingStudents } = useQuery({
    queryKey: ["teacher-students", studentSearch],
    queryFn: () =>
      teacherApi.getStudents({ search: studentSearch || undefined, page_size: 100 }).then((r) => r.data),
    enabled: open && mode === "students",
    staleTime: 30_000,
  });

  const { data: classData, isLoading: loadingClasses } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => teacherApi.getClasses().then((r) => r.data),
    enabled: open && mode === "class",
    staleTime: 30_000,
  });

  const lessons  = (lessonData?.results ?? []).filter((l) => l.is_published);
  const students = studentData?.results ?? [];
  const classes  = classData?.results ?? classData ?? [];

  const reset = () => {
    setLessonId(""); setStudentIds([]); setClassId("");
    setDueDate(""); setStudentSearch(""); setMode("students");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    if (mode === "class") {
      onSaveClass({ class_id: classId, lesson_id: lessonId, due_date: dueDate || null });
    } else {
      onSave({ lesson_id: lessonId, student_ids: studentIds, due_date: dueDate || null });
    }
  };

  const canSave = lessonId && (mode === "class" ? !!classId : studentIds.length > 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 1 }}>
        Giao bài học mới
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        {error && <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>}

        {/* Toggle mode */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ alignSelf: "flex-start" }}
        >
          <ToggleButton value="students"
            sx={{ gap: 0.75, fontWeight: 700, fontSize: "0.8rem", textTransform: "none",
              "&.Mui-selected": { bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, borderColor: `${colors.greenAccent}60` } }}>
            <PeopleRoundedIcon sx={{ fontSize: 17 }} />
            Học sinh cụ thể
          </ToggleButton>
          <ToggleButton value="class"
            sx={{ gap: 0.75, fontWeight: 700, fontSize: "0.8rem", textTransform: "none",
              "&.Mui-selected": { bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent, borderColor: `${colors.greenAccent}60` } }}>
            <GroupsRoundedIcon sx={{ fontSize: 17 }} />
            Cả lớp
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Chọn bài học */}
        <FormControl fullWidth size="small">
          <InputLabel>Chọn bài học *</InputLabel>
          <Select
            value={lessonId}
            label="Chọn bài học *"
            onChange={(e) => setLessonId(e.target.value)}
            disabled={loadingLessons}
          >
            {loadingLessons
              ? <MenuItem disabled><CircularProgress size={16} /></MenuItem>
              : lessons.length === 0
                ? <MenuItem disabled>Không có bài học đã công bố</MenuItem>
                : lessons.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{l.title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>
                          {l.level} · {l.word_count ?? 0} từ
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
          </Select>
        </FormControl>

        {/* Chọn lớp (mode = class) */}
        {mode === "class" && (
          <FormControl fullWidth size="small">
            <InputLabel>Chọn lớp *</InputLabel>
            <Select
              value={classId}
              label="Chọn lớp *"
              onChange={(e) => setClassId(e.target.value)}
              disabled={loadingClasses}
            >
              {loadingClasses
                ? <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                : classes.length === 0
                  ? <MenuItem disabled>Chưa có lớp học nào</MenuItem>
                  : classes.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>
                            {c.student_count ?? 0} học sinh
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
            </Select>
          </FormControl>
        )}

        {/* Chọn học sinh (mode = students) */}
        {mode === "students" && (
          <Box>
            <TextField
              fullWidth size="small"
              placeholder="Tìm học sinh theo tên hoặc email..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {fetchingStudents
                      ? <CircularProgress size={14} sx={{ color: colors.greenAccent }} />
                      : <SearchRoundedIcon sx={{ fontSize: 18, color: colors.textBlackSoft }} />}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ border: "1px solid rgba(0,0,0,0.23)", borderRadius: "8px", maxHeight: 200, overflowY: "auto" }}>
              {loadingStudents
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ px: 2, py: 1 }}><Skeleton width="60%" /></Box>
                  ))
                : students.length === 0
                  ? (
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
                        {studentSearch ? "Không tìm thấy học sinh." : "Chưa có học sinh nào."}
                      </Typography>
                    </Box>
                  )
                  : students.map((s) => {
                      const checked = studentIds.includes(s.id);
                      return (
                        <Box key={s.id}
                          onClick={() =>
                            setStudentIds((prev) =>
                              checked ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            )
                          }
                          sx={{
                            display: "flex", alignItems: "center", gap: 1,
                            px: 1.5, py: 1, cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                            "&:last-child": { borderBottom: "none" },
                            "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                            bgcolor: checked ? `${colors.greenAccent}0c` : "transparent",
                          }}
                        >
                          <Checkbox size="small" checked={checked} onChange={() => {}}
                            sx={{ p: 0.25, "&.Mui-checked": { color: colors.greenAccent } }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: colors.textBlack }}>
                              {s.full_name || s.username}
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }}>
                              {s.email}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
            </Box>

            {studentIds.length > 0 && (
              <Typography sx={{ fontSize: "0.78rem", color: colors.greenAccent, mt: 0.75, fontWeight: 600 }}>
                Đã chọn {studentIds.length} học sinh
              </Typography>
            )}
          </Box>
        )}

        {/* Hạn nộp */}
        <SbInput
          label="Hạn hoàn thành (tuỳ chọn)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split("T")[0] }}
        />
      </DialogContent>

      <DialogActions sx={{ p: "16px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={handleClose}>Hủy</SbButton>
        <SbButton variant="primary" loading={saving} disabled={!canSave} onClick={handleSave}>
          Giao bài
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── DeleteDialog — xác nhận thu hồi ──────────────────────────────────────────

const RevokeDialog = ({ open, onClose, assignment, onConfirm, deleting }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: "16px" } }}>
    <DialogTitle sx={{ fontWeight: 800, color: "#c82014" }}>Thu hồi bài học</DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: "0.9rem" }}>
        Thu hồi bài{" "}
        <strong style={{ color: colors.greenStarbucks }}>{assignment?.lesson_title}</strong>{" "}
        của học sinh <strong>{assignment?.student_email}</strong>?
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: "16px 24px", gap: 1 }}>
      <SbButton variant="outlined" onClick={onClose}>Hủy</SbButton>
      <SbButton
        variant="primary"
        loading={deleting}
        sx={{ bgcolor: "#c82014 !important", "&:hover": { bgcolor: "#a01510 !important" } }}
        onClick={onConfirm}
      >
        Thu hồi
      </SbButton>
    </DialogActions>
  </Dialog>
);

// ── Main TeacherAssignments ───────────────────────────────────────────────────

const TeacherAssignments = () => {
  const qc = useQueryClient();
  const { toast, show, close: closeToast } = useToast();

  const [assignDlg, setAssignDlg] = useState(false);
  const [revokeDlg, setRevokeDlg] = useState({ open: false, assignment: null });
  const [formError, setFormError] = useState("");

  // Danh sách assignment
  const { data: assignData, isLoading, isError } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => teacherApi.getAssignments().then((r) => r.data),
  });

  const assignments = assignData?.results ?? assignData ?? [];

  // Mutations
  const createMut = useMutation({
    mutationFn: (d) => teacherApi.createAssignment(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
      setAssignDlg(false);
      setFormError("");
      const { assigned, skipped } = res.data;
      show(`Giao thành công cho ${assigned} học sinh${skipped ? ` (bỏ qua ${skipped} đã giao)` : ""}.`);
    },
    onError: (e) => {
      const detail =
        e.response?.data?.student_ids?.[0] ??
        e.response?.data?.lesson_id?.[0] ??
        e.response?.data?.detail ??
        "Giao bài thất bại.";
      setFormError(detail);
    },
  });

  const createClassMut = useMutation({
    mutationFn: ({ class_id, lesson_id, due_date }) =>
      teacherApi.assignLessonToClass(class_id, { lesson_id, due_date }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
      setAssignDlg(false);
      setFormError("");
      const { assigned, skipped, class_name } = res.data;
      show(`Giao bài cho lớp "${class_name}": ${assigned} học sinh${skipped ? ` (bỏ qua ${skipped})` : ""}.`);
    },
    onError: (e) => {
      const detail = e.response?.data?.detail ?? "Giao bài thất bại.";
      setFormError(detail);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => teacherApi.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
      setRevokeDlg({ open: false, assignment: null });
      show("Đã thu hồi bài học.");
    },
    onError: () => show("Thu hồi thất bại.", "error"),
  });

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Giao bài cho học sinh
          </Typography>
          {!isLoading && (
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              {assignments.length} bài đang giao
            </Typography>
          )}
        </Box>
        <SbButton
          variant="primary"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setFormError(""); setAssignDlg(true); }}
        >
          Giao bài mới
        </SbButton>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách. Vui lòng thử lại.
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
              <TableCell>Bài học</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Ngày giao</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Hạn nộp</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ width: 80 }}>Thu hồi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : assignments.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                      <AssignmentRoundedIcon sx={{ fontSize: 48, color: colors.greenAccent, opacity: 0.25, mb: 1 }} />
                      <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.875rem" }}>
                        Chưa giao bài cho học sinh nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : assignments.map((a) => (
                    <TableRow key={a.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                          {a.student_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.88rem" }} noWrap>
                          {a.lesson_title}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontSize: "0.82rem", color: colors.textBlackSoft }}>
                          {fmtDate(a.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{
                          fontSize: "0.82rem",
                          color: a.due_date && new Date(a.due_date) < new Date() && !a.is_completed
                            ? "#c82014"
                            : colors.textBlackSoft,
                          fontWeight: a.due_date && new Date(a.due_date) < new Date() && !a.is_completed ? 700 : 400,
                        }}>
                          {a.due_date ? fmtDate(a.due_date) : "Không hạn"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={a.is_completed ? "Hoàn thành" : "Chưa xong"}
                          size="small"
                          sx={{
                            height: 22, fontWeight: 700, fontSize: "0.74rem",
                            bgcolor: a.is_completed ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                            color: a.is_completed ? colors.greenAccent : colors.textBlackSoft,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Thu hồi bài" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setRevokeDlg({ open: true, assignment: a })}
                            sx={{ color: "#c82014", "&:hover": { bgcolor: "#fdecea" } }}
                          >
                            <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <AssignDialog
        open={assignDlg}
        onClose={() => setAssignDlg(false)}
        onSave={(d) => createMut.mutate(d)}
        onSaveClass={(d) => createClassMut.mutate(d)}
        saving={createMut.isPending || createClassMut.isPending}
        error={formError}
      />

      <RevokeDialog
        open={revokeDlg.open}
        onClose={() => setRevokeDlg({ open: false, assignment: null })}
        assignment={revokeDlg.assignment}
        onConfirm={() => deleteMut.mutate(revokeDlg.assignment?.id)}
        deleting={deleteMut.isPending}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default TeacherAssignments;
