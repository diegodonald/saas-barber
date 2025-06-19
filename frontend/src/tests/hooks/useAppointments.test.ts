import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppointments } from '../../hooks/useAppointments';
import { appointmentApi } from '../../services/appointmentApi';
import { AppointmentStatus } from '../../types/appointment';

// Mock do appointmentApi
vi.mock('../../services/appointmentApi', () => ({
  appointmentApi: {
    getAppointments: vi.fn(),
    getAppointmentById: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    confirmAppointment: vi.fn(),
    startService: vi.fn(),
    completeAppointment: vi.fn(),
    markNoShow: vi.fn(),
    getStats: vi.fn(),
    getDashboardMetrics: vi.fn(),
    getAppointmentsByBarber: vi.fn(),
    getAvailableSlots: vi.fn(),
  },
}));

// Mock data
const mockAppointment = {
  id: 'appointment-1',
  barbershopId: 'barbershop-1',
  barberId: 'barber-1',
  clientId: 'client-1',
  serviceId: 'service-1',
  startTime: new Date('2024-01-15T10:00:00Z'),
  endTime: new Date('2024-01-15T10:30:00Z'),
  totalPrice: 25.00,
  status: AppointmentStatus.SCHEDULED,
  notes: 'Teste',
  createdAt: new Date('2024-01-10T10:00:00Z'),
  updatedAt: new Date('2024-01-10T10:00:00Z'),
  barber: {
    id: 'barber-1',
    user: {
      id: 'user-1',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
    },
    barbershopId: 'barbershop-1',
  },
  client: {
    id: 'client-1',
    name: 'Cliente Teste',
    email: 'cliente@example.com',
    phone: '(11) 88888-8888',
  },
  service: {
    id: 'service-1',
    name: 'Corte Masculino',
    description: 'Corte tradicional',
    price: 25.00,
    duration: 30,
    category: 'Corte',
  },
  barbershop: {
    id: 'barbershop-1',
    name: 'Barbearia Teste',
    address: 'Rua Teste, 123',
    phone: '(11) 77777-7777',
  },
};

const mockStats = {
  total: 10,
  scheduled: 3,
  confirmed: 2,
  completed: 4,
  cancelled: 1,
  noShow: 0,
  totalRevenue: 250.00,
  averagePrice: 25.00,
};

const mockDashboardMetrics = {
  todayAppointments: 5,
  weekRevenue: 350.00,
  totalClients: 25,
  monthlyAppointments: 45,
};

