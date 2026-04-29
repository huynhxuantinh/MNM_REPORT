import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import Header from "./Header";
const HEADER_HEIGHT = 64;

const MainLayout = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

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
    </Box>
  );
};

export default MainLayout;
