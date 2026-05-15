import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, IconButton, Alert } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import authApi from "@/api/authApi";
import { colors } from "@/styles/theme";

// ── Password strength (same as RegisterPage) ─────────────────────────────────

const strengthConfig = [
  { label: "Rất yếu",   color: "#c82014" },
  { label: "Yếu",       color: "#e06c00" },
  { label: "Trung bình",color: "#f5a623" },
  { label: "Mạnh",      color: "#7ed321" },
  { label: "Rất mạnh",  color: colors.greenAccent },
];

const getScore = (pw) =>
  [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw)]
    .filter(Boolean).length;

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = getScore(password);
  const cfg = strengthConfig[score] ?? strengthConfig[0];
  return (
    <Box sx={{ mt: -0.5 }}>
      <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1, height: 4, borderRadius: 2,
              bgcolor: i < score ? cfg.color : "rgba(0,0,0,0.12)",
              transition: "background-color 0.3s ease",
            }}
          />
        ))}
      </Box>
      <Typography sx={{ fontSize: "0.72rem", color: cfg.color, fontWeight: 700 }}>
        {cfg.label}
      </Typography>
    </Box>
  );
};

// ── Validators ────────────────────────────────────────────────────────────────

const validatePassword = (v) => {
  if (!v) return "Mật khẩu là bắt buộc";
  if (v.length < 8) return "Tối thiểu 8 ký tự";
  if (!/[A-Z]/.test(v)) return "Cần ít nhất 1 chữ in hoa (A-Z)";
  if (!/[0-9]/.test(v)) return "Cần ít nhất 1 chữ số (0-9)";
  return "";
};

// ── Invalid token state ───────────────────────────────────────────────────────

const InvalidToken = () => (
  <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
    <Box sx={{ mb: 2, color: colors.red }}>
      <ErrorRoundedIcon sx={{ fontSize: 56 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: colors.red, mb: 1.5 }}>
      Link không hợp lệ
    </Typography>
    <Typography sx={{ color: "text.secondary", mb: 4, lineHeight: 1.7 }}>
      Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.
    </Typography>
    <SbButton variant="primary" component={Link} to="/forgot-password" fullWidth>
      Yêu cầu link mới
    </SbButton>
    <Box sx={{ mt: 2, textAlign: "center" }}>
      <Box component={Link} to="/login" sx={{ fontSize: "0.875rem", color: colors.greenAccent, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
        Về trang đăng nhập
      </Box>
    </Box>
  </SbCard>
);

// ── Success state ─────────────────────────────────────────────────────────────

const ResetSuccess = () => (
  <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
    <Box sx={{ mb: 2, color: colors.greenAccent }}>
      <CheckCircleRoundedIcon sx={{ fontSize: 56 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1.5 }}>
      Đặt lại mật khẩu thành công!
    </Typography>
    <Typography sx={{ color: "text.secondary", mb: 4, lineHeight: 1.7 }}>
      Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.
    </Typography>
    <SbButton variant="primary" component={Link} to="/login" fullWidth startIcon={<ArrowBackRoundedIcon />}>
      Đến trang đăng nhập
    </SbButton>
  </SbCard>
);

// ── Component ─────────────────────────────────────────────────────────────────

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  // No token → invalid state
  if (!token) {
    return (
      <AuthShell headline={"Đặt lại\nmật khẩu"}>
        <InvalidToken />
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell headline={"Đặt lại\nmật khẩu"}>
        <ResetSuccess />
      </AuthShell>
    );
  }

  const errors = {
    password: touched.password
      ? validatePassword(form.password)
      : "",
    confirmPassword: touched.confirmPassword
      ? !form.confirmPassword
        ? "Vui lòng nhập lại mật khẩu"
        : form.confirmPassword !== form.password
        ? "Mật khẩu không khớp"
        : ""
      : "",
  };

  const isValid =
    !validatePassword(form.password) &&
    form.confirmPassword === form.password &&
    !!form.confirmPassword;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setServerError("");
  };
  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    if (!isValid) return;

    setLoading(true);
    setServerError("");
    try {
      await authApi.resetPassword({
        token,
        password: form.password,
        password_confirm: form.confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.token) {
        setServerError("Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.");
      } else if (data?.password) {
        setServerError(Array.isArray(data.password) ? data.password[0] : data.password);
      } else if (data?.password_confirm) {
        setServerError(
          Array.isArray(data.password_confirm)
            ? data.password_confirm[0]
            : data.password_confirm
        );
      } else if (data?.detail) {
        setServerError(data.detail);
      } else {
        setServerError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline={"Đặt lại\nmật khẩu"}
      subtext="Tạo mật khẩu mới mạnh để bảo vệ tài khoản của bạn."
    >
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 4 }}>
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "1.6rem", color: colors.greenStarbucks, mb: 0.5, letterSpacing: "-0.02em" }}
        >
          Đặt lại mật khẩu
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
          Nhập mật khẩu mới cho tài khoản của bạn.
        </Typography>

        {serverError && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: "10px", fontSize: "0.875rem" }}
            action={
              serverError.includes("hết hạn") && (
                <Box
                  component={Link}
                  to="/forgot-password"
                  sx={{ fontSize: "0.8rem", fontWeight: 700, color: colors.red, textDecoration: "underline" }}
                >
                  Yêu cầu link mới
                </Box>
              )
            }
          >
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* New password */}
          <Box>
            <SbInput
              label="Mật khẩu mới"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={!!errors.password}
              helperText={errors.password}
              autoComplete="new-password"
              autoFocus
              startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
              endAdornment={
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1}>
                  {showPassword
                    ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />
                    : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              }
            />
            <PasswordStrength password={form.password} />
          </Box>

          {/* Confirm password */}
          <SbInput
            label="Nhập lại mật khẩu"
            type={showConfirm ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            onBlur={handleBlur("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            success={!!(form.confirmPassword && form.confirmPassword === form.password)}
            autoComplete="new-password"
            startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
            endAdornment={
              form.confirmPassword && form.confirmPassword === form.password ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent }} />
              ) : (
                <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small" tabIndex={-1}>
                  {showConfirm
                    ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />
                    : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              )
            }
          />

          <SbButton
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            fullWidth
            sx={{ mt: 0.5 }}
          >
            Đặt lại mật khẩu
          </SbButton>
        </Box>

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

export default ResetPasswordPage;
