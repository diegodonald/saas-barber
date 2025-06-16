/**
 * Serviço de API para gerenciamento de agendamentos
 * Integra com os endpoints do backend AppointmentController
 */

import { AppointmentStatus } from '../types/appointment';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  APPOINTMENTS: '/api/appointments',
  STATS: '/api/appointments/stats',
  AVAILABLE_SLOTS: '/api/appointments/available-slots',
  BY_BARBER: (barberId: string) => `/api/appointments/barber/${barberId}`,
  BY_ID: (id: string) => `/api/appointments/${id}`,
  CONFIRM: (id: string) => `/api/appointments/${id}/confirm`,
  START: (id: string) => `/api/appointments/${id}/start`,
  COMPLETE: (id: string) => `/api/appointments/${id}/complete`,
  NO_SHOW: (id: string) => `/api/appointments/${id}/no-show`,
  CANCEL: (id: string) => `/api/appointments/${id}`
} as const;

// Interfaces para estatísticas
export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface DashboardMetrics {
  todayAppointments: number;
  weekRevenue: number;
  totalClients: number;
  monthlyAppointments: number;
}

class AppointmentApi {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obter estatísticas de agendamentos
   */
  async getStats(filters?: {
    barbershopId?: string;
    barberId?: string;
    clientId?: string;
    serviceId?: string;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<AppointmentStats> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.STATS}?${queryParams.toString()}`
      : API_ENDPOINTS.STATS;

    return this.request<AppointmentStats>(endpoint);
  }

  /**
   * Obter métricas específicas para o dashboard
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Buscar estatísticas para hoje
    const todayStats = await this.getStats({
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });

    // Buscar estatísticas da semana
    const weekStats = await this.getStats({
      startDate: startOfWeek.toISOString(),
      endDate: today.toISOString()
    });

    // Buscar estatísticas do mês
    const monthStats = await this.getStats({
      startDate: startOfMonth.toISOString(),
      endDate: today.toISOString()
    });

    // Para total de clientes, precisamos de uma abordagem diferente
    // Por enquanto, vamos usar uma estimativa baseada nos agendamentos únicos
    const totalClients = monthStats.total; // Simplificado por enquanto

    return {
      todayAppointments: todayStats.total,
      weekRevenue: weekStats.totalRevenue,
      totalClients,
      monthlyAppointments: monthStats.total
    };
  }

  /**
   * Listar agendamentos
   */
  async getAppointments(filters?: {
    barbershopId?: string;
    barberId?: string;
    clientId?: string;
    serviceId?: string;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
    orderBy?: 'startTime' | 'createdAt';
    orderDirection?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.APPOINTMENTS}?${queryParams.toString()}`
      : API_ENDPOINTS.APPOINTMENTS;

    return this.request(endpoint);
  }

  /**
   * Buscar agendamento por ID
   */
  async getAppointmentById(id: string) {
    return this.request(API_ENDPOINTS.BY_ID(id));
  }

  /**
   * Criar novo agendamento
   */
  async createAppointment(data: {
    barbershopId: string;
    barberId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
    clientId?: string;
  }) {
    return this.request(API_ENDPOINTS.APPOINTMENTS, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualizar agendamento
   */
  async updateAppointment(id: string, data: {
    startTime?: string;
    status?: AppointmentStatus;
    notes?: string;
  }) {
    return this.request(API_ENDPOINTS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Cancelar agendamento
   */
  async cancelAppointment(id: string, reason?: string) {
    return this.request(API_ENDPOINTS.CANCEL(id), {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Confirmar agendamento
   */
  async confirmAppointment(id: string) {
    return this.request(API_ENDPOINTS.CONFIRM(id), {
      method: 'PATCH'
    });
  }

  /**
   * Iniciar serviço
   */
  async startService(id: string) {
    return this.request(API_ENDPOINTS.START(id), {
      method: 'PATCH'
    });
  }

  /**
   * Completar agendamento
   */
  async completeAppointment(id: string, notes?: string) {
    return this.request(API_ENDPOINTS.COMPLETE(id), {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
  }

  /**
   * Marcar como não compareceu
   */
  async markNoShow(id: string) {
    return this.request(API_ENDPOINTS.NO_SHOW(id), {
      method: 'PATCH'
    });
  }

  /**
   * Buscar horários disponíveis
   */
  async getAvailableSlots(params: {
    barberId: string;
    barbershopId: string;
    date: string;
    serviceDuration?: number;
  }) {
    const queryParams = new URLSearchParams(params as any);
    return this.request(`${API_ENDPOINTS.AVAILABLE_SLOTS}?${queryParams.toString()}`);
  }

  /**
   * Buscar agendamentos por barbeiro
   */
  async getAppointmentsByBarber(barberId: string) {
    return this.request(API_ENDPOINTS.BY_BARBER(barberId));
  }
}

// Instância singleton
const appointmentApi = new AppointmentApi();

// Export individual das funções para uso direto
export const {
  getStats,
  getDashboardMetrics,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  startService,
  completeAppointment,
  markNoShow,
  getAvailableSlots,
  getAppointmentsByBarber
} = appointmentApi;

// Export da instância para uso avançado
export default appointmentApi; 