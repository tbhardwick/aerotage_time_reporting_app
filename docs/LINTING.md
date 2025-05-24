# ESLint Configuration Guide

## Overview

The Aerotage Time Reporting Application uses ESLint for code quality and consistency across the React/TypeScript/Electron codebase.

## Configuration

### ESLint Setup
- **Parser**: `@typescript-eslint/parser` for TypeScript support
- **Extends**: 
  - `eslint:recommended` - Basic ESLint rules
  - `plugin:@typescript-eslint/recommended` - TypeScript specific rules
  - `plugin:react/recommended` - React best practices
  - `plugin:react-hooks/recommended` - React Hooks rules

### File Structure Rules
Different rules apply to different parts of the application:
- **Main Process** (`src/main/**`): Node.js environment, console allowed
- **Preload Scripts** (`src/preload/**`): Mixed Node.js/Browser environment
- **Renderer Process** (`src/renderer/**`): Browser environment, console warnings
- **Test Files** (`**/*.test.*`, `tests/**`): Jest environment, relaxed rules
- **Config Files** (`*.config.js`, `.eslintrc.js`): Node.js environment

## Available Commands

### Basic Linting
```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Strict check with zero warnings allowed
npm run lint:check

# Generate HTML report
npm run lint:report

# For staged files (useful with git hooks)
npm run lint:staged
```

## Key Rules

### TypeScript Rules
- ✅ **Prefer const over let**: `prefer-const: error`
- ✅ **No var declarations**: `no-var: error` 
- ⚠️ **Avoid any type**: `@typescript-eslint/no-explicit-any: warn`
- ⚠️ **Non-null assertions**: `@typescript-eslint/no-non-null-assertion: warn`

### React Rules
- ✅ **JSX key props**: `react/jsx-key: error`
- ✅ **No duplicate props**: `react/jsx-no-duplicate-props: error`
- ✅ **Hook rules**: `react-hooks/rules-of-hooks: error`
- ⚠️ **Hook dependencies**: `react-hooks/exhaustive-deps: warn`
- ✅ **Self-closing components**: `react/self-closing-comp: warn`

### Code Quality Rules
- ✅ **Strict equality**: `eqeqeq: error`
- ✅ **No duplicate imports**: `no-duplicate-imports: error`
- ✅ **Semicolons required**: `semi: error`
- ⚠️ **Single quotes**: `quotes: warn`
- ⚠️ **Trailing commas**: `comma-dangle: warn`
- ⚠️ **2-space indentation**: `indent: warn`

### Environment-Specific Rules
- **Main Process**: Console statements allowed
- **Renderer**: Console statements generate warnings
- **Tests**: Relaxed rules, console allowed, any types allowed

## Common Issues and Solutions

### Console Statements
**Issue**: `Unexpected console statement (no-console)`
**Solution**: 
- Remove debugging console statements before commit
- Use proper logging in main process
- For renderer, consider using toast notifications instead

### TypeScript Any Types
**Issue**: `Unexpected any. Specify a different type (@typescript-eslint/no-explicit-any)`
**Solution**:
- Define proper TypeScript interfaces
- Use union types for multiple possibilities
- Use `unknown` for truly unknown types
- Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` if unavoidable

### Missing Trailing Commas
**Issue**: `Missing trailing comma (comma-dangle)`
**Solution**: Run `npm run lint:fix` to auto-fix, or manually add commas

### Indentation Issues
**Issue**: `Expected indentation of X spaces but found Y (indent)`
**Solution**: Run `npm run lint:fix` to auto-fix, or configure editor for 2-space indentation

## Integration with Development Workflow

### VS Code Integration
Install the ESLint extension for real-time linting feedback:
```json
{
  "eslint.validate": ["javascript", "typescript", "javascriptreact", "typescriptreact"],
  "eslint.autoFixOnSave": true
}
```

### Pre-commit Hooks (Recommended)
Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{js,ts,tsx}": ["npm run lint:staged"]
  }
}
```

### CI/CD Integration
Add to your CI pipeline:
```bash
npm run lint:check  # Fails build if any warnings exist
```

## Best Practices

### 1. Fix Issues Early
- Run `npm run lint:fix` before committing
- Address warnings promptly to maintain code quality
- Use VS Code ESLint extension for real-time feedback

### 2. Type Safety
- Avoid `any` types - define proper interfaces
- Use strict TypeScript configurations
- Leverage type inference when possible

### 3. React Best Practices
- Always provide keys for list items
- Follow hooks rules consistently
- Use proper dependency arrays for useEffect

### 4. Code Consistency
- Use consistent formatting (handled by auto-fix)
- Follow established naming conventions
- Maintain proper indentation (2 spaces)

## Troubleshooting

### ESLint Not Working
1. Check if ESLint extension is installed in VS Code
2. Verify `node_modules` are installed: `npm install`
3. Check for syntax errors in `.eslintrc.js`
4. Clear VS Code cache: `Cmd+Shift+P` → "Developer: Reload Window"

### Performance Issues
1. Use `.eslintignore` to exclude unnecessary files
2. Consider disabling type-aware rules for large codebases
3. Run linting only on changed files in CI/CD

### Configuration Conflicts
1. Ensure only one ESLint config file exists
2. Check for conflicting rules in different extends
3. Use overrides for file-specific rule adjustments

## Maintenance

### Updating Dependencies
1. Check for ESLint updates: `npm outdated eslint`
2. Update TypeScript ESLint: `npm update @typescript-eslint/parser @typescript-eslint/eslint-plugin`
3. Update React plugins: `npm update eslint-plugin-react eslint-plugin-react-hooks`
4. Test thoroughly after updates

### Rule Adjustments
- Modify `.eslintrc.js` for project-wide changes
- Use `// eslint-disable-next-line` for one-off exceptions
- Document rule changes in team discussions
- Consider team consensus for rule modifications

This configuration ensures consistent, high-quality code across the Aerotage Time Reporting Application while maintaining appropriate flexibility for different parts of the Electron application. 