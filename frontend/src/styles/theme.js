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

// ── Dark mode surface tokens ───────────────────────────────────────────────
const dark = {
  bg:      "#111318",   // page background
  paper:   "#1c1f2e",   // card / surface
  surface: "#252836",   // elevated surface (menu, dialog)
  border:  "rgba(255,255,255,0.10)",
};

export const createAppTheme = (mode = "light") => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
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
        default: isDark ? dark.bg    : colors.neutralWarm,
        paper:   isDark ? dark.paper : "#ffffff",
      },
      text: {
        primary:   isDark ? "rgba(255,255,255,0.87)" : colors.textBlack,
        secondary: isDark ? "rgba(255,255,255,0.60)" : colors.textBlackSoft,
        disabled:  isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.38)",
      },
      divider: isDark ? dark.border : "rgba(0,0,0,0.08)",
      success: {
        main:         colors.greenLight,
        dark:         colors.greenAccent,
        contrastText: colors.greenHouse,
      },
      error:  { main: colors.red },
      houseGreen: { main: colors.greenHouse, contrastText: "#ffffff" },
    },

    typography: {
      fontFamily: '"Nunito", "Inter", "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      letterSpacing: "-0.01em",
      h1: { fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.16px", lineHeight: 1.2 },
      h2: { fontSize: "2.0rem", fontWeight: 700, letterSpacing: "-0.16px", lineHeight: 1.25 },
      h3: { fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.35 },
      h4: { fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.01em" },
      h5: { fontSize: "1.2rem", fontWeight: 600 },
      h6: { fontSize: "1.0rem", fontWeight: 600 },
      body1: { fontSize: "1rem", lineHeight: 1.6, letterSpacing: "-0.01em" },
      body2: { fontSize: "0.875rem", lineHeight: 1.5, letterSpacing: "-0.01em" },
      caption: { fontSize: "0.8125rem", letterSpacing: "0.01em" },
      button: { fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.01em", textTransform: "none" },
      overline: { fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" },
    },

    shape: { borderRadius: 12 },

    shadows: [
      "none",
      "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)",
      "0 1px 3px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)",
      "0 2px 8px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.08)",
      "0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
      "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)",
      ...Array(19).fill("0 8px 24px rgba(0,0,0,0.12)"),
    ],

    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 50, padding: "8px 22px", fontWeight: 700,
            letterSpacing: "-0.01em", transition: "all 0.2s ease",
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
              backgroundColor: alpha(colors.greenAccent, 0.08),
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? "0 0 0 1px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.40)"
              : "0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)",
            backgroundImage: "none",
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: { padding: "20px 24px", "&:last-child": { paddingBottom: 20 } },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },

      MuiTextField: { defaultProps: { variant: "outlined", size: "medium" } },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.greenAccent, borderWidth: 2,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.greenUplift,
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: { "&.Mui-focused": { color: colors.greenAccent } },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 50, fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.02em" },
        },
      },

      MuiAvatar: {
        styleOverrides: { root: { backgroundColor: colors.greenAccent, fontWeight: 700 } },
      },

      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: isDark
              ? "0 1px 0 rgba(255,255,255,0.08)"
              : "0 1px 3px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,0.06)",
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: colors.greenHouse, fontSize: "0.75rem", borderRadius: 6 },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 50, height: 6 },
          bar: { borderRadius: 50 },
          colorPrimary: { backgroundColor: alpha(colors.greenAccent, isDark ? 0.25 : 0.18) },
          barColorPrimary: { backgroundColor: colors.greenAccent },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isDark ? dark.border : "rgba(0,0,0,0.08)" },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: { "& .MuiTableCell-head": { backgroundColor: isDark ? dark.surface : "#f5f7ff" } },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:hover": { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f9f9f8" },
          },
        },
      },

      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? dark.bg : colors.neutralWarm,
            scrollbarWidth: "thin",
            scrollbarColor: isDark
              ? `${dark.surface} transparent`
              : `${colors.greenLight} transparent`,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? dark.surface : colors.greenLight,
              borderRadius: 3,
            },
          },
        },
      },
    },
  });
};

// Backward compat — dùng trong các file chưa migrate sang dynamic theme
const theme = createAppTheme("light");
export default theme;
