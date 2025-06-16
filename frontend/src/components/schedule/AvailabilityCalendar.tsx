import React, { useState, useEffect } from 'react';
import { AvailabilityResponse, TimeSlot, BarberAvailability } from '../../types/schedule';

export interface AvailabilityCalendarProps {
  barbershopId?: string;
  barberId?: string;
  availability?: AvailabilityResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onDateSelect?: (date: string) => void;
  onCheckAvailability?: (date: string, serviceDuration?: number) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  barbershopId: _propsBarbershopId,
  barberId: _propsBarberId,
  availability,
  isLoading = false,
  error = null,
  onDateSelect,
  onCheckAvailability
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceDuration, setServiceDuration] = useState<number>(30);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleCheckAvailabilityClick = () => {
    onCheckAvailability?.(selectedDate, serviceDuration);
  };
  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysArray: (number | null)[] = [];

    // Preencher com nulos antes do primeiro dia
    for (let i = 0; i < firstDayWeekday; i++) {
      daysArray.push(null);
    }

    // Preencher os dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i);
    }

    // Preencher com nulos até completar a grade 6x7 (42 células)
    while (daysArray.length < 42) {
      daysArray.push(null);
    }

    return daysArray;
  };

  useEffect(() => {
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  }, [selectedDate, onDateSelect]);

  const renderAvailability = () => {
    if (!availability) return null;
    
    // Verifica se há exceção global que impede abertura
    if (availability.globalException?.type === 'CLOSED') {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">Barbearia fechada nesta data</p>
          <p className="text-red-600 text-sm mt-1">
            Motivo: {availability.globalException.reason}
          </p>
        </div>
      );
    }

    // Filtra barbeiro específico se foi solicitado
    const selectedBarber = _propsBarberId
      ? availability.barbers.find(b => b.barberId === _propsBarberId)
      : null;

    if (selectedBarber) {
      // Visualização de barbeiro específico
      return (
        <div>
          <h3 className="text-lg font-medium mb-4">{selectedBarber.barberName}</h3>
          {!selectedBarber.isWorking ? (
            <p className="text-yellow-600">Barbeiro não trabalha neste dia</p>
          ) : (
            <div>
              {selectedBarber.availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {selectedBarber.availableSlots.map((slot: TimeSlot, index: number) => (
                    <button
                      key={index}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-yellow-600">Sem horários disponíveis</p>
              )}
              {selectedBarber.exception && (
                <p className="text-sm text-gray-500 mt-2">
                  Observação: {selectedBarber.exception.reason}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Visualização de todos os barbeiros
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Disponibilidade por Barbeiro</h3>
        <div className="space-y-6">
          {availability.barbers.map((barber: BarberAvailability) => (
            <div key={barber.barberId} className="border-b pb-4">
              <h4 className="font-medium mb-2">{barber.barberName}</h4>
              {!barber.isWorking ? (
                <p className="text-yellow-600">Não trabalha neste dia</p>
              ) : (
                <div>
                  {barber.availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {barber.availableSlots.map((slot: TimeSlot, index: number) => (
                        <button
                          key={index}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          {slot.start} - {slot.end}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-yellow-600">Sem horários disponíveis</p>
                  )}
                  {barber.exception && (
                    <p className="text-sm text-gray-500 mt-2">
                      Observação: {barber.exception.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Verificar Disponibilidade</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              ←
            </button>
            <span className="text-gray-700">
              {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center py-2 text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          {getDaysInMonth(currentMonth).map((day, index) => (
            <button
              key={index}
              onClick={() => {
                if (day) {
                  const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  handleDateSelect(dateString);
                }
              }}
              disabled={!day || new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day || 1) < new Date()}
              className={`
                py-2 rounded-md text-sm
                ${!day ? 'invisible' : ''}
                ${selectedDate === `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day || 1) < new Date()
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              {day || ''}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Duração do Serviço (minutos)
        </label>
        <select
          value={serviceDuration}
          onChange={(e) => setServiceDuration(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>1 hora</option>
          <option value={90}>1 hora e 30 minutos</option>
          <option value={120}>2 horas</option>
        </select>
      </div>

      <button
        onClick={handleCheckAvailabilityClick}
        disabled={isLoading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Verificando...' : 'Verificar Disponibilidade'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderAvailability()
        )}
      </div>
    </div>
  );
};