import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Acesso Negado
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          Você não tem permissão para acessar esta página
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Informações da Conta
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Usuário:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Tipo:</strong> {user?.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Se você acredita que deveria ter acesso a esta página, 
                entre em contato com o administrador do sistema.
              </p>

              <div className="flex flex-col space-y-3">
                <Link
                  to="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar ao Dashboard
                </Link>
                
                <button
                  onClick={logout}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Fazer Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 