import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box, Typography, IconButton,
  Alert, LinearProgress,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import authApi from "@/api/authApi";
import { colors } from "@/styles/theme";

// ── Validators ────────────────────────────────────────────────────────────────

const validate = {
  username: (v) => {
    if (!v?.trim()) return "Tên đăng nhập là bắt buộc";
    if (v.length < 3) return "Tối thiểu 3 ký tự";
    if (v.length > 20) return "Tối đa 20 ký tự";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Chỉ dùng chữ, số và dấu _";
    return "";
  },
  email: (v) => {
    if (!v?.trim()) return "Email là bắt buộc";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Email không hợp lệ";
    return "";
  },
  password: (v) => {
    if (!v) return "Mật khẩu là bắt buộc";
    if (v.length < 8) return "Tối thiểu 8 ký tự";
    if (!/[A-Z]/.test(v)) return "Cần ít nhất 1 chữ in hoa (A-Z)";
    if (!/[0-9]/.test(v)) return "Cần ít nhất 1 chữ số (0-9)";
    return "";
  },
  confirmPassword: (v, pw) => {
    if (!v) return "Vui lòng nhập lại mật khẩu";
    if (v !== pw) return "Mật khẩu không khớp";
    return "";
  },
};

// ── Password strength bar ─────────────────────────────────────────────────────

const strengthConfig = [
  { label: "Rất yếu",   color: "#c82014" },
  { label: "Yếu",       color: "#e06c00" },
  { label: "Trung bình",color: "#f5a623" },
  { label: "Mạnh",      color: "#7ed321" },
  { label: "Rất mạnh",  color: colors.greenAccent },
];

const getScore = (pw) => [
  pw.length >= 8,
  /[A-Z]/.test(pw),
  /[0-9]/.test(pw),
  /[!@#$%^&*(),.?":{}|<>_\-]/.test(pw),
].filter(Boolean).length;

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

// ── Server error parser ───────────────────────────────────────────────────────

const parseFieldErrors = (err) => {
  if (!err?.response?.data) return {};
  const data = err.response.data;
  const result = {};
  ["username", "email", "password"].forEach((f) => {
    if (data[f]) result[f] = Array.isArray(data[f]) ? data[f][0] : data[f];
  });
  if (data.detail) result._general = data.detail;
  if (data.non_field_errors) result._general = data.non_field_errors[0];
  return result;
};

// ── Success state ─────────────────────────────────────────────────────────────

const RegisterSuccess = ({ email }) => (
  <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
    <Box sx={{ mb: 2, color: colors.greenAccent }}>
      <MarkEmailReadRoundedIcon sx={{ fontSize: 56 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1 }}>
      Kiểm tra email của bạn!
    </Typography>
    <Typography sx={{ color: colors.textBlackSoft, mb: 3, lineHeight: 1.7 }}>
      Chúng tôi đã gửi email xác thực đến{" "}
      <Box component="span" sx={{ fontWeight: 700, color: colors.textBlack }}>
        {email}
      </Box>
      . Nhấn vào link trong email để kích hoạt tài khoản.
    </Typography>
    <SbButton variant="outlined" component={Link} to="/login" fullWidth>
      Về trang đăng nhập
    </SbButton>
  </SbCard>
);

// ── Component ─────────────────────────────────────────────────────────────────

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const clientErrors = {
    username:        touched.username        ? validate.username(form.username)                    : "",
    email:           touched.email           ? validate.email(form.email)                          : "",
    password:        touched.password        ? validate.password(form.password)                    : "",
    confirmPassword: touched.confirmPassword ? validate.confirmPassword(form.confirmPassword, form.password) : "",
  };

  const fieldError = (f) => serverErrors[f] || clientErrors[f];

  const isFormValid = !Object.values({
    username:        validate.username(form.username),
    email:           validate.email(form.email),
    password:        validate.password(form.password),
    confirmPassword: validate.confirmPassword(form.confirmPassword, form.password),
  }).some(Boolean);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setServerErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setLoading(true);
    setServerErrors({});
    try {
      await authApi.register({
        username: form.username,
        email:    form.email,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setServerErrors(parseFieldErrors(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell headline={"Đăng ký\nthành công!"}>
        <RegisterSuccess email={form.email} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline={"Bắt đầu học\nngay hôm nay!"}
      subtext="Tạo tài khoản miễn phí và chinh phục từ vựng tiếng Anh."
    >
      <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 4 }}>
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "1.6rem", color: colors.greenStarbucks, mb: 0.5, letterSpacing: "-0.02em" }}
        >
          Tạo tài khoản
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: colors.textBlackSoft, mb: 3 }}>
          Đã có tài khoản?{" "}
          <Box component={Link} to="/login" sx={{ color: colors.greenAccent, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Đăng nhập
          </Box>
        </Typography>

        {serverErrors._general && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.875rem" }}>
            {serverErrors._general}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Username */}
          <SbInput
            label="Tên đăng nhập"
            value={form.username}
            onChange={handleChange("username")}
            onBlur={handleBlur("username")}
            error={!!fieldError("username")}
            helperText={fieldError("username")}
            autoComplete="username"
            autoFocus
            startAdornment={<PersonRoundedIcon sx={{ fontSize: 20, color: colors.textBlackSoft }} />}
          />

          {/* Email */}
          <SbInput
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={!!fieldError("email")}
            helperText={fieldError("email")}
            autoComplete="email"
            startAdornment={<EmailRoundedIcon sx={{ fontSize: 20, color: colors.textBlackSoft }} />}
          />

          {/* Password */}
          <Box>
            <SbInput
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={!!fieldError("password")}
              helperText={fieldError("password")}
              autoComplete="new-password"
              startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: colors.textBlackSoft }} />}
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
            error={!!fieldError("confirmPassword")}
            helperText={fieldError("confirmPassword")}
            success={!!(form.confirmPassword && form.confirmPassword === form.password)}
            autoComplete="new-password"
            startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: colors.textBlackSoft }} />}
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
            Tạo tài khoản
          </SbButton>
        </Box>
      </SbCard>
    </AuthShell>
  );
};

export default RegisterPage;
