import { 
  GlobalSchedule,
  BarberSchedule,
  GlobalException,
  BarberException,
  CreateGlobalScheduleData,
  CreateBarberScheduleData,
  CreateGlobalExceptionData,
  CreateBarberExceptionData,  UpdateGlobalScheduleData,
  UpdateBarberScheduleData,
  UpdateGlobalExceptionData,
  UpdateBarberExceptionData,
  ScheduleFilters,
  ExceptionFilters,
  // AvailabilityRequest, // Removido pois não está sendo usado
  AvailabilityResponse
} from '../types/schedule';

// ========================================
// CONFIGURAÇÃO BASE DA API
// ========================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Obter token do localStorage
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// ========================================
// SERVIÇO DE HORÁRIOS GLOBAIS
// ========================================

export class GlobalScheduleApiService {
  /**
   * Criar novo horário global
   */
  static async create(data: CreateGlobalScheduleData): Promise<GlobalSchedule> {
    return apiClient.post<GlobalSchedule>('/global-schedules', data);
  }

  /**
   * Buscar horários globais por barbearia
   */
  static async getByBarbershop(
    barbershopId: string, 
    filters?: Omit<ScheduleFilters, 'barberId' | 'barbershopId'>
  ): Promise<GlobalSchedule[]> {
    const params = new URLSearchParams();
    
    if (filters?.dayOfWeek !== undefined) {
      params.append('dayOfWeek', filters.dayOfWeek.toString());
    }
    if (filters?.isOpen !== undefined) {
      params.append('isOpen', filters.isOpen.toString());
    }

    const query = params.toString();
    const endpoint = `/global-schedules/barbershop/${barbershopId}${query ? `?${query}` : ''}`;
    
    return apiClient.get<GlobalSchedule[]>(endpoint);
  }

  /**
   * Buscar horário global por ID
   */
  static async getById(id: string): Promise<GlobalSchedule> {
    return apiClient.get<GlobalSchedule>(`/global-schedules/${id}`);
  }

  /**
   * Atualizar horário global
   */
  static async update(id: string, data: UpdateGlobalScheduleData): Promise<GlobalSchedule> {
    return apiClient.put<GlobalSchedule>(`/global-schedules/${id}`, data);
  }

  /**
   * Remover horário global
   */
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/global-schedules/${id}`);
  }

  /**
   * Configurar horários padrão para uma barbearia
   */
  static async setupDefaultSchedule(
    barbershopId: string, 
    config: {
      openTime?: string;
      closeTime?: string;
      lunchStart?: string;
      lunchEnd?: string;
      workingDays?: number[];
    } = {}  ): Promise<boolean> {
    return apiClient.post<boolean>(`/admin/barbershop/${barbershopId}/setup-default-schedule`, config);
  }
}

// ========================================
// SERVIÇO DE HORÁRIOS DE BARBEIROS
// ========================================

export class BarberScheduleApiService {
  /**
   * Criar novo horário de barbeiro
   */
  static async create(data: CreateBarberScheduleData): Promise<BarberSchedule> {
    return apiClient.post<BarberSchedule>('/barber-schedules', data);
  }

  /**
   * Buscar horários de barbeiros
   */
  static async getMany(filters?: ScheduleFilters): Promise<BarberSchedule[]> {
    const params = new URLSearchParams();
    
    if (filters?.barberId) params.append('barberId', filters.barberId);
    if (filters?.barbershopId) params.append('barbershopId', filters.barbershopId);
    if (filters?.dayOfWeek !== undefined) params.append('dayOfWeek', filters.dayOfWeek.toString());
    if (filters?.isWorking !== undefined) params.append('isWorking', filters.isWorking.toString());

    const query = params.toString();
    const endpoint = `/barber-schedules${query ? `?${query}` : ''}`;
    
    return apiClient.get<BarberSchedule[]>(endpoint);
  }

  /**
   * Buscar horário de barbeiro por ID
   */
  static async getById(id: string): Promise<BarberSchedule> {
    return apiClient.get<BarberSchedule>(`/barber-schedules/${id}`);
  }

  /**
   * Atualizar horário de barbeiro
   */
  static async update(id: string, data: UpdateBarberScheduleData): Promise<BarberSchedule> {
    return apiClient.put<BarberSchedule>(`/barber-schedules/${id}`, data);
  }

  /**
   * Remover horário de barbeiro
   */
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/barber-schedules/${id}`);
  }

  /**
   * Copiar horários globais para um barbeiro
   */  static async copyGlobalSchedule(barberId: string): Promise<boolean> {
    return apiClient.post<boolean>(`/admin/barber/${barberId}/copy-global-schedule`, {});
  }
}

// ========================================
// SERVIÇO DE EXCEÇÕES GLOBAIS
// ========================================

export class GlobalExceptionApiService {
  /**
   * Criar nova exceção global
   */
  static async create(data: CreateGlobalExceptionData): Promise<GlobalException> {
    return apiClient.post<GlobalException>('/global-exceptions', data);
  }

