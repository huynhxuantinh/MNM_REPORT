import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, IconButton, Tooltip, Skeleton, Pagination, Stack,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Chip, Switch, FormControlLabel, Divider,
  CircularProgress, InputAdornment,
} from "@mui/material";
import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { EditRounded as EditRoundedIcon } from "@mui/icons-material";
import { DeleteRounded as DeleteRoundedIcon } from "@mui/icons-material";
import { AddRounded as AddRoundedIcon } from "@mui/icons-material";
import { MenuBookRounded as MenuBookRoundedIcon } from "@mui/icons-material";
import { RemoveCircleOutlineRounded as RemoveCircleOutlineRoundedIcon } from "@mui/icons-material";
import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from "@mui/icons-material";
import { PublicRounded as PublicRoundedIcon } from "@mui/icons-material";
import { LockRounded as LockRoundedIcon } from "@mui/icons-material";
import vocabularyApi from "@/services/vocabularyApi";

const ADMIN_BG     = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE    = 15;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];
const LEVEL_COLORS = {
  A1: "#4caf50", A2: "#8bc34a", B1: "#ffeb3b",
  B2: "#ffb300", C1: "#f4511e", C2: "#d32f2f", TOEIC: "#0097a7",
};

const EMPTY_FORM = { id: null, name: "", description: "", level: "", is_public: true };

// ── Dialog quản lý từ vựng trong bộ từ ───────────────────────────────────────

