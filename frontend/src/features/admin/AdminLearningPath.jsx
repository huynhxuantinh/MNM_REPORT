import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Chip, Collapse, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, Skeleton, Alert, Snackbar, Switch,
  FormControlLabel, Tooltip, Stack, Divider, InputAdornment,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  DeleteRounded as DeleteIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  ExpandLessRounded as ExpandLessIcon,
  SchoolRounded as SchoolIcon,
  MenuBookRounded as MenuBookIcon,
  SearchRounded as SearchIcon,
  RemoveCircleOutlineRounded as RemoveIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";

// ── Course Dialog ─────────────────────────────────────────────────────────────

const CourseDialog = ({ open, course, onClose, onSave }) => {
  const [form, setForm] = useState(
    course
      ? { name: course.name, slug: course.slug, description: course.description ?? "", is_active: course.is_active }
      : { name: "", slug: "", description: "", is_active: true }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const auto_slug = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: course ? f.slug : auto_slug(name) }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
        {course ? "Sửa khoá học" : "Thêm khoá học mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField label="Tên khoá học" value={form.name} onChange={handleNameChange} size="small" fullWidth required />
        <TextField label="Slug (URL)" value={form.slug} onChange={set("slug")} size="small" fullWidth required
          helperText="Dùng trong URL: /learning/courses/slug" />
        <TextField label="Mô tả" value={form.description} onChange={set("description")} size="small" fullWidth multiline rows={3} />
        <FormControlLabel
          control={<Switch checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />}
          label="Kích hoạt"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={() => onSave(form)} sx={{ bgcolor: ADMIN_ACCENT }}>
          {course ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Unit Dialog ───────────────────────────────────────────────────────────────

const UnitDialog = ({ open, unit, courseId, onClose, onSave }) => {
  const [form, setForm] = useState(
    unit
      ? {
          title: unit.title,
          description: unit.description ?? "",
          order_index: unit.order_index,
          required_lessons_to_unlock: unit.required_lessons_to_unlock,
          is_published: unit.is_published,
          course: courseId,
        }
      : { title: "", description: "", order_index: 0, required_lessons_to_unlock: 0, is_published: false, course: courseId }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
        {unit ? "Sửa unit" : "Thêm unit mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField label="Tiêu đề" value={form.title} onChange={set("title")} size="small" fullWidth required />
        <TextField label="Mô tả" value={form.description} onChange={set("description")} size="small" fullWidth multiline rows={2} />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Thứ tự" type="number" value={form.order_index}
            onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) }))}
            size="small" sx={{ flex: 1 }}
          />
          <TextField
            label="Bài cần để mở khoá" type="number" value={form.required_lessons_to_unlock}
            onChange={(e) => setForm((f) => ({ ...f, required_lessons_to_unlock: Number(e.target.value) }))}
            size="small" sx={{ flex: 1 }}
          />
        </Stack>
        <FormControlLabel
          control={<Switch checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />}
          label="Công khai"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={() => onSave(form)} sx={{ bgcolor: ADMIN_ACCENT }}>
          {unit ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Manage Lessons Dialog ─────────────────────────────────────────────────────

const ManageLessonsDialog = ({ open, unit, onClose }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const { data: unitLessons = [], isLoading: loadingUnit } = useQuery({
    queryKey: ["admin-unit-lessons", unit?.id],
    queryFn: () => learningApi.getAdminUnitLessons(unit.id).then((r) => r.data),
    enabled: Boolean(unit?.id),
  });

  const { data: lessonSearch } = useQuery({
    queryKey: ["admin-lesson-search", search],
    queryFn: () => learningApi.getLessons({ search, page_size: 20 }).then((r) => r.data),
    enabled: search.length > 0,
    placeholderData: (prev) => prev,
  });

  const existingIds = new Set(unitLessons.map((ul) => ul.lesson));

  const { mutate: addLesson } = useMutation({
    mutationFn: (lessonId) => learningApi.addLessonToUnit(unit.id, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unit-lessons", unit?.id] });
      setToast({ msg: "Đã thêm bài học vào unit.", severity: "success" });
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail ?? "Thêm thất bại.";
      setToast({ msg, severity: "error" });
    },
  });

  const { mutate: removeLesson } = useMutation({
    mutationFn: (lessonId) => learningApi.removeLessonFromUnit(unit.id, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unit-lessons", unit?.id] });
      setToast({ msg: "Đã xóa bài học khỏi unit.", severity: "success" });
    },
  });

  const searchResults = lessonSearch?.results ?? [];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
          Quản lý bài học — {unit?.title}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", gap: 2, pt: "16px !important", minHeight: 400 }}>
          {/* Left: current lessons */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>
              Bài học trong unit ({unitLessons.length})
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 360 }}>
              {loadingUnit
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={44} sx={{ mb: 1, borderRadius: 2 }} />)
                : unitLessons.map((ul) => (
                    <Box
                      key={ul.id}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", mb: 0.75 }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{ul.lesson_title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {ul.lesson_level} · {ul.lesson_word_count} từ
                        </Typography>
                      </Box>
                      <Tooltip title="Xóa khỏi unit">
                        <IconButton size="small" color="error" onClick={() => removeLesson(ul.lesson)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
              {!loadingUnit && unitLessons.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", textAlign: "center", mt: 4 }}>
                  Chưa có bài học nào
                </Typography>
              )}
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Right: search and add */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>
              Tìm và thêm bài học
            </Typography>
            <TextField
              size="small" fullWidth
              placeholder="Tìm tên bài học…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment>,
              }}
            />
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
              {searchResults.map((lesson) => {
                const inUnit = existingIds.has(lesson.id);
                return (
                  <Box
                    key={lesson.id}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", mb: 0.75, opacity: inUnit ? 0.5 : 1 }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{lesson.title}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        {lesson.level} · {lesson.word_count ?? 0} từ
                      </Typography>
                    </Box>
                    <Button
                      size="small" variant="outlined"
                      disabled={inUnit}
                      onClick={() => addLesson(lesson.id)}
                      sx={{ fontSize: "0.75rem", minWidth: 60 }}
                    >
                      {inUnit ? "Đã có" : "Thêm"}
                    </Button>
                  </Box>
                );
              })}
              {search.length > 0 && searchResults.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", textAlign: "center", mt: 4 }}>
                  Không tìm thấy bài học
                </Typography>
              )}
              {search.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", textAlign: "center", mt: 4 }}>
                  Nhập tên để tìm kiếm
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  );
};

