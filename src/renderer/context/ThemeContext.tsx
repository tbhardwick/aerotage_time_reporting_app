import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface User {
  preferences?: {
    theme: 'light' | 'dark';
  };
}

interface ThemeProviderProps {
  children: ReactNode;
  user?: User | null;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children, user }: ThemeProviderProps) {
  // Initialize theme with proper priority: user preferences > localStorage > system
  const [theme, setThemeState] = useState<Theme>(() => {
    // First check user preferences if available
    if (user?.preferences?.theme) {
      console.log(`🎨 Loading theme from user preferences: ${user.preferences.theme}`);
      return user.preferences.theme === 'light' ? 'light' : 'dark';
    }
    
    // Then check localStorage
    const savedTheme = localStorage.getItem('aerotage-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      console.log(`🎨 Loading theme from localStorage: ${savedTheme}`);
      return savedTheme;
    }
    
    // Default to system
    console.log('🎨 Using default system theme');
    return 'system';
  });

  // Update theme when user preferences change
  useEffect(() => {
    if (user?.preferences?.theme) {
      const userTheme = user.preferences.theme === 'light' ? 'light' : 'dark';
      if (userTheme !== theme) {
        console.log(`🎨 User preferences changed, updating theme to: ${userTheme}`);
        setThemeState(userTheme);
        // Also update localStorage to keep them in sync
        localStorage.setItem('aerotage-theme', userTheme);
      }
    }
  }, [user?.preferences?.theme, theme]);

  // Calculate effective theme (resolve 'system' to actual theme)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        // Add a small delay to prevent rapid theme changes
        setTimeout(() => {
          setEffectiveTheme(e.matches ? 'dark' : 'light');
        }, 100);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Update effective theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(isDark ? 'dark' : 'light');
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(effectiveTheme);
    
    // Update CSS custom properties for immediate effect
    if (effectiveTheme === 'dark') {
      root.style.setProperty('--background-color', '#1e1e1e');
      root.style.setProperty('--surface-color', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a1a1a6');
      root.style.setProperty('--border-color', '#424242');
      root.style.setProperty('--shadow', '0 4px 16px rgba(0, 0, 0, 0.3)');
    } else {
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--surface-color', '#f5f5f7');
      root.style.setProperty('--text-primary', '#1d1d1f');
      root.style.setProperty('--text-secondary', '#86868b');
      root.style.setProperty('--border-color', '#d2d2d7');
      root.style.setProperty('--shadow', '0 4px 16px rgba(0, 0, 0, 0.1)');
    }

    console.log(`🎨 Theme applied: ${effectiveTheme} (from ${theme})`);
  }, [effectiveTheme, theme]);

  const setTheme = (newTheme: Theme) => {
    console.log(`🎨 Theme changing from ${theme} to ${newTheme}`);
    setThemeState(newTheme);
    localStorage.setItem('aerotage-theme', newTheme);
    
    // TODO: Update user preferences via API when available
    // This should call the backend API to update user.preferences.theme
    // For now, we only update localStorage and let the backend sync later
  };

  const toggleTheme = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 