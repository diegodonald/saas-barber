import { AppointmentStatus, Role } from '@prisma/client';
import { AppointmentService } from '../services/AppointmentService';
import { addMinutes, addDays, startOfDay } from 'date-fns';
import { cleanDatabase, prisma } from './testUtils';

// Helper para gerar data de segunda-feira
function getNextMonday(): Date {
  const today = new Date();
  const monday = new Date(today);
  const daysUntilMonday = (1 - today.getDay() + 7) % 7;
  monday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
  return monday;
}

async function setupTestData() {
  // Gerar timestamp único para evitar conflitos
  const timestamp = Date.now();
  
  // Criar usuário proprietário
  const owner = await prisma.user.create({
    data: {
      email: `owner-${timestamp}@test.com`,
      password: 'hashedpassword',
      name: 'Test Owner',
      role: Role.ADMIN
    }
  });

  // Criar barbearia
  const barbershop = await prisma.barbershop.create({
    data: {
      name: 'Test Barbershop',
      address: 'Test Address',
      phone: '11999999999',
      email: `barbershop-${timestamp}@test.com`,
      ownerId: owner.id
    }
  });
  const testBarbershopId = barbershop.id;

  // Criar usuário barbeiro
  const barberUser = await prisma.user.create({
    data: {
      email: `barber-${timestamp}@test.com`,
      password: 'hashedpassword',
      name: 'Test Barber',
      role: Role.BARBER
    }
  });

  // Criar barbeiro
  const barber = await prisma.barber.create({
    data: {
      userId: barberUser.id,
      barbershopId: testBarbershopId,
      description: 'Test Barber Description'
    }
  });
  const testBarberId = barber.id;

  // Criar usuário cliente
  const clientUser = await prisma.user.create({
    data: {
      email: `client-${timestamp}@test.com`,
      password: 'hashedpassword',
      name: 'Test Client',
      role: Role.CLIENT
    }
  });

  // Criar perfil de cliente
  await prisma.client.create({
    data: {
      userId: clientUser.id
    }
  });
  const testClientId = clientUser.id;

  // Criar serviço
  const service = await prisma.service.create({
    data: {
      name: 'Corte de Cabelo',
      description: 'Corte masculino tradicional',
      duration: 30,
      price: 25.00,
      barbershopId: testBarbershopId,
      category: 'Corte'
    }
  });
  const testServiceId = service.id;

  // Criar relacionamento barbeiro-serviço
  await prisma.barberService.create({
    data: {
      barberId: testBarberId,
      serviceId: testServiceId,
      customPrice: 30.00
    }
  });

  // Criar horário global da barbearia
  await prisma.globalSchedule.create({
    data: {
      barbershopId: testBarbershopId,
      dayOfWeek: 1, // Segunda-feira
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00',
      lunchStart: '12:00',
      lunchEnd: '13:00'
    }
  });

  // Criar horário individual do barbeiro
  await prisma.barberSchedule.create({
    data: {
      barberId: testBarberId,
      dayOfWeek: 1, // Segunda-feira
      isWorking: true,
      startTime: '08:00', // Antes do horário global
      endTime: '19:00'    // Depois do horário global
    }
  });

  return {
    testBarbershopId,
    testBarberId,
    testClientId,
    testServiceId
  };
}

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  let testBarbershopId: string;
  let testBarberId: string;
  let testClientId: string;
  let testServiceId: string;

  beforeAll(async () => {
    appointmentService = new AppointmentService(prisma);
  });

  beforeEach(async () => {
    // Limpar banco completamente antes de cada teste
    await cleanDatabase();
    
    // Recriar dados de teste para cada teste
    const testData = await setupTestData();
    testBarbershopId = testData.testBarbershopId;
    testBarberId = testData.testBarberId;
    testClientId = testData.testClientId;
    testServiceId = testData.testServiceId;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('deve criar agendamento com sucesso', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0); // 10:00

      const appointmentData = {
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime,
        notes: 'Teste de agendamento'
      };

      const appointment = await appointmentService.create(appointmentData);

      expect(appointment).toBeDefined();
      expect(appointment.barbershopId).toBe(testBarbershopId);
      expect(appointment.barberId).toBe(testBarberId);
      expect(appointment.clientId).toBe(testClientId);
      expect(appointment.serviceId).toBe(testServiceId);
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.totalPrice.toString()).toBe('30'); // Preço customizado do barbeiro
      expect(appointment.endTime).toEqual(addMinutes(appointmentTime, 30));
    });

    it('deve rejeitar agendamento se barbeiro não executa o serviço', async () => {
      // Criar outro serviço que o barbeiro não executa
      const otherService = await prisma.service.create({
        data: {
          name: 'Massagem',
          description: 'Massagem relaxante',
          duration: 60,
          price: 50.00,
          barbershopId: testBarbershopId,
          category: 'Relaxamento'
        }
      });

      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      const appointmentData = {
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: otherService.id,
        startTime: appointmentTime
      };

      await expect(appointmentService.create(appointmentData))
        .rejects.toThrow('Barbeiro não executa este serviço');
    });

    it('deve rejeitar agendamento com conflito de horário', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      // Criar primeiro agendamento
      const firstAppointmentData = {
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      };

      await appointmentService.create(firstAppointmentData);

      // Tentar criar agendamento conflitante
      const conflictingTime = new Date(appointmentTime);
      conflictingTime.setMinutes(15); // 15 minutos depois, ainda dentro do serviço de 30 min

      await expect(appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: conflictingTime
      })).rejects.toThrow('Conflito de horário detectado');
    });

    it('deve permitir agendamento no horário individual do barbeiro (fora do global)', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(8, 30, 0, 0); // 08:30 - fora do horário global mas dentro do individual

      const appointmentData = {
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      };

      const appointment = await appointmentService.create(appointmentData);
      expect(appointment).toBeDefined();
      expect(appointment.startTime).toEqual(appointmentTime);
    });

    it('deve rejeitar agendamento fora do horário de funcionamento', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(6, 0, 0, 0); // 06:00 - muito cedo

      const appointmentData = {
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      };

      await expect(appointmentService.create(appointmentData))
        .rejects.toThrow('Horário fora do funcionamento');
    });
  });

  describe('findMany', () => {
    it('deve listar agendamentos com paginação', async () => {
      // Criar múltiplos agendamentos
      const monday = getNextMonday();
      const times = [10, 11, 14, 15]; // Horários diferentes

      for (const hour of times) {
        const appointmentTime = new Date(monday);
        appointmentTime.setHours(hour, 0, 0, 0);

        await appointmentService.create({
          barbershopId: testBarbershopId,
          barberId: testBarberId,
          clientId: testClientId,
          serviceId: testServiceId,
          startTime: appointmentTime
        });
      }

      const result = await appointmentService.findMany({
        barbershopId: testBarbershopId
      });

      expect(result.appointments).toHaveLength(4);
      expect(result.appointments[0].barberId).toBe(testBarberId);
    });

    it('deve filtrar agendamentos por barbeiro', async () => {
      const monday = getNextMonday();
      const appointmentTime1 = new Date(monday);
      appointmentTime1.setHours(10, 0, 0, 0);

      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime1
      });

      const result = await appointmentService.findMany({
        barbershopId: testBarbershopId,
        barberId: testBarberId
      });

      expect(result.appointments).toHaveLength(1);
      expect(result.appointments[0].barberId).toBe(testBarberId);
    });

    it('deve filtrar agendamentos por data', async () => {
      const monday = getNextMonday();

      // Criar agendamento na segunda
      const mondayAppointment = new Date(monday);
      mondayAppointment.setHours(10, 0, 0, 0);

      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: mondayAppointment
      });

      const result = await appointmentService.findMany({
        barbershopId: testBarbershopId,
        startDate: startOfDay(monday),
        endDate: startOfDay(addDays(monday, 1))
      });

      expect(result.appointments).toHaveLength(1);
      expect(new Date(result.appointments[0].startTime).toDateString()).toBe(monday.toDateString());
    });
  });


  describe('update', () => {
    it('deve atualizar agendamento com sucesso', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      const newTime = new Date(appointmentTime);
      newTime.setHours(11, 0, 0, 0);

      const updatedAppointment = await appointmentService.update(appointment.id, {
        startTime: newTime,
        notes: 'Agendamento atualizado'
      });

      expect(updatedAppointment.startTime).toEqual(newTime);
      expect(updatedAppointment.notes).toBe('Agendamento atualizado');
    });

    it('deve falhar ao atualizar agendamento inexistente', async () => {
      const fakeId = 'fake-id-123';
      
      await expect(appointmentService.update(fakeId, {
        notes: 'Teste'
      })).rejects.toThrow('Agendamento não encontrado');
    });
  });

  describe('cancel', () => {
    it('deve cancelar agendamento com sucesso', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      const cancelledAppointment = await appointmentService.cancel(appointment.id, 'Cancelado pelo teste');

      expect(cancelledAppointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(cancelledAppointment.notes).toContain('Cancelado pelo teste');
    });
  });

  describe('confirm', () => {
    it('deve confirmar agendamento com sucesso', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      const confirmedAppointment = await appointmentService.confirm(appointment.id);

      expect(confirmedAppointment.status).toBe(AppointmentStatus.CONFIRMED);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas de agendamentos', async () => {
      const monday = getNextMonday();
      
      // Criar agendamentos com diferentes status
      const appointments = [];
      
      for (let i = 0; i < 3; i++) {
        const appointmentTime = new Date(monday);
        appointmentTime.setHours(10 + i, 0, 0, 0);

        const appointment = await appointmentService.create({
          barbershopId: testBarbershopId,
          barberId: testBarberId,
          clientId: testClientId,
          serviceId: testServiceId,
          startTime: appointmentTime
        });
        
        appointments.push(appointment);
      }

      // Confirmar um agendamento
      await appointmentService.confirm(appointments[0].id);
      
      // Cancelar um agendamento
      await appointmentService.cancel(appointments[1].id, 'Teste');

      const stats = await appointmentService.getStats({
        barbershopId: testBarbershopId
      });

      expect(stats.total).toBe(3);
      expect(stats.confirmed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.scheduled).toBe(1);
    });

    it('deve filtrar estatísticas por barbeiro', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      const stats = await appointmentService.getStats({
        barbershopId: testBarbershopId,
        barberId: testBarberId
      });

      expect(stats.total).toBe(1);
      expect(stats.scheduled).toBe(1);
    });
  });
});
