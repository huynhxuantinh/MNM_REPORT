import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MenuRounded as MenuRoundedIcon } from "@mui/icons-material";
import { NotificationsRounded as NotificationsRoundedIcon } from "@mui/icons-material";
import { LogoutRounded as LogoutRoundedIcon } from "@mui/icons-material";
import { PersonRounded as PersonRoundedIcon } from "@mui/icons-material";
import { DarkModeRounded as DarkModeRoundedIcon } from "@mui/icons-material";
import { LightModeRounded as LightModeRoundedIcon } from "@mui/icons-material";
import { logout } from "@/features/auth/authSlice";
import { SbAvatar } from "@/components/ui";
import { colors } from "@/styles/theme";
import { useAppTheme } from "@/contexts/ThemeContext";
import { SIDEBAR_WIDTH } from "./Sidebar";

const resolveComponent = (Comp) => {
  let current = Comp;
  while (current && typeof current === "object" && "default" in current && !("$$typeof" in current)) {
    current = current.default;
  }
  return current;
};

const SafeMenuRoundedIcon = resolveComponent(MenuRoundedIcon);
const SafeNotificationsRoundedIcon = resolveComponent(NotificationsRoundedIcon);
const SafeLogoutRoundedIcon = resolveComponent(LogoutRoundedIcon);
const SafePersonRoundedIcon = resolveComponent(PersonRoundedIcon);
const SafeDarkModeRoundedIcon = resolveComponent(DarkModeRoundedIcon);
const SafeLightModeRoundedIcon = resolveComponent(LightModeRoundedIcon);
const SafeSbAvatar = resolveComponent(SbAvatar);

const PAGE_TITLES = {
  "/": "Trang chủ",
  "/vocabulary": "Từ vựng",
  "/learning": "Học tập",
  "/listening": "Luyện nghe",
  "/quiz": "Quiz",
  "/profile": "Hồ sơ",
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { mode, toggleMode } = useAppTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const pageTitle = (() => {
    if (location.pathname.startsWith("/learning/session/")) return "Phiên học";
    if (location.pathname.startsWith("/listening/session/")) return "Phiên luyện nghe";
    return PAGE_TITLES[location.pathname] ?? "NoroStu";
  })();
  const unreadCount = 0;

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleNotifOpen = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  const handleLogout = () => {
    dispatch(logout());
    handleUserMenuClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
        zIndex: (t) => t.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, md: 3 } }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1, color: colors.greenHouse }} aria-label="menu">
            {SafeMenuRoundedIcon ? <SafeMenuRoundedIcon /> : null}
          </IconButton>
        )}

        <Typography
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.1rem", md: "1.25rem" },
            letterSpacing: "-0.02em",
            color: colors.greenStarbucks,
            flex: 1,
          }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={mode === "dark" ? "Chế độ sáng" : "Chế độ tối"} arrow>
            <IconButton onClick={toggleMode} sx={{ color: "text.secondary", "&:hover": { color: colors.greenAccent } }}>
              {mode === "dark"
                ? (SafeLightModeRoundedIcon ? <SafeLightModeRoundedIcon fontSize="small" /> : null)
                : (SafeDarkModeRoundedIcon ? <SafeDarkModeRoundedIcon fontSize="small" /> : null)}
            </IconButton>
          </Tooltip>

          <Tooltip title="Thông báo" arrow>
            <IconButton onClick={handleNotifOpen} sx={{ color: "text.secondary", "&:hover": { color: colors.greenAccent } }}>
              <Badge badgeContent={unreadCount} color="error" max={9}>
                {SafeNotificationsRoundedIcon ? <SafeNotificationsRoundedIcon /> : null}
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={user?.username ?? ""} arrow>
            <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.5 }}>
              {SafeSbAvatar ? <SafeSbAvatar user={user} size="sm" showRing={false} /> : null}
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleNotifClose}
          PaperProps={{ sx: { width: 320, borderRadius: "12px", boxShadow: 4 } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ p: "12px 16px" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: colors.greenStarbucks }}>
              Thông báo
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
              Không có thông báo mới
            </Typography>
          </Box>
        </Menu>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          PaperProps={{ sx: { width: 200, borderRadius: "12px", boxShadow: 4, mt: 0.5 } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: colors.greenHouse }}>
              {user?.full_name || user?.username}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { navigate("/profile"); handleUserMenuClose(); }} sx={{ py: 1, gap: 1.5, fontSize: "0.875rem" }}>
            {SafePersonRoundedIcon ? <SafePersonRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} /> : null}
            Hồ sơ của tôi
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1, gap: 1.5, fontSize: "0.875rem", color: colors.red }}>
            {SafeLogoutRoundedIcon ? <SafeLogoutRoundedIcon fontSize="small" /> : null}
            Đăng xuất
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
