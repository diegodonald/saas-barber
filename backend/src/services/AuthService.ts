import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Role;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    phone?: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '30d';
  private readonly SALT_ROUNDS = 12;

  /**
   * Registra um novo usuário no sistema
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name, phone, role = Role.CLIENT } = data;

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = await this.hashPassword(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role
      }
    });

    // Criar perfil específico baseado no role
    if (role === Role.CLIENT) {
      await prisma.client.create({
        data: {
          userId: user.id
        }
      });
    }

    // Gerar tokens
    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Autentica um usuário existente
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar tokens
    const { accessToken, refreshToken } = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as TokenPayload;
      
      // Verificar se o usuário ainda existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Gerar novos tokens
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      throw new Error('Refresh token inválido');
    }
  }

  /**
   * Verifica se um token é válido
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      // Verificar se o usuário ainda existe
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  /**
   * Gera hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verifica se a senha está correta
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Gera access token e refresh token
   */
  private generateTokens(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    // Garantir que o secret é string (como exige a tipagem do jsonwebtoken)
    const secret: string = this.JWT_SECRET;
    const accessToken = jwt.sign(
      payload,
      secret,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
      payload,
      secret,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions
    );
    return { accessToken, refreshToken };
  }

  /**
   * Valida força da senha
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}