
import React, { useMemo } from 'react';
import { Booking, Client, Driver, UserRole, BookingStatus } from '../types';
import { BookingCard } from './BookingCard';

interface DriverViewProps {
  bookings: Booking[];
  drivers: Driver[];
  clients: Client[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

// Mocked current driver
const currentDriverId = '1';

export const DriverView: React.FC<DriverViewProps> = ({ bookings, drivers, clients, onUpdateBooking }) => {

  const driverName = drivers.find(d => d.id === currentDriverId)?.name || 'Driver';

  const driverBookings = useMemo(() => {
    return bookings
      .filter(b => b.driverId === currentDriverId)
      .sort((a, b) => {
        if (a.status === BookingStatus.Completed) return 1;
        if (b.status === BookingStatus.Completed) return -1;
        return a.pickupTime.getTime() - b.pickupTime.getTime();
      });
  }, [bookings]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">Welcome, {driverName}</h1>
      <p className="text-gray-400 mb-6">Here are your assigned trips.</p>
      
      {driverBookings.length > 0 ? (
        driverBookings.map(booking => (
          <BookingCard key={booking.id} booking={booking} role={UserRole.Driver} drivers={drivers} clients={clients} onUpdateBooking={onUpdateBooking} />
        ))
      ) : (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-lg p-12 text-center text-gray-400">
          <p>You have no assigned trips at the moment.</p>
        </div>
      )}
    </div>
  );
};
   