const ManageWordsDialog = ({ wordset, open, onClose }) => {
  const qc = useQueryClient();
  const [wordSearch, setWordSearch] = useState("");

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["wordset-detail-admin", wordset?.id],
    queryFn: () => vocabularyApi.getSet(wordset.id).then((r) => r.data),
    enabled: open && !!wordset?.id,
    staleTime: 0,
  });

  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ["word-search-ws-admin", wordSearch],
    queryFn: () => vocabularyApi.getWords({ search: wordSearch, page_size: 15 }).then((r) => r.data),
    enabled: wordSearch.trim().length >= 1,
    staleTime: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["wordset-detail-admin", wordset?.id] });
    qc.invalidateQueries({ queryKey: ["admin-wordsets"] });
  };

  const { mutate: addWord, isPending: isAdding } = useMutation({
    mutationFn: (wordId) => vocabularyApi.addWordToSet(wordset.id, { word_id: wordId, order_index: 0 }),
    onSuccess: invalidate,
  });

  const { mutate: removeWord, isPending: isRemoving } = useMutation({
    mutationFn: (wordId) => vocabularyApi.removeWordFromSet(wordset.id, wordId),
    onSuccess: invalidate,
  });

  const currentWords   = detail?.words ?? [];
  const currentWordIds = new Set(currentWords.map((w) => w.word.id));
  const searchResults  = (searchData?.results ?? []).filter((w) => !currentWordIds.has(w.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: ADMIN_BG }}>
        Quản lý từ vựng
        <Typography component="span" sx={{ fontWeight: 400, color: "text.secondary", ml: 1, fontSize: "0.95rem" }}>
          — {wordset?.name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: "flex", minHeight: 420 }}>

          {/* Cột trái: từ đang có */}
          <Box sx={{ flex: 1, p: 2.5, borderRight: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG, mb: 1.5 }}>
              Từ trong bộ
              <Chip label={currentWords.length} size="small"
                sx={{ ml: 1, fontWeight: 700, fontSize: "0.7rem", bgcolor: `${ADMIN_ACCENT}18`, color: ADMIN_ACCENT }} />
            </Typography>

            {loadingDetail ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress size={28} sx={{ color: ADMIN_ACCENT }} />
              </Box>
            ) : currentWords.length === 0 ? (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                Chưa có từ nào. Tìm và thêm từ bên phải.
              </Typography>
            ) : (
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {currentWords.map((wsw) => (
                  <Box key={wsw.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.875, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>{wsw.word.text}</Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {wsw.word.definition_vi}
                      </Typography>
                    </Box>
                    <Tooltip title="Xóa khỏi bộ từ">
                      <IconButton size="small" onClick={() => removeWord(wsw.word.id)} disabled={isRemoving}>
                        <RemoveCircleOutlineRoundedIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Cột phải: tìm & thêm */}
          <Box sx={{ flex: 1, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG, mb: 1.5 }}>
              Thêm từ vựng
            </Typography>
            <TextField
              size="small" fullWidth
              placeholder="Tìm từ vựng để thêm…"
              value={wordSearch}
              onChange={(e) => setWordSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }}
              sx={{ mb: 1.5 }}
            />
            {searching && <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}><CircularProgress size={24} sx={{ color: ADMIN_ACCENT }} /></Box>}
            {!searching && wordSearch.trim() && searchResults.length === 0 && searchData && (
              <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>Không tìm thấy từ nào (hoặc đã thêm hết).</Typography>
            )}
            {!wordSearch.trim() && (
              <Typography sx={{ color: "text.disabled", fontSize: "0.82rem" }}>Nhập từ khóa để tìm kiếm.</Typography>
            )}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {searchResults.map((w) => (
                <Box key={w.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.875, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>{w.text}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.definition_vi}
                      {w.phonetic && <span style={{ marginLeft: 6, color: "#9e9e9e" }}>{w.phonetic}</span>}
                    </Typography>
                  </Box>
                  <Tooltip title="Thêm vào bộ từ">
                    <IconButton size="small" onClick={() => addWord(w.id)} disabled={isAdding}>
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

// ── Trang chính ───────────────────────────────────────────────────────────────

const AdminWordSets = () => {
  const qc = useQueryClient();
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [toast, setToast]             = useState(null);
  const [openDialog, setOpenDialog]   = useState(false);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [manageWS, setManageWS]       = useState(null);

  const params = { search: search || undefined, page, page_size: PAGE_SIZE };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-wordsets", params],
    queryFn: () => vocabularyApi.getSets(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { mutate: saveSet, isPending: isSaving } = useMutation({
    mutationFn: (payload) =>
      payload.id
        ? vocabularyApi.updateSet(payload.id, payload)
        : vocabularyApi.createSet(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wordsets"] });
      setToast({ msg: formData.id ? "Cập nhật bộ từ thành công" : "Tạo bộ từ thành công", severity: "success" });
      setOpenDialog(false);
    },
    onError: (err) => {
      const msg = err?.response?.data?.name?.[0] || "Lỗi lưu bộ từ";
      setToast({ msg, severity: "error" });
    },
  });

  const { mutate: deleteSet } = useMutation({
    mutationFn: (id) => vocabularyApi.deleteSet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-wordsets"] });
      setToast({ msg: "Đã xóa bộ từ", severity: "success" });
    },
    onError: () => setToast({ msg: "Lỗi xóa bộ từ", severity: "error" }),
  });

  const sets     = data?.results ?? [];
  const total    = data?.count ?? 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenNew  = () => { setFormData(EMPTY_FORM); setOpenDialog(true); };
  const handleOpenEdit = (s) => { setFormData({ id: s.id, name: s.name, description: s.description || "", level: s.level || "", is_public: s.is_public }); setOpenDialog(true); };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>Quản lý bộ từ vựng</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>{total} bộ từ trong hệ thống</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleOpenNew}
          sx={{ borderRadius: "10px", textTransform: "none", bgcolor: ADMIN_ACCENT, "&:hover": { bgcolor: "#3f51b5" } }}>
          Tạo bộ từ mới
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small" placeholder="Tìm tên bộ từ…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment> }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={0}
        sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Tên bộ từ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Cấp độ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Số từ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Người tạo</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton height={40} /></TableCell></TableRow>
                ))
              : sets.map((s) => (
                  <TableRow key={s.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>{s.name}</Typography>
                      {s.description && (
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", maxWidth: 340, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.level
                        ? <Chip label={s.level} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fff", bgcolor: LEVEL_COLORS[s.level] || "#9e9e9e" }} />
                        : <Typography sx={{ fontSize: "0.8rem", color: "text.disabled" }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.word_count ?? 0}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={s.is_public ? <PublicRoundedIcon sx={{ fontSize: "14px !important" }} /> : <LockRoundedIcon sx={{ fontSize: "14px !important" }} />}
                        label={s.is_public ? "Công khai" : "Riêng tư"}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: "0.72rem",
                          bgcolor: s.is_public ? "#e8f5e918" : "rgba(0,0,0,0.06)",
                          color: s.is_public ? "#2e7d32" : "text.secondary",
                          border: `1px solid ${s.is_public ? "#a5d6a7" : "rgba(0,0,0,0.12)"}`,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{s.created_by_name || "—"}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Quản lý từ vựng">
                        <IconButton size="small" onClick={() => setManageWS(s)}>
                          <MenuBookRoundedIcon fontSize="small" sx={{ color: "#00897b" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => handleOpenEdit(s)}>
                          <EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" onClick={() => { if (window.confirm(`Xóa bộ từ "${s.name}"?`)) deleteSet(s.id); }}>
                          <DeleteRoundedIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && sets.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>Không tìm thấy bộ từ nào.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={numPages} page={page} onChange={(_, p) => setPage(p)} shape="rounded" />
        </Stack>
      )}

      {/* Dialog tạo / sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{formData.id ? "Sửa bộ từ" : "Tạo bộ từ mới"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Tên bộ từ" required fullWidth value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            inputProps={{ maxLength: 200 }} />
          <TextField label="Mô tả" fullWidth multiline rows={2} value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            inputProps={{ maxLength: 500 }} />
          <FormControl fullWidth size="small">
            <InputLabel>Cấp độ</InputLabel>
            <Select value={formData.level} label="Cấp độ"
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
              <MenuItem value="">Không chọn</MenuItem>
              {LEVELS.map((lv) => <MenuItem key={lv} value={lv}>{lv}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                sx={{ "& .MuiSwitch-thumb": { bgcolor: formData.is_public ? ADMIN_ACCENT : "#bbb" } }} />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {formData.is_public ? "Công khai" : "Riêng tư"}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                  {formData.is_public ? "Tất cả người dùng đều xem được" : "Chỉ admin xem được"}
                </Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={() => saveSet(formData)} variant="contained"
            disabled={!formData.name.trim() || isSaving}
            sx={{ bgcolor: ADMIN_ACCENT, borderRadius: "10px", textTransform: "none" }}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog quản lý từ */}
      {manageWS && (
        <ManageWordsDialog
          wordset={manageWS}
          open={Boolean(manageWS)}
          onClose={() => setManageWS(null)}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity} sx={{ width: "100%", borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminWordSets;


