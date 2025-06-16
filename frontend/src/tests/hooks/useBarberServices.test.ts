/**
 * Testes unitários para o hook useBarberServices
 * Testa operações CRUD, estado e integração com API
 */

import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { useBarberServices } from '../../hooks/useBarberServices';
import { barberServiceApi } from '../../services/barberServiceApi';

// Mock da API
vi.mock('../../services/barberServiceApi', () => ({
  barberServiceApi: {
    getBarberServices: vi.fn(),
    createBarberService: vi.fn(),
    updateBarberService: vi.fn(),
    deleteBarberService: vi.fn(),
    reactivateBarberService: vi.fn(),
    getStats: vi.fn()
  }
}));

// Dados de teste
const mockBarberService = {
  id: '1',
  barberId: 'barber-1',
  serviceId: 'service-1',
  customPrice: 50.00,
  effectivePrice: 50.00,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  barber: {
    id: 'barber-1',
    userId: 'user-1',
    barbershopId: 'barbershop-1',
    specialties: ['corte', 'barba'],
    user: {
      id: 'user-1',
      name: 'João Barbeiro',
      email: 'joao@test.com',
      phone: '11999999999'
    }
  },
  service: {
    id: 'service-1',
    name: 'Corte Simples',
    description: 'Corte de cabelo básico',
    duration: 30,
    price: 40.00,
    category: 'Cabelo',
    barbershopId: 'barbershop-1'
  }
};

const mockStats = {
  totalActive: 10,
  totalInactive: 2,
  averagePrice: 45.50,
  customPriceCount: 3,
  byBarber: { 'barber-1': 5 },
  byService: { 'service-1': 3 }
};

const mockApiResponse = {
  data: [mockBarberService],
  total: 1,
  page: 1,
  limit: 10
};

