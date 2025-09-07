import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Booking } from '../App';
import { 
  Bell, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Timer,
  Zap
} from 'lucide-react';

interface ApprovalNotificationSystemProps {
  bookings: Booking[];
  onApproveBooking?: (bookingId: string) => boolean;
  onRejectBooking?: (bookingId: string, reason: string) => boolean;
  onNavigate: (view: string) => void;
}

export function ApprovalNotificationSystem({ 
  bookings, 
  onApproveBooking, 
  onRejectBooking,
  onNavigate 
}: ApprovalNotificationSystemProps) {
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const urgentBookings = pendingBookings.filter(b => {
    const createdAt = new Date(b.createdAt);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated > 2; // Urgent if pending for more than 2 hours
  });

  // Real-time notification system
  useEffect(() => {
    if (pendingBookings.length > 0) {
      setIsVisible(true);
      
      // Add new notifications for recently pending bookings
      const newNotifications: string[] = [];
      pendingBookings.forEach(booking => {
        const createdAt = new Date(booking.createdAt);
        const now = new Date();
        const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (minutesSinceCreated <= 5) { // New booking within last 5 minutes
          newNotifications.push(`New booking request from ${booking.userName} for slot ${booking.slotNumber}`);
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...new Set([...prev, ...newNotifications])]);
        
        // Auto-clear notifications after 10 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => !newNotifications.includes(n)));
        }, 10000);
      }
    } else {
      setIsVisible(false);
    }
  }, [pendingBookings]);

  const handleQuickApprove = (bookingId: string) => {
    if (onApproveBooking) {
      const success = onApproveBooking(bookingId);
      if (success) {
        setNotifications(prev => [...prev, `Booking ${bookingId.slice(-8)} approved successfully`]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => !n.includes(bookingId.slice(-8))));
        }, 3000);
      }
    }
  };

  const handleQuickReject = (bookingId: string) => {
    if (onRejectBooking) {
      const success = onRejectBooking(bookingId, 'Quick rejection from notification');
      if (success) {
        setNotifications(prev => [...prev, `Booking ${bookingId.slice(-8)} rejected`]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => !n.includes(bookingId.slice(-8))));
        }, 3000);
      }
    }
  };

  if (!isVisible && notifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        {pendingBookings.length > 0 && (
          <Button
            onClick={() => onNavigate('admin-bookings')}
            className="rounded-full w-12 h-12 bg-orange-600 hover:bg-orange-700 shadow-lg relative animate-bounce"
          >
            <Bell className="h-5 w-5 text-white" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
              {pendingBookings.length}
            </Badge>
          </Button>
        )}
      </div>

      {/* Notifications Toast Area */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2">
        {notifications.map((notification, index) => (
          <Alert key={index} className="bg-white shadow-lg border-orange-200 animate-in slide-in-from-top">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              {notification}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        ))}
      </div>

      {/* Pending Approvals Panel (Slide-out from right) */}
      {pendingBookings.length > 0 && (
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-30">
          <Card className="w-80 shadow-xl bg-white border-l-4 border-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-5 w-5" />
                Pending Approvals
                <Badge className="ml-auto bg-orange-500 text-white">
                  {pendingBookings.length}
                </Badge>
              </CardTitle>
              {urgentBookings.length > 0 && (
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <Zap className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {urgentBookings.length} urgent approvals (2+ hours pending)
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {pendingBookings.slice(0, 5).map((booking) => {
                const createdAt = new Date(booking.createdAt);
                const now = new Date();
                const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                const isUrgent = hoursSinceCreated > 2;

                return (
                  <div key={booking.id} className={`p-3 rounded-lg border ${isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {booking.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{booking.userName}</p>
                          {isUrgent && <Badge className="bg-red-500 text-white text-xs">Urgent</Badge>}
                        </div>
                        
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            Slot {booking.slotNumber}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Timer className="h-3 w-3" />
                            {booking.parkingDurationMinutes} min ({(booking.parkingDurationMinutes / 60).toFixed(1)}h)
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Pending for {hoursSinceCreated < 1 ? `${Math.round(hoursSinceCreated * 60)}m` : `${hoursSinceCreated.toFixed(1)}h`}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
                            onClick={() => handleQuickApprove(booking.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 text-xs px-2 py-1 h-auto"
                            onClick={() => handleQuickReject(booking.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingBookings.length > 5 && (
                <div className="text-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('admin-bookings')}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    View All {pendingBookings.length} Pending
                  </Button>
                </div>
              )}

              {pendingBookings.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">All caught up!</p>
                  <p className="text-xs">No pending approvals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}