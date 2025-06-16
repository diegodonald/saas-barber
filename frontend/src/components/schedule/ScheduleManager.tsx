import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../hooks/useSchedule';
import { ScheduleForm, ScheduleFormProps } from './ScheduleForm'; 
import { ExceptionForm, ExceptionFormProps } from './ExceptionForm'; 
import { AvailabilityCalendar, AvailabilityCalendarProps } from './AvailabilityCalendar'; 
import { 
  GlobalSchedule, 
  BarberSchedule, 
  GlobalException, 
  BarberException,
  DAYS_OF_WEEK,
  EXCEPTION_TYPE_LABELS,
  timeStringToMinutes,
  ExceptionType,
  CreateGlobalScheduleData,
  UpdateGlobalScheduleData,
  CreateBarberScheduleData,
  UpdateBarberScheduleData,
  CreateGlobalExceptionData,
  UpdateGlobalExceptionData,
  CreateBarberExceptionData,
  UpdateBarberExceptionData,
} from '../../types/schedule';
import { UserExtended } from '../../types/user-extensions';

// Importando os tipos dos formulários para evitar conflitos
interface ScheduleManagerFormData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
}

interface ExceptionManagerFormData {
  date: string;
  type: ExceptionType;
  description: string;
  openTime: string;
  closeTime: string;
}

