import { Request, Response } from 'express';
import {
  AvailabilityService,
  BarberExceptionService,
  BarberScheduleService,
  GlobalExceptionService,
  GlobalScheduleService,
} from '../services/scheduleService';

// Helper para tratar erros desconhecidos
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// ========================================
// CONTROLLER DE HORÁRIOS GLOBAIS
// ========================================

export class GlobalScheduleController {
  static async create(req: Request, res: Response) {
    try {
      const schedule = await GlobalScheduleService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Horário global criado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao criar horário global',
        error: getErrorMessage(error),
      });
    }
  }

  static async getMany(req: Request, res: Response) {
    try {
      const { barbershopId } = req.params;
      const { dayOfWeek, isOpen } = req.query;

      const filters: any = {};
      if (dayOfWeek !== undefined) {
        filters.dayOfWeek = parseInt(dayOfWeek as string);
      }
      if (isOpen !== undefined) {
        filters.isOpen = isOpen === 'true';
      }

      const schedules = await GlobalScheduleService.findMany(barbershopId, filters);

      res.json({
        success: true,
        message: 'Horários globais recuperados com sucesso',
        data: schedules,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar horários globais',
        error: getErrorMessage(error),
      });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await GlobalScheduleService.findById(id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Horário global não encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Horário global recuperado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar horário global',
        error: getErrorMessage(error),
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await GlobalScheduleService.update(id, req.body);

      res.json({
        success: true,
        message: 'Horário global atualizado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao atualizar horário global',
        error: getErrorMessage(error),
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await GlobalScheduleService.delete(id);

      res.json({
        success: true,
        message: 'Horário global removido com sucesso',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao remover horário global',
        error: getErrorMessage(error),
      });
    }
  }
}

// ========================================
// CONTROLLER DE HORÁRIOS DE BARBEIROS
// ========================================

export class BarberScheduleController {
  static async create(req: Request, res: Response) {
    try {
      const schedule = await BarberScheduleService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Horário de barbeiro criado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao criar horário de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async getMany(req: Request, res: Response) {
    try {
      const { barberId, barbershopId, dayOfWeek, isWorking } = req.query;

      const filters: any = {};
      if (barberId) filters.barberId = barberId as string;
      if (barbershopId) filters.barbershopId = barbershopId as string;
      if (dayOfWeek !== undefined) filters.dayOfWeek = parseInt(dayOfWeek as string);
      if (isWorking !== undefined) filters.isWorking = isWorking === 'true';

      const schedules = await BarberScheduleService.findMany(filters);

      res.json({
        success: true,
        message: 'Horários de barbeiros recuperados com sucesso',
        data: schedules,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar horários de barbeiros',
        error: getErrorMessage(error),
      });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await BarberScheduleService.findById(id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Horário de barbeiro não encontrado',
        });
      }

      return res.json({
        success: true,
        message: 'Horário de barbeiro recuperado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar horário de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await BarberScheduleService.update(id, req.body);

      res.json({
        success: true,
        message: 'Horário de barbeiro atualizado com sucesso',
        data: schedule,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao atualizar horário de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await BarberScheduleService.delete(id);

      res.json({
        success: true,
        message: 'Horário de barbeiro removido com sucesso',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao remover horário de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }
}

// ========================================
// CONTROLLER DE EXCEÇÕES GLOBAIS
// ========================================

export class GlobalExceptionController {
  static async create(req: Request, res: Response) {
    try {
      const exception = await GlobalExceptionService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Exceção global criada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao criar exceção global',
        error: getErrorMessage(error),
      });
    }
  }

  static async getMany(req: Request, res: Response) {
    try {
      const { barbershopId } = req.params;
      const { type, startDate, endDate } = req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const exceptions = await GlobalExceptionService.findMany(barbershopId, filters);

      res.json({
        success: true,
        message: 'Exceções globais recuperadas com sucesso',
        data: exceptions,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar exceções globais',
        error: getErrorMessage(error),
      });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exception = await GlobalExceptionService.findById(id);

      if (!exception) {
        return res.status(404).json({
          success: false,
          message: 'Exceção global não encontrada',
        });
      }

      return res.json({
        success: true,
        message: 'Exceção global recuperada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar exceção global',
        error: getErrorMessage(error),
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exception = await GlobalExceptionService.update(id, req.body);

      res.json({
        success: true,
        message: 'Exceção global atualizada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao atualizar exceção global',
        error: getErrorMessage(error),
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await GlobalExceptionService.delete(id);

      res.json({
        success: true,
        message: 'Exceção global removida com sucesso',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao remover exceção global',
        error: getErrorMessage(error),
      });
    }
  }
}

// ========================================
// CONTROLLER DE EXCEÇÕES DE BARBEIROS
// ========================================

export class BarberExceptionController {
  static async create(req: Request, res: Response) {
    try {
      const exception = await BarberExceptionService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Exceção de barbeiro criada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao criar exceção de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async getMany(req: Request, res: Response) {
    try {
      const { barberId, barbershopId, type, startDate, endDate } = req.query;

      const filters: any = {};
      if (barberId) filters.barberId = barberId as string;
      if (barbershopId) filters.barbershopId = barbershopId as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const exceptions = await BarberExceptionService.findMany(filters);

      res.json({
        success: true,
        message: 'Exceções de barbeiros recuperadas com sucesso',
        data: exceptions,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar exceções de barbeiros',
        error: getErrorMessage(error),
      });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exception = await BarberExceptionService.findById(id);

      if (!exception) {
        return res.status(404).json({
          success: false,
          message: 'Exceção de barbeiro não encontrada',
        });
      }

      return res.json({
        success: true,
        message: 'Exceção de barbeiro recuperada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar exceção de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exception = await BarberExceptionService.update(id, req.body);

      res.json({
        success: true,
        message: 'Exceção de barbeiro atualizada com sucesso',
        data: exception,
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao atualizar exceção de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await BarberExceptionService.delete(id);

      res.json({
        success: true,
        message: 'Exceção de barbeiro removida com sucesso',
      });
    } catch (error: unknown) {
      res.status(400).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao remover exceção de barbeiro',
        error: getErrorMessage(error),
      });
    }
  }
}

// ========================================
// CONTROLLER DE DISPONIBILIDADE
// ========================================

export class AvailabilityController {
  static async getAvailability(req: Request, res: Response) {
    try {
      const { barbershopId, date } = req.params;
      const { barberId, serviceDuration } = req.query;

      const availability = await AvailabilityService.getAvailability(
        barbershopId,
        date,
        barberId as string | undefined,
        serviceDuration ? parseInt(serviceDuration as string) : undefined
      );

      res.json({
        success: true,
        message: 'Disponibilidade recuperada com sucesso',
        data: availability,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar disponibilidade',
        error: getErrorMessage(error),
      });
    }
  }
  static async getBarberAvailability(req: Request, res: Response) {
    try {
      const { barberId, date } = req.params;
      const { serviceDuration } = req.query;

      // Buscar barbeiro para obter barbershopId
      const barber = await BarberScheduleService.findMany({ barberId });
      if (!barber.length) {
        return res.status(404).json({
          success: false,
          message: 'Barbeiro não encontrado',
        });
      }

      const barbershopId = barber[0].barber.barbershopId;

      const availability = await AvailabilityService.getAvailability(
        barbershopId,
        date,
        barberId,
        serviceDuration ? parseInt(serviceDuration as string) : undefined
      );

      return res.json({
        success: true,
        message: 'Disponibilidade do barbeiro recuperada com sucesso',
        data: availability,
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        message: getErrorMessage(error) || 'Erro ao buscar disponibilidade do barbeiro',
        error: getErrorMessage(error),
      });
    }
  }
}
