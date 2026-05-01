import { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Chip, TextField, InputAdornment, MenuItem,
  Select, FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Skeleton, Alert,
  CircularProgress,
} from "@mui/material";
import PeopleRoundedIcon        from "@mui/icons-material/PeopleRounded";
import MenuBookRoundedIcon      from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon        from "@mui/icons-material/SchoolRounded";
import AssignmentRoundedIcon    from "@mui/icons-material/AssignmentRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import { SbCard, SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import adminApi from "@/api/adminApi";

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CFG = {
  user:    { label: "Học sinh",       bg: `${colors.greenAccent}18`, color: colors.greenAccent },
  teacher: { label: "Giáo viên",      bg: `${colors.gold}22`,        color: colors.gold },
  admin:   { label: "Quản trị viên",  bg: `${colors.red}18`,         color: colors.red },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon, value, label, color }) => (
  <SbCard sx={{ flex: 1, minWidth: 140 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color, lineHeight: 1 }}>{value ?? "—"}</Typography>
        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mt: 0.25 }}>{label}</Typography>
      </Box>
    </Box>
  </SbCard>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminPage = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Guard: non-admin users shouldn't reach here, but add a safety net
  if (user?.role !== "admin") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <AdminPanelSettingsRoundedIcon sx={{ fontSize: 64, color: colors.greenLight, mb: 1 }} />
        <Typography sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>Không có quyền truy cập</Typography>
        <SbButton variant="outlined" onClick={() => navigate("/")}>Về trang chủ</SbButton>
      </Box>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => adminApi.getUsers({ search: search || undefined, role: roleFilter || undefined }).then((r) => r.data),
    staleTime: 30_000,
  });

  const users = usersData?.results ?? usersData ?? [];

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => adminApi.updateUser(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
          Bảng quản trị
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
          Quản lý người dùng và thống kê hệ thống
        </Typography>
      </Box>

      {/* Stats row */}
      {statsLoading ? (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={80} sx={{ flex: 1, minWidth: 140, borderRadius: "12px" }} />)}
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <StatCard icon={<PeopleRoundedIcon />}       value={stats?.total_users}    label="Tổng người dùng"  color={colors.greenStarbucks} />
          <StatCard icon={<SchoolRoundedIcon />}        value={stats?.teachers}       label="Giáo viên"        color={colors.gold} />
          <StatCard icon={<PeopleRoundedIcon />}        value={stats?.students}       label="Học sinh"         color={colors.greenAccent} />
          <StatCard icon={<MenuBookRoundedIcon />}      value={stats?.total_words}    label="Tổng từ vựng"     color={colors.greenUplift ?? colors.greenAccent} />
          <StatCard icon={<AssignmentRoundedIcon />}    value={stats?.total_lessons}  label="Tổng bài học"     color={colors.gold} />
        </Box>
      )}

      {/* Users table */}
      <SbCard>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "text.primary", mr: "auto" }}>
            Người dùng
          </Typography>
          <TextField size="small" placeholder="Tìm email / tên..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "50px" } }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Vai trò</InputLabel>
            <Select value={roleFilter} label="Vai trò" onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="user">Học sinh</MenuItem>
              <MenuItem value="teacher">Giáo viên</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {usersLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1,2,3,4,5].map(i => <Skeleton key={i} height={48} variant="rectangular" sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "10px", boxShadow: "none", border: "1px solid rgba(0,0,0,0.07)" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.8rem", bgcolor: "#fafaf9" } }}>
                  <TableCell>Email</TableCell>
                  <TableCell>Tên</TableCell>
                  <TableCell>Vai trò</TableCell>
                  <TableCell>XP</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Tham gia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const rcfg = ROLE_CFG[u.role] ?? ROLE_CFG.user;
                  return (
                    <TableRow key={u.id} sx={{ "&:hover": { bgcolor: "#f9f9f8" } }}>
                      <TableCell sx={{ fontSize: "0.8375rem", color: "text.primary" }}>{u.email}</TableCell>
                      <TableCell sx={{ fontSize: "0.8375rem" }}>{u.full_name || u.username}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          size="small"
                          variant="standard"
                          disableUnderline
                          onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                          sx={{ fontSize: "0.8rem" }}
                          renderValue={(val) => (
                            <Chip label={ROLE_CFG[val]?.label ?? val} size="small"
                              sx={{ bgcolor: ROLE_CFG[val]?.bg, color: ROLE_CFG[val]?.color, fontWeight: 700, fontSize: "0.68rem", height: 20 }} />
                          )}
                        >
                          <MenuItem value="user">Học sinh</MenuItem>
                          <MenuItem value="teacher">Giáo viên</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: colors.greenAccent }}>{u.xp}</TableCell>
                      <TableCell>{u.level}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? "Hoạt động" : "Chưa kích hoạt"}
                          size="small"
                          sx={{
                            bgcolor: u.is_active ? `${colors.greenAccent}18` : "#f5f5f5",
                            color: u.is_active ? colors.greenAccent : "text.secondary",
                            fontWeight: 600, fontSize: "0.68rem", height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{fmtDate(u.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SbCard>
    </Box>
  );
};

export default AdminPage;
