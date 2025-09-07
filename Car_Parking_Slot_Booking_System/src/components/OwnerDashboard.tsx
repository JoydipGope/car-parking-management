import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarInitials } from './ui/avatar';
import { 
  Home, 
  Car, 
  MessageSquare, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  Plus,
  Eye,
  Clock,
  User,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Send,
  RefreshCw,
  Activity,
  DollarSign,
  BarChart3,
  Settings,
  Camera,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import { User as UserType, ParkingSlot, Booking, SecurityMessage, VehicleActivity, SecurityAlert } from '../App';

interface OwnerDashboardProps {
  user: UserType;
  slots: ParkingSlot[];
  bookings: Booking[];
  messages: SecurityMessage[];
  vehicleActivities: VehicleActivity[];
  securityAlerts: SecurityAlert[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onUpdateSlots: (slots: ParkingSlot[]) => void;
  onSendMessage: (message: Omit<SecurityMessage, 'id' | 'timestamp' | 'isRead'>) => void;
  onMarkMessageAsRead: (messageId: string) => void;
}

export function OwnerDashboard({ 
  user, 
  slots, 
  bookings, 
  messages,
  vehicleActivities,
  securityAlerts,
  onNavigate, 
  onLogout, 
  onUpdateSlots,
  onSendMessage,
  onMarkMessageAsRead
}: OwnerDashboardProps) {
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // Add debugging for dialog states
  console.log('OwnerDashboard: Dialog states', { isSlotDialogOpen, isMessageDialogOpen });
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<VehicleActivity | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [newSlotForm, setNewSlotForm] = useState({
    number: '',
    locationName: '',
    locationAddress: '',
    spaceType: 'residential' as 'residential' | 'commercial' | 'private',
    pricingPerHour: 50,
    availableDurationMinutes: 240,
    description: '',
    rules: '',
    amenities: [] as string[]
  });

  const [messageForm, setMessageForm] = useState({
    messageType: 'general' as SecurityMessage['messageType'],
    subject: '',
    message: '',
    isUrgent: false,
    slotId: undefined as string | undefined,
    expectedArrival: '',
    expectedDeparture: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: ''
  });

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing owner dashboard data...');
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Get owner's slots and related data
  const ownerSlots = slots.filter(slot => slot.ownerId === user.id);
  const ownerBookings = bookings.filter(booking => 
    ownerSlots.some(slot => slot.id === booking.slotId)
  );
  const unreadMessages = messages.filter(msg => !msg.isRead && msg.toUserId === user.id);
  const recentActivities = vehicleActivities.slice(0, 10);
  const activeAlerts = securityAlerts.filter(alert => alert.status === 'open');

  // Calculate earnings
  const monthlyEarnings = ownerBookings
    .filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      const currentMonth = new Date();
      return bookingDate.getMonth() === currentMonth.getMonth() && 
             bookingDate.getFullYear() === currentMonth.getFullYear() &&
             booking.status === 'completed';
    })
    .reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);

  const getStatusColor = (status: ParkingSlot['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStatusColor = (status: VehicleActivity['status']) => {
    switch (status) {
      case 'expected': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'departed': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'early': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeIcon = (type: SecurityMessage['messageType']) => {
    switch (type) {
      case 'arrival': return <Car className="h-4 w-4 text-green-600" />;
      case 'departure': return <LogOut className="h-4 w-4 text-blue-600" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'update': return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'inquiry': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAddNewSlot = () => {
    // Validate required fields
    if (!newSlotForm.number.trim()) {
      alert('Please enter a space number/name');
      return;
    }
    if (!newSlotForm.locationName.trim()) {
      alert('Please enter a property/building name');
      return;
    }
    if (!newSlotForm.locationAddress.trim()) {
      alert('Please enter the full address');
      return;
    }

    const newSlot: ParkingSlot = {
      id: `slot-${Date.now()}`,
      number: newSlotForm.number.trim(),
      status: 'pending',
      locationId: `location-${Date.now()}`,
      locationName: newSlotForm.locationName.trim(),
      locationAddress: newSlotForm.locationAddress.trim(),
      availableDurationMinutes: newSlotForm.availableDurationMinutes,
      availableTimeSlots: [],
      ownerId: user.id,
      ownerName: user.name,
      ownerContact: user.phone || user.email,
      spaceType: newSlotForm.spaceType,
      isOwnerApproved: false,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    onUpdateSlots([...slots, newSlot]);

    // Show success message
    alert(`Parking space "${newSlotForm.number}" has been submitted for admin approval!`);

    // Reset form
    setNewSlotForm({
      number: '',
      locationName: '',
      locationAddress: '',
      spaceType: 'residential',
      pricingPerHour: 50,
      availableDurationMinutes: 240,
      description: '',
      rules: '',
      amenities: []
    });
    setIsSlotDialogOpen(false);
  };

  const handleSendMessage = () => {
    console.log('OwnerDashboard: handleSendMessage called', { messageForm });

    // Validate required fields
    if (!messageForm.subject.trim()) {
      alert('Please enter a subject for your message');
      return;
    }
    if (!messageForm.message.trim()) {
      alert('Please enter your message');
      return;
    }

    // Find security guard (in a real app, this would be more sophisticated)
    const securityGuard = { id: 'security-1', name: 'Mohammad Rahman' };
    const targetSlot = messageForm.slotId ? slots.find(s => s.id === messageForm.slotId) : undefined;

    console.log('OwnerDashboard: Sending message', { securityGuard, targetSlot, messageForm });

    onSendMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'owner',
      toUserId: securityGuard.id,
      toUserName: securityGuard.name,
      toUserRole: 'security',
      slotId: messageForm.slotId || undefined,
      slotNumber: targetSlot?.number || undefined,
      messageType: messageForm.messageType,
      subject: messageForm.subject.trim(),
      message: messageForm.message.trim(),
      isUrgent: messageForm.isUrgent,
      metadata: {
        vehicleNumber: messageForm.vehicleNumber || undefined,
        driverName: messageForm.driverName || undefined,
        driverPhone: messageForm.driverPhone || undefined,
        expectedTime: messageForm.expectedArrival || undefined
      }
    });

    // Show success message
    alert('Message sent to security successfully!');

    // Reset form
    setMessageForm({
      messageType: 'general',
      subject: '',
      message: '',
      isUrgent: false,
      slotId: undefined,
      expectedArrival: '',
      expectedDeparture: '',
      vehicleNumber: '',
      driverName: '',
      driverPhone: ''
    });
    setIsMessageDialogOpen(false);
  };

  const getRecentActivityForSlot = (slotId: string) => {
    return vehicleActivities
      .filter(activity => activity.slotId === slotId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Property Owner Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your parking spaces and stay connected with security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={autoRefresh} 
                  onCheckedChange={setAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh" className="text-sm">Live updates</Label>
              </div>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {(unreadMessages.length > 0 || activeAlerts.length > 0) && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadMessages.length + activeAlerts.length}
                  </Badge>
                )}
              </div>
              <Avatar>
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">My Parking Spaces</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{ownerSlots.length}</div>
              <p className="text-xs text-muted-foreground">
                {ownerSlots.filter(s => s.isOwnerApproved).length} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Active Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-blue-600">
                {ownerBookings.filter(b => b.status === 'active' || b.status === 'upcoming').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently occupied</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Monthly Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">৳{monthlyEarnings.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">New Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-orange-600">{unreadMessages.length}</div>
              <p className="text-xs text-muted-foreground">From security</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Security Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-red-600">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Updates Alert */}
        {unreadMessages.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''} from security. 
              <Button variant="link" className="h-auto p-0 ml-2" onClick={() => onMarkMessageAsRead(unreadMessages[0].id)}>
                View Messages
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spaces">My Spaces</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Activity className="h-5 w-5 text-gray-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {recentActivities.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex-shrink-0">
                              {activity.status === 'arrived' ? (
                                <Car className="h-5 w-5 text-green-600" />
                              ) : activity.status === 'departed' ? (
                                <LogOut className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-900">
                                  Slot {activity.slotNumber} - {activity.vehicleNumber}
                                </p>
                                <Badge className={getActivityStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                Driver: {activity.driverName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(activity.loggedAt).toLocaleString()}
                              </p>
                              {activity.notes && (
                                <p className="text-xs text-gray-600 mt-1 italic">
                                  "{activity.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Parking Space
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Parking Space</DialogTitle>
                        <DialogDescription>
                          Register a new parking space for rental. It will need admin approval before becoming active.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="slot-number">Space Number/Name</Label>
                          <Input
                            id="slot-number"
                            placeholder="e.g., A25, Garage-1"
                            value={newSlotForm.number}
                            onChange={(e) => setNewSlotForm(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="space-type">Space Type</Label>
                          <Select value={newSlotForm.spaceType} onValueChange={(value: 'residential' | 'commercial' | 'private') => 
                            setNewSlotForm(prev => ({ ...prev, spaceType: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="location-name">Property/Building Name</Label>
                          <Input
                            id="location-name"
                            placeholder="e.g., Rose Garden Apartments"
                            value={newSlotForm.locationName}
                            onChange={(e) => setNewSlotForm(prev => ({ ...prev, locationName: e.target.value }))}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="location-address">Full Address</Label>
                          <Input
                            id="location-address"
                            placeholder="House/Plot, Road, Area, City"
                            value={newSlotForm.locationAddress}
                            onChange={(e) => setNewSlotForm(prev => ({ ...prev, locationAddress: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="pricing">Hourly Rate (৳)</Label>
                          <Input
                            id="pricing"
                            type="number"
                            value={newSlotForm.pricingPerHour}
                            onChange={(e) => setNewSlotForm(prev => ({ ...prev, pricingPerHour: parseInt(e.target.value) || 0 }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="duration">Max Duration (Hours)</Label>
                          <Select value={String(newSlotForm.availableDurationMinutes / 60)} onValueChange={(value) => 
                            setNewSlotForm(prev => ({ ...prev, availableDurationMinutes: parseInt(value) * 60 }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Hour</SelectItem>
                              <SelectItem value="2">2 Hours</SelectItem>
                              <SelectItem value="4">4 Hours</SelectItem>
                              <SelectItem value="8">8 Hours</SelectItem>
                              <SelectItem value="12">12 Hours</SelectItem>
                              <SelectItem value="24">24 Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="description">Description & Rules</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe your parking space, any rules, and special instructions..."
                            value={newSlotForm.description}
                            onChange={(e) => setNewSlotForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSlotDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddNewSlot} disabled={!newSlotForm.number.trim() || !newSlotForm.locationName.trim() || !newSlotForm.locationAddress.trim()}>
                          Submit for Approval
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Security
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Send Message to Security</DialogTitle>
                        <DialogDescription>
                          Communicate with security about your parking spaces, expected visitors, or any concerns.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="msg-type">Message Type</Label>
                          <Select value={messageForm.messageType} onValueChange={(value: SecurityMessage['messageType']) => 
                            setMessageForm(prev => ({ ...prev, messageType: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General Information</SelectItem>
                              <SelectItem value="update">Visitor Information</SelectItem>
                              <SelectItem value="inquiry">Question/Request</SelectItem>
                              <SelectItem value="alert">Report Issue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="msg-slot">Related Parking Space</Label>
                          <Select value={messageForm.slotId || undefined} onValueChange={(value) => 
                            setMessageForm(prev => ({ ...prev, slotId: value === 'none' ? undefined : value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="Select space (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No specific space</SelectItem>
                              {ownerSlots.map((slot) => (
                                <SelectItem key={slot.id} value={slot.id}>
                                  {slot.number} - {slot.locationName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label htmlFor="msg-subject">Subject</Label>
                          <Input
                            id="msg-subject"
                            placeholder="Brief subject line"
                            value={messageForm.subject}
                            onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                          />
                        </div>

                        {messageForm.messageType === 'update' && (
                          <>
                            <div>
                              <Label htmlFor="vehicle-number">Vehicle Number</Label>
                              <Input
                                id="vehicle-number"
                                placeholder="DHK-1234"
                                value={messageForm.vehicleNumber}
                                onChange={(e) => setMessageForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label htmlFor="driver-name">Driver Name</Label>
                              <Input
                                id="driver-name"
                                placeholder="Enter driver name"
                                value={messageForm.driverName}
                                onChange={(e) => setMessageForm(prev => ({ ...prev, driverName: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label htmlFor="driver-phone">Driver Phone</Label>
                              <Input
                                id="driver-phone"
                                placeholder="+880-1XXX-XXXXXX"
                                value={messageForm.driverPhone}
                                onChange={(e) => setMessageForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                              />
                            </div>

                            <div>
                              <Label htmlFor="expected-arrival">Expected Arrival</Label>
                              <Input
                                id="expected-arrival"
                                type="datetime-local"
                                value={messageForm.expectedArrival}
                                onChange={(e) => setMessageForm(prev => ({ ...prev, expectedArrival: e.target.value }))}
                              />
                            </div>
                          </>
                        )}

                        <div className="col-span-2">
                          <Label htmlFor="msg-message">Message</Label>
                          <Textarea
                            id="msg-message"
                            placeholder="Enter your message..."
                            value={messageForm.message}
                            onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                            rows={4}
                          />
                        </div>

                        <div className="col-span-2 flex items-center space-x-2">
                          <Switch
                            id="urgent"
                            checked={messageForm.isUrgent}
                            onCheckedChange={(checked) => setMessageForm(prev => ({ ...prev, isUrgent: checked }))}
                          />
                          <Label htmlFor="urgent">Mark as urgent</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSendMessage} 
                          disabled={!messageForm.subject.trim() || !messageForm.message.trim()}
                        >
                          Send Message
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full" onClick={() => onNavigate('owner-analytics')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Spaces Tab */}
          <TabsContent value="spaces" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">My Parking Spaces</h2>
              <Button onClick={() => setIsSlotDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Space
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerSlots.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-600 mb-2">No parking spaces yet</h3>
                  <p className="text-gray-500 mb-4">Add your first parking space to start earning.</p>
                  <Button onClick={() => setIsSlotDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parking Space
                  </Button>
                </div>
              ) : (
                ownerSlots.map((slot) => {
                  const recentActivity = getRecentActivityForSlot(slot.id);
                  const relatedBookings = ownerBookings.filter(b => b.slotId === slot.id);
                  
                  return (
                    <Card key={slot.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>Space {slot.number}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(slot.status)}>
                              {slot.status}
                            </Badge>
                            {!slot.isOwnerApproved && (
                              <Badge variant="outline" className="text-xs">
                                Awaiting Approval
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                        <CardDescription>
                          <span className="block">
                            <span className="flex items-center space-x-1 mb-1">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{slot.locationName}</span>
                            </span>
                            <span className="text-xs text-gray-500">{slot.locationAddress}</span>
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {recentActivity ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{recentActivity.vehicleNumber}</span>
                              </div>
                              <Badge className={getActivityStatusColor(recentActivity.status)}>
                                {recentActivity.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Driver: {recentActivity.driverName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(recentActivity.loggedAt).toLocaleString()}
                            </p>
                            {recentActivity.notes && (
                              <p className="text-xs text-gray-600 mt-2 italic">
                                "{recentActivity.notes}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 text-center">
                            No recent activity
                          </div>
                        )}

                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Bookings:</span>
                            <span>{relatedBookings.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>This Month:</span>
                            <span>
                              {relatedBookings.filter(b => {
                                const bookingDate = new Date(b.createdAt);
                                const currentMonth = new Date();
                                return bookingDate.getMonth() === currentMonth.getMonth() && 
                                       bookingDate.getFullYear() === currentMonth.getFullYear();
                              }).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Space Type:</span>
                            <span className="capitalize">{slot.spaceType}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setMessageForm(prev => ({ ...prev, slotId: slot.id }));
                              setIsMessageDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Security Communications</h2>
              <Button onClick={() => setIsMessageDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>

            <div className="space-y-4">
              <ScrollArea className="h-96">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  messages
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((message) => (
                      <Card key={message.id} className={`mb-4 ${!message.isRead ? 'border-blue-200 bg-blue-50' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getMessageTypeIcon(message.messageType)}
                              <span className="text-sm">
                                {message.fromUserRole === 'owner' ? 'To' : 'From'}: {message.fromUserRole === 'owner' ? message.toUserName : message.fromUserName}
                              </span>
                              {message.isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <CardTitle className="text-base">{message.subject}</CardTitle>
                          {message.slotNumber && (
                            <CardDescription>
                              <span className="inline-flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>Space {message.slotNumber}</span>
                              </span>
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 mb-3">{message.message}</p>
                          
                          {message.metadata && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {message.metadata.vehicleNumber && (
                                <div>Vehicle: {message.metadata.vehicleNumber}</div>
                              )}
                              {message.metadata.driverName && (
                                <div>Driver: {message.metadata.driverName}</div>
                              )}
                              {message.metadata.driverPhone && (
                                <div>Phone: {message.metadata.driverPhone}</div>
                              )}
                            </div>
                          )}

                          {!message.isRead && message.toUserId === user.id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3"
                              onClick={() => onMarkMessageAsRead(message.id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Live Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Live Activity Monitor</h2>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Activity</span>
                    <Activity className="h-5 w-5 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {vehicleActivities.filter(act => act.status === 'arrived' || act.status === 'expected').length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        No current activity
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vehicleActivities
                          .filter(act => act.status === 'arrived' || act.status === 'expected')
                          .map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div>
                                <p className="text-sm">
                                  Space {activity.slotNumber} - {activity.vehicleNumber}
                                </p>
                                <p className="text-xs text-gray-600">{activity.driverName}</p>
                              </div>
                              <Badge className={getActivityStatusColor(activity.status)}>
                                {activity.status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Today's Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Activities</span>
                      <span className="text-lg">{recentActivities.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Vehicle Arrivals</span>
                      <span className="text-lg text-green-600">
                        {vehicleActivities.filter(act => 
                          act.status === 'arrived' && 
                          new Date(act.loggedAt).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Vehicle Departures</span>
                      <span className="text-lg text-blue-600">
                        {vehicleActivities.filter(act => 
                          act.status === 'departed' && 
                          new Date(act.loggedAt).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue Vehicles</span>
                      <span className="text-lg text-red-600">
                        {vehicleActivities.filter(act => act.status === 'overdue').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {vehicleActivities.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No activities logged yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vehicleActivities
                        .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                        .map((activity) => (
                          <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm">
                                  <strong>Space {activity.slotNumber}</strong> - {activity.vehicleNumber}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Driver: {activity.driverName} | Phone: {activity.driverPhone}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Logged by: {activity.loggedBy} at {new Date(activity.loggedAt).toLocaleString()}
                                </p>
                                {activity.notes && (
                                  <p className="text-xs text-gray-600 mt-1 italic">
                                    Note: "{activity.notes}"
                                  </p>
                                )}
                              </div>
                              <Badge className={getActivityStatusColor(activity.status)}>
                                {activity.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Earnings & Analytics</h2>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-green-600 mb-2">৳{monthlyEarnings.toFixed(0)}</div>
                  <p className="text-xs text-gray-500">
                    From {ownerBookings.filter(b => {
                      const bookingDate = new Date(b.createdAt);
                      const currentMonth = new Date();
                      return bookingDate.getMonth() === currentMonth.getMonth() && 
                             bookingDate.getFullYear() === currentMonth.getFullYear() &&
                             b.status === 'completed';
                    }).length} completed bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-blue-600 mb-2">
                    ৳{ownerBookings
                      .filter(b => b.status === 'completed')
                      .reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0)
                      .toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-500">
                    From {ownerBookings.filter(b => b.status === 'completed').length} bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Occupancy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-purple-600 mb-2">
                    {ownerSlots.length > 0 
                      ? Math.round((ownerBookings.filter(b => b.status === 'active' || b.status === 'upcoming').length / ownerSlots.filter(s => s.isOwnerApproved).length) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-500">Current utilization</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ownerSlots.map((slot) => {
                    const slotBookings = ownerBookings.filter(b => b.slotId === slot.id && b.status === 'completed');
                    const slotEarnings = slotBookings.reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);
                    
                    return (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm">Space {slot.number}</p>
                          <p className="text-xs text-gray-600">{slot.locationName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">৳{slotEarnings.toFixed(0)}</p>
                          <p className="text-xs text-gray-500">{slotBookings.length} bookings</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parking Space Details</DialogTitle>
            <DialogDescription>
              Detailed information and activity for this parking space
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Space Number</Label>
                  <p className="text-sm text-gray-700">{selectedSlot.number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedSlot.status)}>
                    {selectedSlot.status}
                  </Badge>
                </div>
                <div>
                  <Label>Property Name</Label>
                  <p className="text-sm text-gray-700">{selectedSlot.locationName}</p>
                </div>
                <div>
                  <Label>Space Type</Label>
                  <p className="text-sm text-gray-700 capitalize">{selectedSlot.spaceType}</p>
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <p className="text-sm text-gray-700">{selectedSlot.locationAddress}</p>
                </div>
                <div>
                  <Label>Approval Status</Label>
                  <Badge variant={selectedSlot.isOwnerApproved ? 'default' : 'secondary'}>
                    {selectedSlot.approvalStatus || 'approved'}
                  </Badge>
                </div>
                <div>
                  <Label>Max Duration</Label>
                  <p className="text-sm text-gray-700">{Math.round(selectedSlot.availableDurationMinutes / 60)} hours</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Recent Activity</Label>
                <div className="mt-2 space-y-2">
                  {vehicleActivities
                    .filter(act => act.slotId === selectedSlot.id)
                    .slice(0, 5)
                    .map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm">{activity.vehicleNumber} - {activity.driverName}</p>
                          <p className="text-xs text-gray-500">{new Date(activity.loggedAt).toLocaleString()}</p>
                        </div>
                        <Badge className={getActivityStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  {vehicleActivities.filter(act => act.slotId === selectedSlot.id).length === 0 && (
                    <p className="text-sm text-gray-500">No activity recorded yet</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Booking History</Label>
                <div className="mt-2 space-y-2">
                  {ownerBookings
                    .filter(b => b.slotId === selectedSlot.id)
                    .slice(0, 5)
                    .map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm">{booking.userName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.startTime).toLocaleDateString()} - {Math.round(booking.parkingDurationMinutes / 60)}h
                          </p>
                        </div>
                        <Badge variant={
                          booking.status === 'completed' ? 'default' :
                          booking.status === 'active' ? 'secondary' :
                          booking.status === 'upcoming' ? 'outline' : 'destructive'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  {ownerBookings.filter(b => b.slotId === selectedSlot.id).length === 0 && (
                    <p className="text-sm text-gray-500">No bookings yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}