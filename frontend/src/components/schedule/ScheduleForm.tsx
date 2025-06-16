import React, { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, timeStringToMinutes, minutesToTimeString } from '../../types/schedule';

// Definindo o tipo para initialData explicitamente
interface ScheduleInitialData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: number | null;
  closeTime: number | null;
  lunchStart: number | null;
  lunchEnd: number | null;
}

// Tipo para os dados do formulário
interface ScheduleFormData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface ScheduleFormProps {
  initialData?: ScheduleInitialData; // Adicionado initialData aqui
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>; // Mantendo any por enquanto, idealmente seria um tipo mais específico
  isBarberSchedule: boolean; // Adicionado para diferenciar a lógica do formulário se necessário
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  initialData, // Usando a prop initialData
  isOpen,
  onClose,
  onSubmit,
  isBarberSchedule // Recebendo a prop
}) => {
  const [formData, setFormData] = useState({
    dayOfWeek: initialData?.dayOfWeek ?? 1,
    isOpen: initialData?.isOpen ?? true,
    // Convertendo de minutos (number) para string "HH:mm"
    openTime: initialData?.openTime !== null && initialData?.openTime !== undefined ? minutesToTimeString(initialData.openTime) : '09:00',
    closeTime: initialData?.closeTime !== null && initialData?.closeTime !== undefined ? minutesToTimeString(initialData.closeTime) : '18:00',
    lunchStart: initialData?.lunchStart !== null && initialData?.lunchStart !== undefined ? minutesToTimeString(initialData.lunchStart) : '12:00',
    lunchEnd: initialData?.lunchEnd !== null && initialData?.lunchEnd !== undefined ? minutesToTimeString(initialData.lunchEnd) : '13:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        dayOfWeek: initialData.dayOfWeek,
        isOpen: initialData.isOpen,
        openTime: initialData.openTime !== null && initialData.openTime !== undefined ? minutesToTimeString(initialData.openTime) : '09:00',
        closeTime: initialData.closeTime !== null && initialData.closeTime !== undefined ? minutesToTimeString(initialData.closeTime) : '18:00',
        lunchStart: initialData.lunchStart !== null && initialData.lunchStart !== undefined ? minutesToTimeString(initialData.lunchStart) : '12:00',
        lunchEnd: initialData.lunchEnd !== null && initialData.lunchEnd !== undefined ? minutesToTimeString(initialData.lunchEnd) : '13:00',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validar os horários
      const errors: Record<string, string> = {};

      if (formData.dayOfWeek < 0 || formData.dayOfWeek > 6) {
        errors.dayOfWeek = 'Dia da semana inválido';
      }

      if (formData.isOpen) {
        if (!formData.openTime) {
          errors.openTime = 'Horário de abertura é obrigatório';
        }
        if (!formData.closeTime) {
          errors.closeTime = 'Horário de fechamento é obrigatório';
        }

        // Se ambos os horários de almoço/intervalo estiverem preenchidos, validar
        if (formData.lunchStart && formData.lunchEnd) {
          const openTimeMinutes = timeStringToMinutes(formData.openTime);
          const closeTimeMinutes = timeStringToMinutes(formData.closeTime);
          const lunchStartMinutes = timeStringToMinutes(formData.lunchStart);
          const lunchEndMinutes = timeStringToMinutes(formData.lunchEnd);

          if (lunchStartMinutes >= lunchEndMinutes) {
            errors.lunchStart = 'Horário de início do almoço/intervalo deve ser anterior ao fim';
          }
          if (lunchStartMinutes < openTimeMinutes || lunchEndMinutes > closeTimeMinutes) {
            errors.lunchStart = 'Horário de almoço/intervalo deve estar dentro do horário de funcionamento';
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return;
      }

      // Preparar dados para envio
      const dataToSubmit: ScheduleFormData = {
        ...formData,
        dayOfWeek: formData.dayOfWeek,
        isOpen: formData.isOpen,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        lunchStart: formData.lunchStart,
        lunchEnd: formData.lunchEnd,
      };

      await onSubmit(dataToSubmit);
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Erro desconhecido ao salvar' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg mx-auto">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Fechar modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {initialData ? 'Editar Horário' : 'Novo Horário'} {isBarberSchedule ? 'do Barbeiro' : 'da Barbearia'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
            <select
              id="dayOfWeek"
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
              disabled={!!initialData} // Não permitir mudar o dia da semana na edição
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${initialData ? 'bg-gray-100' : ''}`}
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="isOpen"
              name="isOpen"
              type="checkbox"
              checked={formData.isOpen}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isOpen" className="ml-2 block text-sm text-gray-900">
              Aberto neste dia
            </label>
          </div>

          {formData.isOpen && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="openTime" className="block text-sm font-medium text-gray-700 mb-1">Horário de Abertura</label>
                  <input
                    type="time"
                    id="openTime"
                    name="openTime"
                    value={formData.openTime}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  />
                  {errors.openTime && <p className="text-xs text-red-600 mt-1">{errors.openTime}</p>}
                </div>
                <div>
                  <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700 mb-1">Horário de Fechamento</label>
                  <input
                    type="time"
                    id="closeTime"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                  />
                  {errors.closeTime && <p className="text-xs text-red-600 mt-1">{errors.closeTime}</p>}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Horário de Almoço (Opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="lunchStart" className="block text-sm font-medium text-gray-700 mb-1">Início do Almoço</label>
                    <input
                      type="time"
                      id="lunchStart"
                      name="lunchStart"
                      value={formData.lunchStart}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="lunchEnd" className="block text-sm font-medium text-gray-700 mb-1">Fim do Almoço</label>
                    <input
                      type="time"
                      id="lunchEnd"
                      name="lunchEnd"
                      value={formData.lunchEnd}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                    />
                  </div>
                </div>
                {errors.lunchTime && <p className="text-xs text-red-600 mt-1 col-span-2">{errors.lunchTime}</p>}
                {errors.lunchStart && <p className="text-xs text-red-600 mt-1">{errors.lunchStart}</p>}
                {errors.lunchEnd && <p className="text-xs text-red-600 mt-1">{errors.lunchEnd}</p>}
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row-reverse sm:items-center sm:justify-start gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (initialData ? 'Salvar Alterações' : 'Criar Horário')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-opacity disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};