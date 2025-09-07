import React, { useState, useEffect } from 'react';
import { MobileHeader } from './common/MobileHeader';
import { NotificationBell } from './NotificationBell';
import { RealTimeGuide } from './RealTimeGuide';
import { useNotifications } from './NotificationProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Car, MapPin, Clock, User as UserIcon, CreditCard } from 'lucide-react';
import { User } from '../App';
import { mockApi, MockBooking, MockSlot } from './services/mockApi';

type UserDashboardProps = {
  user: User;
  slots: any[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
};

export function UserDashboard({ user, onNavigate, onLogout }: UserDashboardProps) {
  const { socket, isConnected } = useNotifications();
  const [myBookings, setMyBookings] = useState<MockBooking[]>([]);
  const [availableSlots, setAvailableSlots] = useState<MockSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const numericUserId = parseInt(user.id.replace('user-', '')) || 2;

        // Load user's bookings and available slots
        const [bookingsData, slotsData] = await Promise.all([
          mockApi.getUserBookings(numericUserId),
          mockApi.getSlots('available')
        ]);

        setMyBookings(bookingsData);
        setAvailableSlots(slotsData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user.id]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (bookingData: MockBooking) => {
      const numericUserId = parseInt(user.id.replace('user-', '')) || 2;
      
      // If this booking is for the current user, add it to their bookings
      if (bookingData.user_id === numericUserId) {
        setMyBookings(prev => [bookingData, ...prev]);
      }
      
      // Update available slots count
      setAvailableSlots(prev => prev.filter(slot => slot.id !== bookingData.slot_id));
    };

    const handleBookingCancelled = (data: { bookingId: number }) => {
      // Update booking status if it's the user's booking
      setMyBookings(prev => 
        prev.map(booking => 
          booking.id === data.bookingId 
            ? { ...booking, status: 'cancelled' as const, fine: 5 }
            : booking
        )
      );
      
      // Refresh available slots
      loadAvailableSlots();
    };

    socket.on('newBooking', handleNewBooking);
    socket.on('bookingCancelled', handleBookingCancelled);

    return () => {
      socket.off('newBooking', handleNewBooking);
      socket.off('bookingCancelled', handleBookingCancelled);
    };
  }, [socket, user.id]);

  const loadAvailableSlots = async () => {
    try {
      const data = await mockApi.getSlots('available');
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeBookings = myBookings.filter(booking => booking.status === 'active');
  const totalBookings = myBookings.length;
  const totalFines = myBookings.reduce((sum, booking) => sum + (booking.fine || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Dashboard" onNavigate={onNavigate} />
      
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time updates active' : 'Offline mode'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button onClick={onLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeBookings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableSlots.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalFines.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => onNavigate('book-slot')}
                className="h-20 bg-blue-600 hover:bg-blue-700"
              >
                <div className="flex flex-col items-center gap-2">
                  <Car className="h-6 w-6" />
                  <span>Book New Slot</span>
                </div>
              </Button>
              
              <Button
                onClick={() => onNavigate('booking-history')}
                variant="outline"
                className="h-20"
              >
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>View History</span>
                </div>
              </Button>
              
              <Button
                onClick={() => onNavigate('profile')}
                variant="outline"
                className="h-20"
              >
                <div className="flex flex-col items-center gap-2">
                  <UserIcon className="h-6 w-6" />
                  <span>Profile Settings</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Guide */}
        <RealTimeGuide isConnected={isConnected} userRole={user.role} />

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Bookings
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Live Updates
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myBookings.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by booking your first parking slot!
                </p>
                <Button onClick={() => onNavigate('book-slot')}>
                  Book a Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Car className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Slot {booking.slot_number}</h4>
                        <p className="text-sm text-gray-600">{booking.location}</p>
                        <p className="text-xs text-gray-500">
                          Booked: {formatDateTime(booking.booked_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      {booking.fine > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Fine: ${Number(booking.fine).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {myBookings.length > 5 && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => onNavigate('booking-history')}
                      variant="outline"
                    >
                      View All Bookings
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}