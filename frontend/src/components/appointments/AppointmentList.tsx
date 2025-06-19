import React, { useState, useEffect } from 'react';
import { AppointmentCard } from './AppointmentCard';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../contexts/AuthContext';
import { AppointmentFilters, AppointmentStatus } from '../../types/appointment';

interface AppointmentListProps {
  barbershopId?: string;
  barberId?: string;
  clientId?: string;
  initialFilters?: AppointmentFilters;
  showFilters?: boolean;
  title?: string;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  barbershopId,
  barberId,
  clientId,
  initialFilters = {},
  showFilters = true,
  title = 'Agendamentos'
}) => {
  const { user, hasRole } = useAuth();
  const [filters, setFilters] = useState<AppointmentFilters>({
    ...initialFilters,
    barbershopId,
    barberId,
    clientId,
  });

  const {
    appointments,
    isLoading,
    error,
    total,
    fetchAppointments,
    cancelAppointment,
    confirmAppointment,
    startService,
    completeAppointment,
    markNoShow,
  } = useAppointments({
    barbershopId,
    barberId,
    clientId,
    autoLoad: true,
  });

  // Recarregar quando filtros mudarem
  useEffect(() => {
    fetchAppointments(filters);
  }, [filters, fetchAppointments]);

  // Handlers para ações
  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      // Lista será atualizada automaticamente pelo hook
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmAppointment(id);
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startService(id);
    } catch (error) {
      console.error('Erro ao iniciar serviço:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeAppointment(id);
    } catch (error) {
      console.error('Erro ao concluir agendamento:', error);
    }
  };

  const handleMarkNoShow = async (id: string) => {
    try {
      await markNoShow(id);
    } catch (error) {
      console.error('Erro ao marcar como não compareceu:', error);
    }
  };

  // Handler para mudança de filtros
  const handleFilterChange = (newFilters: Partial<AppointmentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Filtros rápidos
  const quickFilters = [
    { label: 'Todos', status: undefined },
    { label: 'Agendados', status: AppointmentStatus.SCHEDULED },
    { label: 'Confirmados', status: AppointmentStatus.CONFIRMED },
    { label: 'Em Andamento', status: AppointmentStatus.IN_PROGRESS },
    { label: 'Concluídos', status: AppointmentStatus.COMPLETED },
    { label: 'Cancelados', status: AppointmentStatus.CANCELLED },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar agendamentos</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => fetchAppointments(filters)}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-500">
          {total > 0 && `${appointments.length} de ${total} agendamentos`}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            {/* Filtros rápidos por status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => handleFilterChange({ status: filter.status })}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      filters.status === filter.status
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros de data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data inicial
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data final
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Botão para limpar filtros */}
            <div className="flex justify-end">
              <button
                onClick={() => setFilters({ barbershopId, barberId, clientId })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Lista de agendamentos */}
      {!isLoading && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.keys(filters).length > 3 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Não há agendamentos para exibir no momento.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onCancel={hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) || user?.id === appointment.clientId ? handleCancel : undefined}
                  onConfirm={hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) ? handleConfirm : undefined}
                  onStart={hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) ? handleStart : undefined}
                  onComplete={hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) ? handleComplete : undefined}
                  onMarkNoShow={hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) ? handleMarkNoShow : undefined}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
