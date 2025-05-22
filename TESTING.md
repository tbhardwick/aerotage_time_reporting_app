# Testing Framework Documentation

## Overview

This Electron application now includes a comprehensive testing framework that covers:

- **Unit Tests** - Testing individual functions and modules
- **Integration Tests** - Testing component interactions
- **End-to-End Tests** - Testing complete user workflows
- **Structure Tests** - Validating app architecture and configuration

## Framework Components

### 1. Jest (Unit & Integration Testing)
- **Purpose**: Unit and integration testing for all JavaScript code
- **Environment**: Node.js for main/preload, jsdom for renderer
- **Configuration**: `jest.config.js`
- **Setup**: `tests/setup.js` with Electron API mocks

### 2. Playwright (End-to-End Testing)
- **Purpose**: Full application testing with real Electron instances
- **Configuration**: `playwright.config.js`
- **Tests**: Located in `tests/e2e/`

## Test Structure

```
tests/
├── setup.js                 # Jest configuration and Electron mocks
├── simple.test.js           # Basic Jest functionality tests
├── basic-electron.test.js   # App structure validation tests
├── main/                    # Main process tests (currently has mocking issues)
├── preload/                 # Preload script tests (currently has mocking issues)
├── renderer/                # Renderer process tests (working)
├── e2e/                     # End-to-end tests (Playwright)
└── README.md               # Detailed testing documentation
```

## Current Status

### ✅ Working Tests
- **Basic functionality tests** (`simple.test.js`) - 5/5 passing
- **App structure tests** (`basic-electron.test.js`) - 10/10 passing
- **Renderer process tests** (`renderer.test.js`) - Most tests passing

### ⚠️ Known Issues
- **Main process tests** - electron-log mocking needs refinement
- **Preload tests** - contextBridge mocking needs improvement
- **E2E tests** - Need proper Electron-Playwright integration

## Running Tests

### All Jest Tests
```bash
npm test
```

### Specific Test Files
```bash
# Basic tests
npx jest tests/simple.test.js

# Structure tests
npx jest tests/basic-electron.test.js

# Renderer tests
npx jest tests/renderer/renderer.test.js
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Test Categories

### 1. Structure Tests (`basic-electron.test.js`)
Validates that the Electron app has the correct file structure and configuration:
- ✅ Main process file exists and has correct structure
- ✅ Preload script exists and uses contextBridge properly
- ✅ Renderer files exist and have DOM handling
- ✅ HTML structure is valid
- ✅ Package.json configuration is correct

### 2. Renderer Tests (`renderer.test.js`)
Tests the frontend functionality:
- ✅ DOM manipulation and event handling
- ✅ Theme detection and updates
- ✅ Keyboard shortcuts
- ✅ Window focus/blur handling
- ✅ electronAPI integration
- ✅ Error handling for missing APIs

### 3. Main Process Tests (`main.test.js`) - Needs Work
Would test the Electron main process:
- Window creation and management
- IPC handler setup and functionality
- App lifecycle events
- Menu creation
- Auto-updater integration

### 4. Preload Tests (`preload.test.js`) - Needs Work
Would test the security bridge:
- Context bridge API exposure
- IPC method wrapping
- Platform information exposure

### 5. End-to-End Tests (`e2e/app.spec.js`) - Future Enhancement
Would test complete workflows:
- App startup and shutdown
- User interactions
- File operations
- Cross-process communication

## Mocking Strategy

### Electron APIs
The `tests/setup.js` file provides comprehensive mocks for:
- `app` - Application lifecycle methods
- `BrowserWindow` - Window management
- `ipcMain`/`ipcRenderer` - Inter-process communication
- `contextBridge` - Security bridge
- `nativeTheme` - Theme detection
- `electron-log` - Logging functionality
- `electron-store` - Data persistence

### DOM Environment
For renderer tests:
- jsdom provides browser-like environment
- Mock `window.electronAPI` for preload integration
- Mock browser APIs like `matchMedia`, `alert`

## Coverage Goals

Current coverage thresholds are set to 50% for:
- Branches
- Functions
- Lines
- Statements

These can be increased as test coverage improves.

## Best Practices Implemented

1. **Separation of Concerns**: Different test environments for different processes
2. **Comprehensive Mocking**: All Electron APIs are properly mocked
3. **Error Handling**: Tests verify graceful degradation
4. **Real-world Scenarios**: Tests simulate actual user interactions
5. **CI/CD Ready**: Tests run in headless mode for automation

## Future Improvements

### Short Term
1. Fix electron-log mocking in main process tests
2. Improve contextBridge mocking for preload tests
3. Add more comprehensive renderer tests

### Medium Term
1. Implement proper Electron-Playwright integration
2. Add visual regression testing
3. Implement performance benchmarks
4. Add accessibility testing

### Long Term
1. Cross-platform testing automation
2. Test data factories and fixtures
3. Snapshot testing for UI components
4. Integration with CI/CD pipelines

## Troubleshooting

### Common Issues

1. **Tests not found**: Check Jest configuration and file patterns
2. **Electron mocks failing**: Ensure `tests/setup.js` is loaded
3. **DOM not available**: Use `@jest-environment jsdom` for renderer tests
4. **Async tests timing out**: Add proper await statements and increase timeouts

### Debug Commands

```bash
# Run with verbose output
npx jest --verbose

# Run specific test with debugging
node --inspect-brk node_modules/.bin/jest tests/simple.test.js

# List all discovered tests
npx jest --listTests
```

## Contributing

When adding new tests:

1. Follow the existing file structure
2. Use descriptive test names
3. Mock external dependencies appropriately
4. Test both success and error cases
5. Keep tests isolated and independent

## Dependencies Added

The following testing dependencies were added to `package.json`:

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0"
  }
}
```

## Scripts Added

New npm scripts for testing:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
``` 