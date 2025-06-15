import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { BarberServiceService } from '../services/BarberServiceService';
import { cleanDatabase, prisma } from './testUtils';
const barberServiceService = new BarberServiceService(prisma);

// IDs de teste que serão criados
let testBarbershopId: string;
let testUserId: string;
let testBarberId: string;
let testServiceId: string;
let testClientId: string;
let testBarberServiceId: string;

describe('BarberServiceService', () => {
  beforeAll(async () => {
    // Limpar banco antes de começar
    await cleanDatabase();
  });

  beforeEach(async () => {
    // Criar dados de teste
    // Primeiro criar o owner
    const ownerUser = await prisma.user.create({
      data: {
        name: 'Dono da Barbearia',
        email: 'dono@barbearia.com',
        phone: '11999999998',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    const barbershop = await prisma.barbershop.create({
      data: {
        name: 'Barbearia Teste',
        email: 'teste@barbearia.com',
        phone: '11999999999',
        address: 'Rua Teste, 123',
        ownerId: ownerUser.id
      }
    });
    testBarbershopId = barbershop.id;

    const user = await prisma.user.create({
      data: {
        name: 'João Barbeiro',
        email: 'joao@teste.com',
        phone: '11888888888',
        password: 'hashedpassword',
        role: 'BARBER'
      }
    });
    testUserId = user.id;

    const barber = await prisma.barber.create({
      data: {
        userId: testUserId,
        barbershopId: testBarbershopId,
        specialties: ['Corte', 'Barba']
      }
    });
    testBarberId = barber.id;

    const service = await prisma.service.create({
      data: {
        barbershopId: testBarbershopId,
        name: 'Corte Masculino',
        description: 'Corte tradicional',
        duration: 30,
        price: 25.00,
        category: 'Corte'
      }
    });
    testServiceId = service.id;

    const clientUser = await prisma.user.create({
      data: {
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        phone: '11777777777',
        password: 'hashedpassword',
        role: 'CLIENT'
      }
    });
    testClientId = clientUser.id;
  });

  afterEach(async () => {
    // Limpar dados de teste na ordem correta (respeitando foreign keys)
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('deve criar uma nova atribuição de serviço para barbeiro', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 30.00
      };

      const result = await barberServiceService.create(data);

      expect(result).toBeDefined();
      expect(result.barberId).toBe(testBarberId);
      expect(result.serviceId).toBe(testServiceId);
      expect(result.effectivePrice).toBe(30.00);
      expect(result.isActive).toBe(true);
    });

    it('deve usar preço padrão quando customPrice não fornecido', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: testServiceId
      };

      const result = await barberServiceService.create(data);

      expect(result.effectivePrice).toBe(25.00); // preço do serviço
      expect(result.customPrice).toBeNull();
    });

    it('deve falhar ao tentar atribuir barbeiro inexistente', async () => {
      const data = {
        barberId: 'invalid-id',
        serviceId: testServiceId
      };

      await expect(barberServiceService.create(data)).rejects.toThrow('Barbeiro não encontrado');
    });

    it('deve falhar ao tentar atribuir serviço inexistente', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: 'invalid-id'
      };

      await expect(barberServiceService.create(data)).rejects.toThrow('Serviço não encontrado');
    });

    it('deve falhar se barbeiro e serviço não pertencem à mesma barbearia', async () => {
      // Criar outro barbershop e service
      const otherOwner = await prisma.user.create({
        data: {
          name: 'Outro Dono',
          email: 'outro@dono.com',
          phone: '11999999997',
          password: 'hashedpassword',
          role: 'ADMIN'
        }
      });

      const otherBarbershop = await prisma.barbershop.create({
        data: {
          name: 'Outra Barbearia',
          email: 'outra@barbearia.com',
          phone: '11999999998',
          address: 'Rua Outra, 456',
          ownerId: otherOwner.id
        }
      });

      const otherService = await prisma.service.create({
        data: {
          barbershopId: otherBarbershop.id,
          name: 'Outro Serviço',
          description: 'Outro serviço',
          duration: 45,
          price: 35.00
        }
      });

      const data = {
        barberId: testBarberId,
        serviceId: otherService.id
      };

      await expect(barberServiceService.create(data)).rejects.toThrow('Barbeiro e serviço devem pertencer à mesma barbearia');

      // Cleanup
      await prisma.service.delete({ where: { id: otherService.id } });
      await prisma.barbershop.delete({ where: { id: otherBarbershop.id } });
    });

    it('deve falhar ao tentar criar atribuição duplicada', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: testServiceId
      };

      await barberServiceService.create(data);

      await expect(barberServiceService.create(data)).rejects.toThrow('Barbeiro já está atribuído a este serviço');
    });

    it('deve falhar com preço customizado negativo', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: -10
      };

      await expect(barberServiceService.create(data)).rejects.toThrow('Preço customizado não pode ser negativo');
    });

    it('deve falhar com preço customizado muito alto', async () => {
      const data = {
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 100 // > 3x preço base (25.00)
      };

      await expect(barberServiceService.create(data)).rejects.toThrow('Preço customizado não pode ser mais que 3x o preço base');
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      const barberService = await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 35.00
      });
      testBarberServiceId = barberService.id;
    });

    it('deve listar todas as atribuições', async () => {
      const result = await barberServiceService.findMany();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].barberId).toBe(testBarberId);
    });

    it('deve filtrar por barberId', async () => {
      const result = await barberServiceService.findMany({
        barberId: testBarberId
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].barberId).toBe(testBarberId);
    });

    it('deve filtrar por serviceId', async () => {
      const result = await barberServiceService.findMany({
        serviceId: testServiceId
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].serviceId).toBe(testServiceId);
    });

    it('deve filtrar por isActive', async () => {
      const result = await barberServiceService.findMany({
        isActive: true
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isActive).toBe(true);
    });

    it('deve filtrar por hasCustomPrice', async () => {
      const result = await barberServiceService.findMany({
        hasCustomPrice: true
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].customPrice).not.toBeNull();
    });

    it('deve filtrar por faixa de preço', async () => {
      const result = await barberServiceService.findMany({
        minPrice: 30,
        maxPrice: 40
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].effectivePrice).toBeGreaterThanOrEqual(30);
      expect(result.data[0].effectivePrice).toBeLessThanOrEqual(40);
    });

    it('deve paginar resultados', async () => {
      const result = await barberServiceService.findMany({
        skip: 0,
        take: 10
      });

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      const barberService = await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });
      testBarberServiceId = barberService.id;
    });

    it('deve encontrar atribuição por ID', async () => {
      const result = await barberServiceService.findById(testBarberServiceId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(testBarberServiceId);
      expect(result!.barberId).toBe(testBarberId);
      expect(result!.serviceId).toBe(testServiceId);
    });

    it('deve retornar null para ID inexistente', async () => {
      const result = await barberServiceService.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findBarbersByService', () => {
    beforeEach(async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 28.00
      });
    });

    it('deve encontrar barbeiros que executam um serviço', async () => {
      const result = await barberServiceService.findBarbersByService(testServiceId);

      expect(result).toHaveLength(1);
      expect(result[0].barberId).toBe(testBarberId);
      expect(result[0].serviceId).toBe(testServiceId);
      expect(result[0].effectivePrice).toBe(28.00);
    });

    it('deve filtrar por barbearia', async () => {
      const result = await barberServiceService.findBarbersByService(testServiceId, testBarbershopId);

      expect(result).toHaveLength(1);
      expect(result[0].barber.barbershopId).toBe(testBarbershopId);
    });

    it('deve retornar array vazio para serviço sem barbeiros', async () => {
      const otherService = await prisma.service.create({
        data: {
          barbershopId: testBarbershopId,
          name: 'Outro Serviço',
          description: 'Serviço sem barbeiros',
          duration: 60,
          price: 50.00
        }
      });

      const result = await barberServiceService.findBarbersByService(otherService.id);

      expect(result).toHaveLength(0);

      await prisma.service.delete({ where: { id: otherService.id } });
    });
  });

  describe('findServicesByBarber', () => {
    beforeEach(async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });
    });

    it('deve encontrar serviços de um barbeiro', async () => {
      const result = await barberServiceService.findServicesByBarber(testBarberId);

      expect(result).toHaveLength(1);
      expect(result[0].barberId).toBe(testBarberId);
      expect(result[0].serviceId).toBe(testServiceId);
    });

    it('deve incluir serviços inativos quando solicitado', async () => {
      // Primeiro buscar os serviços ativos
      const activeServices = await barberServiceService.findServicesByBarber(testBarberId, false);
      
      // Desativar a atribuição
      await barberServiceService.update(activeServices[0].id, { isActive: false });

      const result = await barberServiceService.findServicesByBarber(testBarberId, true);

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(false);
    });

    it('deve retornar array vazio para barbeiro sem serviços', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Outro Barbeiro',
          email: 'outro@teste.com',
          phone: '11777777778',
          password: 'hashedpassword',
          role: 'BARBER'
        }
      });

      const otherBarber = await prisma.barber.create({
        data: {
          userId: otherUser.id,
          barbershopId: testBarbershopId,
          specialties: ['Corte']
        }
      });

      const result = await barberServiceService.findServicesByBarber(otherBarber.id);

      expect(result).toHaveLength(0);

      // Cleanup
      await prisma.barber.delete({ where: { id: otherBarber.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const barberService = await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 30.00
      });
      testBarberServiceId = barberService.id;
    });

    it('deve atualizar preço customizado', async () => {
      const result = await barberServiceService.update(testBarberServiceId, {
        customPrice: 32.00
      });

      expect(result.effectivePrice).toBe(32.00);
      expect(Number(result.customPrice)).toBe(32.00);
    });

    it('deve atualizar status ativo', async () => {
      const result = await barberServiceService.update(testBarberServiceId, {
        isActive: false
      });

      expect(result.isActive).toBe(false);
    });

    it('deve remover preço customizado quando definido como null', async () => {
      const result = await barberServiceService.update(testBarberServiceId, {
        customPrice: null
      });

      expect(result.customPrice).toBeNull();
      expect(result.effectivePrice).toBe(25.00); // preço base do serviço
    });

    it('deve falhar com ID inexistente', async () => {
      await expect(
        barberServiceService.update('invalid-id', { customPrice: 35.00 })
      ).rejects.toThrow('Atribuição não encontrada');
    });

    it('deve falhar com preço customizado negativo', async () => {
      await expect(
        barberServiceService.update(testBarberServiceId, { customPrice: -5 })
      ).rejects.toThrow('Preço customizado não pode ser negativo');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const barberService = await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });
      testBarberServiceId = barberService.id;
    });

    it('deve desativar atribuição (soft delete)', async () => {
      await barberServiceService.delete(testBarberServiceId);

      const result = await barberServiceService.findById(testBarberServiceId);
      expect(result!.isActive).toBe(false);
    });

    it('deve falhar se existem agendamentos futuros', async () => {
      // Criar agendamento futuro
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await prisma.appointment.create({
        data: {
          barbershopId: testBarbershopId,
          barberId: testBarberId,
          clientId: testClientId,
          serviceId: testServiceId,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 30 * 60000),
          totalPrice: 25.00,
          status: 'SCHEDULED'
        }
      });

      await expect(
        barberServiceService.delete(testBarberServiceId)
      ).rejects.toThrow('Não é possível remover atribuição com agendamentos futuros');
    });

    it('deve falhar com ID inexistente', async () => {
      await expect(
        barberServiceService.delete('invalid-id')
      ).rejects.toThrow('Atribuição não encontrada');
    });
  });

  describe('reactivate', () => {
    beforeEach(async () => {
      const barberService = await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });
      testBarberServiceId = barberService.id;

      // Desativar primeiro
      await barberServiceService.delete(testBarberServiceId);
    });

    it('deve reativar atribuição desativada', async () => {
      const result = await barberServiceService.reactivate(testBarberServiceId);

      expect(result.isActive).toBe(true);
    });

    it('deve falhar com ID inexistente', async () => {
      await expect(
        barberServiceService.reactivate('invalid-id')
      ).rejects.toThrow('Atribuição não encontrada');
    });

    it('deve falhar se serviço está inativo', async () => {
      // Desativar o serviço
      await prisma.service.update({
        where: { id: testServiceId },
        data: { isActive: false }
      });

      await expect(
        barberServiceService.reactivate(testBarberServiceId)
      ).rejects.toThrow('Não é possível reativar atribuição de serviço inativo');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 30.00
      });
    });

    it('deve retornar estatísticas gerais', async () => {
      const stats = await barberServiceService.getStats();

      expect(stats.total).toBe(1);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(0);
      expect(stats.withCustomPrice).toBe(1);
      expect(stats.withoutCustomPrice).toBe(0);
      expect(stats.avgCustomPrice).toBe(30.00);
    });

    it('deve filtrar estatísticas por barbearia', async () => {
      const stats = await barberServiceService.getStats(testBarbershopId);

      expect(stats.total).toBe(1);
      expect(stats.totalServices).toBe(1);
      expect(stats.totalBarbers).toBe(1);
    });
  });

  describe('canBarberPerformService', () => {
    beforeEach(async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });
    });

    it('deve retornar true para barbeiro que pode executar serviço', async () => {
      const result = await barberServiceService.canBarberPerformService(testBarberId, testServiceId);

      expect(result).toBe(true);
    });

    it('deve retornar false para barbeiro que não pode executar serviço', async () => {
      const otherService = await prisma.service.create({
        data: {
          barbershopId: testBarbershopId,
          name: 'Outro Serviço',
          description: 'Serviço não atribuído',
          duration: 45,
          price: 35.00
        }
      });

      const result = await barberServiceService.canBarberPerformService(testBarberId, otherService.id);

      expect(result).toBe(false);

      await prisma.service.delete({ where: { id: otherService.id } });
    });
  });

  describe('getEffectivePrice', () => {
    it('deve retornar preço customizado quando disponível', async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 35.00
      });

      const price = await barberServiceService.getEffectivePrice(testBarberId, testServiceId);

      expect(price).toBe(35.00);
    });

    it('deve retornar preço base quando não há preço customizado', async () => {
      await barberServiceService.create({
        barberId: testBarberId,
        serviceId: testServiceId
      });

      const price = await barberServiceService.getEffectivePrice(testBarberId, testServiceId);

      expect(price).toBe(25.00);
    });

    it('deve retornar null para atribuição inexistente', async () => {
      const price = await barberServiceService.getEffectivePrice(testBarberId, testServiceId);

      expect(price).toBeNull();
    });
  });
}); 