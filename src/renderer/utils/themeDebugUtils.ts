// Theme Debug Utilities
// These utilities help debug theme coordination issues

interface ThemeDebugInfo {
  contextTheme: string;
  effectiveTheme: string;
  localStorageTheme: string | null;
  userPreferencesTheme: string | null;
  documentClasses: string[];
  cssVariables: Record<string, string>;
}

export const getThemeDebugInfo = (): ThemeDebugInfo => {
  const root = document.documentElement;
  
  return {
    contextTheme: 'unknown', // This would need to be passed in
    effectiveTheme: root.classList.contains('dark') ? 'dark' : 'light',
    localStorageTheme: localStorage.getItem('aerotage-theme'),
    userPreferencesTheme: null, // This would need to be passed in
    documentClasses: Array.from(root.classList),
    cssVariables: {
      '--background-color': root.style.getPropertyValue('--background-color'),
      '--surface-color': root.style.getPropertyValue('--surface-color'),
      '--text-primary': root.style.getPropertyValue('--text-primary'),
      '--text-secondary': root.style.getPropertyValue('--text-secondary'),
      '--border-color': root.style.getPropertyValue('--border-color'),
    }
  };
};

export const logThemeDebugInfo = (context?: string) => {
  const info = getThemeDebugInfo();
  console.group(`🎨 Theme Debug Info${context ? ` - ${context}` : ''}`);
  console.log('Context Theme:', info.contextTheme);
  console.log('Effective Theme:', info.effectiveTheme);
  console.log('localStorage Theme:', info.localStorageTheme);
  console.log('User Preferences Theme:', info.userPreferencesTheme);
  console.log('Document Classes:', info.documentClasses);
  console.log('CSS Variables:', info.cssVariables);
  console.groupEnd();
};

export const testThemeCoordination = () => {
  console.group('🧪 Theme Coordination Test');
  
  // Test 1: Check initial state
  logThemeDebugInfo('Initial State');
  
  // Test 2: Check localStorage consistency
  const savedTheme = localStorage.getItem('aerotage-theme');
  const documentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  
  console.log('✅ Tests:');
  console.log(`localStorage theme: ${savedTheme}`);
  console.log(`Document theme: ${documentTheme}`);
  
  if (savedTheme && (savedTheme === documentTheme || savedTheme === 'system')) {
    console.log('✅ localStorage and document theme are consistent');
  } else {
    console.warn('⚠️ localStorage and document theme are inconsistent');
  }
  
  console.groupEnd();
};

// Add to window for easy access in dev tools
if (typeof window !== 'undefined') {
  (window as any).themeDebug = {
    getInfo: getThemeDebugInfo,
    log: logThemeDebugInfo,
    test: testThemeCoordination
  };
  
  console.log('🎨 Theme debug utilities available at window.themeDebug');
} 