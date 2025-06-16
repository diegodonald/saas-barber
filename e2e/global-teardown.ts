import { FullConfig } from '@playwright/test';

/**
 * Limpeza global executada após todos os testes
 * Útil para limpeza de dados de teste, fechamento de conexões, etc.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');
  
  // Aqui podemos adicionar lógica de limpeza se necessário
  // Por exemplo: limpar dados de teste, fechar conexões de BD, etc.
  
  console.log('✅ Limpeza global concluída!');
}

export default globalTeardown; 