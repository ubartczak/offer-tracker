import { createContext, useContext, useState, useEffect } from "react";

type Theme = "persimmon" | "blueberry";

const STORAGE_KEY = "jam-theme";

function getSavedTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "blueberry" ? "blueberry" : "persimmon";
}

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "persimmon", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    document.body.className = theme === "blueberry" ? "theme-blueberry" : "";
    localStorage.setItem(STORAGE_KEY, theme);
    window.postMessage({ type: "JAM_SET_THEME", theme }, window.location.origin);
  }, [theme]);

  const toggle = () =>
    setTheme((t) => (t === "persimmon" ? "blueberry" : "persimmon"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
