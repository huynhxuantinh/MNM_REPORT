import { Button, CircularProgress } from "@mui/material";
import { colors } from "@/styles/theme";

/**
 * SbButton – Starbucks-style pill button.
 *
 * variant:
 *   "primary"   – Green Accent fill (CTA mặc định)
 *   "outlined"  – Green Accent outline
 *   "inverted"  – White fill + Green Accent text (dùng trên nền dark)
 *   "dark"      – White outline trên nền dark
 *   "black"     – Black fill (join-strip)
 */
const variantStyles = {
  primary: {
    variant: "contained",
    sx: {
      bgcolor: colors.greenAccent,
      color: "#fff",
      "&:hover": { bgcolor: colors.greenStarbucks },
    },
  },
  outlined: {
    variant: "outlined",
    sx: {
      borderColor: colors.greenAccent,
      color: colors.greenAccent,
      "&:hover": { borderColor: colors.greenStarbucks, bgcolor: "rgba(0,117,74,0.04)" },
    },
  },
  inverted: {
    variant: "contained",
    sx: {
      bgcolor: "#fff",
      color: colors.greenAccent,
      "&:hover": { bgcolor: colors.ceramic },
    },
  },
  dark: {
    variant: "outlined",
    sx: {
      borderColor: "#fff",
      color: "#fff",
      "&:hover": { bgcolor: "rgba(255,255,255,0.10)", borderColor: "#fff" },
    },
  },
  black: {
    variant: "contained",
    sx: {
      bgcolor: "#000",
      color: "#fff",
      "&:hover": { bgcolor: "#222" },
    },
  },
};

const SbButton = ({
  variant = "primary",
  loading = false,
  disabled,
  startIcon,
  endIcon,
  children,
  sx,
  ...props
}) => {
  const { variant: muiVariant, sx: variantSx } = variantStyles[variant] ?? variantStyles.primary;

  return (
    <Button
      variant={muiVariant}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={endIcon}
      disableElevation
      sx={{
        borderRadius: "50px",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        textTransform: "none",
        transition: "all 0.2s ease",
        "&:active": { transform: "scale(0.95)" },
        ...variantSx,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default SbButton;
