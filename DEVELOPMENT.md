# Development Guide

This guide covers development workflows, best practices, and advanced topics for the Electron macOS Template.

## Development Workflow

### Setting Up Your Development Environment

1. **Prerequisites**
   ```bash
   # Ensure you have the latest Node.js LTS
   node --version  # Should be 16+
   
   # Install dependencies
   npm install
   ```

2. **Development Mode**
   ```bash
   # Start with hot reload (recommended)
   npm run dev
   
   # Or start normally
   npm start
   ```

3. **Code Quality**
   ```bash
   # Lint your code
   npm run lint
   
   # Fix linting issues automatically
   npx eslint src/**/*.js --fix
   ```

## Project Architecture

### Process Architecture
- **Main Process** (`src/main/main.js`): Controls app lifecycle, creates renderer processes
- **Preload Script** (`src/preload/preload.js`): Secure bridge between main and renderer
- **Renderer Process** (`public/`): UI layer with HTML, CSS, and JavaScript

### Security Model
This template follows Electron's security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Sandboxed renderer processes
- Secure IPC communication via context bridge

## Adding New Features

### 1. Adding IPC APIs

**Step 1: Add handler in main process**
```javascript
// In src/main/main.js, add to setupIpcHandlers()
ipcMain.handle('myFeature:doSomething', async (event, data) => {
  // Your logic here
  return result;
});
```

**Step 2: Expose in preload script**
```javascript
// In src/preload/preload.js, add to electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  myFeature: {
    doSomething: (data) => ipcRenderer.invoke('myFeature:doSomething', data)
  }
});
```

**Step 3: Use in renderer**
```javascript
// In renderer scripts
const result = await window.electronAPI.myFeature.doSomething(data);
```

### 2. Adding New Windows

```javascript
// In main process
function createSecondaryWindow() {
  const secondaryWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow, // Optional: make it a child window
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  
  secondaryWindow.loadFile('path/to/secondary.html');
  return secondaryWindow;
}
```

### 3. Adding Menu Items

```javascript
// In createMenu() function
{
  label: 'My Menu',
  submenu: [
    {
      label: 'My Action',
      accelerator: 'CmdOrCtrl+M',
      click: () => {
        // Handle menu click
        if (mainWindow) {
          mainWindow.webContents.send('menu-action', 'myAction');
        }
      }
    }
  ]
}
```

## Styling and Theming

### CSS Variables
The template uses CSS custom properties for theming:
```css
:root {
  --primary-color: #007AFF;
  --background-color: #ffffff;
  /* ... more variables */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1e1e1e;
    /* ... dark mode overrides */
  }
}
```

### macOS-Specific Styling
- Use `-webkit-app-region: drag` for draggable areas
- Implement vibrancy with `backdrop-filter: blur()`
- Follow Apple's Human Interface Guidelines

## Building and Distribution

### Development Builds
```bash
npm run build        # Build for current platform
npm run build:mac    # Build specifically for macOS
```

### Distribution
```bash
npm run dist         # Create distributable packages
```

### Code Signing
For distribution outside the App Store:
1. Get a Developer ID certificate from Apple
2. Configure signing in `package.json`:
   ```json
   "build": {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAM_ID)"
     }
   }
   ```

### App Store Distribution
1. Get a Mac App Store certificate
2. Configure for App Store:
   ```json
   "build": {
     "mac": {
       "target": "mas",
       "entitlements": "build/entitlements.mas.plist"
     }
   }
   ```

## Testing

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] All menu items work
- [ ] Window resizing and positioning
- [ ] Dark/light mode switching
- [ ] File dialogs work
- [ ] Preferences save/load
- [ ] App updates (if enabled)

### Automated Testing
Consider adding:
- Unit tests for main process logic
- Integration tests for IPC communication
- E2E tests with Spectron or Playwright

## Performance Optimization

### Bundle Size
- Use `electron-builder`'s file filtering
- Exclude unnecessary files from packaging
- Consider using `asar` archives

### Memory Usage
- Monitor with Chrome DevTools
- Avoid memory leaks in IPC handlers
- Clean up event listeners

### Startup Time
- Minimize preload script size
- Lazy load heavy dependencies
- Use `show: false` and `ready-to-show` event

## Debugging

### Main Process
```bash
# Start with debugging enabled
npm start -- --inspect=5858

# Or use VS Code launch configuration
```

### Renderer Process
- Use Chrome DevTools (Cmd+Option+I)
- Console logs appear in DevTools
- Network tab for resource loading

### Common Issues
1. **White screen**: Check console for errors, verify file paths
2. **IPC not working**: Ensure preload script is loaded
3. **Menu not appearing**: Check menu template syntax
4. **Build fails**: Verify all required files are included

## Contributing

### Code Style
- Use ESLint configuration provided
- Follow existing naming conventions
- Add comments for complex logic

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Electron Documentation](https://electronjs.org/docs)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/macos)
- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security Best Practices](https://electronjs.org/docs/tutorial/security) 