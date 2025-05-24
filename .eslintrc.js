module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    browser: true, // For renderer process
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Console rules - allow console in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Variable rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Modern JavaScript
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'warn',
    'prefer-destructuring': ['warn', { 'object': true, 'array': false }],
    
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/self-closing-comp': 'warn',
    'react/jsx-curly-spacing': ['warn', { 'when': 'never' }],
    'react/jsx-equals-spacing': ['warn', 'never'],
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Code quality
    'eqeqeq': ['error', 'always'],
    'no-duplicate-imports': 'error',
    'no-else-return': 'warn',
    'no-lonely-if': 'warn',
    'no-useless-return': 'warn',
    'no-useless-concat': 'warn',
    
    // Styling consistency
    'comma-dangle': ['warn', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['warn', 'single', { 'avoidEscape': true }],
    'indent': ['warn', 2, { 'SwitchCase': 1 }],
  },
  overrides: [
    {
      // Main process files
      files: ['src/main/**/*.{js,ts}'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        'no-console': 'off', // Allow console in main process
      },
    },
    {
      // Preload files
      files: ['src/preload/**/*.{js,ts}'],
      env: {
        node: true,
        browser: true,
      },
    },
    {
      // Renderer files (React app)
      files: ['src/renderer/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: false,
      },
      rules: {
        'no-console': 'warn', // Warn about console in renderer
      },
    },
    {
      // Test files
      files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', 'tests/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      // Configuration files
      files: ['*.config.{js,ts}', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'test-results/',
    'playwright-report/',
    // Only ignore built JS files, not source files
    'src/main/main.js',
    'src/preload/preload.js',
  ],
}; 