import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { User, Booking } from '../App';
import { ArrowLeft, Calendar, Clock, Car, X, CheckCircle, AlertCircle, DollarSign, Info } from 'lucide-react';
import { CancelBookingDialog } from './CancelBookingDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CancellationPolicyInfo } from './CancellationPolicyInfo';
import { FineAnalytics } from './FineAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface BookingHistoryPageProps {
  user: User;
  bookings: Booking[];
  onCancel: (bookingId: string, selectedPolicy: any) => { fine: number; description: string; timeUsed: number } | null;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function BookingHistoryPage({ user, bookings, onCancel, onNavigate }: BookingHistoryPageProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = (bookingId: string, selectedPolicy: any) => {
    const result = onCancel(bookingId, selectedPolicy);
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    return result;
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'active':
        return <Car className="h-3 w-3" />;
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('user-dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="ml-3 text-lg">Booking History</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
          <div className="p-6">
            <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>ParkEasy</h2>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('user-dashboard')}
              >
                <Car className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('book-slot')}
              >
                <Calendar className="mr-3 h-4 w-4" />
                Book Slot
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                style={{ backgroundColor: '#2563EB' }}
              >
                <Calendar className="mr-3 h-4 w-4" />
                History
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl mb-2">Booking History</h1>
            <p className="text-gray-600">View and manage your parking reservations</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Booking Management</h2>
                <p className="text-gray-600">View bookings, manage cancellations, and analyze patterns</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Info className="h-4 w-4" />
                    Cancellation Policies
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cancellation Policy Information</DialogTitle>
                  </DialogHeader>
                  <CancellationPolicyInfo />
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="bookings" className="space-y-4">
              <TabsList>
                <TabsTrigger value="bookings">Booking History</TabsTrigger>
                <TabsTrigger value="analytics">Fine Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
              {bookings.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No bookings found. <Button variant="link" onClick={() => onNavigate('book-slot')} className="p-0 h-auto">Book your first slot</Button> to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">Slot {booking.slotNumber}</h3>
                            <Badge className={`flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {booking.time}
                            </div>
                            <p>Booked on: {new Date(booking.createdAt).toLocaleDateString()}</p>
                            {booking.status === 'cancelled' && booking.cancelFine !== undefined && (
                              <div className="mt-2 bg-red-50 p-3 rounded border border-red-200 space-y-1">
                                <div className="flex items-center gap-2 text-red-600">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="text-xs font-medium">
                                    Cancellation Fine: ${booking.cancelFine.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-red-500 ml-5">
                                  {booking.cancelPolicy}
                                </div>
                                {booking.timeUsedHours !== undefined && (
                                  <div className="text-xs text-gray-600 ml-5">
                                    Time used: {booking.timeUsedHours < 1 
                                      ? `${Math.ceil(booking.timeUsedHours * 60)} minutes`
                                      : `${booking.timeUsedHours.toFixed(1)} hours`
                                    }
                                  </div>
                                )}
                                {booking.cancelTime && (
                                  <div className="text-xs text-gray-500 ml-5">
                                    Cancelled: {new Date(booking.cancelTime).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {(booking.status === 'upcoming' || booking.status === 'active') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(booking)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <FineAnalytics bookings={bookings} />
              </TabsContent>
            </Tabs>

            {/* Quick Statistics */}
            {bookings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-600">
                      {bookings.filter(b => b.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-yellow-600">
                      {bookings.filter(b => b.status === 'upcoming').length}
                    </p>
                    <p className="text-sm text-gray-600">Upcoming</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">
                      {bookings.filter(b => b.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-red-600">
                      {bookings.filter(b => b.status === 'cancelled').length}
                    </p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-orange-600">
                      ${bookings
                        .filter(b => b.status === 'cancelled' && b.cancelFine)
                        .reduce((total, b) => total + (b.cancelFine || 0), 0)
                        .toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Total Fines</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {bookings.filter(b => b.status === 'cancelled' && b.cancelFine).length} paid cancellations
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-4">Start by booking your first parking slot</p>
              <Button onClick={() => onNavigate('book-slot')} style={{ backgroundColor: '#2563EB' }}>
                Book a Slot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">Slot {booking.slotNumber}</h3>
                      <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    
                    {(booking.status === 'upcoming' || booking.status === 'active') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(booking)}
                        className="text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {booking.time}
                    </div>
                    {booking.status === 'cancelled' && booking.cancelFine !== undefined && (
                      <div className="mt-2 bg-red-50 p-2 rounded border border-red-200 space-y-1">
                        <div className="flex items-center gap-2 text-red-600">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs font-medium">
                            Fine: ${booking.cancelFine.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-red-500">
                          {booking.cancelPolicy}
                        </div>
                        {booking.timeUsedHours !== undefined && (
                          <div className="text-xs text-gray-600">
                            Used: {booking.timeUsedHours < 1 
                              ? `${Math.ceil(booking.timeUsedHours * 60)}min`
                              : `${booking.timeUsedHours.toFixed(1)}h`
                            }
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Booking Dialog */}
      <CancelBookingDialog
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}