import { expect, test } from '@playwright/test';

/**
 * Testes de Integração da API
 * Utiliza as ferramentas do Playwright para testar APIs diretamente
 */

test.describe('🔗 API Integration Tests', () => {
  const baseURL = 'http://localhost:3001/api';

  // Dados de teste
  const getTestUser = () => ({
    name: 'Carlos Teste API',
    email: `carlos.teste.${Date.now()}.${Math.random()}@api.com`,
    password: 'MinhaSenh@123',
    phone: '(11) 97777-7777',
    role: 'CLIENT',
  });

  test('Health Check - API está funcionando', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.environment).toBe('test'); // Ambiente de teste
  });

  test('Endpoint de teste da API', async ({ request }) => {
    const response = await request.get(`${baseURL}/test`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('SaaS Barber API');
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
  });

  test('Registro de usuário via API', async ({ request }) => {
    const testUser = getTestUser();
    const response = await request.post(`${baseURL}/auth/register`, {
      data: testUser,
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('sucesso');
    expect(data.data.user.email).toBe(testUser.email);
    expect(data.data.user.name).toBe(testUser.name);
    expect(data.data.accessToken).toBeDefined();
    expect(data.data.refreshToken).toBeDefined();
  });

  test('Login de usuário via API', async ({ request }) => {
    const testUser = getTestUser();
    const uniqueEmail = `login.test.${Date.now()}@api.com`;

    // Primeiro, registrar o usuário
    await request.post(`${baseURL}/auth/register`, {
      data: { ...testUser, email: uniqueEmail },
    });

    // Depois, fazer login
    const response = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: uniqueEmail,
        password: testUser.password,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe(uniqueEmail);
    expect(data.data.accessToken).toBeDefined();
  });

  test('Acesso a rota protegida com token válido', async ({ request }) => {
    const testUser = getTestUser();
    const uniqueEmail = `protected.test.${Date.now()}@api.com`;

    // Registrar usuário
    const registerResponse = await request.post(`${baseURL}/auth/register`, {
      data: { ...testUser, email: uniqueEmail },
    });

    expect(registerResponse.status()).toBe(201);

    const registerData = await registerResponse.json();
    expect(registerData.success).toBe(true);
    expect(registerData.data.accessToken).toBeDefined();

    const token = registerData.data.accessToken;

    // Acessar rota protegida
    const response = await request.get(`${baseURL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    // Estrutura real: data.data.user.email
    expect(data.data.user.email).toBe(uniqueEmail);
  });

  test('Acesso negado a rota protegida sem token', async ({ request }) => {
    const response = await request.get(`${baseURL}/auth/me`);

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Token');
  });

  test('Validação de dados de entrada - registro com dados inválidos', async ({ request }) => {
    const response = await request.post(`${baseURL}/auth/register`, {
      data: {
        name: '',
        email: 'email-invalido',
        password: '123',
        phone: 'telefone-invalido',
        role: 'INVALID_ROLE',
      },
    });

    // Deve retornar erro de validação
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('inválid');
  });

  test('Rate limiting - verificar comportamento em ambiente de teste', async ({ request }) => {
    const promises = [];

    // Fazer 10 requisições rapidamente (reduzido para evitar sobrecarga)
    for (let i = 0; i < 10; i++) {
      promises.push(request.get(`${baseURL}/test`));
    }

    const responses = await Promise.all(promises);

    // Em ambiente de teste, rate limiting deve estar desabilitado
    // Todas as requisições devem ter sucesso
    const successCount = responses.filter(r => r.status() === 200).length;
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;

    console.log(`✅ Sucessos: ${successCount}, ❌ Rate limited: ${rateLimitedCount}`);

    // Em ambiente de teste, esperamos que todas passem
    expect(successCount).toBe(10);
    expect(rateLimitedCount).toBe(0);
  });
});
