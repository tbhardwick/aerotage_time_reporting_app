# Electron macOS Template

A modern, production-ready Electron application template optimized for macOS development. This template includes security best practices, native macOS styling, auto-updates, and a comprehensive development setup.

## Features

### 🚀 Modern Architecture
- **Secure by default**: Context isolation, sandboxed renderer, no node integration
- **Modern Electron APIs**: Uses latest Electron features and best practices
- **TypeScript ready**: Easy to convert to TypeScript if needed
- **ESLint configured**: Code quality and consistency

### 🎨 macOS Native Experience
- **Native title bar**: Hidden inset style with traffic light positioning
- **Vibrancy effects**: Translucent backgrounds and blur effects
- **Dark mode support**: Automatic theme switching
- **Native menus**: Full macOS menu bar with standard items
- **System integration**: Proper app lifecycle and window management

### ⚡ Developer Experience
- **Hot reload**: Automatic restart during development with electronmon
- **Testing framework**: Comprehensive Jest and Playwright testing setup
- **Build system**: electron-builder with macOS-specific configuration
- **Universal builds**: Support for both Intel and Apple Silicon
- **Code signing ready**: Entitlements and signing configuration included

### 📦 Production Ready
- **Auto-updater**: Built-in update mechanism
- **Persistent storage**: electron-store for user preferences
- **Logging**: electron-log for debugging and monitoring
- **Error handling**: Comprehensive error handling and recovery
- **Deep linking**: Custom protocol support

## Quick Start

### Prerequisites
- Node.js 16+ 
- macOS (for building macOS apps)
- Xcode Command Line Tools (for code signing)

### Installation

1. **Clone or download this template**
   ```bash
   git clone <your-repo-url>
   cd electron-macos-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

### Development Scripts

```bash
# Start the app in development mode
npm start

# Start with hot reload (recommended for development)
npm run dev

# Build the app for distribution
npm run build

# Build for macOS specifically
npm run build:mac

# Create distributable packages
npm run dist

# Lint the code
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e
```

## Project Structure

```
electron-macos-template/
├── src/
│   ├── main/           # Main process files
│   │   └── main.js     # Main process entry point
│   ├── preload/        # Preload scripts
│   │   └── preload.js  # Context bridge API
│   └── renderer/       # Renderer process files (if using a framework)
├── public/             # Static assets and HTML
│   ├── index.html      # Main HTML file
│   ├── styles/         # CSS files
│   └── scripts/        # Renderer scripts
├── tests/              # Testing framework
│   ├── main/           # Main process tests
│   ├── preload/        # Preload script tests
│   ├── renderer/       # Renderer process tests
│   ├── e2e/            # End-to-end tests
│   └── setup.js        # Test configuration and mocks
├── assets/             # App icons and resources
│   └── icons/          # App icons in various formats
├── build/              # Build configuration
│   └── entitlements.mac.plist
├── jest.config.js      # Jest testing configuration
├── playwright.config.js # Playwright E2E configuration
├── package.json        # Dependencies and build config
├── TESTING.md          # Testing documentation
└── README.md
```

## Configuration

### App Information
Update the following in `package.json`:
- `name`: Your app's package name
- `productName`: Display name for your app
- `description`: App description
- `author`: Your information
- `build.appId`: Unique app identifier (reverse domain notation)

### Icons
Replace the icons in `assets/icons/` with your app's icons:
- `icon.icns`: macOS app icon (required)
- `icon.png`: Fallback PNG icon

### Code Signing
For distribution, you'll need to configure code signing:
1. Get an Apple Developer account
2. Create certificates in Xcode or Apple Developer portal
3. Update `build.mac` section in `package.json` with your team ID

## Security Features

This template implements Electron security best practices:

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in renderer
- **Sandbox**: Enabled for renderer processes
- **Preload Scripts**: Secure API exposure via context bridge
- **CSP**: Content Security Policy headers
- **URL Validation**: Prevents navigation to external sites

## Testing

This template includes a comprehensive testing framework with:

### 🧪 Testing Framework
- **Jest**: Unit and integration testing for all JavaScript code
- **Playwright**: End-to-end testing with real Electron instances
- **jsdom**: DOM testing environment for renderer processes
- **Comprehensive mocks**: All Electron APIs are properly mocked

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run end-to-end tests
npm run test:e2e
```

### Test Structure
- `tests/simple.test.js` - Basic functionality tests
- `tests/basic-electron.test.js` - App structure validation
- `tests/renderer/` - Frontend/UI tests
- `tests/main/` - Main process tests (needs refinement)
- `tests/preload/` - Preload script tests (needs refinement)
- `tests/e2e/` - End-to-end workflow tests

### Current Status
✅ **Working**: Basic tests, structure validation, renderer tests  
⚠️ **In Progress**: Main process and preload script mocking  
🔮 **Planned**: Full E2E test integration

For detailed testing documentation, see [TESTING.md](TESTING.md).

## Customization

### Adding New APIs
1. Add IPC handlers in `src/main/main.js`
2. Expose APIs in `src/preload/preload.js`
3. Use APIs in renderer via `window.electronAPI`

### Styling
- Modify `public/styles/main.css` for custom styling
- CSS variables are used for theming
- Dark mode is automatically handled

### Menu Customization
Edit the menu template in `src/main/main.js` in the `createMenu()` function.

## Building for Distribution

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run dist
```

This creates:
- `.dmg` installer for easy distribution
- `.zip` archive for direct download
- Universal binaries supporting both Intel and Apple Silicon

### Code Signing
For App Store or notarized distribution:
1. Configure your Apple Developer certificates
2. Update `package.json` with your team ID
3. Run build with signing enabled

## Troubleshooting

### Common Issues

**App won't start in development**
- Check that all dependencies are installed: `npm install`
- Verify Node.js version is 16+

**Build fails**
- Ensure Xcode Command Line Tools are installed
- Check that all required icons are present
- Verify code signing configuration

**Hot reload not working**
- Make sure you're using `npm run dev` not `npm start`
- Check that electronmon is installed

### Getting Help
- Check the [Electron documentation](https://electronjs.org/docs)
- Review [electron-builder documentation](https://www.electron.build/)
- Look at the browser console and main process logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- [Electron](https://electronjs.org/) - The framework that makes this possible
- [electron-builder](https://www.electron.build/) - Build and distribution
- [electron-store](https://github.com/sindresorhus/electron-store) - Persistent storage
- [electron-log](https://github.com/megahertz/electron-log) - Logging
- [electron-updater](https://github.com/electron-userland/electron-updater) - Auto-updates

---

**Happy coding! 🚀** 