// ── Unit Row ──────────────────────────────────────────────────────────────────

const UnitRow = ({ unit, courseId, onEdit, onDelete }) => {
  const [manageLessons, setManageLessons] = useState(false);

  return (
    <>
      <TableRow sx={{ bgcolor: "rgba(0,0,0,0.015)", "&:hover": { bgcolor: "rgba(0,0,0,0.03)" } }}>
        <TableCell sx={{ pl: 6, fontSize: "0.85rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MenuBookIcon sx={{ fontSize: 16, color: ADMIN_ACCENT }} />
            {unit.title}
          </Box>
        </TableCell>
        <TableCell>
          <Chip label={unit.is_published ? "Công khai" : "Ẩn"} color={unit.is_published ? "success" : "default"} size="small" sx={{ fontSize: "0.72rem" }} />
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {unit.lesson_count} bài
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          Cần {unit.required_lessons_to_unlock} bài
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Quản lý bài học">
            <IconButton size="small" onClick={() => setManageLessons(true)} sx={{ color: ADMIN_ACCENT }}>
              <MenuBookIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sửa">
            <IconButton size="small" onClick={() => onEdit(unit)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => onDelete(unit)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <ManageLessonsDialog open={manageLessons} unit={unit} onClose={() => setManageLessons(false)} />
    </>
  );
};

// ── Course Row ────────────────────────────────────────────────────────────────

const CourseRow = ({ course, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [addUnit, setAddUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["admin-units", course.id],
    queryFn: () => learningApi.getAdminUnits(course.id).then((r) => r.data),
    enabled: expanded,
  });

  const { mutate: createUnit } = useMutation({
    mutationFn: (data) => learningApi.createAdminUnit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units", course.id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setAddUnit(false);
      setToast({ msg: "Đã tạo unit.", severity: "success" });
    },
  });

  const { mutate: updateUnit } = useMutation({
    mutationFn: ({ id, data }) => learningApi.updateAdminUnit(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units", course.id] });
      setEditUnit(null);
      setToast({ msg: "Đã cập nhật unit.", severity: "success" });
    },
  });

  const { mutate: delUnit } = useMutation({
    mutationFn: (id) => learningApi.deleteAdminUnit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units", course.id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteUnit(null);
      setToast({ msg: "Đã xóa unit.", severity: "success" });
    },
  });

  return (
    <>
      <TableRow
        sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8f9ff" } }}
        onClick={() => setExpanded((v) => !v)}
      >
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, color: ADMIN_BG }}>
            <SchoolIcon sx={{ fontSize: 18, color: ADMIN_ACCENT }} />
            {course.name}
            {expanded ? <ExpandLessIcon sx={{ fontSize: 18, ml: 0.5, color: "text.disabled" }} /> : <ExpandMoreIcon sx={{ fontSize: 18, ml: 0.5, color: "text.disabled" }} />}
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{course.slug}</Typography>
        </TableCell>
        <TableCell>
          <Chip label={course.is_active ? "Hoạt động" : "Ẩn"} color={course.is_active ? "success" : "default"} size="small" sx={{ fontSize: "0.72rem" }} />
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {course.unit_count} unit
        </TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {course.created_at ? new Date(course.created_at).toLocaleDateString("vi-VN") : "—"}
        </TableCell>
        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Sửa">
            <IconButton size="small" onClick={() => onEdit(course)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xóa">
            <IconButton size="small" color="error" onClick={() => onDelete(course)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* Expanded units */}
      {expanded && (
        <>
          {isLoading
            ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ pl: 6 }}>
                  <Skeleton height={36} />
                </TableCell>
              </TableRow>
            )
            : units.map((unit) => (
                <UnitRow
                  key={unit.id}
                  unit={unit}
                  courseId={course.id}
                  onEdit={(u) => setEditUnit(u)}
                  onDelete={(u) => setDeleteUnit(u)}
                />
              ))}
          <TableRow>
            <TableCell colSpan={5} sx={{ pl: 6, py: 1 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={(e) => { e.stopPropagation(); setAddUnit(true); }}
                sx={{ fontSize: "0.8rem", color: ADMIN_ACCENT }}
              >
                Thêm unit
              </Button>
            </TableCell>
          </TableRow>
        </>
      )}

      {/* Add unit dialog */}
      {addUnit && (
        <UnitDialog
          open
          unit={null}
          courseId={course.id}
          onClose={() => setAddUnit(false)}
          onSave={(data) => createUnit(data)}
        />
      )}

      {/* Edit unit dialog */}
      {editUnit && (
        <UnitDialog
          open
          unit={editUnit}
          courseId={course.id}
          onClose={() => setEditUnit(null)}
          onSave={(data) => updateUnit({ id: editUnit.id, data })}
        />
      )}

      {/* Delete unit confirm */}
      <Dialog open={Boolean(deleteUnit)} onClose={() => setDeleteUnit(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>Xóa unit?</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa unit <strong>{deleteUnit?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteUnit(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={() => delUnit(deleteUnit.id)}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const AdminLearningPath = () => {
  const qc = useQueryClient();
  const [addCourse, setAddCourse] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => learningApi.getAdminCourses().then((r) => r.data),
  });

  const { mutate: createCourse } = useMutation({
    mutationFn: (data) => learningApi.createAdminCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setAddCourse(false);
      setToast({ msg: "Đã tạo khoá học.", severity: "success" });
    },
  });

  const { mutate: updateCourse } = useMutation({
    mutationFn: ({ id, data }) => learningApi.updateAdminCourse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditCourse(null);
      setToast({ msg: "Đã cập nhật khoá học.", severity: "success" });
    },
  });

  const { mutate: delCourse } = useMutation({
    mutationFn: (id) => learningApi.deleteAdminCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteCourse(null);
      setToast({ msg: "Đã xóa khoá học.", severity: "success" });
    },
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Lộ trình học
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            Quản lý khoá học → unit → bài học
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddCourse(true)}
          sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
        >
          Thêm khoá học
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Khoá học / Unit</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Số lượng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Ngày tạo / Yêu cầu</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={32} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : courses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onEdit={(c) => setEditCourse(c)}
                    onDelete={(c) => setDeleteCourse(c)}
                  />
                ))}
            {!isLoading && courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.disabled" }}>
                  Chưa có khoá học nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add course dialog */}
      {addCourse && (
        <CourseDialog open onClose={() => setAddCourse(false)} onSave={(data) => createCourse(data)} />
      )}

      {/* Edit course dialog */}
      {editCourse && (
        <CourseDialog open course={editCourse} onClose={() => setEditCourse(null)} onSave={(data) => updateCourse({ id: editCourse.id, data })} />
      )}

      {/* Delete course confirm */}
      <Dialog open={Boolean(deleteCourse)} onClose={() => setDeleteCourse(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>Xóa khoá học?</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa khoá học <strong>{deleteCourse?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteCourse(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={() => delCourse(deleteCourse.id)}>Xóa</Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLearningPath;
