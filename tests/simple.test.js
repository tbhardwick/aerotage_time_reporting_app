// Simple test to verify Jest setup is working
describe('Basic Test Suite', () => {
  test('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should have access to Node.js APIs', () => {
    expect(typeof require).toBe('function');
    expect(typeof process).toBe('object');
  });

  test('should be able to read package.json', () => {
    const packageJson = require('../package.json');
    expect(packageJson.name).toBe('electron-macos-template');
    expect(packageJson.main).toBe('src/main/main.js');
  });

  test('should have testing dependencies installed', () => {
    const packageJson = require('../package.json');
    expect(packageJson.devDependencies.jest).toBeDefined();
    expect(packageJson.devDependencies['@playwright/test']).toBeDefined();
    expect(packageJson.devDependencies['jest-environment-jsdom']).toBeDefined();
  });

  test('should have test scripts configured', () => {
    const packageJson = require('../package.json');
    expect(packageJson.scripts.test).toBe('jest');
    expect(packageJson.scripts['test:watch']).toBe('jest --watch');
    expect(packageJson.scripts['test:coverage']).toBe('jest --coverage');
  });
}); 