import React, { useState } from 'react';
import { Booking, BookingStatus, BookingType, Client, Driver, PaymentStatus, UserRole } from '../types';
import { CalendarIcon, ClockIcon, UsersIcon, LocationPinIcon, DollarSignIcon, CarIcon, CheckCircleIcon, GpsIcon, PhoneIcon, TagIcon, AirplaneIcon } from './icons';
import { api } from '../services/mockApiService';

interface BookingCardProps {
  booking: Booking;
  role: UserRole;
  drivers: Driver[];
  clients: Client[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
}

const statusColors = {
  [BookingStatus.Pending]: 'bg-yellow-600/20 text-yellow-400',
  [BookingStatus.Confirmed]: 'bg-blue-600/20 text-blue-400',
  [BookingStatus.InProgress]: 'bg-indigo-600/20 text-indigo-400',
  [BookingStatus.Completed]: 'bg-green-600/20 text-green-400',
  [BookingStatus.Cancelled]: 'bg-red-600/20 text-red-400',
};

const paymentStatusColors = {
  [PaymentStatus.Pending]: 'bg-orange-600/20 text-orange-400',
  [PaymentStatus.Paid]: 'bg-green-600/20 text-green-400',
};

const getDriver = (driverId: string | null, drivers: Driver[]) => drivers.find(d => d.id === driverId);

// Simplified map component for GPS tracking visualization
const GpsTrackingMap: React.FC<{ driver: Driver, booking: Booking }> = ({ driver, booking }) => {
    if (!driver.location) return <div className="text-center text-gray-400 p-4">Location data not available.</div>;

    const latMin = 42.22, latMax = 42.40;
    const lngMin = -71.20, lngMax = -70.90;

    const topPercent = 100 - ((driver.location.latitude - latMin) / (latMax - latMin)) * 100;
    const leftPercent = ((driver.location.longitude - lngMin) / (lngMax - lngMin)) * 100;

    return (
        <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">Live Trip Progress</h4>
            <div className="relative h-48 w-full bg-gray-900 rounded-md overflow-hidden border border-gray-600">
                <svg className="absolute w-full h-full" width="100%" height="100%"><line x1="10%" y1="90%" x2="90%" y2="10%" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="2" strokeDasharray="5,5" /></svg>
                <div className="absolute top-[85%] left-[8%] flex flex-col items-center"><LocationPinIcon /><span className="text-xs text-green-400 -mt-2">Pickup</span></div>
                <div className="absolute top-[5%] left-[88%] flex flex-col items-center"><CheckCircleIcon /><span className="text-xs text-blue-400 -mt-2">Dropoff</span></div>
                <div className="absolute transition-all duration-1000 ease-linear" style={{ top: `${topPercent}%`, left: `${leftPercent}%`, transform: 'translate(-50%, -50%)' }}><div className="text-yellow-400 animate-pulse"><CarIcon/></div><span className="text-xs text-white bg-black/50 px-1 rounded -mt-2">{driver.name}</span></div>
            </div>
        </div>
    );
};

const FlightInfoDisplay: React.FC<{ booking: Booking, role: UserRole }> = ({ booking, role }) => {
    if (!booking.isAirportPickup || !booking.flightInfo) return null;

    const { flightNumber, flightInfo } = booking;
    const { airline, status, scheduledArrivalTime, estimatedArrivalTime, terminal } = flightInfo;

    const statusClasses = {
        'On Time': 'text-green-400',
        'Scheduled': 'text-blue-400',
        'En Route': 'text-indigo-400',
        'Delayed': 'text-orange-400',
        'Landed': 'text-yellow-400',
    };

    return (
        <div className="md:col-span-2 mt-4 pt-4 border-t border-dashed border-gray-700">
            <h4 className="flex items-center text-sm font-bold text-yellow-400 mb-2"><AirplaneIcon /> Flight Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <div>
                    <span className="text-gray-400 block text-xs">Airline</span>
                    <span className="font-semibold">{airline}</span>
                </div>
                <div>
                    <span className="text-gray-400 block text-xs">Flight</span>
                    <span className="font-semibold">{flightNumber}</span>
                </div>
                <div>
                    <span className="text-gray-400 block text-xs">Status</span>
                    <span className={`font-bold ${statusClasses[status] || 'text-white'}`}>{status}</span>
                </div>
                <div>
                    <span className="text-gray-400 block text-xs">Terminal</span>
                    <span className="font-semibold">{terminal || 'TBD'}</span>
                </div>
                {role === UserRole.Owner && (
                    <div>
                        <span className="text-gray-400 block text-xs">Scheduled Arrival</span>
                        <span className="font-semibold">{scheduledArrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                )}
                 <div>
                    <span className="text-gray-400 block text-xs">Expected Arrival</span>
                    <span className="font-semibold">{estimatedArrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};

export const BookingCard: React.FC<BookingCardProps> = ({ booking, role, drivers, clients, onUpdateBooking }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [fare, setFare] = useState('');

  const handleAssignDriver = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const driverId = e.target.value;
    onUpdateBooking(booking.id, { driverId: driverId || null, status: driverId ? BookingStatus.Confirmed : BookingStatus.Pending });
    
    if (driverId) {
        const driver = drivers.find(d => d.id === driverId);
        const client = clients.find(c => c.id === booking.clientId);

        if (driver && client) {
            let tripDetails = booking.bookingType === BookingType.Hourly
                ? `Hourly service for ${booking.durationHours} hours.`
                : `Stops: ${booking.stops?.join(' -> ') || 'None'}. Dropoff: ${booking.dropoffLocation}.`;
            
            if (booking.isAirportPickup && booking.flightNumber) {
                tripDetails += ` Airport pickup for flight ${booking.airline} ${booking.flightNumber}.`;
            }

            const driverMessage = `WAYNE LIMO: New trip assigned! Booking #${booking.id} for ${client.name}. Pickup: ${booking.pickupLocation} on ${booking.pickupTime.toLocaleString()}. Details: ${tripDetails}`;
            await api.sms.send(driver.phone, driverMessage);
            const clientMessage = `WAYNE LIMO: Your booking #${booking.id} is confirmed! Your driver, ${driver.name}, will pick you up from ${booking.pickupLocation} on ${booking.pickupTime.toLocaleString()}.`;
            await api.sms.send(client.phone, clientMessage);
            alert(`Driver assigned and booking confirmed. SMS notifications sent to ${driver.name} and ${client.name}.`);
        }
    } else {
        alert('Driver unassigned.');
    }
  };

  const handleUpdateStatus = (status: BookingStatus) => onUpdateBooking(booking.id, { status });
  
  const handlePayment = async () => {
    if (role === UserRole.Client) {
        alert('Redirecting to Square payment gateway...');
        setTimeout(() => {
            onUpdateBooking(booking.id, { paymentStatus: PaymentStatus.Paid });
            alert('Payment successful!');
        }, 2000);
    } else if (role === UserRole.Owner) {
        const client = clients.find(c => c.id === booking.clientId);
        if (client) {
            const paymentLink = `https://pay.wayne-limo.com/booking/${booking.id}`;
            const message = `WAYNE LIMO: Payment reminder for booking #${booking.id} (Total: $${booking.totalFare?.toFixed(2)}). Please pay securely here: ${paymentLink}`;
            await api.sms.send(client.phone, message);
            alert(`Payment link sent to ${client.name} via SMS.`);
        }
    }
  };
  
  const handleSetFare = () => {
    const newFare = parseFloat(fare);
    if (!isNaN(newFare) && newFare > 0) {
        onUpdateBooking(booking.id, { totalFare: newFare });
        setFare('');
    } else {
        alert('Please enter a valid fare amount.');
    }
  };

  const driver = getDriver(booking.driverId, drivers);
  const client = clients.find(c => c.id === booking.clientId);
  const driverName = driver?.name || 'Unassigned';
  const isTripActive = booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.InProgress;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-4 shadow-lg transition-all hover:border-yellow-500/50 hover:shadow-yellow-500/10">
      <div className="flex flex-col md:flex-row justify-between md:items-start mb-4">
        <div>
           <h3 className="text-xl font-bold text-yellow-400">Booking #{booking.id}</h3>
           <p className="text-sm text-gray-400">For: {client?.name || 'Unknown'} {role === UserRole.Owner && client && (<a href={`tel:${client.phone}`} className="text-yellow-400 hover:underline ml-2">({client.phone})</a>)}</p>
           <span className="mt-2 inline-flex items-center px-2 py-1 bg-gray-700 text-xs font-medium text-yellow-300 rounded-md"><TagIcon />{booking.bookingType}</span>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status]}`}>{booking.status}</span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[booking.paymentStatus]}`}>{booking.paymentStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
        <div><CalendarIcon /> {booking.pickupTime.toLocaleDateString()}</div>
        <div><ClockIcon /> {booking.pickupTime.toLocaleTimeString()}</div>
        <div className="md:col-span-2"><LocationPinIcon /> From: <span className="font-semibold">{booking.pickupLocation}</span></div>
        
        {booking.bookingType === BookingType.PointToPoint ? (
          <>
            {booking.stops && booking.stops.length > 0 && (
              <div className="md:col-span-2 pl-4 border-l-2 border-dashed border-gray-600 ml-3">
                {booking.stops.map((stop, index) => (<div key={index} className="flex items-start mb-2 last:mb-0"><LocationPinIcon /><div><span className="text-xs text-gray-400">Stop {index + 1}</span><p className="font-semibold -mt-1">{stop}</p></div></div>))}
              </div>
            )}
            <div className="md:col-span-2"><LocationPinIcon /> To: <span className="font-semibold">{booking.dropoffLocation}</span></div>
          </>
        ) : (
          <div className="md:col-span-2"><ClockIcon /> Duration: <span className="font-semibold">{booking.durationHours} hours</span></div>
        )}

        <div><UsersIcon /> Passengers: {booking.passengers}</div>
        <div><CarIcon /> Driver: <span className="font-semibold">{driverName}</span> {role === UserRole.Owner && driver && (<a href={`tel:${driver.phone}`} className="text-yellow-400 hover:underline ml-2 text-sm">({driver.phone})</a>)}</div>
        <div><DollarSignIcon /> Fare: <span className="font-semibold">{booking.totalFare ? `$${booking.totalFare.toFixed(2)}` : 'Awaiting Quote'}</span></div>
        
        {booking.specialRequests && <div className="md:col-span-2 text-sm italic">Requests: "{booking.specialRequests}"</div>}

        {(role === UserRole.Driver && client && isTripActive) && (<div className="md:col-span-2 text-sm pt-3 mt-3 border-t border-gray-800"><PhoneIcon /> Contact Client ({client.name}): <a href={`tel:${client.phone}`} className="font-semibold text-yellow-400 hover:underline">{client.phone}</a></div>)}
        
        <FlightInfoDisplay booking={booking} role={role} />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700 flex flex-wrap gap-2 items-center">
        {role === UserRole.Owner && (
          <>
            <div className="flex-1 min-w-[150px]"><label htmlFor={`driver-${booking.id}`} className="text-xs text-gray-400">Assign Driver</label><select id={`driver-${booking.id}`} value={booking.driverId || ''} onChange={handleAssignDriver} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm focus:ring-yellow-500 focus:border-yellow-500"><option value="">Unassigned</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            {booking.bookingType === BookingType.Hourly && !booking.totalFare && (<div className="flex items-end gap-2"><div className="flex-1"><label className="text-xs text-gray-400">Set Fare ($)</label><input type="number" placeholder="e.g., 400" value={fare} onChange={e => setFare(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm"/></div><button onClick={handleSetFare} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">Set</button></div>)}
            {booking.paymentStatus === PaymentStatus.Pending && booking.totalFare && (<button onClick={handlePayment} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md self-end">Send Payment Link</button>)}
            {booking.status === BookingStatus.InProgress && (<button onClick={() => setIsTracking(!isTracking)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md flex items-center self-end"><GpsIcon/>{isTracking ? 'Hide Map' : 'Track Driver'}</button>)}
            {booking.paymentStatus === PaymentStatus.Paid && <div className="flex items-center text-green-400 self-end"><CheckCircleIcon />Payment Received</div>}
          </>
        )}
        {role === UserRole.Driver && (
          <>{booking.status === BookingStatus.Confirmed && <button onClick={() => handleUpdateStatus(BookingStatus.InProgress)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-md">Start Trip</button>}{booking.status === BookingStatus.InProgress && <button onClick={() => handleUpdateStatus(BookingStatus.Completed)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md">Complete Trip</button>}{booking.status === BookingStatus.Completed && <div className="flex items-center text-green-400"><CheckCircleIcon />Trip Completed</div>}</>
        )}
        {role === UserRole.Client && (
            <>{booking.paymentStatus === PaymentStatus.Pending && booking.totalFare && (<button onClick={handlePayment} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md flex items-center"><DollarSignIcon/>Pay Now</button>)}{booking.status === BookingStatus.InProgress && (<button onClick={() => setIsTracking(!isTracking)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><GpsIcon/>{isTracking ? 'Hide Map' : 'Track Driver'}</button>)}{driver && isTripActive && (<a href={`tel:${driver.phone}`} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md flex items-center"><PhoneIcon /> Contact Driver</a>)}</>
        )}
      </div>

      {isTracking && driver && <GpsTrackingMap driver={driver} booking={booking}/>}
    </div>
  );
};