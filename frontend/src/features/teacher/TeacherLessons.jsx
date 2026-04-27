import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, Switch, FormControlLabel, Skeleton, Alert, Snackbar,
  IconButton, Tooltip, TextField, InputAdornment, CircularProgress,
} from "@mui/material";
import AddRoundedIcon                  from "@mui/icons-material/AddRounded";
import EditRoundedIcon                 from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon               from "@mui/icons-material/DeleteRounded";
import MenuBookRoundedIcon             from "@mui/icons-material/MenuBookRounded";
import SearchRoundedIcon               from "@mui/icons-material/SearchRounded";
import RemoveCircleOutlineRoundedIcon  from "@mui/icons-material/RemoveCircleOutlineRounded";
import AddCircleOutlineRoundedIcon     from "@mui/icons-material/AddCircleOutlineRounded";
import { SbButton, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi    from "@/api/teacherApi";
import vocabularyApi from "@/api/vocabularyApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_COLOR = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" },
  A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" },
  B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" },
  C2: { bg: "#fafafa", color: "#37474f" },
};

const emptyLesson = { title: "", description: "", level: "A1", is_published: false };

// ── Toast nhỏ (Snackbar + Alert) ─────────────────────────────────────────────

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
  <Snackbar
    open={toast.open}
    autoHideDuration={3000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert severity={toast.severity} onClose={onClose} sx={{ borderRadius: "10px", fontWeight: 600 }}>
      {toast.message}
    </Alert>
  </Snackbar>
);

// ── LessonDialog — tạo & sửa bài học ─────────────────────────────────────────

const LessonDialog = ({ open, onClose, initial, onSave, saving, error }) => {
  const [form, setForm] = useState(initial ?? emptyLesson);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    setForm(initial ?? emptyLesson);
  }, [initial, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 1 }}>
        {initial?.id ? "Sửa bài học" : "Tạo bài học mới"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>
        )}
        <SbInput
          label="Tiêu đề bài học *"
          value={form.title}
          onChange={set("title")}
          required
          placeholder="Ví dụ: Du lịch — A1"
          autoFocus
        />
        <SbInput
          label="Mô tả"
          value={form.description}
          onChange={set("description")}
          multiline
          rows={3}
          placeholder="Nội dung ngắn gọn về bài học..."
        />
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Cấp độ</InputLabel>
            <Select value={form.level || "A1"} label="Cấp độ" onChange={set("level")}>
              {LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={!!form.is_published}
                onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: colors.greenAccent },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: colors.greenAccent },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: colors.textBlack }}>
                {form.is_published ? "Công bố ngay" : "Lưu nháp"}
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: "16px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={onClose}>Hủy</SbButton>
        <SbButton
          variant="primary"
          loading={saving}
          disabled={!form.title?.trim()}
          onClick={() => onSave(form)}
        >
          {initial?.id ? "Lưu thay đổi" : "Tạo bài học"}
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── DeleteDialog — xác nhận xóa ──────────────────────────────────────────────

const DeleteDialog = ({ open, onClose, lesson, onConfirm, deleting }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: "16px" } }}>
    <DialogTitle sx={{ fontWeight: 800, color: "#c82014" }}>Xóa bài học</DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: "0.9rem" }}>
        Bạn có chắc muốn xóa bài học{" "}
        <strong style={{ color: colors.greenStarbucks }}>"{lesson?.title}"</strong>?{" "}
        Hành động này <strong>không thể hoàn tác</strong>.
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
        Xóa
      </SbButton>
    </DialogActions>
  </Dialog>
);

// ── WordsDialog — quản lý từ trong bài ───────────────────────────────────────

