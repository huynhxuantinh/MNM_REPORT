import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Chip, CircularProgress, Divider, IconButton, Tooltip,
} from "@mui/material";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import AssignmentRoundedIcon    from "@mui/icons-material/AssignmentRounded";
import EmojiEventsRoundedIcon   from "@mui/icons-material/EmojiEventsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import InfoRoundedIcon          from "@mui/icons-material/InfoRounded";
import DoneAllRoundedIcon       from "@mui/icons-material/DoneAllRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import { SbCard, SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/api/learningApi";

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CFG = {
  assignment: { icon: <AssignmentRoundedIcon />, color: colors.gold, label: "Bài được giao" },
  level_up:   { icon: <EmojiEventsRoundedIcon />, color: colors.greenAccent, label: "Lên cấp" },
  streak:     { icon: <LocalFireDepartmentRoundedIcon />, color: "#f57c00", label: "Streak" },
  system:     { icon: <InfoRoundedIcon />, color: colors.greenStarbucks, label: "Hệ thống" },
};

const typeCfg = (type) => TYPE_CFG[type] ?? TYPE_CFG.system;

// ── Time ago ──────────────────────────────────────────────────────────────────

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

// ── Single notification row ───────────────────────────────────────────────────

const NotifRow = ({ notif, onRead }) => {
  const cfg = typeCfg(notif.type);
  return (
    <Box
      sx={{
        display: "flex", gap: 2, alignItems: "flex-start", p: "14px 16px",
        bgcolor: notif.is_read ? "transparent" : `${colors.greenAccent}07`,
        borderLeft: `3px solid ${notif.is_read ? "transparent" : colors.greenAccent}`,
        transition: "background 0.2s",
        cursor: notif.is_read ? "default" : "pointer",
        "&:hover": notif.is_read ? {} : { bgcolor: `${colors.greenAccent}12` },
      }}
      onClick={() => !notif.is_read && onRead(notif.id)}
    >
      {/* Icon */}
      <Box sx={{
        width: 40, height: 40, borderRadius: "50%",
        bgcolor: `${cfg.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: cfg.color,
      }}>
        {cfg.icon}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
          <Chip label={cfg.label} size="small"
            sx={{ bgcolor: `${cfg.color}18`, color: cfg.color, fontWeight: 700, fontSize: "0.68rem", height: 18 }} />
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {timeAgo(notif.created_at)}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.9rem", color: "text.primary", lineHeight: 1.5 }}>
          {notif.message}
        </Typography>
      </Box>

      {/* Unread dot */}
      {!notif.is_read && (
        <FiberManualRecordRoundedIcon sx={{ fontSize: 10, color: colors.greenAccent, flexShrink: 0, mt: 0.5 }} />
      )}
    </Box>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const NotificationsPage = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => learningApi.getNotifications().then((r) => r.data),
    staleTime: 30_000,
  });

  const notifs = data?.results ?? data ?? [];
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const markReadMut = useMutation({
    mutationFn: (id) => learningApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => learningApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 680, mx: "auto" }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: colors.greenStarbucks, letterSpacing: "-0.02em" }}>
            Thông báo
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <SbButton
            variant="outlined"
            size="small"
            startIcon={<DoneAllRoundedIcon />}
            loading={markAllMut.isPending}
            onClick={() => markAllMut.mutate()}
          >
            Đánh dấu tất cả đã đọc
          </SbButton>
        )}
      </Box>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: colors.greenAccent }} />
        </Box>
      ) : notifs.length === 0 ? (
        <SbCard>
          <Box sx={{ textAlign: "center", py: 5 }}>
            <NotificationsRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
              Chưa có thông báo
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Hoàn thành bài học hoặc lên cấp để nhận thông báo.
            </Typography>
          </Box>
        </SbCard>
      ) : (
        <SbCard noPadding sx={{ overflow: "hidden" }}>
          {notifs.map((n, i) => (
            <Box key={n.id}>
              {i > 0 && <Divider />}
              <NotifRow notif={n} onRead={(id) => markReadMut.mutate(id)} />
            </Box>
          ))}
        </SbCard>
      )}

    </Box>
  );
};

export default NotificationsPage;
