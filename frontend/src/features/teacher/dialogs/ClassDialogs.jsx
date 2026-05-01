/**
 * Shared dialogs for class management
 * Used by both TeacherClasses and TeacherStudents
 */
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, TextField, InputAdornment, Tooltip, IconButton, Divider,
  Checkbox, Skeleton, Grid, Card, CardContent, CardActions, Chip,
} from "@mui/material";
import SchoolRoundedIcon         from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import PersonAddRoundedIcon    from "@mui/icons-material/PersonAddRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import GroupsRoundedIcon       from "@mui/icons-material/GroupsRounded";
import DeleteRoundedIcon       from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon         from "@mui/icons-material/EditRounded";
import { SbButton, SbInput } from "@/components/ui";
import { colors } from "@/styles/theme";
import teacherApi from "@/api/teacherApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const avatarLetter = (s) =>
  (s?.full_name || s?.username || s?.email || "?")[0].toUpperCase();

const useToast = () => {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const show = useCallback(
    (message, severity = "success") => setToast({ open: true, message, severity }),
    [],
  );
  const close = () => setToast((p) => ({ ...p, open: false }));
  return { toast, show, close };
};

// ── ClassFormDialog ───────────────────────────────────────────────────────────

export const ClassFormDialog = ({ open, onClose, onSave, saving, initial }) => {
  const [name, setName] = useState(initial?.name ?? "");

  const handleClose = () => { setName(initial?.name ?? ""); onClose(); };
  const handleSave  = () => onSave(name.trim());

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 1 }}>
        {initial ? "Đổi tên lớp" : "Tạo lớp mới"}
      </DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <SbInput
          autoFocus
          fullWidth
          label="Tên lớp *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && handleSave()}
        />
      </DialogContent>
      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={handleClose}>Hủy</SbButton>
        <SbButton variant="primary" loading={saving} disabled={!name.trim()} onClick={handleSave}>
          {initial ? "Lưu" : "Tạo lớp"}
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};

// ── DeleteClassDialog ─────────────────────────────────────────────────────────

export const DeleteClassDialog = ({ open, onClose, klass, onConfirm, deleting }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: "16px" } }}>
    <DialogTitle sx={{ fontWeight: 800, color: "#c82014" }}>Xóa lớp học</DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: "0.9rem" }}>
        Xóa lớp <strong style={{ color: colors.greenStarbucks }}>{klass?.name}</strong>?
        Học sinh trong lớp sẽ không bị xóa.
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

// ── ManageClassDialog ─────────────────────────────────────────────────────────

export const ManageClassDialog = ({ open, onClose, classId, showToast }) => {
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Chi tiết lớp
  const { data: klass, isLoading: loadingClass } = useQuery({
    queryKey: ["teacher-class", classId],
    queryFn: () => teacherApi.getClass(classId).then((r) => r.data),
    enabled: open && !!classId,
  });

  // Toàn bộ học sinh để add
  const { data: studentData, isLoading: loadingStudents } = useQuery({
    queryKey: ["teacher-students", studentSearch],
    queryFn: () =>
      teacherApi.getStudents({ search: studentSearch || undefined, page_size: 100 }).then((r) => r.data),
    enabled: open,
    staleTime: 30_000,
  });

  const classStudentIds = new Set((klass?.students ?? []).map((s) => s.id));
  const allStudents     = (studentData?.results ?? []).filter((s) => !classStudentIds.has(s.id));

  const addMut = useMutation({
    mutationFn: (ids) => teacherApi.addStudentsToClass(classId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-class", classId] });
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
      setSelectedIds([]);
      showToast("Đã thêm học sinh vào lớp.");
    },
    onError: () => showToast("Thêm học sinh thất bại.", "error"),
  });

  const removeMut = useMutation({
    mutationFn: (studentId) => teacherApi.removeStudentFromClass(classId, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-class", classId] });
      qc.invalidateQueries({ queryKey: ["teacher-classes"] });
      showToast("Đã xóa học sinh khỏi lớp.");
    },
    onError: () => showToast("Xóa học sinh thất bại.", "error"),
  });

  const handleClose = () => { setStudentSearch(""); setSelectedIds([]); onClose(); };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 800, color: colors.greenStarbucks, pb: 0.5 }}>
        {klass?.name ?? "Quản lý lớp"}
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {/* Học sinh trong lớp */}
        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks, mb: 1, mt: 0.5 }}>
          Học sinh trong lớp ({klass?.students?.length ?? 0})
        </Typography>

        {loadingClass ? (
          <Skeleton height={60} sx={{ borderRadius: "8px", mb: 2 }} />
        ) : klass?.students?.length === 0 ? (
          <Box sx={{ py: 2, textAlign: "center", mb: 1.5 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Lớp chưa có học sinh.
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px",
            maxHeight: 180, overflowY: "auto", mb: 2,
          }}>
            {klass?.students?.map((s) => (
              <Box key={s.id} sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 2, py: 1,
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                "&:last-child": { borderBottom: "none" },
              }}>
                <Avatar sx={{ bgcolor: colors.greenAccent, width: 30, height: 30, fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>
                  {avatarLetter(s)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>
                    {s.full_name || s.username}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
                    {s.email}
                  </Typography>
                </Box>
                <Tooltip title="Xóa khỏi lớp" arrow>
                  <IconButton
                    size="small"
                    onClick={() => removeMut.mutate(s.id)}
                    disabled={removeMut.isPending}
                    sx={{ color: "#c82014", "&:hover": { bgcolor: "#fdecea" } }}
                  >
                    <PersonRemoveRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Thêm học sinh */}
        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: colors.greenStarbucks, mb: 1 }}>
          Thêm học sinh
        </Typography>

        <TextField
          fullWidth size="small"
          placeholder="Tìm học sinh..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 17, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />

        <Box sx={{
          border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px",
          maxHeight: 160, overflowY: "auto",
        }}>
          {loadingStudents
            ? [1, 2, 3].map((i) => (
                <Box key={i} sx={{ px: 2, py: 1 }}><Skeleton width="60%" /></Box>
              ))
            : allStudents.length === 0
              ? (
                <Box sx={{ py: 2.5, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
                    {studentSearch ? "Không tìm thấy." : "Tất cả học sinh đã trong lớp."}
                  </Typography>
                </Box>
              )
              : allStudents.map((s) => {
                  const checked = selectedIds.includes(s.id);
                  return (
                    <Box key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1,
                        px: 1.5, py: 0.75, cursor: "pointer",
                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                        "&:last-child": { borderBottom: "none" },
                        "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                        bgcolor: checked ? `${colors.greenAccent}0c` : "transparent",
                      }}
                    >
                      <Checkbox size="small" checked={checked} onChange={() => {}}
                        sx={{ p: 0.25, "&.Mui-checked": { color: colors.greenAccent } }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }} noWrap>
                          {s.full_name || s.username}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }} noWrap>
                          {s.email}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
        </Box>

        {selectedIds.length > 0 && (
          <Typography sx={{ fontSize: "0.78rem", color: colors.greenAccent, mt: 0.75, fontWeight: 600 }}>
            Đã chọn {selectedIds.length} học sinh
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: "12px 24px", gap: 1 }}>
        <SbButton variant="outlined" onClick={handleClose}>Đóng</SbButton>
        <SbButton
          variant="primary"
          startIcon={<PersonAddRoundedIcon />}
          loading={addMut.isPending}
          disabled={selectedIds.length === 0}
          onClick={() => addMut.mutate(selectedIds)}
        >
          Thêm vào lớp
        </SbButton>
      </DialogActions>
    </Dialog>
  );
};
