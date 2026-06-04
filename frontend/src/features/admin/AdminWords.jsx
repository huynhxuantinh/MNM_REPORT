import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, IconButton, Tooltip, Skeleton, Pagination, Stack,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Chip,
} from "@mui/material";
import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { EditRounded as EditRoundedIcon } from "@mui/icons-material";
import { DeleteRounded as DeleteRoundedIcon } from "@mui/icons-material";
import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import { UploadFileRounded as UploadFileRoundedIcon } from "@mui/icons-material";
import vocabularyApi from "@/services/vocabularyApi";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE = 15;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS = {
  A1: "#4caf50", A2: "#8bc34a", B1: "#ffeb3b",
  B2: "#ffb300", C1: "#f4511e", C2: "#d32f2f"
};

const AdminWords = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, text: "", phonetic: "", part_of_speech: "", level: "A1", definition_vi: "", definition_en: "", example_vi: "", example_en: "" });
  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const params = {
    search: search || undefined,
    level: levelFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-words", params],
    queryFn: () => vocabularyApi.getWords(params).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: saveWord, isPending: isSaving } = useMutation({
    mutationFn: (payload) => payload.id ? vocabularyApi.updateWord(payload.id, payload) : vocabularyApi.createWord(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-words"] });
      setToast({ msg: formData.id ? "Cập nhật từ vựng thành công" : "Thêm từ vựng thành công", severity: "success" });
      setOpenDialog(false);
    },
    onError: () => setToast({ msg: "Lỗi lưu từ vựng", severity: "error" }),
  });

  const { mutate: deleteWord } = useMutation({
    mutationFn: (id) => vocabularyApi.deleteWord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-words"] });
      setToast({ msg: "Đã xóa từ vựng", severity: "success" });
    },
    onError: () => setToast({ msg: "Lỗi xóa từ vựng", severity: "error" }),
  });

  const { mutate: importCsv, isPending: isImporting } = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return vocabularyApi.importCsv(fd);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-words"] });
      setToast({ msg: `Import thành công ${res.data.imported} từ. Bỏ qua: ${res.data.skipped}.`, severity: "success" });
      setOpenImport(false);
      setImportFile(null);
    },
    onError: () => setToast({ msg: "Lỗi import file", severity: "error" }),
  });

  const words = data?.results || [];
  const total = data?.count || 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenNew = () => {
    setFormData({ id: null, text: "", phonetic: "", part_of_speech: "", level: "A1", definition_vi: "", definition_en: "", example_vi: "", example_en: "" });
    setOpenDialog(true);
  };

  const handleOpenEdit = (w) => {
    setFormData({ ...w });
    setOpenDialog(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Quản lý từ vựng
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            {total} từ vựng trong hệ thống
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileRoundedIcon />}
            onClick={() => setOpenImport(true)}
            sx={{ borderRadius: "10px", textTransform: "none", borderColor: ADMIN_ACCENT, color: ADMIN_ACCENT }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenNew}
            sx={{ borderRadius: "10px", textTransform: "none", bgcolor: ADMIN_ACCENT, "&:hover": { bgcolor: "#3f51b5" } }}
          >
            Thêm từ mới
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tìm từ vựng, định nghĩa…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} /> }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Cấp độ</InputLabel>
          <Select value={levelFilter} label="Cấp độ" onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Tất cả</MenuItem>
            {LEVELS.map(lvl => <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Từ vựng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Từ loại</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Cấp độ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Định nghĩa (VI)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton height={40} /></TableCell></TableRow>
            )) : words.map((w) => (
              <TableRow key={w.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>{w.text}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{w.phonetic}</Typography>
                </TableCell>
                <TableCell><Chip label={w.part_of_speech || "—"} size="small" sx={{ fontSize: "0.7rem", height: 20 }} /></TableCell>
                <TableCell>
                  <Chip label={w.level} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fff", bgcolor: LEVEL_COLORS[w.level] || "#9e9e9e" }} />
                </TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {w.definition_vi}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Sửa"><IconButton size="small" onClick={() => handleOpenEdit(w)}><EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} /></IconButton></Tooltip>
                  <Tooltip title="Xóa"><IconButton size="small" onClick={() => { if(window.confirm("Chắc chắn xóa?")) deleteWord(w.id); }}><DeleteRoundedIcon fontSize="small" color="error" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && words.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Không tìm thấy từ vựng nào.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={numPages} page={page} onChange={(_, p) => setPage(p)} shape="rounded" />
        </Stack>
      )}

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{formData.id ? "Sửa từ vựng" : "Thêm từ mới"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Từ vựng (EN)" required fullWidth value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Phiên âm" fullWidth value={formData.phonetic} onChange={e => setFormData({ ...formData, phonetic: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Từ loại</InputLabel>
              <Select value={formData.part_of_speech} label="Từ loại" onChange={e => setFormData({ ...formData, part_of_speech: e.target.value })}>
                <MenuItem value="noun">Danh từ (noun)</MenuItem>
                <MenuItem value="verb">Động từ (verb)</MenuItem>
                <MenuItem value="adjective">Tính từ (adjective)</MenuItem>
                <MenuItem value="adverb">Trạng từ (adverb)</MenuItem>
                <MenuItem value="pronoun">Đại từ (pronoun)</MenuItem>
                <MenuItem value="preposition">Giới từ (preposition)</MenuItem>
                <MenuItem value="conjunction">Liên từ (conjunction)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Cấp độ</InputLabel>
              <Select value={formData.level} label="Cấp độ" onChange={e => setFormData({ ...formData, level: e.target.value })}>
                {LEVELS.map(lvl => <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Định nghĩa (VI)" required fullWidth multiline rows={2} value={formData.definition_vi} onChange={e => setFormData({ ...formData, definition_vi: e.target.value })} />
          <TextField label="Định nghĩa (EN)" fullWidth multiline rows={2} value={formData.definition_en} onChange={e => setFormData({ ...formData, definition_en: e.target.value })} />
          <TextField label="Ví dụ (EN)" fullWidth multiline rows={2} value={formData.example_en} onChange={e => setFormData({ ...formData, example_en: e.target.value })} />
          <TextField label="Ví dụ (VI)" fullWidth multiline rows={2} value={formData.example_vi} onChange={e => setFormData({ ...formData, example_vi: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={() => saveWord(formData)} variant="contained" disabled={!formData.text || !formData.definition_vi || isSaving} sx={{ bgcolor: ADMIN_ACCENT }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={openImport} onClose={() => setOpenImport(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Import từ vựng</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "0.875rem", mb: 2 }}>Vui lòng chọn file CSV có các cột: <b>text, phonetic, part_of_speech, definition_vi, example_en, level</b>.</Typography>
          <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} style={{ width: "100%" }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenImport(false)} color="inherit">Hủy</Button>
          <Button onClick={() => importCsv(importFile)} variant="contained" disabled={!importFile || isImporting} sx={{ bgcolor: ADMIN_ACCENT }}>Import</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity} sx={{ width: "100%", borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminWords;


