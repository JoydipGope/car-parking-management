import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { 
  Home, 
  Plus, 
  MessageSquare, 
  BarChart3, 
  MapPin, 
  User, 
  Car, 
  Activity, 
  Send, 
  LogOut, 
  RefreshCw, 
  Clock, 
  DollarSign,
  Building,
  Settings,
  Eye,
  AlertTriangle,
  UserCheck
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

export function OwnerDashboardFixed({ 
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

  // Get owner's slots and related data
  const ownerSlots = slots.filter(slot => slot.ownerId === user.id);
  const ownerBookings = bookings.filter(booking => 
    ownerSlots.some(slot => slot.id === booking.slotId)
  );
  const unreadMessages = messages.filter(msg => !msg.isRead && msg.toUserId === user.id);
  const recentAlerts = securityAlerts.filter(alert => alert.status === 'open');

  // Handle Add New Space
  const handleAddNewSlot = () => {
    console.log('OwnerDashboard: handleAddNewSlot called', { newSlotForm });

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

  // Handle Send Message
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

  const getStatusColor = (status: string) => {
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
      case 'arrival': return <UserCheck className="h-4 w-4" />;
      case 'departure': return <LogOut className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'update': return <RefreshCw className="h-4 w-4" />;
      case 'inquiry': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRecentActivityForSlot = (slotId: string) => {
    return vehicleActivities
      .filter(activity => activity.slotId === slotId)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
  };

  console.log('OwnerDashboard: Rendering with dialog states', { isSlotDialogOpen, isMessageDialogOpen });

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
                <p className="text-sm text-gray-600">Manage your parking spaces and earnings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadMessages.length} new message{unreadMessages.length !== 1 ? 's' : ''}
                </Badge>
              )}
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spaces">My Spaces</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Spaces</CardTitle>
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
                  <CardTitle className="text-sm">Monthly Bookings</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{ownerBookings.length}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-blue-600">{unreadMessages.length}</div>
                  <p className="text-xs text-muted-foreground">Need attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-orange-600">{recentAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Security alerts</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {vehicleActivities.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vehicleActivities
                          .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                          .slice(0, 5)
                          .map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                  {/* Add New Space Button */}
                  <Button 
                    className="w-full"
                    onClick={() => {
                      console.log('OwnerDashboard: Add New Space button clicked directly');
                      setIsSlotDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Parking Space
                  </Button>

                  {/* Message Security Button */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      console.log('OwnerDashboard: Message Security button clicked directly');
                      setIsMessageDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Security
                  </Button>

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
              <Button 
                onClick={() => {
                  console.log('OwnerDashboard: Add New Space button clicked from spaces tab');
                  setIsSlotDialogOpen(true);
                }}
              >
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
                  <Button 
                    onClick={() => {
                      console.log('OwnerDashboard: Add Parking Space button clicked from empty state');
                      setIsSlotDialogOpen(true);
                    }}
                  >
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
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              console.log('OwnerDashboard: Message button clicked from slot card');
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
              <Button 
                onClick={() => {
                  console.log('OwnerDashboard: Send Message button clicked from messages tab');
                  setIsMessageDialogOpen(true);
                }}
              >
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

          {/* Activity Tab */}
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
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.loggedAt).toLocaleString()}
                                </p>
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

              {/* Recent Departures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Departures</span>
                    <LogOut className="h-5 w-5 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {vehicleActivities.filter(act => act.status === 'departed').length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        No recent departures
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vehicleActivities
                          .filter(act => act.status === 'departed')
                          .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                          .slice(0, 5)
                          .map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div>
                                <p className="text-sm">
                                  Space {activity.slotNumber} - {activity.vehicleNumber}
                                </p>
                                <p className="text-xs text-gray-600">{activity.driverName}</p>
                                <p className="text-xs text-gray-500">
                                  {activity.actualDeparture && new Date(activity.actualDeparture).toLocaleString()}
                                </p>
                              </div>
                              <Badge className={getActivityStatusColor(activity.status)}>
                                departed
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Earnings Overview</h2>
              <Button variant="outline" onClick={() => onNavigate('owner-analytics')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Detailed Analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-green-600">
                    ৳{ownerBookings.filter(b => b.status === 'completed').reduce((total, booking) => 
                      total + (booking.parkingDurationMinutes / 60) * 50, 0
                    ).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">This Month</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-blue-600">
                    ৳{ownerBookings
                      .filter(b => {
                        const bookingDate = new Date(b.createdAt);
                        const currentMonth = new Date();
                        return bookingDate.getMonth() === currentMonth.getMonth() && 
                               bookingDate.getFullYear() === currentMonth.getFullYear() &&
                               b.status === 'completed';
                      })
                      .reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0)
                      .toFixed(0)
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Current month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Average per Booking</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-purple-600">
                    ৳{ownerBookings.filter(b => b.status === 'completed').length > 0 
                      ? (ownerBookings.filter(b => b.status === 'completed').reduce((total, booking) => 
                          total + (booking.parkingDurationMinutes / 60) * 50, 0
                        ) / ownerBookings.filter(b => b.status === 'completed').length).toFixed(0)
                      : '0'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Per completed booking</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add New Slot Dialog */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
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
                placeholder="e.g., Green Villa Apartments"
                value={newSlotForm.locationName}
                onChange={(e) => setNewSlotForm(prev => ({ ...prev, locationName: e.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="location-address">Full Address</Label>
              <Input
                id="location-address"
                placeholder="Complete address with area, city, country"
                value={newSlotForm.locationAddress}
                onChange={(e) => setNewSlotForm(prev => ({ ...prev, locationAddress: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="pricing">Pricing per Hour (৳)</Label>
              <Input
                id="pricing"
                type="number"
                min="10"
                max="500"
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
            <Button 
              onClick={handleAddNewSlot} 
              disabled={!newSlotForm.number.trim() || !newSlotForm.locationName.trim() || !newSlotForm.locationAddress.trim()}
            >
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
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
                    placeholder="e.g., DHK-1234"
                    value={messageForm.vehicleNumber}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="driver-name">Driver Name</Label>
                  <Input
                    id="driver-name"
                    placeholder="Driver's name"
                    value={messageForm.driverName}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, driverName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="driver-phone">Driver Phone</Label>
                  <Input
                    id="driver-phone"
                    placeholder="+880-XXXX-XXXXX"
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
              <Label htmlFor="msg-content">Message</Label>
              <Textarea
                id="msg-content"
                placeholder="Type your message here..."
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
    </div>
  );
}