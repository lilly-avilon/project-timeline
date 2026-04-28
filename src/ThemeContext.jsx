import { createContext, useContext, useState, useEffect } from 'react';
import { light, dark } from './theme';

const Ctx = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem('theme') === 'dark'
  );

  const toggle = () =>
    setIsDark(d => {
      localStorage.setItem('theme', d ? 'light' : 'dark');
      return !d;
    });

  // Keep body background in sync (prevents scroll-bounce flash)
  useEffect(() => {
    document.body.style.backgroundColor = isDark ? dark.bg : light.bg;
    document.body.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  return (
    <Ctx.Provider value={{ theme: isDark ? dark : light, isDark, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
