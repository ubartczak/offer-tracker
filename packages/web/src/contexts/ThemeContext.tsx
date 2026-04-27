import { createContext, useContext, useState, useEffect } from "react";

type Theme = "persimmon" | "blueberry";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "persimmon", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("persimmon");

  useEffect(() => {
    document.body.className = theme === "blueberry" ? "theme-blueberry" : "";
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
