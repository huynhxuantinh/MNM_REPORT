import { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Divider, Switch, FormControlLabel,
  Alert, Chip, LinearProgress, IconButton,
  Collapse, Grid, Tooltip, Skeleton,
} from "@mui/material";
import PersonRoundedIcon              from "@mui/icons-material/PersonRounded";
import LockRoundedIcon                from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon          from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon       from "@mui/icons-material/VisibilityOffRounded";
import BoltRoundedIcon                from "@mui/icons-material/BoltRounded";
import EmojiEventsRoundedIcon         from "@mui/icons-material/EmojiEventsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import CalendarTodayRoundedIcon       from "@mui/icons-material/CalendarTodayRounded";
import ExpandMoreRoundedIcon          from "@mui/icons-material/ExpandMoreRounded";
import BookmarkRoundedIcon            from "@mui/icons-material/BookmarkRounded";
import CheckCircleRoundedIcon         from "@mui/icons-material/CheckCircleRounded";
import RepeatRoundedIcon              from "@mui/icons-material/RepeatRounded";
import TrackChangesRoundedIcon        from "@mui/icons-material/TrackChangesRounded";
import WorkspacePremiumRoundedIcon    from "@mui/icons-material/WorkspacePremiumRounded";
import AutoAwesomeRoundedIcon         from "@mui/icons-material/AutoAwesomeRounded";
import LocalLibraryRoundedIcon        from "@mui/icons-material/LocalLibraryRounded";
import { SbCard, SbButton, SbInput } from "@/components/ui";
import { setUser } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";
import authApi from "@/api/authApi";
import learningApi from "@/api/learningApi";

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

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HEAT_COLORS = ["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];

const getHeatColor = (count) => {
  if (count === 0) return HEAT_COLORS[0];
  if (count <= 2)  return HEAT_COLORS[1];
  if (count <= 5)  return HEAT_COLORS[2];
  if (count <= 10) return HEAT_COLORS[3];
  return HEAT_COLORS[4];
};

const DAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];

