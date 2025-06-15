import React, { useState, useEffect } from 'react';
import { GlobalSchedule, BarberSchedule, DAYS_OF_WEEK, timeStringToMinutes, minutesToTimeString } from '../../types/schedule';

export interface ScheduleFormProps {
  schedule?: GlobalSchedule | BarberSchedule | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  type: 'global' | 'barber';
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  schedule,
  isOpen,
  onClose,
  onSubmit,
  type
}) => {
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    isOpen: true,
    openTime: '09:00',
    closeTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher form com dados do horário para edição
  useEffect(() => {
    if (schedule) {
      setFormData({
        dayOfWeek: schedule.dayOfWeek,
        isOpen: schedule.isOpen,
        openTime: minutesToTimeString(schedule.openTime),
        closeTime: minutesToTimeString(schedule.closeTime),
        lunchStart: schedule.lunchStart ? minutesToTimeString(schedule.lunchStart) : '',
        lunchEnd: schedule.lunchEnd ? minutesToTimeString(schedule.lunchEnd) : '',
      });
    } else {
      // Reset form para criação
      setFormData({
        dayOfWeek: 1,
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
      });
    }
    setErrors({});
  }, [schedule]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.isOpen) {
      if (!formData.openTime) {
        newErrors.openTime = 'Horário de abertura é obrigatório';
      }
      if (!formData.closeTime) {
        newErrors.closeTime = 'Horário de fechamento é obrigatório';
      }

      // Validar se horário de fechamento é após abertura
      if (formData.openTime && formData.closeTime) {
        const openMinutes = timeStringToMinutes(formData.openTime);
        const closeMinutes = timeStringToMinutes(formData.closeTime);
        
        if (closeMinutes <= openMinutes) {
          newErrors.closeTime = 'Horário de fechamento deve ser após o de abertura';
        }
      }

      // Validar horário de almoço se preenchido
      if (formData.lunchStart && formData.lunchEnd) {
        const lunchStartMinutes = timeStringToMinutes(formData.lunchStart);
        const lunchEndMinutes = timeStringToMinutes(formData.lunchEnd);
        const openMinutes = timeStringToMinutes(formData.openTime);
        const closeMinutes = timeStringToMinutes(formData.closeTime);

        if (lunchEndMinutes <= lunchStartMinutes) {
          newErrors.lunchEnd = 'Fim do almoço deve ser após o início';
        }

        if (lunchStartMinutes < openMinutes) {
          newErrors.lunchStart = 'Início do almoço deve ser após a abertura';
        }

        if (lunchEndMinutes > closeMinutes) {
          newErrors.lunchEnd = 'Fim do almoço deve ser antes do fechamento';
        }
      }

      // Validar se apenas um dos campos de almoço foi preenchido
      if ((formData.lunchStart && !formData.lunchEnd) || (!formData.lunchStart && formData.lunchEnd)) {
        newErrors.lunchStart = 'Preencha ambos os horários de almoço ou deixe ambos vazios';
        newErrors.lunchEnd = 'Preencha ambos os horários de almoço ou deixe ambos vazios';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        dayOfWeek: formData.dayOfWeek,
        isOpen: formData.isOpen,
        openTime: formData.isOpen ? timeStringToMinutes(formData.openTime) : null,
        closeTime: formData.isOpen ? timeStringToMinutes(formData.closeTime) : null,
        lunchStart: formData.isOpen && formData.lunchStart ? timeStringToMinutes(formData.lunchStart) : null,
        lunchEnd: formData.isOpen && formData.lunchEnd ? timeStringToMinutes(formData.lunchEnd) : null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {schedule ? 'Editar Horário' : 'Novo Horário'} 
                  {type === 'barber' ? ' do Barbeiro' : ' da Barbearia'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Dia da Semana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia da Semana
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(DAYS_OF_WEEK).reverse().map(([key, value]) => (
                      <option key={key} value={parseInt(key)}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status (Aberto/Fechado) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isOpen"
                        checked={formData.isOpen}
                        onChange={() => handleInputChange('isOpen', true)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Aberto</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isOpen"
                        checked={!formData.isOpen}
                        onChange={() => handleInputChange('isOpen', false)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Fechado</span>
                    </label>
                  </div>
                </div>

                {/* Horários (apenas se aberto) */}
                {formData.isOpen && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Horário de Abertura */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Abertura *
                        </label>
                        <input
                          type="time"
                          value={formData.openTime}
                          onChange={(e) => handleInputChange('openTime', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.openTime ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.openTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.openTime}</p>
                        )}
                      </div>

                      {/* Horário de Fechamento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fechamento *
                        </label>
                        <input
                          type="time"
                          value={formData.closeTime}
                          onChange={(e) => handleInputChange('closeTime', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.closeTime ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.closeTime && (
                          <p className="mt-1 text-sm text-red-600">{errors.closeTime}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Início do Almoço */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Início do Almoço (opcional)
                        </label>
                        <input
                          type="time"
                          value={formData.lunchStart}
                          onChange={(e) => handleInputChange('lunchStart', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.lunchStart ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.lunchStart && (
                          <p className="mt-1 text-sm text-red-600">{errors.lunchStart}</p>
                        )}
                      </div>

                      {/* Fim do Almoço */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fim do Almoço (opcional)
                        </label>
                        <input
                          type="time"
                          value={formData.lunchEnd}
                          onChange={(e) => handleInputChange('lunchEnd', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.lunchEnd ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.lunchEnd && (
                          <p className="mt-1 text-sm text-red-600">{errors.lunchEnd}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Dica:</strong> O horário de almoço é opcional. Se preenchido, será considerado como período de indisponibilidade para agendamentos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  schedule ? 'Atualizar Horário' : 'Criar Horário'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};