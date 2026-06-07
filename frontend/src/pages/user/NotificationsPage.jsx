import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Chip, CircularProgress, Divider } from "@mui/material";
import { NotificationsRounded as NotificationsRoundedIcon } from "@mui/icons-material";
import { EmojiEventsRounded as EmojiEventsRoundedIcon } from "@mui/icons-material";
import { LocalFireDepartmentRounded as LocalFireDepartmentRoundedIcon } from "@mui/icons-material";
import { InfoRounded as InfoRoundedIcon } from "@mui/icons-material";
import { DoneAllRounded as DoneAllRoundedIcon } from "@mui/icons-material";
import { FiberManualRecordRounded as FiberManualRecordRoundedIcon } from "@mui/icons-material";
import { SbCard, SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";
import learningApi from "@/services/learningApi";

const TYPE_CONFIG = {
  level_up: { icon: <EmojiEventsRoundedIcon />, color: colors.greenAccent, label: "Lên cấp" },
  streak: { icon: <LocalFireDepartmentRoundedIcon />, color: "#f57c00", label: "Streak" },
  reminder: { icon: <InfoRoundedIcon />, color: colors.greenStarbucks, label: "Nhắc nhở" },
  system: { icon: <InfoRoundedIcon />, color: colors.greenStarbucks, label: "Hệ thống" },
};

const getTypeConfig = (type) => TYPE_CONFIG[type] ?? TYPE_CONFIG.system;

const timeAgo = (iso) => {
  if (!iso) return "";
  const diffSeconds = (Date.now() - new Date(iso)) / 1000;
  if (diffSeconds < 60) return "Vừa xong";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffSeconds / 86400)} ngày trước`;
};

const NotificationRow = ({ notification, onRead }) => {
  const config = getTypeConfig(notification.type);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        p: "14px 16px",
        bgcolor: notification.is_read ? "transparent" : `${colors.greenAccent}07`,
        borderLeft: `3px solid ${notification.is_read ? "transparent" : colors.greenAccent}`,
        transition: "background 0.2s",
        cursor: notification.is_read ? "default" : "pointer",
        "&:hover": notification.is_read ? {} : { bgcolor: `${colors.greenAccent}12` },
      }}
      onClick={() => !notification.is_read && onRead(notification.id)}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: `${config.color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: config.color,
        }}
      >
        {config.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}>
          <Chip
            label={config.label}
            size="small"
            sx={{ bgcolor: `${config.color}18`, color: config.color, fontWeight: 700, fontSize: "0.68rem", height: 18 }}
          />
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {timeAgo(notification.created_at)}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.9rem", color: "text.primary", lineHeight: 1.5 }}>
          {notification.message}
        </Typography>
      </Box>

      {!notification.is_read && (
        <FiberManualRecordRoundedIcon sx={{ fontSize: 10, color: colors.greenAccent, flexShrink: 0, mt: 0.5 }} />
      )}
    </Box>
  );
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => learningApi.getNotifications().then((response) => response.data),
    staleTime: 30_000,
  });

  const notifications = data?.results ?? data ?? [];
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => learningApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => learningApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 680, mx: "auto" }}>
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
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Đánh dấu tất cả đã đọc
          </SbButton>
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: colors.greenAccent }} />
        </Box>
      ) : notifications.length === 0 ? (
        <SbCard>
          <Box sx={{ textAlign: "center", py: 5 }}>
            <NotificationsRoundedIcon sx={{ fontSize: 56, color: colors.greenLight, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
              Chưa có thông báo
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Hoàn thành bài học hoặc lên cấp để nhận thông báo mới.
            </Typography>
          </Box>
        </SbCard>
      ) : (
        <SbCard noPadding sx={{ overflow: "hidden" }}>
          {notifications.map((notification, index) => (
            <Box key={notification.id}>
              {index > 0 && <Divider />}
              <NotificationRow notification={notification} onRead={(id) => markReadMutation.mutate(id)} />
            </Box>
          ))}
        </SbCard>
      )}
    </Box>
  );
};

export default NotificationsPage;
