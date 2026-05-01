import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard } from "@/components/ui";
import authApi from "@/api/authApi";
import { colors } from "@/styles/theme";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
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
        setStatus("error");
        setMessage(
          err?.response?.data?.detail || "Link đã hết hạn hoặc không hợp lệ."
        );
      });
  }, [token]);

  return (
    <AuthShell headline={"Xác thực\nemail"}>
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
        {status === "loading" && (
          <>
            <CircularProgress sx={{ color: colors.greenAccent, mb: 2 }} />
            <Typography sx={{ color: "text.secondary" }}>
              Đang xác thực tài khoản...
            </Typography>
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
            <SbButton variant="primary" size="large" component={Link} to="/login" fullWidth>
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
      </SbCard>
    </AuthShell>
  );
};

export default VerifyEmailPage;
