import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppointmentList } from '../components/appointments';
import { useAppointments } from '../hooks/useAppointments';

export const AppointmentsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [currentView, setCurrentView] = useState<'today' | 'week' | 'all'>('today');

  // Determinar filtros baseados no usuário e visualização
  const getFilters = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Domingo
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sábado

    switch (currentView) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        };
      case 'week':
        return {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
        };
      default:
        return {};
    }
  };

  // Determinar IDs baseados no role do usuário
  const getUserContext = () => {
    if (hasRole(['SUPER_ADMIN'])) {
      // Super admin vê todos os agendamentos
      return {};
    } else if (hasRole(['ADMIN']) && user?.barbershop?.id) {
      // Admin vê agendamentos da sua barbearia
      return { barbershopId: user.barbershop.id };
    } else if (hasRole(['BARBER']) && user?.barberProfile?.id) {
      // Barbeiro vê apenas seus agendamentos
      return { 
        barbershopId: user.barberProfile.barbershopId,
        barberId: user.barberProfile.id 
      };
    }
    return {};
  };

  const userContext = getUserContext();
  const filters = getFilters();

  // Hook para métricas rápidas
  const {
    dashboardMetrics,
    fetchDashboardMetrics,
    isLoadingMetrics
  } = useAppointments({
    ...userContext,
    autoLoad: false
  });

  // Carregar métricas na inicialização
  React.useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Configuração das visualizações
  const viewOptions = [
    { key: 'today', label: 'Hoje', icon: '📅' },
    { key: 'week', label: 'Esta Semana', icon: '📆' },
    { key: 'all', label: 'Todos', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
              <p className="mt-1 text-sm text-gray-500">
                {hasRole(['BARBER']) && 'Seus agendamentos'}
                {hasRole(['ADMIN']) && 'Agendamentos da barbearia'}
                {hasRole(['SUPER_ADMIN']) && 'Todos os agendamentos do sistema'}
              </p>
            </div>
            
            {/* Botão de voltar */}
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          </div>

          {/* Métricas rápidas */}
          {dashboardMetrics && !isLoadingMetrics && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">📅</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Hoje
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardMetrics.todayAppointments}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">💰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Receita Semanal
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          R$ {dashboardMetrics.weekRevenue.toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Clientes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardMetrics.totalClients}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Este Mês
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardMetrics.monthlyAppointments}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros de visualização */}
        <div className="mb-6">
          <div className="sm:hidden">
            <label htmlFor="view-select" className="sr-only">
              Selecionar visualização
            </label>
            <select
              id="view-select"
              name="view-select"
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {viewOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-8">
              {viewOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setCurrentView(option.key as any)}
                  className={`${
                    currentView === option.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Lista de agendamentos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <AppointmentList
              {...userContext}
              initialFilters={filters}
              title={`Agendamentos - ${viewOptions.find(v => v.key === currentView)?.label}`}
              showFilters={currentView === 'all'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
