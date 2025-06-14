import { PrismaClient, Appointment, AppointmentStatus, Prisma } from '@prisma/client';
import { addMinutes, format, parseISO, startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CreateAppointmentData {
  barbershopId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startTime: Date;
  notes?: string;
}

export interface UpdateAppointmentData {
  startTime?: Date;
  status?: AppointmentStatus;
  notes?: string;
}

export interface AppointmentFilters {
  barbershopId?: string;
  barberId?: string;
  clientId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
  orderBy?: 'startTime' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  averagePrice: number;
}

export class AppointmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar novo agendamento com validações rigorosas
   */
  async create(data: CreateAppointmentData): Promise<Appointment> {
    // 1. Validar se o barbeiro existe e está ativo
    const barber = await this.prisma.barber.findFirst({
      where: {
        id: data.barberId,
        barbershopId: data.barbershopId,
        isActive: true
      },
      include: {
        services: {
          where: {
            serviceId: data.serviceId,
            isActive: true
          }
        }
      }
    });

    if (!barber) {
      throw new Error('Barbeiro não encontrado ou inativo');
    }

    // 2. Validar se o barbeiro executa o serviço
    if (barber.services.length === 0) {
      throw new Error('Barbeiro não executa este serviço');
    }

    // 3. Buscar informações do serviço
    const service = await this.prisma.service.findFirst({
      where: {
        id: data.serviceId,
        barbershopId: data.barbershopId,
        isActive: true
      }
    });

    if (!service) {
      throw new Error('Serviço não encontrado ou inativo');
    }

    // 4. Calcular horário de término
    const endTime = addMinutes(data.startTime, service.duration);

    // 5. Validar se não há conflitos de horário
    await this.validateTimeConflict(data.barberId, data.startTime, endTime);

    // 6. Validar se está dentro do horário de funcionamento
    await this.validateWorkingHours(data.barberId, data.barbershopId, data.startTime, endTime);

    // 7. Calcular preço (usar preço específico do barbeiro se existir)
    const barberService = barber.services[0];
    const totalPrice = barberService.customPrice || service.price;

    // 8. Criar o agendamento
    const appointment = await this.prisma.appointment.create({
      data: {
        barbershopId: data.barbershopId,
        barberId: data.barberId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime,
        totalPrice,
        notes: data.notes,
        status: AppointmentStatus.SCHEDULED
      },
      include: {
        barber: {
          include: {
            user: true
          }
        },
        client: true,
        service: true,
        barbershop: true
      }
    });

    return appointment;
  }

  /**
   * Buscar agendamento por ID
   */
  async findById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: {
          include: {
            user: true
          }
        },
        client: true,
        service: true,
        barbershop: true
      }
    });
  }

  /**
   * Listar agendamentos com filtros
   */
  async findMany(filters: AppointmentFilters = {}) {
    const {
      barbershopId,
      barberId,
      clientId,
      serviceId,
      status,
      startDate,
      endDate,
      skip = 0,
      take = 20,
      orderBy = 'startTime',
      orderDirection = 'asc'
    } = filters;

    const where: Prisma.AppointmentWhereInput = {};

    if (barbershopId) where.barbershopId = barbershopId;
    if (barberId) where.barberId = barberId;
    if (clientId) where.clientId = clientId;
    if (serviceId) where.serviceId = serviceId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startOfDay(startDate);
      if (endDate) where.startTime.lte = endOfDay(endDate);
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: {
          [orderBy]: orderDirection
        },
        include: {
          barber: {
            include: {
              user: true
            }
          },
          client: true,
          service: true,
          barbershop: true
        }
      }),
      this.prisma.appointment.count({ where })
    ]);

    return {
      appointments,
      total,
      hasMore: skip + take < total
    };
  }

  /**
   * Atualizar agendamento
   */
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!existingAppointment) {
      throw new Error('Agendamento não encontrado');
    }

    // Se está alterando o horário, validar conflitos
    if (data.startTime) {
      const endTime = addMinutes(data.startTime, existingAppointment.service.duration);
      
      await this.validateTimeConflict(
        existingAppointment.barberId, 
        data.startTime, 
        endTime, 
        id // Excluir o próprio agendamento da validação
      );

      await this.validateWorkingHours(
        existingAppointment.barberId,
        existingAppointment.barbershopId,
        data.startTime,
        endTime
      );

      // Atualizar também o endTime
      return this.prisma.appointment.update({
        where: { id },
        data: {
          ...data,
          endTime
        },
        include: {
          barber: {
            include: {
              user: true
            }
          },
          client: true,
          service: true,
          barbershop: true
        }
      });
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        barber: {
          include: {
            user: true
          }
        },
        client: true,
        service: true,
        barbershop: true
      }
    });
  }

  /**
   * Cancelar agendamento
   */
  async cancel(id: string, reason?: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.CANCELLED,
      notes: reason
    });
  }

  /**
   * Confirmar agendamento
   */
  async confirm(id: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.CONFIRMED
    });
  }

  /**
   * Marcar como em progresso
   */
  async startService(id: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.IN_PROGRESS
    });
  }

  /**
   * Finalizar agendamento
   */
  async complete(id: string, notes?: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.COMPLETED,
      notes
    });
  }

  /**
   * Marcar como não compareceu
   */
  async markNoShow(id: string): Promise<Appointment> {
    return this.update(id, {
      status: AppointmentStatus.NO_SHOW
    });
  }

  /**
   * Gerar slots disponíveis para um barbeiro em uma data
   */
  async getAvailableSlots(
    barberId: string,
    barbershopId: string,
    date: Date,
    serviceDuration: number = 30
  ): Promise<AvailableSlot[]> {
    // 1. Buscar horários de trabalho do barbeiro
    const dayOfWeek = date.getDay();
    
    const [barberSchedule, globalSchedule, barberExceptions, globalExceptions] = await Promise.all([
      this.prisma.barberSchedule.findUnique({
        where: {
          barberId_dayOfWeek: {
            barberId,
            dayOfWeek
          }
        }
      }),
      this.prisma.globalSchedule.findUnique({
        where: {
          barbershopId_dayOfWeek: {
            barbershopId,
            dayOfWeek
          }
        }
      }),
      this.prisma.barberException.findUnique({
        where: {
          barberId_date: {
            barberId,
            date: startOfDay(date)
          }
        }
      }),
      this.prisma.globalException.findUnique({
        where: {
          barbershopId_date: {
            barbershopId,
            date: startOfDay(date)
          }
        }
      })
    ]);

    // 2. Determinar horários de funcionamento (precedência: exceção individual > horário individual > exceção global > horário global)
    let workingHours = this.getWorkingHours(barberSchedule, globalSchedule, barberExceptions, globalExceptions);
    
    if (!workingHours) {
      return []; // Não está trabalhando neste dia
    }

    // 3. Buscar agendamentos existentes do barbeiro nesta data
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        startTime: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        },
        status: {
          not: AppointmentStatus.CANCELLED
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // 4. Gerar slots de tempo
    const slots: AvailableSlot[] = [];
    const { startTime, endTime, breakStart, breakEnd } = workingHours;
    
    let currentTime = this.parseTimeToDate(date, startTime);
    const endDateTime = this.parseTimeToDate(date, endTime);
    const breakStartTime = breakStart ? this.parseTimeToDate(date, breakStart) : null;
    const breakEndTime = breakEnd ? this.parseTimeToDate(date, breakEnd) : null;

    while (isBefore(currentTime, endDateTime)) {
      const slotEndTime = addMinutes(currentTime, serviceDuration);
      
      // Verificar se o slot não ultrapassa o horário de trabalho
      if (isAfter(slotEndTime, endDateTime)) {
        break;
      }

      // Verificar se não está no horário de intervalo
      const isInBreak = breakStartTime && breakEndTime && 
        ((isAfter(currentTime, breakStartTime) || isEqual(currentTime, breakStartTime)) &&
         isBefore(slotEndTime, breakEndTime));

      // Verificar se há conflito com agendamentos existentes
      const hasConflict = existingAppointments.some(appointment => 
        (isBefore(currentTime, appointment.endTime) && isAfter(slotEndTime, appointment.startTime))
      );

      slots.push({
        startTime: new Date(currentTime),
        endTime: new Date(slotEndTime),
        available: !isInBreak && !hasConflict
      });

      currentTime = addMinutes(currentTime, 15); // Slots de 15 em 15 minutos
    }

    return slots;
  }

  /**
   * Obter estatísticas de agendamentos
   */
  async getStats(filters: Omit<AppointmentFilters, 'skip' | 'take' | 'orderBy' | 'orderDirection'> = {}): Promise<AppointmentStats> {
    const where: Prisma.AppointmentWhereInput = {};

    if (filters.barbershopId) where.barbershopId = filters.barbershopId;
    if (filters.barberId) where.barberId = filters.barberId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) where.startTime.gte = startOfDay(filters.startDate);
      if (filters.endDate) where.startTime.lte = endOfDay(filters.endDate);
    }

    const [
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      revenueData
    ] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.SCHEDULED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CONFIRMED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { ...where, status: AppointmentStatus.NO_SHOW } }),
      this.prisma.appointment.aggregate({
        where: {
          ...where,
          status: AppointmentStatus.COMPLETED
        },
        _sum: {
          totalPrice: true
        },
        _avg: {
          totalPrice: true
        }
      })
    ]);

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      totalRevenue: Number(revenueData._sum.totalPrice || 0),
      averagePrice: Number(revenueData._avg.totalPrice || 0)
    };
  }

  /**
   * Validar conflitos de horário
   */
  private async validateTimeConflict(
    barberId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeAppointmentId?: string
  ): Promise<void> {
    const where: Prisma.AppointmentWhereInput = {
      barberId,
      status: {
        not: AppointmentStatus.CANCELLED
      },
      OR: [
        {
          // Novo agendamento começa durante um existente
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          // Novo agendamento termina durante um existente
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        },
        {
          // Novo agendamento engloba um existente
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } }
          ]
        }
      ]
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflictingAppointment = await this.prisma.appointment.findFirst({
      where,
      include: {
        service: true
      }
    });

    if (conflictingAppointment) {
      throw new Error(
        `Conflito de horário detectado. Já existe um agendamento de ${format(conflictingAppointment.startTime, 'HH:mm', { locale: ptBR })} às ${format(conflictingAppointment.endTime, 'HH:mm', { locale: ptBR })} para o serviço "${conflictingAppointment.service.name}"`
      );
    }
  }

  /**
   * Validar se está dentro do horário de funcionamento
   */
  private async validateWorkingHours(
    barberId: string,
    barbershopId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    const dayOfWeek = startTime.getDay();
    
    const [barberSchedule, globalSchedule, barberExceptions, globalExceptions] = await Promise.all([
      this.prisma.barberSchedule.findUnique({
        where: {
          barberId_dayOfWeek: {
            barberId,
            dayOfWeek
          }
        }
      }),
      this.prisma.globalSchedule.findUnique({
        where: {
          barbershopId_dayOfWeek: {
            barbershopId,
            dayOfWeek
          }
        }
      }),
      this.prisma.barberException.findUnique({
        where: {
          barberId_date: {
            barberId,
            date: startOfDay(startTime)
          }
        }
      }),
      this.prisma.globalException.findUnique({
        where: {
          barbershopId_date: {
            barbershopId,
            date: startOfDay(startTime)
          }
        }
      })
    ]);

    const workingHours = this.getWorkingHours(barberSchedule, globalSchedule, barberExceptions, globalExceptions);
    
    if (!workingHours) {
      throw new Error('Barbeiro não está trabalhando neste dia');
    }

    const appointmentStartTime = format(startTime, 'HH:mm');
    const appointmentEndTime = format(endTime, 'HH:mm');

    if (appointmentStartTime < workingHours.startTime || appointmentEndTime > workingHours.endTime) {
      throw new Error(`Horário fora do funcionamento. Horário de trabalho: ${workingHours.startTime} às ${workingHours.endTime}`);
    }

    // Verificar se não está no horário de intervalo
    if (workingHours.breakStart && workingHours.breakEnd) {
      if ((appointmentStartTime >= workingHours.breakStart && appointmentStartTime < workingHours.breakEnd) ||
          (appointmentEndTime > workingHours.breakStart && appointmentEndTime <= workingHours.breakEnd)) {
        throw new Error(`Horário conflita com intervalo: ${workingHours.breakStart} às ${workingHours.breakEnd}`);
      }
    }
  }

  /**
   * Determinar horários de trabalho com precedência
   */
  private getWorkingHours(
    barberSchedule: any,
    globalSchedule: any,
    barberException: any,
    globalException: any
  ) {
    // Precedência: exceção individual > horário individual > exceção global > horário global
    
    // 1. Exceção individual (maior precedência)
    if (barberException) {
      if (barberException.type === 'CLOSED' || barberException.type === 'OFF' || barberException.type === 'VACATION') {
        return null; // Não está trabalhando
      }
      if (barberException.type === 'SPECIAL_HOURS' || barberException.type === 'AVAILABLE') {
        return {
          startTime: barberException.specialStartTime,
          endTime: barberException.specialEndTime,
          breakStart: null,
          breakEnd: null
        };
      }
    }

    // 2. Horário individual
    if (barberSchedule && barberSchedule.isWorking) {
      return {
        startTime: barberSchedule.startTime,
        endTime: barberSchedule.endTime,
        breakStart: barberSchedule.breakStart,
        breakEnd: barberSchedule.breakEnd
      };
    }

    // 3. Exceção global
    if (globalException) {
      if (globalException.type === 'CLOSED') {
        return null; // Barbearia fechada
      }
      if (globalException.type === 'SPECIAL_HOURS') {
        return {
          startTime: globalException.specialOpenTime,
          endTime: globalException.specialCloseTime,
          breakStart: null,
          breakEnd: null
        };
      }
    }

    // 4. Horário global (menor precedência)
    if (globalSchedule && globalSchedule.isOpen) {
      return {
        startTime: globalSchedule.openTime,
        endTime: globalSchedule.closeTime,
        breakStart: globalSchedule.lunchStart,
        breakEnd: globalSchedule.lunchEnd
      };
    }

    return null; // Não está trabalhando
  }

  /**
   * Converter string de tempo para Date
   */
  private parseTimeToDate(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}