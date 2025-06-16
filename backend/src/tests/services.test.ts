import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { ServiceService } from '../services/ServiceService';
import { cleanDatabase, prisma } from './testUtils';

const serviceService = new ServiceService(prisma);

describe('ServiceService', () => {
  // Limpar banco antes de cada teste para garantir isolamento
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  // Função para criar dados de teste isolados para cada teste
  async function setupTestData() {
    // Gerar timestamp único para evitar conflitos de email
    const timestamp = Date.now();
    
    // Criar usuário owner da barbearia
    const testUser = await prisma.user.create({
      data: {
        email: `test-service-${timestamp}@example.com`,
        password: 'hashedpassword',
        name: 'Test Service Owner',
        role: 'ADMIN'
      }
    });

    // Criar barbearia de teste
    const testBarbershop = await prisma.barbershop.create({
      data: {
        name: 'Test Barbershop Services',
        address: 'Test Address',
        phone: '11999999999',
        email: `test-services-${timestamp}@barbershop.com`,
        ownerId: testUser.id
      }
    });

    return { testBarbershopId: testBarbershop.id, testUserId: testUser.id };
  }

  describe('createService', () => {
    it('deve criar um serviço com dados válidos', async () => {
      const { testBarbershopId } = await setupTestData();
      
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
    });

    it('deve rejeitar criação com nome duplicado', async () => {
      const { testBarbershopId } = await setupTestData();
      
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
      ).rejects.toThrow();
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
  });

  describe('getServiceById', () => {
    it('deve retornar serviço existente', async () => {
      const { testBarbershopId } = await setupTestData();
      
      const createdService = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Busca',
        duration: 30,
        price: 25.00
      });

      const service = await serviceService.getServiceById(createdService.id);

      expect(service).toBeDefined();
      expect(service?.id).toBe(createdService.id);
      expect(service?.name).toBe('Serviço para Busca');
    });

    it('deve retornar null para serviço inexistente', async () => {
      const service = await serviceService.getServiceById('service-inexistente');
      expect(service).toBeNull();
    });
  });

  describe('getServices', () => {
    it('deve listar todos os serviços da barbearia', async () => {
      const { testBarbershopId } = await setupTestData();
      
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
        })
      ]);

      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId }
      );

      expect(result.services).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('deve filtrar por categoria', async () => {
      const { testBarbershopId } = await setupTestData();
      
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
          name: 'Barba 1',
          duration: 20,
          price: 15.00,
          category: 'Barba'
        })
      ]);

      const result = await serviceService.getServices(
        { barbershopId: testBarbershopId, category: 'Corte' }
      );

      expect(result.services).toHaveLength(1);
      expect(result.services[0].category).toBe('Corte');
    });
  });

  describe('updateService', () => {
    it('deve atualizar serviço com dados válidos', async () => {
      const { testBarbershopId } = await setupTestData();
      
      const createdService = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Atualizar',
        duration: 30,
        price: 25.00
      });

      const updatedService = await serviceService.updateService(createdService.id, {
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
    it('deve desativar serviço ativo', async () => {
      const { testBarbershopId } = await setupTestData();
      
      const createdService = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Desativar',
        duration: 30,
        price: 25.00
      });

      const deactivatedService = await serviceService.deactivateService(createdService.id);

      expect(deactivatedService.isActive).toBe(false);
    });
  });

  describe('reactivateService', () => {
    it('deve reativar serviço desativado', async () => {
      const { testBarbershopId } = await setupTestData();
      
      const createdService = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço para Reativar',
        duration: 30,
        price: 25.00
      });

      await serviceService.deactivateService(createdService.id);
      const reactivatedService = await serviceService.reactivateService(createdService.id);

      expect(reactivatedService.isActive).toBe(true);
    });
  });

  describe('getServiceCategories', () => {
    it('deve retornar categorias únicas', async () => {
      const { testBarbershopId } = await setupTestData();
      
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
          name: 'Barba 1',
          duration: 20,
          price: 15.00,
          category: 'Barba'
        })
      ]);

      const categories = await serviceService.getServiceCategories(testBarbershopId);

      expect(categories).toHaveLength(2);
      expect(categories).toContain('Corte');
      expect(categories).toContain('Barba');
    });
  });
  describe('getServiceStats', () => {
    it('deve retornar estatísticas corretas', async () => {
      const { testBarbershopId } = await setupTestData();
      
      const service1 = await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço Ativo 1',
        duration: 30,
        price: 25.00
      });

      await serviceService.createService({
        barbershopId: testBarbershopId,
        name: 'Serviço Ativo 2',
        duration: 45,
        price: 35.00
      });

      // Desativar um serviço
      await serviceService.deactivateService(service1.id);

      const stats = await serviceService.getServiceStats(testBarbershopId);

      expect(stats.totalServices).toBe(2);
      expect(stats.activeServices).toBe(1);
      expect(stats.inactiveServices).toBe(1);
    });
  });
});
