import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, Badge, message } from 'antd';
import dayjs from 'dayjs';
import type { Reservation } from '../../types';

interface DragDropCalendarProps {
  reservations: Reservation[];
  rooms: Array<{ id: string; number: string; type: string }>;
  onMoveReservation: (reservationId: string, newRoomId: string, newDate?: string) => Promise<void>;
  onReservationClick: (reservation: Reservation) => void;
}

interface DragItem {
  type: string;
  reservation: Reservation;
}

const ReservationCard: React.FC<{
  reservation: Reservation;
  onClick: () => void;
}> = ({ reservation, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'reservation',
    item: { type: 'reservation', reservation },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Card
      ref={drag}
      size="small"
      className={`cursor-move mb-1 ${isDragging ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <div className="text-xs">
        <div className="font-medium truncate">{reservation.guestName}</div>
        <div className="text-gray-500">
          {dayjs(reservation.checkInDate).format('MMM DD')} - {dayjs(reservation.checkOutDate).format('MMM DD')}
        </div>
        <Badge
          status={reservation.status === 'confirmed' ? 'success' : 
                 reservation.status === 'checked-in' ? 'processing' : 'default'}
          text={reservation.status}
        />
      </div>
    </Card>
  );
};

const RoomColumn: React.FC<{
  room: { id: string; number: string; type: string };
  reservations: Reservation[];
  onDrop: (reservationId: string, roomId: string) => void;
  onReservationClick: (reservation: Reservation) => void;
}> = ({ room, reservations, onDrop, onReservationClick }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'reservation',
    drop: (item: DragItem) => {
      if (item.reservation.roomId !== room.id) {
        onDrop(item.reservation.id, room.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`border rounded p-2 min-h-96 ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
    >
      <div className="font-medium mb-2 text-center">
        Room {room.number}
        <div className="text-xs text-gray-500">{room.type}</div>
      </div>
      <div className="space-y-1">
        {reservations.map(reservation => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onClick={() => onReservationClick(reservation)}
          />
        ))}
      </div>
    </div>
  );
};

const TimelineView: React.FC<{
  reservations: Reservation[];
  rooms: Array<{ id: string; number: string; type: string }>;
  onMoveReservation: (reservationId: string, newRoomId: string, newDate?: string) => Promise<void>;
  onReservationClick: (reservation: Reservation) => void;
}> = ({ reservations, rooms, onMoveReservation, onReservationClick }) => {
  const [loading, setLoading] = useState(false);

  const handleDrop = async (reservationId: string, newRoomId: string) => {
    try {
      setLoading(true);
      await onMoveReservation(reservationId, newRoomId);
      message.success('Reservation moved successfully');
    } catch (error) {
      message.error('Failed to move reservation');
    } finally {
      setLoading(false);
    }
  };

  const getReservationsForRoom = (roomId: string) => {
    return reservations.filter(res => res.roomId === roomId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map(room => (
        <RoomColumn
          key={room.id}
          room={room}
          reservations={getReservationsForRoom(room.id)}
          onDrop={handleDrop}
          onReservationClick={onReservationClick}
        />
      ))}
    </div>
  );
};

export const DragDropCalendar: React.FC<DragDropCalendarProps> = ({
  reservations,
  rooms,
  onMoveReservation,
  onReservationClick
}) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Room Timeline</h3>
          <p className="text-sm text-gray-600">Drag reservations between rooms to reassign</p>
        </div>
        <TimelineView
          reservations={reservations}
          rooms={rooms}
          onMoveReservation={onMoveReservation}
          onReservationClick={onReservationClick}
        />
      </div>
    </DndProvider>
  );
};