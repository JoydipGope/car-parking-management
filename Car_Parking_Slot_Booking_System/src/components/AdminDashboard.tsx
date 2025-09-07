import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './common/AdminSidebar';
import { MobileHeader } from './common/MobileHeader';
import { NotificationBell } from './NotificationBell';
import { ApprovalNotificationSystem } from './ApprovalNotificationSystem';
import { useNotifications } from './NotificationProvider';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Car, MapPin, Users, Clock, AlertTriangle, Timer, CheckCircle, XCircle, Building, BarChart3 } from 'lucide-react';
import { mockApi, MockSlot, MockBooking, formatDuration } from './services/mockApi';

type AdminDashboardProps = {
  slots: any[];
  bookings: any[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onApproveBooking?: (bookingId: string) => boolean;
  onRejectBooking?: (bookingId: string, reason: string) => boolean;
  onApproveOwnerSlot?: (slotId: string) => boolean;
  onRejectOwnerSlot?: (slotId: string, reason: string) => boolean;
};

export function AdminDashboard({ 
  slots: appSlots, 
  bookings: appBookings, 
  onNavigate, 
  onLogout, 
  onApproveBooking, 
  onRejectBooking, 
  onApproveOwnerSlot, 
  onRejectOwnerSlot 
}: AdminDashboardProps) {
  const { socket, isConnected } = useNotifications();
  const [slots, setSlots] = useState<MockSlot[]>([]);
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingSlots, setPendingSlots] = useState<any[]>([]);
  const [pendingOwnerSlots, setPendingOwnerSlots] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load slots and bookings
        const [slotsData, bookingsData] = await Promise.all([
          mockApi.getSlots(),
          mockApi.getBookings()
        ]);
        
        setSlots(slotsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load pending tenant slots and owner slots from app data
  useEffect(() => {
    const loadPendingSlots = () => {
      // Get all pending tenant slots from the main slots data
      const pendingTenantSlots = slots.filter(slot => 
        slot.status === 'pending' && slot.manager_id
      ).map(slot => ({
        id: `slot-${slot.id}`,
        number: slot.slot_number,
        managerId: slot.manager_id,
        managerName: slot.manager_name,
        tenantName: slot.tenant_name,
        tenantContact: slot.tenant_contact,
        location: slot.location,
        availableDurationMinutes: slot.available_duration_minutes,
        status: slot.status,
        createdAt: slot.created_at
      }));
      setPendingSlots(pendingTenantSlots);

      // Get all pending owner slots from the app slots data
      const pendingOwnerSlotsFromApp = appSlots?.filter(slot => 
        slot.ownerId && slot.approvalStatus === 'pending'
      ).map(slot => ({
        id: slot.id,
        number: slot.number,
        ownerId: slot.ownerId,
        ownerName: slot.ownerName,
        ownerContact: slot.ownerContact,
        spaceType: slot.spaceType,
        locationName: slot.locationName,
        locationAddress: slot.locationAddress,
        availableDurationMinutes: slot.availableDurationMinutes,
        approvalStatus: slot.approvalStatus,
        createdAt: slot.createdAt
      })) || [];
      setPendingOwnerSlots(pendingOwnerSlotsFromApp);
    };

    loadPendingSlots();
  }, [slots, appSlots]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (bookingData: MockBooking) => {
      setBookings(prev => [bookingData, ...prev]);
      // Update slot status
      setSlots(prev => prev.map(slot => 
        slot.id === bookingData.slot_id 
          ? { ...slot, status: 'booked' as const }
          : slot
      ));
    };

    const handleTenantSlotCreated = (data: {
      slot_id: string;
      slot_number: string;
      manager_id: string;
      tenant_name: string;
      status: string;
    }) => {
      console.log(`🔔 New tenant slot pending approval: ${data.slot_number} by ${data.tenant_name}`);
      
      // Refresh the slots data to show the new pending slot
      loadSlots();
    };

    const handleSlotApproved = (data: { slot_id: string }) => {
      // Remove from pending slots
      setPendingSlots(prev => prev.filter(slot => slot.id !== data.slot_id));
      
      // Refresh slots to show updated status
      loadSlots();
      
      console.log(`✅ Tenant slot ${data.slot_id} approved and available`);
    };

    const handleNewBookingEvent = (data: { 
      booking_id: number; 
      user_id: number; 
      slot_id: number; 
      parking_duration_minutes: number;
      user_name: string;
      slot_number: string;
      location: string;
    }) => {
      // Show real-time alert for admin
      const durationText = formatDuration(data.parking_duration_minutes);
      console.log(`🚨 New booking: Slot ${data.slot_number} booked for ${durationText}`);
      
      // You could also show a toast notification here
      // toast.success(`New booking: Slot ${data.slot_number} for ${durationText}`);
    };

    const handleSlotCreated = (data: { slot_id: number; slot_number: string; available_duration_minutes: number; location: string }) => {
      const durationText = formatDuration(data.available_duration_minutes);
      console.log(`🆕 New slot created: ${data.slot_number}, available for ${durationText}`);
      
      // Refresh slots to show new slot
      loadSlots();
    };

    const handleBookingCancelled = (data: { bookingId: number; user_name: string; slot_number: string; fine: number }) => {
      setBookings(prev => 
        prev.map(booking => 
          booking.id === data.bookingId 
            ? { ...booking, status: 'cancelled' as const, fine: data.fine }
            : booking
        )
      );
      // Update slot status to available
      const cancelledBooking = bookings.find(b => b.id === data.bookingId);
      if (cancelledBooking) {
        setSlots(prev => prev.map(slot => 
          slot.id === cancelledBooking.slot_id 
            ? { ...slot, status: 'available' as const }
            : slot
        ));
      }
    };

    socket.on('newBooking', handleNewBooking);
    socket.on('new_booking', handleNewBookingEvent);
    socket.on('slot_created', handleSlotCreated);
    socket.on('bookingCancelled', handleBookingCancelled);
    socket.on('tenant_slot_created', handleTenantSlotCreated);
    socket.on('slot_approved', handleSlotApproved);

    return () => {
      socket.off('newBooking', handleNewBooking);
      socket.off('new_booking', handleNewBookingEvent);
      socket.off('slot_created', handleSlotCreated);
      socket.off('bookingCancelled', handleBookingCancelled);
      socket.off('tenant_slot_created', handleTenantSlotCreated);
      socket.off('slot_approved', handleSlotApproved);
    };
  }, [socket, bookings]);

  const loadSlots = async () => {
    try {
      const data = await mockApi.getSlots();
      setSlots(data);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    const fineAmount = window.prompt('Enter fine amount (USD):', '5.00');
    if (!fineAmount) return;

    try {
      await mockApi.cancelBooking(bookingId, parseFloat(fineAmount));
      console.log('Booking cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const handleApproveSlot = async (slotId: string) => {
    try {
      await mockApi.approveSlot(slotId);
      console.log('Slot approved successfully');
    } catch (error) {
      console.error('Failed to approve slot:', error);
      alert('Failed to approve slot');
    }
  };

  const handleRejectSlot = async (slotId: string) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      await mockApi.rejectSlot(slotId, reason || undefined);
      // Remove from pending slots
      setPendingSlots(prev => prev.filter(slot => slot.id !== slotId));
      console.log('Slot rejected successfully');
    } catch (error) {
      console.error('Failed to reject slot:', error);
      alert('Failed to reject slot');
    }
  };

  const handleApproveOwnerSlot = (slotId: string) => {
    if (onApproveOwnerSlot && onApproveOwnerSlot(slotId)) {
      // Remove from pending owner slots
      setPendingOwnerSlots(prev => prev.filter(slot => slot.id !== slotId));
      console.log(`Owner slot ${slotId} approved successfully`);
    } else {
      alert('Failed to approve owner slot');
    }
  };

  const handleRejectOwnerSlot = (slotId: string) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason !== null) { // User didn't cancel
      if (onRejectOwnerSlot && onRejectOwnerSlot(slotId, reason || 'No reason provided')) {
        // Remove from pending owner slots
        setPendingOwnerSlots(prev => prev.filter(slot => slot.id !== slotId));
        console.log(`Owner slot ${slotId} rejected successfully`);
      } else {
        alert('Failed to reject owner slot');
      }
    }
  };

  const totalSlots = slots.length;
  const availableSlots = slots.filter(slot => slot.status === 'available').length;
  const bookedSlots = slots.filter(slot => slot.status === 'booked').length;
  const activeBookings = bookings.filter(booking => booking.status === 'active' || booking.status === 'upcoming').length;
  const avgDuration = bookings.length > 0 
    ? Math.round(bookings.reduce((sum, booking) => sum + booking.parking_duration_minutes, 0) / bookings.length)
    : 0;
  const tenantSlots = slots.filter(slot => slot.manager_id).length;
  const ownerSlots = appSlots?.filter(slot => slot.ownerId).length || 0;
  const approvedOwnerSlots = appSlots?.filter(slot => slot.ownerId && slot.approvalStatus === 'approved').length || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enhanced Approval Notification System */}
      <ApprovalNotificationSystem 
        bookings={appBookings || []}
        onApproveBooking={onApproveBooking}
        onRejectBooking={onRejectBooking}
        onNavigate={onNavigate}
      />
      
      <AdminSidebar currentView="admin-dashboard" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 lg:ml-64">
        <MobileHeader title="Admin Dashboard" onNavigate={onNavigate} />
        
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Real-time updates active' : 'Offline mode'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button
                onClick={() => onNavigate('enhanced-analytics')}
                variant="outline"
                className="text-blue-600 hover:bg-blue-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Pending Tenant Slots Alert */}
          {pendingSlots.length > 0 && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Tenant Slot Approvals ({pendingSlots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium">Slot {slot.number}</p>
                          <p className="text-sm text-gray-600">Tenant: {slot.tenantName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveSlot(slot.id)}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectSlot(slot.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Owner Slot Approvals */}
          {pendingOwnerSlots.length > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Owner Space Approvals ({pendingOwnerSlots.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingOwnerSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Slot {slot.number}</p>
                          <p className="text-sm text-gray-600">Owner: {slot.ownerName}</p>
                          <p className="text-xs text-gray-500">
                            Type: {slot.spaceType} • {slot.locationName || 'Private Space'}
                          </p>
                          {slot.locationAddress && (
                            <p className="text-xs text-gray-500">{slot.locationAddress}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveOwnerSlot(slot.id)}
                          className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectOwnerSlot(slot.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSlots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
                <Car className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableSlots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Booked Slots</CardTitle>
                <Car className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{bookedSlots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{activeBookings}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Timer className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {avgDuration > 0 ? formatDuration(avgDuration) : '-'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tenant Slots</CardTitle>
                <Building className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{tenantSlots}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Owner Spaces</CardTitle>
                <Car className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{ownerSlots}</div>
                <p className="text-xs text-muted-foreground">
                  {approvedOwnerSlots} approved
                </p>
              </CardContent>
            </Card>
          </div>

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
              {bookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">ID</th>
                        <th className="text-left p-3 font-medium">User</th>
                        <th className="text-left p-3 font-medium">Slot</th>
                        <th className="text-left p-3 font-medium">Location</th>
                        <th className="text-left p-3 font-medium">Duration</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Fine</th>
                        <th className="text-left p-3 font-medium">Start Time</th>
                        <th className="text-left p-3 font-medium">End Time</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 10).map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{booking.id}</td>
                          <td className="p-3">{booking.user_name}</td>
                          <td className="p-3">{booking.slot_number}</td>
                          <td className="p-3">{booking.location}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              <Timer className="h-3 w-3 mr-1" />
                              {formatDuration(booking.parking_duration_minutes)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                booking.status === 'active' || booking.status === 'upcoming' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {booking.fine ? `$${Number(booking.fine).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3">{formatDate(booking.start_time)}</td>
                          <td className="p-3">{formatDate(booking.end_time)}</td>
                          <td className="p-3">
                            {(booking.status === 'active' || booking.status === 'upcoming') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelBooking(booking.id)}
                                className="flex items-center gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Cancel & Fine
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}