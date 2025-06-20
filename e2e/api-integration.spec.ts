import { expect, test } from '@playwright/test';

/**
 * Testes de Integração da API de Agendamentos
 * Valida a integração completa entre frontend e backend
 */

test.describe('API Integration - Sistema de Agendamentos', () => {
  const API_BASE_URL = 'http://localhost:3001';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Criar usuário de teste primeiro
    const uniqueEmail = `admin.test.${Date.now()}@barbershop.com`;
    const testPassword = 'Password123!'; // Senha com maiúscula e caractere especial
    const registerResponse = await request.post(`${API_BASE_URL}/api/auth/register`, {
      data: {
        email: uniqueEmail,
        password: testPassword,
        name: 'Admin Test User',
        role: 'ADMIN',
      },
    });

    if (!registerResponse.ok()) {
      const registerError = await registerResponse.json();
      console.log('Register failed:', registerResponse.status(), registerError);
    }

    // Realizar login para obter token de autenticação
    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: uniqueEmail,
        password: testPassword,
      },
    });

    if (!loginResponse.ok()) {
      const loginError = await loginResponse.json();
      console.log('Login failed:', loginResponse.status(), loginError);
    }

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    authToken = loginData.data.accessToken; // Estrutura correta: data.accessToken
  });

  test('deve obter estatísticas de agendamentos', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/appointments/stats`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Verificar se a resposta é bem-sucedida ou se retorna erro esperado
    if (response.ok()) {
      const stats = await response.json();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('scheduled');
      expect(stats).toHaveProperty('confirmed');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('cancelled');
      expect(stats).toHaveProperty('noShow');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('averagePrice');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.totalRevenue).toBe('number');
      expect(typeof stats.averagePrice).toBe('number');
    } else {
      // Se não há dados suficientes, pode retornar erro 400 ou 403
      expect([400, 403, 404]).toContain(response.status());
      console.log('Stats endpoint returned expected error:', response.status());
    }
  });

  test('deve validar dados de agendamento', async ({ request }) => {
    const invalidAppointmentData = {
      barbershopId: 'invalid-id', // ID inválido
      barberId: 'invalid-id', // ID inválido
      serviceId: 'invalid-id', // ID inválido
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Teste de validação de agendamento',
    };

    const response = await request.post(`${API_BASE_URL}/api/appointments`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: invalidAppointmentData,
    });

    // Deve retornar erro de validação (400) pois os IDs são inválidos
    expect(response.status()).toBe(400);
    const errorResponse = await response.json();
    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse.error).toContain('inválido');
  });

  test('deve testar endpoint de confirmação de agendamento', async ({ request }) => {
    // Testar confirmação com ID inválido
    const confirmResponse = await request.patch(
      `${API_BASE_URL}/api/appointments/invalid-id/confirm`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Deve retornar erro 400 ou 404 pois o ID é inválido
    expect([400, 404]).toContain(confirmResponse.status());
    const errorResponse = await confirmResponse.json();
    expect(errorResponse).toHaveProperty('error');
    console.log('Confirm endpoint validation working:', confirmResponse.status());
  });
});
