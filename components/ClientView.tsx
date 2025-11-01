import React, { useState } from 'react';
import { api } from '../services/mockApiService';
import { Booking, BookingType, Client, Driver, UserRole } from '../types';
import { BookingCard } from './BookingCard';

interface ClientViewProps {
  bookings: Booking[];
  drivers: Driver[];
  clients: Client[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onAddBooking: (booking: Booking) => void;
}

// Mocked current client
const currentClientId = '1'; 

export const ClientView: React.FC<ClientViewProps> = ({ bookings, drivers, clients, onUpdateBooking, onAddBooking }) => {
  const [bookingType, setBookingType] = useState<BookingType>(BookingType.PointToPoint);
  const [pickupLocation, setPickupLocation] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [durationHours, setDurationHours] = useState(3);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAirportPickup, setIsAirportPickup] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');

  const clientBookings = bookings.filter(b => b.clientId === currentClientId).sort((a, b) => b.pickupTime.getTime() - a.pickupTime.getTime());

  const handleAddStop = () => {
    setStops([...stops, '']);
  };

  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLocation || !pickupDate || !pickupTime || (bookingType === BookingType.PointToPoint && !dropoffLocation) || (isAirportPickup && (!flightNumber || !airline))) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);

    let newBookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus' | 'driverId' | 'totalFare' | 'flightInfo'>;
    
    const commonBookingProps = {
        clientId: currentClientId,
        pickupTime: new Date(`${pickupDate}T${pickupTime}`),
        passengers,
        specialRequests,
        isAirportPickup,
        flightNumber: isAirportPickup ? flightNumber : undefined,
        airline: isAirportPickup ? airline : undefined,
    };

    if (bookingType === BookingType.Hourly) {
        newBookingData = {
            ...commonBookingProps,
            bookingType,
            pickupLocation,
            dropoffLocation: `As Directed for ${durationHours} hours`,
            durationHours,
        };
    } else { // PointToPoint
        newBookingData = {
            ...commonBookingProps,
            bookingType,
            pickupLocation,
            stops: stops.filter(s => s.trim() !== ''),
            dropoffLocation,
        };
    }
    
    try {
        const newBooking = await api.createBooking(newBookingData);
        onAddBooking(newBooking);

        const client = clients.find(c => c.id === currentClientId);
        if (client) {
            const message = `WAYNE LIMO: Your booking request #${newBooking.id} for ${newBooking.pickupTime.toLocaleString()} has been received. We'll send a confirmation once a driver is assigned.`;
            await api.sms.send(client.phone, message);
        }

        alert(`Booking requested! You will receive an SMS confirmation shortly. Your booking ID is #${newBooking.id}.`);
        // Reset form
        setBookingType(BookingType.PointToPoint);
        setPickupLocation('');
        setStops([]);
        setDropoffLocation('');
        setDurationHours(3);
        setPickupDate('');
        setPickupTime('');
        setPassengers(1);
        setSpecialRequests('');
        setIsAirportPickup(false);
        setFlightNumber('');
        setAirline('');
    } catch(error) {
        alert('There was an error creating your booking. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Book a Ride</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Service Type</label>
              <div className="flex bg-gray-800 border border-gray-600 rounded-md p-1">
                <button type="button" onClick={() => setBookingType(BookingType.PointToPoint)} className={`flex-1 text-center text-sm py-2 rounded-md transition ${bookingType === BookingType.PointToPoint ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-gray-700'}`}>Point-to-Point</button>
                <button type="button" onClick={() => setBookingType(BookingType.Hourly)} className={`flex-1 text-center text-sm py-2 rounded-md transition ${bookingType === BookingType.Hourly ? 'bg-yellow-500 text-black font-bold' : 'hover:bg-gray-700'}`}>Hourly</button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Pickup Location</label>
              <input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAirportPickup} 
                  onChange={e => setIsAirportPickup(e.target.checked)}
                  className="bg-gray-800 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"
                />
                <span>Airport Pickup (requires flight info)</span>
              </label>
            </div>

            {isAirportPickup && (
              <div className="p-4 bg-gray-800/50 rounded-md border border-gray-700 space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">Airline</label>
                      <input type="text" value={airline} onChange={e => setAirline(e.target.value)} placeholder="e.g., United" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required={isAirportPickup} />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-400">Flight Number</label>
                      <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="e.g., UA123" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required={isAirportPickup} />
                    </div>
                </div>
              </div>
            )}

            {bookingType === BookingType.PointToPoint ? (
              <>
                <div>
                  <label className="text-sm text-gray-400">Additional Stops</label>
                  {stops.map((stop, index) => (
                    <div key={index} className="flex items-center space-x-2 mt-1">
                      <input type="text" value={stop} onChange={(e) => handleStopChange(index, e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500" placeholder={`Stop ${index + 1}`} />
                      <button type="button" onClick={() => handleRemoveStop(index)} className="p-2 bg-red-600/50 hover:bg-red-600 rounded-full text-white leading-none h-8 w-8 flex-shrink-0">&times;</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddStop} className="mt-2 text-sm text-yellow-400 hover:text-yellow-300 w-full text-left p-2 bg-gray-800/50 rounded-md text-center">+ Add a stop</button>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Drop-off Location</label>
                  <input type="text" value={dropoffLocation} onChange={e => setDropoffLocation(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required={bookingType === BookingType.PointToPoint} />
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm text-gray-400">Duration (hours)</label>
                <input type="number" value={durationHours} onChange={e => setDurationHours(parseInt(e.target.value, 10))} min="2" max="12" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required />
              </div>
            )}

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-sm text-gray-400">Date</label>
                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400">Time</label>
                <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Passengers</label>
              <input type="number" value={passengers} onChange={e => setPassengers(parseInt(e.target.value, 10))} min="1" max="10" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>
            <div>
              <label className="text-sm text-gray-400">Special Requests</label>
              <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 mt-1 focus:ring-yellow-500 focus:border-yellow-500"></textarea>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500">
              {isLoading ? 'Requesting...' : 'Request Limousine'}
            </button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Your Booking History</h2>
        {clientBookings.length > 0 ? (
          clientBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} role={UserRole.Client} drivers={drivers} clients={clients} onUpdateBooking={onUpdateBooking} />
          ))
        ) : (
          <p className="text-gray-400">You have no bookings yet.</p>
        )}
      </div>
    </div>
  );
};