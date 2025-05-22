// Example configuration file
// Copy this to config.js and customize as needed

module.exports = {
  // App settings
  app: {
    name: 'Electron macOS Template',
    version: '1.0.0',
    description: 'A modern Electron app template for macOS'
  },

  // Window settings
  window: {
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 800,
    minHeight: 600
  },

  // Development settings
  development: {
    enableDevTools: true,
    enableHotReload: true,
    showPerformanceMetrics: false
  },

  // Production settings
  production: {
    enableAutoUpdater: true,
    enableCrashReporting: false,
    enableAnalytics: false
  },

  // Security settings
  security: {
    enableContextIsolation: true,
    enableNodeIntegration: false,
    enableSandbox: true
  },

  // macOS specific settings
  macos: {
    enableVibrancy: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 }
  }
}; 