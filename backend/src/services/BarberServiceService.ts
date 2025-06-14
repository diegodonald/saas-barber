import { PrismaClient, BarberService, Prisma } from '@prisma/client';

// Interfaces para dados de entrada
export interface CreateBarberServiceData {
  barberId: string;
  serviceId: string;
  customPrice?: number;
  isActive?: boolean;
}

export interface UpdateBarberServiceData {
  customPrice?: number | null;
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
    barbershopId: string;
    user: {
      id: string;
      name: string;
      phone: string | null;
    };
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
   * Helper para converter resultado do Prisma para BarberServiceWithDetails
   */
  private convertToDetails(barberService: any): BarberServiceWithDetails {
    return {
      ...barberService,
      service: {
        ...barberService.service,
        price: Number(barberService.service.price)
      },
      effectivePrice: Number(barberService.customPrice || barberService.service.price)
    };
  }

  /**
   * Criar nova atribuição de serviço para barbeiro
   */
  async create(data: CreateBarberServiceData): Promise<BarberServiceWithDetails> {
    // Verificar se barbeiro existe
    const barber = await this.prisma.barber.findUnique({
      where: { id: data.barberId },
      include: { user: true }
    });

    if (!barber) {
      throw new Error('Barbeiro não encontrado');
    }

    // Verificar se serviço existe
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId }
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Verificar se barbeiro e serviço pertencem à mesma barbearia
    if (barber.barbershopId !== service.barbershopId) {
      throw new Error('Barbeiro e serviço devem pertencer à mesma barbearia');
    }

    // Verificar se atribuição já existe
    const existingAssignment = await this.prisma.barberService.findFirst({
      where: {
        barberId: data.barberId,
        serviceId: data.serviceId
      }
    });

    if (existingAssignment) {
      throw new Error('Barbeiro já está atribuído a este serviço');
    }

    // Validar preço customizado se fornecido
    if (data.customPrice !== undefined && data.customPrice !== null) {
      if (data.customPrice < 0) {
        throw new Error('Preço customizado não pode ser negativo');
      }

      const basePrice = Number(service.price);
      if (data.customPrice > basePrice * 3) {
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
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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

    return this.convertToDetails(barberService);
  }

  /**
   * Listar atribuições com filtros
   */
  async findMany(filters: BarberServiceFilters = {}) {
    // Construir where clause
    const where: Prisma.BarberServiceWhereInput = {};

    if (filters.barberId) {
      where.barberId = filters.barberId;
    }

    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters.barbershopId) {
      where.barber = { barbershopId: filters.barbershopId };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.hasCustomPrice !== undefined) {
      where.customPrice = filters.hasCustomPrice ? { not: null } : null;
    }

    if (filters.category) {
      where.service = { category: filters.category };
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter: any = {};
      if (filters.minPrice) priceFilter.gte = new Prisma.Decimal(filters.minPrice);
      if (filters.maxPrice) priceFilter.lte = new Prisma.Decimal(filters.maxPrice);
      
      where.OR = [
        { customPrice: priceFilter },
        { 
          customPrice: null,
          service: { price: priceFilter }
        }
      ];
    }

    // Construir orderBy
    let orderBy: Prisma.BarberServiceOrderByWithRelationInput = { createdAt: 'desc' };

    if (filters.orderBy && filters.orderDirection) {
      const direction = filters.orderDirection;
      
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
          orderBy = { barber: { user: { name: direction } } };
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
              barbershopId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
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

    // Converter resultados
    const barberServicesWithDetails = barberServices.map(bs => this.convertToDetails(bs));

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
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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

    return this.convertToDetails(barberService);
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
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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
        { barber: { user: { name: 'asc' } } }
      ]
    });

    return barberServices.map(bs => this.convertToDetails(bs));
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
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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

    return barberServices.map(bs => this.convertToDetails(bs));
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
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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

    return this.convertToDetails(barberService);
  }

  /**
   * Deletar atribuição (soft delete)
   */
  async delete(id: string): Promise<void> {
    const existingBarberService = await this.prisma.barberService.findUnique({
      where: { id }
    });

    if (!existingBarberService) {
      throw new Error('Atribuição não encontrada');
    }

    // Verificar se há agendamentos futuros
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        barberId: existingBarberService.barberId,
        serviceId: existingBarberService.serviceId,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      }
    });

    if (futureAppointments > 0) {
      throw new Error('Não é possível remover atribuição com agendamentos futuros');
    }

    // Soft delete - marcar como inativo
    await this.prisma.barberService.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Reativar atribuição
   */
  async reactivate(id: string): Promise<BarberServiceWithDetails> {
    const existingBarberService = await this.prisma.barberService.findUnique({
      where: { id },
      include: { service: true, barber: true }
    });

    if (!existingBarberService) {
      throw new Error('Atribuição não encontrada');
    }

    // Verificar se serviço ainda está ativo
    if (!existingBarberService.service.isActive) {
      throw new Error('Não é possível reativar atribuição de serviço inativo');
    }

    const barberService = await this.prisma.barberService.update({
      where: { id },
      data: { isActive: true },
      include: {
        barber: {
          select: {
            id: true,
            barbershopId: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
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

    return this.convertToDetails(barberService);
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
      totalServices,
      totalBarbers,
      avgCustomPriceResult
    ] = await Promise.all([
      this.prisma.barberService.count({ where }),
      this.prisma.barberService.count({ where: { ...where, isActive: true } }),
      this.prisma.barberService.count({ where: { ...where, isActive: false } }),
      this.prisma.barberService.count({ where: { ...where, customPrice: { not: null } } }),
      this.prisma.barberService.count({ where: { ...where, customPrice: null } }),
      this.prisma.barberService.groupBy({
        by: ['serviceId'],
        where,
        _count: { serviceId: true }
      }),
      this.prisma.barberService.groupBy({
        by: ['barberId'],
        where,
        _count: { barberId: true }
      }),
      this.prisma.barberService.aggregate({
        where: { ...where, customPrice: { not: null } },
        _avg: { customPrice: true }
      })
    ]);

    return {
      total,
      active,
      inactive,
      withCustomPrice,
      withoutCustomPrice,
      totalServices: totalServices.length,
      totalBarbers: totalBarbers.length,
      avgCustomPrice: Number(avgCustomPriceResult._avg.customPrice || 0)
    };
  }

  /**
   * Verificar se barbeiro pode executar serviço
   */
  async canBarberPerformService(barberId: string, serviceId: string): Promise<boolean> {
    const assignment = await this.prisma.barberService.findFirst({
      where: {
        barberId,
        serviceId,
        isActive: true,
        service: { isActive: true }
      }
    });

    return !!assignment;
  }

  /**
   * Obter preço efetivo para barbeiro e serviço
   */
  async getEffectivePrice(barberId: string, serviceId: string): Promise<number | null> {
    const assignment = await this.prisma.barberService.findFirst({
      where: {
        barberId,
        serviceId,
        isActive: true
      },
      include: { service: true }
    });

    if (!assignment) return null;

    return Number(assignment.customPrice || assignment.service.price);
  }
} 