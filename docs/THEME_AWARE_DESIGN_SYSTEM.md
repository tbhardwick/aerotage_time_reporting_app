# Theme-Aware Design System Documentation

## 🎨 **Overview**

The Aerotage Time Reporting App uses a comprehensive **hybrid styling approach** that combines:
- **Tailwind CSS** for layout, spacing, and responsive design
- **CSS Variables** for theme-aware colors that automatically switch between light and dark modes
- **Predefined component classes** for consistent styling patterns

This approach ensures all components respect the user's theme preference while maintaining design consistency and developer productivity.

---

## 🌓 **Theme System Architecture**

### **Automatic Theme Switching**
The app supports three theme modes:
1. **Light Mode** (default)
2. **Dark Mode** (explicit `.dark` class)
3. **System Preference** (follows OS setting via `prefers-color-scheme`)

### **CSS Variable Structure**
All theme variables are defined in `public/styles/main.css` with automatic light/dark switching:

```css
/* Light mode (default) */
:root {
  --text-primary: #1d1d1f;
  --surface-color: #f5f5f7;
  /* ... */
}

/* Dark mode */
.dark {
  --text-primary: #ffffff;
  --surface-color: #2d2d2d;
  /* ... */
}
```

---

## 🎯 **Core Design Tokens**

### **Typography Colors**
```css
var(--text-primary)     /* Main text: #1d1d1f (light) / #ffffff (dark) */
var(--text-secondary)   /* Secondary text: #86868b (light) / #a1a1a6 (dark) */
var(--text-tertiary)    /* Tertiary text: #999999 (light) / #8e8e93 (dark) */
```

### **Surface Colors**
```css
var(--background-color)    /* Page background: #ffffff (light) / #1e1e1e (dark) */
var(--surface-color)       /* Card/panel background: #f5f5f7 (light) / #2d2d2d (dark) */
var(--surface-secondary)   /* Secondary surfaces: #f0f0f0 (light) / #3a3a3a (dark) */
```

### **Border & Structure**
```css
var(--border-color)     /* Borders: #d2d2d7 (light) / #424242 (dark) */
var(--shadow)           /* Shadows: rgba(0,0,0,0.1) (light) / rgba(0,0,0,0.3) (dark) */
```

### **Semantic Colors**
```css
/* Primary Brand Colors */
var(--color-primary-600)    /* Main brand color */
var(--color-primary-hover)  /* Hover state */
var(--color-text-on-primary) /* Text on primary backgrounds */

/* Status Colors */
var(--color-success-600)    /* Success states */
var(--color-warning-600)    /* Warning states */
var(--color-error-600)      /* Error states */

/* Status Text Colors */
var(--color-text-on-success)
var(--color-text-on-error)
```

---

## 🏗️ **Component Patterns**

### **✅ CORRECT: Theme-Aware Component Pattern**

```typescript
// Hybrid approach: Tailwind for layout + CSS variables for colors
<div 
  className="p-6 rounded-xl shadow-soft grid grid-cols-1 md:grid-cols-2 gap-4"
  style={{
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)'
  }}
>
  <h3 
    className="text-lg font-semibold mb-4"
    style={{ color: 'var(--text-primary)' }}
  >
    Theme-aware title
  </h3>
  <p 
    className="text-sm"
    style={{ color: 'var(--text-secondary)' }}
  >
    Content that adapts to light/dark mode
  </p>
</div>
```

### **✅ CORRECT: Theme-Aware Button Patterns**

```typescript
// Primary Button
<button 
  className="px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
  style={{
    backgroundColor: 'var(--color-primary-600)',
    color: 'var(--color-text-on-primary)',
    focusRingColor: 'var(--color-primary-600)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
  }}
>
  Save Changes
</button>

// Success Button
<button 
  className="px-4 py-2 rounded-lg font-medium transition-colors"
  style={{
    backgroundColor: 'var(--color-success-600)',
    color: 'var(--color-text-on-success)'
  }}
>
  Approve
</button>

// Danger Button
<button 
  className="px-4 py-2 rounded-lg font-medium transition-colors"
  style={{
    backgroundColor: 'var(--color-error-600)',
    color: 'var(--color-text-on-error)'
  }}
>
  Delete
</button>
```

### **✅ CORRECT: Form Input Patterns**

```typescript
<input
  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-2 transition-colors"
  style={{
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
    focusRingColor: 'var(--color-primary-600)',
    focusBorderColor: 'var(--color-primary-600)'
  }}
  placeholder="Enter text..."
/>
```

### **✅ CORRECT: Card/Panel Patterns**

```typescript
<div 
  className="rounded-xl p-6 border"
  style={{
    backgroundColor: 'var(--surface-color)',
    borderColor: 'var(--border-color)',
    boxShadow: 'var(--shadow)'
  }}
>
  <div 
    className="border-b pb-4 mb-4"
    style={{ borderColor: 'var(--border-color)' }}
  >
    <h3 style={{ color: 'var(--text-primary)' }}>Card Title</h3>
  </div>
  <p style={{ color: 'var(--text-secondary)' }}>Card content</p>
</div>
```

---

## ❌ **Anti-Patterns to Avoid**

### **❌ WRONG: Hardcoded Tailwind Colors**
```typescript
// These ignore the theme system
<div className="bg-white text-gray-900">Theme-blind content</div>
<button className="bg-blue-600 text-white">Theme-blind button</button>
<div className="border-gray-200">Theme-blind border</div>
```

### **❌ WRONG: Hardcoded Hex Values**
```typescript
// These don't adapt to theme changes
<div style={{ color: '#1d1d1f', backgroundColor: '#ffffff' }}>
  Hardcoded colors
</div>
```

