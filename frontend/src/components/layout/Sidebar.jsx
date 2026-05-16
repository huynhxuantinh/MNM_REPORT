import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import { colors } from "@/styles/theme";

const SIDEBAR_WIDTH = 260;

const BASE_NAV = [
  { label: "Trang chủ", to: "/", end: true },
  { label: "Từ vựng", to: "/vocabulary" },
  { label: "Bộ từ", to: "/wordsets" },
  { label: "Học tập", to: "/learning" },
  { label: "Quiz", to: "/quiz" },
  { label: "Xếp hạng", to: "/leaderboard" },
  { label: "Thông báo", to: "/notifications" },
  { label: "Hồ sơ", to: "/profile" },
];

const ADMIN_NAV = [{ label: "Quản trị", to: "/admin" }];

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    ...(user?.role === "user" ? BASE_NAV : [{ label: "Hồ sơ", to: "/profile" }]),
    ...(user?.role === "admin" ? ADMIN_NAV : []),
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: colors.greenHouse, color: "#fff" }}>
      <Box sx={{ p: "20px" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1rem" }}>MNM English</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: colors.textWhiteSoft }}>Học từ vựng SRS</Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)", mx: 2 }} />

      <List sx={{ px: 1.5, py: 1.5 }}>
        {navItems.map(({ label, to, end }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <ListItemButton
              key={to}
              onClick={() => navigate(to)}
              sx={{
                borderRadius: "10px",
                mb: 0.5,
                color: isActive ? "#fff" : colors.textWhiteSoft,
                bgcolor: isActive ? colors.greenAccent : "transparent",
                "&:hover": { bgcolor: isActive ? colors.greenAccent : "rgba(255,255,255,0.08)", color: "#fff" },
              }}
            >
              <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: isActive ? 700 : 500 }} />
            </ListItemButton>
          );
        })}
      </List>
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
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, bgcolor: colors.greenHouse, border: "none" } }}
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
