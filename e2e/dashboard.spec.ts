import { test, expect } from '@playwright/test';

/**
 * Testes funcionais para o Dashboard
 * Valida a exibição de métricas reais do sistema de agendamentos
 */

test.describe('Dashboard - Métricas de Agendamentos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Interceptar chamadas da API para teste controlado
    await page.route('**/api/appointments/stats', async (route) => {
      const url = new URL(route.request().url());
      const params = url.searchParams;
      
      // Simular respostas baseadas nos filtros de data
      if (params.get('startDate') === params.get('endDate')) {
        // Estatísticas do dia
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 8,
            scheduled: 3,
            confirmed: 2,
            completed: 2,
            cancelled: 1,
            noShow: 0,
            totalRevenue: 240.00,
            averagePrice: 30.00
          })
        });
      } else if (params.get('startDate')?.includes(new Date().getFullYear().toString())) {
        // Estatísticas da semana ou mês
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 45,
            scheduled: 15,
            confirmed: 12,
            completed: 15,
            cancelled: 2,
            noShow: 1,
            totalRevenue: 1350.00,
            averagePrice: 30.00
          })
        });
      }
    });

    // Mock do endpoint de autenticação
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: '1',
              name: 'João Barbeiro',
              email: 'joao@barbershop.com',
              role: 'BARBER'
            }
          }
        })
      });
    });

    // Mock das APIs de métricas do dashboard
    await page.route('**/api/dashboard/metrics', async (route) => {
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
    });

    // Simular token de autenticação diretamente no localStorage
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-jwt-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
    });

    // Navegar diretamente para o dashboard
    await page.goto('http://localhost:3000/dashboard');
  });

  test('deve exibir métricas do dashboard corretamente', async ({ page }) => {
    // Aguardar o carregamento das métricas
    await page.waitForSelector('[data-testid="dashboard-metrics"]', { timeout: 10000 });
    
    // Verificar se as métricas são exibidas
    const todayAppointments = page.locator('[data-testid="metric-today-appointments"]');
    const weekRevenue = page.locator('[data-testid="metric-week-revenue"]');
    const totalClients = page.locator('[data-testid="metric-total-clients"]');
    const monthlyAppointments = page.locator('[data-testid="metric-monthly-appointments"]');
    
    // Aguardar que os elementos existam
    await expect(todayAppointments).toBeVisible();
    await expect(weekRevenue).toBeVisible();
    await expect(totalClients).toBeVisible();
    await expect(monthlyAppointments).toBeVisible();
    
    // Validar exibição dos valores
    await expect(todayAppointments).toContainText('8');
    await expect(weekRevenue).toContainText('1.350');
    await expect(totalClients).toContainText('45');
    await expect(monthlyAppointments).toContainText('45');
  });

  test('deve exibir skeleton loading durante carregamento', async ({ page }) => {
    // Interceptar API com delay para testar loading
    await page.route('**/api/dashboard/metrics', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          todayAppointments: 5,
          weekRevenue: 150,
          totalClients: 15,
          monthlyAppointments: 25
        })
      });
    });

    await page.goto('http://localhost:3000/dashboard');
    
    // Verificar se skeleton loading é exibido
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Aguardar carregamento completo
    await page.waitForSelector('[data-testid="dashboard-metrics"]', { timeout: 5000 });
    
    // Verificar se skeleton desapareceu
    await expect(page.locator('.animate-pulse')).not.toBeVisible();
  });

  test('deve exibir erro quando API falha', async ({ page }) => {
    // Simular erro na API
    await page.route('**/api/dashboard/metrics', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erro interno do servidor' })
      });
    });

    await page.goto('http://localhost:3000/dashboard');
    
    // Aguardar um pouco para a tentativa de carregamento falhar
    await page.waitForTimeout(2000);
    
    // Verificar se mensagem de erro é exibida
    await expect(page.locator('[data-testid="stats-error-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-error-banner"]')).toContainText('Erro ao carregar estatísticas');
  });

  test('deve navegar entre seções do dashboard', async ({ page }) => {
    // Aguardar carregamento completo
    await page.waitForSelector('[data-testid="navigation-menu"]', { timeout: 10000 });
    
    // Testar navegação para horários
    await page.click('[data-testid="nav-schedule"]');
    await expect(page.locator('[data-testid="schedule-manager"]')).toBeVisible({ timeout: 10000 });
    
    // Voltar para dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible({ timeout: 10000 });
    
    // Testar navegação para serviços
    await page.click('[data-testid="nav-services"]');
    await expect(page.locator('[data-testid="barber-service-manager"]')).toBeVisible({ timeout: 10000 });
  });

  test('deve adaptar interface baseada no role do usuário', async ({ page }) => {
    // Mock do endpoint de autenticação para usuário ADMIN
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: '1',
              name: 'Admin User',
              email: 'admin@barbershop.com',
              role: 'ADMIN'
            }
          }
        })
      });
    });

    await page.goto('http://localhost:3000/dashboard');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="navigation-menu"]', { timeout: 10000 });
    
    // Verificar se opções de admin estão visíveis
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role-badge"]')).toContainText('Administrador');
  });

  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    // Simular viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="dashboard-metrics"]', { timeout: 10000 });
    
    // Verificar se layout móvel está adequado
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible();
    
    // Verificar se sidebar é colapsável
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await expect(page.locator('[data-testid="sidebar-collapsed"]')).toBeVisible();
    }
  });

  test('deve realizar logout com sucesso', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="logout-button"]', { timeout: 10000 });
    
    // Clicar em logout
    await page.click('[data-testid="logout-button"]');
    
    // Verificar redirecionamento para página inicial ou login
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    
    // Verificar se não há mais elementos do dashboard
    await expect(page.locator('[data-testid="dashboard-metrics"]')).not.toBeVisible();
  });
}); 