import { createTheme, alpha } from "@mui/material/styles";

// ── Starbucks Design Token ──────────────────────────────────────────────────
export const colors = {
  greenStarbucks: "#006241",
  greenAccent:    "#00754A",
  greenHouse:     "#1E3932",
  greenUplift:    "#2b5148",
  greenLight:     "#d4e9e2",
  gold:           "#cba258",
  goldLight:      "#dfc49d",
  goldLightest:   "#faf6ee",
  neutralWarm:    "#f2f0eb",
  ceramic:        "#edebe9",
  neutralCool:    "#f9f9f9",
  red:            "#c82014",
  textBlack:      "rgba(0,0,0,0.87)",
  textBlackSoft:  "rgba(0,0,0,0.58)",
  textWhite:      "rgba(255,255,255,1)",
  textWhiteSoft:  "rgba(255,255,255,0.70)",
  rewardsGreen:   "#33433d",
};

const theme = createTheme({
  palette: {
    primary: {
      main:         colors.greenAccent,
      dark:         colors.greenStarbucks,
      contrastText: "#ffffff",
    },
    secondary: {
      main:  colors.gold,
      light: colors.goldLight,
      dark:  "#a07c3a",
    },
    background: {
      default: colors.neutralWarm,
      paper:   "#ffffff",
    },
    text: {
      primary:   colors.textBlack,
      secondary: colors.textBlackSoft,
      disabled:  "rgba(0,0,0,0.38)",
    },
    success: {
      main:  colors.greenLight,
      dark:  colors.greenAccent,
      contrastText: colors.greenHouse,
    },
    error: {
      main: colors.red,
    },
    // Custom palette keys
    houseGreen: {
      main:         colors.greenHouse,
      contrastText: "#ffffff",
    },
  },

  typography: {
    fontFamily: '"Nunito", "Inter", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    letterSpacing: "-0.01em",
    h1: {
      fontSize: "2.4rem",
      fontWeight: 800,
      letterSpacing: "-0.16px",
      color: colors.greenStarbucks,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.0rem",
      fontWeight: 700,
      letterSpacing: "-0.16px",
      lineHeight: 1.25,
    },
    h3: {
      fontSize: "1.6rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      lineHeight: 1.35,
    },
    h4: {
      fontSize: "1.4rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontSize: "1.2rem",
      fontWeight: 600,
    },
    h6: {
      fontSize: "1.0rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      letterSpacing: "-0.01em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      letterSpacing: "-0.01em",
    },
    caption: {
      fontSize: "0.8125rem",
      letterSpacing: "0.01em",
      color: colors.textBlackSoft,
    },
    button: {
      fontWeight: 700,
      fontSize: "0.9375rem",
      letterSpacing: "-0.01em",
      textTransform: "none",
    },
    overline: {
      fontWeight: 700,
      fontSize: "0.75rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
  },

  shape: { borderRadius: 12 },

  shadows: [
    "none",
    // elevation 1 – whisper card shadow
    "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)",
    // elevation 2 – slight lift
    "0 1px 3px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)",
    // elevation 3
    "0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.08)",
    // elevation 4
    "0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
    // elevation 5 – frap button
    "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)",
    ...Array(19).fill("0 8px 24px rgba(0,0,0,0.12)"),
  ],

  components: {
    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 50,
          padding: "8px 22px",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          transition: "all 0.2s ease",
          "&:active": { transform: "scale(0.95)" },
        },
        sizeLarge: { padding: "12px 32px", fontSize: "1rem" },
        sizeSmall: { padding: "5px 16px", fontSize: "0.8125rem" },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        containedPrimary: {
          backgroundColor: colors.greenAccent,
          "&:hover": { backgroundColor: colors.greenStarbucks },
        },
        outlinedPrimary: {
          borderColor: colors.greenAccent,
          color: colors.greenAccent,
          "&:hover": {
            borderColor: colors.greenStarbucks,
            backgroundColor: alpha(colors.greenAccent, 0.04),
          },
        },
      },
    },

    // ── Card ────────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)",
          backgroundImage: "none",
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px 24px",
          "&:last-child": { paddingBottom: 20 },
        },
      },
    },

    // ── TextField ───────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "medium" },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.greenAccent,
            borderWidth: 2,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: colors.greenUplift,
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: colors.textBlackSoft,
          "&.Mui-focused": { color: colors.greenAccent },
        },
      },
    },

    // ── Chip (Badge) ─────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
        },
      },
    },

    // ── Avatar ────────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.greenAccent,
          fontWeight: 700,
        },
      },
    },

    // ── AppBar ─────────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)",
        },
      },
    },

    // ── Tooltip ─────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.greenHouse,
          fontSize: "0.75rem",
          borderRadius: 6,
        },
      },
    },

    // ── LinearProgress ───────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 50, height: 6 },
        bar: { borderRadius: 50 },
        colorPrimary: { backgroundColor: alpha(colors.greenAccent, 0.18) },
        barColorPrimary: { backgroundColor: colors.greenAccent },
      },
    },

    // ── Divider ──────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: { root: { borderColor: "rgba(0,0,0,0.08)" } },
    },

    // ── CssBaseline ──────────────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.neutralWarm,
          scrollbarWidth: "thin",
          scrollbarColor: `${colors.greenLight} transparent`,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.greenLight,
            borderRadius: 3,
          },
        },
      },
    },
  },
});

export default theme;
