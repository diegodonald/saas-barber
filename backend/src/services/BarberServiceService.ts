import { PrismaClient, BarberService, Prisma } from '@prisma/client';

// Interfaces para dados de entrada
export interface CreateBarberServiceData {
  barberId: string;
  serviceId: string;
  customPrice?: number;
  isActive?: boolean;
}

export interface UpdateBarberServiceData {
  customPrice?: number;
  isActive?: boolean;
}

// Interfaces para filtros
export interface BarberServiceFilters {
  barberId?: string;
  serviceId?: string;
  barbershopId?: string;
  isActive?: boolean;
  hasCustomPrice?: boolean;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'customPrice' | 'serviceName' | 'barberName';
  orderDirection?: 'asc' | 'desc';
}

// Interface para estatísticas
export interface BarberServiceStats {
  total: number;
  active: number;
  inactive: number;
  withCustomPrice: number;
  withoutCustomPrice: number;
  totalServices: number;
  totalBarbers: number;
  avgCustomPrice: number;
}

// Interface para retorno com detalhes
export interface BarberServiceWithDetails extends BarberService {
  barber: {
    id: string;
    name: string;
    phone: string;
    barbershopId: string;
  };
  service: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    category: string | null;
    barbershopId: string;
  };
  effectivePrice: number; // customPrice ou service.price
}

