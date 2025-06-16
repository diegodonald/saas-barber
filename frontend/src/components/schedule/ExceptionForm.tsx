import React, { useState, useEffect } from 'react';
import { ExceptionType, EXCEPTION_TYPE_LABELS, timeStringToMinutes, minutesToTimeString } from '../../types/schedule';

// Definindo o tipo para initialData explicitamente
interface ExceptionInitialData {
  date: string;
  type: ExceptionType;
  description: string;
  openTime: number | null;
  closeTime: number | null;
}

// Tipo para os dados do formulário
interface ExceptionFormData {
  date: string;
  type: ExceptionType;
  description: string;
  openTime: string;
  closeTime: string;
}

export interface ExceptionFormProps {
  initialData?: ExceptionInitialData; // Adicionado initialData aqui
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExceptionFormData) => Promise<void>; // Mantendo any por enquanto, idealmente seria um tipo mais específico
  isBarberException: boolean; // Adicionado para diferenciar a lógica do formulário se necessário
}

export const ExceptionForm: React.FC<ExceptionFormProps> = ({
  initialData, // Usando a prop initialData
  isOpen,
  onClose,
  onSubmit,
  isBarberException // Recebendo a prop
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    type: initialData?.type ?? ExceptionType.CLOSED,
    description: initialData?.description ?? '',
    openTime: initialData?.openTime !== null && initialData?.openTime !== undefined ? minutesToTimeString(initialData.openTime) : '09:00',
    closeTime: initialData?.closeTime !== null && initialData?.closeTime !== undefined ? minutesToTimeString(initialData.closeTime) : '18:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date, // Espera-se que a data já venha no formato YYYY-MM-DD
        type: initialData.type,
        description: initialData.description,
        openTime: initialData.openTime !== null && initialData.openTime !== undefined ? minutesToTimeString(initialData.openTime) : '09:00',
        closeTime: initialData.closeTime !== null && initialData.closeTime !== undefined ? minutesToTimeString(initialData.closeTime) : '18:00',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: ExceptionType.CLOSED,
        description: '',
        openTime: '09:00',
        closeTime: '18:00',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validar os dados
      const errors: Record<string, string> = {};

      if (!formData.date) {
        errors.date = 'Data é obrigatória';
      }

      if (!formData.description) {
        errors.description = 'Descrição é obrigatória';
      }

      // Se for horário especial, validar os horários
      if (formData.type === ExceptionType.SPECIAL_HOURS) {
        if (!formData.openTime) {
          errors.openTime = 'Horário de abertura é obrigatório para horário especial';
        }
        if (!formData.closeTime) {
          errors.closeTime = 'Horário de fechamento é obrigatório para horário especial';
        }

        if (formData.openTime && formData.closeTime) {
          const openTimeMinutes = timeStringToMinutes(formData.openTime);
          const closeTimeMinutes = timeStringToMinutes(formData.closeTime);

          if (openTimeMinutes >= closeTimeMinutes) {
            errors.openTime = 'Horário de abertura deve ser anterior ao fechamento';
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return;
      }

      // Preparar dados para envio
      const dataToSubmit: ExceptionFormData = {
        ...formData,
        date: formData.date,
        type: formData.type,
        description: formData.description,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
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
          {initialData ? 'Editar Exceção' : 'Nova Exceção'} {isBarberException ? 'do Barbeiro' : 'da Barbearia'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={!!initialData} // Não permitir mudar a data na edição
              className={`mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${initialData ? 'bg-gray-100' : ''}`}
            />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Exceção</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
              {Object.entries(EXCEPTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição / Motivo</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {(formData.type === ExceptionType.SPECIAL_HOURS || formData.type === ExceptionType.AVAILABLE) && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Horário Especial (Opcional se {EXCEPTION_TYPE_LABELS[ExceptionType.AVAILABLE]})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="openTime" className="block text-sm font-medium text-gray-700 mb-1">Abertura Especial</label>
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
                    <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700 mb-1">Fechamento Especial</label>
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
              ) : (initialData ? 'Salvar Alterações' : 'Criar Exceção')}
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