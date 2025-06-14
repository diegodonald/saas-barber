import { z } from 'zod';
import { Role, Gender } from '@prisma/client';

// Schema para validação de email
const emailSchema = z.string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório');

// Schema para validação de senha
const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial');

// Schema para validação de telefone
const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
  .optional();

// Schemas de Autenticação
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: phoneSchema,
  role: z.nativeEnum(Role).optional().default(Role.CLIENT)
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório')
});

// Schemas de Usuário
export const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  phone: phoneSchema,
  avatar: z.string().url('Avatar deve ser uma URL válida').optional()
});

export const updateClientProfileSchema = updateUserSchema.extend({
  birthDate: z.preprocess(
    (val) => val ? new Date(String(val)) : undefined,
    z.date().optional()
  ),
  gender: z.nativeEnum(Gender).optional(),
  notes: z.string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional()
});

export const updateBarberProfileSchema = updateUserSchema.extend({
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  experience: z.number()
    .int('Experiência deve ser um número inteiro')
    .min(0, 'Experiência não pode ser negativa')
    .max(50, 'Experiência deve ser no máximo 50 anos')
    .optional(),
  specialties: z.array(z.string())
    .max(10, 'Máximo de 10 especialidades')
    .optional(),
  isActive: z.boolean().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

// Schemas de Query Parameters
export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : 1,
    z.number().int().min(1, 'Página deve ser maior que 0').default(1)
  ),
  limit: z.preprocess(
    (val) => val ? parseInt(String(val), 10) : 10,
    z.number().int().min(1).max(100, 'Limit deve ser entre 1 e 100').default(10)
  )
});

export const userListSchema = paginationSchema.extend({
  role: z.nativeEnum(Role).optional()
});

// Schema para validação de ID
export const idSchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .cuid('ID deve ser um CUID válido')
});

// Tipos TypeScript derivados dos schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateClientProfileInput = z.infer<typeof updateClientProfileSchema>;
export type UpdateBarberProfileInput = z.infer<typeof updateBarberProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserListInput = z.infer<typeof userListSchema>;
export type IdInput = z.infer<typeof idSchema>;

// Função helper para validação
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      throw new Error(`Dados inválidos: ${JSON.stringify(errorMessages)}`);
    }
    throw error;
  }
}

// Middleware helper para validação de request
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = validateSchema(schema, req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        error: error instanceof Error ? error.message : 'Erro de validação'
      });
    }
  };
} 