import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  Chip, Skeleton, Alert, Snackbar, IconButton, Tooltip,
  TextField, InputAdornment, Switch, FormControlLabel,
  Divider, CircularProgress,
} from "@mui/material";
import AddRoundedIcon                from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon             from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon               from "@mui/icons-material/EditRounded";
import CollectionsBookmarkRoundedIcon from "@mui/icons-material/CollectionsBookmarkRounded";
import SearchRoundedIcon             from "@mui/icons-material/SearchRounded";
import AddCircleOutlineRoundedIcon   from "@mui/icons-material/AddCircleOutlineRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import { SbButton, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import vocabularyApi from "@/api/vocabularyApi";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "TOEIC"];

const LEVEL_COLOR = {
  A1:    { bg: "#e8f5e9", color: "#2e7d32" },
  A2:    { bg: "#e3f2fd", color: "#1565c0" },
  B1:    { bg: "#fff3e0", color: "#e65100" },
  B2:    { bg: "#fce4ec", color: "#c62828" },
  C1:    { bg: "#ede7f6", color: "#4527a0" },
  C2:    { bg: "#fafafa", color: "#37474f" },
  TOEIC: { bg: "#e0f7fa", color: "#006064" },
};

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── WordSetFormDialog — tạo / sửa bộ từ ──────────────────────────────────────

const WordSetFormDialog = ({ open, onClose, onSave, saving, initial }) => {
  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [level, setLevel]           = useState("");
  const [isPublic, setIsPublic]     = useState(true);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setDesc(initial?.description ?? "");
      setLevel(initial?.level ?? "");
      setIsPublic(initial?.is_public ?? true);
    }
  }, [open, initial]);

  const handleClose = () => { onClose(); };
  const handleSave  = () => onSave({ name: name.trim(), description: description.trim(), level: level || "", is_public: isPublic });

  const isEdit = !!initial;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 1 }}>
        {isEdit ? "Sửa bộ từ" : "Tạo bộ từ mới"}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        <SbInput
          label="Tên bộ từ *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <SbInput
          label="Mô tả (tuỳ chọn)"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          multiline
          minRows={2}
        />
        <FormControl fullWidth size="small">
          <InputLabel>Cấp độ</InputLabel>
          <Select value={level} label="Cấp độ" onChange={(e) => setLevel(e.target.value)}>
            <MenuItem value="">— Không xác định —</MenuItem>
            {LEVELS.map((lv) => <MenuItem key={lv} value={lv}>{lv}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: colors.greenAccent },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: colors.greenAccent } }}
            />
          }
          label={
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                {isPublic ? "Công khai" : "Riêng tư"}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>
                {isPublic ? "Học sinh có thể xem bộ từ này" : "Chỉ bạn mới thấy"}
              </Typography>
            </Box>
          }
        />
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={handleClose}>Hủy</SbButton>
        <SbButton variant="primary" loading={saving} disabled={!name.trim()} onClick={handleSave}>
          {isEdit ? "Lưu thay đổi" : "Tạo bộ từ"}
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── DeleteDialog ──────────────────────────────────────────────────────────────

const DeleteDialog = ({ open, onClose, set, onConfirm, deleting }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: "16px" } }}>
    <DialogTitle sx={{ fontWeight: 800, color: "#c82014" }}>Xóa bộ từ</DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: "0.9rem" }}>
        Xóa bộ từ <strong style={{ color: colors.greenStarbucks }}>{set?.name}</strong>?
        Các từ bên trong sẽ không bị xóa.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
      <SbButton variant="outlined" onClick={onClose}>Hủy</SbButton>
      <SbButton
        variant="primary" loading={deleting}
        sx={{ bgcolor: "#c82014 !important", "&:hover": { bgcolor: "#a01510 !important" } }}
        onClick={onConfirm}
      >
        Xóa
      </SbButton>
    </DialogActions>
  </Dialog>
);

// ── ManageWordsDialog — thêm / xóa từ trong bộ ───────────────────────────────

