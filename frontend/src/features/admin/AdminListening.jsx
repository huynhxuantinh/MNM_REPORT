import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddRounded as AddRoundedIcon,
  DeleteRounded as DeleteRoundedIcon,
  EditRounded as EditRoundedIcon,
  LibraryMusicRounded as LibraryMusicRoundedIcon,
  SearchRounded as SearchRoundedIcon,
} from "@mui/icons-material";
import learningApi from "@/services/learningApi";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE = 10;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];
const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill blank" },
];

const emptyPassage = {
  id: null,
  title: "",
  topic: "",
  level: "A1",
  transcript: "",
  translation_vi: "",
  estimated_seconds: 30,
  tts_lang: "en-US",
  tts_rate: 0.9,
  is_published: false,
};

const emptyQuestion = (passageId = null) => ({
  id: null,
  passage: passageId,
  question_type: "multiple_choice",
  prompt: "",
  choices_text: "",
  correct_answer_text: "",
  explanation: "",
  order_index: 1,
});

const extractErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === "string") return first;
  return fallback;
};

const passageReady = (passage) => Number(passage?.question_count || 0) >= 3;

const normalizeQuestionToForm = (question) => ({
  id: question.id,
  passage: question.passage,
  question_type: question.question_type,
  prompt: question.prompt,
  choices_text: Array.isArray(question.choices_json) ? question.choices_json.join("\n") : "",
  correct_answer_text:
    question.question_type === "fill_blank"
      ? question.correct_answer?.text || ""
      : question.question_type === "true_false"
        ? question.correct_answer?.option || ""
      : question.correct_answer?.option || "",
  explanation: question.explanation || "",
  order_index: question.order_index || 1,
});

const buildQuestionPayload = (formData) => {
  const choices = formData.question_type === "fill_blank"
    ? []
    : formData.choices_text.split("\n").map((item) => item.trim()).filter(Boolean);

  return {
    passage: formData.passage,
    question_type: formData.question_type,
    prompt: formData.prompt,
    choices_json: choices,
    correct_answer:
      formData.question_type === "fill_blank"
        ? { text: formData.correct_answer_text.trim() }
        : { option: formData.correct_answer_text.trim() },
    explanation: formData.explanation,
    order_index: Number(formData.order_index) || 1,
  };
};

