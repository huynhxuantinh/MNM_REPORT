import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Avatar,
  Box,
  Drawer,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  HomeRounded as HomeIcon,
  AutoStoriesRounded as VocabIcon,
  StyleRounded as WordSetsIcon,
  SchoolRounded as LearningIcon,
  HeadphonesRounded as ListeningIcon,
  QuizRounded as QuizIcon,
  EmojiEventsRounded as LeaderboardIcon,
  NotificationsRounded as NotifIcon,
  PersonRounded as ProfileIcon,
  AdminPanelSettingsRounded as AdminIcon,
  LocalFireDepartmentRounded as StreakIcon,
} from "@mui/icons-material";
import { colors } from "@/styles/theme";

export const SIDEBAR_WIDTH = 260;

const BASE_NAV = [
  { label: "Trang chủ", to: "/", end: true, Icon: HomeIcon },
  { label: "Từ vựng", to: "/vocabulary", Icon: VocabIcon },
  { label: "Bộ từ", to: "/wordsets", Icon: WordSetsIcon },
  { label: "Học tập", to: "/learning", Icon: LearningIcon },
  { label: "Luyện nghe", to: "/listening", Icon: ListeningIcon },
  { label: "Quiz", to: "/quiz", Icon: QuizIcon },
  { label: "Xếp hạng", to: "/leaderboard", Icon: LeaderboardIcon },
  { label: "Thông báo", to: "/notifications", Icon: NotifIcon },
  { label: "Hồ sơ", to: "/profile", Icon: ProfileIcon },
];

const ADMIN_NAV = [
  { label: "Quản trị", to: "/admin", Icon: AdminIcon },
];

const PROFILE_ONLY = [
  { label: "Hồ sơ", to: "/profile", Icon: ProfileIcon },
];

const NavItem = ({ label, Icon, onClick, isActive }) => (
  <Tooltip title={label} placement="right" arrow disableHoverListener>
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: "10px",
        mb: 0.5,
        cursor: "pointer",
        color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
        bgcolor: isActive ? colors.greenAccent : "transparent",
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: isActive ? colors.greenAccent : "rgba(255,255,255,0.08)",
          color: "#fff",
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isActive ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: isActive ? 700 : 500,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
      {isActive && (
        <Box
          sx={{
            ml: "auto",
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: "#fff",
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  </Tooltip>
);

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navItems =
    user?.role === "admin"
      ? ADMIN_NAV
      : user?.role === "user"
        ? BASE_NAV
        : PROFILE_ONLY;

  const avatarLetter = (user?.username || user?.email || "U")[0].toUpperCase();
  const streak = user?.streak ?? 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: colors.greenHouse,
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            component="img"
            src="/logo.png"
            alt="NoroStu"
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.975rem", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              NoroStu
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.50)", lineHeight: 1, mt: 0.25 }}>
              Học từ vựng · SRS
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Typography
        sx={{
          px: 2.5,
          pb: 1,
          fontSize: "0.65rem",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        Menu
      </Typography>

      <Box sx={{ px: 1.5, flex: 1, overflowY: "auto" }}>
        {navItems.map(({ label, to, end, Icon }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavItem
              key={to}
              label={label}
              Icon={Icon}
              isActive={isActive}
              onClick={() => navigate(to)}
            />
          );
        })}
      </Box>

      {user?.role === "user" && streak > 0 && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: "10px",
              bgcolor: "rgba(255,255,255,0.06)",
            }}
          >
            <StreakIcon sx={{ fontSize: 18, color: "#f5a623" }} />
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#f5a623" }}>
              {streak} ngày streak
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          mx: 1.5,
          mb: 2,
          px: 1.5,
          py: 1.5,
          borderRadius: "16px",
          bgcolor: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: colors.greenAccent, width: 44, height: 44, fontWeight: 700 }}>
            {avatarLetter}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }} noWrap>
              {user?.username || user?.email || "Người dùng"}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }} noWrap>
              Lv.{user?.level ?? 1} · {user?.xp ?? 0} XP
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

const Sidebar = ({ open, onClose, mobile = false }) => {
  if (mobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            borderRight: "none",
          },
        }}
      >
        <SidebarContent />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        display: { xs: "none", md: "block" },
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          borderRight: "none",
        },
      }}
    >
      <SidebarContent />
    </Drawer>
  );
};

export default Sidebar;
