
import React, { useState, useMemo } from 'react';
import { Booking, Client, Driver, UserRole, BookingStatus, PaymentStatus } from '../types';
import { BookingCard } from './BookingCard';

interface OwnerViewProps {
  bookings: Booking[];
  drivers: Driver[];
  clients: Client[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

const Calendar: React.FC<{ bookings: Booking[], onDateSelect: (date: Date) => void, selectedDate: Date }> = ({ bookings, onDateSelect, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const bookingsByDay = useMemo(() => {
        const map = new Map<string, number>();
        bookings.forEach(booking => {
            const dateStr = booking.pickupTime.toISOString().split('T')[0];
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        });
        return map;
    }, [bookings]);

    const changeMonth = (amount: number) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };
    
    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return [...blanks, ...days].map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="p-2 border border-gray-800"></div>;

            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const hasBooking = bookingsByDay.has(dateStr);
            const isSelected = selectedDate.toISOString().split('T')[0] === dateStr;

            return (
                <div key={day} onClick={() => onDateSelect(date)} className={`p-2 border cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-yellow-500 text-black' : 'border-gray-800 hover:bg-gray-800'}`}>
                    <div className="text-center font-semibold">{day}</div>
                    {hasBooking && <div className="flex justify-center mt-1"><span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-black' : 'bg-yellow-500'}`}></span></div>}
                </div>
            );
        });
    };

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-8">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-700 rounded">&lt;</button>
                <h3 className="text-xl font-bold text-yellow-400">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-700 rounded">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-400 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
    );
}

export const OwnerView: React.FC<OwnerViewProps> = ({ bookings, drivers, clients, onUpdateBooking }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('');

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => b.pickupTime.toDateString() === selectedDate.toDateString())
      .filter(b => !filterDriver || b.driverId === filterDriver)
      .filter(b => !filterPayment || b.paymentStatus === filterPayment)
      .sort((a,b) => a.pickupTime.getTime() - b.pickupTime.getTime());
  }, [bookings, selectedDate, filterDriver, filterPayment]);
  
  return (
    <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Owner Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Calendar bookings={bookings} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                 <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-bold mb-4">Filters for {selectedDate.toLocaleDateString()}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Filter by Driver</label>
                            <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500">
                                <option value="">All Drivers</option>
                                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Filter by Payment Status</label>
                            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500">
                                <option value="">All Statuses</option>
                                {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Bookings for {selectedDate.toLocaleDateString()}</h2>
                {filteredBookings.length > 0 ? (
                    filteredBookings.map(booking => (
                        <BookingCard key={booking.id} booking={booking} role={UserRole.Owner} drivers={drivers} clients={clients} onUpdateBooking={onUpdateBooking} />
                    ))
                ) : (
                    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-lg p-12 text-center text-gray-400">
                        <p>No bookings for the selected date and filters.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
   