const ManageWordsDialog = ({ open, onClose, set, show }) => {
  const qc = useQueryClient();
  const [wordSearch, setWordSearch] = useState("");
  const [debouncedSearch, setDS]    = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDS(wordSearch), 400);
    return () => clearTimeout(t);
  }, [wordSearch]);

  // Chi tiết bộ từ (kèm words)
  const { data: setDetail, isLoading: loadingSet } = useQuery({
    queryKey: ["wordset-manage", set?.id],
    queryFn: () => vocabularyApi.getSet(set.id).then((r) => r.data),
    enabled: open && !!set?.id,
    staleTime: 0,
  });

  // Tìm kiếm từ trong kho
  const { data: wordData, isLoading: loadingWords } = useQuery({
    queryKey: ["words-search-set", debouncedSearch],
    queryFn: () =>
      vocabularyApi.getWords({ search: debouncedSearch || undefined, page_size: 30 }).then((r) => r.data),
    enabled: open,
    staleTime: 30_000,
  });

  const inSetIds   = new Set((setDetail?.words ?? []).map((w) => w.word.id));
  const wordsInSet = setDetail?.words ?? [];
  const allWords   = (wordData?.results ?? []).filter((w) => !inSetIds.has(w.id));

  const addMut = useMutation({
    mutationFn: (wordId) => vocabularyApi.addWordToSet(set.id, { word_id: wordId, order_index: wordsInSet.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wordset-manage", set.id] });
      qc.invalidateQueries({ queryKey: ["wordsets-teacher"] });
      show("Đã thêm từ vào bộ từ.");
    },
    onError: (e) => show(e.response?.data?.detail ?? "Thêm từ thất bại.", "error"),
  });

  const removeMut = useMutation({
    mutationFn: (wordId) => vocabularyApi.removeWordFromSet(set.id, wordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wordset-manage", set.id] });
      qc.invalidateQueries({ queryKey: ["wordsets-teacher"] });
      show("Đã xóa từ khỏi bộ từ.");
    },
    onError: () => show("Xóa từ thất bại.", "error"),
  });

  const handleClose = () => { setWordSearch(""); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: "16px", maxHeight: "85vh" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 0.5 }}>
        Quản lý từ — {set?.name}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden", minHeight: 400 }}>
        {/* ── Left: Từ trong bộ ── */}
        <Box sx={{ flex: 1, borderRight: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column" }}>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks }}>
              Từ trong bộ ({wordsInSet.length})
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loadingSet ? (
              <Box sx={{ px: 2 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}
              </Box>
            ) : wordsInSet.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", px: 2 }}>
                <Typography sx={{ fontSize: "0.85rem", color: colors.textBlackSoft }}>
                  Chưa có từ nào trong bộ.
                </Typography>
              </Box>
            ) : (
              wordsInSet.map(({ word }) => (
                <Box key={word.id} sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  px: 2, py: 1,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }} noWrap>
                      {word.text}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }} noWrap>
                      {word.definition_vi}
                    </Typography>
                  </Box>
                  <Tooltip title="Xóa khỏi bộ" arrow>
                    <IconButton size="small"
                      onClick={() => removeMut.mutate(word.id)}
                      disabled={removeMut.isPending}
                      sx={{ color: "#c82014", "&:hover": { bgcolor: "#fdecea" } }}>
                      <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* ── Right: Tìm kiếm & thêm ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks, mb: 1 }}>
              Thêm từ
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder="Tìm từ vựng..."
              value={wordSearch}
              onChange={(e) => setWordSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {loadingWords
                      ? <CircularProgress size={14} />
                      : <SearchRoundedIcon sx={{ fontSize: 17, color: colors.textBlackSoft }} />}
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loadingWords ? (
              <Box sx={{ px: 2 }}>
                {[1, 2, 3].map((i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)}
              </Box>
            ) : allWords.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", px: 2 }}>
                <Typography sx={{ fontSize: "0.82rem", color: colors.textBlackSoft }}>
                  {debouncedSearch ? "Không tìm thấy từ phù hợp." : "Tất cả từ đã trong bộ."}
                </Typography>
              </Box>
            ) : (
              allWords.map((w) => (
                <Box key={w.id} sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  px: 2, py: 1,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  "&:hover": { bgcolor: `${colors.greenAccent}06` },
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }} noWrap>
                      {w.text}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }} noWrap>
                      {w.definition_vi}
                    </Typography>
                  </Box>
                  {w.level && (() => { const lc = LEVEL_COLOR[w.level] ?? {}; return (
                    <Chip label={w.level} size="small"
                      sx={{ height: 18, fontSize: "0.65rem", bgcolor: lc.bg, color: lc.color, flexShrink: 0 }} />
                  ); })()}
                  <Tooltip title="Thêm vào bộ" arrow>
                    <IconButton size="small"
                      onClick={() => addMut.mutate(w.id)}
                      disabled={addMut.isPending}
                      sx={{ color: colors.greenAccent, "&:hover": { bgcolor: `${colors.greenAccent}14` } }}>
                      <AddCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <SbButton variant="outlined" onClick={handleClose}>Xong</SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── Main TeacherWordSets ──────────────────────────────────────────────────────

