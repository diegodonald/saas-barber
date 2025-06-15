/**
 * Serviço de API para gerenciamento de serviços por barbeiro
 * Integra com os endpoints do backend BarberServiceController
 */

import {
  BarberService,
  CreateBarberServiceData,
  UpdateBarberServiceData,
  BarberServiceFilters,
  BarberServiceStats,
  AvailableBarbersForService
} from '../types/barberService';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  BARBER_SERVICES: '/api/barber-services',
  STATS: '/api/barber-services/stats',
  AVAILABLE: (serviceId: string) => `/api/barber-services/available/${serviceId}`,
  CHECK: (barberId: string, serviceId: string) => 
    `/api/barber-services/check/${barberId}/${serviceId}`,
  BY_BARBER: (barberId: string) => `/api/barber-services/barber/${barberId}`,
  BY_SERVICE: (serviceId: string) => `/api/barber-services/service/${serviceId}`,
  REACTIVATE: (id: string) => `/api/barber-services/${id}/reactivate`
} as const;

/**
 * Classe para gerenciar requisições da API de BarberService
 * Implementa padrão de service com tratamento de erros
 */
class BarberServiceApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Método auxiliar para fazer requisições HTTP
   * Inclui tratamento de erros e headers de autenticação
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Criar nova atribuição de serviço para barbeiro
   */
  async createBarberService(data: CreateBarberServiceData): Promise<BarberService> {
    return this.request<BarberService>(API_ENDPOINTS.BARBER_SERVICES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Listar atribuições com filtros e paginação
   */
  async getBarberServices(
    filters: BarberServiceFilters = {},
    page = 1,
    limit = 10
  ): Promise<{
    data: BarberService[];
    total: number;
    page: number;
    limit: number;
  }> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>),
    });

    return this.request<{
      data: BarberService[];
      total: number;
      page: number;
      limit: number;
    }>(`${API_ENDPOINTS.BARBER_SERVICES}?${searchParams}`);
  }

  /**
   * Buscar atribuição por ID
   */
  async getBarberServiceById(id: string): Promise<BarberService> {
    return this.request<BarberService>(`${API_ENDPOINTS.BARBER_SERVICES}/${id}`);
  }

  /**
   * Atualizar atribuição existente
   */
  async updateBarberService(
    id: string,
    data: UpdateBarberServiceData
  ): Promise<BarberService> {
    return this.request<BarberService>(`${API_ENDPOINTS.BARBER_SERVICES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Remover/desativar atribuição
   */
  async deleteBarberService(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `${API_ENDPOINTS.BARBER_SERVICES}/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Reativar atribuição desativada
   */
  async reactivateBarberService(id: string): Promise<BarberService> {
    return this.request<BarberService>(API_ENDPOINTS.REACTIVATE(id), {
      method: 'PATCH',
    });
  }

  /**
   * Obter estatísticas das atribuições
   */
  async getStats(): Promise<BarberServiceStats> {
    return this.request<BarberServiceStats>(API_ENDPOINTS.STATS);
  }

  /**
   * Listar barbeiros disponíveis para um serviço
   */
  async getAvailableBarbersForService(serviceId: string): Promise<AvailableBarbersForService> {
    return this.request<AvailableBarbersForService>(API_ENDPOINTS.AVAILABLE(serviceId));
  }

  /**
   * Verificar se barbeiro pode executar serviço
   */
  async checkBarberCapability(
    barberId: string,
    serviceId: string
  ): Promise<{
    canExecute: boolean;
    effectivePrice: number;
    customPrice?: number;
    message?: string;
  }> {
    return this.request<{
      canExecute: boolean;
      effectivePrice: number;
      customPrice?: number;
      message?: string;
    }>(API_ENDPOINTS.CHECK(barberId, serviceId));
  }

  /**
   * Listar serviços de um barbeiro específico
   */
  async getServicesByBarber(barberId: string): Promise<BarberService[]> {
    return this.request<BarberService[]>(API_ENDPOINTS.BY_BARBER(barberId));
  }

  /**
   * Listar barbeiros que executam um serviço específico
   */
  async getBarbersByService(serviceId: string): Promise<BarberService[]> {
    return this.request<BarberService[]>(API_ENDPOINTS.BY_SERVICE(serviceId));
  }
}

// Instância singleton para uso em toda a aplicação
export const barberServiceApi = new BarberServiceApi();

// Export individual das funções para uso direto
export const {
  createBarberService,
  getBarberServices,
  getBarberServiceById,
  updateBarberService,
  deleteBarberService,
  reactivateBarberService,
  getStats,
  getAvailableBarbersForService,
  checkBarberCapability,
  getServicesByBarber,
  getBarbersByService
} = barberServiceApi; 