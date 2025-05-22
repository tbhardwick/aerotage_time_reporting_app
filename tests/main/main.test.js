// Import mocks first
require('../setup.js');

const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');

// Mock the main module by requiring it after setting up mocks
jest.mock('electron-reload', () => jest.fn(), { virtual: true });
jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn(),
  }
}));

describe('Main Process', () => {
  let mockWindow;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    if (global.mockElectron) {
      global.mockElectron.resetMocks();
    }
    
    // Setup mock window
    mockWindow = {
      loadFile: jest.fn(),
      loadURL: jest.fn(),
      show: jest.fn(),
      once: jest.fn((event, callback) => {
        if (event === 'ready-to-show') {
          callback();
        }
      }),
      on: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
        send: jest.fn(),
        setWindowOpenHandler: jest.fn(),
        on: jest.fn(),
      },
      getBounds: jest.fn(() => ({ x: 100, y: 100, width: 800, height: 600 })),
      isMaximized: jest.fn(() => false),
      isMinimized: jest.fn(() => false),
      minimize: jest.fn(),
      maximize: jest.fn(),
      unmaximize: jest.fn(),
      close: jest.fn(),
      setBackgroundColor: jest.fn(),
    };
    
    BrowserWindow.mockImplementation(() => mockWindow);
  });

  describe('App Initialization', () => {
    test('should create window when app is ready', async () => {
      // Mock app.whenReady to resolve immediately
      app.whenReady.mockResolvedValue();
      
      // Require main after mocks are set up
      require('../../src/main/main.js');
      
      // Trigger the ready event
      const readyCallback = app.whenReady.mock.calls[0][0];
      if (typeof readyCallback === 'function') {
        await readyCallback();
      }
      
      expect(BrowserWindow).toHaveBeenCalled();
      expect(mockWindow.show).toHaveBeenCalled();
    });

    test('should set up IPC handlers on ready', async () => {
      app.whenReady.mockResolvedValue();
      
      require('../../src/main/main.js');
      
      expect(ipcMain.handle).toHaveBeenCalledWith('app:getVersion', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('app:getName', expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith('theme:get', expect.any(Function));
    });
  });

  describe('IPC Handlers', () => {
    beforeEach(() => {
      require('../../src/main/main.js');
    });

    test('should handle app version request', () => {
      const versionHandler = ipcMain.handle.mock.calls.find(
        call => call[0] === 'app:getVersion'
      )[1];
      
      app.getVersion.mockReturnValue('1.0.0');
      const result = versionHandler();
      
      expect(result).toBe('1.0.0');
      expect(app.getVersion).toHaveBeenCalled();
    });

    test('should handle app name request', () => {
      const nameHandler = ipcMain.handle.mock.calls.find(
        call => call[0] === 'app:getName'
      )[1];
      
      app.getName.mockReturnValue('Test App');
      const result = nameHandler();
      
      expect(result).toBe('Test App');
      expect(app.getName).toHaveBeenCalled();
    });

    test('should handle theme get request', () => {
      const themeHandler = ipcMain.handle.mock.calls.find(
        call => call[0] === 'theme:get'
      )[1];
      
      nativeTheme.shouldUseDarkColors = true;
      const result = themeHandler();
      
      expect(result).toBe(true);
    });

    test('should handle window minimize', () => {
      const minimizeHandler = ipcMain.on.mock.calls.find(
        call => call[0] === 'window:minimize'
      )[1];
      
      minimizeHandler();
      expect(mockWindow.minimize).toHaveBeenCalled();
    });

    test('should handle window maximize/unmaximize', () => {
      const maximizeHandler = ipcMain.on.mock.calls.find(
        call => call[0] === 'window:maximize'
      )[1];
      
      // Test maximize
      mockWindow.isMaximized.mockReturnValue(false);
      maximizeHandler();
      expect(mockWindow.maximize).toHaveBeenCalled();
      
      // Test unmaximize
      jest.clearAllMocks();
      mockWindow.isMaximized.mockReturnValue(true);
      maximizeHandler();
      expect(mockWindow.unmaximize).toHaveBeenCalled();
    });
  });

  describe('Window Management', () => {
    test('should create window with correct configuration', () => {
      require('../../src/main/main.js');
      
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          minWidth: 800,
          minHeight: 600,
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          }),
        })
      );
    });

    test('should load correct file in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      require('../../src/main/main.js');
      
      expect(mockWindow.loadFile).toHaveBeenCalledWith(
        expect.stringContaining('public/index.html')
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should load development URL in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      require('../../src/main/main.js');
      
      expect(mockWindow.loadURL).toHaveBeenCalledWith('http://localhost:3000');
      expect(mockWindow.webContents.openDevTools).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('App Events', () => {
    test('should handle activate event on macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      require('../../src/main/main.js');
      
      // Find and trigger activate handler
      const activateHandler = app.on.mock.calls.find(
        call => call[0] === 'activate'
      )[1];
      
      BrowserWindow.getAllWindows.mockReturnValue([]);
      activateHandler();
      
      expect(BrowserWindow).toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should quit on window-all-closed for non-macOS', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      require('../../src/main/main.js');
      
      const windowAllClosedHandler = app.on.mock.calls.find(
        call => call[0] === 'window-all-closed'
      )[1];
      
      windowAllClosedHandler();
      expect(app.quit).toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });
}); 