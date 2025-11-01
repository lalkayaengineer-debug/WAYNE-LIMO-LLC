export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Driver = 'Driver',
}

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
}

export enum BookingType {
  PointToPoint = 'Point-to-Point',
  Hourly = 'Hourly',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface FlightInfo {
  airline: string;
  status: 'On Time' | 'Delayed' | 'Landed' | 'En Route' | 'Scheduled';
  scheduledArrivalTime: Date;
  estimatedArrivalTime: Date;
  terminal: string;
}

export interface Booking {
  id: string;
  clientId: string;
  driverId: string | null;
  bookingType: BookingType;
  pickupLocation: string;
  stops?: string[];
  dropoffLocation: string;
  durationHours?: number;
  pickupTime: Date;
  passengers: number;
  specialRequests?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalFare?: number;
  isAirportPickup?: boolean;
  flightNumber?: string;
  airline?: string;
  flightInfo?: FlightInfo;
}