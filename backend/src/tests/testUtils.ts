import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Limpa todas as tabelas do banco de dados na ordem correta
 * para respeitar as foreign key constraints, usando transação
 */
export async function cleanDatabase() {
  try {
    // Usar transação para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      // Desabilitar verificação de foreign keys temporariamente (PostgreSQL)
      await tx.$executeRaw`SET session_replication_role = replica;`;

      // Deletar todas as tabelas na ordem correta
      await tx.appointment.deleteMany({});
      await tx.barberService.deleteMany({});
      await tx.barberException.deleteMany({});
      await tx.barberSchedule.deleteMany({});
      await tx.globalException.deleteMany({});
      await tx.globalSchedule.deleteMany({});
      await tx.service.deleteMany({});
      await tx.barber.deleteMany({});
      await tx.client.deleteMany({});
      await tx.barbershop.deleteMany({});
      await tx.user.deleteMany({});

      // Reabilitar verificação de foreign keys
      await tx.$executeRaw`SET session_replication_role = DEFAULT;`;
    });
    
  } catch (error) {
    // Garantir que foreign keys sejam reabilitadas mesmo em caso de erro
    try {
      await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
    } catch (resetError) {
      console.warn('Erro ao resetar foreign keys:', resetError);
    }
    
    console.error('Erro crítico na limpeza do banco:', error);
    throw error;
  }
}

export { prisma };