import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Chip, Switch, Tooltip, IconButton, InputAdornment,
  Skeleton, Pagination, Stack, Alert, Snackbar,
} from "@mui/material";
import { SearchRounded as SearchRoundedIcon } from "@mui/icons-material";
import { EditRounded as EditRoundedIcon } from "@mui/icons-material";
import adminApi from "@/api/adminApi";
import { SbAvatar } from "@/components/ui";

const ADMIN_BG     = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE    = 15;

const ROLE_LABEL = { user: "Học sinh", teacher: "Giáo viên", admin: "Admin" };
const ROLE_COLOR = { user: "success", teacher: "warning", admin: "error" };

// ── EditRoleDialog (inline select trong bảng) ─────────────────────────────────

const RoleSelect = ({ userId, currentRole, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(currentRole);

  const handleChange = (e) => {
    setRole(e.target.value);
    onSave(userId, { role: e.target.value });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Chip
          label={ROLE_LABEL[currentRole] ?? currentRole}
          color={ROLE_COLOR[currentRole] ?? "default"}
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.72rem" }}
        />
        <Tooltip title="Đổi role">
          <IconButton size="small" onClick={() => setEditing(true)}>
            <EditRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Select
      size="small"
      value={role}
      onChange={handleChange}
      onBlur={() => setEditing(false)}
      autoFocus
      sx={{ fontSize: "0.8rem", minWidth: 110 }}
    >
      <MenuItem value="user">Học sinh</MenuItem>
      <MenuItem value="teacher">Giáo viên</MenuItem>
      <MenuItem value="admin">Admin</MenuItem>
    </Select>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const AdminUsers = () => {
  const qc = useQueryClient();
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]       = useState(1);
  const [toast, setToast]     = useState(null);

  const params = {
    search: search || undefined,
    role:   roleFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminApi.getUsers(params).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateUser(id, payload),
    onSuccess: (_, { payload }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      const msg = payload.is_active !== undefined
        ? payload.is_active ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản"
        : "Đã cập nhật role";
      setToast({ msg, severity: "success" });
    },
    onError: () => setToast({ msg: "Cập nhật thất bại", severity: "error" }),
  });

  const handleSave = (id, payload) => updateUser({ id, payload });

  const users    = data?.results ?? [];
  const total    = data?.count ?? 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleRole   = (e) => { setRoleFilter(e.target.value); setPage(1); };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
          Quản lý người dùng
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
          {total} tài khoản trong hệ thống
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tìm tên hoặc email…"
          value={search}
          onChange={handleSearch}
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
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} label="Role" onChange={handleRole}>
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="user">Học sinh</MenuItem>
            <MenuItem value="teacher">Giáo viên</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: "16px", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f7ff" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG, py: 1.5 }}>Người dùng</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Kích hoạt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>XP</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Ngày tham gia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={28} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : users.map((u) => (
                  <TableRow
                    key={u.id}
                    sx={{ "&:hover": { bgcolor: "#f8f9ff" }, opacity: u.is_active ? 1 : 0.55 }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <SbAvatar user={u} size="sm" />
                        <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                          {u.full_name || u.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{u.email}</TableCell>
                    <TableCell>
                      <RoleSelect userId={u.id} currentRole={u.role} onSave={handleSave} />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={u.is_active}
                        onChange={(e) => handleSave(u.id, { is_active: e.target.checked })}
                        size="small"
                        sx={{
                          "& .MuiSwitch-thumb": { bgcolor: u.is_active ? ADMIN_ACCENT : "#bbb" },
                          "& .MuiSwitch-track": { bgcolor: u.is_active ? `${ADMIN_ACCENT}80` : "#ddd" },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {(u.xp ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={numPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}

      {/* Toast */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast?.severity ?? "success"} onClose={() => setToast(null)} sx={{ borderRadius: "12px" }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsers;
