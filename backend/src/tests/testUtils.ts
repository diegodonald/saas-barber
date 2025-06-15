import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Limpa todas as tabelas do banco de dados na ordem correta
 * para respeitar as foreign key constraints
 */
export async function cleanDatabase() {
  // Usar TRUNCATE CASCADE para limpar todas as tabelas de uma vez
  // Isso é mais eficiente e evita problemas de foreign key constraints
  try {
    await prisma.$executeRaw`
      TRUNCATE TABLE 
        appointments,
        barber_services,
        barber_exceptions,
        barber_schedules,
        global_exceptions,
        global_schedules,
        services,
        barbers,
        clients,
        barbershops,
        users
      RESTART IDENTITY CASCADE;
    `;
  } catch (error) {
    console.warn('Erro ao limpar banco com TRUNCATE, tentando método alternativo:', error);
    // Fallback: deletar individualmente respeitando foreign keys
    try {
      await prisma.appointment.deleteMany({});
      await prisma.barberService.deleteMany({});
      await prisma.barberException.deleteMany({});
      await prisma.barberSchedule.deleteMany({});
      await prisma.globalException.deleteMany({});
      await prisma.globalSchedule.deleteMany({});
      await prisma.service.deleteMany({});
      await prisma.barber.deleteMany({});
      await prisma.client.deleteMany({});
      await prisma.barbershop.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (secondError) {
      console.error('Erro crítico na limpeza do banco:', secondError);
      throw secondError;
    }
  }
}

export { prisma }; 