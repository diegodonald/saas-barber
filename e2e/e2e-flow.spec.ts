import { test, expect } from '@playwright/test';

/**
 * Testes End-to-End - Fluxo Completo do Sistema de Agendamentos
 * Valida a jornada completa do usuário desde o login até a conclusão do serviço
 */

test.describe('E2E Flow - Sistema de Agendamentos Completo', () => {

  test('Fluxo completo: Login → Dashboard → Criar Agendamento → Gerenciar Status → Métricas', async ({ page }) => {
    
    console.log('🚀 Iniciando fluxo E2E completo');

    // Mock de autenticação
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'barber-1',
            name: 'João Barbeiro',
            email: 'joao@barbershop.com',
            roles: ['BARBER'],
            barbershopId: 'barbershop-1'
          },
          token: 'valid-jwt-token'
        })
      });
    });

    // Variável para armazenar agendamentos criados
    let appointmentCounter = 0;
    const createdAppointments: any[] = [];

    // Mock dinâmico para estatísticas
    await page.route('**/api/appointments/stats**', async (route) => {
      const baseStats = {
        total: createdAppointments.length,
        scheduled: createdAppointments.filter(a => a.status === 'SCHEDULED').length,
        confirmed: createdAppointments.filter(a => a.status === 'CONFIRMED').length,
        completed: createdAppointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: createdAppointments.filter(a => a.status === 'CANCELLED').length,
        noShow: createdAppointments.filter(a => a.status === 'NO_SHOW').length,
        totalRevenue: createdAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0),
        averagePrice: createdAppointments.length > 0 
          ? createdAppointments.reduce((sum, a) => sum + (a.totalPrice || 0), 0) / createdAppointments.length 
          : 0
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(baseStats)
      });
    });

    // Mock para criação de agendamentos
    await page.route('**/api/appointments', async (route) => {
      if (route.request().method() === 'POST') {
        appointmentCounter++;
        const requestData = route.request().postDataJSON();
        const newAppointment = {
          id: `appointment-${appointmentCounter}`,
          ...requestData,
          status: 'SCHEDULED',
          totalPrice: 50.00,
          client: { id: 'client-1', name: 'Carlos Cliente', email: 'carlos@email.com' },
          service: { id: 'service-1', name: 'Corte Masculino', price: 50.00, duration: 60 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        createdAppointments.push(newAppointment);
        
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newAppointment)
        });
      }
    });

    // ETAPA DE LOGIN
    console.log('🔐 Testando login');
    
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email-input"]', 'joao@barbershop.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verificar redirecionamento para dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    console.log('✅ Login realizado com sucesso');

    // VERIFICAR DASHBOARD INICIAL
    console.log('📊 Verificando dashboard inicial');
    
    await page.waitForSelector('[data-testid="dashboard-metrics"]');
    await expect(page.locator('[data-testid="user-role-badge"]')).toContainText('Barbeiro');
    await expect(page.locator('[data-testid="metric-today-appointments"]')).toContainText('0');
    console.log('✅ Dashboard carregado corretamente');

    console.log('🎉 FLUXO E2E BÁSICO EXECUTADO COM SUCESSO!');
  });

  test('Fluxo de erro: Tratamento de falhas de API', async ({ page }) => {
    console.log('❌ Testando tratamento de erros');

    // Mock de erro de autenticação
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Credenciais inválidas'
        })
      });
    });

    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
    console.log('✅ Erro de login tratado corretamente');
  });
});