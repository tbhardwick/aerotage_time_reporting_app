# Theme System Technical Reference

## 🎯 **Overview**

This document provides a comprehensive technical reference for the Aerotage Time Reporting App's theme system, including all available CSS variables, their values in light/dark modes, and proper usage patterns.

---

## 🌓 **Theme Architecture**

### **Theme Switching Mechanism**
The app uses a class-based theme switching system:

```css
/* Light mode (default) */
:root { /* variables */ }

/* Dark mode (explicit class) */
.dark { /* overridden variables */ }

/* System preference fallback */
@media (prefers-color-scheme: dark) {
  :root:not(.light) { /* overridden variables */ }
}
```

### **Theme Application**
Themes are applied by adding/removing the `.dark` class to the document root:

```typescript
// Switch to dark mode
document.documentElement.classList.add('dark');

// Switch to light mode
document.documentElement.classList.remove('dark');

// Toggle theme
document.documentElement.classList.toggle('dark');
```

---

## 🎨 **Complete CSS Variables Reference**

### **Typography Colors**

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--text-primary` | `#1d1d1f` | `#ffffff` | Main text, headings |
| `--text-secondary` | `#86868b` | `#a1a1a6` | Secondary text, descriptions |
| `--text-tertiary` | `#999999` | `#8e8e93` | Placeholder text, disabled text |

```css
/* Usage Examples */
.title { color: var(--text-primary); }
.description { color: var(--text-secondary); }
.placeholder { color: var(--text-tertiary); }
```

### **Surface Colors**

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--background-color` | `#ffffff` | `#1e1e1e` | Page background |
| `--surface-color` | `#f5f5f7` | `#2d2d2d` | Cards, panels, modals |
| `--surface-secondary` | `#f0f0f0` | `#3a3a3a` | Secondary surfaces, hover states |

```css
/* Usage Examples */
body { background-color: var(--background-color); }
.card { background-color: var(--surface-color); }
.hover-state { background-color: var(--surface-secondary); }
```

### **Border & Structure**

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--border-color` | `#d2d2d7` | `#424242` | Borders, dividers |
| `--shadow` | `0 4px 16px rgba(0,0,0,0.1)` | `0 4px 16px rgba(0,0,0,0.3)` | Box shadows |
| `--radius` | `8px` | `8px` | Border radius |

```css
/* Usage Examples */
.bordered { border: 1px solid var(--border-color); }
.elevated { box-shadow: var(--shadow); }
.rounded { border-radius: var(--radius); }
```

### **Primary Brand Colors**

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--primary-color` | `#007AFF` | `#007AFF` | Brand primary |
| `--color-primary-600` | `#2563eb` | `#60a5fa` | Primary buttons, links |
| `--color-primary-hover` | `#0056b3` | `#4a90e2` | Primary hover states |
| `--color-text-on-primary` | `#ffffff` | `#ffffff` | Text on primary backgrounds |

```css
/* Usage Examples */
.btn-primary { 
  background-color: var(--color-primary-600);
  color: var(--color-text-on-primary);
}
.btn-primary:hover { 
  background-color: var(--color-primary-hover);
}
```

### **Semantic Status Colors**

#### **Success Colors**
| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--color-success-50` | `#f0fdf4` | `#166534` | Success backgrounds |
| `--color-success-200` | `#bbf7d0` | `#16a34a` | Success borders |
| `--color-success-600` | `#28a745` | `#16a34a` | Success buttons, icons |
| `--color-success-800` | `#166534` | `#4ade80` | Success text |
| `--color-success-hover` | `#218838` | `#22c55e` | Success hover states |
| `--color-text-on-success` | `#ffffff` | `#ffffff` | Text on success backgrounds |

#### **Warning Colors**
| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--color-warning-50` | `#fffbeb` | `#78350f` | Warning backgrounds |
| `--color-warning-200` | `#fde68a` | `#b45309` | Warning borders |
| `--color-warning-600` | `#d97706` | `#f59e0b` | Warning buttons, icons |
| `--color-warning-800` | `#92400e` | `#fcd34d` | Warning text |

#### **Error Colors**
| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `--color-error-50` | `#fef2f2` | `#991b1b` | Error backgrounds |
| `--color-error-200` | `#fecaca` | `#dc2626` | Error borders |
| `--color-error-600` | `#dc2626` | `#f87171` | Error buttons, icons |
| `--color-error-800` | `#991b1b` | `#fca5a5` | Error text |
| `--color-error-hover` | `#c82333` | `#ef4444` | Error hover states |
| `--color-text-on-error` | `#ffffff` | `#ffffff` | Text on error backgrounds |

### **Component-Specific Variables**

| Variable | Value | Usage |
|----------|-------|-------|
| `--title-bar-height` | `52px` | Electron title bar height |
| `--secondary-color` | `#5856D6` | Secondary brand color |

---

## 🏗️ **Implementation Patterns**

### **Basic Component Pattern**
```typescript
<div 
  className="p-6 rounded-xl border"
  style={{
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)'
  }}
>
  Content
</div>
```

### **Interactive Button Pattern**
```typescript
<button 
  className="px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  style={{
    backgroundColor: 'var(--color-primary-600)',
    color: 'var(--color-text-on-primary)',
    '--tw-ring-color': 'var(--color-primary-600)'
  } as React.CSSProperties}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
  }}
>
  Button Text
</button>
```

### **Status Badge Pattern**
```typescript
// Success badge
<span 
  className="px-3 py-1 rounded-full text-sm font-medium border"
  style={{
    backgroundColor: 'var(--color-success-50)',
    color: 'var(--color-success-800)',
    borderColor: 'var(--color-success-200)'
  }}
>
  Success
</span>

// Error badge
<span 
  className="px-3 py-1 rounded-full text-sm font-medium border"
  style={{
    backgroundColor: 'var(--color-error-50)',
    color: 'var(--color-error-800)',
    borderColor: 'var(--color-error-200)'
  }}
>
  Error
</span>
```

### **Form Input Pattern**
```typescript
<input
  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-colors"
  style={{
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
    '--tw-ring-color': 'var(--color-primary-600)'
  } as React.CSSProperties}
  placeholder="Enter text..."
/>
```

---

## 🔧 **Advanced Usage**

### **Dynamic Theme Variables**
```typescript
// Get computed CSS variable value
const getThemeVariable = (variable: string): string => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};

// Example usage
const primaryColor = getThemeVariable('--color-primary-600');
```

### **Conditional Styling Based on Theme**
```typescript
const isDarkMode = document.documentElement.classList.contains('dark');

const conditionalStyles = {
  backgroundColor: isDarkMode 
    ? 'var(--surface-color)' 
    : 'var(--background-color)',
  // ... other conditional styles
};
```

### **CSS-in-JS with Theme Variables**
```typescript
const styles = {
  container: {
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
    padding: '1.5rem',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)'
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: '1.25rem',
    fontWeight: '600'
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  }
};
```

---

## 🧪 **Testing Theme Variables**

### **Unit Test Helpers**
```typescript
// Test helper to check if element uses theme variables
export const expectThemeAware = (element: HTMLElement) => {
  const computedStyle = window.getComputedStyle(element);
  
  // Check if background color uses CSS variable
  expect(element.style.backgroundColor).toMatch(/var\(--/);
  
  // Check if color uses CSS variable
  expect(element.style.color).toMatch(/var\(--/);
};

// Test helper to switch themes
export const switchTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
```

### **Visual Regression Testing**
```typescript
describe('Theme System', () => {
  it('should render correctly in light mode', () => {
    switchTheme('light');
    render(<Component />);
    // Visual assertions
  });

  it('should render correctly in dark mode', () => {
    switchTheme('dark');
    render(<Component />);
    // Visual assertions
  });

  it('should use theme variables', () => {
    render(<Component />);
    const element = screen.getByTestId('component');
    expectThemeAware(element);
  });
});
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: CSS Variable Not Updating**
```typescript
// ❌ Wrong - hardcoded value
element.style.backgroundColor = '#ffffff';

// ✅ Correct - theme variable
element.style.backgroundColor = 'var(--surface-color)';
```

### **Issue: Invalid Tailwind Syntax**
```typescript
// ❌ Wrong - invalid syntax
<div className="text-[var(--text-primary)]" />

// ✅ Correct - inline style with CSS variable
<div style={{ color: 'var(--text-primary)' }} />
```

### **Issue: Missing Hover States**
```typescript
// ❌ Wrong - no hover state
<button style={{ backgroundColor: 'var(--color-primary-600)' }}>
  Button
</button>

// ✅ Correct - with hover handlers
<button 
  style={{ backgroundColor: 'var(--color-primary-600)' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
  }}
>
  Button
</button>
```

### **Issue: TypeScript Errors with Custom Properties**
```typescript
// ❌ Wrong - TypeScript error
style={{ '--tw-ring-color': 'var(--color-primary-600)' }}

// ✅ Correct - with type assertion
style={{ '--tw-ring-color': 'var(--color-primary-600)' } as React.CSSProperties}
```

---

## 📚 **Related Documentation**

- [Theme-Aware Design System](../THEME_AWARE_DESIGN_SYSTEM.md)
- [Component Migration Guide](../implementation-guides/COMPONENT_MIGRATION_GUIDE.md)
- [Styling Consistency Implementation Plan](../STYLING_CONSISTENCY_IMPLEMENTATION.md)

---

**Last Updated**: December 2024  
**Next Review**: Monthly or when new theme variables are added 