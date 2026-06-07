import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalFireDepartmentRounded as LocalFireDepartmentRoundedIcon } from "@mui/icons-material";
import { KeyboardRounded as KeyboardRoundedIcon } from "@mui/icons-material";
import { ShieldRounded as ShieldRoundedIcon } from "@mui/icons-material";
import { FavoriteRounded as FavoriteRoundedIcon } from "@mui/icons-material";
import { FactCheckRounded as FactCheckRoundedIcon } from "@mui/icons-material";
import Sidebar, { SIDEBAR_WIDTH } from "./Sidebar";
import Header from "./Header";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";

const resolveComponent = (Comp) => {
  let current = Comp;
  while (current && typeof current === "object" && "default" in current && !("$$typeof" in current)) {
    current = current.default;
  }
  return current;
};

const SafeLocalFireDepartmentRoundedIcon = resolveComponent(LocalFireDepartmentRoundedIcon);

const HEADER_HEIGHT = 64;
const getUxOnboardingKey = (user) => {
  const identity = user?.id || user?.email || user?.username || "anon";
  return `ux_onboarding_seen_v2_${identity}`;
};

const MainLayout = () => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isReviewPage = location.pathname === "/review";
  const showFrap = user?.role === "user" && !isReviewPage;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user?.role !== "user") return;
    if (location.pathname.startsWith("/learning/session/")) return;

    // Avoid blocking unrelated pages (home/profile/quiz) with onboarding dialog.
    if (location.pathname !== "/learning") {
      setOnboardingOpen(false);
      return;
    }

    const seen = window.localStorage.getItem(getUxOnboardingKey(user)) === "1";
    setOnboardingOpen(!seen);
  }, [location.pathname, user]);

  const closeOnboarding = () => {
    setOnboardingOpen(false);
    if (typeof window !== "undefined" && user?.role === "user") {
      window.localStorage.setItem(getUxOnboardingKey(user), "1");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
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
            {SafeLocalFireDepartmentRoundedIcon ? <SafeLocalFireDepartmentRoundedIcon sx={{ fontSize: 28 }} /> : null}
          </IconButton>
        </Tooltip>
      )}

      <Dialog open={onboardingOpen} onClose={closeOnboarding} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Hướng dẫn nhanh trước khi học</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ mt: 0.5 }}>
            <Alert icon={<FavoriteRoundedIcon />} severity="info">
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Hearts</Typography>
              <Typography sx={{ fontSize: "0.84rem" }}>
                Mỗi câu sai thường trừ 1 tim. Hết tim cần chờ hồi để học tiếp.
              </Typography>
            </Alert>
            <Alert icon={<ShieldRoundedIcon />} severity="success">
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Streak Freeze</Typography>
              <Typography sx={{ fontSize: "0.84rem" }}>
                Nếu nghỉ 1 ngày, hệ thống tự dùng 1 freeze để giữ streak.
              </Typography>
            </Alert>
            <Alert icon={<FactCheckRoundedIcon />} severity="warning">
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Checkpoint</Typography>
              <Typography sx={{ fontSize: "0.84rem" }}>
                Hoàn thành checkpoint để xác nhận kiến thức unit trước khi tiến xa hơn.
              </Typography>
            </Alert>
            <Alert icon={<KeyboardRoundedIcon />} severity="info">
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Phím tắt</Typography>
              <Typography sx={{ fontSize: "0.84rem" }}>
                Dùng 1-4 để chọn đáp án, Enter để gửi nhanh.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <SbButton
            variant="outlined"
            onClick={() => {
              closeOnboarding();
              navigate("/learning");
            }}
          >
            Vào lộ trình học
          </SbButton>
          <SbButton variant="primary" onClick={closeOnboarding}>
            Đã hiểu
          </SbButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MainLayout;
