import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Skeleton,
  Alert,
  Snackbar,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Stack,
  Divider,
  InputAdornment,
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

const autoSlug = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const extractErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === "string") return first;
  return fallback;
};

const ACTIVITY_TYPES = [
  { value: "vocab", label: "Từ vựng", target: "lesson" },
  { value: "grammar", label: "Ngữ pháp", target: "lesson" },
  { value: "listening", label: "Nghe", target: "listening_passage" },
  { value: "writing", label: "Viết", target: null },
  { value: "quiz", label: "Quiz", target: "quiz" },
  { value: "checkpoint", label: "Checkpoint", target: "quiz" },
];

const activityLabel = (type) => ACTIVITY_TYPES.find((item) => item.value === type)?.label || type;

const parseMetadata = (value) => {
  const text = String(value || "").trim();
  if (!text) return {};
  return JSON.parse(text);
};

const CourseDialog = ({ open, course, existingSlugs, onClose, onSave }) => {
  const [form, setForm] = useState(
    course
      ? { name: course.name, slug: course.slug, description: course.description ?? "", is_active: course.is_active }
      : { name: "", slug: "", description: "", is_active: true },
  );

  const normalizedSlug = form.slug.trim().toLowerCase();
  const slugTaken = existingSlugs.has(normalizedSlug) && normalizedSlug !== (course?.slug || "").toLowerCase();

  const handleNameChange = (event) => {
    const name = event.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: course ? prev.slug : autoSlug(name),
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
        {course ? "Sửa khóa học" : "Thêm khóa học mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField label="Tên khóa học" value={form.name} onChange={handleNameChange} size="small" fullWidth required />
        <TextField
          label="Slug (URL)"
          value={form.slug}
          onChange={(event) => setForm((prev) => ({ ...prev, slug: autoSlug(event.target.value) }))}
          size="small"
          fullWidth
          required
          error={slugTaken}
          helperText={slugTaken ? "Slug đã tồn tại. Hãy chọn slug khác." : "Dùng trong URL: /learning/courses/slug"}
        />
        <TextField label="Mô tả" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} size="small" fullWidth multiline rows={3} />
        <FormControlLabel
          control={<Switch checked={form.is_active} onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))} />}
          label="Kích hoạt"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ ...form, slug: normalizedSlug })}
          sx={{ bgcolor: ADMIN_ACCENT }}
          disabled={!form.name.trim() || !normalizedSlug || slugTaken}
        >
          {course ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UnitDialog = ({ open, unit, courseId, onClose, onSave }) => {
  const maxUnlockLessons = unit ? Math.max(0, Number(unit?.lesson_count ?? 0)) : null;
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
      : {
          title: "",
          description: "",
          order_index: 0,
          required_lessons_to_unlock: 0,
          is_published: false,
          course: courseId,
        },
  );

  const unlockCount = Number(form.required_lessons_to_unlock) || 0;
  const unlockInvalid = unlockCount < 0 || (maxUnlockLessons !== null && unlockCount > maxUnlockLessons);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
        {unit ? "Sửa unit" : "Thêm unit mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <TextField label="Tiêu đề" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} size="small" fullWidth required />
        <TextField label="Mô tả" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} size="small" fullWidth multiline rows={2} />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Thứ tự"
            type="number"
            value={form.order_index}
            onChange={(event) => setForm((prev) => ({ ...prev, order_index: Number(event.target.value) }))}
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Bài cần để mở khóa"
            type="number"
            value={form.required_lessons_to_unlock}
            onChange={(event) => setForm((prev) => ({ ...prev, required_lessons_to_unlock: Number(event.target.value) }))}
            size="small"
            sx={{ flex: 1 }}
            error={unlockInvalid}
            helperText={
              unlockInvalid
                ? `Nhập từ 0 đến ${maxUnlockLessons}.`
                : maxUnlockLessons === null
                  ? "Bạn có thể nhập số mở khóa trước. Sau khi thêm bài học, hãy kiểm tra lại nếu cần."
                  : `Giới hạn hiện tại: 0 đến ${maxUnlockLessons}.`
            }
            inputProps={maxUnlockLessons === null ? { min: 0 } : { min: 0, max: maxUnlockLessons }}
          />
        </Stack>
        <FormControlLabel
          control={<Switch checked={form.is_published} onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))} />}
          label="Công khai"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={() => onSave(form)} sx={{ bgcolor: ADMIN_ACCENT }} disabled={!form.title.trim() || unlockInvalid}>
          {unit ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManageLessonsDialog = ({ open, unit, onClose }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const { data: unitLessons = [], isLoading: loadingUnit } = useQuery({
    queryKey: ["admin-unit-lessons", unit?.id],
    queryFn: () => learningApi.getAdminUnitLessons(unit.id).then((response) => response.data),
    enabled: Boolean(unit?.id),
  });

  const { data: lessonSearch } = useQuery({
    queryKey: ["admin-lesson-search", search],
    queryFn: () => learningApi.getLessons({ search, page_size: 20 }).then((response) => response.data),
    enabled: search.length > 0,
    placeholderData: (prev) => prev,
  });

  const existingIds = new Set(unitLessons.map((item) => item.lesson));

  const { mutate: addLesson } = useMutation({
    mutationFn: (lessonId) => learningApi.addLessonToUnit(unit.id, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unit-lessons", unit?.id] });
      setToast({ msg: "Đã thêm bài học vào unit.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Thêm thất bại."), severity: "error" }),
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
          Quản lý bài học - {unit?.title}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", gap: 2, pt: "16px !important", minHeight: 400 }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>
              Bài học trong unit ({unitLessons.length})
            </Typography>
            <Box sx={{ flex: 1, overflowY: "auto", maxHeight: 360 }}>
              {loadingUnit
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} height={44} sx={{ mb: 1, borderRadius: 2 }} />)
                : unitLessons.map((item) => (
                    <Box
                      key={item.id}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "6px 10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", mb: 0.75 }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{item.lesson_title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {item.lesson_level} - {item.lesson_word_count} từ
                        </Typography>
                      </Box>
                      <Tooltip title="Xóa khỏi unit">
                        <IconButton size="small" color="error" onClick={() => removeLesson(item.lesson)}>
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

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.secondary", mb: 0.5 }}>
              Tìm và thêm bài học
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm tên bài học..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
                        {lesson.level} - {lesson.word_count ?? 0} từ
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" disabled={inUnit} onClick={() => addLesson(lesson.id)} sx={{ fontSize: "0.75rem", minWidth: 60 }}>
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

const ActivityDialog = ({ open, unit, activity, onClose, onSave }) => {
  const [form, setForm] = useState(
    activity
      ? {
          unit: activity.unit,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description ?? "",
          order_index: activity.order_index,
          lesson: activity.lesson ?? "",
          listening_passage: activity.listening_passage ?? "",
          quiz: activity.quiz ?? "",
          is_required: activity.is_required,
          is_published: activity.is_published,
          estimated_minutes: activity.estimated_minutes ?? 5,
          min_score_to_pass: activity.min_score_to_pass ?? 70,
          metadataText: JSON.stringify(activity.metadata ?? {}, null, 2),
        }
      : {
          unit: unit?.id,
          activity_type: "vocab",
          title: "",
          description: "",
          order_index: 1,
          lesson: "",
          listening_passage: "",
          quiz: "",
          is_required: true,
          is_published: false,
          estimated_minutes: 5,
          min_score_to_pass: 70,
          metadataText: "{}",
        },
  );
  const [metadataError, setMetadataError] = useState("");

  const selectedType = ACTIVITY_TYPES.find((item) => item.value === form.activity_type);
  const needsLesson = selectedType?.target === "lesson";
  const needsListening = selectedType?.target === "listening_passage";
  const needsQuiz = selectedType?.target === "quiz";
  const targetMissing = (needsLesson && !form.lesson) || (needsListening && !form.listening_passage) || (needsQuiz && !form.quiz);

  const handleSave = () => {
    let metadata;
    try {
      metadata = parseMetadata(form.metadataText);
      setMetadataError("");
    } catch {
      setMetadataError("Metadata phải là JSON hợp lệ.");
      return;
    }

    onSave({
      unit: form.unit,
      activity_type: form.activity_type,
      title: form.title.trim(),
      description: form.description,
      order_index: Number(form.order_index) || 1,
      lesson: needsLesson ? Number(form.lesson) : null,
      listening_passage: needsListening ? Number(form.listening_passage) : null,
      quiz: needsQuiz ? Number(form.quiz) : null,
      is_required: form.is_required,
      is_published: form.is_published,
      estimated_minutes: Number(form.estimated_minutes) || 5,
      min_score_to_pass: Number(form.min_score_to_pass) || 70,
      metadata,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
        {activity ? "Sửa activity" : `Thêm activity - ${unit?.title || ""}`}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Loại activity</InputLabel>
          <Select
            label="Loại activity"
            value={form.activity_type}
            onChange={(event) => setForm((prev) => ({ ...prev, activity_type: event.target.value, lesson: "", listening_passage: "", quiz: "" }))}
          >
            {ACTIVITY_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Tiêu đề" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} size="small" fullWidth required />
        <TextField label="Mô tả" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} size="small" fullWidth multiline rows={2} />
        <Stack direction="row" spacing={2}>
          <TextField label="Thứ tự" type="number" value={form.order_index} onChange={(event) => setForm((prev) => ({ ...prev, order_index: Number(event.target.value) }))} size="small" sx={{ flex: 1 }} />
          <TextField label="Phút ước tính" type="number" value={form.estimated_minutes} onChange={(event) => setForm((prev) => ({ ...prev, estimated_minutes: Number(event.target.value) }))} size="small" sx={{ flex: 1 }} />
        </Stack>
        {needsLesson && (
          <TextField label="Lesson ID" type="number" value={form.lesson} onChange={(event) => setForm((prev) => ({ ...prev, lesson: event.target.value }))} size="small" fullWidth required helperText="Dùng cho activity từ vựng/ngữ pháp." />
        )}
        {needsListening && (
          <TextField label="Listening passage ID" type="number" value={form.listening_passage} onChange={(event) => setForm((prev) => ({ ...prev, listening_passage: event.target.value }))} size="small" fullWidth required helperText="Dùng cho activity nghe." />
        )}
        {needsQuiz && (
          <TextField label="Quiz ID" type="number" value={form.quiz} onChange={(event) => setForm((prev) => ({ ...prev, quiz: event.target.value }))} size="small" fullWidth required helperText="Dùng cho quiz/checkpoint." />
        )}
        {(needsQuiz || form.activity_type === "checkpoint") && (
          <TextField label="Điểm đạt tối thiểu" type="number" value={form.min_score_to_pass} onChange={(event) => setForm((prev) => ({ ...prev, min_score_to_pass: Number(event.target.value) }))} size="small" fullWidth />
        )}
        <TextField
          label="Metadata JSON"
          value={form.metadataText}
          onChange={(event) => setForm((prev) => ({ ...prev, metadataText: event.target.value }))}
          size="small"
          fullWidth
          multiline
          rows={3}
          error={Boolean(metadataError)}
          helperText={metadataError || 'Ví dụ writing: {"prompt":"Write 3 sentences.","min_words":8,"xp":12}'}
        />
        <Stack direction="row" spacing={2}>
          <FormControlLabel control={<Switch checked={form.is_required} onChange={(event) => setForm((prev) => ({ ...prev, is_required: event.target.checked }))} />} label="Bắt buộc" />
          <FormControlLabel control={<Switch checked={form.is_published} onChange={(event) => setForm((prev) => ({ ...prev, is_published: event.target.checked }))} />} label="Công khai" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: ADMIN_ACCENT }} disabled={!form.title.trim() || targetMissing}>
          {activity ? "Lưu" : "Tạo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManageActivitiesDialog = ({ open, unit, onClose }) => {
  const qc = useQueryClient();
  const [addActivity, setAddActivity] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [deleteActivity, setDeleteActivity] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["admin-unit-activities", unit?.id],
    queryFn: () => learningApi.getAdminActivities({ unit_id: unit.id }).then((response) => response.data),
    enabled: Boolean(open && unit?.id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-unit-activities", unit?.id] });
    qc.invalidateQueries({ queryKey: ["learning-path-v2"] });
    qc.invalidateQueries({ queryKey: ["home-learning-path"] });
  };

  const { mutate: createActivity } = useMutation({
    mutationFn: (data) => learningApi.createAdminActivity(data),
    onSuccess: () => {
      invalidate();
      setAddActivity(false);
      setToast({ msg: "Đã tạo activity.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi tạo activity."), severity: "error" }),
  });

  const { mutate: updateActivity } = useMutation({
    mutationFn: ({ id, data }) => learningApi.updateAdminActivity(id, data),
    onSuccess: () => {
      invalidate();
      setEditActivity(null);
      setToast({ msg: "Đã cập nhật activity.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi cập nhật activity."), severity: "error" }),
  });

  const { mutate: removeActivity } = useMutation({
    mutationFn: (id) => learningApi.deleteAdminActivity(id),
    onSuccess: () => {
      invalidate();
      setDeleteActivity(null);
      setToast({ msg: "Đã xóa activity.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi xóa activity."), severity: "error" }),
  });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>
          Quản lý activity - {unit?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              Sắp xếp theo order_index. Target ID lấy từ Lesson, Listening passage hoặc Quiz tương ứng.
            </Typography>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddActivity(true)} sx={{ bgcolor: ADMIN_ACCENT }}>
              Thêm activity
            </Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Thứ tự</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
              ) : activities.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.disabled" }}>Chưa có activity.</TableCell></TableRow>
              ) : activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.order_index}</TableCell>
                  <TableCell><Chip size="small" label={activityLabel(activity.activity_type)} /></TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{activity.title}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{activity.estimated_minutes} phút</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    {activity.lesson_title || activity.listening_passage_title || activity.quiz_title || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={activity.is_published ? "Công khai" : "Ẩn"} color={activity.is_published ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditActivity(activity)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteActivity(activity)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {addActivity && <ActivityDialog open unit={unit} onClose={() => setAddActivity(false)} onSave={(data) => createActivity(data)} />}
      {editActivity && <ActivityDialog open unit={unit} activity={editActivity} onClose={() => setEditActivity(null)} onSave={(data) => updateActivity({ id: editActivity.id, data })} />}

      <Dialog open={Boolean(deleteActivity)} onClose={() => setDeleteActivity(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>Xóa activity?</DialogTitle>
        <DialogContent>
          <Typography>
            Xóa activity <strong>{deleteActivity?.title}</strong> sẽ gỡ hoạt động này khỏi unit. Tiến độ activity liên quan của học sinh cũng có thể bị mất.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteActivity(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={() => removeActivity(deleteActivity.id)}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </>
  );
};

const UnitRow = ({ unit, courseId, onEdit, onDelete }) => {
  const [manageLessons, setManageLessons] = useState(false);
  const [manageActivities, setManageActivities] = useState(false);

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
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{unit.lesson_count} bài</TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Cần {unit.required_lessons_to_unlock} bài</TableCell>
          <Tooltip title="Quản lý activity V2">
            <IconButton size="small" onClick={() => setManageActivities(true)} sx={{ color: ADMIN_ACCENT }}>
              <SchoolIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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

      <ManageActivitiesDialog open={manageActivities} unit={unit} onClose={() => setManageActivities(false)} />
      <ManageLessonsDialog open={manageLessons} unit={unit} onClose={() => setManageLessons(false)} />
    </>
  );
};

const CourseRow = ({ course, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [addUnit, setAddUnit] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["admin-units", course.id],
    queryFn: () => learningApi.getAdminUnits(course.id).then((response) => response.data),
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
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi tạo unit."), severity: "error" }),
  });

  const { mutate: updateUnit } = useMutation({
    mutationFn: ({ id, data }) => learningApi.updateAdminUnit(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units", course.id] });
      setEditUnit(null);
      setToast({ msg: "Đã cập nhật unit.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi cập nhật unit."), severity: "error" }),
  });

  const { mutate: delUnit } = useMutation({
    mutationFn: (id) => learningApi.deleteAdminUnit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units", course.id] });
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteUnit(null);
      setToast({ msg: "Đã xóa unit.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi xóa unit."), severity: "error" }),
  });

  return (
    <>
      <TableRow sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8f9ff" } }} onClick={() => setExpanded((prev) => !prev)}>
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
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{course.unit_count} unit</TableCell>
        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          {course.created_at ? new Date(course.created_at).toLocaleDateString("vi-VN") : "-"}
        </TableCell>
        <TableCell align="right" onClick={(event) => event.stopPropagation()}>
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

      {expanded && (
        <>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ pl: 6 }}><Skeleton height={36} /></TableCell>
            </TableRow>
          ) : units.map((unit) => (
            <UnitRow key={unit.id} unit={unit} courseId={course.id} onEdit={(value) => setEditUnit(value)} onDelete={(value) => setDeleteUnit(value)} />
          ))}
          <TableRow>
            <TableCell colSpan={5} sx={{ pl: 6, py: 1 }}>
              <Button size="small" startIcon={<AddIcon />} onClick={(event) => { event.stopPropagation(); setAddUnit(true); }} sx={{ fontSize: "0.8rem", color: ADMIN_ACCENT }}>
                Thêm unit
              </Button>
            </TableCell>
          </TableRow>
        </>
      )}

      {addUnit && <UnitDialog open unit={null} courseId={course.id} onClose={() => setAddUnit(false)} onSave={(data) => createUnit(data)} />}
      {editUnit && <UnitDialog open unit={editUnit} courseId={course.id} onClose={() => setEditUnit(null)} onSave={(data) => updateUnit({ id: editUnit.id, data })} />}

      <Dialog open={Boolean(deleteUnit)} onClose={() => setDeleteUnit(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>Xóa unit?</DialogTitle>
        <DialogContent>
          <Typography>
            Xóa unit <strong>{deleteUnit?.title}</strong> sẽ gỡ toàn bộ liên kết bài học của unit này khỏi lộ trình. Bài học không bị xóa, nhưng học sinh đang học dở có thể không tìm thấy bài trong course nữa.
          </Typography>
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

const AdminLearningPath = () => {
  const qc = useQueryClient();
  const [addCourse, setAddCourse] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [toast, setToast] = useState(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => learningApi.getAdminCourses().then((response) => response.data),
  });

  const existingSlugs = new Set(courses.map((course) => String(course.slug || "").toLowerCase()));

  const { mutate: createCourse } = useMutation({
    mutationFn: (data) => learningApi.createAdminCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setAddCourse(false);
      setToast({ msg: "Đã tạo khóa học.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi tạo khóa học."), severity: "error" }),
  });

  const { mutate: updateCourse } = useMutation({
    mutationFn: ({ id, data }) => learningApi.updateAdminCourse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditCourse(null);
      setToast({ msg: "Đã cập nhật khóa học.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi cập nhật khóa học."), severity: "error" }),
  });

  const { mutate: delCourse } = useMutation({
    mutationFn: (id) => learningApi.deleteAdminCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setDeleteCourse(null);
      setToast({ msg: "Đã xóa khóa học.", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Lỗi xóa khóa học."), severity: "error" }),
  });

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>Lộ trình học</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>Quản lý khóa học, unit và bài học</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddCourse(true)} sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none", fontWeight: 700 }}>
          Thêm khóa học
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Khóa học / Unit</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Số lượng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Ngày tạo / Yêu cầu</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}><Skeleton height={32} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : courses.map((course) => <CourseRow key={course.id} course={course} onEdit={(value) => setEditCourse(value)} onDelete={(value) => setDeleteCourse(value)} />)}
            {!isLoading && courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.disabled" }}>Chưa có khóa học nào</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {addCourse && <CourseDialog open existingSlugs={existingSlugs} onClose={() => setAddCourse(false)} onSave={(data) => createCourse(data)} />}
      {editCourse && <CourseDialog open course={editCourse} existingSlugs={existingSlugs} onClose={() => setEditCourse(null)} onSave={(data) => updateCourse({ id: editCourse.id, data })} />}

      <Dialog open={Boolean(deleteCourse)} onClose={() => setDeleteCourse(null)} PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 700, color: ADMIN_BG }}>Xóa khóa học?</DialogTitle>
        <DialogContent>
          <Typography>
            Xóa khóa học <strong>{deleteCourse?.name}</strong> sẽ xóa toàn bộ unit trong khóa này và gỡ lộ trình học tương ứng khỏi học sinh.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteCourse(null)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={() => delCourse(deleteCourse.id)}>Xóa</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLearningPath;
