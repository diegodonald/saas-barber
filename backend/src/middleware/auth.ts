import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';

const authService = new AuthService();

/**
 * Middleware de autenticação
 * Verifica se o usuário está autenticado via JWT
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar formato do header (Bearer token)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Formato do token inválido'
      });
    }

    const token = parts[1];

    // Verificar e decodificar token
    const decoded = await authService.verifyToken(token);

    // Adicionar dados do usuário ao request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    return next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error instanceof Error && error.message.includes('inválido')) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware de autorização
 * Verifica se o usuário tem permissão para acessar o recurso
 */
export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Verificar se o role do usuário está na lista de roles permitidos
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - Permissões insuficientes'
        });
      }

      return next();
    } catch (error) {
      console.error('Erro na autorização:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário é proprietário do recurso
 * ou tem permissões administrativas
 */
export const authorizeOwnerOrAdmin = (getUserIdFromParams: (req: Request) => string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const resourceUserId = getUserIdFromParams(req);

      // Permitir se for o próprio usuário ou se for admin/super_admin
      const isOwner = user.userId === resourceUserId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - Você só pode acessar seus próprios recursos'
        });
      }

      return next();
    } catch (error) {
      console.error('Erro na autorização de proprietário:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware para verificar se o usuário pertence à mesma barbearia
 */
export const authorizeSameBarbershop = (_getBarbershopIdFromParams: (req: Request) => string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Super admin pode acessar qualquer barbearia
      if (user.role === Role.SUPER_ADMIN) {
        return next();
      }

      // const resourceBarbershopId = getBarbershopIdFromParams(req);

      // Aqui você precisaria implementar a lógica para verificar
      // se o usuário pertence à barbearia especificada
      // Por exemplo, consultando o banco de dados

      // Por enquanto, vamos permitir apenas para admins e super_admins
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - Você não tem permissão para acessar recursos desta barbearia'
        });
      }

      return next();
    } catch (error) {
      console.error('Erro na autorização de barbearia:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Middleware opcional de autenticação
 * Não bloqueia se não houver token, mas adiciona dados do usuário se houver
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = await authService.verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      // Token inválido, mas não bloqueia a requisição
      console.warn('Token inválido em autenticação opcional:', error);
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação opcional:', error);
    next(); // Continua mesmo com erro
  }
};

// Helpers para roles específicos
export const requireSuperAdmin = authorize([Role.SUPER_ADMIN]);
export const requireAdmin = authorize([Role.ADMIN, Role.SUPER_ADMIN]);
export const requireBarber = authorize([Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN]);
export const requireClient = authorize([Role.CLIENT, Role.BARBER, Role.ADMIN, Role.SUPER_ADMIN]);

// Helper para verificar se é o próprio usuário
export const requireSelfOrAdmin = authorizeOwnerOrAdmin((req) => req.params.id || req.params.userId);

// Exportar tipos para uso em outros arquivos
export type { AuthenticatedRequest }; 