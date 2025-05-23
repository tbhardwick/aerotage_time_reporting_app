module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.jsx',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Exclude Playwright tests and problematic tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/main/',
    '/tests/preload/'
  ],
  
  // Coverage settings
  collectCoverageFrom: [
    'public/scripts/**/*.js',
    'src/renderer/**/*.{js,jsx,ts,tsx}',
    '!src/**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module name mapping
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70
    }
  }
}; 