  /**
   * Buscar exceções globais por barbearia
   */
  static async getByBarbershop(
    barbershopId: string, 
    filters?: Omit<ExceptionFilters, 'barberId' | 'barbershopId'>
  ): Promise<GlobalException[]> {
    const params = new URLSearchParams();
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const endpoint = `/global-exceptions/barbershop/${barbershopId}${query ? `?${query}` : ''}`;
    
    return apiClient.get<GlobalException[]>(endpoint);
  }

  /**
   * Buscar exceção global por ID
   */
  static async getById(id: string): Promise<GlobalException> {
    return apiClient.get<GlobalException>(`/global-exceptions/${id}`);
  }

  /**
   * Atualizar exceção global
   */
  static async update(id: string, data: UpdateGlobalExceptionData): Promise<GlobalException> {
    return apiClient.put<GlobalException>(`/global-exceptions/${id}`, data);
  }

  /**
   * Remover exceção global
   */
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/global-exceptions/${id}`);
  }
}

// ========================================
// SERVIÇO DE EXCEÇÕES DE BARBEIROS
// ========================================

export class BarberExceptionApiService {
  /**
   * Criar nova exceção de barbeiro
   */
  static async create(data: CreateBarberExceptionData): Promise<BarberException> {
    return apiClient.post<BarberException>('/barber-exceptions', data);
  }

  /**
   * Buscar exceções de barbeiros
   */
  static async getMany(filters?: ExceptionFilters): Promise<BarberException[]> {
    const params = new URLSearchParams();
    
    if (filters?.barberId) params.append('barberId', filters.barberId);
    if (filters?.barbershopId) params.append('barbershopId', filters.barbershopId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const endpoint = `/barber-exceptions${query ? `?${query}` : ''}`;
    
    return apiClient.get<BarberException[]>(endpoint);
  }

  /**
   * Buscar exceção de barbeiro por ID
   */
  static async getById(id: string): Promise<BarberException> {
    return apiClient.get<BarberException>(`/barber-exceptions/${id}`);
  }

  /**
   * Atualizar exceção de barbeiro
   */
  static async update(id: string, data: UpdateBarberExceptionData): Promise<BarberException> {
    return apiClient.put<BarberException>(`/barber-exceptions/${id}`, data);
  }

  /**
   * Remover exceção de barbeiro
   */
  static async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/barber-exceptions/${id}`);
  }
}

// ========================================
// SERVIÇO DE DISPONIBILIDADE
// ========================================

export class AvailabilityApiService {
  /**
   * Buscar disponibilidade por barbearia e data
   */
  static async getByBarbershop(
    barbershopId: string,
    date: string,
    options?: {
      barberId?: string;
      serviceDuration?: number;
    }
  ): Promise<AvailabilityResponse> {
    const params = new URLSearchParams();
    
    if (options?.barberId) params.append('barberId', options.barberId);
    if (options?.serviceDuration) params.append('serviceDuration', options.serviceDuration.toString());

    const query = params.toString();
    const endpoint = `/availability/barbershop/${barbershopId}/date/${date}${query ? `?${query}` : ''}`;
    
    return apiClient.get<AvailabilityResponse>(endpoint);
  }

  /**
   * Buscar disponibilidade específica de um barbeiro
   */
  static async getByBarber(
    barberId: string,
    date: string,
    serviceDuration?: number
  ): Promise<AvailabilityResponse> {
    const params = new URLSearchParams();
    
    if (serviceDuration) params.append('serviceDuration', serviceDuration.toString());

    const query = params.toString();
    const endpoint = `/availability/barber/${barberId}/date/${date}${query ? `?${query}` : ''}`;
    
    return apiClient.get<AvailabilityResponse>(endpoint);
  }
}

// ========================================
// SERVIÇO UNIFICADO DE HORÁRIOS
// ========================================

export class ScheduleApiService {
  // Horários Globais
  static globalSchedule = GlobalScheduleApiService;
  
  // Horários de Barbeiros
  static barberSchedule = BarberScheduleApiService;
  
  // Exceções Globais
  static globalException = GlobalExceptionApiService;
  
  // Exceções de Barbeiros
  static barberException = BarberExceptionApiService;
  
  // Disponibilidade
  static availability = AvailabilityApiService;

  /**
   * Buscar todos os horários de uma barbearia (globais + individuais)
   */  static async getAllSchedules(barbershopId: string) {
    const [globalSchedules, barberSchedules] = await Promise.all([
      GlobalScheduleApiService.getByBarbershop(barbershopId),
      BarberScheduleApiService.getMany({ barbershopId }),
    ]);

    return {
      global: globalSchedules,
      barbers: barberSchedules,
    };
  }

  /**
   * Buscar todas as exceções de uma barbearia (globais + individuais)
   */  static async getAllExceptions(
    barbershopId: string, 
    filters?: { startDate?: string; endDate?: string }
  ) {
    const [globalExceptions, barberExceptions] = await Promise.all([
      GlobalExceptionApiService.getByBarbershop(barbershopId, filters),
      BarberExceptionApiService.getMany({ 
        barbershopId, 
        startDate: filters?.startDate,
        endDate: filters?.endDate 
      }),
    ]);

    return {
      global: globalExceptions,
      barbers: barberExceptions,
    };
  }
}

// Exportar instância singleton
export const scheduleApi = ScheduleApiService;
export default scheduleApi;