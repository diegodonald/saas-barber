import { Response } from 'express';
import { z } from 'zod';
import { BarberServiceService } from '../services/BarberServiceService';
import { AuthenticatedRequest } from '../types/auth';

// Schemas de validação Zod
const createBarberServiceSchema = z.object({
  barberId: z.string().cuid('ID do barbeiro inválido'),
  serviceId: z.string().cuid('ID do serviço inválido'),
  customPrice: z.number().min(0, 'Preço customizado não pode ser negativo').optional(),
  isActive: z.boolean().optional()
});

const updateBarberServiceSchema = z.object({
  customPrice: z.number().min(0, 'Preço customizado não pode ser negativo').nullable().optional(),
  isActive: z.boolean().optional()
});

const barberServiceFiltersSchema = z.object({
  barberId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  barbershopId: z.string().cuid().optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  hasCustomPrice: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  category: z.string().optional(),
  skip: z.string().transform(Number).optional(),
  take: z.string().transform(Number).optional(),
  orderBy: z.enum(['createdAt', 'customPrice', 'serviceName', 'barberName']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

export class BarberServiceController {
  constructor(private barberServiceService: BarberServiceService) {}

  /**
   * POST /api/barber-services
   * Atribuir serviço a barbeiro
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const validatedData = createBarberServiceSchema.parse(req.body);

      // Verificar permissões baseadas no role
      if (req.user.role === 'BARBER') {
        // Barbeiros só podem atribuir serviços para si mesmos
        if (validatedData.barberId !== req.user.barberId) {
          return res.status(403).json({
            error: 'Barbeiros só podem gerenciar seus próprios serviços'
          });
        }
      } else if (req.user.role === 'ADMIN') {
        // Admins só podem atribuir para barbeiros da sua barbearia
        // Esta validação será feita no service através da verificação de barbershop
      } else if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          error: 'Permissão insuficiente para criar atribuições'
        });
      }

      const barberService = await this.barberServiceService.create(validatedData);

      return res.status(201).json(barberService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services
   * Listar atribuições com filtros
   */
  async findMany(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const filters = barberServiceFiltersSchema.parse(req.query);

      // Aplicar filtros baseados no role do usuário
      let finalFilters = { ...filters };

      if (req.user.role === 'BARBER') {
        // Barbeiros só veem seus próprios serviços
        finalFilters.barberId = req.user.barberId;
      } else if (req.user.role === 'ADMIN') {
        // Admins só veem da sua barbearia
        finalFilters.barbershopId = req.user.barbershopId;
      }
      // SUPER_ADMIN pode ver todos

      const result = await this.barberServiceService.findMany(finalFilters);

      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parâmetros inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/:id
   * Buscar atribuição por ID
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID da atribuição é obrigatório'
        });
      }

      const barberService = await this.barberServiceService.findById(id);

      if (!barberService) {
        return res.status(404).json({
          error: 'Atribuição não encontrada'
        });
      }

      // Verificar permissões
      const canAccess = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === barberService.barber.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === barberService.barberId);

      if (!canAccess) {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar esta atribuição'
        });
      }

      return res.json(barberService);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/barber-services/:id
   * Atualizar atribuição
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateBarberServiceSchema.parse(req.body);

      if (!id) {
        return res.status(400).json({
          error: 'ID da atribuição é obrigatório'
        });
      }

      // Verificar se a atribuição existe e se o usuário tem permissão
      const existingBarberService = await this.barberServiceService.findById(id);

      if (!existingBarberService) {
        return res.status(404).json({
          error: 'Atribuição não encontrada'
        });
      }

      const canUpdate = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === existingBarberService.barber.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === existingBarberService.barberId);

      if (!canUpdate) {
        return res.status(403).json({
          error: 'Você não tem permissão para atualizar esta atribuição'
        });
      }

      const barberService = await this.barberServiceService.update(id, validatedData);

      return res.json(barberService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * DELETE /api/barber-services/:id
   * Remover atribuição (soft delete)
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID da atribuição é obrigatório'
        });
      }

      // Verificar se a atribuição existe e se o usuário tem permissão
      const existingBarberService = await this.barberServiceService.findById(id);

      if (!existingBarberService) {
        return res.status(404).json({
          error: 'Atribuição não encontrada'
        });
      }

      const canDelete = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === existingBarberService.barber.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === existingBarberService.barberId);

      if (!canDelete) {
        return res.status(403).json({
          error: 'Você não tem permissão para remover esta atribuição'
        });
      }

      await this.barberServiceService.delete(id);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PATCH /api/barber-services/:id/reactivate
   * Reativar atribuição
   */
  async reactivate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID da atribuição é obrigatório'
        });
      }

      // Verificar se a atribuição existe e se o usuário tem permissão
      const existingBarberService = await this.barberServiceService.findById(id);

      if (!existingBarberService) {
        return res.status(404).json({
          error: 'Atribuição não encontrada'
        });
      }

      const canReactivate = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === existingBarberService.barber.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === existingBarberService.barberId);

      if (!canReactivate) {
        return res.status(403).json({
          error: 'Você não tem permissão para reativar esta atribuição'
        });
      }

      const barberService = await this.barberServiceService.reactivate(id);

      return res.json(barberService);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message
        });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/barber/:barberId
   * Buscar serviços de um barbeiro
   */
  async findServicesByBarber(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { barberId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      if (!barberId) {
        return res.status(400).json({
          error: 'ID do barbeiro é obrigatório'
        });
      }

      // Verificar permissões
      const canAccess = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'BARBER' && req.user.barberId === barberId);

      // Para ADMINs, verificar se o barbeiro pertence à barbearia
      if (req.user.role === 'ADMIN') {
        const barberServices = await this.barberServiceService.findServicesByBarber(barberId, false);
        if (barberServices.length > 0 && barberServices[0].barber.barbershopId !== req.user.barbershopId) {
          return res.status(403).json({
            error: 'Você não tem permissão para acessar serviços deste barbeiro'
          });
        }
        canAccess;
      }

      if (!canAccess && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar serviços deste barbeiro'
        });
      }

      const barberServices = await this.barberServiceService.findServicesByBarber(barberId, includeInactive);

      return res.json(barberServices);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/service/:serviceId
   * Buscar barbeiros que executam um serviço
   */
  async findBarbersByService(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { serviceId } = req.params;
      const barbershopId = req.query.barbershopId as string;

      if (!serviceId) {
        return res.status(400).json({
          error: 'ID do serviço é obrigatório'
        });
      }

      // Para ADMINs, forçar filtro por barbearia
      let finalBarbershopId = barbershopId;
      if (req.user.role === 'ADMIN') {
        finalBarbershopId = req.user.barbershopId!;
      }

      const barberServices = await this.barberServiceService.findBarbersByService(serviceId, finalBarbershopId);

      return res.json(barberServices);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/stats
   * Obter estatísticas de atribuições
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      let barbershopId: string | undefined;

      // Para ADMINs, filtrar por barbearia
      if (req.user.role === 'ADMIN') {
        barbershopId = req.user.barbershopId;
      } else if (req.user.role === 'BARBER') {
        // Barbeiros só veem estatísticas da própria barbearia
        const barberServices = await this.barberServiceService.findServicesByBarber(req.user.barberId!, false);
        if (barberServices.length > 0) {
          barbershopId = barberServices[0].barber.barbershopId;
        }
      }

      const stats = await this.barberServiceService.getStats(barbershopId);

      return res.json(stats);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/check/:barberId/:serviceId
   * Verificar se barbeiro pode executar serviço
   */
  async checkCanPerformService(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { barberId, serviceId } = req.params;

      if (!barberId || !serviceId) {
        return res.status(400).json({
          error: 'ID do barbeiro e do serviço são obrigatórios'
        });
      }

      const [canPerform, effectivePrice] = await Promise.all([
        this.barberServiceService.canBarberPerformService(barberId, serviceId),
        this.barberServiceService.getEffectivePrice(barberId, serviceId)
      ]);

      return res.json({
        canPerform,
        effectivePrice
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/barber-services/available/:serviceId
   * Buscar barbeiros disponíveis para um serviço (público - para agendamento)
   */
  async getAvailableBarbers(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { serviceId } = req.params;
      const barbershopId = req.query.barbershopId as string;

      if (!serviceId) {
        return res.status(400).json({
          error: 'ID do serviço é obrigatório'
        });
      }

      if (!barbershopId) {
        return res.status(400).json({
          error: 'ID da barbearia é obrigatório'
        });
      }

      const availableBarbers = await this.barberServiceService.findBarbersByService(serviceId, barbershopId);

      // Retornar apenas informações essenciais para o cliente
      const publicBarbers = availableBarbers.map(bs => ({
        barberId: bs.barberId,
        barberName: bs.barber.user.name,
        barberPhone: bs.barber.user.phone,
        serviceId: bs.serviceId,
        serviceName: bs.service.name,
        serviceDuration: bs.service.duration,
        effectivePrice: bs.effectivePrice,
        hasCustomPrice: !!bs.customPrice
      }));

      return res.json(publicBarbers);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
} 