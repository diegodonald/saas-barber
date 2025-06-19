import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, AppointmentStatus } from '../../types/appointment';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentCardProps {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onMarkNoShow?: (id: string) => void;
  isLoading?: boolean;
}

// Configuração de cores por status
const statusConfig = {
  [AppointmentStatus.SCHEDULED]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    label: 'Agendado'
  },
  [AppointmentStatus.CONFIRMED]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
    label: 'Confirmado'
  },
  [AppointmentStatus.IN_PROGRESS]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Em Andamento'
  },
  [AppointmentStatus.COMPLETED]: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    badge: 'bg-gray-100 text-gray-800',
    label: 'Concluído'
  },
  [AppointmentStatus.CANCELLED]: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    label: 'Cancelado'
  },
  [AppointmentStatus.NO_SHOW]: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-100 text-orange-800',
    label: 'Não Compareceu'
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onCancel,
  onConfirm,
  onStart,
  onComplete,
  onMarkNoShow,
  isLoading = false
}) => {
  const { user, hasRole } = useAuth();
  const config = statusConfig[appointment.status];

  // Formatação de data e hora
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd 'de' MMMM", { locale: ptBR });
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), 'HH:mm', { locale: ptBR });
  };

  // Verificar se pode realizar ações
  const canCancel = appointment.status === AppointmentStatus.SCHEDULED || 
                   appointment.status === AppointmentStatus.CONFIRMED;
  const canConfirm = appointment.status === AppointmentStatus.SCHEDULED;
  const canStart = appointment.status === AppointmentStatus.CONFIRMED;
  const canComplete = appointment.status === AppointmentStatus.IN_PROGRESS;
  const canMarkNoShow = appointment.status === AppointmentStatus.CONFIRMED || 
                       appointment.status === AppointmentStatus.SCHEDULED;

  // Verificar permissões baseadas no role
  const isBarberOrAdmin = hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']);
  const isClient = hasRole(['CLIENT']);
  const isOwner = user?.id === appointment.clientId;

  return (
    <div className={`rounded-lg border-2 ${config.border} ${config.bg} p-6 transition-all duration-200 hover:shadow-md`}>
      {/* Header com status */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
          {config.label}
        </span>
        <div className="text-sm text-gray-500">
          #{appointment.id.slice(-8)}
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-3">
        {/* Data e hora */}
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(appointment.startTime)} às {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </span>
        </div>

        {/* Cliente (para barbeiros/admins) */}
        {isBarberOrAdmin && appointment.client && (
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm text-gray-700">
              {appointment.client.name}
              {appointment.client.phone && (
                <span className="text-gray-500 ml-1">• {appointment.client.phone}</span>
              )}
            </span>
          </div>
        )}

        {/* Barbeiro (para clientes) */}
        {isClient && appointment.barber && (
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5H9m0-5a1.5 1.5 0 011.5-1.5H12" />
            </svg>
            <span className="text-sm text-gray-700">
              {appointment.barber.user.name}
            </span>
          </div>
        )}

        {/* Serviço */}
        {appointment.service && (
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">{appointment.service.name}</span>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{appointment.service.duration} min</span>
                <span>•</span>
                <span className="font-medium text-green-600">
                  R$ {appointment.totalPrice.toString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {appointment.notes && (
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-sm text-gray-600">{appointment.notes}</span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="mt-6 flex flex-wrap gap-2">
        {/* Ações para barbeiros/admins */}
        {isBarberOrAdmin && (
          <>
            {canConfirm && onConfirm && (
              <button
                onClick={() => onConfirm(appointment.id)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Confirmar
              </button>
            )}
            
            {canStart && onStart && (
              <button
                onClick={() => onStart(appointment.id)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                Iniciar
              </button>
            )}
            
            {canComplete && onComplete && (
              <button
                onClick={() => onComplete(appointment.id)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Concluir
              </button>
            )}
            
            {canMarkNoShow && onMarkNoShow && (
              <button
                onClick={() => onMarkNoShow(appointment.id)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Não Compareceu
              </button>
            )}
          </>
        )}

        {/* Ação de cancelar (para todos os usuários autorizados) */}
        {canCancel && onCancel && (isOwner || isBarberOrAdmin) && (
          <button
            onClick={() => onCancel(appointment.id)}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
