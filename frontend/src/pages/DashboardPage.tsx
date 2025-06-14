import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

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
      'SUPER_ADMIN': 'bg-purple-100 text-purple-800',
      'ADMIN': 'bg-red-100 text-red-800',
      'BARBER': 'bg-blue-100 text-blue-800',
      'CLIENT': 'bg-green-100 text-green-800'
    };
    return colorMap[role as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  SaaS Barber
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Olá, {user?.name}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                  {getRoleDisplayName(user?.role || '')}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Bem-vindo ao Dashboard!
              </h2>
              <p className="text-sm text-gray-600">
                Sistema de gerenciamento para barbearias, salões de beleza e estúdios de tatuagem.
              </p>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informações do Usuário
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user?.phone || 'Não informado'}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de Usuário</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                      {getRoleDisplayName(user?.role || '')}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID do Usuário</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{user?.id}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Ação para Clientes */}
                {hasRole('CLIENT') && (
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-2m0 0V9m0 2h.01" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Agendar Serviço
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Agende um horário com seu barbeiro favorito
                      </p>
                    </div>
                  </div>
                )}

                {/* Ação para Barbeiros */}
                {hasRole(['BARBER', 'ADMIN', 'SUPER_ADMIN']) && (
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Gerenciar Agenda
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Visualize e gerencie seus agendamentos
                      </p>
                    </div>
                  </div>
                )}

                {/* Ação para Admins */}
                {hasRole(['ADMIN', 'SUPER_ADMIN']) && (
                  <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Gerenciar Usuários
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Administre usuários e permissões
                      </p>
                    </div>
                  </div>
                )}

                {/* Perfil do Usuário */}
                <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Editar Perfil
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Atualize suas informações pessoais
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Sistema em Desenvolvimento
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Este é o dashboard básico da Phase 3. Funcionalidades completas serão implementadas nas próximas fases:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Sistema de agendamento</li>
                    <li>Gestão de serviços</li>
                    <li>Relatórios e analytics</li>
                    <li>Configurações avançadas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 