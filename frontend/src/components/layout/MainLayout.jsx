import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box, useMediaQuery, useTheme, IconButton, Tooltip } from "@mui/material";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import Header from "./Header";
import { colors } from "@/styles/theme";

const HEADER_HEIGHT = 64;

const MainLayout = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isReviewPage = location.pathname === "/review";
  const showFrap = user?.role === "user" && !isReviewPage;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Sidebar – permanent on desktop, drawer on mobile */}
      <Box
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Sidebar
            mobile
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
        ) : (
          <Sidebar />
        )}
      </Box>

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: "100vh",
        }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            mt: `${HEADER_HEIGHT}px`,
            p: { xs: 2, sm: 3 },
            maxWidth: "100%",
            overflow: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Floating Action Button (Frap) for Review */}
      {showFrap && (
        <Tooltip title="Ôn tập ngay (SRS)" placement="left" arrow>
          <IconButton
            onClick={() => navigate("/review")}
            sx={{
              position: "fixed",
              bottom: { xs: 24, md: 32 },
              right: { xs: 24, md: 32 },
              width: 56,
              height: 56,
              bgcolor: colors.greenAccent,
              color: "#fff",
              zIndex: 1200,
              boxShadow: "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                bgcolor: colors.greenAccent,
                transform: "translateY(-2px)",
              },
              "&:active": {
                transform: "scale(0.95)",
                boxShadow: "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0)",
              },
            }}
          >
            <LocalFireDepartmentRoundedIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default MainLayout;
