import { Request } from 'express';
import { Role } from '@prisma/client';

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
 * Estende o Request padrão do Express incluindo dados do usuário
 */
export interface AuthenticatedRequest extends Request {
  user: JWTUser;
}

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