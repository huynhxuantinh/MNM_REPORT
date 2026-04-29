import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, IconButton, Tooltip, Skeleton, Pagination, Stack,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Chip, Switch
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import learningApi from "@/api/learningApi";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE = 15;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS = {
  A1: "#4caf50", A2: "#8bc34a", B1: "#ffeb3b",
  B2: "#ffb300", C1: "#f4511e", C2: "#d32f2f"
};

const AdminLessons = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: null, title: "", description: "", level: "A1", order_index: 1, is_published: true });

  const params = {
    search: search || undefined,
    level: levelFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lessons", params],
    queryFn: () => learningApi.getLessons(params).then(r => r.data),
    keepPreviousData: true,
  });

  const { mutate: saveLesson, isLoading: isSaving } = useMutation({
    mutationFn: (payload) => payload.id ? learningApi.updateLesson(payload.id, payload) : learningApi.createLesson(payload),
    onSuccess: () => {
      qc.invalidateQueries(["admin-lessons"]);
      setToast({ msg: formData.id ? "Cập nhật bài học thành công" : "Tạo bài học thành công", severity: "success" });
      setOpenDialog(false);
    },
    onError: () => setToast({ msg: "Lỗi lưu bài học", severity: "error" }),
  });

  const { mutate: deleteLesson } = useMutation({
    mutationFn: (id) => learningApi.deleteLesson(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-lessons"]);
      setToast({ msg: "Đã xoá bài học", severity: "success" });
    },
    onError: () => setToast({ msg: "Lỗi xoá bài học", severity: "error" }),
  });

  const { mutate: togglePublish } = useMutation({
    mutationFn: ({ id, is_published }) => learningApi.updateLesson(id, { is_published }),
    onSuccess: () => qc.invalidateQueries(["admin-lessons"]),
  });

  const lessons = data?.results || [];
  const total = data?.count || 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const handleOpenNew = () => {
    setFormData({ id: null, title: "", description: "", level: "A1", order_index: 1, is_published: true });
    setOpenDialog(true);
  };

  const handleOpenEdit = (l) => {
    setFormData({ ...l });
    setOpenDialog(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
            Quản lý bài học
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
            {total} bài học trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleOpenNew}
          sx={{ borderRadius: "10px", textTransform: "none", bgcolor: ADMIN_ACCENT, "&:hover": { bgcolor: "#3f51b5" } }}
        >
          Tạo bài học mới
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tìm tên bài học…"
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
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Tên bài học</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Cấp độ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Số từ vựng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Public</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={5}><Skeleton height={40} /></TableCell></TableRow>
            )) : lessons.map((l) => (
              <TableRow key={l.id} sx={{ "&:hover": { bgcolor: "#f8f9ff" } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700, color: ADMIN_BG }}>{l.title}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", maxWidth: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={l.level} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#fff", bgcolor: LEVEL_COLORS[l.level] || "#9e9e9e" }} />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{l.word_count || 0}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={l.is_published}
                    onChange={(e) => togglePublish({ id: l.id, is_published: e.target.checked })}
                    sx={{ "& .MuiSwitch-thumb": { bgcolor: l.is_published ? ADMIN_ACCENT : "#bbb" } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Sửa"><IconButton size="small" onClick={() => handleOpenEdit(l)}><EditRoundedIcon fontSize="small" sx={{ color: ADMIN_ACCENT }} /></IconButton></Tooltip>
                  <Tooltip title="Xoá"><IconButton size="small" onClick={() => { if(window.confirm("Chắc chắn xoá bài học này?")) deleteLesson(l.id); }}><DeleteRoundedIcon fontSize="small" color="error" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && lessons.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Không tìm thấy bài học nào.</TableCell></TableRow>
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
        <DialogTitle sx={{ fontWeight: 800 }}>{formData.id ? "Sửa bài học" : "Tạo bài học mới"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Tên bài học" required fullWidth value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <TextField label="Mô tả" fullWidth multiline rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Cấp độ</InputLabel>
              <Select value={formData.level} label="Cấp độ" onChange={e => setFormData({ ...formData, level: e.target.value })}>
                {LEVELS.map(lvl => <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField 
              label="Thứ tự (Order)" 
              type="number" 
              fullWidth 
              value={formData.order_index} 
              onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Hủy</Button>
          <Button onClick={() => saveLesson(formData)} variant="contained" disabled={!formData.title || isSaving} sx={{ bgcolor: ADMIN_ACCENT }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.severity} sx={{ width: "100%", borderRadius: "12px" }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminLessons;
