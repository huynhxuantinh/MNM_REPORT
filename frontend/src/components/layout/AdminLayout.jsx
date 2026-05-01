import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, AppBar, Toolbar, IconButton,
  Tooltip, Menu, MenuItem, useMediaQuery, useTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { SbAvatar } from "@/components/ui";
import { logout } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";
import { useAppTheme } from "@/contexts/ThemeContext";

const SIDEBAR_WIDTH = 260;
const HEADER_HEIGHT = 64;

const ADMIN_BG     = "#1a1f3a";   // navy đậm
const ADMIN_ACCENT = "#5c6bc0";   // indigo

const NAV_ITEMS = [
  { label: "Tổng quan",   to: "/admin",          icon: <DashboardRoundedIcon />,        end: true },
  { label: "Người dùng",  to: "/admin/users",    icon: <PeopleRoundedIcon /> },
  { label: "Từ vựng",     to: "/admin/words",    icon: <TranslateRoundedIcon /> },
  { label: "Bài học",     to: "/admin/lessons",  icon: <MenuBookRoundedIcon /> },
  { label: "Nội dung",    to: "/admin/content",  icon: <LibraryBooksRoundedIcon /> },
  { label: "Kết quả Quiz", to: "/admin/quizzes", icon: <QuizRoundedIcon /> },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

const SidebarContent = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: ADMIN_BG, color: "#fff" }}>

      {/* Logo */}
      <Box sx={{ p: "24px 20px 20px", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "10px",
          bgcolor: ADMIN_ACCENT,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <AdminPanelSettingsRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#fff", lineHeight: 1.2 }}>
            MNM English
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", lineHeight: 1 }}>
            Quản trị hệ thống
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, py: 1.5 }}>
        {NAV_ITEMS.map(({ label, to, icon, end }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={end}
            style={({ isActive }) => ({
              borderRadius: "10px",
              marginBottom: 4,
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
              backgroundColor: isActive ? ADMIN_ACCENT : "transparent",
            })}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
              "& .MuiListItemIcon-root": { color: "inherit", minWidth: 36 },
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.01em" }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

      {/* User info */}
      <Box sx={{ p: "16px 20px 20px", display: "flex", alignItems: "center", gap: 1.5 }}>
        <SbAvatar user={user} size="md" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.full_name || user?.username}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
            Quản trị viên
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

const AdminHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mode, toggleMode } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    dispatch(logout());
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
        boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
        zIndex: (t) => t.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, px: { xs: 2, md: 3 } }}>
        <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1, display: { md: "none" }, color: ADMIN_BG }}>
          <MenuRoundedIcon />
        </IconButton>

        {/* Badge admin */}
        <Box sx={{
          px: 1.5, py: 0.4, borderRadius: "20px",
          bgcolor: `${ADMIN_ACCENT}20`,
          border: `1px solid ${ADMIN_ACCENT}40`,
          mr: 2,
        }}>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: ADMIN_BG }}>
            Cổng quản trị
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={mode === "dark" ? "Chế độ sáng" : "Chế độ tối"} arrow>
          <IconButton onClick={toggleMode} sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={user?.email} arrow>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <SbAvatar user={user} size="sm" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { width: 200, borderRadius: "12px", boxShadow: 4, mt: 0.5 } }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: ADMIN_BG }}>
              {user?.full_name || user?.username}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { navigate("/profile"); setAnchorEl(null); }} sx={{ py: 1, gap: 1.5, fontSize: "0.875rem" }}>
            <PersonRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            Hồ sơ
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1, gap: 1.5, fontSize: "0.875rem", color: "error.main" }}>
            <LogoutRoundedIcon fontSize="small" />
            Đăng xuất
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

// ── Layout ────────────────────────────────────────────────────────────────────

const AdminLayout = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: SIDEBAR_WIDTH, border: "none" } }}
          >
            <SidebarContent />
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            PaperProps={{ sx: { width: SIDEBAR_WIDTH, border: "none", boxShadow: "2px 0 8px rgba(0,0,0,0.12)" } }}
          >
            <SidebarContent />
          </Drawer>
        )}
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flex: 1, mt: `${HEADER_HEIGHT}px`, p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
