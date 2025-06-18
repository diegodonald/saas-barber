import { expect, Page, test } from '@playwright/test';

/**
 * Testes E2E Completos - Sistema SaaS Barber
 * Utiliza todas as ferramentas do Playwright para validar o fluxo completo
 */

test.describe('🚀 Sistema SaaS Barber - Fluxo Completo', () => {
  // Dados de teste
  const testData = {
    owner: {
      email: 'owner@barbershop.com',
      password: 'Password123!',
      name: 'Proprietário Teste',
      barbershop: 'Barbearia Teste',
    },
    barber: {
      email: 'barbeiro@barbershop.com',
      password: 'Password123!',
      name: 'João Barbeiro',
      specialties: ['Corte', 'Barba'],
    },
    client: {
      email: 'cliente@email.com',
      password: 'Password123!',
      name: 'Carlos Cliente',
      phone: '11999999999',
    },
    service: {
      name: 'Corte Masculino',
      price: 50.0,
      duration: 60,
      category: 'Cabelo',
    },
    appointment: {
      date: '2025-06-20',
      time: '10:00',
      notes: 'Cliente prefere corte mais curto',
    },
  };

  let mockAppointments: any[] = [];
  let mockServices: any[] = [];
  let currentUser: any = null;

  // Setup antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Reset data
    mockAppointments = [];
    mockServices = [
      {
        id: 'service-1',
        name: testData.service.name,
        price: testData.service.price,
        duration: testData.service.duration,
        category: testData.service.category,
        isActive: true,
      },
    ];
    currentUser = null;

    // Configurar mocks de API
    await setupAPIMocks(page);
  });

  /**
   * 🔐 TESTE 1: Fluxo de Autenticação Completo
   */
  test('Verificação de Páginas: Registro e Login', async ({ page }) => {
    // === VERIFICAR PÁGINA DE REGISTRO ===
    await page.goto('/register');
    await expect(page).toHaveTitle(/SaaS Barber/);

    // Verificar se elementos básicos estão presentes
    await expect(page.locator('h2')).toContainText('Crie sua conta');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    console.log('✅ Página de registro carregada corretamente');

    // === VERIFICAR PÁGINA DE LOGIN ===
    await page.goto('/login');
    await expect(page).toHaveTitle(/SaaS Barber/);

    // Verificar se elementos básicos estão presentes
    await expect(page.locator('h2')).toContainText('Entre na sua conta');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    console.log('✅ Página de login carregada corretamente');

    // === VERIFICAR PÁGINA INICIAL ===
    await page.goto('/');
    await expect(page).toHaveTitle(/SaaS Barber/);
    await expect(page.locator('h1')).toContainText('SaaS Barber');

    console.log('✅ Página inicial carregada corretamente');
  });

  /**
   * 📋 TESTE 2: Gestão Completa de Serviços
   */
  test('Gestão de Serviços: Criar → Editar → Ativar/Desativar', async ({ page }) => {
    console.log('📋 Iniciando teste de gestão de serviços');

    // Login como proprietário
    await loginAs(page, 'ADMIN');

    // Navegar para serviços
    await page.click('[data-testid="nav-services"]');
    await expect(page).toHaveURL(/.*services.*/);

    // === CRIAR SERVIÇO ===
    await page.click('[data-testid="add-service-button"]');
    await page.fill('[data-testid="service-name"]', 'Barba Completa');
    await page.fill('[data-testid="service-price"]', '35.00');
    await page.fill('[data-testid="service-duration"]', '45');
    await page.selectOption('[data-testid="service-category"]', 'Barba');
    await page.fill('[data-testid="service-description"]', 'Serviço completo de barba');

    await page.click('[data-testid="save-service-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // Verificar serviço na lista
    await expect(page.locator('[data-testid="service-barba-completa"]')).toBeVisible();

    // === EDITAR SERVIÇO ===
    await page.click('[data-testid="edit-service-barba-completa"]');
    await page.fill('[data-testid="service-price"]', '40.00');
    await page.click('[data-testid="save-service-button"]');

    // Verificar preço atualizado
    await expect(page.locator('[data-testid="service-price-display"]')).toContainText('R$ 40,00');

    // === DESATIVAR/REATIVAR ===
    await page.click('[data-testid="toggle-service-barba-completa"]');
    await expect(page.locator('[data-testid="service-status-inactive"]')).toBeVisible();

    await page.click('[data-testid="toggle-service-barba-completa"]');
    await expect(page.locator('[data-testid="service-status-active"]')).toBeVisible();

    console.log('✅ Gestão de serviços validada');
  });

  /**
   * 👥 TESTE 3: Gestão de Barbeiros e Serviços por Barbeiro
   */
  test('Gestão de Barbeiros: Cadastrar → Associar Serviços → Definir Horários', async ({
    page,
  }) => {
    console.log('👥 Iniciando teste de gestão de barbeiros');

    await loginAs(page, 'ADMIN');

    // === CADASTRAR BARBEIRO ===
    await page.click('[data-testid="nav-barbers"]');
    await page.click('[data-testid="add-barber-button"]');

    await page.fill('[data-testid="barber-name"]', testData.barber.name);
    await page.fill('[data-testid="barber-email"]', testData.barber.email);
    await page.fill('[data-testid="barber-password"]', testData.barber.password);
    await page.fill('[data-testid="barber-specialties"]', testData.barber.specialties.join(', '));

    await page.click('[data-testid="save-barber-button"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

    // === ASSOCIAR SERVIÇOS ===
    await page.click('[data-testid="manage-barber-services"]');
    await page.check('[data-testid="service-checkbox-corte-masculino"]');
    await page.fill('[data-testid="custom-price-corte-masculino"]', '55.00');
    await page.click('[data-testid="save-barber-services"]');

    // === CONFIGURAR HORÁRIOS ===
    await page.click('[data-testid="manage-barber-schedule"]');

    // Segunda-feira
    await page.check('[data-testid="working-monday"]');
    await page.fill('[data-testid="start-time-monday"]', '08:00');
    await page.fill('[data-testid="end-time-monday"]', '18:00');
    await page.fill('[data-testid="break-start-monday"]', '12:00');
    await page.fill('[data-testid="break-end-monday"]', '13:00');

    await page.click('[data-testid="save-schedule"]');
    await expect(page.locator('[data-testid="schedule-saved-toast"]')).toBeVisible();

    console.log('✅ Gestão de barbeiros validada');
  });

  /**
   * 📅 TESTE 4: Fluxo Completo de Agendamento
   */
  test('Agendamento Completo: Buscar → Agendar → Confirmar → Finalizar', async ({ page }) => {
    console.log('📅 Iniciando teste de agendamento completo');

    await loginAs(page, 'CLIENT');

    // === BUSCAR HORÁRIOS DISPONÍVEIS ===
    await page.click('[data-testid="nav-appointments"]');
    await page.click('[data-testid="new-appointment-button"]');

    // Selecionar serviço
    await page.selectOption('[data-testid="service-select"]', 'service-1');

    // Selecionar barbeiro
    await page.selectOption('[data-testid="barber-select"]', 'barber-1');

    // Selecionar data
    await page.fill('[data-testid="appointment-date"]', testData.appointment.date);

    // Aguardar carregamento de horários
    await page.waitForSelector('[data-testid="available-slots"]');

    // Selecionar horário
    await page.click('[data-testid="time-slot-10-00"]');

    // Adicionar observações
    await page.fill('[data-testid="appointment-notes"]', testData.appointment.notes);

    // === CONFIRMAR AGENDAMENTO ===
    await page.click('[data-testid="confirm-appointment"]');

    // Verificar confirmação
    await expect(page.locator('[data-testid="appointment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-id"]')).toBeVisible();

    // Voltar para lista
    await page.click('[data-testid="back-to-appointments"]');

    // Verificar agendamento na lista
    await expect(page.locator('[data-testid="appointment-item"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="appointment-status"]').first()).toContainText(
      'Agendado'
    );
  });

  /**
   * 🎯 TESTE 5: Gestão de Status de Agendamento (Barbeiro)
   */
  test('Gestão de Status: Confirmar → Iniciar → Finalizar → Avaliar', async ({ page }) => {
    // Primeiro criar um agendamento como cliente
    await loginAs(page, 'CLIENT');
    await createTestAppointment(page);

    // Logout e login como barbeiro
    await logout(page);
    await loginAs(page, 'BARBER');

    // === VER AGENDAMENTOS DO DIA ===
    await page.click('[data-testid="nav-my-appointments"]');
    await expect(page.locator('[data-testid="appointment-item"]').first()).toBeVisible();

    // === CONFIRMAR AGENDAMENTO ===
    await page.click('[data-testid="confirm-appointment-btn"]');
    await expect(page.locator('[data-testid="appointment-status"]')).toContainText('Confirmado');

    // === INICIAR SERVIÇO ===
    await page.click('[data-testid="start-service-btn"]');
    await expect(page.locator('[data-testid="appointment-status"]')).toContainText('Em Progresso');

    // === FINALIZAR SERVIÇO ===
    await page.click('[data-testid="complete-service-btn"]');
    await page.fill('[data-testid="service-notes"]', 'Serviço executado conforme solicitado');
    await page.click('[data-testid="confirm-completion"]');

    await expect(page.locator('[data-testid="appointment-status"]')).toContainText('Concluído');

    console.log('✅ Gestão de status validada');
  });

  /**
   * 📊 TESTE 6: Dashboard e Métricas
   */
  test('Dashboard Completo: Métricas → Relatórios → Filtros', async ({ page }) => {
    console.log('📊 Iniciando teste de dashboard e métricas');

    await loginAs(page, 'ADMIN');

    // === VERIFICAR MÉTRICAS INICIAIS ===
    await page.goto('/dashboard');

    // Aguardar carregamento das métricas
    await page.waitForSelector('[data-testid="dashboard-metrics"]');

    // Verificar cards de métricas
    await expect(page.locator('[data-testid="metric-total-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-active-barbers"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-client-satisfaction"]')).toBeVisible();

    // === APLICAR FILTROS ===
    await page.selectOption('[data-testid="period-filter"]', 'last-month');
    await page.selectOption('[data-testid="barber-filter"]', 'all');
    await page.click('[data-testid="apply-filters"]');

    // Aguardar atualização
    await page.waitForSelector('[data-testid="metrics-updated"]');

    // === VISUALIZAR GRÁFICOS ===
    await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // === EXPORTAR RELATÓRIO ===
    await page.click('[data-testid="export-report-btn"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="confirm-export"]');

    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  /**
   * 🔧 TESTE 7: Configurações de Sistema
   */
  test('Configurações: Horários Globais → Exceções → Notificações', async ({ page }) => {
    console.log('🔧 Iniciando teste de configurações');

    await loginAs(page, 'ADMIN');

    // === CONFIGURAR HORÁRIOS GLOBAIS ===
    await page.click('[data-testid="nav-settings"]');
    await page.click('[data-testid="global-schedule-tab"]');

    // Segunda a Sexta
    for (let day = 1; day <= 5; day++) {
      await page.check(`[data-testid="open-day-${day}"]`);
      await page.fill(`[data-testid="open-time-${day}"]`, '08:00');
      await page.fill(`[data-testid="close-time-${day}"]`, '18:00');
      await page.fill(`[data-testid="lunch-start-${day}"]`, '12:00');
      await page.fill(`[data-testid="lunch-end-${day}"]`, '13:00');
    }

    await page.click('[data-testid="save-global-schedule"]');
    await expect(page.locator('[data-testid="schedule-saved"]')).toBeVisible();

    // === CRIAR EXCEÇÃO ===
    await page.click('[data-testid="exceptions-tab"]');
    await page.click('[data-testid="add-exception"]');

    await page.fill('[data-testid="exception-date"]', '2025-06-25');
    await page.selectOption('[data-testid="exception-type"]', 'CLOSED');
    await page.fill('[data-testid="exception-reason"]', 'Feriado Nacional');

    await page.click('[data-testid="save-exception"]');
    await expect(page.locator('[data-testid="exception-saved"]')).toBeVisible();

    console.log('✅ Configurações validadas');
  });

  /**
   * 🔍 TESTE 8: Busca e Filtros Avançados
   */
  test('Busca Avançada: Filtros → Ordenação → Paginação', async ({ page }) => {
    console.log('🔍 Iniciando teste de busca avançada');

    await loginAs(page, 'ADMIN');

    // === FILTROS DE AGENDAMENTOS ===
    await page.click('[data-testid="nav-appointments"]');

    // Filtrar por período
    await page.fill('[data-testid="filter-start-date"]', '2025-06-01');
    await page.fill('[data-testid="filter-end-date"]', '2025-06-30');

    // Filtrar por status
    await page.selectOption('[data-testid="filter-status"]', 'CONFIRMED');

    // Filtrar por barbeiro
    await page.selectOption('[data-testid="filter-barber"]', 'barber-1');

    // Aplicar filtros
    await page.click('[data-testid="apply-filters"]');

    // === ORDENAÇÃO ===
    await page.click('[data-testid="sort-by-date"]');
    await page.click('[data-testid="sort-order-desc"]');

    // === BUSCA POR TEXTO ===
    await page.fill('[data-testid="search-input"]', 'Carlos');
    await page.click('[data-testid="search-button"]');

    // Verificar resultados
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // === PAGINAÇÃO ===
    if (await page.locator('[data-testid="pagination-next"]').isVisible()) {
      await page.click('[data-testid="pagination-next"]');
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ Busca avançada validada');
  });

  /**
   * 📱 TESTE 9: Responsividade Mobile
   */
  test('Responsividade: Mobile → Tablet → Desktop', async ({ page }) => {
    console.log('📱 Iniciando teste de responsividade');

    await loginAs(page, 'CLIENT');

    // === MOBILE (375x667) ===
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // === TABLET (768x1024) ===
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // === DESKTOP (1920x1080) ===
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    console.log('✅ Responsividade validada');
  });

  /**
   * ⚡ TESTE 10: Performance e Acessibilidade
   */
  test('Performance e Acessibilidade: Lighthouse → A11y', async ({ page }) => {
    console.log('⚡ Iniciando teste de performance e acessibilidade');

    await loginAs(page, 'CLIENT');

    // === VERIFICAR ACESSIBILIDADE ===
    await page.goto('/dashboard');

    // Verificar elementos com labels apropriados
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const hasLabel =
          (await button.getAttribute('aria-label')) ||
          (await button.textContent()) ||
          (await button.getAttribute('title'));
        expect(hasLabel).toBeTruthy();
      }
    }

    // Verificar contraste e navegação por teclado
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  // === FUNÇÕES AUXILIARES ===

  async function setupAPIMocks(page: Page) {
    // Mock de autenticação
    await page.route('**/api/auth/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/login') && method === 'POST') {
        const body = route.request().postDataJSON();

        // Determinar tipo de usuário baseado no email
        let role = 'CLIENT';
        if (body.email.includes('admin') || body.email.includes('owner')) {
          role = 'ADMIN';
        } else if (body.email.includes('barbeiro') || body.email.includes('barber')) {
          role = 'BARBER';
        }

        currentUser = {
          id: `user-${role.toLowerCase()}`,
          email: body.email,
          name:
            role === 'ADMIN'
              ? 'Admin Teste'
              : role === 'BARBER'
              ? 'João Barbeiro'
              : 'Carlos Cliente',
          role: role,
          barbershopId: 'barbershop-1',
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: currentUser,
              accessToken: 'valid-jwt-token',
              refreshToken: 'valid-refresh-token',
            },
          }),
        });
      } else if (url.includes('/register') && method === 'POST') {
        const body = route.request().postDataJSON();
        currentUser = {
          id: 'new-user-id',
          ...body,
          role: 'CLIENT',
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { user: currentUser, accessToken: 'jwt', refreshToken: 'refresh' },
          }),
        });
      } else if (url.includes('/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { user: currentUser },
          }),
        });
      }
    });

    // Mock de agendamentos
    await page.route('**/api/appointments**', async route => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockAppointments,
          }),
        });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newAppointment = {
          id: `appointment-${Date.now()}`,
          ...body,
          status: 'SCHEDULED',
          client: currentUser,
          createdAt: new Date().toISOString(),
        };
        mockAppointments.push(newAppointment);

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: newAppointment,
          }),
        });
      }
    });

    // Mock de serviços
    await page.route('**/api/services**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockServices,
        }),
      });
    });

    // Mock de métricas
    await page.route('**/api/dashboard/metrics**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalAppointments: mockAppointments.length,
            totalRevenue: mockAppointments.length * 50,
            activeBarbers: 3,
            clientSatisfaction: 4.5,
          },
        }),
      });
    });
  }

  async function loginAs(page: Page, role: 'ADMIN' | 'BARBER' | 'CLIENT') {
    const credentials = {
      ADMIN: { email: 'admin@barbershop.com', password: 'Password123!' },
      BARBER: { email: 'barbeiro@barbershop.com', password: 'Password123!' },
      CLIENT: { email: 'cliente@email.com', password: 'Password123!' },
    };

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', credentials[role].email);
    await page.fill('[data-testid="password-input"]', credentials[role].password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard.*/);
  }

  async function logout(page: Page) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*login.*/);
  }

  async function createTestAppointment(page: Page) {
    await page.click('[data-testid="nav-appointments"]');
    await page.click('[data-testid="new-appointment-button"]');
    await page.selectOption('[data-testid="service-select"]', 'service-1');
    await page.selectOption('[data-testid="barber-select"]', 'barber-1');
    await page.fill('[data-testid="appointment-date"]', testData.appointment.date);
    await page.click('[data-testid="time-slot-10-00"]');
    await page.click('[data-testid="confirm-appointment"]');
    await expect(page.locator('[data-testid="appointment-success"]')).toBeVisible();
  }
});
