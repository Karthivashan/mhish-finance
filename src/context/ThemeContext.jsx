import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';

const ThemeContext = createContext(null);

/** Theme lives in the persisted preferences (single source of truth); this applies it to <html>. */
export function ThemeProvider({ children }) {
  const { preferences, setPrefs } = useApp();
  const theme = preferences.theme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B3D2E' : '#F7F4ED');
  }, [theme]);

  const setTheme = useCallback((t) => setPrefs({ theme: t }), [setPrefs]);
  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);
  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
