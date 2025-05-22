// Import mocks first
require('../setup.js');

const { contextBridge, ipcRenderer } = require('electron');

describe('Preload Script', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    if (global.mockElectron) {
      global.mockElectron.resetMocks();
    }
    
    // Clear any existing electronAPI
    delete global.window;
    global.window = {};
  });

  test('should expose electronAPI to main world', () => {
    // Require preload script
    require('../../src/preload/preload.js');
    
    // Verify contextBridge.exposeInMainWorld was called
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );
  });

  test('should expose app info methods', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('getVersion');
    expect(exposedAPI).toHaveProperty('getName');
    expect(typeof exposedAPI.getVersion).toBe('function');
    expect(typeof exposedAPI.getName).toBe('function');
  });

  test('should expose window control methods', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('minimizeWindow');
    expect(exposedAPI).toHaveProperty('maximizeWindow');
    expect(exposedAPI).toHaveProperty('closeWindow');
    expect(typeof exposedAPI.minimizeWindow).toBe('function');
    expect(typeof exposedAPI.maximizeWindow).toBe('function');
    expect(typeof exposedAPI.closeWindow).toBe('function');
  });

  test('should expose theme methods', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('onThemeChanged');
    expect(exposedAPI).toHaveProperty('getTheme');
    expect(exposedAPI).toHaveProperty('setTheme');
    expect(typeof exposedAPI.onThemeChanged).toBe('function');
    expect(typeof exposedAPI.getTheme).toBe('function');
    expect(typeof exposedAPI.setTheme).toBe('function');
  });

  test('should expose file operation methods', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('openFile');
    expect(exposedAPI).toHaveProperty('saveFile');
    expect(typeof exposedAPI.openFile).toBe('function');
    expect(typeof exposedAPI.saveFile).toBe('function');
  });

  test('should expose store methods', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('store');
    expect(exposedAPI.store).toHaveProperty('get');
    expect(exposedAPI.store).toHaveProperty('set');
    expect(exposedAPI.store).toHaveProperty('delete');
    expect(exposedAPI.store).toHaveProperty('clear');
    expect(typeof exposedAPI.store.get).toBe('function');
    expect(typeof exposedAPI.store.set).toBe('function');
    expect(typeof exposedAPI.store.delete).toBe('function');
    expect(typeof exposedAPI.store.clear).toBe('function');
  });

  test('should expose platform information', () => {
    require('../../src/preload/preload.js');
    
    const exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    
    expect(exposedAPI).toHaveProperty('platform');
    expect(exposedAPI).toHaveProperty('isMac');
    expect(exposedAPI).toHaveProperty('isWindows');
    expect(exposedAPI).toHaveProperty('isLinux');
  });

  describe('API Method Functionality', () => {
    let exposedAPI;
    
    beforeEach(() => {
      require('../../src/preload/preload.js');
      exposedAPI = contextBridge.exposeInMainWorld.mock.calls[0][1];
    });

    test('getVersion should invoke correct IPC', () => {
      exposedAPI.getVersion();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app:getVersion');
    });

    test('getName should invoke correct IPC', () => {
      exposedAPI.getName();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('app:getName');
    });

    test('window controls should send correct IPC messages', () => {
      exposedAPI.minimizeWindow();
      expect(ipcRenderer.send).toHaveBeenCalledWith('window:minimize');
      
      exposedAPI.maximizeWindow();
      expect(ipcRenderer.send).toHaveBeenCalledWith('window:maximize');
      
      exposedAPI.closeWindow();
      expect(ipcRenderer.send).toHaveBeenCalledWith('window:close');
    });

    test('theme methods should use correct IPC', () => {
      exposedAPI.getTheme();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('theme:get');
      
      exposedAPI.setTheme('dark');
      expect(ipcRenderer.send).toHaveBeenCalledWith('theme:set', 'dark');
    });

    test('file operations should use correct IPC', () => {
      exposedAPI.openFile();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('dialog:openFile');
      
      exposedAPI.saveFile('test content');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('dialog:saveFile', 'test content');
    });

    test('store operations should use correct IPC', () => {
      exposedAPI.store.get('testKey');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:get', 'testKey');
      
      exposedAPI.store.set('testKey', 'testValue');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:set', 'testKey', 'testValue');
      
      exposedAPI.store.delete('testKey');
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:delete', 'testKey');
      
      exposedAPI.store.clear();
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('store:clear');
    });

    test('event listeners should register correctly', () => {
      const mockCallback = jest.fn();
      
      exposedAPI.onThemeChanged(mockCallback);
      expect(ipcRenderer.on).toHaveBeenCalledWith('theme-changed', expect.any(Function));
      
      exposedAPI.onOpenPreferences(mockCallback);
      expect(ipcRenderer.on).toHaveBeenCalledWith('open-preferences', mockCallback);
      
      exposedAPI.onDeepLink(mockCallback);
      expect(ipcRenderer.on).toHaveBeenCalledWith('deep-link', expect.any(Function));
    });
  });
}); 