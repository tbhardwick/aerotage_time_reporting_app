// Jest setup file for Electron testing

// Mock Electron modules for unit tests
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
    getName: jest.fn(() => 'Test App'),
    quit: jest.fn(),
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    focus: jest.fn(),
    setAsDefaultProtocolClient: jest.fn(),
    getAllWindows: jest.fn(() => []),
  },
  BrowserWindow: (() => {
    const MockBrowserWindow = jest.fn().mockImplementation(() => ({
      loadFile: jest.fn(),
      loadURL: jest.fn(),
      on: jest.fn(),
      once: jest.fn((event, callback) => {
        if (event === 'ready-to-show') {
          setTimeout(callback, 0);
        }
      }),
      webContents: {
        openDevTools: jest.fn(),
        on: jest.fn(),
        send: jest.fn(),
        setWindowOpenHandler: jest.fn(),
        toggleDevTools: jest.fn(),
      },
      show: jest.fn(),
      hide: jest.fn(),
      close: jest.fn(),
      minimize: jest.fn(),
      maximize: jest.fn(),
      unmaximize: jest.fn(),
      isMaximized: jest.fn(() => false),
      isMinimized: jest.fn(() => false),
      getBounds: jest.fn(() => ({ x: 100, y: 100, width: 800, height: 600 })),
      setBounds: jest.fn(),
      setBackgroundColor: jest.fn(),
      focus: jest.fn(),
      restore: jest.fn(),
    }));
    MockBrowserWindow.getAllWindows = jest.fn(() => []);
    return MockBrowserWindow;
  })(),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
  nativeTheme: {
    shouldUseDarkColors: false,
    themeSource: 'system',
    on: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: ['test.txt'] })),
    showSaveDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: 'test.txt' })),
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
    setApplicationMenu: jest.fn(),
  },
}));

// Mock electron-log
jest.mock('electron-log', () => ({
  initialize: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  transports: {
    file: {
      level: 'info'
    }
  }
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  }));
});

// Global test utilities
global.mockElectron = {
  resetMocks: () => {
    jest.clearAllMocks();
  }
};

// Mock window.electronAPI
global.electronAPI = {
  getAppInfo: jest.fn(() => Promise.resolve({
    name: 'Test App',
    version: '1.0.0'
  })),
  openExternal: jest.fn(),
  showMessageBox: jest.fn(),
  store: {
    set: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue('test-value'),
  }
};

// Setup DOM environment for renderer tests
if (typeof window !== 'undefined') {
  // Mock window.electronAPI for renderer tests
  window.electronAPI = {
    getAppInfo: jest.fn(() => Promise.resolve({
      name: 'Test App',
      version: '1.0.0'
    })),
    openExternal: jest.fn(),
    showMessageBox: jest.fn(),
  };
}

// Setup testing-library
require('@testing-library/jest-dom');

// Global test setup for Electron and Node.js testing environment

// Mock console methods to keep test output clean
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

global.console = {
  ...console,
  log: jest.fn(originalLog),
  error: jest.fn(originalError),
  warn: jest.fn(originalWarn),
};

// Polyfills for Web APIs that may be missing in Node environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder; 