import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Booking, Driver, Client } from './types';
import { api } from './services/mockApiService';
import { ClientView } from './components/ClientView';
import { OwnerView } from './components/OwnerView';
import { DriverView } from './components/DriverView';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.Client);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bookingsData, driversData, clientsData] = await Promise.all([
        api.getBookings(),
        api.getDrivers(),
        api.getClients(),
      ]);
      setBookings(bookingsData);
      setDrivers(driversData);
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      alert("Could not load application data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Enhanced polling for both driver locations and booking updates (flight status).
    // This uses a recursive setTimeout to prevent request overlap and ensures updates
    // are fetched reliably every 3 seconds after the previous fetch completes.
    let isMounted = true;
    let timeoutId: number;

    const pollUpdates = async () => {
      if (!isMounted) return;

      try {
        const [bookingsData, driversData] = await Promise.all([
            api.getBookings(),
            api.getDrivers()
        ]);
        if (isMounted) {
          setBookings(bookingsData);
          setDrivers(driversData);
        }
      } catch (error) {
        console.error("Failed to fetch live data:", error);
      } finally {
        if (isMounted) {
          timeoutId = window.setTimeout(pollUpdates, 3000);
        }
      }
    };
    
    // Start polling after an initial 3-second delay to allow first data load.
    timeoutId = window.setTimeout(pollUpdates, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId); // Cleanup on component unmount
    };
  }, [fetchData]);

  const handleUpdateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    // Also update via API for persistence in a real app
    api.updateBooking(id, updates);
  }, []);

  const handleAddBooking = useCallback((newBooking: Booking) => {
    setBookings(prev => [...prev, newBooking]);
  }, []);

  const renderView = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-screen"><p className="text-xl text-yellow-400">Loading WAYNE LIMO LLC...</p></div>;
    }
    switch (role) {
      case UserRole.Client:
        return <ClientView bookings={bookings} drivers={drivers} clients={clients} onUpdateBooking={handleUpdateBooking} onAddBooking={handleAddBooking} />;
      case UserRole.Owner:
        return <OwnerView bookings={bookings} drivers={drivers} clients={clients} onUpdateBooking={handleUpdateBooking} />;
      case UserRole.Driver:
        return <DriverView bookings={bookings} drivers={drivers} clients={clients} onUpdateBooking={handleUpdateBooking} />;
      default:
        return null;
    }
  };

  const RoleButton: React.FC<{ value: UserRole, label: string }> = ({ value, label }) => (
    <button
      onClick={() => setRole(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        role === value
          ? 'bg-yellow-500 text-black shadow-lg'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <LogoIcon />
                    <h1 className="text-xl font-bold text-white tracking-wider -ml-4">
                        WAYNE <span className="text-yellow-400">LIMO</span>
                    </h1>
                </div>
                <div className="flex items-center bg-gray-800 p-1 rounded-lg shadow-inner">
                    <RoleButton value={UserRole.Client} label="Client View" />
                    <RoleButton value={UserRole.Owner} label="Owner View" />
                    <RoleButton value={UserRole.Driver} label="Driver View" />
                </div>
            </div>
        </div>
      </header>
      <main>{renderView()}</main>
    </div>
  );
};

export default App;