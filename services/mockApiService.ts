import { Booking, Client, Driver, BookingStatus, PaymentStatus, BookingType, FlightInfo } from '../types';

let bookings: Booking[] = [
  {
    id: '1',
    clientId: '1',
    driverId: '1',
    bookingType: BookingType.PointToPoint,
    pickupLocation: '123 Beacon St, Boston, MA',
    stops: ['Faneuil Hall Marketplace, Boston, MA'],
    dropoffLocation: 'Logan International Airport (BOS)',
    pickupTime: new Date(new Date().setDate(new Date().getDate() + 1)),
    passengers: 2,
    specialRequests: 'Need a child seat.',
    status: BookingStatus.Confirmed,
    paymentStatus: PaymentStatus.Paid,
    totalFare: 150,
  },
  {
    id: '2',
    clientId: '2',
    driverId: '2',
    bookingType: BookingType.PointToPoint,
    pickupLocation: 'The Ritz-Carlton, Boston, MA',
    dropoffLocation: 'Fenway Park, Boston, MA',
    pickupTime: new Date(new Date().setHours(new Date().getHours() - 1)), // Set to recent past to be in progress
    passengers: 4,
    status: BookingStatus.InProgress,
    paymentStatus: PaymentStatus.Paid,
    totalFare: 85,
  },
  {
    id: '3',
    clientId: '1',
    driverId: null,
    bookingType: BookingType.PointToPoint,
    pickupLocation: 'South Station, Boston, MA',
    dropoffLocation: 'Harvard University, Cambridge, MA',
    pickupTime: new Date(new Date().setDate(new Date().getDate() + 3)),
    passengers: 1,
    specialRequests: 'Extra luggage.',
    status: BookingStatus.Pending,
    paymentStatus: PaymentStatus.Pending,
  },
  {
    id: '4',
    clientId: '2',
    driverId: '1',
    bookingType: BookingType.PointToPoint,
    pickupLocation: 'TD Garden, Boston, MA',
    dropoffLocation: ' Encore Boston Harbor, Everett, MA',
    pickupTime: new Date(new Date().setDate(new Date().getDate() - 1)),
    passengers: 3,
    status: BookingStatus.Completed,
    paymentStatus: PaymentStatus.Paid,
    totalFare: 95,
  },
  {
    id: '5',
    clientId: '2',
    driverId: '3',
    bookingType: BookingType.Hourly,
    pickupLocation: 'Museum of Fine Arts, Boston, MA',
    dropoffLocation: 'As Directed', // Placeholder for hourly
    durationHours: 4,
    pickupTime: new Date(new Date().setDate(new Date().getDate() + 2)),
    passengers: 2,
    status: BookingStatus.Confirmed,
    paymentStatus: PaymentStatus.Paid,
    totalFare: 480, // e.g., $120/hr
  },
  {
    id: '6',
    clientId: '1',
    driverId: '2',
    bookingType: BookingType.PointToPoint,
    pickupLocation: 'Logan International Airport (BOS)',
    dropoffLocation: 'Four Seasons Hotel, Boston, MA',
    pickupTime: new Date(new Date().setDate(new Date().getDate() + 2)),
    passengers: 1,
    status: BookingStatus.Confirmed,
    paymentStatus: PaymentStatus.Paid,
    totalFare: 120,
    isAirportPickup: true,
    flightNumber: 'UA123',
    airline: 'United Airlines',
    flightInfo: {
        airline: 'United Airlines',
        status: 'Scheduled',
        scheduledArrivalTime: new Date(new Date().setDate(new Date().getDate() + 2)),
        estimatedArrivalTime: new Date(new Date().setDate(new Date().getDate() + 2)),
        terminal: 'B'
    }
  },
];

const clients: Client[] = [
  { id: '1', name: 'John Doe', phone: '555-1234' },
  { id: '2', name: 'Jane Smith', phone: '555-5678' },
];

const drivers: Driver[] = [
  { id: '1', name: 'Mike Johnson', phone: '555-1111', location: { latitude: 42.3601, longitude: -71.0589 } },
  { id: '2', name: 'Sarah Chen', phone: '555-2222', location: { latitude: 42.3584, longitude: -71.0637 } },
  { id: '3', name: 'David Lee', phone: '555-3333', location: { latitude: 42.3656, longitude: -71.0694 } },
];

const simulateDelay = <T,>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), 500));

const mockSmsService = {
  send: (phone: string, message: string) => {
    console.log(`%c--- MOCK SMS SENT ---`, 'color: #D4AF37; font-weight: bold;');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log(`---------------------`);
    return simulateDelay({ success: true });
  }
};

// Simulate driver movement for in-progress bookings
setInterval(() => {
  bookings.forEach(booking => {
    if (booking.status === BookingStatus.InProgress && booking.driverId) {
      const driver = drivers.find(d => d.id === booking.driverId);
      if (driver && driver.location) {
        // Simulate movement within Boston area
        driver.location.latitude += (Math.random() - 0.5) * 0.005;
        driver.location.longitude += (Math.random() - 0.5) * 0.005;
      }
    }
  });
}, 3000);

// Simulate live flight status updates
const flightStatuses: FlightInfo['status'][] = ['On Time', 'Delayed', 'Landed', 'En Route'];
setInterval(() => {
    bookings.forEach(booking => {
        if (booking.isAirportPickup && booking.flightInfo && booking.status !== BookingStatus.Completed) {
            const newStatus = flightStatuses[Math.floor(Math.random() * flightStatuses.length)];
            const newTerminal = ['A', 'B', 'C', 'E'][Math.floor(Math.random() * 4)];
            const delayMinutes = newStatus === 'Delayed' ? Math.floor(Math.random() * 60) : 0;
            const newEstimatedTime = new Date(booking.flightInfo.scheduledArrivalTime.getTime() + delayMinutes * 60000);

            booking.flightInfo.status = newStatus;
            booking.flightInfo.terminal = newTerminal;
            booking.flightInfo.estimatedArrivalTime = newEstimatedTime;
        }
    });
}, 5000);


export const api = {
  getBookings: () => simulateDelay([...bookings]),
  getClients: () => simulateDelay([...clients]),
  getDrivers: () => simulateDelay([...drivers]),
  getBookingById: (id: string) => simulateDelay(bookings.find(b => b.id === id)),
  
  createBooking: (newBookingData: Omit<Booking, 'id' | 'status' | 'paymentStatus' | 'driverId' | 'totalFare' | 'flightInfo'>) => {
    const newBooking: Booking = {
      ...newBookingData,
      id: String(Date.now()),
      status: BookingStatus.Pending,
      paymentStatus: PaymentStatus.Pending,
      driverId: null,
      totalFare: undefined,
    };
    if (newBooking.isAirportPickup && newBooking.flightNumber && newBooking.airline) {
        newBooking.flightInfo = {
          airline: newBooking.airline,
          status: 'Scheduled',
          scheduledArrivalTime: newBooking.pickupTime,
          estimatedArrivalTime: newBooking.pickupTime,
          terminal: 'TBD'
        };
      }
    bookings.push(newBooking);
    return simulateDelay(newBooking);
  },

  updateBooking: (id: string, updates: Partial<Booking>) => {
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates };
      return simulateDelay(bookings[index]);
    }
    return Promise.reject(new Error('Booking not found'));
  },
  
  sms: mockSmsService,
};