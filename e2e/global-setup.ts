import { chromium, FullConfig } from '@playwright/test';

/**
 * Configuração global executada antes de todos os testes
 * Útil para preparar dados de teste, autenticação, etc.
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');
  
  // Aguardar um pouco para garantir que os serviços estejam prontos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Aqui podemos adicionar lógica adicional de setup se necessário
  // Por exemplo: limpar/preparar dados de teste, validar serviços, etc.
  
  console.log('✅ Setup global concluído!');
}

export default globalSetup; 