### **❌ WRONG: Invalid Tailwind Syntax with CSS Variables**
```typescript
// This syntax doesn't work
<div className="text-[var(--color-primary-600)]">Invalid syntax</div>
<div className="bg-[var(--surface-color)]">Invalid syntax</div>
```

### **❌ WRONG: Mixing Approaches Inconsistently**
```typescript
// Don't mix hardcoded colors with theme variables
<div 
  className="bg-white"  // Hardcoded
  style={{ color: 'var(--text-primary)' }}  // Theme-aware
>
  Inconsistent approach
</div>
```

---

## 📱 **Responsive Design with Theme Awareness**

### **✅ CORRECT: Responsive + Theme-Aware**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <div 
    className="p-4 md:p-6 rounded-lg md:rounded-xl"
    style={{ 
      backgroundColor: 'var(--surface-color)',
      borderColor: 'var(--border-color)'
    }}
  >
    <h3 
      className="text-base md:text-lg font-semibold"
      style={{ color: 'var(--text-primary)' }}
    >
      Responsive + Theme-aware
    </h3>
  </div>
</div>
```

---

## 🎨 **Status and State Patterns**

### **Loading States**
```typescript
<div 
  className="flex items-center justify-center p-8"
  style={{ backgroundColor: 'var(--surface-color)' }}
>
  <div 
    className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
    style={{ borderColor: 'var(--color-primary-600)' }}
  />
  <span 
    className="ml-3 text-sm"
    style={{ color: 'var(--text-secondary)' }}
  >
    Loading...
  </span>
</div>
```

### **Empty States**
```typescript
<div 
  className="text-center p-12"
  style={{ backgroundColor: 'var(--surface-color)' }}
>
  <p 
    className="text-lg font-medium mb-2"
    style={{ color: 'var(--text-primary)' }}
  >
    No items found
  </p>
  <p 
    className="text-sm"
    style={{ color: 'var(--text-secondary)' }}
  >
    Try adjusting your search criteria
  </p>
</div>
```

### **Error States**
```typescript
<div 
  className="p-4 rounded-lg border"
  style={{
    backgroundColor: 'var(--color-error-50)',
    borderColor: 'var(--color-error-200)',
    color: 'var(--color-error-800)'
  }}
>
  <p className="font-medium">Error occurred</p>
  <p className="text-sm mt-1">Please try again later</p>
</div>
```

---

## 🔧 **Implementation Guidelines**

### **When to Use Each Approach**

#### **Use Tailwind Classes For:**
- Layout (`flex`, `grid`, `space-y-4`)
- Spacing (`p-4`, `m-6`, `gap-4`)
- Sizing (`w-full`, `h-64`, `max-w-lg`)
- Responsive breakpoints (`md:grid-cols-2`, `lg:text-lg`)
- Typography sizing (`text-lg`, `font-semibold`)
- Borders and radius (`rounded-xl`, `border`)
- Animations (`transition-colors`, `animate-spin`)

#### **Use CSS Variables For:**
- All colors (text, background, border)
- Theme-dependent values
- Brand colors and semantic colors
- Any value that should change between light/dark modes

#### **Use Inline Styles For:**
- CSS variables (required for theme switching)
- Dynamic values (calculated widths, etc.)
- Hover/focus states with theme colors

### **Migration Checklist for Components**

1. **✅ Keep** Tailwind classes for layout and spacing
2. **🔄 Convert** hardcoded color classes to CSS variables
3. **🔄 Convert** hardcoded hex values to CSS variables
4. **✅ Keep** responsive Tailwind classes
5. **🔄 Add** theme-aware hover/focus states
6. **✅ Test** in both light and dark modes

---

## 🧪 **Testing Theme Awareness**

### **Manual Testing Checklist**
- [ ] Component renders correctly in light mode
- [ ] Component renders correctly in dark mode
- [ ] All text is readable in both modes
- [ ] All interactive elements have proper contrast
- [ ] Hover/focus states work in both modes
- [ ] No hardcoded colors remain

### **Automated Testing**
```typescript
// Example test for theme awareness
describe('Component Theme Awareness', () => {
  it('should use theme variables for colors', () => {
    render(<Component />);
    const element = screen.getByTestId('component');
    
    // Check that CSS variables are used
    expect(element).toHaveStyle({
      color: 'var(--text-primary)',
      backgroundColor: 'var(--surface-color)'
    });
  });
});
```

---

## 📚 **Quick Reference**

### **Most Common CSS Variables**
```css
/* Text Colors */
var(--text-primary)      /* Main text */
var(--text-secondary)    /* Secondary text */

/* Backgrounds */
var(--background-color)  /* Page background */
var(--surface-color)     /* Card/panel background */

/* Interactive */
var(--color-primary-600) /* Primary buttons */
var(--color-success-600) /* Success states */
var(--color-error-600)   /* Error states */

/* Structure */
var(--border-color)      /* Borders */
```

### **Most Common Tailwind Classes**
```css
/* Layout */
.flex .grid .space-y-4 .gap-4

/* Spacing */
.p-4 .p-6 .m-4 .mx-auto

/* Responsive */
.md:grid-cols-2 .lg:text-lg .sm:p-4

/* Typography */
.text-lg .font-semibold .font-medium

/* Structure */
.rounded-xl .border .shadow-soft
```

---

## 🔗 **Related Documentation**

- [Styling Consistency Implementation Plan](./STYLING_CONSISTENCY_IMPLEMENTATION.md)
- [Component Migration Guide](./implementation-guides/COMPONENT_MIGRATION_GUIDE.md)
- [Theme System Technical Reference](./api-integration/THEME_SYSTEM_TECHNICAL_REFERENCE.md)

---

**Last Updated**: December 2024  
**Next Review**: Weekly during implementation phase 