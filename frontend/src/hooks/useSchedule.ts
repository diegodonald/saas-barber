import { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '../services/scheduleApi';
import {
  BarberSchedule,
  GlobalSchedule,
  BarberException,
  GlobalException,
  AvailabilityResponse,
  CreateBarberScheduleData,
  CreateGlobalScheduleData,
  CreateBarberExceptionData,
  CreateGlobalExceptionData,
  UpdateBarberScheduleData,
  UpdateGlobalScheduleData,
  UpdateBarberExceptionData,
  UpdateGlobalExceptionData,
  ExceptionFilters,
  ScheduleFilters,
} from '../types/schedule';

interface UseScheduleOptions {
  barbershopId?: string;
  barberId?: string;
  autoLoad?: boolean;
}

export function useSchedule(options: UseScheduleOptions = {}) {
  const { barbershopId, barberId, autoLoad = false } = options;

  // States para horários globais
  const [globalSchedules, setGlobalSchedules] = useState<GlobalSchedule[]>([]);
  const [isLoadingGlobalSchedules, setIsLoadingGlobalSchedules] = useState(false);
  const [globalScheduleError, setGlobalScheduleError] = useState<string | null>(null);

  // States para horários de barbeiro
  const [barberSchedules, setBarberSchedules] = useState<BarberSchedule[]>([]);
  const [isLoadingBarberSchedules, setIsLoadingBarberSchedules] = useState(false);
  const [barberScheduleError, setBarberScheduleError] = useState<string | null>(null);

  // States para exceções globais
  const [globalExceptions, setGlobalExceptions] = useState<GlobalException[]>([]);
  const [isLoadingGlobalExceptions, setIsLoadingGlobalExceptions] = useState(false);
  const [globalExceptionError, setGlobalExceptionError] = useState<string | null>(null);

  // States para exceções de barbeiro
  const [barberExceptions, setBarberExceptions] = useState<BarberException[]>([]);
  const [isLoadingBarberExceptions, setIsLoadingBarberExceptions] = useState(false);
  const [barberExceptionError, setBarberExceptionError] = useState<string | null>(null);
  // States para disponibilidade
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // CRUD Global Schedules
  const fetchGlobalSchedules = useCallback(async (filters?: ScheduleFilters) => {
    setIsLoadingGlobalSchedules(true);
    setGlobalScheduleError(null);
    try {
      if (!barbershopId) {
        throw new Error('barbershopId é obrigatório para buscar horários globais');
      }
      
      const schedules = await scheduleApi.globalSchedule.getByBarbershop(
        barbershopId,
        filters
      );
      setGlobalSchedules(schedules);
    } catch (err: any) {
      setGlobalScheduleError(err.message || 'Erro ao buscar horários globais');
      setGlobalSchedules([]);
    } finally {
      setIsLoadingGlobalSchedules(false);
    }
  }, [barbershopId]);

  const createGlobalSchedule = useCallback(async (data: CreateGlobalScheduleData) => {
    try {
      return await scheduleApi.globalSchedule.create(data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar horário global');
    }
  }, []);

  const updateGlobalSchedule = useCallback(async (id: string, data: UpdateGlobalScheduleData) => {
    try {
      return await scheduleApi.globalSchedule.update(id, data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar horário global');
    }
  }, []);

  const deleteGlobalSchedule = useCallback(async (id: string) => {
    try {
      return await scheduleApi.globalSchedule.delete(id);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao deletar horário global');
    }
  }, []);

  // CRUD Barber Schedules
  const fetchBarberSchedules = useCallback(async (filters?: ScheduleFilters) => {
    setIsLoadingBarberSchedules(true);
    setBarberScheduleError(null);
    try {      const res = await scheduleApi.barberSchedule.getMany({
        barberId,
        ...filters,
      });
      setBarberSchedules(res);
    } catch (err: any) {
      setBarberScheduleError(err.message || 'Erro ao buscar horários de barbeiro');
      setBarberSchedules([]);
    } finally {
      setIsLoadingBarberSchedules(false);
    }
  }, [barberId]);

  const createBarberSchedule = useCallback(async (data: CreateBarberScheduleData) => {
    try {
      return await scheduleApi.barberSchedule.create(data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar horário de barbeiro');
    }
  }, []);

  const updateBarberSchedule = useCallback(async (id: string, data: UpdateBarberScheduleData) => {
    try {
      return await scheduleApi.barberSchedule.update(id, data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar horário de barbeiro');
    }
  }, []);

  const deleteBarberSchedule = useCallback(async (id: string) => {
    try {
      return await scheduleApi.barberSchedule.delete(id);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao deletar horário de barbeiro');
    }
  }, []);
  // CRUD Global Exceptions
  const fetchGlobalExceptions = useCallback(async (filters?: ExceptionFilters) => {
    if (!barbershopId) return;
    
    setIsLoadingGlobalExceptions(true);
    setGlobalExceptionError(null);
    try {
      const res = await scheduleApi.globalException.getByBarbershop(barbershopId, filters);
      setGlobalExceptions(res);
    } catch (err: any) {
      setGlobalExceptionError(err.message || 'Erro ao buscar exceções globais');
      setGlobalExceptions([]);
    } finally {
      setIsLoadingGlobalExceptions(false);
    }
  }, [barbershopId]);

  const createGlobalException = useCallback(async (data: CreateGlobalExceptionData) => {
    try {
      return await scheduleApi.globalException.create(data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar exceção global');
    }
  }, []);

  const updateGlobalException = useCallback(async (id: string, data: UpdateGlobalExceptionData) => {
    try {
      return await scheduleApi.globalException.update(id, data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar exceção global');
    }
  }, []);

  const deleteGlobalException = useCallback(async (id: string) => {
    try {
      return await scheduleApi.globalException.delete(id);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao deletar exceção global');
    }
  }, []);

  // CRUD Barber Exceptions
  const fetchBarberExceptions = useCallback(async (filters?: ExceptionFilters) => {
    setIsLoadingBarberExceptions(true);
    setBarberExceptionError(null);    try {
      const res = await scheduleApi.barberException.getMany({
        barberId,
        ...filters,
      });
      setBarberExceptions(res);
    } catch (err: any) {
      setBarberExceptionError(err.message || 'Erro ao buscar exceções de barbeiro');
      setBarberExceptions([]);
    } finally {
      setIsLoadingBarberExceptions(false);
    }
  }, [barberId]);

  const createBarberException = useCallback(async (data: CreateBarberExceptionData) => {
    try {
      return await scheduleApi.barberException.create(data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar exceção de barbeiro');
    }
  }, []);

  const updateBarberException = useCallback(async (id: string, data: UpdateBarberExceptionData) => {
    try {
      return await scheduleApi.barberException.update(id, data);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar exceção de barbeiro');
    }
  }, []);

  const deleteBarberException = useCallback(async (id: string) => {
    try {
      return await scheduleApi.barberException.delete(id);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao deletar exceção de barbeiro');
    }
  }, []);
  // Disponibilidade
  const checkAvailability = useCallback(async (date: string, options?: { serviceDuration?: number }) => {
    setIsLoadingAvailability(true);
    setAvailabilityError(null);
    try {
      let res: AvailabilityResponse;
      if (barberId) {
        res = await scheduleApi.availability.getByBarber(barberId, date, options?.serviceDuration);
      } else if (barbershopId) {
        res = await scheduleApi.availability.getByBarbershop(barbershopId, date, {
          barberId,
          serviceDuration: options?.serviceDuration
        });
      } else {
        throw new Error('É necessário informar barbershopId ou barberId');
      }
      setAvailability(res);
    } catch (err: any) {
      setAvailabilityError(err.message || 'Erro ao buscar disponibilidade');
      setAvailability(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [barberId, barbershopId]);

  // Auto load
  useEffect(() => {
    if (autoLoad) {
      if (barbershopId) {
        fetchGlobalSchedules();
        fetchGlobalExceptions();
      }
      if (barberId) {
        fetchBarberSchedules();
        fetchBarberExceptions();
      }
    }
  }, [autoLoad, barbershopId, barberId, fetchGlobalSchedules, fetchGlobalExceptions, fetchBarberSchedules, fetchBarberExceptions]);

  return {
    // Global Schedules
    globalSchedules,
    isLoadingGlobalSchedules,
    globalScheduleError,
    fetchGlobalSchedules,
    createGlobalSchedule,
    updateGlobalSchedule,
    deleteGlobalSchedule,
    // Barber Schedules
    barberSchedules,
    isLoadingBarberSchedules,
    barberScheduleError,
    fetchBarberSchedules,
    createBarberSchedule,
    updateBarberSchedule,
    deleteBarberSchedule,
    // Global Exceptions
    globalExceptions,
    isLoadingGlobalExceptions,
    globalExceptionError,
    fetchGlobalExceptions,
    createGlobalException,
    updateGlobalException,
    deleteGlobalException,
    // Barber Exceptions
    barberExceptions,
    isLoadingBarberExceptions,
    barberExceptionError,
    fetchBarberExceptions,
    createBarberException,
    updateBarberException,
    deleteBarberException,
    // Disponibilidade
    availability,
    isLoadingAvailability,
    availabilityError,
    checkAvailability,
  };
} 