import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Alert } from "@mui/material";
import { EmailRounded as EmailRoundedIcon } from "@mui/icons-material";
import { MarkEmailReadRounded as MarkEmailReadRoundedIcon } from "@mui/icons-material";
import { ArrowBackRounded as ArrowBackRoundedIcon } from "@mui/icons-material";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import authApi from "@/services/authApi";
import { colors } from "@/styles/theme";

// ── Success state ─────────────────────────────────────────────────────────────

const ForgotSuccess = ({ email }) => (
  <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
    <Box sx={{ mb: 2, color: colors.greenAccent }}>
      <MarkEmailReadRoundedIcon sx={{ fontSize: 56 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1.5 }}>
      Email đã được gửi!
    </Typography>
    <Typography sx={{ color: "text.secondary", mb: 1, lineHeight: 1.7 }}>
      Nếu tài khoản với email{" "}
      <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
        {email}
      </Box>{" "}
      tồn tại, bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
    </Typography>
    <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 4 }}>
      Kiểm tra cả hộp thư rác nếu không thấy email.
    </Typography>
    <SbButton variant="primary" component={Link} to="/login" fullWidth startIcon={<ArrowBackRoundedIcon />}>
      Về trang đăng nhập
    </SbButton>
  </SbCard>
);

// ── Component ─────────────────────────────────────────────────────────────────

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const emailError = touched
    ? !email?.trim()
      ? "Email là bắt buộc"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Email không hợp lệ"
      : ""
    : "";

  const isValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setLoading(true);
    setServerError("");
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      // Backend luôn trả 200 để tránh user enumeration
      // Chỉ xử lý lỗi validation thực sự (400)
      const msg = err.response?.data?.email?.[0]
        || err.response?.data?.detail
        || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell headline={"Khôi phục\ntài khoản"}>
        <ForgotSuccess email={email} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline={"Quên mật\nkhẩu?"}
      subtext="Nhập email của bạn để nhận link đặt lại mật khẩu."
    >
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 4 }}>
        {/* Title */}
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "1.6rem", color: colors.greenStarbucks, mb: 0.5, letterSpacing: "-0.02em" }}
        >
          Quên mật khẩu
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
          Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu cho bạn.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.875rem" }}>
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SbInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setServerError(""); }}
            onBlur={() => setTouched(true)}
            error={!!emailError}
            helperText={emailError}
            autoComplete="email"
            autoFocus
            startAdornment={<EmailRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
          />

          <SbButton
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            fullWidth
            sx={{ mt: 0.5 }}
          >
            Gửi link đặt lại mật khẩu
          </SbButton>
        </Box>

        {/* Back to login */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Box
            component={Link}
            to="/login"
            sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              fontSize: "0.875rem", fontWeight: 600,
              color: colors.greenAccent, textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
            Quay lại đăng nhập
          </Box>
        </Box>
      </SbCard>
    </AuthShell>
  );
};

export default ForgotPasswordPage;

