import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  redirectTo?: string;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * 
 * @param children - Componentes filhos a serem renderizados se autorizado
 * @param requiredRoles - Roles necessários para acessar a rota
 * @param redirectTo - Rota para redirecionamento se não autorizado
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Verificar roles se especificados
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Renderizar componentes filhos se autorizado
  return <>{children}</>;
};

/**
 * Componente para rotas que só devem ser acessadas por usuários não autenticados
 * (ex: login, registro)
 */
interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo = '/dashboard'
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecionar para dashboard se já autenticado
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Renderizar componentes filhos se não autenticado
  return <>{children}</>;
}; 