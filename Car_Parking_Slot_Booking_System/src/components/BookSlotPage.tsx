import React, { useState, useEffect } from 'react';
import { MobileHeader } from './common/MobileHeader';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from './NotificationProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  MapPin, 
  Car, 
  Clock, 
  CheckCircle, 
  Timer, 
  Calendar as CalendarIcon,
  DollarSign,
  Info,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { User, TimeSlot, ParkingSlot } from '../App';
import { formatDuration } from './services/mockApi';

type BookSlotPageProps = {
  user: User;
  slots: ParkingSlot[];
  onBook: (slotId: string, date: string, time: string, duration: number) => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
};

type AvailableTimeSlot = {
  timeSlot: TimeSlot;
  availableDate: string;
  isToday: boolean;
  conflictingBookings: any[];
};

type BookingWindow = {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  pricePerHour: number;
  totalCost: number;
};

export function BookSlotPage({ user, slots: appSlots, onBook, onNavigate, onLogout }: BookSlotPageProps) {
  const { socket, isConnected } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [bookingWindow, setBookingWindow] = useState<BookingWindow | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSlotDetails, setShowSlotDetails] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customDuration, setCustomDuration] = useState(60);
  
  const [bookingStatus, setBookingStatus] = useState<{
    loading: boolean;
    message: string;
    type: 'success' | 'error' | '';
  }>({
    loading: false,
    message: '',
    type: ''
  });

  // Filter available slots from App.tsx
  const availableSlots = appSlots.filter(slot => slot.status === 'available');

  // Calculate available time slots when slot or date changes
  useEffect(() => {
    if (selectedSlot && selectedDate) {
      calculateAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedSlot, selectedDate]);

  // Listen for real-time slot updates
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (bookingData: any) => {
      if (selectedSlot && selectedSlot.id === bookingData.slot_id) {
        setSelectedSlot(null);
      }
    };

    socket.on('new_booking', handleNewBooking);
    socket.on('newBooking', handleNewBooking);

    return () => {
      socket.off('new_booking', handleNewBooking);
      socket.off('newBooking', handleNewBooking);
    };
  }, [socket, selectedSlot]);

  const calculateAvailableTimeSlots = () => {
    if (!selectedSlot) return;

    let timeSlots: TimeSlot[] = selectedSlot.availableTimeSlots || [];
    
    // Fallback to default availability if no time slots configured
    if (timeSlots.length === 0) {
      timeSlots = [{
        id: 'default',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
        recurringDays: [1, 2, 3, 4, 5],
        maxDurationMinutes: selectedSlot.availableDurationMinutes,
        pricePerHour: 50
      }];
    }

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const dayOfWeek = selectedDate.getDay();
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDateStr === today;

    const availableSlots: AvailableTimeSlot[] = [];

    timeSlots.forEach(timeSlot => {
      let isAvailable = false;

      if (timeSlot.isRecurring) {
        // Check if this day of week is available
        if (timeSlot.recurringDays?.includes(dayOfWeek)) {
          isAvailable = true;
        }
      } else {
        // Check if selected date is within the range
        if (selectedDateStr >= timeSlot.startDate && selectedDateStr <= timeSlot.endDate) {
          isAvailable = true;
        }
      }

      if (isAvailable) {
        availableSlots.push({
          timeSlot,
          availableDate: selectedDateStr,
          isToday,
          conflictingBookings: [] // In real app, check for conflicting bookings
        });
      }
    });

    setAvailableTimeSlots(availableSlots);
  };

  const handleSlotSelect = (slot: ParkingSlot) => {
    setSelectedSlot(slot);
    setSelectedTimeSlot(null);
    setBookingWindow(null);
    setCustomStartTime('');
    calculateAvailableTimeSlots();
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setCustomStartTime(timeSlot.startTime);
    setCustomDuration(Math.min(120, timeSlot.maxDurationMinutes)); // Default to 2 hours or max available
  };

  const calculateBookingWindow = () => {
    if (!selectedTimeSlot || !customStartTime) return null;

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const startDateTime = new Date(`${selectedDateStr}T${customStartTime}`);
    const endDateTime = new Date(startDateTime.getTime() + customDuration * 60 * 1000);
    
    // Validate that booking doesn't exceed time slot boundaries
    const timeSlotEnd = new Date(`${selectedDateStr}T${selectedTimeSlot.endTime}`);
    
    if (endDateTime > timeSlotEnd) {
      return null; // Invalid booking window
    }

    const totalCost = (customDuration / 60) * (selectedTimeSlot.pricePerHour || 50);

    return {
      date: selectedDateStr,
      startTime: customStartTime,
      endTime: endDateTime.toTimeString().split(' ')[0].slice(0, 5),
      durationMinutes: customDuration,
      pricePerHour: selectedTimeSlot.pricePerHour || 50,
      totalCost
    };
  };

  useEffect(() => {
    const window = calculateBookingWindow();
    setBookingWindow(window);
  }, [selectedTimeSlot, customStartTime, customDuration, selectedDate]);

  const handleBookSlot = async () => {
    if (!selectedSlot || !bookingWindow) return;

    setBookingStatus({ loading: true, message: '', type: '' });
    
    try {
      setBookingStatus({
        loading: false,
        message: `✅ Successfully booked slot ${selectedSlot.number} for ${formatDuration(bookingWindow.durationMinutes)} on ${bookingWindow.date}!`,
        type: 'success'
      });
      
      // Reset selection
      setSelectedSlot(null);
      setSelectedTimeSlot(null);
      setBookingWindow(null);
      
      // Call the parent handler which will update the main App state
      onBook(selectedSlot.id, bookingWindow.date, bookingWindow.startTime, bookingWindow.durationMinutes);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setBookingStatus({ loading: false, message: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus({
        loading: false,
        message: `❌ ${error instanceof Error ? error.message : 'Booking failed'}`,
        type: 'error'
      });
    }
  };

  const getDurationOptions = (maxMinutes: number) => {
    const options = [];
    for (let minutes = 30; minutes <= maxMinutes; minutes += 30) {
      if (minutes <= 480) { // Up to 8 hours
        options.push({
          value: minutes,
          label: formatDuration(minutes)
        });
      }
    }
    return options;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isTimeSlotValid = () => {
    if (!selectedTimeSlot || !customStartTime) return false;
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const startDateTime = new Date(`${selectedDateStr}T${customStartTime}`);
    const endDateTime = new Date(startDateTime.getTime() + customDuration * 60 * 1000);
    const timeSlotStart = new Date(`${selectedDateStr}T${selectedTimeSlot.startTime}`);
    const timeSlotEnd = new Date(`${selectedDateStr}T${selectedTimeSlot.endTime}`);
    
    return startDateTime >= timeSlotStart && endDateTime <= timeSlotEnd;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading available slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title="Book Parking Slot" onNavigate={onNavigate} />
      
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Parking Slot</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Real-time availability with date-time selection' : 'Offline mode'}
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

      <main className="p-6">
        {/* Status Message */}
        {bookingStatus.message && (
          <div className={`mb-6 p-4 rounded-lg ${
            bookingStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {bookingStatus.message}
          </div>
        )}

        {/* Step-by-step Booking Process */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Step 1: Select Parking Slot */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">1</div>
                Select Parking Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Slots</h3>
                  <p className="text-gray-600">
                    All parking slots are currently booked. Please check back later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableSlots.map((slot) => {
                    const timeSlots = slot.availableTimeSlots || [];
                    
                    return (
                      <Card 
                        key={slot.id} 
                        className={`hover:shadow-md transition-shadow cursor-pointer ${
                          selectedSlot?.id === slot.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Slot #{slot.number}</h4>
                            <Badge className={getStatusColor(slot.status)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{slot.locationName}, {slot.locationAddress}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-blue-500" />
                              <span>Max: {formatDuration(slot.availableDurationMinutes)}</span>
                            </div>

                            {timeSlots.length > 0 && (
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-green-500" />
                                <span>{timeSlots.length} schedule{timeSlots.length !== 1 ? 's' : ''}</span>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Slot {slot.number} Availability</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                      {timeSlots.map((ts, index) => (
                                        <div key={ts.id} className="p-3 border rounded">
                                          <div className="font-medium text-sm">
                                            {ts.isRecurring ? (
                                              <span>Weekly: {ts.recurringDays?.map(d => 
                                                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
                                              ).join(', ')}</span>
                                            ) : (
                                              <span>{ts.startDate} to {ts.endDate}</span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            {ts.startTime} - {ts.endTime} | ${ts.pricePerHour}/hour
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full mt-3"
                            size="sm"
                            variant={selectedSlot?.id === slot.id ? "secondary" : "default"}
                            disabled={selectedSlot?.id === slot.id}
                          >
                            {selectedSlot?.id === slot.id ? 'Selected' : 'Select This Slot'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Date & Time */}
          <div className="space-y-6">
            {selectedSlot && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">2</div>
                    Select Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <Label>Select Date</Label>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate.toLocaleDateString()}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Available Time Slots */}
                  {availableTimeSlots.length > 0 ? (
                    <div>
                      <Label>Available Time Slots</Label>
                      <div className="space-y-2 mt-2">
                        {availableTimeSlots.map((availableSlot, index) => (
                          <Card 
                            key={`${availableSlot.timeSlot.id}-${index}`}
                            className={`cursor-pointer transition-colors ${
                              selectedTimeSlot?.id === availableSlot.timeSlot.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleTimeSlotSelect(availableSlot.timeSlot)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">
                                    {availableSlot.timeSlot.startTime} - {availableSlot.timeSlot.endTime}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Max {formatDuration(availableSlot.timeSlot.maxDurationMinutes)} | 
                                    ${availableSlot.timeSlot.pricePerHour}/hour
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No availability on {selectedDate.toLocaleDateString()}. Please select a different date.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Customize Booking */}
            {selectedTimeSlot && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">3</div>
                    Customize Booking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      min={selectedTimeSlot.startTime}
                      max={selectedTimeSlot.endTime}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={customDuration.toString()}
                      onValueChange={(value) => setCustomDuration(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getDurationOptions(selectedTimeSlot.maxDurationMinutes).map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Booking Preview */}
                  {bookingWindow && isTimeSlotValid() && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Booking Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{bookingWindow.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{bookingWindow.startTime} - {bookingWindow.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{formatDuration(bookingWindow.durationMinutes)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total Cost:</span>
                          <span className="text-green-700">${bookingWindow.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isTimeSlotValid() && customStartTime && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Invalid time selection. Please ensure your booking fits within the available time slot.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Booking Button */}
                  <Button
                    onClick={handleBookSlot}
                    disabled={bookingStatus.loading || !bookingWindow || !isTimeSlotValid()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {bookingStatus.loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Booking...
                      </div>
                    ) : (
                      bookingWindow 
                        ? `Confirm Booking - $${bookingWindow.totalCost.toFixed(2)}`
                        : 'Configure Booking Details'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => onNavigate('user-dashboard')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}