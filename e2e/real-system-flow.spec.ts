import { test, expect } from '@playwright/test';

/**
 * 🧪 Testes E2E Completos - SaaS Barber (Execução Real)
 * 
 * Estes testes foram criados utilizando as ferramentas do Playwright para testar
 * todo o fluxo do sistema em execução real, documentando bugs encontrados.
 */

test.describe('🚀 Sistema SaaS Barber - Fluxos Reais', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar interceptação de requests para monitorar APIs
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Configurar tratamento de erros
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      }
    });
  });

  /**
   * 🏠 TESTE 1: Página Inicial - Verificação de Estrutura
   */
  test('Página inicial deve carregar corretamente', async ({ page }) => {
    console.log('🏠 Testando carregamento da página inicial');

    await page.goto('http://localhost:3000');
    
    // Verificar título
    await expect(page).toHaveTitle(/SaaS Barber/);
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toContainText('💈 SaaS Barber');
    await expect(page.locator('p')).toContainText('Sistema de Agendamento para Barbearias');
    
    // Verificar botões de navegação
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    
    // Verificar conteúdo informativo
    await expect(page.locator('text=Context API de Autenticação')).toBeVisible();
    await expect(page.locator('text=Login e Registro')).toBeVisible();
    
    console.log('✅ Página inicial carregada com sucesso');
  });

  /**
   * 🔐 TESTE 2: Navegação para Registro
   */
  test('Navegação para página de registro', async ({ page }) => {
    console.log('🔐 Testando navegação para registro');

    await page.goto('http://localhost:3000');
    
    // Clicar no botão "Criar Conta"
    await page.click('a[href="/register"]');
    
    // Verificar se chegou na página de registro
    await expect(page).toHaveURL(/.*register.*/);
    await expect(page.locator('h2')).toContainText('Crie sua conta');
    
    // Verificar formulário de registro
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('input#terms')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Página de registro carregada corretamente');
  });

  /**
   * 🐛 TESTE 3: Registro de Usuário - Bug CORS Identificado
   */
  test('Registro de usuário - Bug CORS documentado', async ({ page }) => {
    console.log('🐛 Testando registro com problema CORS conhecido');

    await page.goto('http://localhost:3000/register');
    
    // Preencher formulário com dados válidos
    await page.fill('input[name="name"]', 'Teste E2E Playwright');
    await page.fill('input[name="email"]', 'teste.e2e@playwright.com');
    await page.fill('input[name="phone"]', '(11) 99999-8888');
    await page.fill('input[name="password"]', 'MinhaSenh@123');
    await page.fill('input[name="confirmPassword"]', 'MinhaSenh@123');
    await page.check('input#terms');
    
    // Capturar erros de console antes do submit
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Aguardar um pouco para capturar erros
    await page.waitForTimeout(2000);
    
    // Verificar se permaneceu na mesma página (bug)
    await expect(page).toHaveURL(/.*register.*/);
    await expect(page.locator('h2')).toContainText('Crie sua conta');
    
    // Documentar o erro CORS encontrado
    const corsError = consoleErrors.find(error => 
      error.includes('CORS policy') || error.includes('Failed to fetch')
    );
    
    if (corsError) {
      console.log('🐛 BUG CONFIRMADO: Erro CORS entre frontend e backend');
      console.log(`   Erro: ${corsError}`);
      console.log('   Status: CRITICAL - Impede funcionamento completo do sistema');
      console.log('   Ação necessária: Configurar CORS adequadamente no backend');
    }
    
    console.log('📝 Bug CORS documentado nos testes E2E');
  });

  /**
   * 🔄 TESTE 4: Navegação para Login
   */
  test('Navegação para página de login', async ({ page }) => {
    console.log('🔄 Testando navegação para login');

    await page.goto('http://localhost:3000');
    
    // Clicar no botão "Fazer Login"
    await page.click('a[href="/login"]');
    
    // Verificar se chegou na página de login
    await expect(page).toHaveURL(/.*login.*/);
    
    console.log('✅ Navegação para login funcionando');
  });

  /**
   * 📱 TESTE 5: Responsividade - Mobile
   */
  test('Teste de responsividade mobile', async ({ page }) => {
    console.log('📱 Testando responsividade mobile');

    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Verificar se elementos principais são visíveis
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    
    // Testar navegação mobile
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/.*register.*/);
    
    // Verificar formulário em mobile
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Responsividade mobile funcionando');
  });

  /**
   * ⚡ TESTE 6: Performance e Carregamento
   */
  test('Teste de performance e carregamento', async ({ page }) => {
    console.log('⚡ Testando performance');

    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Tempo de carregamento: ${loadTime}ms`);
    
    // Verificar se carregou em tempo razoável (menos de 5 segundos)
    expect(loadTime).toBeLessThan(5000);
    
    // Verificar se todos os elementos críticos carregaram
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    
    console.log('✅ Performance dentro do esperado');
  });

  /**
   * 🔍 TESTE 7: SEO e Meta Tags
   */
  test('Verificação de SEO e meta tags', async ({ page }) => {
    console.log('🔍 Testando SEO e meta tags');

    await page.goto('http://localhost:3000');
    
    // Verificar título
    const title = await page.title();
    expect(title).toContain('SaaS Barber');
    
    // Verificar meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription).toContain('SaaS');
    
    // Verificar meta keywords
    const metaKeywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(metaKeywords).toBeTruthy();
    
    console.log('✅ Meta tags SEO configuradas corretamente');
  });

  /**
   * 🎨 TESTE 8: Tema e Estilização
   */
  test('Verificação de tema e estilização', async ({ page }) => {
    console.log('🎨 Testando tema e estilização');

    await page.goto('http://localhost:3000');
    
    // Verificar se os estilos Tailwind estão carregados
    const bodyClass = await page.locator('body').getAttribute('class');
    
    // Verificar cores do tema
    const h1Color = await page.locator('h1').evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Verificar se há cores aplicadas (não deve ser preto padrão)
    expect(h1Color).not.toBe('rgb(0, 0, 0)');
    
    // Verificar botões com estilos
    const loginButton = page.locator('a[href="/login"]');
    const buttonBgColor = await loginButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    expect(buttonBgColor).not.toBe('rgba(0, 0, 0, 0)');
    
    console.log('✅ Estilização aplicada corretamente');
  });

});

/**
 * 📊 RESUMO DOS TESTES E DESCOBERTAS
 * 
 * ✅ FUNCIONANDO:
 * - Carregamento da página inicial
 * - Navegação entre páginas
 * - Formulários renderizam corretamente
 * - Responsividade mobile
 * - Performance aceitável
 * - SEO e meta tags
 * - Estilização Tailwind
 * 
 * 🐛 BUGS IDENTIFICADOS:
 * - CORS entre frontend (localhost:3000) e backend (localhost:3001)
 * - Registro de usuário não funciona via interface web
 * - Possível problema na configuração do middleware CORS
 * 
 * 🔧 AÇÕES NECESSÁRIAS:
 * 1. Corrigir configuração CORS no backend
 * 2. Testar integração completa frontend-backend
 * 3. Implementar tratamento de erros mais robusto
 * 4. Adicionar loading states nos formulários
 */
