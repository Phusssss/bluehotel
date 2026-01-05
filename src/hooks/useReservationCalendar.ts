import { useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { Reservation } from '../types';

dayjs.extend(isSameOrAfter);

interface Room {
  id: string;
  number: string;
  type: string;
}

export const useReservationCalendar = (
  reservations: Reservation[],
  rooms: Room[],
  viewType: 'month' | 'week' | 'day'
) => {
  // Organize reservations by room
  const reservationsByRoom = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = reservations.filter(
        res => res.roomId === room.id && !['cancelled'].includes(res.status)
      );
      return acc;
    }, {} as Record<string, Reservation[]>);
  }, [reservations, rooms]);

  // Calculate room availability percentage per day
  const calculateOccupancy = useMemo(() => {
    return (date: Dayjs) => {
      const dateStr = date.format('YYYY-MM-DD');
      const occupiedRooms = Object.entries(reservationsByRoom).filter(([_, res]) => {
        return res.some(r => {
          const checkIn = dayjs(r.checkInDate);
          const checkOut = dayjs(r.checkOutDate);
          return date.isSameOrAfter(checkIn) && date.isBefore(checkOut);
        });
      }).length;
      
      return Math.round((occupiedRooms / rooms.length) * 100);
    };
  }, [reservationsByRoom, rooms.length]);

  // Detect double bookings
  const findConflicts = useMemo(() => {
    return () => {
      const conflicts: Array<{
        roomId: string;
        date: string;
        reservations: Reservation[];
      }> = [];
      
      Object.entries(reservationsByRoom).forEach(([roomId, res]) => {
        for (let i = 0; i < res.length; i++) {
          for (let j = i + 1; j < res.length; j++) {
            const r1 = res[i], r2 = res[j];
            if (dayjs(r1.checkInDate).isBefore(dayjs(r2.checkOutDate)) &&
                dayjs(r1.checkOutDate).isAfter(dayjs(r2.checkInDate))) {
              conflicts.push({
                roomId,
                date: r1.checkInDate,
                reservations: [r1, r2]
              });
            }
          }
        }
      });
      
      return conflicts;
    };
  }, [reservationsByRoom]);

  // Get reservations for specific date range
  const getReservationsInRange = useMemo(() => {
    return (startDate: Dayjs, endDate: Dayjs) => {
      return reservations.filter(res => {
        const checkIn = dayjs(res.checkInDate);
        const checkOut = dayjs(res.checkOutDate);
        return checkIn.isBefore(endDate) && checkOut.isAfter(startDate);
      });
    };
  }, [reservations]);

  // Calculate revenue for date range
  const calculateRevenue = useMemo(() => {
    return (startDate: Dayjs, endDate: Dayjs) => {
      const rangeReservations = getReservationsInRange(startDate, endDate);
      return rangeReservations.reduce((total, res) => total + (res.totalPrice || 0), 0);
    };
  }, [getReservationsInRange]);

  return {
    reservationsByRoom,
    calculateOccupancy,
    findConflicts,
    getReservationsInRange,
    calculateRevenue,
  };
};