import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Plus, Building, Clock, User, Phone, CheckCircle, XCircle, Loader2, Wifi, WifiOff, Bell } from 'lucide-react';
import { MobileHeader } from './common/MobileHeader';
import { mockApi, mockSocket } from './services/mockApi';
import type { User, ParkingSlot, Location, Manager } from '../App';

interface ManagerDashboardProps {
  user: User;
  slots: ParkingSlot[];
  locations: Location[];
  managers: Manager[];
  onUpdateSlots: (slots: ParkingSlot[]) => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function ManagerDashboard({
  user,
  slots,
  locations,
  managers,
  onUpdateSlots,
  onNavigate,
  onLogout
}: ManagerDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    slotNumber: '',
    tenantName: '',
    tenantContact: '',
    locationId: '',
    newLocationName: '',
    newLocationAddress: '',
    availableDurationMinutes: 60
  });

  // Get tenant slots created by this manager
  const managerSlots = slots.filter(slot => slot.managerId === user.id);
  const pendingSlots = managerSlots.filter(slot => slot.status === 'pending');
  const approvedSlots = managerSlots.filter(slot => slot.status !== 'pending');

  // Socket.IO connection and real-time updates
  useEffect(() => {
    // Set up Socket.IO listeners
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Manager dashboard connected to Socket.IO');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Manager dashboard disconnected from Socket.IO');
    };

    const handleSlotApproved = ({ slot_id }: { slot_id: string }) => {
      console.log('Slot approved:', slot_id);
      // Update the local slots state to reflect the approval
      onUpdateSlots(prev => 
        prev.map(slot => 
          slot.id === slot_id 
            ? { ...slot, status: 'available' as const }
            : slot
        )
      );

      // Add notification
      const slot = slots.find(s => s.id === slot_id);
      if (slot) {
        const notification = `✅ Your tenant slot ${slot.number} for ${slot.tenantName} has been approved!`;
        setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
      }
    };

    const handleSlotRejected = ({ slot_id, reason }: { slot_id: string; reason?: string }) => {
      console.log('Slot rejected:', slot_id, reason);
      // Remove the rejected slot from the local state
      const slot = slots.find(s => s.id === slot_id);
      if (slot) {
        onUpdateSlots(prev => prev.filter(s => s.id !== slot_id));
        const notification = `❌ Your tenant slot ${slot.number} was rejected${reason ? `: ${reason}` : ''}`;
        setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5
      }
    };

    const handleNotification = ({ userId, message }: { userId: number; message: string }) => {
      // Only show notifications for this manager
      if (userId.toString() === user.id) {
        setRecentNotifications(prev => [message, ...prev.slice(0, 4)]); // Keep last 5
      }
    };

    // Register event listeners
    mockSocket.on('connect', handleConnect);
    mockSocket.on('disconnect', handleDisconnect);
    mockSocket.on('slot_approved', handleSlotApproved);
    mockSocket.on('slot_rejected', handleSlotRejected);
    mockSocket.on('notification', handleNotification);

    // Check initial connection status
    if (mockSocket.isConnected) {
      setIsConnected(true);
    }

    // Cleanup on unmount
    return () => {
      mockSocket.off('connect', handleConnect);
      mockSocket.off('disconnect', handleDisconnect);
      mockSocket.off('slot_approved', handleSlotApproved);
      mockSocket.off('slot_rejected', handleSlotRejected);
      mockSocket.off('notification', handleNotification);
    };
  }, [user.id, onUpdateSlots, slots]);

  const handleCreateTenantSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const manager = managers.find(m => m.id === user.id);
      if (!manager) {
        throw new Error('Manager not found');
      }

      // Create the slot data
      const slotData = {
        slot_number: formData.slotNumber,
        manager_id: user.id,
        tenant_name: formData.tenantName,
        tenant_contact: formData.tenantContact,
        location_id: (formData.locationId && formData.locationId !== "new") ? formData.locationId : undefined,
        location_name: (formData.locationId && formData.locationId !== "new") ? undefined : formData.newLocationName,
        address: (formData.locationId && formData.locationId !== "new") ? undefined : formData.newLocationAddress,
        available_duration_minutes: formData.availableDurationMinutes
      };

      // Use mock API to create tenant slot
      const response = await mockApi.createTenantSlot(slotData);

      if (response.success) {
        // Create new slot object
        const newSlot: ParkingSlot = {
          id: response.slot_id,
          number: formData.slotNumber,
          status: 'pending',
          locationId: (formData.locationId && formData.locationId !== "new") ? formData.locationId : `location-${Date.now()}`,
          locationName: (formData.locationId && formData.locationId !== "new")
            ? locations.find(l => l.id === formData.locationId)?.name 
            : formData.newLocationName,
          locationAddress: (formData.locationId && formData.locationId !== "new")
            ? locations.find(l => l.id === formData.locationId)?.address 
            : formData.newLocationAddress,
          availableDurationMinutes: formData.availableDurationMinutes,
          managerId: user.id,
          managerName: manager.name,
          tenantName: formData.tenantName,
          tenantContact: formData.tenantContact,
          createdAt: new Date().toISOString().split('T')[0]
        };

        // Update slots
        onUpdateSlots([...slots, newSlot]);

        // Reset form
        setFormData({
          slotNumber: '',
          tenantName: '',
          tenantContact: '',
          locationId: '',
          newLocationName: '',
          newLocationAddress: '',
          availableDurationMinutes: 60
        });

        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating tenant slot:', error);
      alert('Failed to create tenant slot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4" />;
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'booked':
      case 'upcoming':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden md:block bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-sm text-gray-600">Manage tenant parking slots</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Connection Status & Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Wifi className="w-4 h-4" />
                <span>Connected - Real-time updates active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <WifiOff className="w-4 h-4" />
                <span>Disconnected - Refresh to reconnect</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Bell className="w-4 h-4" />
            <AlertTitle className="text-blue-900">Recent Updates</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="space-y-1">
                {recentNotifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="text-sm">
                    {notification}
                  </div>
                ))}
                {recentNotifications.length > 3 && (
                  <div className="text-xs text-blue-600 mt-2">
                    +{recentNotifications.length - 3} more notifications
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Create Tenant Slot Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4 mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Tenant Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Tenant Slot</DialogTitle>
                <DialogDescription>
                  Create a new tenant parking slot with location and tenant details. This slot will require admin approval before becoming available for booking.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTenantSlot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slotNumber">Slot Number</Label>
                  <Input
                    id="slotNumber"
                    value={formData.slotNumber}
                    onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })}
                    placeholder="e.g., T01, B15"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantName">Tenant/Business Name</Label>
                  <Input
                    id="tenantName"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    placeholder="e.g., ABC Restaurant"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantContact">Tenant Contact</Label>
                  <Input
                    id="tenantContact"
                    value={formData.tenantContact}
                    onChange={(e) => setFormData({ ...formData, tenantContact: e.target.value })}
                    placeholder="Phone or email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) => setFormData({ ...formData, locationId: value === "new" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing location or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Create New Location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.locationId === "" || formData.locationId === "new") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newLocationName">New Location Name</Label>
                      <Input
                        id="newLocationName"
                        value={formData.newLocationName}
                        onChange={(e) => setFormData({ ...formData, newLocationName: e.target.value })}
                        placeholder="e.g., Shopping Center Parking"
                        required={formData.locationId === "" || formData.locationId === "new"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newLocationAddress">Address</Label>
                      <Textarea
                        id="newLocationAddress"
                        value={formData.newLocationAddress}
                        onChange={(e) => setFormData({ ...formData, newLocationAddress: e.target.value })}
                        placeholder="Full address with area and city"
                        required={formData.locationId === "" || formData.locationId === "new"}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="duration">Available Duration (minutes)</Label>
                  <Select
                    value={formData.availableDurationMinutes.toString()}
                    onValueChange={(value) => setFormData({ ...formData, availableDurationMinutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Slot'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Slots</p>
                  <p className="text-xl font-semibold">{managerSlots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-xl font-semibold">{pendingSlots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-xl font-semibold">{approvedSlots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booked</p>
                  <p className="text-xl font-semibold">
                    {approvedSlots.filter(s => s.status === 'booked' || s.status === 'upcoming').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Slots List */}
        <Card>
          <CardHeader>
            <CardTitle>My Tenant Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {managerSlots.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tenant slots yet</h3>
                <p className="text-gray-600 mb-4">Create your first tenant slot to get started</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tenant Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {managerSlots.map((slot) => (
                  <div key={slot.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">Slot {slot.number}</h3>
                          <Badge className={`border ${getStatusColor(slot.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(slot.status)}
                              {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                            </span>
                          </Badge>
                          {slot.status === 'pending' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200">
                              Awaiting Admin Approval
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>Tenant: {slot.tenantName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>Contact: {slot.tenantContact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>Location: {slot.locationName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Duration: {slot.availableDurationMinutes} min</span>
                          </div>
                        </div>

                        {slot.locationAddress && (
                          <p className="text-sm text-gray-500 mt-2">{slot.locationAddress}</p>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        Created: {new Date(slot.createdAt || '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}