const ActivityHeatmap = () => {
  const WEEKS = 16;
  const TOTAL_DAYS = WEEKS * 7;

  const { data: history, isLoading: loading } = useQuery({
    queryKey: ["review-history", TOTAL_DAYS],
    queryFn: () => learningApi.getReviewHistory(TOTAL_DAYS).then((r) => r.data),
    staleTime: 300_000,
  });

  // Build map date→count
  const countMap = useMemo(() => {
    const m = {};
    (history ?? []).forEach(({ date, count }) => { m[date] = count; });
    return m;
  }, [history]);

  // Build grid: weeks × days, newest week rightmost
  const today = new Date();
  // Align to Saturday (end of week column)
  const dayOfWeek = today.getDay(); // 0=Sun…6=Sat
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek)); // next/current Saturday

  const cells = useMemo(() => {
    const grid = []; // grid[week][day]
    for (let w = WEEKS - 1; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toISOString().slice(0, 10);
        week.push({ dateStr, count: countMap[dateStr] ?? 0, month: date.getMonth(), day: date.getDate() });
      }
      grid.push(week);
    }
    return grid;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countMap]);

  // Month labels: show month name when month changes across columns
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;
    cells.forEach((week, wi) => {
      const m = week[0].month;
      if (m !== lastMonth) { labels.push({ wi, label: MONTHS_VI[m] }); lastMonth = m; }
      else labels.push(null);
    });
    return labels;
  }, [cells]);

  const totalReviewed = useMemo(() => Object.values(countMap).reduce((a, b) => a + b, 0), [countMap]);

  if (loading) return <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 2 }} />;

  return (
    <SbCard>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
            Hoạt động ôn tập
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>
            {WEEKS} tuần qua · {totalReviewed} lượt ôn
          </Typography>
        </Box>
        {/* Legend */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ fontSize: "0.7rem", color: colors.textBlackSoft, mr: 0.5 }}>Ít</Typography>
          {HEAT_COLORS.map((c) => (
            <Box key={c} sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: c }} />
          ))}
          <Typography sx={{ fontSize: "0.7rem", color: colors.textBlackSoft, ml: 0.5 }}>Nhiều</Typography>
        </Box>
      </Box>

      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ display: "inline-flex", flexDirection: "column", minWidth: WEEKS * 16 }}>
          {/* Month labels */}
          <Box sx={{ display: "flex", mb: 0.5, pl: "24px" }}>
            {monthLabels.map((label, wi) => (
              <Box key={wi} sx={{ width: 14, mr: "2px", flexShrink: 0 }}>
                {label && (
                  <Typography sx={{ fontSize: "0.62rem", color: colors.textBlackSoft, whiteSpace: "nowrap" }}>
                    {label.label}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* Grid rows = days of week */}
          {[0,1,2,3,4,5,6].map((dayIdx) => (
            <Box key={dayIdx} sx={{ display: "flex", alignItems: "center", mb: "2px" }}>
              {/* Day label */}
              <Box sx={{ width: 22, flexShrink: 0 }}>
                {dayIdx % 2 === 1 && (
                  <Typography sx={{ fontSize: "0.62rem", color: colors.textBlackSoft }}>{DAYS_VI[dayIdx]}</Typography>
                )}
              </Box>
              {/* Cells */}
              {cells.map((week, wi) => {
                const cell = week[dayIdx];
                return (
                  <Tooltip
                    key={wi}
                    title={cell.count > 0 ? `${cell.dateStr}: ${cell.count} từ` : cell.dateStr}
                    arrow
                    placement="top"
                  >
                    <Box sx={{
                      width: 14, height: 14, borderRadius: "3px",
                      bgcolor: getHeatColor(cell.count),
                      mr: "2px", flexShrink: 0, cursor: "default",
                      transition: "transform 0.1s",
                      "&:hover": { transform: "scale(1.3)" },
                    }} />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </SbCard>
  );
};

// ── Learning stats card ───────────────────────────────────────────────────────

const StatItem = ({ icon, color, value, label, loading }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
    <Box sx={{
      width: 38, height: 38, borderRadius: "10px",
      bgcolor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft }}>{label}</Typography>
      {loading
        ? <Skeleton width={60} height={24} />
        : <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: colors.textBlack, lineHeight: 1 }}>{value}</Typography>
      }
    </Box>
  </Box>
);

const LearningStatsCard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-stats"],
    queryFn: () => learningApi.getProfileStats().then((r) => r.data),
    staleTime: 120_000,
  });

  const s = stats ?? {};

  return (
    <SbCard>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks, mb: 1.5 }}>
        Thống kê học tập
      </Typography>
      <Grid container spacing={0}>
        <Grid item xs={12} sm={6}>
          <StatItem icon={<RepeatRoundedIcon />}       color={colors.greenAccent}  value={s.total_words_studied?.toLocaleString()}   label="Từ đã học (SRS)" loading={isLoading} />
          <StatItem icon={<TrackChangesRoundedIcon />} color="#1e88e5"             value={s.total_review_sessions?.toLocaleString()}  label="Tổng lượt ôn"    loading={isLoading} />
          <StatItem icon={<CheckCircleRoundedIcon />}  color="#43a047"             value={`${s.accuracy_pct ?? 0}%`}                   label="Độ chính xác"    loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatItem icon={<LocalFireDepartmentRoundedIcon />} color={colors.gold}        value={s.best_streak}           label="Streak dài nhất"       loading={isLoading} />
          <StatItem icon={<BookmarkRoundedIcon />}            color="#fb8c00"             value={s.bookmarks}             label="Từ đã bookmark"        loading={isLoading} />
          <StatItem icon={<EmojiEventsRoundedIcon />}         color={colors.greenStarbucks} value={s.lessons_completed}   label="Bài học hoàn thành"    loading={isLoading} />
        </Grid>
      </Grid>

      {/* Accuracy bar */}
      {!isLoading && s.total_review_sessions > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft }}>Độ chính xác tổng thể</Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: s.accuracy_pct >= 70 ? "#43a047" : s.accuracy_pct >= 40 ? colors.gold : "#ef5350" }}>
              {s.correct_answers?.toLocaleString()} / {s.total_review_sessions?.toLocaleString()} đúng
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(s.accuracy_pct ?? 0, 100)}
            sx={{
              height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.06)",
              "& .MuiLinearProgress-bar": {
                bgcolor: s.accuracy_pct >= 70 ? "#43a047" : s.accuracy_pct >= 40 ? colors.gold : "#ef5350",
                borderRadius: 3,
              },
            }}
          />
        </Box>
      )}
    </SbCard>
  );
};

