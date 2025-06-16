# Configuração ESLint específica para testes E2E com Playwright
# Este arquivo deve ser colocado na pasta e2e/

module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: '../tsconfig.json',
  },
  rules: {
    // Permitir console.log em testes E2E para debugging
    'no-console': 'off',
    
    // TypeScript rules mais flexíveis para testes
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    
    // Playwright específico
    'no-empty-pattern': 'off', // Para destructuring { page }
    
    // Melhores práticas gerais ainda aplicáveis
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },
  globals: {
    // Playwright globals
    'test': 'readonly',
    'expect': 'readonly',
    'describe': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'beforeAll': 'readonly',
    'afterAll': 'readonly',
  }
}