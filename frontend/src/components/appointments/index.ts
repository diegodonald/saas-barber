// Exports dos componentes de agendamento
export { AppointmentCard } from './AppointmentCard';
export { AppointmentList } from './AppointmentList';
export { AppointmentForm } from './AppointmentForm';

// Re-export dos tipos para conveniência
export type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentFilters,
  AppointmentStatus,
  AppointmentListResponse,
  AppointmentStats,
  DashboardMetrics,
  CancelAppointmentData,
  AvailableSlot,
  AvailableSlotsParams,
} from '../../types/appointment';
