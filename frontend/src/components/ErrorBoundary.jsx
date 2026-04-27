import { Component } from "react";
import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Box sx={{ textAlign: "center", maxWidth: 400 }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 56, color: "#e65100", mb: 2 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", mb: 1, color: "#1b1b1b" }}>
            Đã xảy ra lỗi
          </Typography>
          <Typography sx={{ color: "#6b7280", mb: 3, fontSize: "0.9375rem" }}>
            Trang này gặp sự cố không mong đợi. Hãy thử tải lại trang.
          </Typography>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#00704a",
              color: "#fff",
              border: "none",
              borderRadius: "50px",
              padding: "10px 28px",
              fontWeight: 700,
              fontSize: "0.9375rem",
              cursor: "pointer",
            }}
          >
            Tải lại trang
          </button>
        </Box>
      </Box>
    );
  }
}

export default ErrorBoundary;
