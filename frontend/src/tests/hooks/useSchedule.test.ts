import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSchedule } from '../../hooks/useSchedule';

// Mock da API de Schedule
vi.mock('../../services/scheduleApi', () => ({
  scheduleApi: {
    globalSchedule: {
      create: vi.fn(),
      getMany: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    barberSchedule: {
      create: vi.fn(),
      getMany: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    globalException: {
      create: vi.fn(),
      getMany: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    barberException: {
      create: vi.fn(),
      getMany: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    availability: {
      getAvailability: vi.fn(),
      getBarberAvailability: vi.fn(),
    },
  },
}));

// Mock data
const mockGlobalSchedule = {
  id: '1',
  barbershopId: 'barbershop-1',
  dayOfWeek: 1,
  isOpen: true,
  openTime: 540, // 09:00
  closeTime: 1080, // 18:00
  lunchStart: 720, // 12:00
  lunchEnd: 780, // 13:00
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBarberSchedule = {
  id: '2',
  barberId: 'barber-1',
  dayOfWeek: 1,
  isOpen: true,
  openTime: 540,
  closeTime: 1080,
  lunchStart: null,
  lunchEnd: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGlobalException = {
  id: '3',
  barbershopId: 'barbershop-1',
  date: new Date('2024-12-25'),
  type: 'CLOSED' as const,
  description: 'Natal',
  openTime: null,
  closeTime: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBarberException = {
  id: '4',
  barberId: 'barber-1',
  date: new Date('2024-12-31'),
  type: 'SPECIAL_HOURS' as const,
  description: 'Véspera de Ano Novo',
  openTime: 540,
  closeTime: 780,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAvailability = {
  date: '2024-01-15',
  isAvailable: true,
  globalSchedule: mockGlobalSchedule,
  availableBarbers: [
    {
      barberId: 'barber-1',
      barberName: 'João Silva',
      isAvailable: true,
      schedule: mockBarberSchedule,
      reason: null,
    },
  ],
  activeExceptions: [],
  reason: null,
};

// Wrapper provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSchedule Hook', () => {
  let mockScheduleApi: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Resetar mock da API
    mockScheduleApi = vi.mocked(
      require('../../services/scheduleApi').scheduleApi
    );
  });

  describe('Global Schedules', () => {
    test('deve buscar horários globais com sucesso', async () => {
      mockScheduleApi.globalSchedule.getMany.mockResolvedValue({
        data: [mockGlobalSchedule],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
          autoLoad: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.globalSchedules).toEqual([mockGlobalSchedule]);
        expect(result.current.isLoadingGlobalSchedules).toBe(false);
        expect(result.current.globalScheduleError).toBe(null);
      });

      expect(mockScheduleApi.globalSchedule.getMany).toHaveBeenCalledWith({
        barbershopId: 'barbershop-1',
      });
    });

    test('deve criar horário global com sucesso', async () => {
      mockScheduleApi.globalSchedule.create.mockResolvedValue(mockGlobalSchedule);

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      const createData = {
        barbershopId: 'barbershop-1',
        dayOfWeek: 1,
        isOpen: true,
        openTime: 540,
        closeTime: 1080,
      };

      await waitFor(async () => {
        const created = await result.current.createGlobalSchedule(createData);
        expect(created).toEqual(mockGlobalSchedule);
      });

      expect(mockScheduleApi.globalSchedule.create).toHaveBeenCalledWith(createData);
    });

    test('deve atualizar horário global com sucesso', async () => {
      const updatedSchedule = { ...mockGlobalSchedule, isOpen: false };
      mockScheduleApi.globalSchedule.update.mockResolvedValue(updatedSchedule);

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      const updateData = { isOpen: false };

      await waitFor(async () => {
        const updated = await result.current.updateGlobalSchedule('1', updateData);
        expect(updated).toEqual(updatedSchedule);
      });

      expect(mockScheduleApi.globalSchedule.update).toHaveBeenCalledWith('1', updateData);
    });

    test('deve deletar horário global com sucesso', async () => {
      mockScheduleApi.globalSchedule.delete.mockResolvedValue({ success: true });

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(async () => {
        await result.current.deleteGlobalSchedule('1');
      });

      expect(mockScheduleApi.globalSchedule.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('Barber Schedules', () => {
    test('deve buscar horários de barbeiro com sucesso', async () => {
      mockScheduleApi.barberSchedule.getMany.mockResolvedValue({
        data: [mockBarberSchedule],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const { result } = renderHook(
        () => useSchedule({
          barberId: 'barber-1',
          autoLoad: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.barberSchedules).toEqual([mockBarberSchedule]);
        expect(result.current.isLoadingBarberSchedules).toBe(false);
        expect(result.current.barberScheduleError).toBe(null);
      });

      expect(mockScheduleApi.barberSchedule.getMany).toHaveBeenCalledWith({
        barberId: 'barber-1',
      });
    });

    test('deve criar horário de barbeiro com sucesso', async () => {
      mockScheduleApi.barberSchedule.create.mockResolvedValue(mockBarberSchedule);

      const { result } = renderHook(
        () => useSchedule({
          barberId: 'barber-1',
        }),
        { wrapper: createWrapper() }
      );

      const createData = {
        barberId: 'barber-1',
        dayOfWeek: 1,
        isOpen: true,
        openTime: 540,
        closeTime: 1080,
      };

      await waitFor(async () => {
        const created = await result.current.createBarberSchedule(createData);
        expect(created).toEqual(mockBarberSchedule);
      });

      expect(mockScheduleApi.barberSchedule.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('Global Exceptions', () => {
    test('deve buscar exceções globais com sucesso', async () => {
      mockScheduleApi.globalException.getMany.mockResolvedValue({
        data: [mockGlobalException],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
          autoLoad: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.globalExceptions).toEqual([mockGlobalException]);
        expect(result.current.isLoadingGlobalExceptions).toBe(false);
        expect(result.current.globalExceptionError).toBe(null);
      });

      expect(mockScheduleApi.globalException.getMany).toHaveBeenCalledWith({
        barbershopId: 'barbershop-1',
      });
    });

    test('deve criar exceção global com sucesso', async () => {
      mockScheduleApi.globalException.create.mockResolvedValue(mockGlobalException);

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      const createData = {
        barbershopId: 'barbershop-1',
        date: '2024-12-25',
        type: 'CLOSED' as const,
        description: 'Natal',
      };

      await waitFor(async () => {
        const created = await result.current.createGlobalException(createData);
        expect(created).toEqual(mockGlobalException);
      });

      expect(mockScheduleApi.globalException.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('Barber Exceptions', () => {
    test('deve buscar exceções de barbeiro com sucesso', async () => {
      mockScheduleApi.barberException.getMany.mockResolvedValue({
        data: [mockBarberException],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const { result } = renderHook(
        () => useSchedule({
          barberId: 'barber-1',
          autoLoad: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.barberExceptions).toEqual([mockBarberException]);
        expect(result.current.isLoadingBarberExceptions).toBe(false);
        expect(result.current.barberExceptionError).toBe(null);
      });

      expect(mockScheduleApi.barberException.getMany).toHaveBeenCalledWith({
        barberId: 'barber-1',
      });
    });

    test('deve criar exceção de barbeiro com sucesso', async () => {
      mockScheduleApi.barberException.create.mockResolvedValue(mockBarberException);

      const { result } = renderHook(
        () => useSchedule({
          barberId: 'barber-1',
        }),
        { wrapper: createWrapper() }
      );

      const createData = {
        barberId: 'barber-1',
        date: '2024-12-31',
        type: 'SPECIAL_HOURS' as const,
        description: 'Véspera de Ano Novo',
        openTime: 540,
        closeTime: 780,
      };

      await waitFor(async () => {
        const created = await result.current.createBarberException(createData);
        expect(created).toEqual(mockBarberException);
      });

      expect(mockScheduleApi.barberException.create).toHaveBeenCalledWith(createData);
    });
  });

  describe('Availability', () => {
    test('deve buscar disponibilidade com sucesso', async () => {
      mockScheduleApi.availability.getAvailability.mockResolvedValue(mockAvailability);

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(async () => {
        await result.current.checkAvailability('2024-01-15');
        expect(result.current.availability).toEqual(mockAvailability);
        expect(result.current.isLoadingAvailability).toBe(false);
        expect(result.current.availabilityError).toBe(null);
      });

      expect(mockScheduleApi.availability.getAvailability).toHaveBeenCalledWith(
        'barbershop-1',
        '2024-01-15'
      );
    });

    test('deve buscar disponibilidade de barbeiro com sucesso', async () => {
      mockScheduleApi.availability.getBarberAvailability.mockResolvedValue(mockAvailability);

      const { result } = renderHook(
        () => useSchedule({
          barberId: 'barber-1',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(async () => {
        await result.current.checkAvailability('2024-01-15');
        expect(result.current.availability).toEqual(mockAvailability);
      });

      expect(mockScheduleApi.availability.getBarberAvailability).toHaveBeenCalledWith(
        'barber-1',
        '2024-01-15'
      );
    });
  });

  describe('Error Handling', () => {
    test('deve tratar erro ao buscar horários globais', async () => {
      const errorMessage = 'Erro ao buscar horários';
      mockScheduleApi.globalSchedule.getMany.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
          autoLoad: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.globalScheduleError).toBe(errorMessage);
        expect(result.current.isLoadingGlobalSchedules).toBe(false);
        expect(result.current.globalSchedules).toEqual([]);
      });
    });

    test('deve tratar erro ao criar horário global', async () => {
      const errorMessage = 'Erro ao criar horário';
      mockScheduleApi.globalSchedule.create.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      const createData = {
        barbershopId: 'barbershop-1',
        dayOfWeek: 1,
        isOpen: true,
        openTime: 540,
        closeTime: 1080,
      };

      await expect(async () => {
        await result.current.createGlobalSchedule(createData);
      }).rejects.toThrow(errorMessage);
    });
  });

  describe('Refresh Functions', () => {
    test('deve executar refresh de horários globais', async () => {
      mockScheduleApi.globalSchedule.getMany.mockResolvedValue({
        data: [mockGlobalSchedule],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(async () => {
        await result.current.refreshGlobalSchedules();
      });

      expect(mockScheduleApi.globalSchedule.getMany).toHaveBeenCalledWith({
        barbershopId: 'barbershop-1',
      });
    });

    test('deve executar refresh de disponibilidade', async () => {
      mockScheduleApi.availability.getAvailability.mockResolvedValue(mockAvailability);

      const { result } = renderHook(
        () => useSchedule({
          barbershopId: 'barbershop-1',
        }),
        { wrapper: createWrapper() }
      );

      // Primeiro, definir uma data para availability
      await waitFor(async () => {
        await result.current.checkAvailability('2024-01-15');
      });

      // Depois, testar o refresh
      await waitFor(async () => {
        await result.current.refreshAvailability();
      });

      expect(mockScheduleApi.availability.getAvailability).toHaveBeenCalledTimes(2);
    });
  });
});