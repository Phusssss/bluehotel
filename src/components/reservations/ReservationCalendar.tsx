import React from 'react';
import { Calendar, Badge, Card } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import type { Reservation } from '../../types';

interface ReservationCalendarProps {
  reservations: Reservation[];
  onDateSelect?: (date: Dayjs) => void;
}

export const ReservationCalendar: React.FC<ReservationCalendarProps> = ({
  reservations,
  onDateSelect,
}) => {
  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    
    const checkIns = reservations.filter(r => r.checkInDate === dateStr);
    const checkOuts = reservations.filter(r => r.checkOutDate === dateStr);
    
    const listData = [];
    
    if (checkIns.length > 0) {
      listData.push({
        type: 'success' as const,
        content: `${checkIns.length} Check-in`,
      });
    }
    
    if (checkOuts.length > 0) {
      listData.push({
        type: 'warning' as const,
        content: `${checkOuts.length} Check-out`,
      });
    }
    
    return listData;
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card title="Lịch đặt phòng">
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={onDateSelect}
      />
    </Card>
  );
};