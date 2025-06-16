import { test, expect } from '@playwright/test';

/**
 * Teste de Debug para entender problemas na aplicação
 */

test.describe('Debug - Verificação Geral', () => {
  
  test('deve carregar página inicial', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou
    await expect(page.locator('h1')).toContainText('SaaS Barber');
    
    // Tirar screenshot para depuração
    await page.screenshot({ path: 'debug-home.png' });
  });

  test('deve ter serviços rodando', async ({ page }) => {
    // Testar se frontend responde
    const response = await page.request.get('http://localhost:3000/');
    expect(response.status()).toBe(200);
    
    // Testar se backend responde
    const backendResponse = await page.request.get('http://localhost:3001/health');
    console.log('Backend status:', backendResponse.status());
  });

  test('deve navegar para dashboard com mock', async ({ page }) => {
    // Mock completo da autenticação
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      console.log('API Call:', url);
      
      if (url.includes('/auth/me') || url.includes('/auth/verify')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: '1',
              name: 'João Barbeiro',
              email: 'joao@barbershop.com',
              roles: ['BARBER']
            }
          })
        });
      } else if (url.includes('/dashboard/metrics') || url.includes('/appointments/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            todayAppointments: 8,
            weekRevenue: 1350,
            totalClients: 45,
            monthlyAppointments: 45
          })
        });
      } else {
        await route.continue();
      }
    });

    // Configurar localStorage
    await page.addInitScript(() => {
      localStorage.setItem('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0ZXN0IiwiaWF0IjoxNjM5NTQwODAwLCJleHAiOjE5NTQ5MDA4MDAsImF1ZCI6InRlc3QiLCJzdWIiOiIxIiwidXNlcklkIjoiMSIsInJvbGVzIjpbIkJBUkJFUiJdfQ.test');
      localStorage.setItem('refreshToken', 'refresh-test-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: 'João Barbeiro',
        email: 'joao@barbershop.com',
        roles: ['BARBER']
      }));
    });

    // Navegar para dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Aguardar um pouco
    await page.waitForTimeout(2000);
    
    // Verificar URL atual
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Tirar screenshot
    await page.screenshot({ path: 'debug-dashboard.png' });
    
    // Verificar o conteúdo da página
    const bodyText = await page.textContent('body');
    console.log('Page content:', bodyText?.substring(0, 500));
    
    // Verificar localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    console.log('Token:', token);
    console.log('User:', user);
    
    // Verificar se há elementos básicos
    const hasH1 = await page.locator('h1').count();
    const hasButtons = await page.locator('button').count();
    console.log('H1 count:', hasH1);
    console.log('Button count:', hasButtons);
    
    // Procurar por data-testids
    const testIds = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-testid]');
      return Array.from(elements).map(el => el.getAttribute('data-testid'));
    });
    console.log('Data-testids found:', testIds);
  });
}); 