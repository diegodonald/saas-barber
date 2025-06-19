import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CreateAppointmentData } from '../../types/appointment';
import { useAuth } from '../../contexts/AuthContext';
import { AvailabilityCalendar } from '../schedule/AvailabilityCalendar';
import { useSchedule } from '../../hooks/useSchedule';

// Schema de validação
const appointmentSchema = z.object({
  barbershopId: z.string().min(1, 'Barbearia é obrigatória'),
  barberId: z.string().min(1, 'Barbeiro é obrigatório'),
  serviceId: z.string().min(1, 'Serviço é obrigatório'),
  startTime: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  barbershopId: string;
  onSubmit: (data: CreateAppointmentData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateAppointmentData>;
}

// Mock data - em um projeto real, estes dados viriam de APIs
const mockBarbers = [
  { id: 'barber1', name: 'João Silva', user: { name: 'João Silva' } },
  { id: 'barber2', name: 'Pedro Santos', user: { name: 'Pedro Santos' } },
];

const mockServices = [
  { id: 'service1', name: 'Corte Masculino', price: 25, duration: 30 },
  { id: 'service2', name: 'Barba', price: 15, duration: 20 },
  { id: 'service3', name: 'Corte + Barba', price: 35, duration: 45 },
];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  barbershopId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      barbershopId,
      ...initialData
    }
  });

  const watchedBarberId = watch('barberId');
  const watchedServiceId = watch('serviceId');

  // Hook para disponibilidade
  const {
    availability,
    isLoadingAvailability,
    availabilityError,
    checkAvailability
  } = useSchedule({
    barbershopId,
    barberId: watchedBarberId
  });

  // Atualizar serviço selecionado quando serviceId mudar
  useEffect(() => {
    if (watchedServiceId) {
      const service = mockServices.find(s => s.id === watchedServiceId);
      setSelectedService(service);
    }
  }, [watchedServiceId]);

  // Verificar disponibilidade quando barbeiro ou data mudarem
  useEffect(() => {
    if (watchedBarberId && selectedDate) {
      const serviceDuration = selectedService?.duration || 30;
      checkAvailability(selectedDate, { serviceDuration });
    }
  }, [watchedBarberId, selectedDate, selectedService, checkAvailability]);

  // Handler para seleção de data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(''); // Limpar horário selecionado
  };

  // Handler para seleção de horário
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    // Combinar data e hora para criar o startTime
    const startTime = `${selectedDate}T${time}:00`;
    setValue('startTime', startTime);
  };

  // Handler para submissão do formulário
  const handleFormSubmit = async (data: AppointmentFormData) => {
    try {
      const appointmentData: CreateAppointmentData = {
        ...data,
        clientId: user?.id, // Para clientes criando seus próprios agendamentos
      };
      
      await onSubmit(appointmentData);
      reset();
      setSelectedDate('');
      setSelectedTime('');
      setSelectedService(null);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Novo Agendamento</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário à esquerda */}
          <div className="space-y-4">
            {/* Seleção de barbeiro */}
            <div>
              <label htmlFor="barberId" className="block text-sm font-medium text-gray-700 mb-1">
                Barbeiro *
              </label>
              <select
                {...register('barberId')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Selecione um barbeiro</option>
                {mockBarbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.user.name}
                  </option>
                ))}
              </select>
              {errors.barberId && (
                <p className="mt-1 text-sm text-red-600">{errors.barberId.message}</p>
              )}
            </div>

            {/* Seleção de serviço */}
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
                Serviço *
              </label>
              <select
                {...register('serviceId')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Selecione um serviço</option>
                {mockServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - R$ {service.price} ({service.duration} min)
                  </option>
                ))}
              </select>
              {errors.serviceId && (
                <p className="mt-1 text-sm text-red-600">{errors.serviceId.message}</p>
              )}
            </div>

            {/* Resumo do serviço selecionado */}
            {selectedService && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Serviço Selecionado</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>{selectedService.name}</strong></p>
                  <p>Duração: {selectedService.duration} minutos</p>
                  <p>Preço: R$ {selectedService.price}</p>
                </div>
              </div>
            )}

            {/* Data e horário selecionados */}
            {selectedDate && selectedTime && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">Agendamento</h4>
                <div className="text-sm text-green-800">
                  <p>Data: {format(new Date(selectedDate), 'dd/MM/yyyy')}</p>
                  <p>Horário: {selectedTime}</p>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Observações adicionais (opcional)"
              />
            </div>
          </div>

          {/* Calendário à direita */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selecione Data e Horário</h3>
            
            {!watchedBarberId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  Selecione um barbeiro para ver a disponibilidade
                </p>
              </div>
            ) : (
              <AvailabilityCalendar
                barbershopId={barbershopId}
                barberId={watchedBarberId}
                availability={availability}
                isLoading={isLoadingAvailability}
                error={availabilityError}
                onDateSelect={handleDateSelect}
                onCheckAvailability={(date, serviceDuration) => {
                  checkAvailability(date, { serviceDuration });
                }}
              />
            )}

            {/* Seleção de horário */}
            {selectedDate && availability && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Horários Disponíveis</h4>
                <div className="grid grid-cols-3 gap-2">
                  {availability.barbers?.[0]?.availableSlots?.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTimeSelect(slot.start)}
                      className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                        selectedTime === slot.start
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {slot.start}
                    </button>
                  )) || (
                    <p className="col-span-3 text-sm text-gray-500">
                      Nenhum horário disponível para esta data
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedDate || !selectedTime}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando...' : 'Criar Agendamento'}
          </button>
        </div>
      </form>
    </div>
  );
};
