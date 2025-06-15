/**
 * Componente principal para gerenciamento de serviços por barbeiro
 * Interface completa com listagem, filtros, criação e edição
 */

import React, { useState } from 'react';
import { useBarberServices } from '../../hooks/useBarberServices';
import { BarberServiceManagerProps, BarberService, CreateBarberServiceData } from '../../types/barberService';

// Icons (você pode usar heroicons ou sua biblioteca de ícones preferida)
const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

/**
 * Componente de card para exibir um serviço por barbeiro
 */
const BarberServiceCard: React.FC<{
  barberService: BarberService;
  onEdit: (barberService: BarberService) => void;
  onToggleStatus: (id: string, newStatus: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ barberService, onEdit, onToggleStatus, onDelete }) => {
  const formatPrice = (price: number) => `R$ ${price.toFixed(2)}`;
  
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {barberService.barber?.user.name || 'Barbeiro não encontrado'}
          </h3>
          <p className="text-sm text-gray-600">
            {barberService.service?.name || 'Serviço não encontrado'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            barberService.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {barberService.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Preço Base:</span>
          <span className="text-sm text-gray-900">
            {barberService.service ? formatPrice(barberService.service.price) : 'N/A'}
          </span>
        </div>
        
        {barberService.customPrice && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Preço Customizado:</span>
            <span className="text-sm font-medium text-blue-600">
              {formatPrice(barberService.customPrice)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Preço Efetivo:</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(barberService.effectivePrice)}
          </span>
        </div>
        
        {barberService.service?.duration && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duração:</span>
            <span className="text-sm text-gray-900">
              {barberService.service.duration} min
            </span>
          </div>
        )}
        
        {barberService.service?.category && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Categoria:</span>
            <span className="text-sm text-gray-900">
              {barberService.service.category}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(barberService)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar
          </button>
          
          <button
            onClick={() => onToggleStatus(barberService.id, !barberService.isActive)}
            className={`text-sm font-medium ${
              barberService.isActive 
                ? 'text-red-600 hover:text-red-800' 
                : 'text-green-600 hover:text-green-800'
            }`}
          >
            {barberService.isActive ? 'Desativar' : 'Ativar'}
          </button>
          
          <button
            onClick={() => onDelete(barberService.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Remover
          </button>
        </div>
        
        <span className="text-xs text-gray-400">
          {new Date(barberService.updatedAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
};

/**
 * Componente principal de gerenciamento
 */
export const BarberServiceManager: React.FC<BarberServiceManagerProps> = ({
  barbershopId,
  onServiceAssigned,
  onServiceUpdated,
  onServiceRemoved
}) => {
  const {
    barberServices,
    loading,
    error,
    stats,
    currentPage,
    totalPages,
    totalItems,
    filters,
    create,
    update,
    remove,
    reactivate,
    loadBarberServices,
    setFilters,
    clearFilters,
    refresh
  } = useBarberServices({
    initialFilters: barbershopId ? { search: barbershopId } : {}
  });

  // Estados locais para UI
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<BarberService | null>(null);

  // Handlers
  const handleCreate = async (data: CreateBarberServiceData) => {
    const result = await create(data);
    if (result) {
      setShowCreateForm(false);
      onServiceAssigned?.(result);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    const result = await update(id, data);
    if (result) {
      setEditingService(null);
      onServiceUpdated?.(result);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    if (newStatus) {
      await reactivate(id);
    } else {
      const barberService = barberServices.find(bs => bs.id === id);
      if (barberService) {
        await update(id, { isActive: false });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta atribuição?')) {
      const success = await remove(id);
      if (success) {
        onServiceRemoved?.(id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Serviços por Barbeiro
          </h1>
          <p className="text-sm text-gray-600">
            Gerencie quais serviços cada barbeiro pode executar e seus preços
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FilterIcon />
            <span className="ml-2">Filtros</span>
          </button>
          
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshIcon />
            <span className="ml-2">Atualizar</span>
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon />
            <span className="ml-2">Nova Atribuição</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Ativo</div>
            <div className="mt-1 text-3xl font-semibold text-green-600">
              {stats.totalActive}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Inativo</div>
            <div className="mt-1 text-3xl font-semibold text-red-600">
              {stats.totalInactive}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Preço Médio</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600">
              R$ {stats.averagePrice.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Com Preço Custom</div>
            <div className="mt-1 text-3xl font-semibold text-purple-600">
              {stats.customPriceCount}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Exibindo {barberServices.length} de {totalItems} atribuições
            </div>
            
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Service List */}
          {barberServices.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {barberServices.map((barberService) => (
                <BarberServiceCard
                  key={barberService.id}
                  barberService={barberService}
                  onEdit={setEditingService}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                Nenhuma atribuição encontrada
              </div>
              <div className="text-gray-400 text-sm mt-2">
                Crie uma nova atribuição para começar
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => loadBarberServices(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => loadBarberServices(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
              
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => loadBarberServices(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      ←
                    </button>
                    
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                      {currentPage}
                    </span>
                    
                    <button
                      onClick={() => loadBarberServices(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}; 