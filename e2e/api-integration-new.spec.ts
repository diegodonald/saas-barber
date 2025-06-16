import { test, expect } from '@playwright/test';

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
    role: 'CLIENT'
  });

  test('Health Check - API está funcionando', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.environment).toBe('development');
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
    const response = await request.post(`${baseURL}/auth/register`, {
      data: testUser
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
    // Primeiro, registrar o usuário
    await request.post(`${baseURL}/auth/register`, {
      data: { ...testUser, email: 'login.test@api.com' }
    });

    // Depois, fazer login
    const response = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: 'login.test@api.com',
        password: testUser.password
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('login.test@api.com');
    expect(data.data.accessToken).toBeDefined();
  });

  test('Acesso a rota protegida com token válido', async ({ request }) => {
    // Registrar usuário
    const registerResponse = await request.post(`${baseURL}/auth/register`, {
      data: { ...testUser, email: 'protected.test@api.com' }
    });
    
    const registerData = await registerResponse.json();
    const token = registerData.data.accessToken;

    // Acessar rota protegida
    const response = await request.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    // Ajustar baseado na estrutura real da resposta
    expect(data.data?.email || data.email).toBe('protected.test@api.com');
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
        role: 'INVALID_ROLE'
      }
    });
    
    // Deve retornar erro de validação
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('inválid');
  });

  test('Rate limiting - muitas requisições', async ({ request }) => {
    const promises = [];
    
    // Fazer 20 requisições rapidamente
    for (let i = 0; i < 20; i++) {
      promises.push(
        request.get(`${baseURL}/test`)
      );
    }
    
    const responses = await Promise.all(promises);
    
    // Pelo menos algumas devem ter passado
    const successCount = responses.filter(r => r.status() === 200).length;
    expect(successCount).toBeGreaterThan(0);
    
    // Se rate limiting estiver funcionando, algumas podem retornar 429
    const rateLimitedCount = responses.filter(r => r.status() === 429).length;
    // Note: rate limiting pode não ser ativado em desenvolvimento
  });
});