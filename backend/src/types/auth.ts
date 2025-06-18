import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

/**
 * Interface para usuário autenticado no token JWT
 */
export interface JWTUser {
  userId: string;
  email: string;
  role: Role;
  barbershopId?: string;
  barberId?: string;
}

/**
 * Interface para Request com usuário autenticado
 * Estende o Request padrão do Express incluindo dados do usuário obrigatórios
 */
export interface AuthenticatedRequest extends Request {
  user: JWTUser; // Usuário obrigatório para rotas autenticadas
}

/**
 * Tipo para handlers de rotas autenticadas
 * Força o TypeScript a reconhecer que o user é obrigatório
 */
export type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void> | Response | Promise<Response>;

/**
 * Helper para converter handlers autenticados para o tipo que o Express espera
 * Resolve problemas de compatibilidade de tipos entre AuthenticatedRequest e Request
 */
export const asAuthenticatedHandler = (handler: AuthenticatedRequestHandler) => {
  return handler as any; // Type assertion para compatibilidade com Express
};

/**
 * Interface para dados de login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface para dados de registro
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/**
 * Interface para resposta de autenticação
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    barbershopId?: string;
  };
}

/**
 * Interface para payload do refresh token
 */
export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}