// ── Badges Section ────────────────────────────────────────────────────────────

const BadgesSection = () => {
  const { user } = useSelector((s) => s.auth);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-stats"],
    queryFn: () => learningApi.getProfileStats().then((r) => r.data),
    staleTime: 120_000,
  });

  if (isLoading) return <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />;

  const s = stats ?? {};
  const level = user?.level ?? 1;
  const streak = user?.streak?.current_streak ?? 0;

  const BADGES = [
    {
      id: "level_2",
      title: "Ngôi sao mới",
      desc: "Đạt cấp độ 2",
      icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 36 }} />,
      color: "#9c27b0",
      unlocked: level >= 2,
    },
    {
      id: "streak_7",
      title: "Chăm chỉ",
      desc: "Chuỗi học 7 ngày",
      icon: <LocalFireDepartmentRoundedIcon sx={{ fontSize: 36 }} />,
      color: colors.gold,
      unlocked: streak >= 7,
    },
    {
      id: "words_50",
      title: "Thông thái",
      desc: "Học trên 50 từ",
      icon: <LocalLibraryRoundedIcon sx={{ fontSize: 36 }} />,
      color: "#1e88e5",
      unlocked: (s.total_words_studied ?? 0) >= 50,
    },
    {
      id: "accuracy_85",
      title: "Xạ thủ",
      desc: "Chính xác > 85%",
      icon: <WorkspacePremiumRoundedIcon sx={{ fontSize: 36 }} />,
      color: colors.greenAccent,
      unlocked: s.total_review_sessions > 0 && (s.accuracy_pct ?? 0) >= 85,
    },
  ];

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

  return (
    <SbCard>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: colors.greenStarbucks }}>
          Huy hiệu thành tích
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: colors.textBlackSoft, fontWeight: 700 }}>
          {unlockedCount} / {BADGES.length} huy hiệu
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {BADGES.map(badge => (
          <Grid item xs={6} sm={3} key={badge.id}>
            <Box
              sx={{
                p: 2,
                borderRadius: "16px",
                border: "2px solid",
                borderColor: badge.unlocked ? `${badge.color}40` : "rgba(0,0,0,0.06)",
                bgcolor: badge.unlocked ? `${badge.color}08` : "#fafafa",
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                opacity: badge.unlocked ? 1 : 0.6,
                filter: badge.unlocked ? "none" : "grayscale(100%)",
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: badge.unlocked ? `0 8px 24px ${badge.color}20` : "none" }
              }}
            >
              <Box sx={{ color: badge.color, mb: 1, filter: badge.unlocked ? `drop-shadow(0 4px 8px ${badge.color}40)` : "none" }}>
                {badge.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: colors.textBlack, mb: 0.5, lineHeight: 1.2 }}>
                {badge.title}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: colors.textBlackSoft, lineHeight: 1.2 }}>
                {badge.desc}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </SbCard>
  );
};

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 860, mx: "auto" }}>

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

      {/* ── Activity heatmap ─────────────────────────────────────────── */}
      <ActivityHeatmap />

      {/* ── Badges ───────────────────────────────────────────────────── */}
      {user?.role === "user" && <BadgesSection />}

      {/* ── Learning stats ───────────────────────────────────────────── */}
      <LearningStatsCard />

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