const WordsDialog = ({ open, onClose, lesson }) => {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { toast, show, close: closeToast } = useToast();

  // Chi tiết bài (kèm danh sách từ)
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["lesson-detail", lesson?.id],
    queryFn: () => teacherApi.getLesson(lesson.id).then((r) => r.data),
    enabled: open && !!lesson?.id,
    staleTime: 0,
  });

  // Tìm từ để thêm (debounced via staleTime)
  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ["word-search-teacher", search],
    queryFn: () =>
      vocabularyApi.getWords({ search, page_size: 10 }).then((r) => r.data),
    enabled: search.length >= 2,
    staleTime: 30_000,
  });

  const wordsInLesson    = detail?.words ?? [];
  const currentWordIds   = new Set(wordsInLesson.map((lw) => lw.word.id));
  const searchResults    = searchData?.results ?? [];

  const addMut = useMutation({
    mutationFn: (wordId) => teacherApi.addWordToLesson(lesson.id, wordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-detail", lesson.id] });
      qc.invalidateQueries({ queryKey: ["teacher-lessons"] });
      show("Đã thêm từ vào bài học");
    },
    onError: (e) =>
      show(e.response?.data?.detail ?? "Thêm từ thất bại", "error"),
  });

  const removeMut = useMutation({
    mutationFn: (wordId) => teacherApi.removeWordFromLesson(lesson.id, wordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-detail", lesson.id] });
      qc.invalidateQueries({ queryKey: ["teacher-lessons"] });
      show("Đã xóa từ khỏi bài học");
    },
    onError: () => show("Xóa từ thất bại", "error"),
  });

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MenuBookRoundedIcon sx={{ color: colors.greenAccent }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
                Quản lý từ vựng
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft, fontWeight: 400 }}>
                {lesson?.title} — {wordsInLesson.length} từ
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", sm: "row" } }}>

            {/* Trái: từ trong bài */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Từ trong bài ({wordsInLesson.length})
              </Typography>
              <Box sx={{
                border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px",
                maxHeight: 380, overflowY: "auto",
                bgcolor: "#fafafa",
              }}>
                {loadingDetail
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <Skeleton width="55%" height={18} />
                        <Skeleton width="38%" height={14} />
                      </Box>
                    ))
                  : wordsInLesson.length === 0
                    ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
                          Chưa có từ. Thêm từ bên phải →
                        </Typography>
                      </Box>
                    )
                    : wordsInLesson.map((lw) => (
                        <Box
                          key={lw.id}
                          sx={{
                            display: "flex", alignItems: "center",
                            px: 2, py: 1.25,
                            borderBottom: "1px solid rgba(0,0,0,0.06)",
                            "&:last-child": { borderBottom: "none" },
                            "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: colors.textBlack }}>
                              {lw.word.text}
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }} noWrap>
                              {lw.word.definition_vi}
                            </Typography>
                          </Box>
                          <Tooltip title="Xóa khỏi bài">
                            <IconButton
                              size="small"
                              onClick={() => removeMut.mutate(lw.word.id)}
                              disabled={removeMut.isPending}
                              sx={{ color: "#c82014", "&:hover": { bgcolor: "#fdecea" }, ml: 0.5 }}
                            >
                              <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
              </Box>
            </Box>

            {/* Phải: tìm từ để thêm */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Thêm từ mới
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm từ vựng (nhập ≥ 2 ký tự)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searching
                        ? <CircularProgress size={16} sx={{ color: colors.greenAccent }} />
                        : <SearchRoundedIcon sx={{ color: colors.textBlackSoft, fontSize: 20 }} />}
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1.5 }}
              />
              <Box sx={{
                border: "1px solid rgba(0,0,0,0.08)", borderRadius: "12px",
                maxHeight: 330, overflowY: "auto",
                bgcolor: "#fafafa",
              }}>
                {search.length < 2
                  ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <SearchRoundedIcon sx={{ fontSize: 32, color: colors.textBlackSoft, opacity: 0.3, mb: 1 }} />
                      <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
                        Nhập từ khoá để tìm kiếm
                      </Typography>
                    </Box>
                  )
                  : searchResults.length === 0 && !searching
                    ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
                          Không tìm thấy kết quả.
                        </Typography>
                      </Box>
                    )
                    : searchResults.map((word) => {
                        const inLesson = currentWordIds.has(word.id);
                        return (
                          <Box
                            key={word.id}
                            sx={{
                              display: "flex", alignItems: "center",
                              px: 2, py: 1.25,
                              borderBottom: "1px solid rgba(0,0,0,0.06)",
                              "&:last-child": { borderBottom: "none" },
                              "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                              opacity: inLesson ? 0.45 : 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                                {word.text}
                                {word.phonetic && (
                                  <Typography component="span" sx={{ fontSize: "0.76rem", color: colors.textBlackSoft, ml: 0.75, fontWeight: 400 }}>
                                    {word.phonetic}
                                  </Typography>
                                )}
                              </Typography>
                              <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }} noWrap>
                                {word.definition_vi}
                              </Typography>
                            </Box>
                            <Tooltip title={inLesson ? "Đã có trong bài" : "Thêm vào bài"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => !inLesson && addMut.mutate(word.id)}
                                  disabled={inLesson || addMut.isPending}
                                  sx={{
                                    ml: 0.5,
                                    color: inLesson ? colors.textBlackSoft : colors.greenAccent,
                                    "&:hover": { bgcolor: inLesson ? "transparent" : `${colors.greenAccent}18` },
                                  }}
                                >
                                  <AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        );
                      })}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <SbButton variant="outlined" onClick={onClose}>Đóng</SbButton>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const TeacherLessons = () => {
  const qc = useQueryClient();
  const { toast, show, close: closeToast } = useToast();

  const [lessonDlg, setLessonDlg] = useState({ open: false, data: null });
  const [deleteDlg, setDeleteDlg] = useState({ open: false, lesson: null });
  const [wordsDlg,  setWordsDlg]  = useState({ open: false, lesson: null });
  const [formError, setFormError] = useState("");

  // Fetch danh sách bài học của giáo viên này
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-lessons"],
    queryFn: () =>
      teacherApi.getLessons({ ordering: "-created_at", page_size: 100 }).then((r) => r.data),
  });

  const lessons = data?.results ?? [];

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: (d) => teacherApi.createLesson(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-lessons"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
      setLessonDlg({ open: false, data: null });
      setFormError("");
      show("Tạo bài học thành công!");
    },
    onError: (e) =>
      setFormError(
        e.response?.data?.title?.[0] ??
        e.response?.data?.detail ??
        "Tạo bài học thất bại."
      ),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => teacherApi.updateLesson(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-lessons"] });
      setLessonDlg({ open: false, data: null });
      setFormError("");
      show("Đã cập nhật bài học!");
    },
    onError: (e) =>
      setFormError(
        e.response?.data?.title?.[0] ??
        e.response?.data?.detail ??
        "Cập nhật thất bại."
      ),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => teacherApi.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-lessons"] });
      qc.invalidateQueries({ queryKey: ["teacher-stats"] });
      setDeleteDlg({ open: false, lesson: null });
      show("Đã xóa bài học.");
    },
    onError: () => show("Xóa bài học thất bại.", "error"),
  });

  const handleSave = (form) => {
    setFormError("");
    if (lessonDlg.data?.id) {
      updateMut.mutate({ id: lessonDlg.data.id, ...form });
    } else {
      createMut.mutate(form);
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Quản lý bài học
          </Typography>
          {!isLoading && (
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              {lessons.length} bài học
            </Typography>
          )}
        </Box>
        <SbButton
          variant="primary"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setFormError("");
            setLessonDlg({ open: true, data: null });
          }}
        >
          Tạo bài học mới
        </SbButton>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách bài học. Vui lòng thử lại.
        </Alert>
      )}

      {/* Bảng danh sách */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
      >
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
              <TableCell>Tiêu đề bài học</TableCell>
              <TableCell align="center" sx={{ width: 90 }}>Cấp độ</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>Số từ</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : lessons.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 7 }}>
                      <MenuBookRoundedIcon sx={{ fontSize: 48, color: colors.greenAccent, opacity: 0.25, mb: 1 }} />
                      <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.875rem" }}>
                        Chưa có bài học nào. Nhấn "Tạo bài học mới" để bắt đầu.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : lessons.map((lesson) => {
                    const lc = LEVEL_COLOR[lesson.level] ?? {};
                    return (
                      <TableRow
                        key={lesson.id}
                        hover
                        sx={{ "&:last-child td": { borderBottom: 0 }, cursor: "default" }}
                      >
                        {/* Tiêu đề */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.textBlack }}>
                            {lesson.title}
                          </Typography>
                          {lesson.description && (
                            <Typography
                              sx={{ fontSize: "0.78rem", color: colors.textBlackSoft, mt: 0.25 }}
                              noWrap
                            >
                              {lesson.description}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Cấp độ */}
                        <TableCell align="center">
                          {lesson.level
                            ? (
                              <Chip
                                label={lesson.level}
                                size="small"
                                sx={{
                                  bgcolor: lc.bg,
                                  color: lc.color,
                                  fontWeight: 700,
                                  fontSize: "0.74rem",
                                  height: 22,
                                }}
                              />
                            )
                            : <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.82rem" }}>—</Typography>}
                        </TableCell>

                        {/* Số từ */}
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks, fontSize: "0.9rem" }}>
                            {lesson.word_count ?? 0}
                          </Typography>
                        </TableCell>

                        {/* Trạng thái */}
                        <TableCell align="center">
                          <Chip
                            label={lesson.is_published ? "Đã công bố" : "Bản nháp"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              height: 22,
                              bgcolor: lesson.is_published
                                ? `${colors.greenAccent}1a`
                                : "rgba(0,0,0,0.07)",
                              color: lesson.is_published
                                ? colors.greenAccent
                                : colors.textBlackSoft,
                            }}
                          />
                        </TableCell>

                        {/* Thao tác */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
                            <Tooltip title="Quản lý từ vựng" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setWordsDlg({ open: true, lesson })}
                                sx={{
                                  color: colors.greenAccent,
                                  "&:hover": { bgcolor: `${colors.greenAccent}15` },
                                }}
                              >
                                <MenuBookRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sửa bài học" arrow>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setFormError("");
                                  setLessonDlg({ open: true, data: lesson });
                                }}
                                sx={{
                                  color: colors.textBlackSoft,
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                                }}
                              >
                                <EditRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa bài học" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteDlg({ open: true, lesson })}
                                sx={{
                                  color: "#c82014",
                                  "&:hover": { bgcolor: "#fdecea" },
                                }}
                              >
                                <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <LessonDialog
        open={lessonDlg.open}
        onClose={() => setLessonDlg({ open: false, data: null })}
        initial={lessonDlg.data}
        onSave={handleSave}
        saving={isSaving}
        error={formError}
      />

      <DeleteDialog
        open={deleteDlg.open}
        onClose={() => setDeleteDlg({ open: false, lesson: null })}
        lesson={deleteDlg.lesson}
        onConfirm={() => deleteMut.mutate(deleteDlg.lesson?.id)}
        deleting={deleteMut.isPending}
      />

      {wordsDlg.lesson && (
        <WordsDialog
          open={wordsDlg.open}
          onClose={() => setWordsDlg({ open: false, lesson: null })}
          lesson={wordsDlg.lesson}
        />
      )}

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default TeacherLessons;
