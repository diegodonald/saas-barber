import { PrismaClient } from '@prisma/client';
import { Role, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UpdateUserData {
  name?: string;
  phone?: string;
  avatar?: string;
}

interface UpdateClientData extends UpdateUserData {
  birthDate?: Date;
  gender?: Gender;
  notes?: string;
}

interface UpdateBarberData extends UpdateUserData {
  description?: string;
  experience?: number;
  specialties?: string[];
  isActive?: boolean;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Busca usuário por ID com perfil específico
   */
  async findById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        barberProfile: {
          include: {
            barbershop: true,
            services: {
              include: {
                service: true
              }
            }
          }
        },
        clientProfile: true,
        barbershop: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        barberProfile: true,
        clientProfile: true,
        barbershop: true
      }
    });
  }

  /**
   * Lista todos os usuários (apenas para SUPER_ADMIN)
   */
  async findAll(page: number = 1, limit: number = 10, role?: Role) {
    const skip = (page - 1) * limit;
    
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          barberProfile: true,
          clientProfile: true,
          barbershop: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Atualiza dados básicos do usuário
   */
  async updateUser(userId: string, data: UpdateUserData) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      include: {
        barberProfile: true,
        clientProfile: true,
        barbershop: true
      }
    });
  }

  /**
   * Atualiza perfil do cliente
   */
  async updateClientProfile(userId: string, data: UpdateClientData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role !== Role.CLIENT) {
      throw new Error('Usuário não é um cliente');
    }

    // Atualizar dados básicos do usuário
    const { birthDate, gender, notes, ...userData } = data;
    
    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData
      });
    }

    // Atualizar ou criar perfil do cliente
    const clientData = { birthDate, gender, notes };
    const filteredClientData = Object.fromEntries(
      Object.entries(clientData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredClientData).length > 0) {
      await prisma.client.upsert({
        where: { userId },
        update: filteredClientData,
        create: {
          userId,
          ...filteredClientData
        }
      });
    }

    return this.findById(userId);
  }

  /**
   * Atualiza perfil do barbeiro
   */
  async updateBarberProfile(userId: string, data: UpdateBarberData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { barberProfile: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role !== Role.BARBER) {
      throw new Error('Usuário não é um barbeiro');
    }

    // Atualizar dados básicos do usuário
    const { description, experience, specialties, isActive, ...userData } = data;
    
    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData
      });
    }

    // Atualizar perfil do barbeiro
    const barberData = { description, experience, specialties, isActive };
    const filteredBarberData = Object.fromEntries(
      Object.entries(barberData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(filteredBarberData).length > 0) {
      await prisma.barber.update({
        where: { userId },
        data: filteredBarberData
      });
    }

    return this.findById(userId);
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(userId: string, data: ChangePasswordData) {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword
      }
    });

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Desativa usuário (soft delete)
   */
  async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Se for barbeiro, desativar também
    if (user.role === Role.BARBER) {
      await prisma.barber.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

    return { message: 'Usuário desativado com sucesso' };
  }

  /**
   * Busca barbeiros de uma barbearia
   */
  async findBarbersByBarbershop(barbershopId: string, activeOnly: boolean = true) {
    const where: any = { barbershopId };
    if (activeOnly) {
      where.isActive = true;
    }

    return prisma.barber.findMany({
      where,
      include: {
        user: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });
  }

  /**
   * Busca clientes de uma barbearia (através dos agendamentos)
   */
  async findClientsByBarbershop(barbershopId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Buscar clientes únicos que têm agendamentos na barbearia
    const appointments = await prisma.appointment.findMany({
      where: { barbershopId },
      select: { clientId: true },
      distinct: ['clientId']
    });

    const clientIds = appointments.map(app => app.clientId);

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: clientIds },
          role: Role.CLIENT
        },
        skip,
        take: limit,
        include: {
          clientProfile: true,
          appointments: {
            where: { barbershopId },
            orderBy: { startTime: 'desc' },
            take: 1
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.user.count({
        where: {
          id: { in: clientIds },
          role: Role.CLIENT
        }
      })
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
} 