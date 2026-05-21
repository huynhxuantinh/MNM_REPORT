import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { CheckCircleRounded as CheckCircleRoundedIcon } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { colors } from "@/styles/theme";

const FEATURES = [
  "Thuật toán SRS SM-2 khoa học, ghi nhớ lâu hơn",
  "Theo dõi XP, Level và Streak hằng ngày",
  "Bài học được thiết kế bài bản theo CEFR",
  "Hệ thống Quiz thông minh luyện phản xạ",
];

const LeftPanel = ({ headline, subtext }) => (
  <Box
    sx={{
      width: { md: "42%", lg: "40%" },
      minHeight: "100vh",
      bgcolor: colors.greenHouse,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      justifyContent: "center",
      px: { md: 5, lg: 7 },
      py: 6,
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: -80,
        right: -80,
        width: 320,
        height: 320,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.06)",
        pointerEvents: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: -120,
        left: -60,
        width: 400,
        height: 400,
        borderRadius: "50%",
        bgcolor: "rgba(0,117,74,0.18)",
        pointerEvents: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        right: -40,
        width: 200,
        height: 200,
        borderRadius: "50%",
        bgcolor: "rgba(0,117,74,0.10)",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    />

    <Box component={Link} to="/about" sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 6, textDecoration: "none" }}>
      <Box
        component="img"
        src="/logo.png"
        alt="NoroStu"
        sx={{ width: 44, height: 44, borderRadius: "10px", objectFit: "contain", flexShrink: 0 }}
      />
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          NoroStu
        </Typography>
        <Typography sx={{ fontSize: "0.7rem", color: colors.textWhiteSoft, lineHeight: 1 }}>
          Học từ vựng hiệu quả
        </Typography>
      </Box>
    </Box>
    <Box
      component={Link}
      to="/about"
      sx={{
        alignSelf: "flex-start",
        mb: 4,
        px: 2.25,
        py: 1,
        borderRadius: 999,
        bgcolor: "#fff",
        color: colors.greenHouse,
        fontSize: "0.9rem",
        fontWeight: 900,
        textDecoration: "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        "&:hover": { bgcolor: colors.greenLight },
      }}
    >
      Xem giới thiệu
    </Box>

    <Typography
      sx={{
        fontSize: { md: "2rem", lg: "2.4rem" },
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
        mb: 2,
      }}
    >
      {headline}
    </Typography>
    {subtext && (
      <Typography sx={{ fontSize: "1rem", color: colors.textWhiteSoft, mb: 4, lineHeight: 1.6 }}>
        {subtext}
      </Typography>
    )}

    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {FEATURES.map((f) => (
        <Box key={f} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: colors.greenAccent, mt: 0.15, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.9rem", color: colors.textWhiteSoft, lineHeight: 1.5 }}>
            {f}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);

const MobileLogoBar = () => (
  <Box
    sx={{
      bgcolor: colors.greenHouse,
      py: 2,
      px: 3,
      display: "flex",
      alignItems: "center",
      gap: 1.25,
    }}
  >
    <Box component={Link} to="/about" sx={{ display: "flex", alignItems: "center", gap: 1.25, textDecoration: "none" }}>
      <Box
        component="img"
        src="/logo.png"
        alt="NoroStu"
        sx={{ width: 32, height: 32, borderRadius: "8px", objectFit: "contain" }}
      />
      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#fff", letterSpacing: "-0.02em" }}>
        NoroStu
      </Typography>
    </Box>
    <Box
      component={Link}
      to="/about"
      sx={{
        ml: "auto",
        px: 1.5,
        py: 0.7,
        borderRadius: 999,
        bgcolor: "#fff",
        color: colors.greenHouse,
        fontSize: "0.82rem",
        fontWeight: 900,
        textDecoration: "none",
        "&:hover": { bgcolor: colors.greenLight },
      }}
    >
      Giới thiệu
    </Box>
  </Box>
);

const AuthShell = ({
  headline = "Học từ vựng\nhiệu quả hơn",
  subtext,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <LeftPanel headline={headline} subtext={subtext} />

      <Box
        sx={{
          flex: 1,
          bgcolor: colors.neutralWarm,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {!isMobile && (
          <Box
            component={Link}
            to="/about"
            sx={{
              position: "absolute",
              top: 28,
              right: 36,
              zIndex: 1,
              px: 2,
              py: 1,
              borderRadius: 999,
              bgcolor: colors.greenAccent,
              color: "#fff",
              fontWeight: 900,
              fontSize: "0.92rem",
              textDecoration: "none",
              boxShadow: "0 8px 22px rgba(0,117,74,0.24)",
              "&:hover": { bgcolor: colors.greenStarbucks },
            }}
          >
            Giới thiệu
          </Box>
        )}

        {isMobile && <MobileLogoBar />}

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 4 },
            py: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 440 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthShell;
