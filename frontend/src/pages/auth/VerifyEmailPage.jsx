import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Typography, CircularProgress } from "@mui/material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { ErrorRounded as ErrorRoundedIcon } from "@mui/icons-material";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard } from "@/components/ui";
import authApi from "@/services/authApi";
import { logout } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ.");
      return;
    }

    authApi.verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch((err) => {
        const detail = err?.response?.data?.detail || "Link đã hết hạn hoặc không hợp lệ.";
        const normalized = String(detail).toLowerCase();
        if (
          normalized.includes("đã được sử dụng")
          || normalized.includes("da duoc su dung")
          || normalized.includes("đã xác thực email trước đó")
          || normalized.includes("da xac thuc email truoc do")
        ) {
          setStatus("already_verified");
          setMessage("Email này đã được xác thực trước đó. Bạn có thể đăng nhập bình thường.");
          return;
        }
        setStatus("error");
        setMessage(detail);
      });
  }, [token]);

  const handleGoLogin = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell headline={"Xác thực\nemail"}>
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
        {status === "loading" && (
          <>
            <CircularProgress sx={{ color: colors.greenAccent, mb: 2 }} />
            <Typography sx={{ color: "text.secondary" }}>Đang xác thực tài khoản...</Typography>
          </>
        )}

        {status === "success" && (
          <>
            <Box sx={{ mb: 2, color: colors.greenAccent }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 56 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1 }}>
              Xác thực thành công!
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 3, lineHeight: 1.7 }}>
              Tài khoản của bạn đã được kích hoạt. Đăng nhập ngay để bắt đầu học.
            </Typography>
            <SbButton variant="primary" size="large" onClick={handleGoLogin} fullWidth>
              Đăng nhập
            </SbButton>
          </>
        )}

        {status === "error" && (
          <>
            <Box sx={{ mb: 2, color: "#c82014" }}>
              <ErrorRoundedIcon sx={{ fontSize: 56 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#c82014", mb: 1 }}>
              Xác thực thất bại
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 3, lineHeight: 1.7 }}>
              {message}
            </Typography>
            <SbButton variant="outlined" component={Link} to="/register" fullWidth>
              Đăng ký lại
            </SbButton>
          </>
        )}

        {status === "already_verified" && (
          <>
            <Box sx={{ mb: 2, color: colors.greenAccent }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 56 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1 }}>
              Email đã xác thực
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 3, lineHeight: 1.7 }}>
              {message}
            </Typography>
            <SbButton variant="primary" size="large" onClick={handleGoLogin} fullWidth>
              Đăng nhập ngay
            </SbButton>
          </>
        )}
      </SbCard>
    </AuthShell>
  );
};

export default VerifyEmailPage;
