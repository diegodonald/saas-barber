import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { scheduleApi } from '../../services/scheduleApi';

// Mock da API de Schedule
vi.mock('../../services/scheduleApi', () => ({
  scheduleApi: {
    globalSchedule: {
      create: vi.fn(),
      getByBarbershop: vi.fn(),
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
      getByBarbershop: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },    barberException: {
      create: vi.fn(),
      getMany: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    availability: {
      getByBarbershop: vi.fn(),
      getByBarber: vi.fn(),
    },
    getAllSchedules: vi.fn(),
    getAllExceptions: vi.fn(),
  },
}));

// Mock data
const mockGlobalSchedule = {
  id: '1',
  barbershopId: 'barbershop-1',
  dayOfWeek: 1,
  isOpen: true,
  openTime: '09:00',
  closeTime: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  createdAt: new Date(),
  updatedAt: new Date(),
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

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useSchedule Hook', () => {
  let mockScheduleApi: any;

  beforeEach(() => {
    vi.clearAllMocks();    
    // Resetar mock da API
    mockScheduleApi = vi.mocked(scheduleApi);
  });
  describe('Global Schedules', () => {
    test('deve buscar horários globais com sucesso', async () => {
      mockScheduleApi.globalSchedule.getByBarbershop.mockResolvedValue([mockGlobalSchedule]);

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

      expect(mockScheduleApi.globalSchedule.getByBarbershop).toHaveBeenCalledWith(
        'barbershop-1',
        undefined
      );
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
        openTime: '09:00',
        closeTime: '18:00',
      };

      await waitFor(async () => {
        const created = await result.current.createGlobalSchedule(createData);
        expect(created).toEqual(mockGlobalSchedule);
      });

      expect(mockScheduleApi.globalSchedule.create).toHaveBeenCalledWith(createData);
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
  });
});
