import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "@/styles/theme";

const ThemeCtx = createContext({ mode: "light", toggleMode: () => {} });
const THEME_KEY = "norostu-theme";
const LEGACY_THEME_KEY = "mnm-theme";

export const useAppTheme = () => useContext(ThemeCtx);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const current = localStorage.getItem(THEME_KEY);
    if (current) return current;
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy) {
      localStorage.setItem(THEME_KEY, legacy);
      return legacy;
    }
    return "light";
  });

  const toggleMode = () =>
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeCtx.Provider>
  );
};
