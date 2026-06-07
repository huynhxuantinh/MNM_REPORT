import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box, Typography, IconButton,
  Alert,
} from "@mui/material";
import { VisibilityRounded as VisibilityRoundedIcon } from "@mui/icons-material";
import { VisibilityOffRounded as VisibilityOffRoundedIcon } from "@mui/icons-material";
import { PersonRounded as PersonRoundedIcon } from "@mui/icons-material";
import { EmailRounded as EmailRoundedIcon } from "@mui/icons-material";
import { LockRounded as LockRoundedIcon } from "@mui/icons-material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { MarkEmailReadRounded as MarkEmailReadRoundedIcon } from "@mui/icons-material";
import AuthShell from "@/components/layout/AuthShell";
import { SbButton, SbCard, SbInput } from "@/components/ui";
import authApi from "@/services/authApi";
import { colors } from "@/styles/theme";

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

const parseFieldErrors = (err) => {
  const data = err?.response?.data;
  if (!data || typeof data !== "object") {
    return { _general: "Không thể kết nối đến server. Vui lòng thử lại." };
  }

  const result = {};
  ["username", "email", "password"].forEach((f) => {
    if (data[f]) result[f] = Array.isArray(data[f]) ? data[f][0] : data[f];
  });
  if (data.detail) result._general = data.detail;
  if (data.non_field_errors) {
    result._general = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  }

  if (Object.keys(result).length === 0) {
    result._general = "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
  }

  return result;
};

const RegisterSuccess = ({ email, emailSent, initialDetail }) => {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    setResendError("");
    try {
      const response = await authApi.resendVerification({ email });
      setResendMsg(
        response?.data?.detail || "Nếu email tồn tại và chưa xác thực, bạn sẽ nhận được email trong vài phút."
      );
    } catch (err) {
      const msg = err.response?.data?.detail;
      if (err?.response?.status === 429 && msg) {
        setResendError(msg);
      } else {
        setResendError("Không thể gửi lại email. Vui lòng thử lại sau.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SbCard sx={{ px: { xs: 3, sm: 4 }, py: 5, textAlign: "center" }}>
      <Box sx={{ mb: 2, color: colors.greenAccent }}>
        <MarkEmailReadRoundedIcon sx={{ fontSize: 56 }} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: colors.greenStarbucks, mb: 1 }}>
        Kiểm tra email của bạn!
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 2, lineHeight: 1.7 }}>
        {emailSent ? "Chúng tôi đã gửi email xác thực đến " : "Tài khoản đã được tạo cho email "}
        <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
          {email}
        </Box>
        {emailSent
          ? ". Nhấn vào link trong email để kích hoạt tài khoản."
          : ". Nếu chưa nhận được email xác thực, hãy dùng nút gửi lại bên dưới."}
      </Typography>

      {!emailSent && (
        <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
          {initialDetail || "Email xác thực chưa gửi đi được. Vui lòng thử gửi lại."}
        </Alert>
      )}

      {resendMsg && <Alert severity="success" sx={{ mb: 2, textAlign: "left" }}>{resendMsg}</Alert>}
      {resendError && <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>{resendError}</Alert>}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SbButton variant="outlined" component={Link} to="/login" fullWidth>
          Về trang đăng nhập
        </SbButton>
        <SbButton
          variant="text"
          onClick={handleResend}
          loading={resendLoading}
          disabled={resendLoading}
          fullWidth
        >
          Gửi lại email xác thực
        </SbButton>
      </Box>
    </SbCard>
  );
};

const RegisterPage = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [successState, setSuccessState] = useState(null);

  const clientErrors = {
    username: touched.username ? validate.username(form.username) : "",
    email: touched.email ? validate.email(form.email) : "",
    password: touched.password ? validate.password(form.password) : "",
    confirmPassword: touched.confirmPassword ? validate.confirmPassword(form.confirmPassword, form.password) : "",
  };

  const fieldError = (f) => serverErrors[f] || clientErrors[f];

  const isFormValid = !Object.values({
    username: validate.username(form.username),
    email: validate.email(form.email),
    password: validate.password(form.password),
    confirmPassword: validate.confirmPassword(form.confirmPassword, form.password),
  }).some(Boolean);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setServerErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    if (!isFormValid) return;

    setLoading(true);
    setServerErrors({});
    try {
      const response = await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        password_confirm: form.confirmPassword,
      });
      setSuccessState({
        emailSent: response?.data?.email_sent !== false,
        detail: response?.data?.detail || "",
      });
    } catch (err) {
      setServerErrors(parseFieldErrors(err));
    } finally {
      setLoading(false);
    }
  };

  if (successState) {
    return (
      <AuthShell headline={"Đăng ký\nthành công!"}>
        <RegisterSuccess
          email={form.email}
          emailSent={successState.emailSent}
          initialDetail={successState.detail}
        />
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
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
          Đã có tài khoản?{" "}
          <Box component={Link} to="/login" sx={{ color: colors.greenAccent, fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            Đăng nhập
          </Box>
        </Typography>

        {serverErrors._general && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", fontSize: "0.875rem" }}>{serverErrors._general}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SbInput
            label="Tên đăng nhập"
            value={form.username}
            onChange={handleChange("username")}
            onBlur={handleBlur("username")}
            error={!!fieldError("username")}
            helperText={fieldError("username")}
            autoComplete="username"
            autoFocus
            startAdornment={<PersonRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
          />

          <SbInput
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={!!fieldError("email")}
            helperText={fieldError("email")}
            autoComplete="email"
            startAdornment={<EmailRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
          />

          <SbInput
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange("password")}
            onBlur={handleBlur("password")}
            error={!!fieldError("password")}
            helperText={fieldError("password")}
            autoComplete="new-password"
            startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
            endAdornment={
              <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {showPassword ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            }
          />

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
            startAdornment={<LockRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
            endAdornment={
              form.confirmPassword && form.confirmPassword === form.password ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent }} />
              ) : (
                <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small" tabIndex={-1} aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                  {showConfirm ? <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              )
            }
          />

          <SbButton type="submit" variant="primary" size="large" loading={loading} fullWidth sx={{ mt: 0.5 }}>
            Tạo tài khoản
          </SbButton>
        </Box>
      </SbCard>
    </AuthShell>
  );
};

export default RegisterPage;
