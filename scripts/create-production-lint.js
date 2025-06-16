#!/usr/bin/env node

/**
 * Script para criar configuração de lint mais tolerante para produção
 * Permite warnings mas mantém os erros críticos
 */

const fs = require('fs');
const path = require('path');

class ProductionLintConfig {
  constructor() {
    this.backendPath = path.join(__dirname, '..', 'backend');
    this.frontendPath = path.join(__dirname, '..', 'frontend');
  }

  createBackendConfig() {
    const config = {
      extends: [
        '@typescript-eslint/recommended',
        'prettier'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        // Permitir any em casos específicos
        '@typescript-eslint/no-explicit-any': 'warn',
        
        // Permitir console em desenvolvimento
        'no-console': 'warn',
        
        // Permitir funções sem tipo de retorno
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
        
        // Permitir non-null assertions com cuidado
        '@typescript-eslint/no-non-null-assertion': 'warn',
        
        // Permitir @ts-ignore
        '@typescript-eslint/ban-ts-comment': 'warn',
        
        // Permitir variáveis não utilizadas com _
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ],
        
        // Permitir expressões não utilizadas
        'no-unused-expressions': 'warn',
        
        // Permitir funções vazias
        '@typescript-eslint/no-empty-function': 'warn'
      },
      env: {
        node: true,
        es2022: true,
        jest: true
      },
      ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.js'
      ]
    };

    fs.writeFileSync(
      path.join(this.backendPath, '.eslintrc.production.js'),
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );
    
    console.log('✅ Configuração backend (produção) criada');
  }

  createFrontendConfig() {
    const config = {
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json'
      },
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      rules: {
        // Permitir any com warnings
        '@typescript-eslint/no-explicit-any': 'warn',
        
        // Permitir console
        'no-console': 'warn',
        
        // Permitir variáveis não utilizadas com _
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ],
        
        // React específico
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        
        // Permitir non-null assertions
        '@typescript-eslint/no-non-null-assertion': 'warn',
        
        // Permitir @ts-ignore
        '@typescript-eslint/ban-ts-comment': 'warn'
      },
      settings: {
        react: {
          version: 'detect'
        }
      },
      env: {
        browser: true,
        es2022: true,
        node: true
      },
      ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.js'
      ]
    };

    fs.writeFileSync(
      path.join(this.frontendPath, '.eslintrc.production.cjs'),
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );
    
    console.log('✅ Configuração frontend (produção) criada');
  }

  updatePackageJsonScripts() {
    // Backend
    const backendPackagePath = path.join(this.backendPath, 'package.json');
    if (fs.existsSync(backendPackagePath)) {
      const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
      backendPackage.scripts = {
        ...backendPackage.scripts,
        'lint:production': 'eslint src --ext .ts --config .eslintrc.production.js',
        'lint:strict': 'eslint src --ext .ts --max-warnings 0'
      };
      fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2));
      console.log('✅ Scripts backend atualizados');
    }

    // Frontend
    const frontendPackagePath = path.join(this.frontendPath, 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      frontendPackage.scripts = {
        ...frontendPackage.scripts,
        'lint:production': 'eslint . --ext ts,tsx --config .eslintrc.production.cjs',
        'lint:strict': 'eslint . --ext ts,tsx --max-warnings 0'
      };
      fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackage, null, 2));
      console.log('✅ Scripts frontend atualizados');
    }
  }

  async run() {
    console.log('🚀 Criando configurações de produção...\n');
    
    this.createBackendConfig();
    this.createFrontendConfig();
    this.updatePackageJsonScripts();
    
    console.log('\n📊 Configurações criadas com sucesso!');
    console.log('\n🔧 Comandos disponíveis:');
    console.log('• npm run lint:production - Lint tolerante para produção');
    console.log('• npm run lint:strict - Lint rigoroso para desenvolvimento');
    console.log('• npm run lint - Configuração atual');
    
    console.log('\n✅ Para testar:');
    console.log('cd backend && npm run lint:production');
    console.log('cd frontend && npm run lint:production');
  }
}

if (require.main === module) {
  const config = new ProductionLintConfig();
  config.run().catch(console.error);
}

module.exports = ProductionLintConfig;
