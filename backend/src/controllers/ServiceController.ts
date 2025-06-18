import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { ServiceService } from '../services/ServiceService';
import { AuthenticatedRequest } from '../types/auth';
import { validateSchema } from '../utils/validationSchemas';

const prisma = new PrismaClient();

/**
 * Controller para gestão de serviços
 *
 * Responsabilidades:
 * - Gerenciar requisições HTTP
 * - Validar dados de entrada
 * - Chamar services apropriados
 * - Retornar respostas padronizadas
 *
 * Princípios aplicados:
 * - Single Responsibility: Apenas controle de requisições
 * - Dependency Inversion: Usa ServiceService
 */

// Schemas de validação
const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(1, 'Duração deve ser maior que zero').max(480),
  price: z.number().min(0.01, 'Preço deve ser maior que zero').max(10000),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateServiceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().min(1).max(480).optional(),
  price: z.number().min(0.01).max(10000).optional(),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService(prisma);
  }

  /**
   * Criar novo serviço
   * POST /api/services
   */
  createService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validar dados de entrada
      const validatedData = validateSchema(createServiceSchema, req.body);

      // Obter barbershopId do usuário autenticado
      const barbershopId = await this.getBarbershopId(req.user.id);

      // Criar serviço
      const service = await this.serviceService.createService({
        ...validatedData,
        barbershopId,
      });

      res.status(201).json({
        success: true,
        message: 'Serviço criado com sucesso',
        data: { service },
      });
    } catch (error) {
      // console.error('Erro ao criar serviço:', error);

      if (error instanceof Error) {
        if (error.message.includes('já existe')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message.includes('não encontrada')) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Listar serviços com filtros
   * GET /api/services
   */
  getServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Obter barbershopId do usuário autenticado
      const barbershopId = await this.getBarbershopId(req.user.id);

      // Extrair parâmetros de query
      const {
        category,
        isActive,
        minPrice,
        maxPrice,
        minDuration,
        maxDuration,
        page = '1',
        limit = '10',
        sortBy = 'name',
        sortOrder = 'asc',
      } = req.query;

      // Construir filtros
      const filters = {
        barbershopId,
        ...(category && { category: category as string }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(minPrice && { minPrice: parseFloat(minPrice as string) }),
        ...(maxPrice && { maxPrice: parseFloat(maxPrice as string) }),
        ...(minDuration && { minDuration: parseInt(minDuration as string) }),
        ...(maxDuration && { maxDuration: parseInt(maxDuration as string) }),
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'name' | 'price' | 'duration' | 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      // Buscar serviços
      const result = await this.serviceService.getServices(filters, pagination);

      res.json({
        success: true,
        message: 'Serviços listados com sucesso',
        data: result,
      });
    } catch (error) {
      // console.error('Erro ao listar serviços:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Buscar serviço por ID
   * GET /api/services/:id
   */
  getServiceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Buscar serviço
      const service = await this.serviceService.getServiceById(id);

      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Serviço não encontrado',
        });
        return;
      }

      // Verificar se o serviço pertence à barbearia do usuário
      const barbershopId = await this.getBarbershopId(req.user.id);
      if (service.barbershopId !== barbershopId) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Serviço encontrado',
        data: { service },
      });
    } catch (error) {
      // console.error('Erro ao buscar serviço:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Atualizar serviço
   * PUT /api/services/:id
   */
  updateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validar dados de entrada
      const validatedData = validateSchema(updateServiceSchema, req.body);

      // Verificar se o serviço existe e pertence à barbearia do usuário
      const existingService = await this.serviceService.getServiceById(id);
      if (!existingService) {
        res.status(404).json({
          success: false,
          message: 'Serviço não encontrado',
        });
        return;
      }

      const barbershopId = await this.getBarbershopId(req.user.id);
      if (existingService.barbershopId !== barbershopId) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      // Atualizar serviço
      const service = await this.serviceService.updateService(id, validatedData);

      res.json({
        success: true,
        message: 'Serviço atualizado com sucesso',
        data: { service },
      });
    } catch (error) {
      // console.error('Erro ao atualizar serviço:', error);

      if (error instanceof Error) {
        if (error.message.includes('já existe')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Desativar serviço
   * DELETE /api/services/:id
   */
  deactivateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Verificar se o serviço existe e pertence à barbearia do usuário
      const existingService = await this.serviceService.getServiceById(id);
      if (!existingService) {
        res.status(404).json({
          success: false,
          message: 'Serviço não encontrado',
        });
        return;
      }

      const barbershopId = await this.getBarbershopId(req.user.id);
      if (existingService.barbershopId !== barbershopId) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      // Desativar serviço
      const service = await this.serviceService.deactivateService(id);

      res.json({
        success: true,
        message: 'Serviço desativado com sucesso',
        data: { service },
      });
    } catch (error) {
      // console.error('Erro ao desativar serviço:', error);

      if (error instanceof Error) {
        if (error.message.includes('agendamentos futuros')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message.includes('já está desativado')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Reativar serviço
   * PATCH /api/services/:id/reactivate
   */
  reactivateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Verificar se o serviço existe e pertence à barbearia do usuário
      const existingService = await this.serviceService.getServiceById(id);
      if (!existingService) {
        res.status(404).json({
          success: false,
          message: 'Serviço não encontrado',
        });
        return;
      }

      const barbershopId = await this.getBarbershopId(req.user.id);
      if (existingService.barbershopId !== barbershopId) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
        return;
      }

      // Reativar serviço
      const service = await this.serviceService.reactivateService(id);

      res.json({
        success: true,
        message: 'Serviço reativado com sucesso',
        data: { service },
      });
    } catch (error) {
      // console.error('Erro ao reativar serviço:', error);

      if (error instanceof Error) {
        if (error.message.includes('já está ativo')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Obter categorias de serviços
   * GET /api/services/categories
   */
  getServiceCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Obter barbershopId do usuário autenticado
      const barbershopId = await this.getBarbershopId(req.user.id);

      // Buscar categorias
      const categories = await this.serviceService.getServiceCategories(barbershopId);

      res.json({
        success: true,
        message: 'Categorias listadas com sucesso',
        data: { categories },
      });
    } catch (error) {
      console.error('Erro ao listar categorias:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Obter estatísticas de serviços
   * GET /api/services/stats
   */
  getServiceStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Obter barbershopId do usuário autenticado
      const barbershopId = await this.getBarbershopId(req.user.id);

      // Buscar estatísticas
      const stats = await this.serviceService.getServiceStats(barbershopId);

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: { stats },
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };

  /**
   * Obter barbershopId do usuário autenticado
   *
   * Princípio DRY: Centraliza lógica reutilizada
   */
  private async getBarbershopId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        barbershop: true,
        barberProfile: {
          include: {
            barbershop: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Se é dono da barbearia
    if (user.barbershop) {
      return user.barbershop.id;
    }

    // Se é barbeiro
    if (user.barberProfile) {
      return user.barberProfile.barbershop.id;
    }

    throw new Error('Usuário não está associado a uma barbearia');
  }
}
