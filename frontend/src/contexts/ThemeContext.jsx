import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "@/styles/theme";

const ThemeCtx = createContext({ mode: "light", toggleMode: () => {} });

export const useAppTheme = () => useContext(ThemeCtx);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(
    () => localStorage.getItem("mnm-theme") || "light"
  );

  const toggleMode = () =>
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("mnm-theme", next);
      return next;
    });

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeCtx.Provider>
  );
};
