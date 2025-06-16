import { 
  BarberSchedule, 
  BarberAvailability, 
  AvailabilityResponse, 
  GlobalException, 
  BarberException,
  GlobalSchedule
} from './schedule';

// Extensão temporária para o tipo BarberSchedule
export interface BarberScheduleExtended extends Omit<BarberSchedule, 'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd' | 'isOpen'> {
  openTime: number | string;
  closeTime: number | string;
  lunchStart?: number | string;
  lunchEnd?: number | string;
  isOpen: boolean;
}

// Extensão temporária para o tipo BarberAvailability
export interface BarberAvailabilityExtended extends Omit<BarberAvailability, 'isAvailable' | 'schedule'> {
  isAvailable: boolean;
  reason?: string;
  schedule?: BarberScheduleExtended;
  barberName: string;
  barberId: string;
}

// Extensão temporária para o tipo AvailabilityResponse
export interface AvailabilityResponseExtended extends Omit<AvailabilityResponse, 'isAvailable' | 'globalSchedule' | 'availableBarbers'> {
  isAvailable: boolean;
  reason?: string;
  availableBarbers?: BarberAvailabilityExtended[];
  activeExceptions?: any[];
  globalSchedule?: {
    id: string;
    barbershopId: string;
    dayOfWeek: number;
    isOpen: boolean;
    openTime: number | string;
    closeTime: number | string;
    lunchStart?: number | string;
    lunchEnd?: number | string;
  };
}

// Extensão temporária para GlobalException e BarberException
export interface GlobalExceptionExtended extends Omit<GlobalException, 'reason'> {
  description?: string;
  openTime?: number | string;
  closeTime?: number | string;
  reason: string;
}

export interface BarberExceptionExtended extends Omit<BarberException, 'reason'> {
  description?: string;
  openTime?: number | string;
  closeTime?: number | string;
  reason: string;
}

export type ExceptionExtended = GlobalExceptionExtended | BarberExceptionExtended;

// Extensão temporária para o tipo GlobalSchedule
export interface GlobalScheduleExtended extends Omit<GlobalSchedule, 'isOpen' | 'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd'> {
  isOpen: boolean;
  openTime: number | string;
  closeTime: number | string;
  lunchStart?: number | string;
  lunchEnd?: number | string;
}

export type ScheduleExtended = GlobalScheduleExtended | BarberScheduleExtended;
