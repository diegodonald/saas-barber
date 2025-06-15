// ========================================
// TIPOS PARA SISTEMA DE HORÁRIOS
// ========================================

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = domingo, 1 = segunda, etc.
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart?: string;
  lunchEnd?: string;
}

// ========================================
// HORÁRIOS GLOBAIS (BARBEARIA)
// ========================================

export interface GlobalSchedule {
  id: string;
  barbershopId: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart?: string;
  lunchEnd?: string;
  barbershop?: {
    id: string;
    name: string;
  };
}

export interface CreateGlobalScheduleData {
  barbershopId: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface UpdateGlobalScheduleData {
  isOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  lunchStart?: string;
  lunchEnd?: string;
}

// ========================================
// HORÁRIOS INDIVIDUAIS (BARBEIRO)
// ========================================

export interface BarberSchedule {
  id: string;
  barberId: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  barber?: {
    id: string;
    user: {
      name: string;
    };
  };
}

export interface CreateBarberScheduleData {
  barberId: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface UpdateBarberScheduleData {
  isWorking?: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

// ========================================
// EXCEÇÕES GLOBAIS
// ========================================

export interface GlobalException {
  id: string;
  barbershopId: string;
  date: string; // ISO date string
  type: ExceptionType;
  reason: string;
  specialOpenTime?: string;
  specialCloseTime?: string;
  barbershop?: {
    id: string;
    name: string;
  };
}

export interface CreateGlobalExceptionData {
  barbershopId: string;
  date: string;
  type: ExceptionType;
  reason: string;
  specialOpenTime?: string;
  specialCloseTime?: string;
}

export interface UpdateGlobalExceptionData {
  type?: ExceptionType;
  reason?: string;
  specialOpenTime?: string;
  specialCloseTime?: string;
}

// ========================================
// EXCEÇÕES INDIVIDUAIS (BARBEIRO)
// ========================================

export interface BarberException {
  id: string;
  barberId: string;
  date: string; // ISO date string
  type: ExceptionType;
  reason: string;
  specialStartTime?: string;
  specialEndTime?: string;
  barber?: {
    id: string;
    user: {
      name: string;
    };
  };
}

export interface CreateBarberExceptionData {
  barberId: string;
  date: string;
  type: ExceptionType;
  reason: string;
  specialStartTime?: string;
  specialEndTime?: string;
}

export interface UpdateBarberExceptionData {
  type?: ExceptionType;
  reason?: string;
  specialStartTime?: string;
  specialEndTime?: string;
}

// ========================================
// ENUMS E CONSTANTES
// ========================================

export enum ExceptionType {
  CLOSED = 'CLOSED',
  OFF = 'OFF',
  SPECIAL_HOURS = 'SPECIAL_HOURS',
  VACATION = 'VACATION',
  AVAILABLE = 'AVAILABLE'
}

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  [ExceptionType.CLOSED]: 'Fechado',
  [ExceptionType.OFF]: 'Folga',
  [ExceptionType.SPECIAL_HOURS]: 'Horário Especial',
  [ExceptionType.VACATION]: 'Férias',
  [ExceptionType.AVAILABLE]: 'Disponível'
};

export const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export const DAYS_OF_WEEK_SHORT = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb'
];

// ========================================
// TIPOS DE DISPONIBILIDADE
// ========================================

export interface BarberAvailability {
  barberId: string;
  barberName: string;
  date: string;
  availableSlots: TimeSlot[];
  isWorking: boolean;
  schedule?: BarberSchedule;
  exception?: BarberException;
  globalException?: GlobalException;
}

export interface AvailabilityRequest {
  barbershopId: string;
  barberId?: string; // se não informado, busca todos
  serviceId?: string; // duração do serviço para calcular slots
  date: string;
}

export interface AvailabilityResponse {
  date: string;
  barbershopId: string;
  barbers: BarberAvailability[];
  globalSchedule?: GlobalSchedule;
  globalException?: GlobalException;
}

// ========================================
// FILTROS E PAGINAÇÃO
// ========================================

export interface ScheduleFilters {
  barberId?: string;
  barbershopId?: string;
  dayOfWeek?: number;
  isWorking?: boolean;
  isOpen?: boolean;
}

export interface ExceptionFilters {
  barberId?: string;
  barbershopId?: string;
  date?: string;
  type?: ExceptionType;
  startDate?: string;
  endDate?: string;
}

export interface SchedulePaginationData {
  schedules: GlobalSchedule[] | BarberSchedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ExceptionPaginationData {
  exceptions: GlobalException[] | BarberException[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ========================================
// ESTATÍSTICAS
// ========================================

export interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  inactiveSchedules: number;
  workingDays: number;
  restDays: number;
  averageWorkingHours: number;
}

export interface ExceptionStats {
  totalExceptions: number;
  exceptionsByType: Record<ExceptionType, number>;
  upcomingExceptions: number;
  pastExceptions: number;
}

// ========================================
// PROPS DOS COMPONENTES
// ========================================

export interface ScheduleManagerProps {
  barbershopId: string;
  onScheduleChange?: (schedule: GlobalSchedule | BarberSchedule) => void;
  onExceptionChange?: (exception: GlobalException | BarberException) => void;
}

export interface ScheduleFormProps {
  schedule?: GlobalSchedule | BarberSchedule;
  isGlobal: boolean;
  barberId?: string;
  barbershopId: string;
  onSubmit: (data: CreateGlobalScheduleData | CreateBarberScheduleData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ExceptionFormProps {
  exception?: GlobalException | BarberException;
  isGlobal: boolean;
  barberId?: string;
  barbershopId: string;
  onSubmit: (data: CreateGlobalExceptionData | CreateBarberExceptionData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AvailabilityCalendarProps {
  barbershopId: string;
  barberId?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onSlotSelect?: (slot: TimeSlot) => void;
}

// ========================================
// VALIDAÇÃO E UTILIDADES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Função utilitária para validar horários
export const validateTimeSlot = (start: string, end: string): boolean => {
  const startTime = new Date(`2024-01-01T${start}:00`);
  const endTime = new Date(`2024-01-01T${end}:00`);
  return startTime < endTime;
};

// Função utilitária para converter minutos em string
export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Função utilitária para converter string em minutos
export const timeStringToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}; 