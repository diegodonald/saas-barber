/**
 * Tipos para o sistema de agendamentos
 */

// Enum de status de agendamento (deve corresponder ao backend)
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

// Interface base para agendamento
export interface Appointment {
  id: string;
  barbershopId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relacionamentos
  barber?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    barbershopId: string;
  };
  
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  service?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    category?: string;
  };
  
  barbershop?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

// Interface para criar agendamento
export interface CreateAppointmentData {
  barbershopId: string;
  barberId: string;
  serviceId: string;
  startTime: string; // ISO string
  notes?: string;
  clientId?: string; // Opcional quando CLIENT cria seu próprio agendamento
}

// Interface para atualizar agendamento
export interface UpdateAppointmentData {
  startTime?: string; // ISO string
  status?: AppointmentStatus;
  notes?: string;
}

// Interface para filtros de agendamento
export interface AppointmentFilters {
  barbershopId?: string;
  barberId?: string;
  clientId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  skip?: number;
  take?: number;
  orderBy?: 'startTime' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

// Interface para horários disponíveis
export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// Interface para parâmetros de busca de horários disponíveis
export interface AvailableSlotsParams {
  barberId: string;
  barbershopId: string;
  date: string; // ISO string
  serviceDuration?: number;
}

// Interface para resposta de listagem de agendamentos
export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  hasMore: boolean;
}

// Interface para estatísticas de agendamentos
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

// Interface para métricas do dashboard
export interface DashboardMetrics {
  todayAppointments: number;
  weekRevenue: number;
  totalClients: number;
  monthlyAppointments: number;
}

// Interface para cancelamento de agendamento
export interface CancelAppointmentData {
  reason?: string;
}

// Interface para completar agendamento
export interface CompleteAppointmentData {
  notes?: string;
} 