describe('useAppointments Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Inicialização e carregamento', () => {
    it('deve inicializar com valores padrão', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.total).toBe(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.stats).toBe(null);
      expect(result.current.dashboardMetrics).toBe(null);
    });

    it('deve carregar agendamentos automaticamente quando autoLoad=true', async () => {
      vi.mocked(appointmentApi.getAppointments).mockResolvedValue([mockAppointment]);

      const { result } = renderHook(() => 
        useAppointments({ barbershopId: 'barbershop-1', autoLoad: true })
      );

      // Aguardar o carregamento
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(appointmentApi.getAppointments).toHaveBeenCalledWith({
        barbershopId: 'barbershop-1',
        barberId: undefined,
        clientId: undefined,
      });
      expect(result.current.appointments).toEqual([mockAppointment]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('CRUD - Buscar agendamentos', () => {
    it('deve buscar agendamentos com sucesso', async () => {
      vi.mocked(appointmentApi.getAppointments).mockResolvedValue([mockAppointment]);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(result.current.appointments).toEqual([mockAppointment]);
      expect(result.current.total).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('deve buscar agendamento por ID', async () => {
      vi.mocked(appointmentApi.getAppointmentById).mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointments());

      let appointment;
      await act(async () => {
        appointment = await result.current.fetchAppointmentById('appointment-1');
      });

      expect(appointmentApi.getAppointmentById).toHaveBeenCalledWith('appointment-1');
      expect(appointment).toEqual(mockAppointment);
    });

    it('deve criar agendamento com sucesso', async () => {
      const newAppointmentData = {
        barbershopId: 'barbershop-1',
        barberId: 'barber-1',
        serviceId: 'service-1',
        startTime: '2024-01-15T10:00:00Z',
        notes: 'Novo agendamento',
      };

      vi.mocked(appointmentApi.createAppointment).mockResolvedValue(mockAppointment);

      const { result } = renderHook(() => useAppointments());

      let createdAppointment;
      await act(async () => {
        createdAppointment = await result.current.createAppointment(newAppointmentData);
      });

      expect(appointmentApi.createAppointment).toHaveBeenCalledWith(newAppointmentData);
      expect(createdAppointment).toEqual(mockAppointment);
      expect(result.current.appointments).toContain(mockAppointment);
      expect(result.current.total).toBe(1);
    });

    it('deve atualizar agendamento com sucesso', async () => {
      const updatedAppointment = { ...mockAppointment, notes: 'Atualizado' };
      vi.mocked(appointmentApi.updateAppointment).mockResolvedValue(updatedAppointment);

      const { result } = renderHook(() => useAppointments());

      // Primeiro, adicionar o agendamento à lista
      await act(async () => {
        result.current.appointments.push(mockAppointment);
      });

      await act(async () => {
        await result.current.updateAppointment('appointment-1', { notes: 'Atualizado' });
      });

      expect(appointmentApi.updateAppointment).toHaveBeenCalledWith('appointment-1', { notes: 'Atualizado' });
    });
  });

  describe('Ações específicas', () => {
    it('deve cancelar agendamento com sucesso', async () => {
      const cancelledAppointment = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      vi.mocked(appointmentApi.cancelAppointment).mockResolvedValue(cancelledAppointment);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.cancelAppointment('appointment-1', { reason: 'Cliente cancelou' });
      });

      expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith('appointment-1', { reason: 'Cliente cancelou' });
    });

    it('deve confirmar agendamento com sucesso', async () => {
      const confirmedAppointment = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
      vi.mocked(appointmentApi.confirmAppointment).mockResolvedValue(confirmedAppointment);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.confirmAppointment('appointment-1');
      });

      expect(appointmentApi.confirmAppointment).toHaveBeenCalledWith('appointment-1');
    });

    it('deve iniciar serviço com sucesso', async () => {
      const startedAppointment = { ...mockAppointment, status: AppointmentStatus.IN_PROGRESS };
      vi.mocked(appointmentApi.startService).mockResolvedValue(startedAppointment);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.startService('appointment-1');
      });

      expect(appointmentApi.startService).toHaveBeenCalledWith('appointment-1');
    });

    it('deve completar agendamento com sucesso', async () => {
      const completedAppointment = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      vi.mocked(appointmentApi.completeAppointment).mockResolvedValue(completedAppointment);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.completeAppointment('appointment-1');
      });

      expect(appointmentApi.completeAppointment).toHaveBeenCalledWith('appointment-1');
    });

    it('deve marcar como não compareceu com sucesso', async () => {
      const noShowAppointment = { ...mockAppointment, status: AppointmentStatus.NO_SHOW };
      vi.mocked(appointmentApi.markNoShow).mockResolvedValue(noShowAppointment);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.markNoShow('appointment-1');
      });

      expect(appointmentApi.markNoShow).toHaveBeenCalledWith('appointment-1');
    });
  });

  describe('Métricas e estatísticas', () => {
    it('deve buscar estatísticas com sucesso', async () => {
      vi.mocked(appointmentApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.isLoadingStats).toBe(false);
      expect(result.current.statsError).toBe(null);
    });

    it('deve buscar métricas do dashboard com sucesso', async () => {
      vi.mocked(appointmentApi.getDashboardMetrics).mockResolvedValue(mockDashboardMetrics);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchDashboardMetrics();
      });

      expect(result.current.dashboardMetrics).toEqual(mockDashboardMetrics);
      expect(result.current.isLoadingMetrics).toBe(false);
      expect(result.current.metricsError).toBe(null);
    });
  });

  describe('Utilitários', () => {
    it('deve buscar agendamentos por barbeiro', async () => {
      vi.mocked(appointmentApi.getAppointmentsByBarber).mockResolvedValue([mockAppointment]);

      const { result } = renderHook(() => useAppointments());

      let appointments;
      await act(async () => {
        appointments = await result.current.fetchAppointmentsByBarber('barber-1');
      });

      expect(appointmentApi.getAppointmentsByBarber).toHaveBeenCalledWith('barber-1');
      expect(appointments).toEqual([mockAppointment]);
    });

    it('deve buscar horários disponíveis', async () => {
      const mockSlots = [
        { startTime: new Date('2024-01-15T10:00:00Z'), endTime: new Date('2024-01-15T10:30:00Z'), available: true },
      ];
      vi.mocked(appointmentApi.getAvailableSlots).mockResolvedValue(mockSlots);

      const { result } = renderHook(() => useAppointments());

      const params = {
        barberId: 'barber-1',
        barbershopId: 'barbershop-1',
        date: '2024-01-15',
        serviceDuration: 30,
      };

      let slots;
      await act(async () => {
        slots = await result.current.getAvailableSlots(params);
      });

      expect(appointmentApi.getAvailableSlots).toHaveBeenCalledWith(params);
      expect(slots).toEqual(mockSlots);
    });

    it('deve filtrar agendamentos por status', () => {
      const { result } = renderHook(() => useAppointments());

      // Simular agendamentos na lista
      act(() => {
        result.current.appointments.push(
          mockAppointment,
          { ...mockAppointment, id: 'appointment-2', status: AppointmentStatus.CONFIRMED }
        );
      });

      const scheduledAppointments = result.current.getAppointmentsByStatus(AppointmentStatus.SCHEDULED);
      const confirmedAppointments = result.current.getAppointmentsByStatus(AppointmentStatus.CONFIRMED);

      expect(scheduledAppointments).toHaveLength(1);
      expect(confirmedAppointments).toHaveLength(1);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve capturar erro ao buscar agendamentos', async () => {
      const errorMessage = 'Erro de rede';
      vi.mocked(appointmentApi.getAppointments).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.appointments).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('deve capturar erro ao criar agendamento', async () => {
      const errorMessage = 'Erro ao criar';
      vi.mocked(appointmentApi.createAppointment).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAppointments());

      await expect(
        act(async () => {
          await result.current.createAppointment({
            barbershopId: 'barbershop-1',
            barberId: 'barber-1',
            serviceId: 'service-1',
            startTime: '2024-01-15T10:00:00Z',
          });
        })
      ).rejects.toThrow(errorMessage);
    });
  });
});
