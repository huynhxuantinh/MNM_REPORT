import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Skeleton, Alert, TextField, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Snackbar, Checkbox, CircularProgress,
  Avatar, Tabs, Tab, Autocomplete, Divider, InputAdornment,
} from "@mui/material";
import SchoolRoundedIcon         from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon         from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon           from "@mui/icons-material/EditRounded";
import PersonAddRoundedIcon      from "@mui/icons-material/PersonAddRounded";
import PersonRemoveRoundedIcon   from "@mui/icons-material/PersonRemoveRounded";
import AssignmentRoundedIcon     from "@mui/icons-material/AssignmentRounded";
import GroupsRoundedIcon         from "@mui/icons-material/GroupsRounded";
import CloseRoundedIcon          from "@mui/icons-material/CloseRounded";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";
import { ClassFormDialog, DeleteClassDialog, ManageClassDialog } from "./dialogs";

// ── Helpers ─────────────────────────────────────────────────────────────────--

const useToast = () => {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const show = useCallback((message, severity = "success") => setToast({ open: true, message, severity }), []);
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

const avatarLetter = (s) => (s?.full_name || s?.username || s?.email || "?")[0].toUpperCase();

// AvatarGroup for displaying class students
const AvatarGroup = ({ students }) => (
  <Box sx={{ display: "flex" }}>
    {students.slice(0, 3).map((s, i) => (
      <Avatar
        key={s.id}
        sx={{
          width: 28,
          height: 28,
          fontSize: "0.75rem",
          fontWeight: 700,
          bgcolor: colors.greenAccent,
          ml: i > 0 ? -1 : 0,
          border: "2px solid #fff",
        }}
      >
        {avatarLetter(s)}
      </Avatar>
    ))}
    {students.length > 3 && (
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: "0.75rem",
          fontWeight: 700,
          bgcolor: "#e0e0e0",
          color: "#666",
          ml: -1,
          border: "2px solid #fff",
        }}
      >
        +{students.length - 3}
      </Avatar>
    )}
  </Box>
);

// ── Main TeacherClasses Component ────────────────────────────────────────────

const TeacherClasses = () => {
  const queryClient = useQueryClient();
  const { toast, show, close } = useToast();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Queries
  const { data: classesData, isLoading, isError } = useQuery({
    queryKey: ["classes"],
    queryFn: () => teacherApi.getClasses().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: allStudents } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () => teacherApi.getStudents({ limit: 1000 }).then(r => r.data?.results || r.data || []),
    staleTime: 60_000,
  });

  const { data: allLessons } = useQuery({
    queryKey: ["teacher-lessons"],
    queryFn: () => teacherApi.getLessons({ limit: 1000 }).then(r => r.data?.results || r.data || []),
    staleTime: 60_000,
  });

  const classes = classesData || [];
  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => teacherApi.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      show("Đã tạo lớp học thành công", "success");
      setFormOpen(false);
    },
    onError: (err) => show(err?.response?.data?.detail || "Lỗi tạo lớp học", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => teacherApi.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      show("Đã cập nhật lớp học", "success");
      setFormOpen(false);
      setSelectedClass(null);
    },
    onError: (err) => show(err?.response?.data?.detail || "Lỗi cập nhật", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => teacherApi.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      show("Đã xóa lớp học", "success");
    },
    onError: (err) => show(err?.response?.data?.detail || "Lỗi xóa lớp học", "error"),
  });

  const handleCreate = (data) => createMutation.mutate(data);
  const handleUpdate = (data) => updateMutation.mutate({ id: selectedClass.id, data });

  const handleEdit = (cls) => {
    setSelectedClass(cls);
    setFormOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Xác nhận xóa lớp học? Hành động này không thể hoàn tác.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenDetail = (cls) => {
    setSelectedClass(cls);
    setDetailOpen(true);
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks, mb: 2.5 }}>
        Quản lý lớp học
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Tìm kiếm lớp học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchRoundedIcon sx={{ color: "text.secondary" }} /></InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
        <SbButton
          onClick={() => { setSelectedClass(null); setFormOpen(true); }}
          startIcon={<AddRoundedIcon />}
        >
          Tạo lớp mới
        </SbButton>
      </Box>

      {/* Error state */}
      {isError && (
        <Alert severity="error" sx={{ borderRadius: "10px", mb: 2 }}>
          Không thể tải danh sách lớp học. Vui lòng thử lại sau.
        </Alert>
      )}

      {/* Classes Grid */}
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: "12px" }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredClasses.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, bgcolor: "background.paper", borderRadius: "16px", border: "1px dashed rgba(0,0,0,0.15)" }}>
          <SchoolRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 2 }} />
          <Typography sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
            {search ? "Không tìm thấy lớp học" : "Chưa có lớp học nào"}
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>
            {search ? "Thử tìm kiếm khác" : "Tạo lớp học để quản lý học sinh theo nhóm"}
          </Typography>
          {!search && (
            <SbButton onClick={() => { setSelectedClass(null); setFormOpen(true); }} startIcon={<AddRoundedIcon />}>
              Tạo lớp đầu tiên
            </SbButton>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredClasses.map((cls) => (
            <Grid item xs={12} sm={6} md={4} key={cls.id}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "14px",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.10)", transform: "translateY(-2px)" },
                }}
                onClick={() => handleOpenDetail(cls)}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "12px",
                      bgcolor: `${colors.greenAccent}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <SchoolRoundedIcon sx={{ color: colors.greenAccent }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: colors.greenStarbucks }}>
                        {cls.name}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                        {cls.student_count || cls.students?.length || 0} học sinh
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}
                        sx={{ color: colors.greenAccent }}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                        color="error"
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Avatar stack của học sinh */}
                {cls.students && cls.students.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                    <AvatarGroup students={cls.students.slice(0, 5)} />
                    {cls.students.length > 5 && (
                      <Typography sx={{ ml: 1, fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
                        +{cls.students.length - 5}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Form Dialog */}
      <ClassFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedClass(null); }}
        onSave={selectedClass ? handleUpdate : handleCreate}
        saving={createMutation.isPending || updateMutation.isPending}
        initial={selectedClass}
      />

      {/* Manage Class Dialog */}
      <ManageClassDialog
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedClass(null); }}
        classId={selectedClass?.id}
        showToast={show}
      />

      <Toast toast={toast} onClose={close} />
    </Box>
  );
};

export default TeacherClasses;
