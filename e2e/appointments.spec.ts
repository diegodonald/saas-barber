import { test, expect } from '@playwright/test';

/**
 * Testes funcionais para o Sistema de Agendamentos
 * Valida operações CRUD e fluxos de status dos agendamentos
 */

test.describe('Sistema de Agendamentos', () => {

  test.beforeEach(async ({ page }) => {
    // Mock de autenticação como barbeiro
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            name: 'João Barbeiro',
            email: 'joao@barbershop.com',
            roles: ['BARBER'],
            barbershopId: 'barbershop-1'
          }
        })
      });
    });

    // Mock de agendamentos existentes
    await page.route('**/api/appointments**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET' && url.includes('/api/appointments?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            appointments: [
              {
                id: '1',
                barbershopId: 'barbershop-1',
                barberId: '1',
                clientId: 'client-1',
                serviceId: 'service-1',
                startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                totalPrice: 50.00,
                status: 'SCHEDULED',
                notes: 'Corte simples',
                client: { id: 'client-1', name: 'João Silva', email: 'joao@email.com' },
                service: { id: 'service-1', name: 'Corte Masculino', price: 50.00, duration: 60 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                id: '2',
                barbershopId: 'barbershop-1',  
                barberId: '1',
                clientId: 'client-2',
                serviceId: 'service-2',
                startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
                totalPrice: 80.00,
                status: 'CONFIRMED',
                notes: 'Corte e barba',
                client: { id: 'client-2', name: 'Carlos Santos', email: 'carlos@email.com' },
                service: { id: 'service-2', name: 'Corte + Barba', price: 80.00, duration: 90 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ],
            total: 2,
            hasMore: false
          })
        });
      }
    });

    // Mock de horários disponíveis
    await page.route('**/api/appointments/available-slots**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), available: true },
          { startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), available: true },
          { startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), available: false },
          { startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), available: true }
        ])
      });
    });

    // Simular token de autenticação
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
    });
  });

  test('deve listar agendamentos existentes', async ({ page }) => {
    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento da lista
    await page.waitForSelector('[data-testid="appointments-list"]');
    
    // Verificar se agendamentos são exibidos
    await expect(page.locator('[data-testid="appointment-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-2"]')).toBeVisible();
    
    // Verificar informações do primeiro agendamento
    const firstAppointment = page.locator('[data-testid="appointment-1"]');
    await expect(firstAppointment).toContainText('João Silva');
    await expect(firstAppointment).toContainText('Corte Masculino');
    await expect(firstAppointment).toContainText('R$ 50,00');
    await expect(firstAppointment).toContainText('AGENDADO');
  });

  test('deve criar novo agendamento', async ({ page }) => {
    // Mock para criação de agendamento
    await page.route('**/api/appointments', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '3',
            ...requestBody,
            status: 'SCHEDULED',
            totalPrice: 50.00,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Clicar no botão de novo agendamento
    await page.click('[data-testid="new-appointment-button"]');
    
    // Aguardar abertura do modal
    await page.waitForSelector('[data-testid="appointment-modal"]');
    
    // Preencher dados do agendamento
    await page.fill('[data-testid="client-select"]', 'João Silva');
    await page.selectOption('[data-testid="service-select"]', 'service-1');
    await page.fill('[data-testid="datetime-input"]', '2024-12-15T14:00');
    await page.fill('[data-testid="notes-input"]', 'Agendamento de teste');
    
    // Salvar agendamento
    await page.click('[data-testid="save-appointment-button"]');
    
    // Verificar se agendamento foi criado
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-modal"]')).not.toBeVisible();
  });

  test('deve alterar status do agendamento', async ({ page }) => {
    // Mock para confirmação de agendamento
    await page.route('**/api/appointments/1/confirm', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1',
            status: 'CONFIRMED',
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="appointment-1"]');
    
    // Abrir menu de ações do agendamento
    await page.click('[data-testid="appointment-1-actions"]');
    
    // Confirmar agendamento
    await page.click('[data-testid="confirm-appointment"]');
    
    // Verificar confirmação
    await expect(page.locator('[data-testid="status-confirmed"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Agendamento confirmado');
  });

  test('deve iniciar e completar serviço', async ({ page }) => {
    // Mock para iniciar serviço
    await page.route('**/api/appointments/2/start', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '2',
            status: 'IN_PROGRESS',
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    // Mock para completar serviço
    await page.route('**/api/appointments/2/complete', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '2',
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="appointment-2"]');
    
    // Iniciar serviço
    await page.click('[data-testid="appointment-2-actions"]');
    await page.click('[data-testid="start-service"]');
    
    // Verificar status alterado
    await expect(page.locator('[data-testid="status-in-progress"]')).toBeVisible();
    
    // Completar serviço
    await page.click('[data-testid="appointment-2-actions"]');
    await page.click('[data-testid="complete-service"]');
    
    // Preencher notas finais
    await page.fill('[data-testid="completion-notes"]', 'Serviço realizado com sucesso');
    await page.click('[data-testid="confirm-completion"]');
    
    // Verificar conclusão
    await expect(page.locator('[data-testid="status-completed"]')).toBeVisible();
  });

  test('deve cancelar agendamento', async ({ page }) => {
    // Mock para cancelamento
    await page.route('**/api/appointments/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Agendamento cancelado' })
        });
      }
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="appointment-1"]');
    
    // Cancelar agendamento
    await page.click('[data-testid="appointment-1-actions"]');
    await page.click('[data-testid="cancel-appointment"]');
    
    // Confirmar cancelamento
    await page.fill('[data-testid="cancellation-reason"]', 'Cliente não compareceu');
    await page.click('[data-testid="confirm-cancellation"]');
    
    // Verificar cancelamento
    await expect(page.locator('[data-testid="appointment-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Agendamento cancelado');
  });

  test('deve marcar cliente como faltoso', async ({ page }) => {
    // Mock para no-show
    await page.route('**/api/appointments/1/no-show', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            id: '1',
            status: 'NO_SHOW',
            updatedAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="appointment-1"]');
    
    // Marcar como faltoso
    await page.click('[data-testid="appointment-1-actions"]');
    await page.click('[data-testid="mark-no-show"]');
    
    // Confirmar ação
    await page.click('[data-testid="confirm-no-show"]');
    
    // Verificar status
    await expect(page.locator('[data-testid="status-no-show"]')).toBeVisible();
  });

  test('deve filtrar agendamentos por status', async ({ page }) => {
    await page.goto('http://localhost:3000/appointments');
    
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="appointments-filters"]');
    
    // Filtrar por agendamentos confirmados
    await page.selectOption('[data-testid="status-filter"]', 'CONFIRMED');
    await page.click('[data-testid="apply-filters"]');
    
    // Verificar filtro aplicado
    await expect(page.locator('[data-testid="appointment-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-1"]')).not.toBeVisible();
    
    // Limpar filtros
    await page.click('[data-testid="clear-filters"]');
    await expect(page.locator('[data-testid="appointment-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-2"]')).toBeVisible();
  });

  test('deve buscar agendamentos por cliente', async ({ page }) => {
    await page.goto('http://localhost:3000/appointments');
    
    // Buscar por nome do cliente
    await page.fill('[data-testid="client-search"]', 'João Silva');
    await page.click('[data-testid="search-button"]');
    
    // Verificar resultado da busca
    await expect(page.locator('[data-testid="appointment-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-2"]')).not.toBeVisible();
  });

  test('deve exibir horários disponíveis', async ({ page }) => {
    await page.goto('http://localhost:3000/appointments/new');
    
    // Selecionar barbeiro e serviço
    await page.selectOption('[data-testid="barber-select"]', '1');
    await page.selectOption('[data-testid="service-select"]', 'service-1');
    
    // Selecionar data
    await page.fill('[data-testid="date-input"]', '2024-12-15');
    
    // Aguardar carregamento de horários
    await page.waitForSelector('[data-testid="available-slots"]');
    
    // Verificar horários disponíveis e indisponíveis
    await expect(page.locator('[data-testid="slot-available"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="slot-unavailable"]')).toHaveCount(1);
  });

  test('deve validar dados obrigatórios no formulário', async ({ page }) => {
    await page.goto('http://localhost:3000/appointments/new');
    
    // Tentar salvar sem preencher dados
    await page.click('[data-testid="save-appointment-button"]');
    
    // Verificar validações
    await expect(page.locator('[data-testid="client-error"]')).toContainText('Cliente é obrigatório');
    await expect(page.locator('[data-testid="service-error"]')).toContainText('Serviço é obrigatório');
    await expect(page.locator('[data-testid="datetime-error"]')).toContainText('Data e hora são obrigatórias');
  });

  test('deve funcionar em diferentes tipos de usuário', async ({ page }) => {
    // Simular usuário CLIENT
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'client-1',
            name: 'João Cliente',
            email: 'cliente@email.com',
            roles: ['CLIENT']
          }
        })
      });
    });

    await page.goto('http://localhost:3000/appointments');
    
    // Verificar se interface de cliente é exibida
    await expect(page.locator('[data-testid="client-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-appointment-button"]')).toBeVisible();
    
    // Verificar se ações administrativas não estão disponíveis
    await expect(page.locator('[data-testid="admin-actions"]')).not.toBeVisible();
  });
}); 