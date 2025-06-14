import { PrismaClient, AppointmentStatus, Role, ExceptionType } from '@prisma/client';
import { AppointmentService } from '../services/AppointmentService';
import { addMinutes, addDays, startOfDay } from 'date-fns';

describe('AppointmentService', () => {
  let prisma: PrismaClient;
  let appointmentService: AppointmentService;
  let testBarbershopId: string;
  let testBarberId: string;
  let testClientId: string;
  let testServiceId: string;
  let testBarberServiceId: string;

  // Helper para gerar data de segunda-feira
  function getNextMonday(): Date {
    const today = new Date();
    const monday = new Date(today);
    const daysUntilMonday = (1 - today.getDay() + 7) % 7;
    monday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    return monday;
  }

  beforeAll(async () => {
    prisma = new PrismaClient();
    appointmentService = new AppointmentService(prisma);

    // Criar dados de teste
    await setupTestData();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar agendamentos antes de cada teste
    await prisma.appointment.deleteMany({
      where: { barbershopId: testBarbershopId }
    });
  });

  async function setupTestData() {
    // Criar usuário proprietário
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
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
        email: 'barbershop@test.com',
        ownerId: owner.id
      }
    });
    testBarbershopId = barbershop.id;

    // Criar usuário barbeiro
    const barberUser = await prisma.user.create({
      data: {
        email: 'barber@test.com',
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
    testBarberId = barber.id;

    // Criar usuário cliente
    const clientUser = await prisma.user.create({
      data: {
        email: 'client@test.com',
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
    testClientId = clientUser.id;

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
    testServiceId = service.id;

    // Criar relacionamento barbeiro-serviço
    const barberService = await prisma.barberService.create({
      data: {
        barberId: testBarberId,
        serviceId: testServiceId,
        customPrice: 30.00
      }
    });
    testBarberServiceId = barberService.id;

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
  }

  async function cleanupTestData() {
    await prisma.appointment.deleteMany({});
    await prisma.barberException.deleteMany({});
    await prisma.globalException.deleteMany({});
    await prisma.barberSchedule.deleteMany({});
    await prisma.globalSchedule.deleteMany({});
    await prisma.barberService.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.barber.deleteMany({});
    await prisma.barbershop.deleteMany({});
    await prisma.user.deleteMany({});
  }

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
          category: 'Tratamento'
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

      // Limpar
      await prisma.service.delete({ where: { id: otherService.id } });
    });

    it('deve rejeitar agendamento com conflito de horário', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      // Criar primeiro agendamento
      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      // Tentar criar segundo agendamento no mesmo horário
      const conflictingTime = new Date(appointmentTime);
      conflictingTime.setMinutes(15); // 10:15 - conflita com o primeiro (10:00-10:30)

      await expect(appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: conflictingTime
      })).rejects.toThrow('Conflito de horário detectado');
    });

    it('deve rejeitar agendamento fora do horário de funcionamento', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(7, 0, 0, 0); // 07:00 - antes do horário do barbeiro (08:00)

      await expect(appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      })).rejects.toThrow('Horário fora do funcionamento');
    });

    it('deve permitir agendamento no horário individual do barbeiro (fora do global)', async () => {
      const monday = getNextMonday();
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(8, 30, 0, 0); // 08:30 - dentro do horário individual, fora do global

      const appointment = await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      expect(appointment).toBeDefined();
      expect(appointment.startTime).toEqual(appointmentTime);
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // Criar alguns agendamentos de teste
      const monday = getNextMonday();
      
      for (let i = 0; i < 3; i++) {
        const appointmentTime = new Date(monday);
        appointmentTime.setHours(10 + i, 0, 0, 0);

        await appointmentService.create({
          barbershopId: testBarbershopId,
          barberId: testBarberId,
          clientId: testClientId,
          serviceId: testServiceId,
          startTime: appointmentTime
        });
      }
    });

    it('deve listar agendamentos com paginação', async () => {
      const result = await appointmentService.findMany({
        barbershopId: testBarbershopId,
        skip: 0,
        take: 2
      });

      expect(result.appointments).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(true);
    });

    it('deve filtrar agendamentos por barbeiro', async () => {
      const result = await appointmentService.findMany({
        barberId: testBarberId
      });

      expect(result.appointments).toHaveLength(3);
      result.appointments.forEach(appointment => {
        expect(appointment.barberId).toBe(testBarberId);
      });
    });

    it('deve filtrar agendamentos por data', async () => {
      const monday = getNextMonday();
      
      const result = await appointmentService.findMany({
        startDate: startOfDay(monday),
        endDate: startOfDay(addDays(monday, 1))
      });

      expect(result.appointments).toHaveLength(3);
    });
  });

  describe('update', () => {
    let appointmentId: string;

    beforeEach(async () => {
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

      appointmentId = appointment.id;
    });

    it('deve atualizar status do agendamento', async () => {
      const updatedAppointment = await appointmentService.update(appointmentId, {
        status: AppointmentStatus.CONFIRMED
      });

      expect(updatedAppointment.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('deve atualizar horário do agendamento', async () => {
      const monday = getNextMonday();
      const newTime = new Date(monday);
      newTime.setHours(14, 0, 0, 0);

      const updatedAppointment = await appointmentService.update(appointmentId, {
        startTime: newTime
      });

      expect(updatedAppointment.startTime).toEqual(newTime);
      expect(updatedAppointment.endTime).toEqual(addMinutes(newTime, 30));
    });

    it('deve rejeitar atualização com conflito de horário', async () => {
      // Criar outro agendamento
      const monday = getNextMonday();
      const existingTime = new Date(monday);
      existingTime.setHours(14, 0, 0, 0);

      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: existingTime
      });

      // Tentar atualizar para o mesmo horário
      await expect(appointmentService.update(appointmentId, {
        startTime: existingTime
      })).rejects.toThrow('Conflito de horário detectado');
    });
  });

  describe('getAvailableSlots', () => {
    it('deve gerar slots disponíveis corretamente', async () => {
      const monday = getNextMonday();

      const slots = await appointmentService.getAvailableSlots(
        testBarberId,
        testBarbershopId,
        monday,
        30 // 30 minutos de duração
      );

      expect(slots.length).toBeGreaterThan(0);
      
      // Verificar se os slots estão dentro do horário de trabalho (08:00-19:00)
      slots.forEach(slot => {
        const hour = slot.startTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(8);
        expect(hour).toBeLessThan(19);
      });

      // Verificar se há slots disponíveis
      const availableSlots = slots.filter(slot => slot.available);
      expect(availableSlots.length).toBeGreaterThan(0);
    });

    it('deve marcar slots como indisponíveis quando há agendamentos', async () => {
      const monday = getNextMonday();

      // Criar agendamento às 10:00
      const appointmentTime = new Date(monday);
      appointmentTime.setHours(10, 0, 0, 0);

      await appointmentService.create({
        barbershopId: testBarbershopId,
        barberId: testBarberId,
        clientId: testClientId,
        serviceId: testServiceId,
        startTime: appointmentTime
      });

      const slots = await appointmentService.getAvailableSlots(
        testBarberId,
        testBarbershopId,
        monday,
        30
      );

      // Encontrar slots que conflitam com o agendamento (10:00-10:30)
      const conflictingSlots = slots.filter(slot => {
        const slotHour = slot.startTime.getHours();
        const slotMinute = slot.startTime.getMinutes();
        return (slotHour === 10 && slotMinute >= 0 && slotMinute < 30) ||
               (slotHour === 9 && slotMinute >= 45); // Slot que terminaria durante o agendamento
      });

      conflictingSlots.forEach(slot => {
        expect(slot.available).toBe(false);
      });
    });

    it('deve retornar array vazio quando barbeiro não trabalha no dia', async () => {
      const monday = getNextMonday();
      // Domingo (dayOfWeek = 0) - não configurado
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + (0 - sunday.getDay() + 7) % 7);

      const slots = await appointmentService.getAvailableSlots(
        testBarberId,
        testBarbershopId,
        sunday,
        30
      );

      expect(slots).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const monday = getNextMonday();
      
      // Criar agendamentos com diferentes status
      const appointments = [
        { status: AppointmentStatus.SCHEDULED, hour: 9 },
        { status: AppointmentStatus.CONFIRMED, hour: 10 },
        { status: AppointmentStatus.COMPLETED, hour: 11 },
        { status: AppointmentStatus.CANCELLED, hour: 12 },
        { status: AppointmentStatus.NO_SHOW, hour: 13 }
      ];

      for (const { status, hour } of appointments) {
        const appointmentTime = new Date(monday);
        appointmentTime.setHours(hour, 0, 0, 0);

        const appointment = await appointmentService.create({
          barbershopId: testBarbershopId,
          barberId: testBarberId,
          clientId: testClientId,
          serviceId: testServiceId,
          startTime: appointmentTime
        });

        if (status !== AppointmentStatus.SCHEDULED) {
          await appointmentService.update(appointment.id, { status });
        }
      }
    });

    it('deve calcular estatísticas corretamente', async () => {
      const stats = await appointmentService.getStats({
        barbershopId: testBarbershopId
      });

      expect(stats.total).toBe(5);
      expect(stats.scheduled).toBe(1);
      expect(stats.confirmed).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.noShow).toBe(1);
      expect(stats.totalRevenue).toBe(30); // Apenas agendamentos completos
      expect(stats.averagePrice).toBe(30);
    });

    it('deve filtrar estatísticas por barbeiro', async () => {
      const stats = await appointmentService.getStats({
        barberId: testBarberId
      });

      expect(stats.total).toBe(5);
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

      const cancelledAppointment = await appointmentService.cancel(
        appointment.id,
        'Cliente cancelou'
      );

      expect(cancelledAppointment.status).toBe(AppointmentStatus.CANCELLED);
      expect(cancelledAppointment.notes).toBe('Cliente cancelou');
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

  describe('complete', () => {
    it('deve finalizar agendamento com sucesso', async () => {
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

      const completedAppointment = await appointmentService.complete(
        appointment.id,
        'Serviço realizado com sucesso'
      );

      expect(completedAppointment.status).toBe(AppointmentStatus.COMPLETED);
      expect(completedAppointment.notes).toBe('Serviço realizado com sucesso');
    });
  });

  describe('markNoShow', () => {
    it('deve marcar como não compareceu com sucesso', async () => {
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

      const noShowAppointment = await appointmentService.markNoShow(appointment.id);

      expect(noShowAppointment.status).toBe(AppointmentStatus.NO_SHOW);
    });
  });
});
