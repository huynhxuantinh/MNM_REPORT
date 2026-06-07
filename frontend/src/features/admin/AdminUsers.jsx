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
  Chip,
  Switch,
  Tooltip,
  IconButton,
  InputAdornment,
  Skeleton,
  Pagination,
  Stack,
  Alert,
  Snackbar,
} from "@mui/material";
import { SearchRounded as SearchRoundedIcon, EditRounded as EditRoundedIcon } from "@mui/icons-material";
import adminApi from "@/services/adminApi";
import { SbAvatar } from "@/components/ui";

const ADMIN_BG = "#1a1f3a";
const ADMIN_ACCENT = "#5c6bc0";
const PAGE_SIZE = 15;

const ROLE_LABEL = { user: "Học sinh", admin: "Admin" };
const ROLE_COLOR = { user: "success", admin: "error" };

const RoleSelect = ({ userId, currentRole, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(currentRole);

  const handleChange = (event) => {
    setRole(event.target.value);
    onSave(userId, { role: event.target.value });
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
      <MenuItem value="admin">Admin</MenuItem>
    </Select>
  );
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  const params = {
    search: search || undefined,
    role: roleFilter || undefined,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => adminApi.getUsers(params).then((response) => response.data),
    placeholderData: (prev) => prev,
    staleTime: 15000,
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

  const users = data?.results ?? [];
  const total = data?.count ?? 0;
  const numPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: ADMIN_BG }}>
          Quản lý người dùng
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem", mt: 0.5 }}>
          {total} tài khoản trong hệ thống
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Tìm tên hoặc email..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
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
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="user">Học sinh</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

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
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Email verified</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }} align="center">Kích hoạt</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>XP</TableCell>
              <TableCell sx={{ fontWeight: 700, color: ADMIN_BG }}>Ngày tham gia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}><Skeleton height={28} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : users.map((user) => {
                  const isSelf = Boolean(user.id) && Boolean(data?.current_user_id) && user.id === data.current_user_id;
                  const displayName = user.full_name?.trim() || user.username || user.email;
                  return (
                    <TableRow
                      key={user.id}
                      sx={{ "&:hover": { bgcolor: "#f8f9ff" }, opacity: user.is_active ? 1 : 0.55 }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <SbAvatar user={{ ...user, full_name: displayName }} size="sm" />
                          <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                            {displayName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{user.email}</TableCell>
                      <TableCell>
                        {isSelf ? (
                          <Tooltip title="Không thể tự đổi quyền của chính mình">
                            <Box sx={{ display: "inline-flex" }}>
                              <Chip
                                label={ROLE_LABEL[user.role] ?? user.role}
                                color={ROLE_COLOR[user.role] ?? "default"}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                              />
                            </Box>
                          </Tooltip>
                        ) : (
                          <RoleSelect userId={user.id} currentRole={user.role} onSave={(id, payload) => updateUser({ id, payload })} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.email_verified ? "Đã xác thực" : "Chưa xác thực"}
                          size="small"
                          color={user.email_verified ? "success" : "warning"}
                          sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={isSelf ? "Không thể tự vô hiệu hóa tài khoản của chính mình" : ""}>
                          <Box sx={{ display: "inline-flex" }}>
                            <Switch
                              checked={user.is_active}
                              disabled={isSelf}
                              onChange={(event) => updateUser({ id: user.id, payload: { is_active: event.target.checked } })}
                              size="small"
                              sx={{
                                "& .MuiSwitch-thumb": { bgcolor: user.is_active ? ADMIN_ACCENT : "#bbb" },
                                "& .MuiSwitch-track": { bgcolor: user.is_active ? `${ADMIN_ACCENT}80` : "#ddd" },
                              }}
                            />
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{(user.xp ?? 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </TableContainer>

      {numPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={numPages} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" />
        </Stack>
      )}

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
