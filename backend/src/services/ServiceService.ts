import { PrismaClient, Service, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service para gestão de serviços da barbearia
 * 
 * Responsabilidades:
 * - CRUD de serviços
 * - Validação de regras de negócio
 * - Gestão de preços e categorias
 * - Associação com barbeiros
 * 
 * Princípios aplicados:
 * - Single Responsibility: Apenas gestão de serviços
 * - Open/Closed: Extensível para novos tipos de serviços
 * - Dependency Inversion: Depende de abstrações (Prisma)
 */

interface CreateServiceData {
  barbershopId: string;
  name: string;
  description?: string;
  duration: number; // em minutos
  price: number;
  category?: string;
  isActive?: boolean;
}

interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  category?: string;
  isActive?: boolean;
}

interface ServiceFilters {
  barbershopId: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'duration' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class ServiceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar novo serviço
   * 
   * Validações:
   * - Barbershop deve existir
   * - Nome não pode estar vazio
   * - Duração deve ser positiva
   * - Preço deve ser positivo
   */
  async createService(data: CreateServiceData): Promise<Service> {
    // Validar dados de entrada
    this.validateServiceData(data);

    // Verificar se a barbearia existe
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: data.barbershopId }
    });

    if (!barbershop) {
      throw new Error('Barbearia não encontrada');
    }

    // Verificar se já existe serviço com mesmo nome na barbearia
    const existingService = await this.prisma.service.findFirst({
      where: {
        barbershopId: data.barbershopId,
        name: data.name,
        isActive: true
      }
    });

    if (existingService) {
      throw new Error('Já existe um serviço ativo com este nome nesta barbearia');
    }

    // Criar serviço
    return await this.prisma.service.create({
      data: {
        ...data,
        price: new Decimal(data.price)
      },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true
          }
        },
        barberServices: {
          include: {
            barber: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Buscar serviço por ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    return await this.prisma.service.findUnique({
      where: { id },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true
          }
        },
        barberServices: {
          where: { isActive: true },
          include: {
            barber: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      }
    });
  }

  /**
   * Listar serviços com filtros e paginação
   */
  async getServices(
    filters: ServiceFilters,
    pagination: PaginationOptions = {}
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = pagination;

    const skip = (page - 1) * limit;

    // Construir filtros do Prisma
    const where: Prisma.ServiceWhereInput = {
      barbershopId: filters.barbershopId,
      ...(filters.category && { category: filters.category }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.minPrice && { price: { gte: new Decimal(filters.minPrice) } }),
      ...(filters.maxPrice && { price: { lte: new Decimal(filters.maxPrice) } }),
      ...(filters.minDuration && { duration: { gte: filters.minDuration } }),
      ...(filters.maxDuration && { duration: { lte: filters.maxDuration } })
    };

    // Buscar serviços e total
    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          barbershop: {
            select: {
              id: true,
              name: true
            }
          },
          barberServices: {
            where: { isActive: true },
            include: {
              barber: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              appointments: true
            }
          }
        }
      }),
      this.prisma.service.count({ where })
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Atualizar serviço
   */
  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    // Verificar se serviço existe
    const existingService = await this.prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      throw new Error('Serviço não encontrado');
    }

    // Validar dados se fornecidos
    if (data.name || data.duration || data.price) {
      this.validateServiceData({
        barbershopId: existingService.barbershopId,
        name: data.name || existingService.name,
        duration: data.duration || existingService.duration,
        price: data.price || Number(existingService.price)
      });
    }

    // Verificar nome duplicado se alterando nome
    if (data.name && data.name !== existingService.name) {
      const duplicateService = await this.prisma.service.findFirst({
        where: {
          barbershopId: existingService.barbershopId,
          name: data.name,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateService) {
        throw new Error('Já existe um serviço ativo com este nome nesta barbearia');
      }
    }

    // Atualizar serviço
    return await this.prisma.service.update({
      where: { id },
      data: {
        ...data,
        ...(data.price && { price: new Decimal(data.price) })
      },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true
          }
        },
        barberServices: {
          include: {
            barber: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  /**
   * Desativar serviço (soft delete)
   */
  async deactivateService(id: string): Promise<Service> {
    // Verificar se serviço existe
    const existingService = await this.prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      throw new Error('Serviço não encontrado');
    }

    if (!existingService.isActive) {
      throw new Error('Serviço já está desativado');
    }

    // Verificar se há agendamentos futuros
    const futureAppointments = await this.prisma.appointment.count({
      where: {
        serviceId: id,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      }
    });

    if (futureAppointments > 0) {
      throw new Error('Não é possível desativar serviço com agendamentos futuros');
    }

    return await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Reativar serviço
   */
  async reactivateService(id: string): Promise<Service> {
    const existingService = await this.prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      throw new Error('Serviço não encontrado');
    }

    if (existingService.isActive) {
      throw new Error('Serviço já está ativo');
    }

    return await this.prisma.service.update({
      where: { id },
      data: { isActive: true },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Obter categorias de serviços de uma barbearia
   */
  async getServiceCategories(barbershopId: string): Promise<string[]> {
    const categories = await this.prisma.service.findMany({
      where: {
        barbershopId,
        isActive: true,
        category: { not: null }
      },
      select: { category: true },
      distinct: ['category']
    });

    return categories
      .map(c => c.category)
      .filter(Boolean) as string[];
  }

  /**
   * Obter estatísticas de serviços
   */
  async getServiceStats(barbershopId: string) {
    const [
      totalServices,
      activeServices,
      totalAppointments,
      avgPrice,
      avgDuration,
      popularServices
    ] = await Promise.all([
      // Total de serviços
      this.prisma.service.count({
        where: { barbershopId }
      }),

      // Serviços ativos
      this.prisma.service.count({
        where: { barbershopId, isActive: true }
      }),

      // Total de agendamentos
      this.prisma.appointment.count({
        where: { barbershopId }
      }),

      // Preço médio
      this.prisma.service.aggregate({
        where: { barbershopId, isActive: true },
        _avg: { price: true }
      }),

      // Duração média
      this.prisma.service.aggregate({
        where: { barbershopId, isActive: true },
        _avg: { duration: true }
      }),

      // Serviços mais populares
      this.prisma.service.findMany({
        where: { barbershopId, isActive: true },
        include: {
          _count: {
            select: { appointments: true }
          }
        },
        orderBy: {
          appointments: { _count: 'desc' }
        },
        take: 5
      })
    ]);

    return {
      totalServices,
      activeServices,
      inactiveServices: totalServices - activeServices,
      totalAppointments,
      avgPrice: avgPrice._avg.price ? Number(avgPrice._avg.price) : 0,
      avgDuration: avgDuration._avg.duration || 0,
      popularServices: popularServices.map(service => ({
        id: service.id,
        name: service.name,
        appointmentCount: service._count.appointments
      }))
    };
  }

  /**
   * Validar dados do serviço
   * 
   * Princípio DRY: Centraliza validações reutilizáveis
   */
  private validateServiceData(data: Partial<CreateServiceData>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Nome do serviço deve ter pelo menos 2 caracteres');
    }

    if (data.duration !== undefined && data.duration <= 0) {
      throw new Error('Duração deve ser maior que zero');
    }

    if (data.duration !== undefined && data.duration > 480) { // 8 horas
      throw new Error('Duração não pode ser maior que 8 horas');
    }

    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Preço deve ser maior que zero');
    }

    if (data.price !== undefined && data.price > 10000) {
      throw new Error('Preço não pode ser maior que R$ 10.000');
    }
  }
} 