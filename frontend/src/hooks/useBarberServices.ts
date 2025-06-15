/**
 * Hook customizado para gerenciamento de serviços por barbeiro
 * Encapsula estado, carregamento e operações CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarberService,
  CreateBarberServiceData,
  UpdateBarberServiceData,
  BarberServiceFilters,
  BarberServiceStats
} from '../types/barberService';
import { barberServiceApi } from '../services/barberServiceApi';

interface UseBarberServicesOptions {
  autoLoad?: boolean;
  initialFilters?: BarberServiceFilters;
  pageSize?: number;
}

interface UseBarberServicesReturn {
  // Estado
  barberServices: BarberService[];
  loading: boolean;
  error: string | null;
  stats: BarberServiceStats | null;
  
  // Paginação
  currentPage: number;
  totalPages: number;
  totalItems: number;
  
  // Filtros
  filters: BarberServiceFilters;
  
  // Operações CRUD
  create: (data: CreateBarberServiceData) => Promise<BarberService | null>;
  update: (id: string, data: UpdateBarberServiceData) => Promise<BarberService | null>;
  remove: (id: string) => Promise<boolean>;
  reactivate: (id: string) => Promise<BarberService | null>;
  
  // Utilitários
  loadBarberServices: (page?: number) => Promise<void>;
  loadStats: () => Promise<void>;
  setFilters: (newFilters: Partial<BarberServiceFilters>) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  
  // Estados específicos
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Hook principal para gerenciamento de serviços por barbeiro
 */
export const useBarberServices = (
  options: UseBarberServicesOptions = {}
): UseBarberServicesReturn => {
  const {
    autoLoad = true,
    initialFilters = {},
    pageSize = 10
  } = options;

  // Estados principais
  const [barberServices, setBarberServices] = useState<BarberService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BarberServiceStats | null>(null);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estados de filtros
  const [filters, setFiltersState] = useState<BarberServiceFilters>(initialFilters);
  
  // Estados de operações específicas
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Carrega lista de serviços por barbeiro com filtros e paginação
   */
  const loadBarberServices = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await barberServiceApi.getBarberServices(
        filters,
        page,
        pageSize
      );
      
      setBarberServices(response.data);
      setCurrentPage(response.page);
      setTotalPages(Math.ceil(response.total / response.limit));
      setTotalItems(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar serviços';
      setError(errorMessage);
      console.error('Erro ao carregar barber services:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await barberServiceApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  /**
   * Cria nova atribuição de serviço para barbeiro
   */
  const create = useCallback(async (data: CreateBarberServiceData): Promise<BarberService | null> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const newBarberService = await barberServiceApi.createBarberService(data);
      
      // Adiciona o novo item à lista local
      setBarberServices(prev => [newBarberService, ...prev]);
      
      // Recarrega estatísticas
      loadStats();
      
      return newBarberService;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar atribuição';
      setError(errorMessage);
      console.error('Erro ao criar barber service:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [loadStats]);

  /**
   * Atualiza atribuição existente
   */
  const update = useCallback(async (
    id: string,
    data: UpdateBarberServiceData
  ): Promise<BarberService | null> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const updatedBarberService = await barberServiceApi.updateBarberService(id, data);
      
      // Atualiza o item na lista local
      setBarberServices(prev =>
        prev.map(item =>
          item.id === id ? updatedBarberService : item
        )
      );
      
      // Recarrega estatísticas
      loadStats();
      
      return updatedBarberService;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar atribuição';
      setError(errorMessage);
      console.error('Erro ao atualizar barber service:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [loadStats]);

  /**
   * Remove/desativa atribuição
   */
  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await barberServiceApi.deleteBarberService(id);
      
      // Remove o item da lista local ou marca como inativo
      setBarberServices(prev =>
        prev.map(item =>
          item.id === id ? { ...item, isActive: false } : item
        )
      );
      
      // Recarrega estatísticas
      loadStats();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover atribuição';
      setError(errorMessage);
      console.error('Erro ao remover barber service:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [loadStats]);

  /**
   * Reativa atribuição desativada
   */
  const reactivate = useCallback(async (id: string): Promise<BarberService | null> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const reactivatedBarberService = await barberServiceApi.reactivateBarberService(id);
      
      // Atualiza o item na lista local
      setBarberServices(prev =>
        prev.map(item =>
          item.id === id ? reactivatedBarberService : item
        )
      );
      
      // Recarrega estatísticas
      loadStats();
      
      return reactivatedBarberService;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reativar atribuição';
      setError(errorMessage);
      console.error('Erro ao reativar barber service:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [loadStats]);

  /**
   * Atualiza filtros
   */
  const setFilters = useCallback((newFilters: Partial<BarberServiceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset para primeira página
  }, []);

  /**
   * Limpa todos os filtros
   */
  const clearFilters = useCallback(() => {
    setFiltersState({});
    setCurrentPage(1);
  }, []);

  /**
   * Recarrega dados completos
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadBarberServices(currentPage),
      loadStats()
    ]);
  }, [loadBarberServices, loadStats, currentPage]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (autoLoad) {
      loadBarberServices(1);
    }
  }, [autoLoad, loadBarberServices]);

  // Efeito para recarregar quando filtros mudam
  useEffect(() => {
    if (autoLoad) {
      loadBarberServices(1);
    }
  }, [filters, autoLoad, loadBarberServices]);

  // Efeito para carregar estatísticas iniciais
  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]);

  return {
    // Estado
    barberServices,
    loading,
    error,
    stats,
    
    // Paginação
    currentPage,
    totalPages,
    totalItems,
    
    // Filtros
    filters,
    
    // Operações CRUD
    create,
    update,
    remove,
    reactivate,
    
    // Utilitários
    loadBarberServices,
    loadStats,
    setFilters,
    clearFilters,
    refresh,
    
    // Estados específicos
    isCreating,
    isUpdating,
    isDeleting
  };
}; 