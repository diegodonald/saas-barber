import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipos para o sistema de autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'BARBER' | 'CLIENT';
  phone?: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'CLIENT' | 'BARBER';
}

interface AuthContextType {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Ações
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  
  // Utilitários
  hasRole: (role: string | string[]) => boolean;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Utilitário para fazer requisições autenticadas
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Se token expirou, tenta renovar automaticamente
    if (response.status === 401 && token) {
      const refreshSuccess = await refreshToken();
      if (refreshSuccess) {
        // Retry da requisição original com novo token
        const newToken = localStorage.getItem('accessToken');
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return fetch(`${API_BASE_URL}${endpoint}`, config);
      }
    }

    return response;
  };

  // Função de login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      // Salvar tokens no localStorage
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Definir usuário no estado
      setUser(data.data.user);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro no registro');
      }

      // Salvar tokens no localStorage
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      
      // Definir usuário no estado
      setUser(result.data.user);
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  // Função para renovar token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        logout(); // Remove tokens inválidos
        return false;
      }

      // Atualizar tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
      return false;
    }
  };

  // Verificar se usuário tem determinado role
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  // Obter token atual
  const getToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Verificar se o token é válido obtendo dados do usuário
        const response = await apiRequest('/api/auth/me');
        const data = await response.json();

        if (response.ok) {
          setUser(data.data.user);
        } else {
          // Token inválido, tentar renovar
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Tentar novamente obter dados do usuário
            const retryResponse = await apiRequest('/api/auth/me');
            const retryData = await retryResponse.json();
            
            if (retryResponse.ok) {
              setUser(retryData.data.user);
            } else {
              logout();
            }
          } else {
            logout();
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Configurar renovação automática de token
  useEffect(() => {
    if (!user) return;

    // Renovar token a cada 14 minutos (token expira em 15 minutos)
    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    hasRole,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 