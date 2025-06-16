module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    // React específico
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react-hooks/exhaustive-deps': 'warn', // Mudança: era 'off'
    
    // TypeScript - Configurações mais restritivas 
    '@typescript-eslint/no-explicit-any': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true 
    }], // Mudança: era 'off'
    '@typescript-eslint/ban-ts-comment': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-non-null-assertion': 'warn', // Mudança: era 'off'
    '@typescript-eslint/no-empty-function': 'warn', // Mudança: era 'off'
    '@typescript-eslint/ban-types': 'warn', // Mudança: era 'off'
    
    // Código geral - Melhores práticas
    'no-console': 'warn', // Mudança: era 'off'
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    
    // React melhores práticas
    'jsx-quotes': ['error', 'prefer-double'],
    'react/jsx-no-undef': 'off', // TypeScript já faz essa verificação
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [
    {
      // Regras específicas para arquivos de teste
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      }
    }
  ]
}