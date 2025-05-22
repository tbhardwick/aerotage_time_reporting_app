# Testing Framework for Electron macOS Template

This directory contains a comprehensive testing framework for the Electron application, covering unit tests, integration tests, and end-to-end tests.

## Overview

The testing framework is built using:
- **Jest** - For unit and integration testing
- **Playwright** - For end-to-end testing
- **jsdom** - For DOM testing in the renderer process

## Test Structure

```
tests/
├── main/           # Main process tests
├── preload/        # Preload script tests  
├── renderer/       # Renderer process tests
├── e2e/           # End-to-end tests
├── setup.js       # Jest setup and mocks
└── README.md      # This file
```

## Test Categories

### 1. Main Process Tests (`tests/main/`)
Tests for the Electron main process functionality:
- Window creation and management
- IPC handlers
- App lifecycle events
- Menu creation
- Auto-updater functionality
- Store operations

### 2. Preload Script Tests (`tests/preload/`)
Tests for the preload script that bridges main and renderer processes:
- Context bridge API exposure
- IPC method wrapping
- Security isolation
- Platform information exposure

### 3. Renderer Process Tests (`tests/renderer/`)
Tests for the frontend/UI functionality:
- DOM manipulation
- Event handling
- Theme management
- Keyboard shortcuts
- electronAPI integration

### 4. End-to-End Tests (`tests/e2e/`)
Full application tests that launch the complete Electron app:
- Application startup
- User interactions
- File operations
- Window state persistence
- Cross-process communication

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only
npm test

# Unit tests with coverage
npm test:coverage

# Watch mode for development
npm test:watch

# End-to-end tests
npm run test:e2e

# E2E tests with visible browser
npm run test:e2e:headed
```

### Run Tests for Specific Components
```bash
# Main process tests only
npx jest tests/main

# Renderer tests only  
npx jest tests/renderer

# Preload tests only
npx jest tests/preload
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Separate test environments for main (Node.js) and renderer (jsdom)
- Coverage thresholds set to 70%
- Mock setup for Electron APIs
- Multi-project configuration for different test types

### Playwright Configuration (`playwright.config.js`)
- Configured for Electron testing
- HTML reporter for test results
- Retry logic for flaky tests
- Trace collection on failures

## Mocking Strategy

### Electron APIs
All Electron APIs are mocked in `tests/setup.js`:
- `app` - Application lifecycle
- `BrowserWindow` - Window management
- `ipcMain`/`ipcRenderer` - Inter-process communication
- `contextBridge` - Security bridge
- `nativeTheme` - Theme detection
- External dependencies like `electron-log`, `electron-store`

### DOM Environment
For renderer tests:
- jsdom environment simulates browser DOM
- Mock `window.electronAPI` for preload script APIs
- Mock `matchMedia` for theme detection
- Mock browser APIs like `alert`, `console`

## Writing New Tests

### Main Process Test Example
```javascript
describe('New Feature', () => {
  test('should handle new IPC message', () => {
    require('../../src/main/main.js');
    
    const handler = ipcMain.handle.mock.calls.find(
      call => call[0] === 'new-feature'
    )[1];
    
    const result = handler('test-data');
    expect(result).toBe('expected-result');
  });
});
```

### Renderer Test Example
```javascript
/**
 * @jest-environment jsdom
 */
describe('New UI Feature', () => {
  test('should update UI on interaction', () => {
    document.body.innerHTML = '<button id="test">Test</button>';
    
    require('../../public/scripts/renderer.js');
    
    const button = document.getElementById('test');
    button.click();
    
    expect(/* some DOM change */).toBe(true);
  });
});
```

### E2E Test Example
```javascript
test('should perform end-to-end workflow', async () => {
  // Note: Requires electron-playwright setup
  const app = await electron.launch({ args: ['src/main/main.js'] });
  const window = await app.firstWindow();
  
  await window.click('#some-button');
  expect(await window.locator('#result').textContent()).toBe('expected');
  
  await app.close();
});
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI integration
- `coverage/coverage-final.json` - JSON coverage data

## Continuous Integration

The test suite is designed to work in CI environments:
- All tests run in headless mode by default
- Coverage reports can be uploaded to services like Codecov
- E2E tests include retry logic for stability
- Environment variables control test behavior

## Debugging Tests

### Debug Jest Tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test file
npx jest tests/main/main.test.js --verbose
```

### Debug Playwright Tests
```bash
# Run with headed browser
npm run test:e2e:headed

# Run with Playwright inspector
npx playwright test --debug
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Mocking**: Mock external dependencies and Electron APIs consistently
3. **Async Handling**: Properly handle async operations with async/await
4. **Descriptive Names**: Use clear, descriptive test names
5. **Setup/Teardown**: Use beforeEach/afterEach for consistent test state
6. **Coverage**: Aim for high coverage but focus on meaningful tests
7. **Performance**: Keep tests fast by avoiding unnecessary delays

## Troubleshooting

### Common Issues

1. **Electron mocks not working**: Ensure `tests/setup.js` is loaded
2. **DOM not available**: Use `@jest-environment jsdom` for renderer tests
3. **Async tests failing**: Add proper await statements and timeouts
4. **E2E tests flaky**: Increase timeouts and add retry logic

### Getting Help

- Check Jest documentation: https://jestjs.io/docs/
- Check Playwright documentation: https://playwright.dev/
- Review Electron testing guides: https://www.electronjs.org/docs/latest/tutorial/testing

## Future Enhancements

Potential improvements to the testing framework:
- Visual regression testing with Playwright
- Performance testing and benchmarks
- Accessibility testing integration
- Cross-platform testing automation
- Test data factories and fixtures
- Snapshot testing for UI components 