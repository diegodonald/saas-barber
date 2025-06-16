#!/usr/bin/env node

/**
 * Script para otimizar e limpar console.log desnecessários nos testes E2E
 * Mantém apenas logs essenciais para debugging
 */

const fs = require('fs');
const path = require('path');

// Lista de arquivos E2E para limpar
const e2eFiles = [
  'e2e/complete-flow-live.spec.ts',
  'e2e/complete-system-flow.spec.ts', 
  'e2e/debug.spec.ts',
  'e2e/e2e-flow.spec.ts',
  'e2e/real-system-flow.spec.ts',
  'e2e/test-runner.ts'
];

// Padrões de console.log que devem ser mantidos (essenciais)
const keepPatterns = [
  /console\.log\('\s*🐛.*CONFIRMADO.*'\)/i, // Bugs documentados
  /console\.log\('\s*📊.*Tempo de carregamento.*'\)/i, // Métricas de performance
  /console\.log\('\s*⚡.*Performance.*'\)/i, // Performance críticas
];

// Padrões de console.log que devem ser removidos (debug desnecessário)
const removePatterns = [
  /console\.log\('\s*🏠.*Testando.*'\);?$/gm,
  /console\.log\('\s*🔐.*Iniciando.*'\);?$/gm,
  /console\.log\('\s*✅.*validado.*'\);?$/gm,
  /console\.log\('\s*🎯.*Iniciando.*'\);?$/gm,
  /console\.log\('\s*📱.*Testando.*'\);?$/gm,
  /console\.log\('.*count.*'\);?$/gm,
  /console\.log\('Token:.*'\);?$/gm,
  /console\.log\('User:.*'\);?$/gm,
  /console\.log\('Current URL:.*'\);?$/gm,
  /console\.log\('Page content:.*'\);?$/gm,
];

function cleanConsoleLogsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let removedCount = 0;

  // Aplicar padrões de remoção
  removePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      removedCount += matches.length;
      content = content.replace(pattern, '');
    }
  });

  // Remover linhas vazias excessivas deixadas pela remoção
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🧹 ${filePath}: ${removedCount} console.log removidos`);
  } else {
    console.log(`✅ ${filePath}: Já otimizado`);
  }
}

function main() {
  console.log('🚀 Iniciando limpeza de console.log nos testes E2E...\n');

  e2eFiles.forEach(cleanConsoleLogsInFile);

  console.log('\n✅ Limpeza concluída!');
  console.log('💡 Dica: Execute "npm run lint:fix" para aplicar outras correções automáticas');
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogsInFile };