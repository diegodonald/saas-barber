module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules', 'coverage'],
  rules: {
    // TypeScript específico - Configurações mais restritivas
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }], // Mudança: era 'off'
    '@typescript-eslint/ban-ts-comment': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-non-null-assertion': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-empty-function': 'warn', // Mudança: era 'off'
    '@typescript-eslint/ban-types': 'warn', // Mudança: era 'off'
    
    // Código geral - Melhores práticas
    'prefer-const': 'error', // Mudança: era 'off'
    'no-console': 'warn', // Mudança: era 'off' - permitir mas avisar
    'no-debugger': 'error',
    'no-unused-expressions': 'error',
    
    // Imports e exports organizados
    'no-duplicate-imports': 'error',
    
    // Melhores práticas TypeScript
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
  },
  overrides: [
    {
      // Regras específicas para arquivos de teste
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
      rules: {
        'no-console': 'off', // Permitir console.log em testes
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      }
    }
  ]
}