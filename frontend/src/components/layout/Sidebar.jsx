import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, LinearProgress, Tooltip,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { SbAvatar } from "@/components/ui";
import { colors } from "@/styles/theme";

const SIDEBAR_WIDTH = 260;

const BASE_NAV = [
  { label: "Trang chủ",  to: "/",              icon: <HomeRoundedIcon />,       end: true },
  { label: "Từ vựng",    to: "/vocabulary",     icon: <MenuBookRoundedIcon /> },
  { label: "Học tập",    to: "/learning",       icon: <SchoolRoundedIcon /> },
  { label: "Quiz",       to: "/quiz",           icon: <QuizRoundedIcon /> },
  { label: "Thông báo",  to: "/notifications",  icon: <NotificationsRoundedIcon /> },
  { label: "Hồ sơ",      to: "/profile",        icon: <PersonRoundedIcon /> },
];

const ADMIN_NAV = [
  { label: "Quản trị",   to: "/admin",          icon: <AdminPanelSettingsRoundedIcon />, roles: ["admin"] },
];

const getLevelXp = (level) => 100 * level * (level + 1) / 2;

const SidebarContent = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const NAV_ITEMS = [
    ...BASE_NAV,
    ...(user?.role === "admin" ? ADMIN_NAV : []),
  ];

  const level      = user?.level ?? 1;
  const xp         = user?.xp ?? 0;
  const streak     = user?.streak?.current_streak ?? 0;
  const nextXp     = getLevelXp(level);
  const prevXp     = getLevelXp(level - 1);
  const xpProgress = nextXp > prevXp
    ? Math.round(((xp - prevXp) / (nextXp - prevXp)) * 100)
    : 100;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: colors.greenHouse,
        color: colors.textWhite,
        overflow: "hidden",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <Box sx={{ p: "24px 20px 20px", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: "50%",
            bgcolor: colors.greenAccent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: "1rem", color: "#fff", flexShrink: 0,
          }}
        >
          M
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em",
              color: "#fff", lineHeight: 1.2,
            }}
          >
            MNM English
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: colors.textWhiteSoft, lineHeight: 1 }}>
            Học từ vựng SRS
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)", mx: 2 }} />

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <List sx={{ flex: 1, px: 1.5, py: 1.5 }}>
        {NAV_ITEMS.map(({ label, to, icon, end }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              end={end}
              sx={{
                borderRadius: "10px",
                mb: 0.5,
                px: 1.5,
                py: 1,
                color: isActive ? "#fff" : colors.textWhiteSoft,
                bgcolor: isActive ? colors.greenAccent : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isActive ? colors.greenAccent : "rgba(255,255,255,0.08)",
                  color: "#fff",
                },
                "& .MuiListItemIcon-root": {
                  color: "inherit",
                  minWidth: 36,
                },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.9rem",
                  letterSpacing: "-0.01em",
                }}
              />
              {isActive && (
                <Box
                  sx={{
                    width: 6, height: 6, borderRadius: "50%",
                    bgcolor: "#fff", opacity: 0.8, flexShrink: 0,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)", mx: 2 }} />

      {/* ── User Stats ─────────────────────────────────────────────── */}
      <Box sx={{ p: "16px 20px 20px" }}>
        {user ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <SbAvatar user={user} size="md" showRing />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 700, fontSize: "0.875rem", color: "#fff",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {user.full_name || user.username}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: colors.textWhiteSoft }}>
                  Level {level}
                </Typography>
              </Box>
            </Box>

            {/* XP progress */}
            <Tooltip
              title={`${xp} / ${nextXp} XP (Level ${level + 1})`}
              placement="top"
              arrow
            >
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <BoltRoundedIcon sx={{ fontSize: 13, color: colors.greenAccent }} />
                    <Typography sx={{ fontSize: "0.7rem", color: colors.textWhiteSoft }}>
                      {xp} XP
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.7rem", color: colors.textWhiteSoft }}>
                    {xpProgress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={xpProgress}
                  sx={{
                    height: 5, borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.12)",
                    "& .MuiLinearProgress-bar": { bgcolor: colors.greenAccent },
                  }}
                />
              </Box>
            </Tooltip>

            {/* Streak */}
            <Box
              sx={{
                display: "flex", alignItems: "center", gap: 0.75,
                bgcolor: "rgba(255,255,255,0.07)",
                borderRadius: "8px", px: 1.5, py: 0.75,
              }}
            >
              <LocalFireDepartmentRoundedIcon
                sx={{ fontSize: 18, color: streak > 0 ? colors.gold : colors.textWhiteSoft }}
              />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                {streak} ngày
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: colors.textWhiteSoft, ml: 0.5 }}>
                liên tiếp
              </Typography>
            </Box>
          </>
        ) : (
          <Typography sx={{ fontSize: "0.8rem", color: colors.textWhiteSoft }}>
            Chưa đăng nhập
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const Sidebar = ({ open, onClose, mobile = false }) => {
  if (mobile) {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: { width: SIDEBAR_WIDTH, bgcolor: colors.greenHouse, border: "none" },
        }}
      >
        <SidebarContent />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          width: SIDEBAR_WIDTH,
          bgcolor: colors.greenHouse,
          border: "none",
          boxShadow: "2px 0 8px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <SidebarContent />
    </Drawer>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