export class BarberServiceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar nova atribuição de serviço para barbeiro
   */
  async create(data: CreateBarberServiceData): Promise<BarberServiceWithDetails> {
    // Validar se barbeiro existe e pertence à mesma barbearia do serviço
    const [barber, service] = await Promise.all([
      this.prisma.barber.findUnique({
        where: { id: data.barberId },
        include: { user: true }
      }),
      this.prisma.service.findUnique({
        where: { id: data.serviceId }
      })
    ]);

    if (!barber) {
      throw new Error('Barbeiro não encontrado');
    }

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    if (!service.isActive) {
      throw new Error('Não é possível atribuir serviço inativo');
    }

    if (barber.barbershopId !== service.barbershopId) {
      throw new Error('Barbeiro e serviço devem pertencer à mesma barbearia');
    }

    // Verificar se já existe esta atribuição
    const existingAssignment = await this.prisma.barberService.findUnique({
      where: {
        barberId_serviceId: {
          barberId: data.barberId,
          serviceId: data.serviceId
        }
      }
    });

    if (existingAssignment) {
      throw new Error('Barbeiro já possui este serviço atribuído');
    }

    // Validar preço customizado se fornecido
    if (data.customPrice !== undefined) {
      if (data.customPrice < 0) {
        throw new Error('Preço customizado não pode ser negativo');
      }

      // Verificar se preço não é muito diferente do padrão (regra de negócio)
      const basePrice = Number(service.price);
      const customPrice = data.customPrice;
      
      if (customPrice > basePrice * 3) {
        throw new Error('Preço customizado não pode ser mais que 3x o preço base');
      }
    }

    // Criar atribuição
    const barberService = await this.prisma.barberService.create({
      data: {
        barberId: data.barberId,
        serviceId: data.serviceId,
        customPrice: data.customPrice ? new Prisma.Decimal(data.customPrice) : null,
        isActive: data.isActive ?? true
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      }
    });

    return {
      ...barberService,
      effectivePrice: Number(barberService.customPrice || barberService.service.price)
    };
  }

  /**
   * Buscar atribuições com filtros avançados
   */
  async findMany(filters: BarberServiceFilters = {}) {
    const where: Prisma.BarberServiceWhereInput = {};

    // Filtros básicos
    if (filters.barberId) where.barberId = filters.barberId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    // Filtro por barbearia
    if (filters.barbershopId) {
      where.barber = { barbershopId: filters.barbershopId };
    }

    // Filtro por preço customizado
    if (filters.hasCustomPrice !== undefined) {
      where.customPrice = filters.hasCustomPrice ? { not: null } : null;
    }

    // Filtros de preço (considerando preço customizado ou padrão)
    if (filters.minPrice || filters.maxPrice) {
      const priceConditions: Prisma.BarberServiceWhereInput[] = [];
      
      // Condições para preço customizado
      if (filters.minPrice && filters.maxPrice) {
        priceConditions.push({
          AND: [
            { customPrice: { not: null } },
            { customPrice: { gte: new Prisma.Decimal(filters.minPrice) } },
            { customPrice: { lte: new Prisma.Decimal(filters.maxPrice) } }
          ]
        });
        priceConditions.push({
          AND: [
            { customPrice: null },
            { service: { price: { gte: new Prisma.Decimal(filters.minPrice) } } },
            { service: { price: { lte: new Prisma.Decimal(filters.maxPrice) } } }
          ]
        });
      } else if (filters.minPrice) {
        priceConditions.push({
          OR: [
            { customPrice: { gte: new Prisma.Decimal(filters.minPrice) } },
            { 
              AND: [
                { customPrice: null },
                { service: { price: { gte: new Prisma.Decimal(filters.minPrice) } } }
              ]
            }
          ]
        });
      } else if (filters.maxPrice) {
        priceConditions.push({
          OR: [
            { customPrice: { lte: new Prisma.Decimal(filters.maxPrice) } },
            { 
              AND: [
                { customPrice: null },
                { service: { price: { lte: new Prisma.Decimal(filters.maxPrice) } } }
              ]
            }
          ]
        });
      }

      if (priceConditions.length > 0) {
        where.OR = priceConditions;
      }
    }

    // Filtro por categoria
    if (filters.category) {
      where.service = { 
        ...where.service,
        category: filters.category 
      };
    }

    // Configurar ordenação
    let orderBy: Prisma.BarberServiceOrderByWithRelationInput = { createdAt: 'desc' };
    
    if (filters.orderBy) {
      const direction = filters.orderDirection || 'asc';
      
      switch (filters.orderBy) {
        case 'createdAt':
          orderBy = { createdAt: direction };
          break;
        case 'customPrice':
          orderBy = { customPrice: direction };
          break;
        case 'serviceName':
          orderBy = { service: { name: direction } };
          break;
        case 'barberName':
          orderBy = { barber: { name: direction } };
          break;
      }
    }

    // Executar query
    const [barberServices, total] = await Promise.all([
      this.prisma.barberService.findMany({
        where,
        include: {
          barber: {
            select: {
              id: true,
              name: true,
              phone: true,
              barbershopId: true
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              duration: true,
              price: true,
              category: true,
              barbershopId: true
            }
          }
        },
        orderBy,
        skip: filters.skip,
        take: filters.take
      }),
      this.prisma.barberService.count({ where })
    ]);

    // Adicionar preço efetivo
    const barberServicesWithDetails: BarberServiceWithDetails[] = barberServices.map(bs => ({
      ...bs,
      effectivePrice: Number(bs.customPrice || bs.service.price)
    }));

    return {
      data: barberServicesWithDetails,
      total,
      page: filters.skip && filters.take ? Math.floor(filters.skip / filters.take) + 1 : 1,
      totalPages: filters.take ? Math.ceil(total / filters.take) : 1
    };
  }

  /**
   * Buscar atribuição por ID
   */
  async findById(id: string): Promise<BarberServiceWithDetails | null> {
    const barberService = await this.prisma.barberService.findUnique({
      where: { id },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      }
    });

    if (!barberService) return null;

    return {
      ...barberService,
      effectivePrice: Number(barberService.customPrice || barberService.service.price)
    };
  }

  /**
   * Buscar barbeiros que executam um serviço específico
   */
  async findBarbersByService(serviceId: string, barbershopId?: string): Promise<BarberServiceWithDetails[]> {
    const where: Prisma.BarberServiceWhereInput = {
      serviceId,
      isActive: true,
      service: { isActive: true }
    };

    if (barbershopId) {
      where.barber = { barbershopId };
    }

    const barberServices = await this.prisma.barberService.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      },
      orderBy: [
        { customPrice: 'asc' }, // Barbeiros com preço mais baixo primeiro
        { barber: { name: 'asc' } }
      ]
    });

    return barberServices.map(bs => ({
      ...bs,
      effectivePrice: Number(bs.customPrice || bs.service.price)
    }));
  }

  /**
   * Buscar serviços de um barbeiro específico
   */
  async findServicesByBarber(barberId: string, includeInactive = false): Promise<BarberServiceWithDetails[]> {
    const where: Prisma.BarberServiceWhereInput = {
      barberId,
      service: { isActive: true }
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const barberServices = await this.prisma.barberService.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      },
      orderBy: { service: { name: 'asc' } }
    });

    return barberServices.map(bs => ({
      ...bs,
      effectivePrice: Number(bs.customPrice || bs.service.price)
    }));
  }

  /**
   * Atualizar atribuição
   */
  async update(id: string, data: UpdateBarberServiceData): Promise<BarberServiceWithDetails> {
    const existingBarberService = await this.prisma.barberService.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!existingBarberService) {
      throw new Error('Atribuição não encontrada');
    }

    // Validar preço customizado se fornecido
    if (data.customPrice !== undefined && data.customPrice !== null) {
      if (data.customPrice < 0) {
        throw new Error('Preço customizado não pode ser negativo');
      }

      // Verificar se preço não é muito diferente do padrão
      const basePrice = Number(existingBarberService.service.price);
      
      if (data.customPrice > basePrice * 3) {
        throw new Error('Preço customizado não pode ser mais que 3x o preço base');
      }
    }

    const barberService = await this.prisma.barberService.update({
      where: { id },
      data: {
        customPrice: data.customPrice !== undefined ? 
          (data.customPrice === null ? null : new Prisma.Decimal(data.customPrice)) : 
          undefined,
        isActive: data.isActive
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      }
    });

    return {
      ...barberService,
      effectivePrice: Number(barberService.customPrice || barberService.service.price)
    };
  }

  /**
   * Remover atribuição (soft delete - desativar)
   */
  async delete(id: string): Promise<void> {
    const barberService = await this.prisma.barberService.findUnique({
      where: { id }
    });

    if (!barberService) {
      throw new Error('Atribuição não encontrada');
    }

    // Verificar se existem agendamentos futuros com esta atribuição
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        barberId: barberService.barberId,
        serviceId: barberService.serviceId,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      }
    });

    if (futureAppointments > 0) {
      throw new Error(`Não é possível remover: existem ${futureAppointments} agendamento(s) futuro(s) com esta atribuição`);
    }

    // Soft delete - apenas desativar
    await this.prisma.barberService.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Reativar atribuição
   */
  async reactivate(id: string): Promise<BarberServiceWithDetails> {
    const barberService = await this.prisma.barberService.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!barberService) {
      throw new Error('Atribuição não encontrada');
    }

    if (!barberService.service.isActive) {
      throw new Error('Não é possível reativar: serviço está inativo');
    }

    const reactivated = await this.prisma.barberService.update({
      where: { id },
      data: { isActive: true },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            phone: true,
            barbershopId: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            category: true,
            barbershopId: true
          }
        }
      }
    });

    return {
      ...reactivated,
      effectivePrice: Number(reactivated.customPrice || reactivated.service.price)
    };
  }

  /**
   * Obter estatísticas de atribuições
   */
  async getStats(barbershopId?: string): Promise<BarberServiceStats> {
    const where: Prisma.BarberServiceWhereInput = {};
    
    if (barbershopId) {
      where.barber = { barbershopId };
    }

    const [
      total,
      active,
      inactive,
      withCustomPrice,
      withoutCustomPrice,
      avgCustomPriceResult,
      totalServices,
      totalBarbers
    ] = await Promise.all([
      this.prisma.barberService.count({ where }),
      this.prisma.barberService.count({ where: { ...where, isActive: true } }),
      this.prisma.barberService.count({ where: { ...where, isActive: false } }),
      this.prisma.barberService.count({ where: { ...where, customPrice: { not: null } } }),
      this.prisma.barberService.count({ where: { ...where, customPrice: null } }),
      this.prisma.barberService.aggregate({
        where: { ...where, customPrice: { not: null } },
        _avg: { customPrice: true }
      }),
      this.prisma.service.count({
        where: barbershopId ? { barbershopId } : {}
      }),
      this.prisma.barber.count({
        where: barbershopId ? { barbershopId } : {}
      })
    ]);

    return {
      total,
      active,
      inactive,
      withCustomPrice,
      withoutCustomPrice,
      totalServices,
      totalBarbers,
      avgCustomPrice: Number(avgCustomPriceResult._avg.customPrice || 0)
    };
  }

  /**
   * Verificar se barbeiro pode executar serviço
   */
  async canBarberPerformService(barberId: string, serviceId: string): Promise<boolean> {
    const barberService = await this.prisma.barberService.findUnique({
      where: {
        barberId_serviceId: {
          barberId,
          serviceId
        }
      },
      include: { service: true }
    });

    return !!(barberService && barberService.isActive && barberService.service.isActive);
  }

  /**
   * Obter preço efetivo para barbeiro e serviço
   */
  async getEffectivePrice(barberId: string, serviceId: string): Promise<number | null> {
    const barberService = await this.prisma.barberService.findUnique({
      where: {
        barberId_serviceId: {
          barberId,
          serviceId
        }
      },
      include: { service: true }
    });

    if (!barberService || !barberService.isActive || !barberService.service.isActive) {
      return null;
    }

    return Number(barberService.customPrice || barberService.service.price);
  }
} 