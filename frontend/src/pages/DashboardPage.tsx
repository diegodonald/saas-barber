import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarberServiceManager } from '../components/barber-services/BarberServiceManager';
import { ScheduleManager } from '../components/schedule';
import { getDashboardMetrics, DashboardMetrics } from '../services/appointmentApi';

// Ícones modernos
const CalendarIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-2m0 0V9m0 2h.01" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ScissorsIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export const DashboardPage: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const [showBarberServices, setShowBarberServices] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Estado para métricas do dashboard
  const [dashboardStats, setDashboardStats] = useState<DashboardMetrics>({
    todayAppointments: 0,
    weekRevenue: 0,
    totalClients: 0,
    monthlyAppointments: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Carregar métricas do dashboard
  useEffect(() => {
    const loadDashboardMetrics = async () => {
      // Só carregar métricas para roles que têm acesso
      if (!hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN'])) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        setStatsError(null);
        const metrics = await getDashboardMetrics();
        setDashboardStats(metrics);
      } catch (error) {
        console.error('Erro ao carregar métricas do dashboard:', error);
        setStatsError('Erro ao carregar estatísticas');
        // Manter valores padrão em caso de erro
      } finally {
        setLoadingStats(false);
      }
    };

    loadDashboardMetrics();
  }, [hasRole]);

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'SUPER_ADMIN': 'Super Administrador',
      'ADMIN': 'Administrador',
      'BARBER': 'Barbeiro',
      'CLIENT': 'Cliente'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
      'ADMIN': 'bg-red-100 text-red-800 border-red-200',
      'BARBER': 'bg-blue-100 text-blue-800 border-blue-200',
      'CLIENT': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[role as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Menu de navegação baseado no role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', name: 'Dashboard', icon: CalendarIcon }
    ];

    if (hasRole('CLIENT')) {
      return [
        ...baseItems,
        { id: 'appointments', name: 'Meus Agendamentos', icon: ClockIcon },
        { id: 'services', name: 'Serviços', icon: ScissorsIcon }
      ];
    }

    if (hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN'])) {
      return [
        ...baseItems,
        { id: 'schedule', name: 'Horários', icon: ClockIcon },
        { id: 'services', name: 'Serviços', icon: ScissorsIcon },
        { id: 'appointments', name: 'Agendamentos', icon: CalendarIcon },
        { id: 'clients', name: 'Clientes', icon: UsersIcon },
        ...(hasRole(['ADMIN', 'SUPER_ADMIN']) ? [
          { id: 'settings', name: 'Configurações', icon: SettingsIcon }
        ] : [])
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const renderDashboardContent = () => {
    if (currentView === 'schedule') {
      return <div data-testid="schedule-manager"><ScheduleManager onClose={() => setCurrentView('dashboard')} /></div>;
    }

    if (currentView === 'services') {
      return <div data-testid="barber-service-manager"><BarberServiceManager /></div>;
    }

    // Dashboard principal
    return (
      <div className="space-y-6">
        {/* Estatísticas principais */}
        {hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) && (
          <>
            {statsError && (
              <div data-testid="stats-error-banner" className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro ao carregar estatísticas
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{statsError}. As estatísticas serão atualizadas automaticamente quando a conexão for restabelecida.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div data-testid="dashboard-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card de Agendamentos Hoje */}
              <div data-testid="metric-today-appointments" className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CalendarIcon />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Agendamentos Hoje
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {loadingStats ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                          ) : statsError ? (
                            <span className="text-red-500 text-sm">Erro</span>
                          ) : (
                            dashboardStats.todayAppointments
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Receita da Semana */}
              <div data-testid="metric-week-revenue" className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CurrencyIcon />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Receita da Semana
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {loadingStats ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                          ) : statsError ? (
                            <span className="text-red-500 text-sm">Erro</span>
                          ) : (
                            `R$ ${dashboardStats.weekRevenue.toLocaleString()}`
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Total de Clientes */}
              <div data-testid="metric-total-clients" className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <UsersIcon />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total de Clientes
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {loadingStats ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                          ) : statsError ? (
                            <span className="text-red-500 text-sm">Erro</span>
                          ) : (
                            dashboardStats.totalClients
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Agendamentos do Mês */}
              <div data-testid="metric-monthly-appointments" className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ClockIcon />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Agendamentos do Mês
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {loadingStats ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                          ) : statsError ? (
                            <span className="text-red-500 text-sm">Erro</span>
                          ) : (
                            dashboardStats.monthlyAppointments
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
          <div className="px-6 py-8 sm:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-1">
                <h2 className="text-2xl font-bold text-white">
                  Bem-vindo, {user?.name}! 👋
                </h2>
                <p className="mt-2 text-blue-100">
                  {hasRole('CLIENT') 
                    ? 'Pronto para agendar seu próximo corte?'
                    : 'Aqui está um resumo do seu dia.'
                  }
                </p>
              </div>
              <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role || '')} bg-white`}>
                  {getRoleDisplayName(user?.role || '')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Ações Rápidas
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hasRole('CLIENT') && (
                <button className="relative group bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <CalendarIcon />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Agendar Serviço
                      </h4>
                      <p className="text-sm text-gray-600">
                        Novo agendamento
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) && (
                <>
                  <button 
                    onClick={() => setCurrentView('schedule')}
                    className="relative group bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
                          <ClockIcon />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Gerenciar Horários
                        </h4>
                        <p className="text-sm text-gray-600">
                          Configurar disponibilidade
                        </p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCurrentView('services')}
                    className="relative group bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-purple-200 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                          <ScissorsIcon />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Serviços
                        </h4>
                        <p className="text-sm text-gray-600">
                          Configurar serviços
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="relative group bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:from-orange-100 hover:to-orange-200 transition-all duration-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                          <CalendarIcon />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Agendamentos
                        </h4>
                        <p className="text-sm text-gray-600">
                          Ver agenda do dia
                        </p>
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informações do usuário */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Informações da Conta
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nome Completo</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user?.name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user?.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{user?.phone || 'Não informado'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">ID do Usuário</dt>
                <dd className="mt-1 text-sm font-mono text-gray-600">{user?.id}</dd>
              </div>
              
                              <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de Conta</dt>
                  <dd className="mt-1">
                    <span data-testid="user-role-badge" className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role || '')}`}>
                      {getRoleDisplayName(user?.role || '')}
                    </span>
                  </dd>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div data-testid={sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"} className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 flex-shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900">SaaS Barber</h1>
            )}
            <button
              data-testid="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navegação */}
          <nav data-testid="navigation-menu" className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  data-testid={`nav-${item.id}`}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogoutIcon />
              {!sidebarCollapsed && (
                <span className="ml-3">Sair</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentView === 'dashboard' ? 'Dashboard' : 
                   currentView === 'schedule' ? 'Gerenciamento de Horários' :
                   currentView === 'services' ? 'Serviços por Barbeiro' :
                   currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role || '')}</p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-auto p-6">
          {renderDashboardContent()}
        </main>
      </div>

      {/* Modais */}
      {showBarberServices && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Serviços por Barbeiro</h3>
              <button
                onClick={() => setShowBarberServices(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BarberServiceManager />
          </div>
        </div>
      )}

      {showScheduleManager && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Gerenciamento de Horários</h3>
              <button
                onClick={() => setShowScheduleManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ScheduleManager onClose={() => setShowScheduleManager(false)} />
          </div>
        </div>
      )}
    </div>
  );
}; 