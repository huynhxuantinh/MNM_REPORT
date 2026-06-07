import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
  Pagination,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Switch,
  CircularProgress,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  SearchRounded as SearchRoundedIcon,
  EditRounded as EditRoundedIcon,
  DeleteRounded as DeleteRoundedIcon,
  AddRounded as AddRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  RemoveCircleOutlineRounded as RemoveCircleOutlineRoundedIcon,
  AddCircleOutlineRounded as AddCircleOutlineRoundedIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";
import vocabularyApi from "@/services/vocabularyApi";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE = 15;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];
const SKILL_TAGS = [
  { value: "vocab", label: "Vocabulary" },
  { value: "listening", label: "Listening" },
  { value: "grammar", label: "Grammar" },
  { value: "mixed", label: "Mixed" },
];
const LEVEL_COLORS = {
  A1: "#4caf50",
  A2: "#8bc34a",
  B1: "#ffeb3b",
  B2: "#ffb300",
  C1: "#f4511e",
  C2: "#d32f2f",
  TOEIC: "#3949ab",
};
const SKILL_COLORS = {
  vocab: "#00897b",
  listening: "#5c6bc0",
  grammar: "#ef6c00",
  mixed: "#6d4c41",
};

const isListeningReady = (lesson) => {
  if (lesson?.skill_tag !== "listening") return true;
  return Boolean(lesson?.listening_transcript?.trim()) && Number(lesson?.word_count || 0) >= 3;
};

const createEmptyLesson = () => ({
  id: null,
  title: "",
  description: "",
  topic: "",
  level: "A1",
  skill_tag: "vocab",
  order_index: 1,
  is_published: true,
  listening_transcript: "",
  listening_translation_vi: "",
  listening_estimated_seconds: 30,
  listening_tts_lang: "en-US",
  listening_tts_rate: 0.9,
});

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