const TeacherWordSets = () => {
  const qc = useQueryClient();
  const { toast, show, close: closeToast } = useToast();

  const [createDlg, setCreateDlg]   = useState(false);
  const [editDlg, setEditDlg]       = useState({ open: false, set: null });
  const [deleteDlg, setDeleteDlg]   = useState({ open: false, set: null });
  const [manageDlg, setManageDlg]   = useState({ open: false, set: null });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wordsets-teacher"],
    queryFn: () => vocabularyApi.getSets({ page_size: 100 }).then((r) => r.data),
    staleTime: 30_000,
  });

  const sets = data?.results ?? data ?? [];

  const createMut = useMutation({
    mutationFn: (d) => vocabularyApi.createSet(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wordsets-teacher"] });
      setCreateDlg(false);
      show("Đã tạo bộ từ mới.");
    },
    onError: () => show("Tạo bộ từ thất bại.", "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data: d }) => vocabularyApi.updateSet(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wordsets-teacher"] });
      setEditDlg({ open: false, set: null });
      show("Đã cập nhật bộ từ.");
    },
    onError: () => show("Cập nhật thất bại.", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => vocabularyApi.deleteSet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wordsets-teacher"] });
      setDeleteDlg({ open: false, set: null });
      show("Đã xóa bộ từ.");
    },
    onError: () => show("Xóa bộ từ thất bại.", "error"),
  });

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Bộ từ của tôi
          </Typography>
          {!isLoading && (
            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
              {sets.length} bộ từ
            </Typography>
          )}
        </Box>
        <SbButton variant="primary" startIcon={<AddRoundedIcon />} onClick={() => setCreateDlg(true)}>
          Tạo bộ từ mới
        </SbButton>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách bộ từ.
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
              <TableCell>Tên bộ từ</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>Cấp độ</TableCell>
              <TableCell align="center" sx={{ width: 80 }}>Số từ</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>Trạng thái</TableCell>
              <TableCell align="right" sx={{ width: 140 }}>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[0, 1, 2, 3, 4].map((j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : sets.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 7 }}>
                      <CollectionsBookmarkRoundedIcon sx={{ fontSize: 48, color: colors.greenAccent, opacity: 0.25, mb: 1 }} />
                      <Typography sx={{ color: colors.textBlackSoft, fontSize: "0.875rem" }}>
                        Chưa có bộ từ nào. Tạo bộ từ đầu tiên!
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : sets.map((s) => {
                    const lc = LEVEL_COLOR[s.level] ?? {};
                    return (
                      <TableRow key={s.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{s.name}</Typography>
                          {s.description && (
                            <Typography sx={{ fontSize: "0.76rem", color: colors.textBlackSoft }} noWrap>
                              {s.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {s.level ? (
                            <Chip label={s.level} size="small"
                              sx={{ height: 22, fontWeight: 700, fontSize: "0.72rem", bgcolor: lc.bg, color: lc.color }} />
                          ) : (
                            <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks }}>
                            {s.word_count ?? 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={s.is_public ? "Công khai" : "Riêng tư"}
                            size="small"
                            sx={{
                              height: 22, fontWeight: 700, fontSize: "0.72rem",
                              bgcolor: s.is_public ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                              color: s.is_public ? colors.greenAccent : colors.textBlackSoft,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="Quản lý từ" arrow>
                              <IconButton size="small"
                                onClick={() => setManageDlg({ open: true, set: s })}
                                sx={{ color: colors.greenAccent }}>
                                <CollectionsBookmarkRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sửa bộ từ" arrow>
                              <IconButton size="small"
                                onClick={() => setEditDlg({ open: true, set: s })}
                                sx={{ color: colors.textBlackSoft }}>
                                <EditRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa bộ từ" arrow>
                              <IconButton size="small"
                                onClick={() => setDeleteDlg({ open: true, set: s })}
                                sx={{ color: "#c82014" }}>
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
      <WordSetFormDialog
        open={createDlg}
        onClose={() => setCreateDlg(false)}
        onSave={(d) => createMut.mutate(d)}
        saving={createMut.isPending}
      />
      <WordSetFormDialog
        open={editDlg.open}
        onClose={() => setEditDlg({ open: false, set: null })}
        onSave={(d) => updateMut.mutate({ id: editDlg.set.id, data: d })}
        saving={updateMut.isPending}
        initial={editDlg.set}
      />
      <DeleteDialog
        open={deleteDlg.open}
        onClose={() => setDeleteDlg({ open: false, set: null })}
        set={deleteDlg.set}
        onConfirm={() => deleteMut.mutate(deleteDlg.set.id)}
        deleting={deleteMut.isPending}
      />
      <ManageWordsDialog
        open={manageDlg.open}
        onClose={() => setManageDlg({ open: false, set: null })}
        set={manageDlg.set}
        show={show}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default TeacherWordSets;
