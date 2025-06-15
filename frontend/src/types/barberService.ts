/**
 * Tipos para o sistema de serviços por barbeiro
 * Mapeia as interfaces do backend para o frontend
 */

export interface BarberService {
  id: string;
  barberId: string;
  serviceId: string;
  customPrice?: number;
  effectivePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamentos populados
  barber?: {
    id: string;
    userId: string;
    barbershopId: string;
    specialties: string[];
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  
  service?: {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    category?: string;
    barbershopId: string;
  };
}

export interface CreateBarberServiceData {
  barberId: string;
  serviceId: string;
  customPrice?: number;
}

export interface UpdateBarberServiceData {
  customPrice?: number;
  isActive?: boolean;
}

export interface BarberServiceFilters {
  barberId?: string;
  serviceId?: string;
  isActive?: boolean;
  hasCustomPrice?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface BarberServiceStats {
  totalActive: number;
  totalInactive: number;
  averagePrice: number;
  customPriceCount: number;
  byBarber: Record<string, number>;
  byService: Record<string, number>;
}

export interface AvailableBarbersForService {
  serviceId: string;
  serviceName: string;
  availableBarbers: {
    barberId: string;
    barberName: string;
    effectivePrice: number;
    customPrice?: number;
    isAssigned: boolean;
  }[];
}

// Tipos para componentes
export interface BarberServiceManagerProps {
  barbershopId?: string;
  onServiceAssigned?: (barberService: BarberService) => void;
  onServiceUpdated?: (barberService: BarberService) => void;
  onServiceRemoved?: (barberServiceId: string) => void;
}

export interface ServiceBarberSelectorProps {
  serviceId: string;
  onBarberSelected?: (barberId: string, customPrice?: number) => void;
  onBarberRemoved?: (barberId: string) => void;
}

export interface BarberServiceCardProps {
  barberService: BarberService;
  onEdit?: (barberService: BarberService) => void;
  onToggleStatus?: (barberServiceId: string, newStatus: boolean) => void;
  onDelete?: (barberServiceId: string) => void;
  showActions?: boolean;
}

export interface BarberServiceFormProps {
  barberService?: BarberService;
  availableBarbers: Array<{
    id: string;
    name: string;
    specialties: string[];
  }>;
  availableServices: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
  }>;
  onSubmit: (data: CreateBarberServiceData) => void;
  onCancel: () => void;
  loading?: boolean;
} 