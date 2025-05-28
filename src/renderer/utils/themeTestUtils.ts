// Theme Testing Utilities
// This file provides utilities to test and debug theme switching functionality

export const themeTestUtils = {
  // Test theme switching programmatically
  testThemeSwitch: () => {
    console.log('🧪 Testing theme switching...');
    
    // Get current theme from localStorage
    const currentTheme = localStorage.getItem('aerotage-theme') || 'system';
    console.log(`Current theme: ${currentTheme}`);
    
    // Get computed CSS variables
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const currentColors = {
      background: computedStyle.getPropertyValue('--background-color').trim(),
      surface: computedStyle.getPropertyValue('--surface-color').trim(),
      textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
      textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
      border: computedStyle.getPropertyValue('--border-color').trim(),
    };
    
    console.log('Current CSS variables:', currentColors);
    
    // Check if theme classes are applied
    const hasLightClass = root.classList.contains('light');
    const hasDarkClass = root.classList.contains('dark');
    
    console.log(`Theme classes - Light: ${hasLightClass}, Dark: ${hasDarkClass}`);
    
    return {
      theme: currentTheme,
      colors: currentColors,
      classes: { light: hasLightClass, dark: hasDarkClass }
    };
  },

  // Cycle through themes for testing
  cycleThemes: () => {
    console.log('🔄 Cycling through themes...');
    
    const themes = ['light', 'dark', 'system'];
    let currentIndex = 0;
    
    const cycle = () => {
      const theme = themes[currentIndex];
      localStorage.setItem('aerotage-theme', theme);
      
      // Trigger a custom event to notify theme change
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
      
      console.log(`Switched to: ${theme}`);
      
      currentIndex = (currentIndex + 1) % themes.length;
      
      if (currentIndex === 0) {
        console.log('✅ Theme cycle complete');
        return;
      }
      
      // Continue cycling after 2 seconds
      setTimeout(cycle, 2000);
    };
    
    cycle();
  },

  // Test system theme detection
  testSystemTheme: () => {
    console.log('🖥️ Testing system theme detection...');
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemPrefersDark = mediaQuery.matches;
    
    console.log(`System prefers dark mode: ${systemPrefersDark}`);
    
    // Test media query listener
    const testListener = (e: MediaQueryListEvent) => {
      console.log(`System theme changed to: ${e.matches ? 'dark' : 'light'}`);
    };
    
    mediaQuery.addEventListener('change', testListener);
    
    // Remove listener after 10 seconds
    setTimeout(() => {
      mediaQuery.removeEventListener('change', testListener);
      console.log('System theme listener removed');
    }, 10000);
    
    return systemPrefersDark;
  },

  // Validate theme consistency
  validateThemeConsistency: () => {
    console.log('✅ Validating theme consistency...');
    
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Check if CSS variables are properly set
    const requiredVariables = [
      '--background-color',
      '--surface-color', 
      '--text-primary',
      '--text-secondary',
      '--border-color',
      '--shadow'
    ];
    
    const missingVariables = requiredVariables.filter(variable => {
      const value = computedStyle.getPropertyValue(variable).trim();
      return !value || value === '';
    });
    
    if (missingVariables.length > 0) {
      console.error('❌ Missing CSS variables:', missingVariables);
      return false;
    }
    
    // Check theme class consistency
    const hasLightClass = root.classList.contains('light');
    const hasDarkClass = root.classList.contains('dark');
    
    if (hasLightClass && hasDarkClass) {
      console.error('❌ Both light and dark classes are applied');
      return false;
    }
    
    if (!hasLightClass && !hasDarkClass) {
      console.warn('⚠️ No theme class applied, relying on CSS defaults');
    }
    
    console.log('✅ Theme consistency validation passed');
    return true;
  },

  // Debug theme switching issues
  debugThemeSwitching: () => {
    console.log('🐛 Debugging theme switching...');
    
    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      if (key === 'aerotage-theme') {
        console.log(`📝 localStorage theme updated: ${value}`);
      }
      originalSetItem.call(this, key, value);
    };
    
    // Monitor CSS class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            console.log(`🎨 Root class changed: ${target.className}`);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Stop debugging after 30 seconds
    setTimeout(() => {
      observer.disconnect();
      localStorage.setItem = originalSetItem;
      console.log('🐛 Theme debugging stopped');
    }, 30000);
    
    console.log('🐛 Theme debugging active for 30 seconds...');
  },

  // Test user preference integration
  testUserPreferences: () => {
    console.log('👤 Testing user preference integration...');
    
    // Check if user data is available in the app context
    try {
      // Try to access the app context (this might not work in all contexts)
      const appElement = document.querySelector('[data-testid="app-context"]');
      if (appElement) {
        console.log('✅ App context element found');
      } else {
        console.log('⚠️ App context element not found - using alternative method');
      }
      
      // Check localStorage for any user data
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.includes('user') || key.includes('profile') || key.includes('preferences'));
      
      if (userKeys.length > 0) {
        console.log('📋 Found user-related localStorage keys:', userKeys);
        userKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (parsed.preferences?.theme) {
                console.log(`🎨 Found theme preference in ${key}:`, parsed.preferences.theme);
              }
            }
          } catch (e) {
            console.log(`📝 ${key}: ${localStorage.getItem(key)}`);
          }
        });
      } else {
        console.log('⚠️ No user-related data found in localStorage');
      }
      
      // Check current theme source
      const currentTheme = localStorage.getItem('aerotage-theme');
      console.log(`🎨 Current theme in localStorage: ${currentTheme}`);
      
      return {
        hasUserData: userKeys.length > 0,
        currentTheme,
        userKeys
      };
      
    } catch (error) {
      console.error('❌ Error testing user preferences:', error);
      return { hasUserData: false, currentTheme: null, userKeys: [] };
    }
  },

  // Simulate user preference changes for testing
  simulateUserPreferenceChange: (theme: 'light' | 'dark') => {
    console.log(`🧪 Simulating user preference change to: ${theme}`);
    
    // Dispatch a custom event that the ThemeProvider might listen to
    window.dispatchEvent(new CustomEvent('user-preference-change', {
      detail: { theme }
    }));
    
    // Also update localStorage to simulate the change
    localStorage.setItem('aerotage-theme', theme);
    
    console.log(`✅ Simulated user preference change to ${theme}`);
  }
};

// Make utilities available globally for testing
if (typeof window !== 'undefined') {
  (window as any).themeTestUtils = themeTestUtils;
  console.log('🧪 Theme test utilities loaded. Use window.themeTestUtils in console.');
} 