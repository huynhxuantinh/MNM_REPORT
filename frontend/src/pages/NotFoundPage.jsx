import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { SbButton } from "@/components/ui";
import { colors } from "@/styles/theme";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: colors.greenLight ?? "#f1f8f4",
        px: 2,
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 420 }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            bgcolor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <SearchOffRoundedIcon sx={{ fontSize: 52, color: colors.greenAccent }} />
        </Box>

        <Typography
          sx={{
            fontWeight: 900,
            fontSize: { xs: "4rem", sm: "6rem" },
            lineHeight: 1,
            color: colors.greenStarbucks,
            mb: 1,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.1rem", sm: "1.3rem" },
            color: colors.textBlack,
            mb: 1,
          }}
        >
          Trang không tồn tại
        </Typography>

        <Typography
          sx={{
            fontSize: "0.9375rem",
            color: colors.textBlackSoft,
            mb: 3.5,
            lineHeight: 1.6,
          }}
        >
          Đường dẫn bạn truy cập không hợp lệ hoặc đã bị xóa.
          <br />
          Hãy quay lại trang chủ để tiếp tục học.
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          <SbButton variant="outlined" onClick={() => navigate(-1)}>
            Quay lại
          </SbButton>
          <SbButton variant="primary" onClick={() => navigate("/")}>
            Về trang chủ
          </SbButton>
        </Box>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
