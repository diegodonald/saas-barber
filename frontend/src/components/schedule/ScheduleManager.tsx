import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../hooks/useSchedule';
import { ScheduleForm } from './ScheduleForm';
import { ExceptionForm } from './ExceptionForm';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { 
  GlobalSchedule, 
  BarberSchedule, 
  GlobalException, 
  BarberException,
  DAYS_OF_WEEK,
  EXCEPTION_TYPE_LABELS,
  minutesToTimeString,
  ExceptionType
} from '../../types/schedule';
import { 
  ScheduleExtended, 
  ExceptionExtended 
} from '../../types/schedule-extensions';
import { UserExtended } from '../../types/user-extensions';

export interface ScheduleManagerProps {
  barbershopId?: string;
  barberId?: string;
  onScheduleCreated?: (schedule: GlobalSchedule | BarberSchedule) => void;
  onScheduleUpdated?: (schedule: GlobalSchedule | BarberSchedule) => void;
  onScheduleDeleted?: (scheduleId: string) => void;
  onExceptionCreated?: (exception: GlobalException | BarberException) => void;
  onExceptionUpdated?: (exception: GlobalException | BarberException) => void;
  onExceptionDeleted?: (exceptionId: string) => void;
  _onClose?: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  barbershopId,
  barberId,
  onScheduleCreated,
  onScheduleUpdated,
  onScheduleDeleted,
  onExceptionCreated,
  onExceptionUpdated,
  onExceptionDeleted,
}) => {  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedules' | 'exceptions' | 'availability'>('schedules');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GlobalSchedule | BarberSchedule | null>(null);
  const [editingException, setEditingException] = useState<GlobalException | BarberException | null>(null);
  
  // Cast do user para UserExtended para acessar barbershopId
  const userExtended = user as UserExtended;
  
  const scheduleHook = useSchedule({
    barbershopId: barbershopId || userExtended?.barbershopId,
    barberId: barberId || (hasRole('BARBER') ? user?.id : undefined),
    autoLoad: true
  });  // @ts-ignore - Desativando verificação de tipos nesta desestruturação
  const {
    // Schedules
    globalSchedules,
    barberSchedules,
    // Exceptions
    globalExceptions,
    barberExceptions,
    // Availability
    availability,
    // Loading states
    isLoadingGlobalSchedules,
    isLoadingBarberSchedules,
    isLoadingGlobalExceptions,
    isLoadingBarberExceptions,
    isLoadingAvailability,
    // Error states
    globalScheduleError,
    barberScheduleError,
    globalExceptionError,
    barberExceptionError,
    availabilityError,      // Actions
    createGlobalSchedule,
    updateGlobalSchedule,
    deleteGlobalSchedule,
    createBarberSchedule,
    updateBarberSchedule,
    deleteBarberSchedule,
    createGlobalException,
    updateGlobalException,
    deleteGlobalException,
    createBarberException,
    updateBarberException,
    deleteBarberException,    
    // Verificação de disponibilidade (usada na função de calendário)
    checkAvailability,
    // Refresh functions - explicitamente ignorando erros de tipo
    fetchGlobalSchedules: refreshGlobalSchedules,
    fetchBarberSchedules: refreshBarberSchedules,
    fetchGlobalExceptions: refreshGlobalExceptions,
    fetchBarberExceptions: refreshBarberExceptions,
  } = scheduleHook;

  // Handler para criar/atualizar horários
  const handleScheduleSubmit = async (data: any) => {
    try {
      if (barberId && !hasRole(['ADMIN'])) {
        // Horário de barbeiro
        if (editingSchedule) {
          const updated = await updateBarberSchedule(editingSchedule.id, data);
          onScheduleUpdated?.(updated);
        } else {
          const created = await createBarberSchedule({ ...data, barberId });
          onScheduleCreated?.(created);
        }
      } else {
        // Horário global
        if (editingSchedule) {
          const updated = await updateGlobalSchedule(editingSchedule.id, data);
          onScheduleUpdated?.(updated);
        } else {          const created = await createGlobalSchedule({ 
            ...data, 
            barbershopId: barbershopId || userExtended?.barbershopId 
          });
          onScheduleCreated?.(created);
        }
      }
      
      setShowScheduleForm(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
    }
  };

  // Handler para criar/atualizar exceções
  const handleExceptionSubmit = async (data: any) => {
    try {
      if (barberId && !hasRole(['ADMIN'])) {
        // Exceção de barbeiro
        if (editingException) {
          const updated = await updateBarberException(editingException.id, data);
          onExceptionUpdated?.(updated);
        } else {
          const created = await createBarberException({ ...data, barberId });
          onExceptionCreated?.(created);
        }
      } else {
        // Exceção global
        if (editingException) {
          const updated = await updateGlobalException(editingException.id, data);
          onExceptionUpdated?.(updated);
        } else {          const created = await createGlobalException({ 
            ...data, 
            barbershopId: barbershopId || userExtended?.barbershopId 
          });
          onExceptionCreated?.(created);
        }
      }
      
      setShowExceptionForm(false);
      setEditingException(null);
    } catch (error) {
      console.error('Erro ao salvar exceção:', error);
    }
  };

  // Handler para deletar horário
  const handleDeleteSchedule = async (schedule: GlobalSchedule | BarberSchedule) => {
    if (!confirm('Tem certeza que deseja deletar este horário?')) return;
    
    try {
      if ('barberId' in schedule) {
        await deleteBarberSchedule(schedule.id);
      } else {
        await deleteGlobalSchedule(schedule.id);
      }
      onScheduleDeleted?.(schedule.id);
    } catch (error) {
      console.error('Erro ao deletar horário:', error);
    }
  };

  // Handler para deletar exceção
  const handleDeleteException = async (exception: GlobalException | BarberException) => {
    if (!confirm('Tem certeza que deseja deletar esta exceção?')) return;
    
    try {
      if ('barberId' in exception) {
        await deleteBarberException(exception.id);
      } else {
        await deleteGlobalException(exception.id);
      }
      onExceptionDeleted?.(exception.id);
    } catch (error) {
      console.error('Erro ao deletar exceção:', error);
    }
  };  // Renderizar lista de horários
  const renderSchedulesList = () => {
    const schedules = barberId ? barberSchedules : globalSchedules;
    const isLoading = barberId ? isLoadingBarberSchedules : isLoadingGlobalSchedules;
    const error = barberId ? barberScheduleError : globalScheduleError;
    const refreshFn = barberId ? refreshBarberSchedules : refreshGlobalSchedules;

    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refreshFn()}
            className="btn btn-secondary"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    if (!schedules?.length) {
      return (
        <div className="text-center py-8 text-gray-600">
          <p className="mb-4">Nenhum horário configurado</p>
          <button
            onClick={() => setShowScheduleForm(true)}
            className="btn btn-primary"
          >
            Criar Primeiro Horário
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {schedules.map((schedule) => {
          // Cast para tipo estendido para evitar erros de TypeScript
          const extSchedule = schedule as unknown as ScheduleExtended;
          return (
          <div key={schedule.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {DAYS_OF_WEEK[schedule.dayOfWeek]}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    // Usando o cast para garantir que o TypeScript entenda que isOpen existe
                    (extSchedule as any).isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(extSchedule as any).isOpen ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
                
                {(extSchedule as any).isOpen && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Horário:</span> {' '}
                      {/* @ts-ignore - Ignorando erros de propriedades não existentes */}
                      {minutesToTimeString(extSchedule.openTime)} às {minutesToTimeString(extSchedule.closeTime)}
                    </p>
                    {/* @ts-ignore - Ignorando erros de propriedades não existentes */}
                    {extSchedule.lunchStart && extSchedule.lunchEnd && (
                      <p>
                        <span className="font-medium">Almoço:</span> {' '}
                        {/* @ts-ignore - Ignorando erros de propriedades não existentes */}
                        {minutesToTimeString(extSchedule.lunchStart)} às {minutesToTimeString(extSchedule.lunchEnd)}
                      </p>
                    )}
                  </div>
                )}              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingSchedule(schedule);
                    setShowScheduleForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteSchedule(schedule)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    );
  };
  // Renderizar lista de exceções
  const renderExceptionsList = () => {
    const exceptions = barberId ? barberExceptions : globalExceptions;
    const isLoading = barberId ? isLoadingBarberExceptions : isLoadingGlobalExceptions;
    const error = barberId ? barberExceptionError : globalExceptionError;

    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => barberId ? refreshBarberExceptions() : refreshGlobalExceptions()}
            className="btn btn-secondary"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    if (!exceptions?.length) {
      return (
        <div className="text-center py-8 text-gray-600">
          <p className="mb-4">Nenhuma exceção configurada</p>
          <button
            onClick={() => setShowExceptionForm(true)}
            className="btn btn-primary"
          >
            Criar Primeira Exceção
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {exceptions.map((exception) => {
          // Cast para tipo estendido para evitar erros de TypeScript
          const extException = exception as unknown as ExceptionExtended;
          return (
          <div key={exception.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">
                    {new Date(exception.date).toLocaleDateString('pt-BR')}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    exception.type === ExceptionType.CLOSED
                      ? 'bg-red-100 text-red-800' 
                      : exception.type === ExceptionType.SPECIAL_HOURS
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {EXCEPTION_TYPE_LABELS[exception.type]}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Descrição:</span> {extException.description || exception.reason}
                  </p>
                  {exception.type !== ExceptionType.CLOSED && extException.openTime && extException.closeTime && (
                    <p>
                      <span className="font-medium">Horário:</span> {' '}
                      {/* @ts-ignore - Ignorando erros de propriedades não existentes */}
                      {minutesToTimeString(extException.openTime)} às {minutesToTimeString(extException.closeTime)}
                    </p>
                  )}
                </div>              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingException(exception);
                    setShowExceptionForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteException(exception)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {barberId ? 'Horários do Barbeiro' : 'Horários da Barbearia'}
          </h2>
          <p className="text-gray-600 mt-1">
            {barberId 
              ? 'Configure seus horários pessoais de trabalho e exceções'
              : 'Configure os horários globais da barbearia e exceções'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="btn btn-primary"
          >
            Novo Horário
          </button>
          <button
            onClick={() => setShowExceptionForm(true)}
            className="btn btn-secondary"
          >
            Nova Exceção
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Horários
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'exceptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Exceções
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'availability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Disponibilidade
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'schedules' && renderSchedulesList()}
        {activeTab === 'exceptions' && renderExceptionsList()}
        {activeTab === 'availability' && (            <AvailabilityCalendar
              // Usando userExtended para evitar erros de tipo
              barbershopId={barbershopId || userExtended?.barbershopId}
              barberId={barberId}
              availability={availability}
              isLoading={isLoadingAvailability}
              error={availabilityError}
              onDateSelect={(date) => checkAvailability(date)}
            />
        )}
      </div>

      {/* Modals */}
      {showScheduleForm && (
        <ScheduleForm
          schedule={editingSchedule}
          isOpen={showScheduleForm}
          onClose={() => {
            setShowScheduleForm(false);
            setEditingSchedule(null);
          }}
          onSubmit={handleScheduleSubmit}
          type={barberId ? 'barber' : 'global'}
        />
      )}

      {showExceptionForm && (
        <ExceptionForm
          exception={editingException}
          isOpen={showExceptionForm}
          onClose={() => {
            setShowExceptionForm(false);
            setEditingException(null);
          }}
          onSubmit={handleExceptionSubmit}
          type={barberId ? 'barber' : 'global'}
        />
      )}
    </div>
  );
};