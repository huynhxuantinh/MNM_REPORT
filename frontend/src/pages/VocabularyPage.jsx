import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Tabs, Tab, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, MenuItem, Select, FormControl, InputLabel,
  Alert, Skeleton, Pagination, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
} from "@mui/material";
import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon        from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import FileUploadRoundedIcon    from "@mui/icons-material/FileUploadRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon      from "@mui/icons-material/BookmarkRounded";
import MenuBookRoundedIcon      from "@mui/icons-material/MenuBookRounded";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import vocabularyApi from "@/api/vocabularyApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC", "IELTS"];
const POS_OPTIONS = ["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "pronoun", "other"];
const LEVEL_CHIP = {
  A1: { bg: "#e8f5e9", color: "#2e7d32" }, A2: { bg: "#e3f2fd", color: "#1565c0" },
  B1: { bg: "#fff3e0", color: "#e65100" }, B2: { bg: "#fce4ec", color: "#c62828" },
  C1: { bg: "#ede7f6", color: "#4527a0" }, C2: { bg: "#fafafa", color: "#212121" },
  TOEIC: { bg: "#e0f7fa", color: "#006064" }, IELTS: { bg: "#fff8e1", color: "#f57f17" },
};

const emptyWord = { text: "", phonetic: "", part_of_speech: "noun", definition_en: "", definition_vi: "", example_en: "", example_vi: "", level: "A1", image_url: "" };
const emptySet  = { name: "", description: "", level: "A1", is_public: true };

// ── Word form dialog ──────────────────────────────────────────────────────────

const WordDialog = ({ open, onClose, initial, onSave, saving, error }) => {
  const [form, setForm] = useState(initial ?? emptyWord);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // Reset when initial changes (open with different word)
  useEffect(() => { setForm(initial ?? emptyWord); }, [initial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: colors.greenStarbucks }}>
        {initial?.id ? "Sửa từ vựng" : "Thêm từ vựng mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <SbInput label="Từ *" value={form.text} onChange={set("text")} required />
          <SbInput label="Phiên âm" value={form.phonetic} onChange={set("phonetic")} placeholder="/ˈwɜːd/" />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <FormControl size="small">
            <InputLabel>Loại từ</InputLabel>
            <Select value={form.part_of_speech} label="Loại từ" onChange={set("part_of_speech")}>
              {POS_OPTIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Cấp độ</InputLabel>
            <Select value={form.level} label="Cấp độ" onChange={set("level")}>
              {LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <SbInput label="Định nghĩa tiếng Anh" value={form.definition_en} onChange={set("definition_en")} multiline rows={2} />
        <SbInput label="Định nghĩa tiếng Việt *" value={form.definition_vi} onChange={set("definition_vi")} multiline rows={2} required />
        <SbInput label="Ví dụ tiếng Anh" value={form.example_en} onChange={set("example_en")} />
        <SbInput label="Bản dịch ví dụ" value={form.example_vi} onChange={set("example_vi")} />
        <SbInput label="URL hình ảnh" value={form.image_url} onChange={set("image_url")} placeholder="https://..." />
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={onClose}>Hủy</SbButton>
        <SbButton variant="primary" loading={saving} onClick={() => onSave(form)}
          disabled={!form.text || !form.definition_vi}>
          Lưu
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── WordSet form dialog ───────────────────────────────────────────────────────

const SetDialog = ({ open, onClose, initial, onSave, saving, error }) => {
  const [form, setForm] = useState(initial ?? emptySet);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { setForm(initial ?? emptySet); }, [initial]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: colors.greenStarbucks }}>
        {initial?.id ? "Sửa bộ từ" : "Tạo bộ từ mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}
        <SbInput label="Tên bộ từ *" value={form.name} onChange={set("name")} required />
        <SbInput label="Mô tả" value={form.description} onChange={set("description")} multiline rows={2} />
        <FormControl size="small">
          <InputLabel>Cấp độ</InputLabel>
          <Select value={form.level} label="Cấp độ" onChange={set("level")}>
            {LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Quyền truy cập</InputLabel>
          <Select value={form.is_public ? "public" : "private"} label="Quyền truy cập"
            onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.value === "public" }))}>
            <MenuItem value="public">Công khai</MenuItem>
            <MenuItem value="private">Riêng tư</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={onClose}>Hủy</SbButton>
        <SbButton variant="primary" loading={saving} onClick={() => onSave(form)}
          disabled={!form.name}>Lưu</SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── CSV import dialog ─────────────────────────────────────────────────────────

const CsvDialog = ({ open, onClose }) => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();

  const importMut = useMutation({
    mutationFn: (f) => { const fd = new FormData(); fd.append("file", f); return vocabularyApi.importCsv(fd).then((r) => r.data); },
    onSuccess: (d) => { setResult(d); qc.invalidateQueries({ queryKey: ["words"] }); },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: colors.greenStarbucks }}>Nhập CSV</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1.5 }}>
          Header bắt buộc: <code>text</code>. Tùy chọn: <code>phonetic, part_of_speech, definition_en, definition_vi, example_en, example_vi, level, image_url</code>
        </Typography>
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files[0];
            if (!f) return;
            if (f.size > 2 * 1024 * 1024) {
              alert("File quá lớn. Tối đa 2 MB.");
              e.target.value = "";
              return;
            }
            if (!f.name.toLowerCase().endsWith(".csv")) {
              alert("Chỉ chấp nhận file .csv");
              e.target.value = "";
              return;
            }
            setFile(f);
          }}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <SbButton variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
            Chọn file
          </SbButton>
          {file && <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{file.name}</Typography>}
        </Box>

        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Nhập thành công <strong>{result.imported}</strong> từ · bỏ qua <strong>{result.skipped}</strong>
            {result.errors?.length > 0 && ` · ${result.errors.length} lỗi`}
          </Alert>
        )}
        {importMut.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>Import thất bại. Kiểm tra định dạng file.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={onClose}>Đóng</SbButton>
        <SbButton variant="primary" loading={importMut.isPending} disabled={!file}
          onClick={() => importMut.mutate(file)}>
          Nhập
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── WordSet CSV import dialog ─────────────────────────────────────────────────

const CsvImportSetDialog = ({ open, onClose }) => {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", level: "A1", is_public: true });
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const importMut = useMutation({
    mutationFn: ({ file: f, form: fd }) => {
      const data = new FormData();
      data.append("name", fd.name);
      data.append("description", fd.description);
      data.append("level", fd.level);
      data.append("is_public", String(fd.is_public));
      data.append("file", f);
      return vocabularyApi.importSetCsv(data).then((r) => r.data);
    },
    onSuccess: (d) => { setResult(d); qc.invalidateQueries({ queryKey: ["wordsets"] }); },
  });

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setForm({ name: "", description: "", level: "A1", is_public: true });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: colors.greenStarbucks }}>Nhập CSV — Tạo bộ từ</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: "16px !important" }}>
        <SbInput label="Tên bộ từ *" value={form.name} onChange={set("name")} required />
        <SbInput label="Mô tả" value={form.description} onChange={set("description")} multiline rows={2} />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <FormControl size="small">
            <InputLabel>Cấp độ</InputLabel>
            <Select value={form.level} label="Cấp độ" onChange={set("level")}>
              {LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Quyền truy cập</InputLabel>
            <Select value={form.is_public ? "public" : "private"} label="Quyền truy cập"
              onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.value === "public" }))}>
              <MenuItem value="public">Công khai</MenuItem>
              <MenuItem value="private">Riêng tư</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
          Header CSV bắt buộc: <code>text</code>. Tùy chọn: <code>phonetic, part_of_speech, definition_en, definition_vi, example_en, example_vi, level</code>
        </Typography>
        <input type="file" accept=".csv,text/csv" ref={fileRef} style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files[0]; if (f) setFile(f); }} />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <SbButton variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
            Chọn file CSV
          </SbButton>
          {file && <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{file.name}</Typography>}
        </Box>
        {result && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Tạo <strong>{result.name}</strong> — thêm <strong>{result.imported}</strong> từ
            {result.errors?.length > 0 && ` · ${result.errors.length} lỗi`}
          </Alert>
        )}
        {importMut.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>Import thất bại. Kiểm tra định dạng file.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={handleClose}>Đóng</SbButton>
        <SbButton variant="primary" loading={importMut.isPending}
          disabled={!file || !form.name}
          onClick={() => importMut.mutate({ file, form })}>
          Nhập
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── Words tab ─────────────────────────────────────────────────────────────────

const WordsTab = ({ isTeacher }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch]     = useState("");
  const [levelFilter, setLevel] = useState("");
  const [wordDialog, setWordDialog] = useState({ open: false, word: null });
  const [csvOpen, setCsvOpen]   = useState(false);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);

  const PAGE_SIZE = 20;

  useEffect(() => { setPage(1); }, [search, levelFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["words", search, levelFilter, page],
    queryFn: () => vocabularyApi.getWords({ search, level: levelFilter || undefined, page, page_size: PAGE_SIZE }).then((r) => r.data),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const words    = data?.results ?? [];
  const total    = data?.count ?? 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const saveMut = useMutation({
    mutationFn: (form) => form.id
      ? vocabularyApi.updateWord(form.id, form).then((r) => r.data)
      : vocabularyApi.createWord(form).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["words"] }); setWordDialog({ open: false }); setError(null); },
    onError: (e) => setError(e?.response?.data?.detail ?? "Lưu thất bại."),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => vocabularyApi.deleteWord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["words"] }),
  });

  const bookmarkMut = useMutation({
    mutationFn: (id) => vocabularyApi.bookmarkWord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["words"] }),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField size="small" placeholder="Tìm từ vựng..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 180, "& .MuiOutlinedInput-root": { borderRadius: "50px" } }} />
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Level</InputLabel>
          <Select value={levelFilter} label="Level" onChange={(e) => setLevel(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {LEVELS.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        {isTeacher && (
          <>
            <SbButton variant="primary" size="small" startIcon={<AddRoundedIcon />}
              onClick={() => setWordDialog({ open: true, word: null })}>Thêm từ</SbButton>
            <SbButton variant="outlined" size="small" startIcon={<FileUploadRoundedIcon />}
              onClick={() => setCsvOpen(true)}>Nhập CSV</SbButton>
          </>
        )}
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={48} variant="rectangular" sx={{ borderRadius: 1 }} />)}
        </Box>
      ) : words.length === 0 ? (
        <SbCard><Box sx={{ textAlign: "center", py: 5 }}>
          <MenuBookRoundedIcon sx={{ fontSize: 48, color: colors.greenLight, mb: 1 }} />
          <Typography sx={{ color: "text.secondary" }}>Chưa có từ nào</Typography>
        </Box></SbCard>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "12px", boxShadow: "none", border: "1px solid rgba(0,0,0,0.08)", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.8rem", bgcolor: "#fafaf9" } }}>
                <TableCell>Từ</TableCell>
                <TableCell>Phiên âm</TableCell>
                <TableCell>Loại từ</TableCell>
                <TableCell>Nghĩa (VI)</TableCell>
                <TableCell>Level</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {words.map((w) => {
                const lv = LEVEL_CHIP[w.level] ?? {};
                return (
                  <TableRow key={w.id} sx={{ "&:hover": { bgcolor: "#f9f9f8" } }}>
                    <TableCell
                      sx={{ fontWeight: 700, color: colors.greenStarbucks, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                      onClick={() => navigate(`/vocabulary/${w.id}`)}
                    >
                      {w.text}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      {w.phonetic ? `/${w.phonetic}/` : "—"}
                    </TableCell>
                    <TableCell>{w.part_of_speech || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.definition_vi}
                    </TableCell>
                    <TableCell>
                      {w.level && <Chip label={w.level} size="small"
                        sx={{ bgcolor: lv.bg, color: lv.color, fontWeight: 700, fontSize: "0.68rem", height: 18 }} />}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                        <Tooltip title="Bookmark" arrow>
                          <IconButton size="small" onClick={() => bookmarkMut.mutate(w.id)}
                            sx={{ color: w.is_bookmarked ? colors.gold : "text.secondary" }}>
                            {w.is_bookmarked ? <BookmarkRoundedIcon fontSize="small" /> : <BookmarkBorderRoundedIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {isTeacher && (
                          <>
                            <Tooltip title="Sửa" arrow>
                              <IconButton size="small" sx={{ color: colors.greenAccent }}
                                onClick={() => { setError(null); setWordDialog({ open: true, word: w }); }}>
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa" arrow>
                              <IconButton size="small" sx={{ color: colors.red }}
                                onClick={() => window.confirm("Xóa từ này?") && deleteMut.mutate(w.id)}>
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {numPages > 1 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {total.toLocaleString()} từ
          </Typography>
          <Pagination count={numPages} page={page} onChange={(_, p) => setPage(p)}
            color="primary" shape="rounded" size="small" />
        </Stack>
      )}

      <WordDialog
        open={wordDialog.open}
        initial={wordDialog.word}
        onClose={() => setWordDialog({ open: false })}
        onSave={(form) => saveMut.mutate(form)}
        saving={saveMut.isPending}
        error={error}
      />
      <CsvDialog open={csvOpen} onClose={() => setCsvOpen(false)} />
    </Box>
  );
};

// ── WordSets tab ──────────────────────────────────────────────────────────────

const SetsTab = ({ isTeacher }) => {
  const qc = useQueryClient();
  const [setDialog, setSetDialog] = useState({ open: false, set: null });
  const [csvSetOpen, setCsvSetOpen] = useState(false);
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wordsets"],
    queryFn: () => vocabularyApi.getSets({ page_size: 200 }).then((r) => r.data),
    staleTime: 60_000,
  });

  const sets = data?.results ?? [];

  const saveMut = useMutation({
    mutationFn: (form) => form.id
      ? vocabularyApi.updateSet(form.id, form).then((r) => r.data)
      : vocabularyApi.createSet(form).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wordsets"] }); setSetDialog({ open: false }); setError(null); },
    onError: () => setError("Lưu thất bại."),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => vocabularyApi.deleteSet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wordsets"] }),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isTeacher && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <SbButton variant="outlined" size="small" startIcon={<FileUploadRoundedIcon />}
            onClick={() => setCsvSetOpen(true)}>
            Nhập CSV
          </SbButton>
          <SbButton variant="primary" size="small" startIcon={<AddRoundedIcon />}
            onClick={() => { setError(null); setSetDialog({ open: true, set: null }); }}>
            Tạo bộ từ
          </SbButton>
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
          {[1,2,3].map(i => <Skeleton key={i} height={120} variant="rectangular" sx={{ borderRadius: "12px" }} />)}
        </Box>
      ) : sets.length === 0 ? (
        <SbCard><Box sx={{ textAlign: "center", py: 5 }}>
          <MenuBookRoundedIcon sx={{ fontSize: 48, color: colors.greenLight, mb: 1 }} />
          <Typography sx={{ color: "text.secondary" }}>Chưa có bộ từ nào</Typography>
        </Box></SbCard>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
          {sets.map((s) => {
            const lv = LEVEL_CHIP[s.level] ?? {};
            return (
              <SbCard key={s.id} sx={{ height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  {s.level
                    ? <Chip label={s.level} size="small"
                        sx={{ bgcolor: lv.bg, color: lv.color, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
                    : <Box />}
                  <Chip label={s.is_public ? "Công khai" : "Riêng tư"} size="small"
                    sx={{ bgcolor: s.is_public ? `${colors.greenAccent}18` : "#f5f5f5", color: s.is_public ? colors.greenAccent : "text.secondary", fontWeight: 600, fontSize: "0.68rem", height: 20 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary", mb: 0.5 }}>{s.name}</Typography>
                {s.description && <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>{s.description}</Typography>}
                <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
                  {s.word_count ?? 0} từ · {s.created_by_name}
                </Typography>
                {isTeacher && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <SbButton variant="outlined" size="small" startIcon={<EditRoundedIcon />}
                      onClick={() => { setError(null); setSetDialog({ open: true, set: s }); }}>Sửa</SbButton>
                    <SbButton variant="outlined" size="small" startIcon={<DeleteRoundedIcon />}
                      sx={{ color: colors.red, borderColor: `${colors.red}50` }}
                      onClick={() => window.confirm("Xóa bộ từ này?") && deleteMut.mutate(s.id)}>Xóa</SbButton>
                  </Box>
                )}
              </SbCard>
            );
          })}
        </Box>
      )}

      <SetDialog
        open={setDialog.open}
        initial={setDialog.set}
        onClose={() => setSetDialog({ open: false })}
        onSave={(form) => saveMut.mutate(form)}
        saving={saveMut.isPending}
        error={error}
      />
      <CsvImportSetDialog open={csvSetOpen} onClose={() => setCsvSetOpen(false)} />
    </Box>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const VocabularyPage = () => {
  const [tab, setTab] = useState(0);
  const { user } = useSelector((s) => s.auth);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
          {isTeacher ? "Quản lý từ vựng" : "Từ vựng"}
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          {isTeacher ? "Tạo, sửa, xóa từ và bộ từ" : "Khám phá kho từ vựng"}
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          "& .MuiTab-root": { fontWeight: 700, fontSize: "0.875rem", textTransform: "none" },
          "& .Mui-selected": { color: `${colors.greenAccent} !important` },
          "& .MuiTabs-indicator": { bgcolor: colors.greenAccent },
        }}>
        <Tab label="Từ vựng" />
        <Tab label="Bộ từ" />
      </Tabs>

      {tab === 0 ? <WordsTab isTeacher={isTeacher} /> : <SetsTab isTeacher={isTeacher} />}
    </Box>
  );
};

export default VocabularyPage;
