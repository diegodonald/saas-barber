import React, { useState, useEffect } from 'react';
import { GlobalException, BarberException, ExceptionType, EXCEPTION_TYPE_LABELS, timeStringToMinutes, minutesToTimeString } from '../../types/schedule';

export interface ExceptionFormProps {
  exception?: GlobalException | BarberException | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  type: 'global' | 'barber';
}

export const ExceptionForm: React.FC<ExceptionFormProps> = ({
  exception,
  isOpen,
  onClose,
  onSubmit,
  type
}) => {
  const [formData, setFormData] = useState({
    date: '',
    type: 'CLOSED' as ExceptionType,
    description: '',
    openTime: '09:00',
    closeTime: '18:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher form com dados da exceção para edição
  useEffect(() => {
    if (exception) {
      setFormData({
        date: new Date(exception.date).toISOString().split('T')[0],
        type: exception.type,
        description: exception.description,
        openTime: exception.openTime ? minutesToTimeString(exception.openTime) : '09:00',
        closeTime: exception.closeTime ? minutesToTimeString(exception.closeTime) : '18:00',
      });
    } else {
      // Reset form para criação
      setFormData({
        date: '',
        type: 'CLOSED' as ExceptionType,
        description: '',
        openTime: '09:00',
        closeTime: '18:00',
      });
    }
    setErrors({});
  }, [exception]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    } else {
      // Validar se data não é no passado
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas as datas
      
      if (selectedDate < today) {
        newErrors.date = 'Data não pode ser no passado';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Descrição deve ter pelo menos 3 caracteres';
    }

    // Validar horários para tipos que requerem horário
    if (formData.type === 'EXTENDED_HOURS' || formData.type === 'SPECIAL_HOURS') {
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
        date: formData.date,
        type: formData.type,
        description: formData.description.trim(),
        openTime: (formData.type === 'EXTENDED_HOURS' || formData.type === 'SPECIAL_HOURS') 
          ? timeStringToMinutes(formData.openTime) 
          : null,
        closeTime: (formData.type === 'EXTENDED_HOURS' || formData.type === 'SPECIAL_HOURS') 
          ? timeStringToMinutes(formData.closeTime) 
          : null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar exceção:', error);
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

  const getExceptionTypeDescription = (exceptionType: ExceptionType) => {
    const descriptions = {
      CLOSED: 'Barbearia ou barbeiro estará fechado neste dia',
      EXTENDED_HOURS: 'Horário estendido com funcionamento além do normal',
      SPECIAL_HOURS: 'Horário especial diferente do padrão'
    };
    return descriptions[exceptionType];
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
                  {exception ? 'Editar Exceção' : 'Nova Exceção'} 
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
                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Não permitir datas passadas
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Tipo de Exceção */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Exceção *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value as ExceptionType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(EXCEPTION_TYPE_LABELS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-600">
                    {getExceptionTypeDescription(formData.type)}
                  </p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    placeholder="Descreva o motivo da exceção (ex: Feriado, Evento especial, Férias, etc.)"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Horários (apenas para tipos que requerem horário) */}
                {(formData.type === 'EXTENDED_HOURS' || formData.type === 'SPECIAL_HOURS') && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Horários Especiais
                      </h4>
                      
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
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Atenção:</strong> Estes horários especiais se aplicarão apenas para a data selecionada, 
                            substituindo temporariamente os horários normais.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Info para exceção de fechamento */}
                {formData.type === 'CLOSED' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          <strong>Fechamento:</strong> Nenhum agendamento será possível nesta data. 
                          {type === 'barber' 
                            ? ' O barbeiro estará indisponível.' 
                            : ' A barbearia estará fechada.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
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
                  exception ? 'Atualizar Exceção' : 'Criar Exceção'
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