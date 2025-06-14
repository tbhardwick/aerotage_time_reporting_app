import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

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
  const isUpdatingFromUserPrefs = useRef(false);
  const hasInitialized = useRef(false);
  
  // Initialize theme with proper priority: localStorage > user preferences > system
  const [theme, setThemeState] = useState<Theme>(() => {
    // First check localStorage (user's last manual choice)
    const savedTheme = localStorage.getItem('aerotage-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      console.log(`🎨 Loading theme from localStorage: ${savedTheme}`);
      return savedTheme;
    }
    
    // Then check user preferences if available
    if (user?.preferences?.theme) {
      console.log(`🎨 Loading theme from user preferences: ${user.preferences.theme}`);
      return user.preferences.theme === 'light' ? 'light' : 'dark';
    }
    
    // Default to system
    console.log('🎨 Using default system theme');
    return 'system';
  });

  // Initialize from user preferences when user loads (only once)
  useEffect(() => {
    if (user?.preferences?.theme && !hasInitialized.current) {
      const savedTheme = localStorage.getItem('aerotage-theme');
      
      // If no localStorage theme, use user preferences
      if (!savedTheme) {
        const userTheme = user.preferences.theme === 'light' ? 'light' : 'dark';
        console.log(`🎨 Initializing theme from user preferences: ${userTheme}`);
        setThemeState(userTheme);
        localStorage.setItem('aerotage-theme', userTheme);
      }
      
      hasInitialized.current = true;
    }
  }, [user?.preferences?.theme]);

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
    // Don't update if we're currently updating from user preferences
    if (isUpdatingFromUserPrefs.current) {
      return;
    }
    
    console.log(`🎨 Theme changing from ${theme} to ${newTheme}`);
    setThemeState(newTheme);
    localStorage.setItem('aerotage-theme', newTheme);
    
    // Update user preferences via API when available
    updateUserPreferences(newTheme);
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark (no system option in toggle)
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Helper function to update user preferences
  const updateUserPreferences = async (newTheme: Theme) => {
    try {
      // Only update if we have a user and the theme is not 'system'
      if (user && newTheme !== 'system') {
        const { useUserPreferences } = await import('../hooks');
        // Note: This is a simplified approach. In a real implementation,
        // you'd want to call the API directly or use a context action
        console.log(`🔄 Would update user preferences to theme: ${newTheme}`);
        
        // TODO: Implement actual API call to update user preferences
        // This should be done through the preferences API or context action
      }
    } catch (error) {
      console.warn('⚠️ Failed to update user preferences:', error);
    }
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