import { PrismaClient, ExceptionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const createGlobalScheduleSchema = z.object({
  barbershopId: z.string().cuid(),
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  lunchStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  lunchEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const updateGlobalScheduleSchema = z.object({
  isOpen: z.boolean().optional(),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  lunchStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  lunchEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const createBarberScheduleSchema = z.object({
  barberId: z.string().cuid(),
  dayOfWeek: z.number().min(0).max(6),
  isWorking: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const updateBarberScheduleSchema = z.object({
  isWorking: z.boolean().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const createGlobalExceptionSchema = z.object({
  barbershopId: z.string().cuid(),
  date: z.string().datetime(),
  type: z.nativeEnum(ExceptionType),
  reason: z.string().min(1).max(255),
  specialOpenTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  specialCloseTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

const createBarberExceptionSchema = z.object({
  barberId: z.string().cuid(),
  date: z.string().datetime(),
  type: z.nativeEnum(ExceptionType),
  reason: z.string().min(1).max(255),
  specialStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  specialEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

// ========================================
// SERVIÇOS DE HORÁRIOS GLOBAIS
// ========================================

export class GlobalScheduleService {
  static async create(data: z.infer<typeof createGlobalScheduleSchema>) {
    const validatedData = createGlobalScheduleSchema.parse(data);
    
    // Verificar se já existe horário para este dia
    const existingSchedule = await prisma.globalSchedule.findUnique({
      where: {
        barbershopId_dayOfWeek: {
          barbershopId: validatedData.barbershopId,
          dayOfWeek: validatedData.dayOfWeek,
        },
      },
    });

    if (existingSchedule) {
      throw new Error('Já existe um horário configurado para este dia da semana');
    }

    // Validar horários
    if (validatedData.isOpen) {
      if (!this.validateTimeOrder(validatedData.openTime, validatedData.closeTime)) {
        throw new Error('Horário de abertura deve ser anterior ao horário de fechamento');
      }

      if (validatedData.lunchStart && validatedData.lunchEnd) {
        if (!this.validateTimeOrder(validatedData.lunchStart, validatedData.lunchEnd)) {
          throw new Error('Horário de início do almoço deve ser anterior ao fim do almoço');
        }
        
        if (!this.validateTimeOrder(validatedData.openTime, validatedData.lunchStart) ||
            !this.validateTimeOrder(validatedData.lunchEnd, validatedData.closeTime)) {
          throw new Error('Horário de almoço deve estar dentro do horário de funcionamento');
        }
      }
    }

    return await prisma.globalSchedule.create({
      data: validatedData,
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async findMany(barbershopId: string, filters?: { dayOfWeek?: number; isOpen?: boolean }) {
    const where: any = { barbershopId };
    
    if (filters?.dayOfWeek !== undefined) {
      where.dayOfWeek = filters.dayOfWeek;
    }
    
    if (filters?.isOpen !== undefined) {
      where.isOpen = filters.isOpen;
    }

    return await prisma.globalSchedule.findMany({
      where,
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });
  }

  static async findById(id: string) {
    return await prisma.globalSchedule.findUnique({
      where: { id },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: z.infer<typeof updateGlobalScheduleSchema>) {
    const validatedData = updateGlobalScheduleSchema.parse(data);
    
    const currentSchedule = await this.findById(id);
    if (!currentSchedule) {
      throw new Error('Horário não encontrado');
    }

    // Validar horários se fornecidos
    const openTime = validatedData.openTime || currentSchedule.openTime;
    const closeTime = validatedData.closeTime || currentSchedule.closeTime;
    const isOpen = validatedData.isOpen !== undefined ? validatedData.isOpen : currentSchedule.isOpen;

    if (isOpen) {
      if (!this.validateTimeOrder(openTime, closeTime)) {
        throw new Error('Horário de abertura deve ser anterior ao horário de fechamento');
      }

      const lunchStart = validatedData.lunchStart || currentSchedule.lunchStart;
      const lunchEnd = validatedData.lunchEnd || currentSchedule.lunchEnd;

      if (lunchStart && lunchEnd) {
        if (!this.validateTimeOrder(lunchStart, lunchEnd)) {
          throw new Error('Horário de início do almoço deve ser anterior ao fim do almoço');
        }
        
        if (!this.validateTimeOrder(openTime, lunchStart) ||
            !this.validateTimeOrder(lunchEnd, closeTime)) {
          throw new Error('Horário de almoço deve estar dentro do horário de funcionamento');
        }
      }
    }

    return await prisma.globalSchedule.update({
      where: { id },
      data: validatedData,
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return await prisma.globalSchedule.delete({
      where: { id },
    });
  }

  private static validateTimeOrder(startTime: string, endTime: string): boolean {
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    return start < end;
  }
}

// ========================================
// SERVIÇOS DE HORÁRIOS DE BARBEIROS
// ========================================

export class BarberScheduleService {
  static async create(data: z.infer<typeof createBarberScheduleSchema>) {
    const validatedData = createBarberScheduleSchema.parse(data);
    
    // Verificar se já existe horário para este barbeiro neste dia
    const existingSchedule = await prisma.barberSchedule.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: validatedData.barberId,
          dayOfWeek: validatedData.dayOfWeek,
        },
      },
    });

    if (existingSchedule) {
      throw new Error('Já existe um horário configurado para este barbeiro neste dia da semana');
    }

    // Validar horários
    if (validatedData.isWorking) {
      if (!this.validateTimeOrder(validatedData.startTime, validatedData.endTime)) {
        throw new Error('Horário de início deve ser anterior ao horário de fim');
      }

      if (validatedData.breakStart && validatedData.breakEnd) {
        if (!this.validateTimeOrder(validatedData.breakStart, validatedData.breakEnd)) {
          throw new Error('Horário de início do intervalo deve ser anterior ao fim do intervalo');
        }
        
        if (!this.validateTimeOrder(validatedData.startTime, validatedData.breakStart) ||
            !this.validateTimeOrder(validatedData.breakEnd, validatedData.endTime)) {
          throw new Error('Horário de intervalo deve estar dentro do horário de trabalho');
        }
      }
    }

    return await prisma.barberSchedule.create({
      data: validatedData,
      include: {
        barber: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async findMany(filters?: { 
    barberId?: string; 
    barbershopId?: string; 
    dayOfWeek?: number; 
    isWorking?: boolean;
  }) {
    const where: any = {};
    
    if (filters?.barberId) {
      where.barberId = filters.barberId;
    }
    
    if (filters?.barbershopId) {
      where.barber = {
        barbershopId: filters.barbershopId,
      };
    }
    
    if (filters?.dayOfWeek !== undefined) {
      where.dayOfWeek = filters.dayOfWeek;
    }
    
    if (filters?.isWorking !== undefined) {
      where.isWorking = filters.isWorking;
    }

    return await prisma.barberSchedule.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { barber: { user: { name: 'asc' } } },
        { dayOfWeek: 'asc' },
      ],
    });
  }

  static async findById(id: string) {
    return await prisma.barberSchedule.findUnique({
      where: { id },
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(id: string, data: z.infer<typeof updateBarberScheduleSchema>) {
    const validatedData = updateBarberScheduleSchema.parse(data);
    
    const currentSchedule = await this.findById(id);
    if (!currentSchedule) {
      throw new Error('Horário não encontrado');
    }

    // Validar horários se fornecidos
    const startTime = validatedData.startTime || currentSchedule.startTime;
    const endTime = validatedData.endTime || currentSchedule.endTime;
    const isWorking = validatedData.isWorking !== undefined ? validatedData.isWorking : currentSchedule.isWorking;

    if (isWorking) {
      if (!this.validateTimeOrder(startTime, endTime)) {
        throw new Error('Horário de início deve ser anterior ao horário de fim');
      }

      const breakStart = validatedData.breakStart || currentSchedule.breakStart;
      const breakEnd = validatedData.breakEnd || currentSchedule.breakEnd;

      if (breakStart && breakEnd) {
        if (!this.validateTimeOrder(breakStart, breakEnd)) {
          throw new Error('Horário de início do intervalo deve ser anterior ao fim do intervalo');
        }
        
        if (!this.validateTimeOrder(startTime, breakStart) ||
            !this.validateTimeOrder(breakEnd, endTime)) {
          throw new Error('Horário de intervalo deve estar dentro do horário de trabalho');
        }
      }
    }

    return await prisma.barberSchedule.update({
      where: { id },
      data: validatedData,
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return await prisma.barberSchedule.delete({
      where: { id },
    });
  }

  private static validateTimeOrder(startTime: string, endTime: string): boolean {
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    return start < end;
  }
}

// ========================================
// SERVIÇOS DE EXCEÇÕES GLOBAIS
// ========================================

export class GlobalExceptionService {
  static async create(data: z.infer<typeof createGlobalExceptionSchema>) {
    const validatedData = createGlobalExceptionSchema.parse(data);
    
    // Verificar se já existe exceção para esta data
    const existingException = await prisma.globalException.findUnique({
      where: {
        barbershopId_date: {
          barbershopId: validatedData.barbershopId,
          date: new Date(validatedData.date),
        },
      },
    });

    if (existingException) {
      throw new Error('Já existe uma exceção configurada para esta data');
    }

    // Validar horários especiais se fornecidos
    if (validatedData.type === ExceptionType.SPECIAL_HOURS) {
      if (!validatedData.specialOpenTime || !validatedData.specialCloseTime) {
        throw new Error('Horários especiais são obrigatórios para exceção do tipo SPECIAL_HOURS');
      }
      
      if (!this.validateTimeOrder(validatedData.specialOpenTime, validatedData.specialCloseTime)) {
        throw new Error('Horário de abertura especial deve ser anterior ao horário de fechamento especial');
      }
    }

    return await prisma.globalException.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
      },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async findMany(barbershopId: string, filters?: { 
    type?: ExceptionType; 
    startDate?: string; 
    endDate?: string;
  }) {
    const where: any = { barbershopId };
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return await prisma.globalException.findMany({
      where,
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  static async findById(id: string) {
    return await prisma.globalException.findUnique({
      where: { id },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: Partial<z.infer<typeof createGlobalExceptionSchema>>) {
    const currentException = await this.findById(id);
    if (!currentException) {
      throw new Error('Exceção não encontrada');
    }

    // Validar horários especiais se fornecidos
    const type = data.type || currentException.type;
    if (type === ExceptionType.SPECIAL_HOURS) {
      const openTime = data.specialOpenTime || currentException.specialOpenTime;
      const closeTime = data.specialCloseTime || currentException.specialCloseTime;
      
      if (!openTime || !closeTime) {
        throw new Error('Horários especiais são obrigatórios para exceção do tipo SPECIAL_HOURS');
      }
      
      if (!this.validateTimeOrder(openTime, closeTime)) {
        throw new Error('Horário de abertura especial deve ser anterior ao horário de fechamento especial');
      }
    }

    return await prisma.globalException.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return await prisma.globalException.delete({
      where: { id },
    });
  }

  private static validateTimeOrder(startTime: string, endTime: string): boolean {
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    return start < end;
  }
}

// ========================================
// SERVIÇOS DE EXCEÇÕES DE BARBEIROS
// ========================================

export class BarberExceptionService {
  static async create(data: z.infer<typeof createBarberExceptionSchema>) {
    const validatedData = createBarberExceptionSchema.parse(data);
    
    // Verificar se já existe exceção para este barbeiro nesta data
    const existingException = await prisma.barberException.findUnique({
      where: {
        barberId_date: {
          barberId: validatedData.barberId,
          date: new Date(validatedData.date),
        },
      },
    });

    if (existingException) {
      throw new Error('Já existe uma exceção configurada para este barbeiro nesta data');
    }

    // Validar horários especiais se fornecidos
    if (validatedData.type === ExceptionType.SPECIAL_HOURS || validatedData.type === ExceptionType.AVAILABLE) {
      if (!validatedData.specialStartTime || !validatedData.specialEndTime) {
        throw new Error('Horários especiais são obrigatórios para exceção do tipo SPECIAL_HOURS ou AVAILABLE');
      }
      
      if (!this.validateTimeOrder(validatedData.specialStartTime, validatedData.specialEndTime)) {
        throw new Error('Horário de início especial deve ser anterior ao horário de fim especial');
      }
    }

    return await prisma.barberException.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
      },
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async findMany(filters?: { 
    barberId?: string;
    barbershopId?: string;
    type?: ExceptionType; 
    startDate?: string; 
    endDate?: string;
  }) {
    const where: any = {};
    
    if (filters?.barberId) {
      where.barberId = filters.barberId;
    }
    
    if (filters?.barbershopId) {
      where.barber = {
        barbershopId: filters.barbershopId,
      };
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    return await prisma.barberException.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { barber: { user: { name: 'asc' } } },
      ],
    });
  }

  static async findById(id: string) {
    return await prisma.barberException.findUnique({
      where: { id },
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(id: string, data: Partial<z.infer<typeof createBarberExceptionSchema>>) {
    const currentException = await this.findById(id);
    if (!currentException) {
      throw new Error('Exceção não encontrada');
    }

    // Validar horários especiais se fornecidos
    const type = data.type || currentException.type;
    if (type === ExceptionType.SPECIAL_HOURS || type === ExceptionType.AVAILABLE) {
      const startTime = data.specialStartTime || currentException.specialStartTime;
      const endTime = data.specialEndTime || currentException.specialEndTime;
      
      if (!startTime || !endTime) {
        throw new Error('Horários especiais são obrigatórios para exceção do tipo SPECIAL_HOURS ou AVAILABLE');
      }
      
      if (!this.validateTimeOrder(startTime, endTime)) {
        throw new Error('Horário de início especial deve ser anterior ao horário de fim especial');
      }
    }

    return await prisma.barberException.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async delete(id: string) {
    return await prisma.barberException.delete({
      where: { id },
    });
  }

  private static validateTimeOrder(startTime: string, endTime: string): boolean {
    const start = new Date(`2024-01-01T${startTime}:00`);
    const end = new Date(`2024-01-01T${endTime}:00`);
    return start < end;
  }
}

// ========================================
// SERVIÇO DE DISPONIBILIDADE (COMPLEXO)
// ========================================

export class AvailabilityService {
  /**
   * Calcula a disponibilidade de barbeiros para uma data específica
   * Seguindo a ordem de precedência:
   * 1. Exceção Individual do Barbeiro (ABSOLUTA)
   * 2. Horário Individual do Barbeiro
   * 3. Exceção Global da Barbearia
   * 4. Horário Global da Barbearia (apenas fallback)
   */
  static async getAvailability(
    barbershopId: string,
    date: string,
    barberId?: string,
    serviceDuration?: number
  ) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Buscar barbeiros (filtrar por barberId se fornecido)
    const barbersQuery: any = {
      barbershopId,
      isActive: true,
    };
    
    if (barberId) {
      barbersQuery.id = barberId;
    }

    const barbers = await prisma.barber.findMany({
      where: barbersQuery,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        schedules: {
          where: {
            dayOfWeek,
          },
        },
        exceptions: {
          where: {
            date: targetDate,
          },
        },
      },
    });

    // Buscar horário e exceção global
    const globalSchedule = await prisma.globalSchedule.findUnique({
      where: {
        barbershopId_dayOfWeek: {
          barbershopId,
          dayOfWeek,
        },
      },
    });

    const globalException = await prisma.globalException.findUnique({
      where: {
        barbershopId_date: {
          barbershopId,
          date: targetDate,
        },
      },
    });

    // Calcular disponibilidade para cada barbeiro
    const barbersAvailability = barbers.map(barber => {
      const schedule = barber.schedules[0]; // horário individual
      const exception = barber.exceptions[0]; // exceção individual

      return this.calculateBarberAvailability(
        barber,
        schedule,
        exception,
        globalSchedule,
        globalException,
        serviceDuration || 30 // padrão 30 minutos
      );
    });

    return {
      date,
      barbershopId,
      barbers: barbersAvailability,
      globalSchedule,
      globalException,
    };
  }

  private static calculateBarberAvailability(
    barber: any,
    schedule: any,
    exception: any,
    globalSchedule: any,
    globalException: any,
    serviceDuration: number
  ) {
    // PRECEDÊNCIA 1: Exceção Individual (ABSOLUTA)
    if (exception) {
      switch (exception.type) {
        case ExceptionType.OFF:
        case ExceptionType.VACATION:
        case ExceptionType.CLOSED:
          return {
            barberId: barber.id,
            barberName: barber.user.name,
            isWorking: false,
            availableSlots: [],
            schedule,
            exception,
            globalException,
          };
        
        case ExceptionType.SPECIAL_HOURS:
        case ExceptionType.AVAILABLE:
          return {
            barberId: barber.id,
            barberName: barber.user.name,
            isWorking: true,
            availableSlots: this.generateTimeSlots(
              exception.specialStartTime,
              exception.specialEndTime,
              serviceDuration
            ),
            schedule,
            exception,
            globalException,
          };
      }
    }

    // PRECEDÊNCIA 2: Horário Individual
    if (schedule) {
      if (!schedule.isWorking) {
        return {
          barberId: barber.id,
          barberName: barber.user.name,
          isWorking: false,
          availableSlots: [],
          schedule,
          exception,
          globalException,
        };
      }

      const slots = this.generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        serviceDuration,
        schedule.breakStart,
        schedule.breakEnd
      );

      return {
        barberId: barber.id,
        barberName: barber.user.name,
        isWorking: true,
        availableSlots: slots,
        schedule,
        exception,
        globalException,
      };
    }

    // PRECEDÊNCIA 3: Exceção Global
    if (globalException) {
      switch (globalException.type) {
        case ExceptionType.CLOSED:
          return {
            barberId: barber.id,
            barberName: barber.user.name,
            isWorking: false,
            availableSlots: [],
            schedule,
            exception,
            globalException,
          };
        
        case ExceptionType.SPECIAL_HOURS:
          return {
            barberId: barber.id,
            barberName: barber.user.name,
            isWorking: true,
            availableSlots: this.generateTimeSlots(
              globalException.specialOpenTime!,
              globalException.specialCloseTime!,
              serviceDuration
            ),
            schedule,
            exception,
            globalException,
          };
      }
    }

    // PRECEDÊNCIA 4: Horário Global (fallback)
    if (globalSchedule) {
      if (!globalSchedule.isOpen) {
        return {
          barberId: barber.id,
          barberName: barber.user.name,
          isWorking: false,
          availableSlots: [],
          schedule,
          exception,
          globalException,
        };
      }

      const slots = this.generateTimeSlots(
        globalSchedule.openTime,
        globalSchedule.closeTime,
        serviceDuration,
        globalSchedule.lunchStart,
        globalSchedule.lunchEnd
      );

      return {
        barberId: barber.id,
        barberName: barber.user.name,
        isWorking: true,
        availableSlots: slots,
        schedule,
        exception,
        globalException,
      };
    }

    // Nenhuma configuração encontrada
    return {
      barberId: barber.id,
      barberName: barber.user.name,
      isWorking: false,
      availableSlots: [],
      schedule,
      exception,
      globalException,
    };
  }

  private static generateTimeSlots(
    startTime: string,
    endTime: string,
    serviceDuration: number,
    breakStart?: string,
    breakEnd?: string
  ) {
    const slots = [];
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const breakStartMin = breakStart ? this.timeToMinutes(breakStart) : null;
    const breakEndMin = breakEnd ? this.timeToMinutes(breakEnd) : null;

    for (let current = start; current + serviceDuration <= end; current += serviceDuration) {
      // Verificar se o slot não conflita com o intervalo
      if (breakStartMin && breakEndMin) {
        // Se o slot começa antes do break e termina depois do início do break, pular
        if (current < breakEndMin && current + serviceDuration > breakStartMin) {
          continue;
        }
      }

      slots.push({
        start: this.minutesToTime(current),
        end: this.minutesToTime(current + serviceDuration),
      });
    }

    return slots;
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}