const ManageWordsDialog = ({ lesson, open, onClose }) => {
  const qc = useQueryClient();
  const [wordSearch, setWordSearch] = useState("");

  const { data: lessonDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["lesson-detail-admin", lesson?.id],
    queryFn: () => learningApi.getLesson(lesson.id).then((r) => r.data),
    enabled: open && !!lesson?.id,
    staleTime: 0,
  });

  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ["word-search-admin", wordSearch],
    queryFn: () => vocabularyApi.getWords({ search: wordSearch, page_size: 15 }).then((r) => r.data),
    enabled: wordSearch.trim().length >= 1,
    staleTime: 30000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["lesson-detail-admin", lesson?.id] });
    qc.invalidateQueries({ queryKey: ["admin-lessons"] });
    qc.invalidateQueries({ queryKey: ["learning-path"] });
    qc.invalidateQueries({ queryKey: ["lessons"] });
    qc.invalidateQueries({ queryKey: ["home-learning-path"] });
  };

  const { mutate: addWord, isPending: isAdding } = useMutation({
    mutationFn: (wordId) => learningApi.addWordToLesson(lesson.id, wordId),
    onSuccess: invalidate,
  });

  const { mutate: removeWord, isPending: isRemoving } = useMutation({
    mutationFn: (wordId) => learningApi.removeWordFromLesson(lesson.id, wordId),
    onSuccess: invalidate,
  });

  const currentWords = lessonDetail?.words ?? [];
  const currentWordIds = new Set(currentWords.map((item) => item.word.id));
  const searchResults = (searchData?.results ?? []).filter((word) => !currentWordIds.has(word.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: ADMIN_BG }}>
        Quản lý từ vựng
        <Typography component="span" sx={{ fontWeight: 400, color: "text.secondary", ml: 1, fontSize: "0.95rem" }}>
          - {lesson?.title}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: "flex", minHeight: 420 }}>
          <Box sx={{ flex: 1, p: 2.5, borderRight: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG, mb: 1.5 }}>
              Từ vựng trong bài
              <Chip label={currentWords.length} size="small" sx={{ ml: 1, fontWeight: 700, fontSize: "0.7rem", bgcolor: `${ADMIN_ACCENT}18`, color: ADMIN_ACCENT }} />
            </Typography>

            {loadingDetail ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={28} sx={{ color: ADMIN_ACCENT }} />
              </Box>
            ) : currentWords.length === 0 ? (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", pt: 1 }}>
                Chua co tu vung nao. Tim va them tu ben phai.
              </Typography>
            ) : (
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {currentWords.map((item) => (
                  <Box
                    key={item.id}
                    sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.875, borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>
                        {item.word.text}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.word.definition_vi}
                      </Typography>
                    </Box>
                      <Tooltip title="Xóa khỏi bài">
                      <IconButton size="small" onClick={() => removeWord(item.word.id)} disabled={isRemoving}>
                        <RemoveCircleOutlineRoundedIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG, mb: 1.5 }}>
              Thêm từ vựng
            </Typography>

            <TextField
              size="small"
              fullWidth
              placeholder="Tim tu vung de them..."
              value={wordSearch}
              onChange={(e) => setWordSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5 }}
            />

            {searching && (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                <CircularProgress size={24} sx={{ color: ADMIN_ACCENT }} />
              </Box>
            )}

            {!searching && wordSearch.trim() && searchResults.length === 0 && searchData && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Khong tim thay tu nao hoac da them het.
              </Typography>
            )}

            {!wordSearch.trim() && (
              <Typography sx={{ color: "text.disabled", fontSize: "0.82rem" }}>
                Nhap tu khoa de tim kiem tu vung.
              </Typography>
            )}

            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {searchResults.map((word) => (
                <Box
                  key={word.id}
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.875, borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>
                      {word.text}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {word.definition_vi}
                      {word.phonetic && <span style={{ marginLeft: 6, color: "#9e9e9e" }}>{word.phonetic}</span>}
                    </Typography>
                  </Box>
                      <Tooltip title="Thêm vào bài">
                    <IconButton size="small" onClick={() => addWord(word.id)} disabled={isAdding}>
                      <AddCircleOutlineRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none" }}>
          Xong
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminLessons = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(createEmptyLesson());
  const [manageLesson, setManageLesson] = useState(null);

  const params = {
    search: search || undefined,
    level: levelFilter || undefined,
    skill_tag: skillFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lessons", params],
    queryFn: () => learningApi.getLessons(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: saveLesson, isPending: isSaving } = useMutation({
    mutationFn: (payload) => (payload.id ? learningApi.updateLesson(payload.id, payload) : learningApi.createLesson(payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      setToast({ msg: formData.id ? "Cap nhat bai hoc thanh cong" : "Tao bai hoc thanh cong", severity: "success" });
      setOpenDialog(false);
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Loi luu bai hoc"), severity: "error" }),
  });

  const { mutate: deleteLesson } = useMutation({
    mutationFn: (id) => learningApi.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lessons"] });
      setToast({ msg: "Da xoa bai hoc", severity: "success" });
    },
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Loi xoa bai hoc"), severity: "error" }),
  });

  const { mutate: togglePublish } = useMutation({
    mutationFn: ({ id, is_published }) => learningApi.updateLesson(id, { is_published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-lessons"] }),
    onError: (error) => setToast({ msg: extractErrorMessage(error, "Loi cap nhat trang thai public"), severity: "error" }),
  });

  const lessons = data?.results || [];
  const total = data?.count || 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenNew = () => {
    setFormData(createEmptyLesson());
    setOpenDialog(true);
  };

  const handleOpenEdit = (lesson) => {
    setFormData({ ...createEmptyLesson(), ...lesson });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Quan ly bai hoc
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            {total} bai hoc trong he thong
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleOpenNew}
          sx={{ borderRadius: "10px", textTransform: "none", bgcolor: ADMIN_ACCENT, "&:hover": { bgcolor: "#3f51b5" } }}
        >
          Tao bai hoc moi
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tim ten bai hoc..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Cap do</InputLabel>
          <Select value={levelFilter} label="Cap do" onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tat ca</MenuItem>
            {LEVELS.map((lvl) => <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Skill</InputLabel>
          <Select value={skillFilter} label="Skill" onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tat ca</MenuItem>
            {SKILL_TAGS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: ADMIN_BG, mb: 1 }}>
          Loc nhanh theo nhom noi dung
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={skillFilter || "all"}
          onChange={(_, value) => {
            if (value === null) return;
            setSkillFilter(value === "all" ? "" : value);
            setPage(1);
          }}
          sx={{
            flexWrap: "wrap",
            gap: 1,
            "& .MuiToggleButton-root": {
              borderRadius: "999px !important",
              border: "1px solid rgba(0,0,0,0.12)",
              px: 1.75,
              textTransform: "none",
              fontWeight: 700,
            },
          }}
        >
          <ToggleButton value="all">Tat ca</ToggleButton>
          {SKILL_TAGS.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Ten bai hoc</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Cap do</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Skill</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>So tu</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Public</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="right">Hanh dong</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
                ))
              : lessons.map((lesson) => (
                  <TableRow key={lesson.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>{lesson.title}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", maxWidth: 380, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lesson.description}
                      </Typography>
                      {lesson.skill_tag === "listening" && !isListeningReady(lesson) && (
                        <Chip
                          label={!lesson.listening_transcript?.trim() ? "Thieu transcript" : "Can it nhat 3 tu"}
                          size="small"
                          color="warning"
                          sx={{ mt: 0.75, fontWeight: 700, fontSize: "0.68rem" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={lesson.level || "-"} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fff", bgcolor: LEVEL_COLORS[lesson.level] || "#9e9e9e" }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={SKILL_TAGS.find((item) => item.value === lesson.skill_tag)?.label || lesson.skill_tag || "Mixed"}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fff", bgcolor: SKILL_COLORS[lesson.skill_tag] || "#757575" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{lesson.word_count || 0}</Typography>
                      {lesson.skill_tag === "listening" && (
                        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
                          {lesson.listening_estimated_seconds || 30}s
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          lesson.skill_tag === "listening" && !isListeningReady(lesson)
                            ? "Lesson nghe can transcript va toi thieu 3 tu truoc khi public."
                            : ""
                        }
                      >
                        <span>
                          <Switch
                            size="small"
                            checked={lesson.is_published}
                            disabled={lesson.skill_tag === "listening" && !isListeningReady(lesson)}
                            onChange={(e) => togglePublish({ id: lesson.id, is_published: e.target.checked })}
                            sx={{ "& .MuiSwitch-thumb": { bgcolor: lesson.is_published ? ADMIN_ACCENT : "#bbb" } }}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Quản lý từ vựng">
                        <IconButton size="small" onClick={() => setManageLesson(lesson)}>
                          <MenuBookRoundedIcon fontSize="small" sx={{ color: "#00897b" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sua">
                        <IconButton size="small" onClick={() => handleOpenEdit(lesson)}>
                          <EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xoa">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm("Xóa bài học này sẽ xóa luôn tiến độ học, session và liên kết từ vựng của học sinh ở bài này. Bạn có chắc muốn tiếp tục?")) {
                              deleteLesson(lesson.id);
                            }
                          }}
                        >
                          <DeleteRoundedIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && lessons.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Khong tim thay bai hoc nao.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={numPages} page={page} onChange={(_, p) => setPage(p)} shape="rounded" />
        </Stack>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{formData.id ? "Sua bai hoc" : "Tao bai hoc moi"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Ten bai hoc" required fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <TextField label="Mo ta" fullWidth multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Cap do</InputLabel>
              <Select value={formData.level} label="Cap do" onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                {LEVELS.map((lvl) => <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Skill</InputLabel>
              <Select value={formData.skill_tag} label="Skill" onChange={(e) => setFormData({ ...formData, skill_tag: e.target.value })}>
                {SKILL_TAGS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Thu tu" type="number" fullWidth value={formData.order_index} onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 1 })} />
          </Box>
          <TextField label="Topic" fullWidth value={formData.topic || ""} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} />

          {formData.skill_tag === "listening" && (
            <>
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Bai nghe duoc quan ly rieng. Hay nhap transcript, ban dich va cau hinh TTS truoc khi public.
              </Alert>
              <TextField
                label="Transcript"
                required
                fullWidth
                multiline
                rows={4}
                value={formData.listening_transcript || ""}
                onChange={(e) => setFormData({ ...formData, listening_transcript: e.target.value })}
              />
              <TextField
                label="Ban dich tieng Viet"
                fullWidth
                multiline
                rows={3}
                value={formData.listening_translation_vi || ""}
                onChange={(e) => setFormData({ ...formData, listening_translation_vi: e.target.value })}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Thoi luong (giay)"
                  type="number"
                  fullWidth
                  value={formData.listening_estimated_seconds ?? 30}
                  onChange={(e) => setFormData({ ...formData, listening_estimated_seconds: parseInt(e.target.value, 10) || 30 })}
                />
                <TextField
                  label="Ngon ngu TTS"
                  fullWidth
                  value={formData.listening_tts_lang || "en-US"}
                  onChange={(e) => setFormData({ ...formData, listening_tts_lang: e.target.value || "en-US" })}
                />
                <TextField
                  label="Toc do doc"
                  type="number"
                  fullWidth
                  inputProps={{ step: 0.1, min: 0.5, max: 1.5 }}
                  value={formData.listening_tts_rate ?? 0.9}
                  onChange={(e) => setFormData({ ...formData, listening_tts_rate: Number(e.target.value) || 0.9 })}
                />
              </Box>
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Lesson listening can co transcript va toi thieu 3 tu truoc khi public.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Huy</Button>
          <Button
            onClick={() => saveLesson(formData)}
            variant="contained"
            disabled={!formData.title || isSaving || (formData.skill_tag === "listening" && !formData.listening_transcript?.trim())}
            sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none" }}
          >
            Luu
          </Button>
        </DialogActions>
      </Dialog>

      {manageLesson && (
        <ManageWordsDialog lesson={manageLesson} open={Boolean(manageLesson)} onClose={() => setManageLesson(null)} />
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.severity} sx={{ width: "100%", borderRadius: "12px" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLessons;
