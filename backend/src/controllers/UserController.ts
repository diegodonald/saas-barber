import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { 
  updateUserSchema,
  updateClientProfileSchema,
  updateBarberProfileSchema,
  changePasswordSchema,
  userListSchema,
  idSchema,
  validateSchema 
} from '../utils/validationSchemas';

const userService = new UserService();

export class UserController {
  /**
   * GET /api/users/profile
   * Retorna perfil completo do usuário autenticado
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const profile = await userService.findById(user.userId);

      return res.json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: { user: profile }
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/users/profile
   * Atualiza dados básicos do usuário
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedData = validateSchema(updateUserSchema, req.body);

      const updatedUser = await userService.updateUser(user.userId, validatedData);

      return res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
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
   * PUT /api/users/client-profile
   * Atualiza perfil específico do cliente
   */
  async updateClientProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedData = validateSchema(updateClientProfileSchema, req.body) as any;

      const updatedUser = await userService.updateClientProfile(user.userId, validatedData);

      return res.json({
        success: true,
        message: 'Perfil do cliente atualizado com sucesso',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil do cliente:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        if (error.message.includes('não é um cliente')) {
          return res.status(403).json({
            success: false,
            message: 'Usuário não tem permissão para esta operação'
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
   * PUT /api/users/barber-profile
   * Atualiza perfil específico do barbeiro
   */
  async updateBarberProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedData = validateSchema(updateBarberProfileSchema, req.body);

      const updatedUser = await userService.updateBarberProfile(user.userId, validatedData);

      return res.json({
        success: true,
        message: 'Perfil do barbeiro atualizado com sucesso',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil do barbeiro:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        if (error.message.includes('não é um barbeiro')) {
          return res.status(403).json({
            success: false,
            message: 'Usuário não tem permissão para esta operação'
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
   * PUT /api/users/change-password
   * Altera senha do usuário
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedData = validateSchema(changePasswordSchema, req.body);

      const result = await userService.changePassword(user.userId, {
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword
      });

      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        if (error.message.includes('incorreta')) {
          return res.status(400).json({
            success: false,
            message: 'Senha atual incorreta'
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
   * GET /api/users
   * Lista usuários (apenas para SUPER_ADMIN)
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      // Verificar se é SUPER_ADMIN
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const validatedQuery = validateSchema(userListSchema, req.query) as any;
      const result = await userService.findAll(
        validatedQuery.page, 
        validatedQuery.limit, 
        validatedQuery.role
      );

      return res.json({
        success: true,
        message: 'Usuários obtidos com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      
      if (error instanceof Error && error.message.includes('Dados inválidos')) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/users/:id
   * Busca usuário por ID (apenas para SUPER_ADMIN e ADMIN)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedParams = validateSchema(idSchema, req.params);
      
      // Verificar permissões
      if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const foundUser = await userService.findById(validatedParams.id);

      return res.json({
        success: true,
        message: 'Usuário obtido com sucesso',
        data: { user: foundUser }
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({
            success: false,
            message: 'ID inválido',
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
   * DELETE /api/users/:id
   * Desativa usuário (apenas para SUPER_ADMIN)
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const validatedParams = validateSchema(idSchema, req.params);
      
      // Verificar se é SUPER_ADMIN
      if (user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const result = await userService.deactivateUser(validatedParams.id);

      return res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }
        
        if (error.message.includes('Dados inválidos')) {
          return res.status(400).json({
            success: false,
            message: 'ID inválido',
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
} 