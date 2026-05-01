import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Skeleton, Alert, TextField,
  InputAdornment, Chip, LinearProgress, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Tab, Tabs, Card, CardContent, CardActions,
  IconButton, Tooltip, Snackbar, CircularProgress,
  Grid,
} from "@mui/material";
import SearchRoundedIcon             from "@mui/icons-material/SearchRounded";
import PeopleRoundedIcon             from "@mui/icons-material/PeopleRounded";
import BoltRoundedIcon               from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon        from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon           from "@mui/icons-material/ScheduleRounded";
import AddRoundedIcon                from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon             from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon               from "@mui/icons-material/EditRounded";
import GroupsRoundedIcon             from "@mui/icons-material/GroupsRounded";
import PersonAddRoundedIcon          from "@mui/icons-material/PersonAddRounded";
import { SbButton, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";
import { ClassFormDialog, DeleteClassDialog, ManageClassDialog } from "./dialogs";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getLevelXp   = (lv) => (100 * lv * (lv + 1)) / 2;
const xpProgress   = (xp, lv) => {
  const next = getLevelXp(lv);
  const prev = getLevelXp(lv - 1);
  return next > prev ? Math.round(((xp - prev) / (next - prev)) * 100) : 100;
};

const avatarLetter = (s) =>
  (s?.full_name || s?.username || s?.email || "?")[0].toUpperCase();

const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

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

// ── StudentDetailDialog ───────────────────────────────────────────────────────

const StudentDetailDialog = ({ open, onClose, student, assignments }) => {
  const studentAssignments = assignments.filter(
    (a) => a.student === student?.id || a.student_email === student?.email,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: colors.greenAccent, width: 48, height: 48, fontWeight: 700, fontSize: "1.2rem" }}>
            {avatarLetter(student)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: colors.greenStarbucks, lineHeight: 1.2 }}>
              {student?.full_name || student?.username}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              {student?.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box sx={{
          display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5,
          p: 2, bgcolor: `${colors.greenAccent}08`, borderRadius: "12px",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <BoltRoundedIcon sx={{ fontSize: 16, color: colors.greenAccent }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
              {student?.xp ?? 0} XP
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: colors.greenStarbucks }}>
              Level {student?.level ?? 1}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: colors.greenStarbucks, mb: 1.5 }}>
          Bài học được giao ({studentAssignments.length})
        </Typography>

        {studentAssignments.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", textAlign: "center", py: 3 }}>
            Chưa có bài học nào.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {studentAssignments.map((a) => (
              <Box key={a.id} sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                p: 1.5, borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.07)",
                bgcolor: a.is_completed ? `${colors.greenAccent}08` : "#fafafa",
              }}>
                {a.is_completed
                  ? <CheckCircleRoundedIcon sx={{ color: colors.greenAccent, fontSize: 20, flexShrink: 0 }} />
                  : <ScheduleRoundedIcon sx={{ color: "text.secondary", fontSize: 20, flexShrink: 0 }} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }} noWrap>
                    {a.lesson_title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
                    Hạn: {a.due_date ? fmtDate(a.due_date) : "Không hạn"}
                  </Typography>
                </Box>
                <Chip
                  label={a.is_completed ? "Xong" : "Chưa xong"}
                  size="small"
                  sx={{
                    height: 20, fontWeight: 700, fontSize: "0.72rem", flexShrink: 0,
                    bgcolor: a.is_completed ? `${colors.greenAccent}1a` : "rgba(0,0,0,0.07)",
                    color: a.is_completed ? colors.greenAccent : "text.secondary",
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <SbButton variant="outlined" onClick={onClose}>Đóng</SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── ClassList — tab quản lý lớp ───────────────────────────────────────────────

const ClassList = ({ show }) => {
  const qc = useQueryClient();
  const [createDlg, setCreateDlg]   = useState(false);
  const [editDlg, setEditDlg]       = useState({ open: false, klass: null });
  const [deleteDlg, setDeleteDlg]   = useState({ open: false, klass: null });
  const [manageDlg, setManageDlg]   = useState({ open: false, classId: null });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => teacherApi.getClasses().then((r) => r.data),
    staleTime: 30_000,
  });

  const classes = data?.results ?? data ?? [];

  const createMut = useMutation({
    mutationFn: (name) => teacherApi.createClass({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
      setCreateDlg(false);
      show("Đã tạo lớp mới.");
    },
    onError: () => show("Tạo lớp thất bại.", "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }) => teacherApi.updateClass(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
      setEditDlg({ open: false, klass: null });
      show("Đã cập nhật tên lớp.");
    },
    onError: () => show("Cập nhật thất bại.", "error"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => teacherApi.deleteClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
      setDeleteDlg({ open: false, klass: null });
      show("Đã xóa lớp.");
    },
    onError: () => show("Xóa lớp thất bại.", "error"),
  });

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Lớp học
          </Typography>
          {!isLoading && (
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              {classes.length} lớp
            </Typography>
          )}
        </Box>
        <SbButton variant="primary" startIcon={<AddRoundedIcon />} onClick={() => setCreateDlg(true)}>
          Tạo lớp mới
        </SbButton>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách lớp.
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: "14px" }} />
            </Grid>
          ))}
        </Grid>
      ) : classes.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <GroupsRoundedIcon sx={{ fontSize: 56, color: colors.greenAccent, opacity: 0.2, mb: 1 }} />
          <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
            Chưa có lớp học nào. Tạo lớp đầu tiên!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {classes.map((klass) => (
            <Grid item xs={12} sm={6} md={4} key={klass.id}>
              <Card sx={{ borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", height: "100%" }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: "10px",
                      bgcolor: `${colors.greenAccent}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <GroupsRoundedIcon sx={{ color: colors.greenAccent, fontSize: 22 }} />
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Đổi tên" arrow>
                        <IconButton size="small" onClick={() => setEditDlg({ open: true, klass })}
                          sx={{ color: "text.secondary" }}>
                          <EditRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa lớp" arrow>
                        <IconButton size="small" onClick={() => setDeleteDlg({ open: true, klass })}
                          sx={{ color: "#c82014" }}>
                          <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: colors.greenStarbucks, mb: 0.5 }}>
                    {klass.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                    {klass.student_count ?? 0} học sinh
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <SbButton
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={<PersonAddRoundedIcon />}
                    onClick={() => setManageDlg({ open: true, classId: klass.id })}
                  >
                    Quản lý học sinh
                  </SbButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <ClassFormDialog
        open={createDlg}
        onClose={() => setCreateDlg(false)}
        onSave={(name) => createMut.mutate(name)}
        saving={createMut.isPending}
      />
      <ClassFormDialog
        open={editDlg.open}
        onClose={() => setEditDlg({ open: false, klass: null })}
        onSave={(name) => updateMut.mutate({ id: editDlg.klass.id, name })}
        saving={updateMut.isPending}
        initial={editDlg.klass}
      />
      <DeleteClassDialog
        open={deleteDlg.open}
        onClose={() => setDeleteDlg({ open: false, klass: null })}
        klass={deleteDlg.klass}
        onConfirm={() => deleteMut.mutate(deleteDlg.klass.id)}
        deleting={deleteMut.isPending}
      />
      <ManageClassDialog
        open={manageDlg.open}
        onClose={() => setManageDlg({ open: false, classId: null })}
        classId={manageDlg.classId}
        showToast={show}
      />
    </Box>
  );
};

// ── StudentList — tab danh sách học sinh ──────────────────────────────────────

const StudentList = () => {
  const [search, setSearch]     = useState("");
  const [detailDlg, setDetailDlg] = useState({ open: false, student: null });

  const { data: studentData, isLoading: loadingStudents, isError: studentError } = useQuery({
    queryKey: ["teacher-students", search],
    queryFn: () =>
      teacherApi.getStudents({ search: search || undefined, page_size: 100 }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: assignData, isLoading: loadingAssign } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => teacherApi.getAssignments().then((r) => r.data),
    staleTime: 60_000,
  });

  const students    = studentData?.results ?? [];
  const assignments = assignData?.results ?? assignData ?? [];

  const assignCountMap = {};
  assignments.forEach((a) => {
    assignCountMap[a.student] = (assignCountMap[a.student] ?? 0) + 1;
  });

  const isLoading = loadingStudents || loadingAssign;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Danh sách học sinh
          </Typography>
          {!loadingStudents && (
            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
              {students.length} học sinh
            </Typography>
          )}
        </Box>
        <TextField
          size="small"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: "100%", sm: 280 } }}
        />
      </Box>

      {studentError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          Không thể tải danh sách học sinh.
        </Alert>
      )}

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
              <TableCell>Học sinh</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>Level</TableCell>
              <TableCell sx={{ width: 160 }}>Tiến độ XP</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Bài được giao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {[0, 1, 2, 3].map((j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : students.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 7 }}>
                      <PeopleRoundedIcon sx={{ fontSize: 48, color: colors.greenAccent, opacity: 0.25, mb: 1 }} />
                      <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                        {search ? "Không tìm thấy học sinh phù hợp." : "Chưa có học sinh nào."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
                : students.map((s) => {
                    const lv   = s.level ?? 1;
                    const xp   = s.xp ?? 0;
                    const prog = xpProgress(xp, lv);
                    const assignCount = assignCountMap[s.id] ?? 0;

                    return (
                      <TableRow key={s.id} hover
                        sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                        onClick={() => setDetailDlg({ open: true, student: s })}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: colors.greenAccent, width: 34, height: 34, fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>
                              {avatarLetter(s)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "text.primary" }}>
                                {s.full_name || s.username}
                              </Typography>
                              <Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
                                {s.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`Lv. ${lv}`} size="small"
                            sx={{ height: 22, fontWeight: 700, fontSize: "0.75rem", bgcolor: `${colors.greenAccent}18`, color: colors.greenAccent }} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LinearProgress variant="determinate" value={prog}
                              sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent } }} />
                            <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", minWidth: 32, textAlign: "right" }}>
                              {xp} XP
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, color: colors.greenStarbucks, fontSize: "0.9rem" }}>
                            {assignCount}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </TableContainer>

      {detailDlg.student && (
        <StudentDetailDialog
          open={detailDlg.open}
          onClose={() => setDetailDlg({ open: false, student: null })}
          student={detailDlg.student}
          assignments={assignments}
        />
      )}
    </Box>
  );
};

// ── Main TeacherStudents ──────────────────────────────────────────────────────

const TeacherStudents = () => {
  const [tab, setTab] = useState(0);
  const { toast, show, close: closeToast } = useToast();

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          "& .MuiTab-root": { fontWeight: 700, fontSize: "0.875rem", textTransform: "none", minWidth: 120 },
          "& .Mui-selected": { color: colors.greenStarbucks },
          "& .MuiTabs-indicator": { bgcolor: colors.greenStarbucks },
        }}
      >
        <Tab label="Học sinh" icon={<PeopleRoundedIcon />} iconPosition="start" />
        <Tab label="Lớp học" icon={<GroupsRoundedIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && <StudentList />}
      {tab === 1 && <ClassList show={show} />}

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default TeacherStudents;
