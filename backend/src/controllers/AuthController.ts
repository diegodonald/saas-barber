import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  validateSchema 
} from '../utils/validationSchemas';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/register
   * Registra um novo usuário
   */
  async register(req: Request, res: Response) {
    try {
      // Validar dados de entrada
      const validatedData = validateSchema(registerSchema, req.body);

      // Validar força da senha
      const passwordValidation = authService.validatePasswordStrength(validatedData.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha não atende aos critérios de segurança',
          errors: passwordValidation.errors
        });
      }      // Registrar usuário
      const result = await authService.register({
        email: validatedData.email,
        password: validatedData.password,
        name: validatedData.name,
        phone: validatedData.phone,
        role: validatedData.role
      });

      return res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('já existe')) {
          return res.status(409).json({
            success: false,
            message: error.message
          });
        }
        
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({
            success: false,
            message: 'Dados de entrada inválidos',
            error: error.message
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Autentica um usuário existente
   */
  async login(req: Request, res: Response) {
    try {
      // Validar dados de entrada
      const validatedData = validateSchema(loginSchema, req.body);      // Fazer login
      const result = await authService.login({
        email: validatedData.email,
        password: validatedData.password
      });

      return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Credenciais inválidas')) {
          return res.status(401).json({
            success: false,
            message: 'Email ou senha incorretos'
          });
        }
        
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({
            success: false,
            message: 'Dados de entrada inválidos',
            error: error.message
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renova o access token usando refresh token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      // Validar dados de entrada
      const validatedData = validateSchema(refreshTokenSchema, req.body);

      // Renovar token
      const result = await authService.refreshToken(validatedData.refreshToken);

      return res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro na renovação do token:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('inválido') || error.message.includes('não encontrado')) {
          return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
          });
        }
        
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({
            success: false,
            message: 'Dados de entrada inválidos',
            error: error.message
          });
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout do usuário (invalidar tokens no frontend)
   */
  async logout(_req: Request, res: Response) {
    try {
      // No caso de JWT stateless, o logout é feito no frontend
      // removendo os tokens do storage
      // Aqui podemos implementar uma blacklist de tokens se necessário

      return res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Retorna dados do usuário autenticado
   */
  async me(req: Request, res: Response) {
    try {
      // O usuário já foi validado pelo middleware de autenticação
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      return res.json({
        success: true,
        message: 'Dados do usuário obtidos com sucesso',
        data: {
          user: {
            id: user.userId,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/auth/verify-token
   * Verifica se um token é válido
   */
  async verifyToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório'
        });
      }

      // Verificar token
      const decoded = await authService.verifyToken(token);

      return res.json({
        success: true,
        message: 'Token válido',
        data: {
          valid: true,
          decoded
        }
      });
    } catch (error) {
      console.error('Erro na verificação do token:', error);
      
      if (error instanceof Error && error.message.includes('inválido')) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
          data: {
            valid: false
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
} 