export interface ScheduleManagerProps {
  barbershopId?: string;
  barberId?: string;
  onScheduleCreated?: (schedule: GlobalSchedule | BarberSchedule) => void;
  onScheduleUpdated?: (schedule: GlobalSchedule | BarberSchedule) => void;
  onScheduleDeleted?: (scheduleId: string) => void;
  onClose?: () => void;
  onExceptionCreated?: (exception: GlobalException | BarberException) => void;
  onExceptionUpdated?: (exception: GlobalException | BarberException) => void;
  onExceptionDeleted?: (exceptionId: string) => void;
  _onClose?: () => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  barbershopId: propsBarbershopId,
  barberId: propsBarberId,
  onScheduleCreated,
  onScheduleUpdated,
  onScheduleDeleted,
  onExceptionCreated,
  onExceptionUpdated,
  onExceptionDeleted,
  onClose: _onClose,
}) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedules' | 'exceptions' | 'availability'>('schedules');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<GlobalSchedule | BarberSchedule | null>(null);
  const [editingException, setEditingException] = useState<GlobalException | BarberException | null>(null);
  
  const userExtended = user as UserExtended;
  
  const hookBarbershopId = propsBarbershopId || userExtended?.barbershopId;
  const hookBarberId = propsBarberId || (hasRole('BARBER') ? user?.id : undefined);

  const scheduleHook = useSchedule({
    barbershopId: hookBarbershopId,
    barberId: hookBarberId,
    autoLoad: true
  });  
  const {
    globalSchedules,
    barberSchedules,
    globalExceptions,
    barberExceptions,
    availability,
    isLoadingGlobalSchedules,
    isLoadingBarberSchedules,
    isLoadingGlobalExceptions,
    isLoadingBarberExceptions,
    isLoadingAvailability,
    globalScheduleError,
    barberScheduleError,
    globalExceptionError,
    barberExceptionError,
    availabilityError,
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
    checkAvailability,
    fetchGlobalSchedules: refreshGlobalSchedules,
    fetchBarberSchedules: refreshBarberSchedules,
    fetchGlobalExceptions: refreshGlobalExceptions,
    fetchBarberExceptions: refreshBarberExceptions,
  } = scheduleHook;
  const handleScheduleSubmit = async (data: ScheduleManagerFormData) => {
    try {
      const effectiveBarbershopId = hookBarbershopId;

      if (hookBarberId && !hasRole(['ADMIN'])) {
        const payloadBase = {
          isWorking: data.isOpen,
          // Para CreateBarberScheduleData, startTime e endTime são obrigatórios (string)
          startTime: data.openTime || "00:00",
          endTime: data.closeTime || "00:00",
          breakStart: data.lunchStart || undefined,
          breakEnd: data.lunchEnd || undefined,
        };

        if (editingSchedule) {
          const updateData: UpdateBarberScheduleData = payloadBase;
          const updated = await updateBarberSchedule(editingSchedule.id, updateData);
          onScheduleUpdated?.(updated);
        } else {
          const createData: CreateBarberScheduleData = {
            ...payloadBase,
            dayOfWeek: data.dayOfWeek, 
            barberId: hookBarberId 
          };
          const created = await createBarberSchedule(createData);
          onScheduleCreated?.(created);
        }
      } else { 
        if (!effectiveBarbershopId) {
          alert('ID da barbearia não encontrado para criar/atualizar horário global.');
          return;
        }
        const payloadBase = {
          isOpen: data.isOpen,
          // Para CreateGlobalScheduleData, openTime e closeTime são obrigatórios (string)
          openTime: data.openTime || "00:00",
          closeTime: data.closeTime || "00:00",
          lunchStart: data.lunchStart || undefined,
          lunchEnd: data.lunchEnd || undefined,
        };

        if (editingSchedule) {
          const updateData: UpdateGlobalScheduleData = payloadBase;
          const updated = await updateGlobalSchedule(editingSchedule.id, updateData);
          onScheduleUpdated?.(updated);
        } else {
          const createData: CreateGlobalScheduleData = {
            ...payloadBase,
            dayOfWeek: data.dayOfWeek,
            barbershopId: effectiveBarbershopId 
          };
          const created = await createGlobalSchedule(createData);
          onScheduleCreated?.(created);
        }
      }
      setShowScheduleForm(false);
      setEditingSchedule(null);
      if (hookBarberId) refreshBarberSchedules(); else refreshGlobalSchedules();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Erro ao salvar horário: ${error.message}`);
      } else {
        alert('Erro ao salvar horário: Erro desconhecido');
      }
    }
  };

  const handleExceptionSubmit = async (data: ExceptionManagerFormData) => {
    try {
      const effectiveBarbershopId = hookBarbershopId;

      if (hookBarberId && !hasRole(['ADMIN'])) {        const payloadBase = {
          type: data.type,
          reason: data.description || "Motivo não especificado", // Obrigatório para Create
          specialStartTime: data.openTime || undefined,
          specialEndTime: data.closeTime || undefined,
        };
        if (editingException) {
          const updateData: UpdateBarberExceptionData = payloadBase;
          const updated = await updateBarberException(editingException.id, updateData);
          onExceptionUpdated?.(updated);
        } else {
          const createData: CreateBarberExceptionData = {
            ...payloadBase,
            date: data.date,
            barberId: hookBarberId, 
            reason: data.description || "Motivo não especificado", // Garantir que reason esteja aqui para Create
          };
          const created = await createBarberException(createData);
          onExceptionCreated?.(created);
        }
      } else { 
        if (!effectiveBarbershopId) {
          alert('ID da barbearia não encontrado para criar/atualizar exceção global.');
          return;
        }        const payloadBase = {
          type: data.type,
          reason: data.description || "Motivo não especificado",
          specialOpenTime: data.openTime || undefined,
          specialCloseTime: data.closeTime || undefined,
        };
        if (editingException) {
          const updateData: UpdateGlobalExceptionData = payloadBase;
          const updated = await updateGlobalException(editingException.id, updateData);
          onExceptionUpdated?.(updated);
        } else {
          const createData: CreateGlobalExceptionData = {
            ...payloadBase,
            date: data.date,
            barbershopId: effectiveBarbershopId,
            reason: data.description || "Motivo não especificado", // Garantir que reason esteja aqui para Create
          };
          const created = await createGlobalException(createData);
          onExceptionCreated?.(created);
        }
      }
      setShowExceptionForm(false);
      setEditingException(null);
      if (hookBarberId) refreshBarberExceptions(); else refreshGlobalExceptions();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Erro ao salvar exceção: ${error.message}`);
      } else {
        alert('Erro ao salvar exceção: Erro desconhecido');
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, isBarberSchedule: boolean) => {
    if (!confirm('Tem certeza que deseja deletar este horário?')) return;
    try {
      if (isBarberSchedule) {
        await deleteBarberSchedule(scheduleId);
        refreshBarberSchedules();
      } else {
        await deleteGlobalSchedule(scheduleId);
        refreshGlobalSchedules();
      }
      onScheduleDeleted?.(scheduleId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Erro ao deletar horário: ${error.message}`);
      } else {
        alert('Erro ao deletar horário: Erro desconhecido');
      }
    }
  };

  const handleDeleteException = async (exceptionId: string, isBarberException: boolean) => {
    if (!confirm('Tem certeza que deseja deletar esta exceção?')) return;
    try {
      if (isBarberException) {
        await deleteBarberException(exceptionId);
        refreshBarberExceptions();
      } else {
        await deleteGlobalException(exceptionId);
        refreshGlobalExceptions();
      }
      onExceptionDeleted?.(exceptionId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Erro ao deletar exceção: ${error.message}`);
      } else {
        alert('Erro ao deletar exceção: Erro desconhecido');
      }
    }
  };

  const renderSchedulesList = () => {
    const schedulesToRender = hookBarberId ? barberSchedules : globalSchedules;
    const isLoading = hookBarberId ? isLoadingBarberSchedules : isLoadingGlobalSchedules;
    const error = hookBarberId ? barberScheduleError : globalScheduleError;
    const refreshFn = hookBarberId ? refreshBarberSchedules : refreshGlobalSchedules;

    if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-center py-8"><p className="text-red-600 mb-4">{error}</p><button onClick={() => refreshFn()} className="btn btn-secondary">Tentar Novamente</button></div>;
    if (!schedulesToRender?.length) return <div className="text-center py-8 text-gray-600"><p className="mb-4">Nenhum horário configurado</p><button onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }} className="btn btn-primary">Criar Primeiro Horário</button></div>;

    return (
      <div className="space-y-4">
        {schedulesToRender.map((schedule) => {
          const isBarberType = 'isWorking' in schedule;
          const currentIsOpen = isBarberType ? schedule.isWorking : schedule.isOpen;
          const currentOpenTime = isBarberType ? schedule.startTime : schedule.openTime;
          const currentCloseTime = isBarberType ? schedule.endTime : schedule.closeTime;
          const currentLunchStart = isBarberType ? schedule.breakStart : schedule.lunchStart;
          const currentLunchEnd = isBarberType ? schedule.breakEnd : schedule.closeTime;

          return (
            <div key={schedule.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{DAYS_OF_WEEK[schedule.dayOfWeek]}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentIsOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {currentIsOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                  {currentIsOpen && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Horário:</span> {currentOpenTime} às {currentCloseTime}</p>
                      {currentLunchStart && currentLunchEnd && (
                        <p><span className="font-medium">{isBarberType ? 'Intervalo:' : 'Almoço:'}</span> {currentLunchStart} às {currentLunchEnd}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setEditingSchedule(schedule); setShowScheduleForm(true); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                  <button onClick={() => handleDeleteSchedule(schedule.id, isBarberType)} className="text-red-600 hover:text-red-800 text-sm font-medium">Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExceptionsList = () => {
    const exceptionsToRender = hookBarberId ? barberExceptions : globalExceptions;
    const isLoading = hookBarberId ? isLoadingBarberExceptions : isLoadingGlobalExceptions;
    const error = hookBarberId ? barberExceptionError : globalExceptionError;
    const refreshFn = hookBarberId ? refreshBarberExceptions : refreshGlobalExceptions;

    if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-center py-8"><p className="text-red-600 mb-4">{error}</p><button onClick={() => refreshFn()} className="btn btn-secondary">Tentar Novamente</button></div>;
    if (!exceptionsToRender?.length) return <div className="text-center py-8 text-gray-600"><p className="mb-4">Nenhuma exceção configurada</p><button onClick={() => { setEditingException(null); setShowExceptionForm(true);}} className="btn btn-primary">Criar Primeira Exceção</button></div>;

    return (
      <div className="space-y-4">        {exceptionsToRender.map((exception) => {          
          // Helper para obter horários especiais baseado no tipo de exceção
          const getSpecialTimes = (exception: GlobalException | BarberException) => {
            if ('barberId' in exception) {
              // BarberException
              return {
                openTime: exception.specialStartTime,
                closeTime: exception.specialEndTime
              };
            } else {
              // GlobalException
              return {
                openTime: exception.specialOpenTime,
                closeTime: exception.specialCloseTime
              };
            }
          };
          
          const specialTimes = getSpecialTimes(exception);
          const currentSpecialOpenTime = specialTimes.openTime;
          const currentSpecialCloseTime = specialTimes.closeTime;
          
          return (
            <div key={exception.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{new Date(exception.date + 'T00:00:00').toLocaleDateString('pt-BR')}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exception.type === ExceptionType.CLOSED || exception.type === ExceptionType.OFF
                        ? 'bg-red-100 text-red-800' 
                        : exception.type === ExceptionType.SPECIAL_HOURS || exception.type === ExceptionType.AVAILABLE
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {EXCEPTION_TYPE_LABELS[exception.type]}
                    </span>
                  </div>                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Motivo:</span> {exception.reason}</p>
                    {(exception.type === ExceptionType.SPECIAL_HOURS || exception.type === ExceptionType.AVAILABLE) && currentSpecialOpenTime && currentSpecialCloseTime && (
                      <p><span className="font-medium">Horário Especial:</span> {currentSpecialOpenTime} às {currentSpecialCloseTime}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setEditingException(exception); setShowExceptionForm(true); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                  <button onClick={() => handleDeleteException(exception.id, 'barberId' in exception)} className="text-red-600 hover:text-red-800 text-sm font-medium">Excluir</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  // Props para ScheduleForm
  const scheduleFormProps: ScheduleFormProps = {
    isOpen: showScheduleForm,
    onClose: () => { setShowScheduleForm(false); setEditingSchedule(null); },
    onSubmit: handleScheduleSubmit,
    initialData: editingSchedule ? {
      dayOfWeek: editingSchedule.dayOfWeek,
      isOpen: 'isOpen' in editingSchedule ? editingSchedule.isOpen : editingSchedule.isWorking,
      // Para os formulários, vamos converter de string para número (minutos) e depois de volta para string no formulário
      openTime: timeStringToMinutes(('isOpen' in editingSchedule ? editingSchedule.openTime : editingSchedule.startTime) || ''),
      closeTime: timeStringToMinutes(('isOpen' in editingSchedule ? editingSchedule.closeTime : editingSchedule.endTime) || ''),
      lunchStart: timeStringToMinutes((
        ('lunchStart' in editingSchedule ? editingSchedule.lunchStart : 
        ('breakStart' in editingSchedule ? editingSchedule.breakStart : ''))
      ) || ''),
      lunchEnd: timeStringToMinutes((
        ('lunchEnd' in editingSchedule ? editingSchedule.lunchEnd : 
        ('breakEnd' in editingSchedule ? editingSchedule.breakEnd : ''))
      ) || ''),
    } : undefined,
    isBarberSchedule: !!hookBarberId && !hasRole(['ADMIN'])
  };

  // Props para ExceptionForm
  const exceptionFormProps: ExceptionFormProps = {
    isOpen: showExceptionForm,
    onClose: () => { setShowExceptionForm(false); setEditingException(null); },
    onSubmit: handleExceptionSubmit,
    initialData: editingException ? {
      date: editingException.date.split('T')[0], // Garantir formato YYYY-MM-DD
      type: editingException.type,
      description: String(editingException.reason),
      openTime: timeStringToMinutes((
        ('specialOpenTime' in editingException ? editingException.specialOpenTime : 
        ('specialStartTime' in editingException ? editingException.specialStartTime : ''))
      ) || ''),
      closeTime: timeStringToMinutes((
        ('specialCloseTime' in editingException ? editingException.specialCloseTime : 
        ('specialEndTime' in editingException ? editingException.specialEndTime : ''))
      ) || ''),
    } : undefined,
    isBarberException: !!hookBarberId && !hasRole(['ADMIN'])
  };
  
  // Props para AvailabilityCalendar
  const availabilityCalendarProps: AvailabilityCalendarProps = {
    barbershopId: hookBarbershopId,
    barberId: hookBarberId,
    availability: availability,
    isLoading: isLoadingAvailability,
    error: availabilityError,
    onCheckAvailability: (date: string, serviceDuration?: number) => {
      // A função checkAvailability do hook useSchedule espera (date: string, options?: { serviceDuration?: number })
      // O hook já tem barbershopId e barberId em seu escopo.
      checkAvailability(date, { serviceDuration });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {hookBarberId ? 'Meus Horários de Trabalho' : 'Horários da Barbearia'}
          </h2>
          <p className="text-gray-600 mt-1">
            {hookBarberId 
              ? 'Configure seus horários pessoais de trabalho e exceções.'
              : 'Configure os horários globais de funcionamento da barbearia e dias de exceção.'
            }
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button onClick={() => { setEditingSchedule(null); setShowScheduleForm(true); }} className="btn btn-primary">Novo Horário</button>
          <button onClick={() => { setEditingException(null); setShowExceptionForm(true); }} className="btn btn-secondary">Nova Exceção</button>
        </div>
      </div>

      {showScheduleForm && <ScheduleForm {...scheduleFormProps} />}
      {showExceptionForm && <ExceptionForm {...exceptionFormProps} />}

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {['schedules', 'exceptions', 'availability'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'schedules' | 'exceptions' | 'availability')}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150`}
              >
                {tab === 'schedules' && 'Horários Padrão'}
                {tab === 'exceptions' && 'Exceções'}
                {tab === 'availability' && 'Ver Disponibilidade'}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'schedules' && renderSchedulesList()}
          {activeTab === 'exceptions' && renderExceptionsList()}
          {activeTab === 'availability' && <AvailabilityCalendar {...availabilityCalendarProps} />}
        </div>
      </div>
    </div>
  );
};