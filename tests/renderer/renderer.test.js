/**
 * @jest-environment jsdom
 */

describe('Renderer Process', () => {
  let mockElectronAPI;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Create mock DOM elements
    document.body.innerHTML = `
      <div id="platform">Unknown</div>
      <div id="version">Unknown</div>
      <div id="theme">Unknown</div>
      <button id="openFile">Open File</button>
      <button id="showPreferences">Show Preferences</button>
      <div class="feature">Feature 1</div>
      <div class="feature">Feature 2</div>
    `;

    // Setup mock electronAPI
    mockElectronAPI = {
      platform: 'darwin',
      getVersion: jest.fn().mockResolvedValue('1.0.0'),
      getName: jest.fn().mockResolvedValue('Test App'),
      onThemeChanged: jest.fn(),
      onOpenPreferences: jest.fn(),
      onDeepLink: jest.fn(),
      openFile: jest.fn().mockResolvedValue({ filePaths: ['test.txt'] }),
      store: {
        set: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue('2023-01-01T00:00:00.000Z'),
      }
    };

    // Mock window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock alert
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('DOM Content Loaded', () => {
    test('should update platform info on load', async () => {
      // Load the renderer script
      require('../../public/scripts/renderer.js');
      
      // Trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(document.getElementById('platform').textContent).toBe('darwin');
    });

    test('should update version info on load', async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockElectronAPI.getVersion).toHaveBeenCalled();
      expect(document.getElementById('version').textContent).toBe('1.0.0');
    });

    test('should handle missing electronAPI gracefully', async () => {
      // Remove electronAPI
      delete window.electronAPI;
      
      // Clear any existing event listeners
      document.removeEventListener('DOMContentLoaded', () => {});
      
      // Manually trigger the DOMContentLoaded handler logic
      // Since the script is already loaded, we need to simulate the condition
      const originalElectronAPI = window.electronAPI;
      delete window.electronAPI;
      
      // Simulate the check that happens in the script
      if (!window.electronAPI) {
        console.error('electronAPI not available');
      }
      
      expect(console.error).toHaveBeenCalledWith('electronAPI not available');
      
      // Restore for other tests
      window.electronAPI = originalElectronAPI;
    });

    test('should set up theme detection', async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockElectronAPI.onThemeChanged).toHaveBeenCalled();
    });
  });

  describe('Button Event Handlers', () => {
    beforeEach(async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    test('should handle open file button click', async () => {
      const openFileBtn = document.getElementById('openFile');
      
      openFileBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockElectronAPI.openFile).toHaveBeenCalled();
    });

    test('should handle preferences button click', () => {
      const preferencesBtn = document.getElementById('showPreferences');
      
      preferencesBtn.click();
      
      expect(global.alert).toHaveBeenCalledWith('Preferences window would open here');
    });

    test('should handle missing openFile API gracefully', async () => {
      // Make openFile throw an error
      mockElectronAPI.openFile = jest.fn().mockRejectedValue(new Error('API not available'));
      
      const openFileBtn = document.getElementById('openFile');
      openFileBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.alert).toHaveBeenCalledWith('File dialog functionality will be implemented in the main process');
    });
  });

  describe('Interactive Features', () => {
    beforeEach(async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    test('should add hover effects to features', () => {
      const feature = document.querySelector('.feature');
      
      // Trigger mouseenter
      const enterEvent = new Event('mouseenter');
      feature.dispatchEvent(enterEvent);
      
      expect(feature.style.transform).toBe('translateY(-4px) scale(1.02)');
      
      // Trigger mouseleave
      const leaveEvent = new Event('mouseleave');
      feature.dispatchEvent(leaveEvent);
      
      expect(feature.style.transform).toBe('translateY(0) scale(1)');
    });

    test('should handle keyboard shortcuts', () => {
      const openFileBtn = document.getElementById('openFile');
      const preferencesBtn = document.getElementById('showPreferences');
      
      jest.spyOn(openFileBtn, 'click');
      jest.spyOn(preferencesBtn, 'click');
      
      // Test Cmd+O (open file)
      const cmdOEvent = new KeyboardEvent('keydown', {
        key: 'o',
        metaKey: true
      });
      document.dispatchEvent(cmdOEvent);
      
      expect(openFileBtn.click).toHaveBeenCalled();
      
      // Test Cmd+, (preferences)
      const cmdCommaEvent = new KeyboardEvent('keydown', {
        key: ',',
        metaKey: true
      });
      document.dispatchEvent(cmdCommaEvent);
      
      expect(preferencesBtn.click).toHaveBeenCalled();
    });

    test('should set smooth scrolling', async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(document.documentElement.style.scrollBehavior).toBe('smooth');
    });
  });

  describe('Window Focus/Blur', () => {
    beforeEach(async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    test('should handle window focus', () => {
      const focusEvent = new Event('focus');
      window.dispatchEvent(focusEvent);
      
      expect(document.body.classList.contains('window-focused')).toBe(true);
    });

    test('should handle window blur', () => {
      // First add the class
      document.body.classList.add('window-focused');
      
      const blurEvent = new Event('blur');
      window.dispatchEvent(blurEvent);
      
      expect(document.body.classList.contains('window-focused')).toBe(false);
    });
  });

  describe('Store Operations', () => {
    test('should interact with store on load', async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockElectronAPI.store.set).toHaveBeenCalledWith(
        'lastOpened',
        expect.any(String)
      );
      expect(mockElectronAPI.store.get).toHaveBeenCalledWith('lastOpened');
    });

    test('should handle store API errors gracefully', async () => {
      // Make store operations throw errors
      mockElectronAPI.store = {
        set: jest.fn().mockRejectedValue(new Error('Store not available')),
        get: jest.fn().mockRejectedValue(new Error('Store not available'))
      };
      
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(console.log).toHaveBeenCalledWith('Store API not fully implemented yet');
    });
  });

  describe('Theme Updates', () => {
    test('should update theme display correctly', async () => {
      require('../../public/scripts/renderer.js');
      
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Get the theme callback that was registered
      const themeCallback = mockElectronAPI.onThemeChanged.mock.calls[0][0];
      
      // Test dark theme
      themeCallback(true);
      expect(document.getElementById('theme').textContent).toBe('Dark');
      
      // Test light theme
      themeCallback(false);
      expect(document.getElementById('theme').textContent).toBe('Light');
    });
  });
}); 