describe('useBarberServices Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Inicialização e carregamento', () => {
    test('deve inicializar com valores padrão', () => {
      // Arrange: Mock da API retorna dados vazios
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10
      });

      // Act: Renderizar o hook
      const { result } = renderHook(() => useBarberServices({ autoLoad: false }));

      // Assert: Verificar estado inicial
      expect(result.current.barberServices).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.totalItems).toBe(0);
    });

    test('deve carregar dados automaticamente quando autoLoad é true', async () => {
      // Arrange: Mock da API
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);
      vi.mocked(barberServiceApi.getStats).mockResolvedValue(mockStats);

      // Act: Renderizar hook com autoLoad
      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Assert: Verificar que a API foi chamada
      await waitFor(() => {
        expect(barberServiceApi.getBarberServices).toHaveBeenCalledWith({}, 1, 10);
        expect(barberServiceApi.getStats).toHaveBeenCalled();
      });

      // Verificar que os dados foram carregados
      await waitFor(() => {
        expect(result.current.barberServices).toEqual([mockBarberService]);
        expect(result.current.totalItems).toBe(1);
        expect(result.current.stats).toEqual(mockStats);
      });
    });    test('deve aplicar filtros iniciais', async () => {
      // Arrange: Mock da API
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);
      
      const initialFilters = { barberId: 'barber-1', isActive: true };

      // Act: Renderizar com filtros iniciais
      await act(async () => {
        renderHook(() => useBarberServices({ 
          autoLoad: true,
          initialFilters
        }));
      });

      // Assert: Verificar que a API foi chamada com filtros
      await waitFor(() => {
        expect(barberServiceApi.getBarberServices).toHaveBeenCalledWith(
          initialFilters, 1, 10
        );
      });
    });
  });

  describe('Operações CRUD', () => {
    test('deve criar nova atribuição com sucesso', async () => {
      // Arrange: Mock da API
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);
      vi.mocked(barberServiceApi.createBarberService).mockResolvedValue(mockBarberService);
      vi.mocked(barberServiceApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBarberServices({ autoLoad: false }));

      // Act: Criar nova atribuição
      const createData = {
        barberId: 'barber-1',
        serviceId: 'service-1',
        customPrice: 50.00
      };

      let createdService;
      await act(async () => {
        createdService = await result.current.create(createData);
      });

      // Assert: Verificar resultado
      expect(createdService).toEqual(mockBarberService);
      expect(barberServiceApi.createBarberService).toHaveBeenCalledWith(createData);
      expect(barberServiceApi.getStats).toHaveBeenCalled();
      
      // Verificar que o item foi adicionado à lista
      expect(result.current.barberServices).toContain(mockBarberService);
    });

    test('deve atualizar atribuição existente', async () => {
      // Arrange: Mock da API e estado inicial
      const updatedService = { ...mockBarberService, customPrice: 60.00, effectivePrice: 60.00 };
      
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);
      vi.mocked(barberServiceApi.updateBarberService).mockResolvedValue(updatedService);
      vi.mocked(barberServiceApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.barberServices).toHaveLength(1);
      });

      // Act: Atualizar atribuição
      const updateData = { customPrice: 60.00 };
      
      let updatedResult;
      await act(async () => {
        updatedResult = await result.current.update('1', updateData);
      });

      // Assert: Verificar resultado
      expect(updatedResult).toEqual(updatedService);
      expect(barberServiceApi.updateBarberService).toHaveBeenCalledWith('1', updateData);
      
      // Verificar que o item foi atualizado na lista
      expect(result.current.barberServices[0].customPrice).toBe(60.00);
    });

    test('deve remover atribuição', async () => {
      // Arrange: Mock da API
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);
      vi.mocked(barberServiceApi.deleteBarberService).mockResolvedValue({ message: 'Removido' });
      vi.mocked(barberServiceApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.barberServices).toHaveLength(1);
      });

      // Act: Remover atribuição
      let removeResult;
      await act(async () => {
        removeResult = await result.current.remove('1');
      });

      // Assert: Verificar resultado
      expect(removeResult).toBe(true);
      expect(barberServiceApi.deleteBarberService).toHaveBeenCalledWith('1');
      
      // Verificar que o item foi marcado como inativo
      expect(result.current.barberServices[0].isActive).toBe(false);
    });

    test('deve reativar atribuição', async () => {
      // Arrange: Mock da API com item inativo
      const inactiveService = { ...mockBarberService, isActive: false };
      const reactivatedService = { ...mockBarberService, isActive: true };
      
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue({
        ...mockApiResponse,
        data: [inactiveService]
      });
      vi.mocked(barberServiceApi.reactivateBarberService).mockResolvedValue(reactivatedService);
      vi.mocked(barberServiceApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Aguardar carregamento inicial
      await waitFor(() => {
        expect(result.current.barberServices[0].isActive).toBe(false);
      });

      // Act: Reativar atribuição
      let reactivatedResult;
      await act(async () => {
        reactivatedResult = await result.current.reactivate('1');
      });

      // Assert: Verificar resultado
      expect(reactivatedResult).toEqual(reactivatedService);
      expect(barberServiceApi.reactivateBarberService).toHaveBeenCalledWith('1');
      
      // Verificar que o item foi reativado
      expect(result.current.barberServices[0].isActive).toBe(true);
    });
  });

  describe('Gerenciamento de filtros', () => {
    test('deve atualizar filtros e resetar página', async () => {
      // Arrange: Mock da API
      vi.mocked(barberServiceApi.getBarberServices).mockResolvedValue(mockApiResponse);

      const { result } = renderHook(() => useBarberServices({ autoLoad: false }));

      // Act: Definir filtros
      act(() => {
        result.current.setFilters({ barberId: 'barber-1', isActive: true });
      });

      // Assert: Verificar filtros
      expect(result.current.filters).toEqual({ barberId: 'barber-1', isActive: true });
      expect(result.current.currentPage).toBe(1);
    });

    test('deve limpar todos os filtros', async () => {
      // Arrange: Hook com filtros iniciais
      const { result } = renderHook(() => useBarberServices({ 
        autoLoad: false,
        initialFilters: { barberId: 'barber-1' }
      }));

      // Act: Limpar filtros
      act(() => {
        result.current.clearFilters();
      });

      // Assert: Verificar que filtros foram limpos
      expect(result.current.filters).toEqual({});
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Tratamento de erros', () => {
    test('deve capturar erro ao carregar dados', async () => {
      // Arrange: Mock da API com erro
      const errorMessage = 'Erro de rede';
      vi.mocked(barberServiceApi.getBarberServices).mockRejectedValue(new Error(errorMessage));

      // Act: Renderizar hook
      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Assert: Verificar que o erro foi capturado
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
      });
    });

    test('deve capturar erro ao criar atribuição', async () => {
      // Arrange: Mock da API com erro
      const errorMessage = 'Erro ao criar';
      vi.mocked(barberServiceApi.createBarberService).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useBarberServices({ autoLoad: false }));

      // Act: Tentar criar atribuição
      let createResult;
      await act(async () => {
        createResult = await result.current.create({
          barberId: 'barber-1',
          serviceId: 'service-1'
        });
      });

      // Assert: Verificar que o erro foi tratado
      expect(createResult).toBe(null);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Estados de carregamento', () => {    test('deve mostrar loading durante operações', async () => {
      // Arrange: Mock da API com delay
      vi.mocked(barberServiceApi.getBarberServices).mockImplementation(
        () => new Promise<{ data: any[]; total: number; page: number; limit: number; }>(resolve => 
          setTimeout(() => resolve(mockApiResponse), 100)
        )
      );

      // Act: Renderizar hook
      const { result } = renderHook(() => useBarberServices({ autoLoad: true }));

      // Assert: Verificar que loading é true inicialmente
      expect(result.current.loading).toBe(true);

      // Aguardar conclusão
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });    test('deve mostrar isCreating durante criação', async () => {
      // Arrange: Mock da API com delay
      vi.mocked(barberServiceApi.createBarberService).mockImplementation(
        () => new Promise<any>(resolve => 
          setTimeout(() => resolve(mockBarberService), 100)
        )
      );

      const { result } = renderHook(() => useBarberServices({ autoLoad: false }));

      // Act: Iniciar criação
      act(() => {
        result.current.create({ barberId: 'barber-1', serviceId: 'service-1' });
      });

      // Assert: Verificar estado de criação
      expect(result.current.isCreating).toBe(true);

      // Aguardar conclusão
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });
  });
}); 