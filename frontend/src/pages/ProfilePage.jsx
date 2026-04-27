import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import {
  Box, Typography, Divider, Switch, FormControlLabel,
  Alert, Chip, LinearProgress, CircularProgress, IconButton,
  InputAdornment, Collapse,
} from "@mui/material";
import PersonRoundedIcon    from "@mui/icons-material/PersonRounded";
import LockRoundedIcon      from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import BoltRoundedIcon      from "@mui/icons-material/BoltRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { SbCard, SbButton, SbInput } from "@/components/ui";
import { setUser } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";
import authApi from "@/api/authApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_LABEL = { user: "Học sinh", teacher: "Giáo viên", admin: "Quản trị viên" };
const ROLE_COLOR = { user: colors.greenAccent, teacher: colors.gold, admin: colors.red };

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const getLevelXp = (l) => 100 * l * (l + 1) / 2;

// ── Stat chip ─────────────────────────────────────────────────────────────────

const StatBox = ({ icon, value, label, color }) => (
  <Box sx={{ textAlign: "center", flex: 1, minWidth: { xs: "calc(33% - 8px)", sm: 0 } }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.25 }}>
      {icon}
      <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color }}>{value}</Typography>
    </Box>
    <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>{label}</Typography>
  </Box>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [form, setForm]           = useState({ full_name: user?.full_name ?? "", notification_enabled: user?.notification_enabled ?? true });
  const [profileMsg, setProfileMsg] = useState(null);

  const [pwForm, setPwForm]       = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [showPw, setShowPw]       = useState({ old: false, new: false, confirm: false });
  const [pwMsg, setPwMsg]         = useState(null);
  const [pwOpen, setPwOpen]       = useState(false);

  // XP progress
  const level   = user?.level ?? 1;
  const xp      = user?.xp ?? 0;
  const streak  = user?.streak?.current_streak ?? 0;
  const nextXp  = getLevelXp(level);
  const prevXp  = getLevelXp(level - 1);
  const xpPct   = nextXp > prevXp ? Math.round(((xp - prevXp) / (nextXp - prevXp)) * 100) : 100;

  // ── Mutations ──

  const profileMut = useMutation({
    mutationFn: (d) => authApi.updateMe(d).then((r) => r.data),
    onSuccess: (data) => {
      dispatch(setUser(data));
      setProfileMsg({ type: "success", text: "Đã cập nhật hồ sơ." });
      setTimeout(() => setProfileMsg(null), 3000);
    },
    onError: () => setProfileMsg({ type: "error", text: "Cập nhật thất bại. Thử lại sau." }),
  });

  const pwMut = useMutation({
    mutationFn: (d) => authApi.changePassword(d),
    onSuccess: () => {
      setPwMsg({ type: "success", text: "Đổi mật khẩu thành công." });
      setPwForm({ old_password: "", new_password: "", new_password_confirm: "" });
      setTimeout(() => { setPwMsg(null); setPwOpen(false); }, 2500);
    },
    onError: (err) => {
      const detail = err?.response?.data?.old_password?.[0]
        ?? err?.response?.data?.detail
        ?? "Đổi mật khẩu thất bại.";
      setPwMsg({ type: "error", text: detail });
    },
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    profileMut.mutate({ full_name: form.full_name, notification_enabled: form.notification_enabled });
  };

  const handleChangePw = (e) => {
    e.preventDefault();
    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự." });
      return;
    }
    if (!/[A-Z]/.test(pwForm.new_password)) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 1 chữ hoa." });
      return;
    }
    if (!/[0-9]/.test(pwForm.new_password)) {
      setPwMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 1 chữ số." });
      return;
    }
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwMsg({ type: "error", text: "Mật khẩu mới không khớp." });
      return;
    }
    pwMut.mutate(pwForm);
  };

  const EyeBtn = ({ field }) => (
    <IconButton size="small" onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}>
      {showPw[field] ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
    </IconButton>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 680, mx: "auto" }}>

      {/* ── Profile header card ──────────────────────────────────────── */}
      <SbCard>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
          {/* Avatar */}
          <Box sx={{
            width: 72, height: 72, borderRadius: "50%",
            bgcolor: colors.greenAccent,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: "2rem", color: "#fff" }}>
              {(user?.full_name || user?.username || "?")[0].toUpperCase()}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: colors.textBlack }}>
                {user?.full_name || user?.username}
              </Typography>
              <Chip
                label={ROLE_LABEL[user?.role] ?? user?.role}
                size="small"
                sx={{ bgcolor: `${ROLE_COLOR[user?.role]}18`, color: ROLE_COLOR[user?.role], fontWeight: 700, fontSize: "0.72rem" }}
              />
            </Box>
            <Typography sx={{ fontSize: "0.875rem", color: colors.textBlackSoft, mb: 0.25 }}>
              {user?.email}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: colors.textBlackSoft }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: "0.8125rem" }}>Tham gia {fmtDate(user?.created_at)}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* XP progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: colors.textBlack }}>
              Level {level}
            </Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: colors.textBlackSoft }}>
              {xp} / {nextXp} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={xpPct}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: "rgba(0,0,0,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
            }}
          />
        </Box>

        {/* Stats row */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
          <StatBox icon={<EmojiEventsRoundedIcon sx={{ fontSize: 20, color: colors.greenStarbucks }} />}
            value={level} label="Level" color={colors.greenStarbucks} />
          <StatBox icon={<BoltRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent }} />}
            value={xp} label="Tổng XP" color={colors.greenAccent} />
          <StatBox icon={<LocalFireDepartmentRoundedIcon sx={{ fontSize: 20, color: colors.gold }} />}
            value={streak} label="Streak ngày" color={colors.gold} />
        </Box>
      </SbCard>

      {/* ── Edit profile ─────────────────────────────────────────────── */}
      <SbCard>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <PersonRoundedIcon sx={{ color: colors.greenAccent }} />
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.textBlack }}>
            Thông tin cá nhân
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSaveProfile} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SbInput
            label="Họ và tên"
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Nhập họ và tên"
            inputProps={{ name: "full_name", "data-cy": "full-name-input" }}
          />
          <SbInput
            label="Email"
            value={user?.email ?? ""}
            disabled
            helperText="Email không thể thay đổi"
          />
          <SbInput
            label="Tên đăng nhập"
            value={user?.username ?? ""}
            disabled
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.notification_enabled}
                onChange={(e) => setForm((p) => ({ ...p, notification_enabled: e.target.checked }))}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: colors.greenAccent }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: colors.greenAccent } }}
              />
            }
            label={<Typography sx={{ fontSize: "0.9rem" }}>Bật thông báo</Typography>}
          />

          {profileMsg && <Alert severity={profileMsg.type}>{profileMsg.text}</Alert>}

          <SbButton
            type="submit"
            variant="primary"
            loading={profileMut.isPending}
            sx={{ alignSelf: "flex-start" }}
          >
            Lưu thay đổi
          </SbButton>
        </Box>
      </SbCard>

      {/* ── Change password ───────────────────────────────────────────── */}
      <SbCard>
        <Box
          onClick={() => setPwOpen((p) => !p)}
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockRoundedIcon sx={{ color: colors.greenAccent }} />
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.textBlack }}>
              Đổi mật khẩu
            </Typography>
          </Box>
          <ExpandMoreRoundedIcon sx={{
            color: colors.textBlackSoft,
            transform: pwOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s",
          }} />
        </Box>

        <Collapse in={pwOpen}>
          <Box component="form" onSubmit={handleChangePw} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2.5 }}>
            <SbInput
              label="Mật khẩu hiện tại"
              type={showPw.old ? "text" : "password"}
              value={pwForm.old_password}
              onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
              endAdornment={<EyeBtn field="old" />}
            />
            <SbInput
              label="Mật khẩu mới"
              type={showPw.new ? "text" : "password"}
              value={pwForm.new_password}
              onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
              endAdornment={<EyeBtn field="new" />}
            />
            <SbInput
              label="Xác nhận mật khẩu mới"
              type={showPw.confirm ? "text" : "password"}
              value={pwForm.new_password_confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, new_password_confirm: e.target.value }))}
              endAdornment={<EyeBtn field="confirm" />}
            />

            {pwMsg && <Alert severity={pwMsg.type}>{pwMsg.text}</Alert>}

            <SbButton
              type="submit"
              variant="primary"
              loading={pwMut.isPending}
              sx={{ alignSelf: "flex-start" }}
              disabled={!pwForm.old_password || !pwForm.new_password}
            >
              Đổi mật khẩu
            </SbButton>
          </Box>
        </Collapse>
      </SbCard>

    </Box>
  );
};

export default ProfilePage;
