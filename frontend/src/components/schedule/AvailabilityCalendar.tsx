import React, { useState, useEffect } from 'react';
import { AvailabilityResponse, BarberAvailability, minutesToTimeString } from '../../types/schedule';

export interface AvailabilityCalendarProps {
  barbershopId?: string;
  barberId?: string;
  availability?: AvailabilityResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onDateSelect?: (date: string) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  barbershopId,
  barberId,
  availability,
  isLoading = false,
  error = null,
  onDateSelect
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Atualizar data selecionada e buscar disponibilidade
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // Gerar dias do mês atual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Adicionar dias vazios do início do mês
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        isPast: new Date(dateString) < new Date(new Date().toISOString().split('T')[0])
      });
    }

    return days;
  };

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Renderizar informações de disponibilidade para a data selecionada
  const renderAvailabilityInfo = () => {
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
            onClick={() => onDateSelect?.(selectedDate)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    if (!availability) {
      return (
        <div className="text-center py-8 text-gray-600">
          <p>Selecione uma data para ver a disponibilidade</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">
            Disponibilidade para {new Date(selectedDate).toLocaleDateString('pt-BR')}
          </h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            availability.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {availability.isAvailable ? 'Disponível' : 'Indisponível'}
          </span>
        </div>

        {availability.isAvailable ? (
          <div className="space-y-4">
            {/* Horários Globais */}
            {availability.globalSchedule && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Horário da Barbearia</h5>
                <p className="text-sm text-blue-800">
                  {minutesToTimeString(availability.globalSchedule.openTime)} às {' '}
                  {minutesToTimeString(availability.globalSchedule.closeTime)}
                </p>
                {availability.globalSchedule.lunchStart && availability.globalSchedule.lunchEnd && (
                  <p className="text-sm text-blue-700 mt-1">
                    Almoço: {minutesToTimeString(availability.globalSchedule.lunchStart)} às {' '}
                    {minutesToTimeString(availability.globalSchedule.lunchEnd)}
                  </p>
                )}
              </div>
            )}

            {/* Barbeiros Disponíveis */}
            {availability.availableBarbers && availability.availableBarbers.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Barbeiros Disponíveis</h5>
                <div className="grid gap-3">
                  {availability.availableBarbers.map((barber: BarberAvailability) => (
                    <div key={barber.barberId} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-medium text-gray-900">{barber.barberName}</h6>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          barber.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {barber.isAvailable ? 'Disponível' : 'Indisponível'}
                        </span>
                      </div>
                      
                      {barber.isAvailable && barber.schedule && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Horário:</span> {' '}
                            {minutesToTimeString(barber.schedule.openTime)} às {minutesToTimeString(barber.schedule.closeTime)}
                          </p>
                          {barber.schedule.lunchStart && barber.schedule.lunchEnd && (
                            <p>
                              <span className="font-medium">Almoço:</span> {' '}
                              {minutesToTimeString(barber.schedule.lunchStart)} às {minutesToTimeString(barber.schedule.lunchEnd)}
                            </p>
                          )}
                        </div>
                      )}

                      {!barber.isAvailable && barber.reason && (
                        <p className="text-sm text-red-600 mt-1">
                          <span className="font-medium">Motivo:</span> {barber.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exceções Ativas */}
            {availability.activeExceptions && availability.activeExceptions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-medium text-yellow-900 mb-2">Exceções Ativas</h5>
                <div className="space-y-2">
                  {availability.activeExceptions.map((exception: any, index: number) => (
                    <div key={index} className="text-sm text-yellow-800">
                      <p className="font-medium">{exception.description}</p>
                      {exception.openTime && exception.closeTime && (
                        <p>Horário especial: {minutesToTimeString(exception.openTime)} às {minutesToTimeString(exception.closeTime)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="font-medium text-red-900 mb-2">Não Disponível</h5>
            <p className="text-sm text-red-800">
              {availability.reason || 'Não há disponibilidade para esta data.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    // Buscar disponibilidade para a data inicial
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendário */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2"></div>;
            }

            return (
              <button
                key={day.date}
                onClick={() => !day.isPast && handleDateSelect(day.date)}
                disabled={day.isPast}
                className={`p-2 text-sm rounded-md transition-colors ${
                  day.isPast
                    ? 'text-gray-300 cursor-not-allowed'
                    : day.isSelected
                    ? 'bg-blue-600 text-white'
                    : day.isToday
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 rounded"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Disponível</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informações de Disponibilidade */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informações de Disponibilidade
        </h3>
        {renderAvailabilityInfo()}
      </div>
    </div>
  );
};