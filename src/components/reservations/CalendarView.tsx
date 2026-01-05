import React, { useState, useMemo } from 'react';
import { Calendar, Badge, Select, Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { Reservation } from '../../types';

interface CalendarViewProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onDateSelect: (date: string) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  onReservationClick,
  onDateSelect
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());

  const getReservationsForDate = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return reservations.filter(res => 
      dateStr >= res.checkInDate && dateStr < res.checkOutDate
    );
  };

  const dateCellRender = (date: Dayjs) => {
    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length === 0) return null;

    return (
      <div className="space-y-1">
        {dayReservations.slice(0, 3).map(res => (
          <Tooltip key={res.id} title={`${res.guestName} - Room ${res.roomNumber}`}>
            <Badge
              status={res.status === 'confirmed' ? 'success' : 
                     res.status === 'checked-in' ? 'processing' : 'default'}
              text={res.guestName.split(' ')[0]}
              className="text-xs cursor-pointer truncate block"
              onClick={(e) => {
                e.stopPropagation();
                onReservationClick(res);
              }}
            />
          </Tooltip>
        ))}
        {dayReservations.length > 3 && (
          <div className="text-xs text-gray-500">+{dayReservations.length - 3} more</div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = currentDate.startOf('week');
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

    return (
      <div className="grid grid-cols-7 gap-2 h-96">
        {days.map(day => {
          const dayReservations = getReservationsForDate(day);
          return (
            <div key={day.format('YYYY-MM-DD')} className="border rounded p-2">
              <div className="font-medium text-center mb-2">
                {day.format('ddd DD')}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-80">
                {dayReservations.map(res => (
                  <div
                    key={res.id}
                    className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200"
                    onClick={() => onReservationClick(res)}
                  >
                    <div className="font-medium truncate">{res.guestName}</div>
                    <div className="text-gray-600">Room {res.roomNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayReservations = getReservationsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border rounded">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium">{currentDate.format('dddd, MMMM DD, YYYY')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <h4 className="font-medium mb-2">Check-ins</h4>
            {dayReservations
              .filter(res => res.checkInDate === currentDate.format('YYYY-MM-DD'))
              .map(res => (
                <div
                  key={res.id}
                  className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => onReservationClick(res)}
                >
                  <div className="font-medium">{res.guestName}</div>
                  <div className="text-sm text-gray-600">Room {res.roomNumber}</div>
                  <div className="text-xs text-gray-500">{res.checkInTime || '15:00'}</div>
                </div>
              ))}
          </div>
          <div>
            <h4 className="font-medium mb-2">Check-outs</h4>
            {dayReservations
              .filter(res => res.checkOutDate === currentDate.format('YYYY-MM-DD'))
              .map(res => (
                <div
                  key={res.id}
                  className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => onReservationClick(res)}
                >
                  <div className="font-medium">{res.guestName}</div>
                  <div className="text-sm text-gray-600">Room {res.roomNumber}</div>
                  <div className="text-xs text-gray-500">{res.checkOutTime || '11:00'}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const navigate = (direction: 'prev' | 'next') => {
    const unit = viewMode === 'day' ? 'day' : viewMode === 'week' ? 'week' : 'month';
    setCurrentDate(prev => direction === 'next' ? prev.add(1, unit) : prev.subtract(1, unit));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button icon={<LeftOutlined />} onClick={() => navigate('prev')} />
          <Button icon={<RightOutlined />} onClick={() => navigate('next')} />
          <Button onClick={() => setCurrentDate(dayjs())}>Today</Button>
        </div>
        
        <Select
          value={viewMode}
          onChange={setViewMode}
          options={[
            { label: 'Month', value: 'month' },
            { label: 'Week', value: 'week' },
            { label: 'Day', value: 'day' }
          ]}
        />
      </div>

      {viewMode === 'month' && (
        <Calendar
          value={currentDate}
          onSelect={(date) => {
            setCurrentDate(date);
            onDateSelect(date.format('YYYY-MM-DD'));
          }}
          dateCellRender={dateCellRender}
        />
      )}
      
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
};