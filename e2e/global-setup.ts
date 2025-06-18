import { FullConfig } from '@playwright/test';

/**
 * Configuração global executada antes de todos os testes
 * Útil para preparar dados de teste, autenticação, etc.
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Aguardar um pouco para garantir que os serviços estejam prontos
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verificar se o backend está respondendo
  try {
    console.log('🔍 Verificando saúde do backend...');
    const response = await fetch('http://localhost:3001/health');
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    const health = await response.json();
    console.log('✅ Backend está saudável:', health.status);
  } catch (error) {
    console.error('❌ Erro ao verificar backend:', error);
    throw new Error('Backend não está disponível para os testes');
  }

  // Verificar se o frontend está respondendo
  try {
    console.log('🔍 Verificando saúde do frontend...');
    const response = await fetch('http://localhost:3000');
    if (!response.ok) {
      throw new Error(`Frontend health check failed: ${response.status}`);
    }
    console.log('✅ Frontend está saudável');
  } catch (error) {
    console.error('❌ Erro ao verificar frontend:', error);
    throw new Error('Frontend não está disponível para os testes');
  }

  // Verificar se o endpoint de teste da API está funcionando
  try {
    console.log('🔍 Verificando endpoint de teste da API...');
    const response = await fetch('http://localhost:3001/api/test');
    if (!response.ok) {
      console.warn(`⚠️ Endpoint de teste retornou: ${response.status}`);
    } else {
      const data = await response.json();
      console.log('✅ Endpoint de teste funcionando:', data.message);
    }
  } catch (error) {
    console.warn('⚠️ Endpoint de teste não disponível:', error);
  }

  console.log('✅ Setup global concluído!');
}

export default globalSetup;
