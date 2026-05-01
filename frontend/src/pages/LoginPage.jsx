import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, IconButton,
  Alert, Divider,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import { login, clearError } from "@/features/auth/authSlice";
import { colors } from "@/styles/theme";

// ── Validation ───────────────────────────────────────────────────────────────

const validate = {
  email: (v) => {
    if (!v?.trim()) return "Email là bắt buộc";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Email không hợp lệ";
    return "";
  },
  password: (v) => (!v ? "Mật khẩu là bắt buộc" : ""),
};

// ── Parse server errors ───────────────────────────────────────────────────────

const parseServerError = (err) => {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err.detail) return err.detail;
  if (err.non_field_errors) {
    const msg = err.non_field_errors.join(" ");
    // Highlight email verification error
    if (msg.includes("chưa được xác thực") || msg.includes("kích hoạt")) {
      return msg + " (Kiểm tra hộp thư và spam folder)";
    }
    return msg;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
};

// ── Component ─────────────────────────────────────────────────────────────────

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname ?? "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const errors = {
    email:    touched.email    ? validate.email(form.email)       : "",
    password: touched.password ? validate.password(form.password) : "",
  };

  const isFormValid = !validate.email(form.email) && !validate.password(form.password);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    dispatch(clearError());
  };

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid) return;

    const result = await dispatch(login({ email: form.email, password: form.password }));
    if (login.fulfilled.match(result)) {
      // Nếu user đang bị redirect từ trang cụ thể thì về đó, không thì redirect theo role
      if (from !== "/") {
        navigate(from, { replace: true });
      } else {
        const role = result.payload?.user?.role;
        if (role === "admin")   navigate("/admin",   { replace: true });
        else if (role === "teacher") navigate("/teacher", { replace: true });
        else                    navigate("/",        { replace: true });
      }
    }
  };

  const serverError = parseServerError(error);

  return (
    <AuthShell
      headline={"Chào mừng\ntrở lại!"}
      subtext="Tiếp tục hành trình học từ vựng của bạn."
    >
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 4 }}>
        {/* Title */}
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "1.6rem", color: colors.greenStarbucks, mb: 0.5, letterSpacing: "-0.02em" }}
        >
          Đăng nhập
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
          Chưa có tài khoản?{" "}
          <Box component={Link} to="/register" sx={{ color: colors.greenAccent, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Đăng ký ngay
          </Box>
        </Typography>

        {/* Server error */}
        {serverError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.875rem" }}>
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Email */}
          <SbInput
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
            autoFocus
            startAdornment={<EmailRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
          />

          {/* Password */}
          <SbInput
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange("password")}
            onBlur={handleBlur("password")}
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="current-password"
            startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
            endAdornment={
              <IconButton
                onClick={() => setShowPassword((v) => !v)}
                edge="end" size="small"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword
                  ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />
                  : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            }
          />

          {/* Forgot password link */}
          <Box sx={{ textAlign: "right", mt: -1 }}>
            <Box
              component={Link}
              to="/forgot-password"
              sx={{ fontSize: "0.8125rem", color: colors.greenAccent, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Quên mật khẩu?
            </Box>
          </Box>

          {/* Submit */}
          <SbButton
            type="submit"
            variant="primary"
            size="large"
            loading={loading}
            fullWidth
            sx={{ mt: 0.5 }}
          >
            Đăng nhập
          </SbButton>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", px: 1 }}>
            hoặc
          </Typography>
        </Divider>

        <SbButton
          variant="outlined"
          size="large"
          fullWidth
          component={Link}
          to="/register"
        >
          Tạo tài khoản mới
        </SbButton>
      </SbCard>
    </AuthShell>
  );
};

export default LoginPage;
