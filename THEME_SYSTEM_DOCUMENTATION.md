# Theme System Documentation

## Overview
The Aerotage Time Reporting Application now includes a comprehensive theme system that supports light mode, dark mode, and system preference detection.

## Features

### 🎨 **Theme Options**
- **Light Mode**: Clean, bright interface optimized for daylight use
- **Dark Mode**: Dark interface that reduces eye strain in low-light conditions  
- **System Mode**: Automatically follows the user's operating system theme preference

### 🔄 **Theme Switching**
- **User Dropdown**: Quick theme toggle button in the user dropdown menu
- **Settings Page**: Full theme selection in Preferences → Appearance
- **Immediate Application**: Theme changes apply instantly without page refresh
- **Persistence**: Theme preference is saved and restored across app sessions

## Implementation Details

### **Frontend Architecture**

#### **ThemeContext** (`src/renderer/context/ThemeContext.tsx`)
- Centralized theme state management using React Context
- Automatic system theme detection via `prefers-color-scheme` media query
- Theme persistence in localStorage
- Integration with user preferences from backend API

#### **CSS Variables** (`public/styles/main.css`)
- CSS custom properties for consistent theming
- Class-based theme switching (`.light`, `.dark`)
- Fallback to system preference when no explicit theme is set
- Smooth transitions between theme changes

#### **Theme Integration**
- **App.tsx**: ThemeProvider wraps the entire application
- **UserDropdown**: Quick theme toggle with visual indicators
- **PreferencesSettings**: Full theme configuration interface

### **User Experience**

#### **Theme Toggle Button** (User Dropdown)
- Cycles through: Light → Dark → System → Light
- Shows current theme with appropriate icons:
  - ☀️ Light Mode (Sun icon)
  - 🌙 Dark Mode (Moon icon)  
  - 💻 System Mode (Computer icon)
- Displays effective theme in parentheses

#### **Preferences Interface**
- Dropdown selection with three options
- Immediate preview of theme changes
- Integration with user profile preferences
- Saves to backend API for cross-device sync

### **Technical Implementation**

#### **Theme State Management**
```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;                    // User's selected theme
  effectiveTheme: 'light' | 'dark'; // Resolved theme (system → actual)
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

#### **CSS Custom Properties**
```css
:root {
  --background-color: #ffffff;
  --surface-color: #f5f5f7;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --border-color: #d2d2d7;
  --shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dark {
  --background-color: #1e1e1e;
  --surface-color: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #a1a1a6;
  --border-color: #424242;
  --shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

#### **System Theme Detection**
```typescript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  if (theme === 'system') {
    setEffectiveTheme(e.matches ? 'dark' : 'light');
  }
});
```

### **Backend Integration**

#### **API Compatibility**
- Backend API supports only `'light' | 'dark'` themes
- Frontend maps `'system'` to effective theme when saving preferences
- User preferences sync across devices for explicit light/dark choices
- System preference is device-specific and not synced

#### **Preference Storage**
- **localStorage**: `aerotage-theme` - immediate theme preference
- **User Preferences API**: Synced theme preference for cross-device consistency
- **Fallback Chain**: User API → localStorage → System → Light (default)

## Usage Guide

### **For Users**

#### **Quick Theme Toggle**
1. Click your profile picture/name in the top navigation
2. Click the theme button (shows current theme with icon)
3. Theme cycles: Light → Dark → System → Light

#### **Detailed Theme Settings**
1. Click your profile picture/name → Settings
2. Go to Preferences tab
3. Under "Appearance" section, select desired theme
4. Changes apply immediately and save automatically

#### **System Theme Mode**
- Automatically follows your operating system's theme setting
- Updates in real-time when you change your OS theme
- Perfect for users who switch between light/dark based on time of day

### **For Developers**

#### **Using Theme in Components**
```typescript
import { useTheme } from '../../context/ThemeContext';

const MyComponent = () => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  
  return (
    <div className={`my-component ${effectiveTheme}`}>
      Current theme: {theme} (effective: {effectiveTheme})
    </div>
  );
};
```

#### **CSS Styling with Theme Variables**
```css
.my-component {
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}
```

#### **Adding New Theme-Aware Components**
1. Use CSS custom properties for colors
2. Import and use `useTheme()` hook if needed
3. Test in both light and dark modes
4. Ensure proper contrast ratios for accessibility

## Browser Support

### **CSS Custom Properties**
- ✅ Chrome 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ Edge 16+

### **prefers-color-scheme Media Query**
- ✅ Chrome 76+
- ✅ Firefox 67+
- ✅ Safari 12.1+
- ✅ Edge 79+

## Accessibility

### **Color Contrast**
- Light mode: Meets WCAG AA standards (4.5:1 ratio)
- Dark mode: Optimized contrast for readability
- System mode: Inherits OS accessibility settings

### **User Preferences**
- Respects `prefers-color-scheme` system setting
- Allows manual override for user control
- Maintains preference across sessions

## Future Enhancements

### **Potential Additions**
- **High Contrast Mode**: Enhanced accessibility option
- **Custom Themes**: User-defined color schemes
- **Scheduled Themes**: Automatic switching based on time
- **Theme Animations**: Smooth transitions between theme changes

### **Integration Opportunities**
- **Electron Menu**: Native menu theme toggle
- **System Tray**: Theme indicator in system tray
- **Keyboard Shortcuts**: Quick theme switching hotkeys

## Troubleshooting

### **Common Issues**

#### **Theme Not Applying**
- Check if ThemeProvider wraps the component
- Verify CSS custom properties are being used
- Ensure theme context is available

#### **System Theme Not Detecting**
- Verify browser supports `prefers-color-scheme`
- Check if OS has theme preference set
- Test with manual OS theme changes

#### **Preferences Not Saving**
- Check network connectivity for API calls
- Verify user authentication status
- Review browser console for API errors

### **Debug Tools**
```typescript
// Check current theme state
console.log('Theme state:', useTheme());

// Test theme switching
const { setTheme } = useTheme();
setTheme('dark'); // or 'light', 'system'

// Check CSS variables
console.log(getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
```

## Performance Considerations

### **Optimizations**
- CSS custom properties provide efficient theme switching
- Theme state is managed at context level (minimal re-renders)
- localStorage caching reduces API calls
- System theme detection uses native browser APIs

### **Best Practices**
- Use CSS custom properties instead of conditional styling
- Minimize theme-dependent JavaScript logic
- Test theme switching performance with large component trees
- Consider theme-aware image assets for optimal appearance

---

**Implementation Status**: ✅ Complete  
**Last Updated**: Current  
**Compatibility**: Electron + React + TypeScript  
**Dependencies**: React Context, CSS Custom Properties, Web APIs 