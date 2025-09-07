import React, { useState } from 'react';
import { AdminSidebar } from './common/AdminSidebar';
import { MobileHeader } from './common/MobileHeader';
import { NotificationBell } from './NotificationBell';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Plus, MapPin, Clock, Timer, Edit, Trash2, CalendarDays, DollarSign, X, Calendar } from 'lucide-react';
import { ParkingSlot, Location, TimeSlot } from '../App';

type AdminSlotManagementProps = {
  slots: ParkingSlot[];
  locations: Location[];
  onUpdateSlots: (slots: ParkingSlot[]) => void;
  onUpdateLocations: (locations: Location[]) => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
};

export function AdminSlotManagementFixed({ slots, locations, onUpdateSlots, onUpdateLocations, onNavigate, onLogout }: AdminSlotManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateLocationDialog, setShowCreateLocationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);

  // Form states
  const [slotForm, setSlotForm] = useState({
    slot_number: '',
    location_id: '',
    location_name: '',
    address: '',
    available_duration_minutes: 60,
    timeSlots: [] as TimeSlot[]
  });

  const [editForm, setEditForm] = useState({
    slot_number: '',
    location_id: '',
    location_name: '',
    address: '',
    available_duration_minutes: 60,
    timeSlots: [] as TimeSlot[]
  });

  const [locationForm, setLocationForm] = useState({
    name: '',
    address: ''
  });

  const [currentTimeSlot, setCurrentTimeSlot] = useState<TimeSlot>({
    id: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: false,
    recurringDays: [],
    maxDurationMinutes: 240,
    pricePerHour: 50
  });

  const [actionStatus, setActionStatus] = useState({
    loading: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });

  const addTimeSlot = (form: 'create' | 'edit') => {
    const newTimeSlot: TimeSlot = {
      ...currentTimeSlot,
      id: `timeslot-${Date.now()}`
    };

    if (form === 'create') {
      setSlotForm(prev => ({
        ...prev,
        timeSlots: [...prev.timeSlots, newTimeSlot]
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        timeSlots: [...prev.timeSlots, newTimeSlot]
      }));
    }

    // Reset current time slot
    setCurrentTimeSlot({
      id: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: false,
      recurringDays: [],
      maxDurationMinutes: 240,
      pricePerHour: 50
    });
  };

  const removeTimeSlot = (timeSlotId: string, form: 'create' | 'edit') => {
    if (form === 'create') {
      setSlotForm(prev => ({
        ...prev,
        timeSlots: prev.timeSlots.filter(ts => ts.id !== timeSlotId)
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        timeSlots: prev.timeSlots.filter(ts => ts.id !== timeSlotId)
      }));
    }
  };

  const handleRecurringDayChange = (dayIndex: number, checked: boolean) => {
    setCurrentTimeSlot(prev => ({
      ...prev,
      recurringDays: checked 
        ? [...(prev.recurringDays || []), dayIndex].sort()
        : (prev.recurringDays || []).filter(d => d !== dayIndex)
    }));
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus({ loading: true, message: '', type: 'success' });

    try {
      // Create new slot directly for App state
      const newSlot: ParkingSlot = {
        id: `slot-${Date.now()}`,
        number: slotForm.slot_number,
        status: 'available',
        locationId: slotForm.location_id !== 'new' ? slotForm.location_id : `location-${Date.now()}`,
        locationName: slotForm.location_id !== 'new' ? 
          locations.find(l => l.id === slotForm.location_id)?.name :
          slotForm.location_name,
        locationAddress: slotForm.location_id !== 'new' ?
          locations.find(l => l.id === slotForm.location_id)?.address :
          slotForm.address,
        availableDurationMinutes: slotForm.available_duration_minutes,
        availableTimeSlots: slotForm.timeSlots,
        currentBookings: [],
        createdAt: new Date().toISOString().split('T')[0]
      };

      // Update App state
      onUpdateSlots([...slots, newSlot]);

      // If new location was created, add it to locations
      if (slotForm.location_id === 'new' && slotForm.location_name && slotForm.address) {
        const newLocation: Location = {
          id: `location-${Date.now()}`,
          name: slotForm.location_name,
          address: slotForm.address,
          totalSlots: 1,
          pricingPerHour: 50
        };
        onUpdateLocations([...locations, newLocation]);
      }

      setActionStatus({
        loading: false,
        message: `✅ Slot ${slotForm.slot_number} created successfully with ${slotForm.timeSlots.length} time slot(s)!`,
        type: 'success'
      });

      // Reset form
      setSlotForm({
        slot_number: '',
        location_id: '',
        location_name: '',
        address: '',
        available_duration_minutes: 60,
        timeSlots: []
      });

      setTimeout(() => {
        setShowCreateDialog(false);
        setActionStatus({ loading: false, message: '', type: 'success' });
      }, 1500);

    } catch (error) {
      setActionStatus({
        loading: false,
        message: `❌ ${error instanceof Error ? error.message : 'Failed to create slot'}`,
        type: 'error'
      });
    }
  };

  const handleEditSlot = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setEditForm({
      slot_number: slot.number,
      location_id: slot.locationId,
      location_name: '',
      address: '',
      available_duration_minutes: slot.availableDurationMinutes,
      timeSlots: slot.availableTimeSlots || []
    });
    setShowEditDialog(true);
  };

  const handleUpdateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    setActionStatus({ loading: true, message: '', type: 'success' });

    try {
      // Update App state directly
      const updatedSlots = slots.map(slot => {
        if (slot.id === editingSlot.id) {
          return {
            ...slot,
            number: editForm.slot_number,
            availableDurationMinutes: editForm.available_duration_minutes,
            availableTimeSlots: editForm.timeSlots,
            locationName: editForm.location_id !== 'new' ? 
              locations.find(l => l.id === editForm.location_id)?.name :
              editForm.location_name,
            locationAddress: editForm.location_id !== 'new' ?
              locations.find(l => l.id === editForm.location_id)?.address :
              editForm.address
          };
        }
        return slot;
      });
      onUpdateSlots(updatedSlots);

      setActionStatus({
        loading: false,
        message: `✅ Slot ${editForm.slot_number} updated successfully!`,
        type: 'success'
      });

      setTimeout(() => {
        setShowEditDialog(false);
        setEditingSlot(null);
        setActionStatus({ loading: false, message: '', type: 'success' });
      }, 1500);

    } catch (error) {
      setActionStatus({
        loading: false,
        message: `❌ ${error instanceof Error ? error.message : 'Failed to update slot'}`,
        type: 'error'
      });
    }
  };

  const handleDeleteSlot = (slot: ParkingSlot) => {
    setActionStatus({ loading: true, message: '', type: 'success' });

    try {
      // Update App state directly
      const updatedSlots = slots.filter(s => s.id !== slot.id);
      onUpdateSlots(updatedSlots);
      
      setActionStatus({
        loading: false,
        message: `✅ Slot ${slot.number} deleted successfully!`,
        type: 'success'
      });

      setTimeout(() => {
        setActionStatus({ loading: false, message: '', type: 'success' });
      }, 2000);

    } catch (error) {
      setActionStatus({
        loading: false,
        message: `❌ ${error instanceof Error ? error.message : 'Failed to delete slot'}`,
        type: 'error'
      });
    }
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus({ loading: true, message: '', type: 'success' });

    try {
      const newLocation: Location = {
        id: `location-${Date.now()}`,
        name: locationForm.name,
        address: locationForm.address,
        totalSlots: 0,
        pricingPerHour: 50
      };
      
      onUpdateLocations([...locations, newLocation]);

      setActionStatus({
        loading: false,
        message: `✅ Location created successfully!`,
        type: 'success'
      });

      setLocationForm({ name: '', address: '' });

      setTimeout(() => {
        setShowCreateLocationDialog(false);
        setActionStatus({ loading: false, message: '', type: 'success' });
      }, 1500);

    } catch (error) {
      setActionStatus({
        loading: false,
        message: `❌ ${error instanceof Error ? error.message : 'Failed to create location'}`,
        type: 'error'
      });
    }
  };

  const getDurationOptions = () => {
    return [
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 hour' },
      { value: 90, label: '1.5 hours' },
      { value: 120, label: '2 hours' },
      { value: 180, label: '3 hours' },
      { value: 240, label: '4 hours' },
      { value: 360, label: '6 hours' },
      { value: 480, label: '8 hours' },
      { value: 720, label: '12 hours' },
      { value: 1440, label: '24 hours' }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const formatTimeSlots = (timeSlots: TimeSlot[]) => {
    if (timeSlots.length === 0) return 'No availability set';
    
    return timeSlots.map(ts => {
      if (ts.isRecurring) {
        const days = ts.recurringDays?.map(getDayName).join(', ') || 'No days';
        return `${days}: ${ts.startTime}-${ts.endTime}`;
      } else {
        return `${ts.startDate} to ${ts.endDate}: ${ts.startTime}-${ts.endTime}`;
      }
    }).join(' | ');
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  const TimeSlotForm = ({ form }: { form: 'create' | 'edit' }) => {
    const timeSlots = form === 'create' ? slotForm.timeSlots : editForm.timeSlots;
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">Add Availability Time Slot</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={currentTimeSlot.startDate}
                onChange={(e) => setCurrentTimeSlot(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={currentTimeSlot.endDate}
                onChange={(e) => setCurrentTimeSlot(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={currentTimeSlot.startTime}
                onChange={(e) => setCurrentTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={currentTimeSlot.endTime}
                onChange={(e) => setCurrentTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="isRecurring"
                checked={currentTimeSlot.isRecurring}
                onCheckedChange={(checked) => setCurrentTimeSlot(prev => ({ 
                  ...prev, 
                  isRecurring: checked as boolean,
                  recurringDays: checked ? [] : prev.recurringDays
                }))}
              />
              <Label htmlFor="isRecurring">Recurring weekly</Label>
            </div>
            
            {currentTimeSlot.isRecurring && (
              <div>
                <Label className="text-sm">Select days:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-1">
                      <Checkbox
                        id={`day-${index}`}
                        checked={currentTimeSlot.recurringDays?.includes(index) || false}
                        onCheckedChange={(checked) => handleRecurringDayChange(index, checked as boolean)}
                      />
                      <Label htmlFor={`day-${index}`} className="text-xs">{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <Label htmlFor="maxDuration">Max Duration (minutes)</Label>
              <Select
                value={currentTimeSlot.maxDurationMinutes.toString()}
                onValueChange={(value) => setCurrentTimeSlot(prev => ({ ...prev, maxDurationMinutes: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getDurationOptions().map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pricePerHour">Price per Hour ($)</Label>
              <Input
                id="pricePerHour"
                type="number"
                min="0"
                step="0.01"
                value={currentTimeSlot.pricePerHour}
                onChange={(e) => setCurrentTimeSlot(prev => ({ ...prev, pricePerHour: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <Button 
            type="button" 
            onClick={() => addTimeSlot(form)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Time Slot
          </Button>
        </div>

        {timeSlots.length > 0 && (
          <div>
            <Label className="text-base font-medium">Configured Time Slots ({timeSlots.length})</Label>
            <div className="space-y-2 mt-2">
              {timeSlots.map((timeSlot, index) => (
                <div key={timeSlot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {timeSlot.isRecurring ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>Weekly: {timeSlot.recurringDays?.map(getDayName).join(', ')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-green-500" />
                          <span>{timeSlot.startDate} to {timeSlot.endDate}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Max {Math.floor(timeSlot.maxDurationMinutes / 60)}h {timeSlot.maxDurationMinutes % 60}m
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${timeSlot.pricePerHour}/hour
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(timeSlot.id, form)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar currentView="admin-slots" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="flex-1 lg:ml-64">
        <MobileHeader title="Slot Management" onNavigate={onNavigate} />
        
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Slot Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage parking slots with date-time availability scheduling
              </p>
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
          {actionStatus.message && (
            <div className={`mb-6 p-4 rounded-lg ${
              actionStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {actionStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Advanced Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Parking Slot with Schedule</DialogTitle>
                  <DialogDescription>
                    Configure a parking slot with specific date-time availability windows and pricing.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Details</TabsTrigger>
                    <TabsTrigger value="schedule">Availability Schedule</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={handleCreateSlot} className="space-y-6">
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="slot_number">Slot Number</Label>
                          <Input
                            id="slot_number"
                            value={slotForm.slot_number}
                            onChange={(e) => setSlotForm(prev => ({ ...prev, slot_number: e.target.value }))}
                            placeholder="e.g., A01"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="duration">Default Max Duration</Label>
                          <Select
                            value={slotForm.available_duration_minutes.toString()}
                            onValueChange={(value) => setSlotForm(prev => ({ ...prev, available_duration_minutes: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {getDurationOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={slotForm.location_id}
                          onValueChange={(value) => {
                            setSlotForm(prev => ({ 
                              ...prev, 
                              location_id: value,
                              location_name: '',
                              address: ''
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select existing location or create new" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Create New Location</SelectItem>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id.toString()}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {slotForm.location_id === 'new' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location_name">New Location Name</Label>
                            <Input
                              id="location_name"
                              value={slotForm.location_name}
                              onChange={(e) => setSlotForm(prev => ({ ...prev, location_name: e.target.value }))}
                              placeholder="e.g., Central Mall"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={slotForm.address}
                              onChange={(e) => setSlotForm(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="e.g., Gulshan-2, Dhaka"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="schedule">
                      <TimeSlotForm form="create" />
                    </TabsContent>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={actionStatus.loading}
                        className="flex-1"
                      >
                        {actionStatus.loading ? 'Creating...' : `Create Slot`}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateDialog(false);
                          setSlotForm({
                            slot_number: '',
                            location_id: '',
                            location_name: '',
                            address: '',
                            available_duration_minutes: 60,
                            timeSlots: []
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateLocationDialog} onOpenChange={setShowCreateLocationDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Create Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Location</DialogTitle>
                  <DialogDescription>
                    Add a new parking location that can contain multiple parking slots.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateLocation} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Location Name</Label>
                    <Input
                      id="name"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Central Mall"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={locationForm.address}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g., Gulshan-2, Dhaka"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={actionStatus.loading}
                      className="flex-1"
                    >
                      {actionStatus.loading ? 'Creating...' : 'Create Location'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateLocationDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Slots List */}
          <Card>
            <CardHeader>
              <CardTitle>All Parking Slots ({slots.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Slots Found</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first parking slot with date-time scheduling to get started.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    Create First Slot
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {slots.map((slot) => {
                    const timeSlots = slot.availableTimeSlots || [];

                    return (
                      <Card key={slot.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Slot {slot.number}</CardTitle>
                            <Badge className={getStatusColor(slot.status)}>
                              {slot.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{slot.locationName}</p>
                              <p className="text-xs text-gray-500">{slot.locationAddress}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">
                              Default Max: {formatDuration(slot.availableDurationMinutes)}
                            </span>
                          </div>

                          {timeSlots.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CalendarDays className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium text-green-600">
                                  {timeSlots.length} Schedule(s)
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-16 overflow-y-auto">
                                {formatTimeSlots(timeSlots)}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              Created: {slot.createdAt}
                            </span>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleEditSlot(slot)}
                              disabled={actionStatus.loading}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  className="flex-1"
                                  disabled={actionStatus.loading}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Slot {slot.number}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the parking slot
                                    {slot.status === 'booked' && ' and cancel any active bookings'}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteSlot(slot)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Parking Slot Schedule</DialogTitle>
                <DialogDescription>
                  Update the slot information and availability schedule.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Details</TabsTrigger>
                  <TabsTrigger value="schedule">Availability Schedule</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleUpdateSlot} className="space-y-6">
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_slot_number">Slot Number</Label>
                        <Input
                          id="edit_slot_number"
                          value={editForm.slot_number}
                          onChange={(e) => setEditForm(prev => ({ ...prev, slot_number: e.target.value }))}
                          placeholder="e.g., A01"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit_duration">Default Max Duration</Label>
                        <Select
                          value={editForm.available_duration_minutes.toString()}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, available_duration_minutes: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDurationOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit_location">Location</Label>
                      <Select
                        value={editForm.location_id}
                        onValueChange={(value) => {
                          setEditForm(prev => ({ 
                            ...prev, 
                            location_id: value,
                            location_name: '',
                            address: ''
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Create New Location</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editForm.location_id === 'new' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_location_name">New Location Name</Label>
                          <Input
                            id="edit_location_name"
                            value={editForm.location_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location_name: e.target.value }))}
                            placeholder="e.g., Central Mall"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_address">Address</Label>
                          <Input
                            id="edit_address"
                            value={editForm.address}
                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="e.g., Gulshan-2, Dhaka"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="schedule">
                    <TimeSlotForm form="edit" />
                  </TabsContent>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={actionStatus.loading}
                      className="flex-1"
                    >
                      {actionStatus.loading ? 'Updating...' : 'Update Slot'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}