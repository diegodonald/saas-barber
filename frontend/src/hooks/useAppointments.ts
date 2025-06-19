import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '../services/appointmentApi';
import {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentFilters,
  AppointmentListResponse,
  AppointmentStats,
  DashboardMetrics,
  AppointmentStatus,
  CancelAppointmentData,
} from '../types/appointment';

interface UseAppointmentsOptions {
  barbershopId?: string;
  barberId?: string;
  clientId?: string;
  autoLoad?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { barbershopId, barberId, clientId, autoLoad = false } = options;

  // Estados principais
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para estatísticas
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Estados para métricas do dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Estados para paginação
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Auto-load na inicialização
  useEffect(() => {
    if (autoLoad) {
      fetchAppointments();
    }
  }, [autoLoad, barbershopId, barberId, clientId]);

  // CRUD - Buscar agendamentos
  const fetchAppointments = useCallback(async (filters?: AppointmentFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const mergedFilters = {
        barbershopId,
        barberId,
        clientId,
        ...filters,
      };

      const response = await appointmentApi.getAppointments(mergedFilters);
      
      // Se a resposta for um array simples, converter para o formato esperado
      if (Array.isArray(response)) {
        setAppointments(response);
        setTotal(response.length);
        setHasMore(false);
      } else {
        // Se for um objeto com estrutura de paginação
        const listResponse = response as AppointmentListResponse;
        setAppointments(listResponse.appointments || response);
        setTotal(listResponse.total || 0);
        setHasMore(listResponse.hasMore || false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar agendamentos');
      setAppointments([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, barberId, clientId]);

  // CRUD - Buscar agendamento por ID
  const fetchAppointmentById = useCallback(async (id: string) => {
    try {
      return await appointmentApi.getAppointmentById(id);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao buscar agendamento');
    }
  }, []);

  // CRUD - Criar agendamento
  const createAppointment = useCallback(async (data: CreateAppointmentData) => {
    try {
      const newAppointment = await appointmentApi.createAppointment(data);
      
      // Atualizar lista local
      setAppointments(prev => [newAppointment, ...prev]);
      setTotal(prev => prev + 1);
      
      return newAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar agendamento');
    }
  }, []);

  // CRUD - Atualizar agendamento
  const updateAppointment = useCallback(async (id: string, data: UpdateAppointmentData) => {
    try {
      const updatedAppointment = await appointmentApi.updateAppointment(id, data);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? updatedAppointment : appointment
        )
      );
      
      return updatedAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar agendamento');
    }
  }, []);

  // Ações específicas - Cancelar agendamento
  const cancelAppointment = useCallback(async (id: string, data?: CancelAppointmentData) => {
    try {
      const cancelledAppointment = await appointmentApi.cancelAppointment(id, data);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? cancelledAppointment : appointment
        )
      );
      
      return cancelledAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao cancelar agendamento');
    }
  }, []);

  // Ações específicas - Confirmar agendamento
  const confirmAppointment = useCallback(async (id: string) => {
    try {
      const confirmedAppointment = await appointmentApi.confirmAppointment(id);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? confirmedAppointment : appointment
        )
      );
      
      return confirmedAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao confirmar agendamento');
    }
  }, []);

  // Ações específicas - Iniciar serviço
  const startService = useCallback(async (id: string) => {
    try {
      const startedAppointment = await appointmentApi.startService(id);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? startedAppointment : appointment
        )
      );
      
      return startedAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao iniciar serviço');
    }
  }, []);

  // Ações específicas - Completar agendamento
  const completeAppointment = useCallback(async (id: string) => {
    try {
      const completedAppointment = await appointmentApi.completeAppointment(id);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? completedAppointment : appointment
        )
      );
      
      return completedAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao completar agendamento');
    }
  }, []);

  // Ações específicas - Marcar como não compareceu
  const markNoShow = useCallback(async (id: string) => {
    try {
      const noShowAppointment = await appointmentApi.markNoShow(id);
      
      // Atualizar lista local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? noShowAppointment : appointment
        )
      );
      
      return noShowAppointment;
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao marcar como não compareceu');
    }
  }, []);

  // Métricas - Buscar estatísticas
  const fetchStats = useCallback(async (filters?: AppointmentFilters) => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const mergedFilters = {
        barbershopId,
        barberId,
        clientId,
        ...filters,
      };

      const statsData = await appointmentApi.getStats(mergedFilters);
      setStats(statsData);
      return statsData;
    } catch (err: any) {
      setStatsError(err.message || 'Erro ao buscar estatísticas');
      setStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [barbershopId, barberId, clientId]);

  // Métricas - Buscar métricas do dashboard
  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);
    try {
      const metricsData = await appointmentApi.getDashboardMetrics();
      setDashboardMetrics(metricsData);
      return metricsData;
    } catch (err: any) {
      setMetricsError(err.message || 'Erro ao buscar métricas do dashboard');
      setDashboardMetrics(null);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // Utilitários - Buscar agendamentos por barbeiro
  const fetchAppointmentsByBarber = useCallback(async (targetBarberId: string) => {
    try {
      return await appointmentApi.getAppointmentsByBarber(targetBarberId);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao buscar agendamentos do barbeiro');
    }
  }, []);

  // Utilitários - Buscar horários disponíveis
  const getAvailableSlots = useCallback(async (params: {
    barberId: string;
    barbershopId: string;
    date: string;
    serviceDuration?: number;
  }) => {
    try {
      return await appointmentApi.getAvailableSlots(params);
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao buscar horários disponíveis');
    }
  }, []);

  // Filtros pré-definidos
  const getAppointmentsByStatus = useCallback((status: AppointmentStatus) => {
    return appointments.filter(appointment => appointment.status === status);
  }, [appointments]);

  const getTodayAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appointment => 
      appointment.startTime.toString().startsWith(today)
    );
  }, [appointments]);

  return {
    // Estados principais
    appointments,
    isLoading,
    error,
    total,
    hasMore,

    // Estados de estatísticas
    stats,
    isLoadingStats,
    statsError,

    // Estados de métricas
    dashboardMetrics,
    isLoadingMetrics,
    metricsError,

    // CRUD
    fetchAppointments,
    fetchAppointmentById,
    createAppointment,
    updateAppointment,

    // Ações específicas
    cancelAppointment,
    confirmAppointment,
    startService,
    completeAppointment,
    markNoShow,

    // Métricas
    fetchStats,
    fetchDashboardMetrics,

    // Utilitários
    fetchAppointmentsByBarber,
    getAvailableSlots,
    getAppointmentsByStatus,
    getTodayAppointments,
  };
}