const QuestionManagerDialog = ({ passage, open, onClose, onToast }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyQuestion(passage?.id));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listening-questions", passage?.id],
    queryFn: () => learningApi.getAdminListeningQuestions({ passage_id: passage.id }).then((response) => response.data),
    enabled: open && Boolean(passage?.id),
  });

  const resetForm = () => setFormData(emptyQuestion(passage?.id));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-listening-questions", passage?.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-listening-passages"] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => (
      payload.id
        ? learningApi.updateAdminListeningQuestion(payload.id, buildQuestionPayload(payload))
        : learningApi.createAdminListeningQuestion(buildQuestionPayload(payload))
    ),
    onSuccess: () => {
      invalidate();
      onToast({ severity: "success", msg: formData.id ? "Cap nhat cau hoi thanh cong" : "Them cau hoi thanh cong" });
      resetForm();
    },
    onError: (error) => onToast({ severity: "error", msg: extractErrorMessage(error, "Loi luu cau hoi") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => learningApi.deleteAdminListeningQuestion(id),
    onSuccess: () => {
      invalidate();
      onToast({ severity: "success", msg: "Da xoa cau hoi" });
      resetForm();
    },
    onError: (error) => onToast({ severity: "error", msg: extractErrorMessage(error, "Loi xoa cau hoi") }),
  });

  const questions = data?.results || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: ADMIN_BG }}>
        Quan ly cau hoi nghe
        <Typography component="span" sx={{ ml: 1, color: "text.secondary", fontSize: "0.95rem", fontWeight: 400 }}>
          - {passage?.title}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1.1 }}>
          <Typography sx={{ fontWeight: 700, color: ADMIN_BG, mb: 1.5 }}>Danh sach cau hoi</Typography>
          <Stack spacing={1.25}>
            {isLoading && <Typography sx={{ color: "text.secondary" }}>Dang tai cau hoi...</Typography>}
            {!isLoading && questions.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Passage nay chua co cau hoi. Can it nhat 3 cau hoi de public.
              </Alert>
            )}
            {questions.map((question) => (
              <Paper key={question.id} variant="outlined" sx={{ p: 1.5, borderRadius: "12px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>
                      Cau {question.order_index}
                    </Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "text.primary" }}>
                      {question.prompt}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}>
                      {QUESTION_TYPES.find((item) => item.value === question.question_type)?.label}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    <Tooltip title="Sua cau hoi">
                      <IconButton size="small" aria-label={`sua-cau-hoi-${question.id}`} onClick={() => setFormData(normalizeQuestionToForm(question))}>
                        <EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoa cau hoi">
                      <IconButton
                        size="small"
                        aria-label={`xoa-cau-hoi-${question.id}`}
                        onClick={() => window.confirm("Xóa câu hỏi này khỏi passage nghe?") && deleteMutation.mutate(question.id)}
                      >
                        <DeleteRoundedIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, color: ADMIN_BG, mb: 1.5 }}>
            {formData.id ? "Sua cau hoi" : "Them cau hoi"}
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Loai cau hoi</InputLabel>
              <Select
                value={formData.question_type}
                label="Loai cau hoi"
                onChange={(event) => setFormData((prev) => ({
                  ...prev,
                  question_type: event.target.value,
                  choices_text: event.target.value === "true_false" ? "True\nFalse" : prev.choices_text,
                }))}
              >
                {QUESTION_TYPES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Noi dung cau hoi"
              value={formData.prompt}
              onChange={(event) => setFormData((prev) => ({ ...prev, prompt: event.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            {formData.question_type !== "fill_blank" && (
              <TextField
                label="Lua chon (moi dong 1 lua chon)"
                value={formData.choices_text}
                onChange={(event) => setFormData((prev) => ({ ...prev, choices_text: event.target.value }))}
                fullWidth
                multiline
                rows={4}
              />
            )}
            <TextField
              label={formData.question_type === "fill_blank" ? "Dap an dung" : "Lua chon dung"}
              value={formData.correct_answer_text}
              onChange={(event) => setFormData((prev) => ({ ...prev, correct_answer_text: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Giai thich"
              value={formData.explanation}
              onChange={(event) => setFormData((prev) => ({ ...prev, explanation: event.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Thu tu"
              type="number"
              value={formData.order_index}
              onChange={(event) => setFormData((prev) => ({ ...prev, order_index: event.target.value }))}
              fullWidth
            />
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => saveMutation.mutate(formData)}
                disabled={!formData.prompt.trim() || !formData.correct_answer_text.trim() || saveMutation.isPending}
                sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none" }}
              >
                {formData.id ? "Cap nhat cau hoi" : "Them cau hoi"}
              </Button>
              <Button onClick={resetForm} color="inherit">
                Lam moi form
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Dong</Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminListening = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(emptyPassage);
  const [managePassage, setManagePassage] = useState(null);

  const params = useMemo(() => ({
    search: search || undefined,
    level: levelFilter || undefined,
    is_published: publishedFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  }), [search, levelFilter, publishedFilter, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listening-passages", params],
    queryFn: () => learningApi.getAdminListeningPassages(params).then((response) => response.data),
    placeholderData: (prev) => prev,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (
      payload.id
        ? learningApi.updateAdminListeningPassage(payload.id, payload)
        : learningApi.createAdminListeningPassage(payload)
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listening-passages"] });
      setToast({ severity: "success", msg: formData.id ? "Cap nhat passage thanh cong" : "Tao passage thanh cong" });
      setOpenDialog(false);
    },
    onError: (error) => setToast({ severity: "error", msg: extractErrorMessage(error, "Loi luu passage") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => learningApi.deleteAdminListeningPassage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listening-passages"] });
      setToast({ severity: "success", msg: "Da xoa passage" });
    },
    onError: (error) => setToast({ severity: "error", msg: extractErrorMessage(error, "Loi xoa passage") }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, is_published }) => learningApi.updateAdminListeningPassage(id, { is_published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-listening-passages"] }),
    onError: (error) => setToast({ severity: "error", msg: extractErrorMessage(error, "Loi cap nhat trang thai public") }),
  });

  const passages = data?.results || [];
  const total = data?.count || 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Quan ly listening
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            Passage va cau hoi nghe hieu duoc quan ly rieng voi learning.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setFormData(emptyPassage); setOpenDialog(true); }}
          sx={{ borderRadius: "10px", textTransform: "none", bgcolor: ADMIN_ACCENT, "&:hover": { bgcolor: "#3f51b5" } }}
        >
          Tao passage moi
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tim ten passage hoac topic..."
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          sx={{ flex: 1, minWidth: 240 }}
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
          <Select value={levelFilter} label="Cap do" onChange={(event) => { setLevelFilter(event.target.value); setPage(1); }}>
            <MenuItem value="">Tat ca</MenuItem>
            {LEVELS.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Public</InputLabel>
          <Select value={publishedFilter} label="Public" onChange={(event) => { setPublishedFilter(event.target.value); setPage(1); }}>
            <MenuItem value="">Tat ca</MenuItem>
            <MenuItem value="true">Da public</MenuItem>
            <MenuItem value="false">Ban nhap</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Passage</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Cap do</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Thoi luong</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>So cau hoi</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Public</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="right">Hanh dong</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} sx={{ py: 3 }}>Dang tai du lieu...</TableCell></TableRow>
            ) : passages.length === 0 ? (
              <TableRow><TableCell colSpan={6} sx={{ py: 3 }} align="center">Chua co listening passage nao.</TableCell></TableRow>
            ) : passages.map((passage) => (
              <TableRow key={passage.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>{passage.title}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{passage.topic || "Khong co topic"}</Typography>
                  {!passageReady(passage) && (
                    <Chip
                      label="Can it nhat 3 cau hoi truoc khi public"
                      size="small"
                      color="warning"
                      sx={{ mt: 0.75, fontWeight: 700, fontSize: "0.68rem" }}
                    />
                  )}
                </TableCell>
                <TableCell>{passage.level}</TableCell>
                <TableCell>{passage.estimated_seconds}s</TableCell>
                <TableCell>{passage.question_count}</TableCell>
                <TableCell align="center">
                  <Tooltip title={!passageReady(passage) ? "Passage chua du 3 cau hoi." : ""}>
                    <span>
                      <Switch
                        checked={Boolean(passage.is_published)}
                        disabled={!passageReady(passage)}
                        onChange={(event) => togglePublishMutation.mutate({ id: passage.id, is_published: event.target.checked })}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Quan ly cau hoi">
                    <IconButton size="small" aria-label={`quan-ly-cau-hoi-${passage.id}`} onClick={() => setManagePassage(passage)}>
                      <LibraryMusicRoundedIcon fontSize="small" sx={{ color: "#00897b" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sua passage">
                    <IconButton size="small" aria-label={`sua-passage-${passage.id}`} onClick={() => { setFormData({ ...emptyPassage, ...passage }); setOpenDialog(true); }}>
                      <EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xoa passage">
                    <IconButton
                      size="small"
                      aria-label={`xoa-passage-${passage.id}`}
                      onClick={() => window.confirm("Xóa passage này sẽ xóa luôn toàn bộ câu hỏi nghe hiểu gắn với passage. Bạn có chắc muốn tiếp tục?") && deleteMutation.mutate(passage.id)}
                    >
                      <DeleteRoundedIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pageCount > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={pageCount} page={page} onChange={(_, value) => setPage(value)} shape="rounded" />
        </Stack>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{formData.id ? "Sua listening passage" : "Tao listening passage"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Tieu de" value={formData.title} onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))} fullWidth />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Topic" value={formData.topic} onChange={(event) => setFormData((prev) => ({ ...prev, topic: event.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Cap do</InputLabel>
              <Select value={formData.level} label="Cap do" onChange={(event) => setFormData((prev) => ({ ...prev, level: event.target.value }))}>
                {LEVELS.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Transcript" value={formData.transcript} onChange={(event) => setFormData((prev) => ({ ...prev, transcript: event.target.value }))} fullWidth multiline rows={5} />
          <TextField label="Ban dich tieng Viet" value={formData.translation_vi} onChange={(event) => setFormData((prev) => ({ ...prev, translation_vi: event.target.value }))} fullWidth multiline rows={3} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Thoi luong (giay)" type="number" value={formData.estimated_seconds} onChange={(event) => setFormData((prev) => ({ ...prev, estimated_seconds: Number(event.target.value) || 30 }))} fullWidth />
            <TextField label="Ngon ngu TTS" value={formData.tts_lang} onChange={(event) => setFormData((prev) => ({ ...prev, tts_lang: event.target.value || "en-US" }))} fullWidth />
            <TextField label="Toc do doc" type="number" inputProps={{ step: 0.1, min: 0.5, max: 1.5 }} value={formData.tts_rate} onChange={(event) => setFormData((prev) => ({ ...prev, tts_rate: Number(event.target.value) || 0.9 }))} fullWidth />
          </Box>
          <Alert severity="info" sx={{ borderRadius: "12px" }}>
            Passage duoc public sau khi co transcript va it nhat 3 cau hoi nghe hieu.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Huy</Button>
          <Button
            onClick={() => saveMutation.mutate(formData)}
            variant="contained"
            disabled={!formData.title.trim() || !formData.transcript.trim() || saveMutation.isPending}
            sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none" }}
          >
            Luu passage
          </Button>
        </DialogActions>
      </Dialog>

      {managePassage && (
        <QuestionManagerDialog
          passage={managePassage}
          open={Boolean(managePassage)}
          onClose={() => setManagePassage(null)}
          onToast={setToast}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity} sx={{ width: "100%", borderRadius: "12px" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminListening;
