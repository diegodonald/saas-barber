import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ServiceService } from '../services/ServiceService';

const prisma = new PrismaClient();
const serviceService = new ServiceService(prisma);

// Dados de teste
let testBarbershopId: string;
let testServiceId: string;

describe('ServiceService', () => {
  beforeAll(async () => {
    // Criar barbearia de teste
    const testUser = await prisma.user.create({
      data: {
        email: 'test-service@example.com',
        password: 'hashedpassword',
        name: 'Test Service Owner',
        role: 'ADMIN'
      }
    });

    const testBarbershop = await prisma.barbershop.create({
      data: {
        name: 'Test Barbershop Services',
        address: 'Test Address',
        phone: '11999999999',
        email: 'test-services@barbershop.com',
        ownerId: testUser.id
      }
    });

    testBarbershopId = testBarbershop.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.service.deleteMany({
      where: { barbershopId: testBarbershopId }
    });
    
    await prisma.barbershop.deleteMany({
      where: { id: testBarbershopId }
    });
    
    await prisma.user.deleteMany({
      where: { email: 'test-service@example.com' }
    });
    
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar serviços antes de cada teste
    await prisma.service.deleteMany({
      where: { barbershopId: testBarbershopId }
    });
  });

  describe('createService', () => {
    it('deve criar um serviço com dados válidos', async () => {
      const serviceData = {
        barbershopId: testBarbershopId,
        name: 'Corte Masculino',
        description: 'Corte tradicional masculino',
        duration: 30,
        price: 25.00,
        category: 'Corte'
      };

      const service = await serviceService.createService(serviceData);

      expect(service).toBeDefined();
      expect(service.name).toBe(serviceData.name);
      expect(service.description).toBe(serviceData.description);
      expect(service.duration).toBe(serviceData.duration);
      expect(Number(service.price)).toBe(serviceData.price);
      expect(service.category).toBe(serviceData.category);
      expect(service.isActive).toBe(true);
      expect(service.barbershopId).toBe(testBarbershopId);

      testServiceId = service.id;
    });

    it('deve rejeitar criação com nome duplicado', async () => {
      // Criar primeiro serviço
      await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Corte Duplicado',
        duration: 30,
        price: 25.00
      });

      // Tentar criar segundo serviço com mesmo nome
      await expect(
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Corte Duplicado',
          duration: 45,
          price: 30.00
        })
      ).rejects.toThrow('Já existe um serviço ativo com este nome nesta barbearia');
    });

    it('deve rejeitar criação com barbearia inexistente', async () => {
      await expect(
        serviceService.createService({
          barbershopId: 'barbershop-inexistente',
          name: 'Serviço Teste',
          duration: 30,
          price: 25.00
        })
      ).rejects.toThrow('Barbearia não encontrada');
    });

    it('deve rejeitar criação com dados inválidos', async () => {
      // Nome muito curto
      await expect(
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'A',
          duration: 30,
          price: 25.00
        })
      ).rejects.toThrow('Nome do serviço deve ter pelo menos 2 caracteres');

      // Duração inválida
      await expect(
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Serviço Teste',
          duration: 0,
          price: 25.00
        })
      ).rejects.toThrow('Duração deve ser maior que zero');

      // Preço inválido
      await expect(
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Serviço Teste',
          duration: 30,
          price: 0
        })
      ).rejects.toThrow('Preço deve ser maior que zero');
    });
  });

  describe('getServiceById', () => {
    beforeEach(async () => {
      const service = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Busca',
        duration: 30,
        price: 25.00
      });
      testServiceId = service.id;
    });

    it('deve retornar serviço existente', async () => {
      const service = await serviceService.getServiceById(testServiceId);

      expect(service).toBeDefined();
      expect(service?.id).toBe(testServiceId);
      expect(service?.name).toBe('Serviço para Busca');
    });

    it('deve retornar null para serviço inexistente', async () => {
      const service = await serviceService.getServiceById('service-inexistente');
      expect(service).toBeNull();
    });
  });

  describe('getServices', () => {
    beforeEach(async () => {
      // Criar múltiplos serviços para teste
      await Promise.all([
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Corte Masculino',
          duration: 30,
          price: 25.00,
          category: 'Corte'
        }),
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Barba',
          duration: 20,
          price: 15.00,
          category: 'Barba'
        }),
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Corte + Barba',
          duration: 50,
          price: 35.00,
          category: 'Combo'
        })
      ]);
    });

    it('deve listar todos os serviços da barbearia', async () => {
      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId }
      );

      expect(result.services).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('deve filtrar por categoria', async () => {
      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId, category: 'Corte' }
      );

      expect(result.services).toHaveLength(1);
      expect(result.services[0].category).toBe('Corte');
    });

    it('deve filtrar por preço', async () => {
      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId, minPrice: 20, maxPrice: 30 }
      );

      expect(result.services.length).toBeGreaterThanOrEqual(1);
      const foundService = result.services.find(s => Number(s.price) === 25.00);
      expect(foundService).toBeDefined();
    });

    it('deve paginar resultados', async () => {
      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId },
        { page: 1, limit: 2 }
      );

      expect(result.services).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
    });
  });

  describe('updateService', () => {
    beforeEach(async () => {
      const service = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Atualizar',
        duration: 30,
        price: 25.00
      });
      testServiceId = service.id;
    });

    it('deve atualizar serviço com dados válidos', async () => {
      const updatedService = await serviceService.updateService(testServiceId, {
        name: 'Serviço Atualizado',
        duration: 45,
        price: 35.00,
        description: 'Nova descrição'
      });

      expect(updatedService.name).toBe('Serviço Atualizado');
      expect(updatedService.duration).toBe(45);
      expect(Number(updatedService.price)).toBe(35.00);
      expect(updatedService.description).toBe('Nova descrição');
    });

    it('deve rejeitar atualização de serviço inexistente', async () => {
      await expect(
        serviceService.updateService('service-inexistente', {
          name: 'Novo Nome'
        })
      ).rejects.toThrow('Serviço não encontrado');
    });
  });

  describe('deactivateService', () => {
    beforeEach(async () => {
      const service = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Desativar',
        duration: 30,
        price: 25.00
      });
      testServiceId = service.id;
    });

    it('deve desativar serviço ativo', async () => {
      const deactivatedService = await serviceService.deactivateService(testServiceId);

      expect(deactivatedService.isActive).toBe(false);
    });

    it('deve rejeitar desativação de serviço já desativado', async () => {
      await serviceService.deactivateService(testServiceId);

      await expect(
        serviceService.deactivateService(testServiceId)
      ).rejects.toThrow('Serviço já está desativado');
    });
  });

  describe('reactivateService', () => {
    beforeEach(async () => {
      const service = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Reativar',
        duration: 30,
        price: 25.00
      });
      testServiceId = service.id;
      await serviceService.deactivateService(testServiceId);
    });

    it('deve reativar serviço desativado', async () => {
      const reactivatedService = await serviceService.reactivateService(testServiceId);

      expect(reactivatedService.isActive).toBe(true);
    });

    it('deve rejeitar reativação de serviço já ativo', async () => {
      await serviceService.reactivateService(testServiceId);

      await expect(
        serviceService.reactivateService(testServiceId)
      ).rejects.toThrow('Serviço já está ativo');
    });
  });

  describe('getServiceCategories', () => {
    beforeEach(async () => {
      await Promise.all([
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Corte 1',
          duration: 30,
          price: 25.00,
          category: 'Corte'
        }),
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Corte 2',
          duration: 30,
          price: 25.00,
          category: 'Corte'
        }),
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Barba 1',
          duration: 20,
          price: 15.00,
          category: 'Barba'
        })
      ]);
    });

    it('deve retornar categorias únicas', async () => {
      const categories = await serviceService.getServiceCategories(testBarbershopId);

      expect(categories).toHaveLength(2);
      expect(categories).toContain('Corte');
      expect(categories).toContain('Barba');
    });
  });

  describe('getServiceStats', () => {
    beforeEach(async () => {
      await Promise.all([
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Serviço Ativo 1',
          duration: 30,
          price: 25.00
        }),
        serviceService.createService({
          barbershopId: testBarbershopId,
          name: 'Serviço Ativo 2',
          duration: 45,
          price: 35.00
        })
      ]);

      // Desativar um serviço
      const services = await serviceService.getServices({ barbershopId: testBarbershopId });
      await serviceService.deactivateService(services.services[0].id);
    });

    it('deve retornar estatísticas corretas', async () => {
      const stats = await serviceService.getServiceStats(testBarbershopId);

      expect(stats.totalServices).toBe(2);
      expect(stats.activeServices).toBe(1);
      expect(stats.inactiveServices).toBe(1);
      // A média é calculada apenas dos serviços ativos
      expect(stats.avgPrice).toBeCloseTo(35, 1); // apenas o serviço ativo de R$ 35
      expect(stats.avgDuration).toBeCloseTo(45, 1); // apenas o serviço ativo de 45 min
    });
  });
}); 