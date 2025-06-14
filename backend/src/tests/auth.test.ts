// Usando Jest para testes
import request from 'supertest';
import app from '../index';
import { cleanDatabase, prisma } from './testUtils';

describe('Authentication System', () => {
  beforeAll(async () => {
    // Limpar dados de teste antes de começar
    await cleanDatabase();
  });

  afterAll(async () => {
    // Limpar dados de teste após os testes
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    test('deve registrar um novo usuário com dados válidos', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Usuário Teste',
        phone: '(11) 99999-9999'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuário registrado com sucesso');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      
      // Verificar se a senha não é retornada
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('deve rejeitar registro com email duplicado', async () => {
      const userData = {
        email: 'test@example.com', // Email já usado no teste anterior
        password: 'Test123!@#',
        name: 'Outro Usuário',
        phone: '(11) 88888-8888'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('já existe');
    });

    test('deve rejeitar registro com senha fraca', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123', // Senha muito fraca
        name: 'Usuário Teste 2',
        phone: '(11) 77777-7777'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Dados de entrada inválidos');
    });

    test('deve rejeitar registro com dados inválidos', async () => {
      const userData = {
        email: 'email-invalido', // Email inválido
        password: 'Test123!@#',
        name: '', // Nome vazio
        phone: '123' // Telefone inválido
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('deve fazer login com credenciais válidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('deve rejeitar login com email inexistente', async () => {
      const loginData = {
        email: 'inexistente@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email ou senha incorretos');
    });

    test('deve rejeitar login com senha incorreta', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SenhaErrada123!@#'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email ou senha incorretos');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Fazer login para obter token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    test('deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('deve rejeitar acesso sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token de acesso não fornecido');
    });

    test('deve rejeitar acesso com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Fazer login para obter refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('deve renovar token com refresh token válido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token renovado com sucesso');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    test('deve rejeitar renovação com refresh token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'token-invalido' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token inválido');
    });
  });
}); 