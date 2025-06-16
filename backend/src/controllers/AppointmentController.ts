import { Response } from 'express';
import { z } from 'zod';
import { AppointmentService } from '../services/AppointmentService';
import { AuthenticatedRequest } from '../types/auth';
import { AppointmentStatus } from '@prisma/client';

// Schemas de validação Zod
const createAppointmentSchema = z.object({
  barbershopId: z.string().cuid('ID da barbearia inválido'),
  barberId: z.string().cuid('ID do barbeiro inválido'),
  serviceId: z.string().cuid('ID do serviço inválido'),
  startTime: z.string().datetime('Data/hora inválida'),
  notes: z.string().optional(),
  clientId: z.string().cuid('ID do cliente inválido').optional() // Opcional para quando CLIENT cria seu próprio agendamento
});

const updateAppointmentSchema = z.object({
  startTime: z.string().datetime('Data/hora inválida').optional(),
  status: z.nativeEnum(AppointmentStatus, { message: 'Status inválido' }).optional(),
  notes: z.string().optional()
});

const appointmentFiltersSchema = z.object({
  barbershopId: z.string().cuid().optional(),
  barberId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  skip: z.string().transform(Number).optional(),
  take: z.string().transform(Number).optional(),
  orderBy: z.enum(['startTime', 'createdAt']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

const availableSlotsSchema = z.object({
  barberId: z.string().cuid('ID do barbeiro inválido'),
  barbershopId: z.string().cuid('ID da barbearia inválido'),
  date: z.string().datetime('Data inválida'),
  serviceDuration: z.string().transform(Number).optional()
});

const cancelAppointmentSchema = z.object({
  reason: z.string().optional()
});

const completeAppointmentSchema = z.object({
  notes: z.string().optional()
});

export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  /**
   * POST /api/appointments
   * Criar novo agendamento
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      
      // Determinar o clientId correto baseado no role do usuário
      let clientId: string;
      
      if (req.user.role === 'CLIENT') {
        // Cliente criando agendamento para si mesmo
        clientId = req.user.userId;
      } else if (['BARBER', 'ADMIN'].includes(req.user.role)) {
        // Barbeiro ou Admin criando agendamento para um cliente
        if (!validatedData.clientId) {
          return res.status(400).json({
            error: 'ID do cliente é obrigatório quando barbeiro ou admin cria agendamento'
          });
        }
        clientId = validatedData.clientId;
        
        // Verificar se pertencem à barbearia
        if (req.user.barbershopId !== validatedData.barbershopId) {
          return res.status(403).json({
            error: 'Você só pode criar agendamentos para sua barbearia'
          });
        }
      } else {
        return res.status(403).json({
          error: 'Permissão insuficiente para criar agendamentos'
        });
      }      const appointment = await this.appointmentService.create({
        barbershopId: validatedData.barbershopId!,
        barberId: validatedData.barberId!,
        serviceId: validatedData.serviceId!,
        clientId,
        startTime: new Date(validatedData.startTime),
        notes: validatedData.notes
      });

      return res.status(201).json(appointment);
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
   * GET /api/appointments
   * Listar agendamentos com filtros
   */
  async findMany(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const filters = appointmentFiltersSchema.parse(req.query);

      // Aplicar filtros baseados no role do usuário
      const finalFilters: any = { ...filters };

      if (req.user.role === 'CLIENT') {
        finalFilters.clientId = req.user.userId;
      } else if (req.user.role === 'BARBER') {
        finalFilters.barberId = req.user.barberId;
        finalFilters.barbershopId = req.user.barbershopId;
      } else if (req.user.role === 'ADMIN') {
        finalFilters.barbershopId = req.user.barbershopId;
      }
      // SUPER_ADMIN pode ver todos

      // Converter strings de data para Date
      if (finalFilters.startDate) {
        finalFilters.startDate = new Date(finalFilters.startDate);
      }
      if (finalFilters.endDate) {
        finalFilters.endDate = new Date(finalFilters.endDate);
      }

      const result = await this.appointmentService.findMany(finalFilters);

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
   * GET /api/appointments/:id
   * Buscar agendamento por ID
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      const appointment = await this.appointmentService.findById(id);

      if (!appointment) {
        return res.status(404).json({
          error: 'Agendamento não encontrado'
        });
      }

      // Verificar permissões
      const canAccess = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === appointment.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === appointment.barberId) ||
        (req.user.role === 'CLIENT' && req.user.userId === appointment.clientId);

      if (!canAccess) {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar este agendamento'
        });
      }

      return res.json(appointment);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/appointments/:id
   * Atualizar agendamento
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateAppointmentSchema.parse(req.body);

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Verificar se o agendamento existe e se o usuário tem permissão
      const existingAppointment = await this.appointmentService.findById(id);

      if (!existingAppointment) {
        return res.status(404).json({
          error: 'Agendamento não encontrado'
        });
      }

      const canUpdate = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === existingAppointment.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === existingAppointment.barberId);

      if (!canUpdate) {
        return res.status(403).json({
          error: 'Você não tem permissão para atualizar este agendamento'
        });
      }

      const updateData = {
        ...validatedData,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined
      };

      const appointment = await this.appointmentService.update(id, updateData);

      return res.json(appointment);
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
   * DELETE /api/appointments/:id
   * Cancelar agendamento
   */
  async cancel(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason } = cancelAppointmentSchema.parse(req.body);

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Verificar se o agendamento existe e se o usuário tem permissão
      const existingAppointment = await this.appointmentService.findById(id);

      if (!existingAppointment) {
        return res.status(404).json({
          error: 'Agendamento não encontrado'
        });
      }

      const canCancel = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId === existingAppointment.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === existingAppointment.barberId) ||
        (req.user.role === 'CLIENT' && req.user.userId === existingAppointment.clientId);

      if (!canCancel) {
        return res.status(403).json({
          error: 'Você não tem permissão para cancelar este agendamento'
        });
      }

      const appointment = await this.appointmentService.cancel(id, reason);

      return res.json(appointment);
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
   * PATCH /api/appointments/:id/confirm
   * Confirmar agendamento
   */
  async confirm(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Verificar permissões (apenas barbeiros, admins e super admins)
      if (!['BARBER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Apenas barbeiros e administradores podem confirmar agendamentos'
        });
      }

      const appointment = await this.appointmentService.confirm(id);

      return res.json(appointment);
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
   * PATCH /api/appointments/:id/start
   * Iniciar atendimento
   */
  async startService(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Apenas barbeiros podem iniciar atendimento
      if (req.user.role !== 'BARBER') {
        return res.status(403).json({
          error: 'Apenas barbeiros podem iniciar atendimentos'
        });
      }

      const appointment = await this.appointmentService.startService(id);

      return res.json(appointment);
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
   * PATCH /api/appointments/:id/complete
   * Finalizar agendamento
   */
  async complete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { notes } = completeAppointmentSchema.parse(req.body);

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Apenas barbeiros podem finalizar atendimento
      if (req.user.role !== 'BARBER') {
        return res.status(403).json({
          error: 'Apenas barbeiros podem finalizar atendimentos'
        });
      }

      const appointment = await this.appointmentService.complete(id, notes);

      return res.json(appointment);
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
   * PATCH /api/appointments/:id/no-show
   * Marcar como não compareceu
   */
  async markNoShow(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID do agendamento é obrigatório'
        });
      }

      // Apenas barbeiros, admins e super admins
      if (!['BARBER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Você não tem permissão para marcar como não compareceu'
        });
      }

      const appointment = await this.appointmentService.markNoShow(id);

      return res.json(appointment);
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
   * GET /api/appointments/available-slots
   * Buscar horários disponíveis
   */
  async getAvailableSlots(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const validatedQuery = availableSlotsSchema.parse(req.query);

      const slots = await this.appointmentService.getAvailableSlots(
        validatedQuery.barberId,
        validatedQuery.barbershopId,
        new Date(validatedQuery.date),
        validatedQuery.serviceDuration
      );

      return res.json(slots);
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
   * GET /api/appointments/stats
   * Obter estatísticas de agendamentos
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const filters = appointmentFiltersSchema.parse(req.query);

      // Aplicar filtros baseados no role do usuário e converter tipos
      const finalFilters: any = {
        barbershopId: filters.barbershopId,
        barberId: filters.barberId,
        clientId: filters.clientId,
        serviceId: filters.serviceId,
        status: filters.status
      };

      if (req.user.role === 'CLIENT') {
        finalFilters.clientId = req.user.userId;
      } else if (req.user.role === 'BARBER') {
        finalFilters.barberId = req.user.barberId;
        finalFilters.barbershopId = req.user.barbershopId;
      } else if (req.user.role === 'ADMIN') {
        finalFilters.barbershopId = req.user.barbershopId;
      }
      // SUPER_ADMIN pode ver todas as estatísticas

      // Converter strings de data para Date
      if (filters.startDate) {
        finalFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        finalFilters.endDate = new Date(filters.endDate);
      }

      const stats = await this.appointmentService.getStats(finalFilters);

      return res.json(stats);
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
   * GET /api/appointments/barber/:barberId
   * Buscar agendamentos de um barbeiro específico
   */
  async getByBarber(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { barberId } = req.params;
      const filters = appointmentFiltersSchema.parse(req.query);

      if (!barberId) {
        return res.status(400).json({
          error: 'ID do barbeiro é obrigatório'
        });
      }

      // Verificar permissões
      const canAccess = 
        req.user.role === 'SUPER_ADMIN' ||
        (req.user.role === 'ADMIN' && req.user.barbershopId) ||
        (req.user.role === 'BARBER' && req.user.barberId === barberId);

      if (!canAccess) {
        return res.status(403).json({
          error: 'Você não tem permissão para acessar os agendamentos deste barbeiro'
        });
      }

      const finalFilters = {
        ...filters,
        barberId,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined
      };

      const result = await this.appointmentService.findMany(finalFilters);

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
}