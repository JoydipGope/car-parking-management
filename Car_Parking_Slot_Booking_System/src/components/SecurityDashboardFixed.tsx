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
import { 
  Car, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  Shield,
  MessageSquare,
  Camera,
  AlertTriangle,
  Send,
  RefreshCw,
  Activity,
  UserCheck,
  FileText,
  Calendar,
  Timer,
  Zap
} from 'lucide-react';
import { User as UserType, ParkingSlot, Booking, SecurityMessage, VehicleActivity, SecurityAlert } from '../App';

interface SecurityDashboardProps {
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
  onLogVehicleActivity: (activity: Omit<VehicleActivity, 'id' | 'loggedAt'>) => void;
  onCreateAlert: (alert: Omit<SecurityAlert, 'id' | 'reportedAt' | 'status'>) => void;
  onResolveAlert: (alertId: string, resolution: string) => void;
  onMarkMessageAsRead: (messageId: string) => void;
}

export function SecurityDashboardFixed({ 
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
  onLogVehicleActivity,
  onCreateAlert,
  onResolveAlert,
  onMarkMessageAsRead
}: SecurityDashboardProps) {
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isResolveAlertDialogOpen, setIsResolveAlertDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  
  const [activityForm, setActivityForm] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    activityType: 'arrival' as 'arrival' | 'departure',
    actualTime: new Date().toISOString().slice(0, 16),
    notes: '',
    photos: [] as string[]
  });

  const [messageForm, setMessageForm] = useState({
    toUserId: undefined as string | undefined,
    messageType: 'general' as SecurityMessage['messageType'],
    subject: '',
    message: '',
    isUrgent: false,
    slotId: undefined as string | undefined
  });

  const [alertForm, setAlertForm] = useState({
    slotId: undefined as string | undefined,
    alertType: 'violation' as SecurityAlert['alertType'],
    priority: 'medium' as SecurityAlert['priority'],
    description: ''
  });

  const [resolutionForm, setResolutionForm] = useState({
    resolution: ''
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing security dashboard data...');
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Get owner slots with current status
  const ownerSlots = slots.filter(slot => slot.ownerId && slot.isOwnerApproved);
  const unreadMessages = messages.filter(msg => !msg.isRead && msg.toUserId === user.id);
  const activeAlerts = securityAlerts.filter(alert => alert.status === 'open');
  const todayActivities = vehicleActivities.filter(activity => {
    const activityDate = new Date(activity.loggedAt).toDateString();
    const today = new Date().toDateString();
    return activityDate === today;
  });

  // Get unique owners for messaging
  const uniqueOwners = ownerSlots.reduce((acc, slot) => {
    if (slot.ownerId && slot.ownerName && !acc.find(owner => owner.id === slot.ownerId)) {
      acc.push({
        id: slot.ownerId,
        name: slot.ownerName,
        contact: slot.ownerContact
      });
    }
    return acc;
  }, [] as Array<{ id: string; name: string; contact?: string }>);

  const getStatusColor = (status: VehicleActivity['status']) => {
    switch (status) {
      case 'expected': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-green-100 text-green-800';
      case 'departed': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'early': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertPriorityColor = (priority: SecurityAlert['priority']) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
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

  const handleLogActivity = () => {
    console.log('SecurityDashboard: handleLogActivity called', { selectedSlot, activityForm });

    if (!selectedSlot) {
      alert('Please select a parking slot');
      return;
    }

    // Validate required fields
    if (!activityForm.vehicleNumber.trim()) {
      alert('Please enter the vehicle number');
      return;
    }
    if (!activityForm.driverName.trim()) {
      alert('Please enter the driver name');
      return;
    }

    const relatedBooking = bookings.find(b => 
      b.slotId === selectedSlot.id && (b.status === 'upcoming' || b.status === 'active')
    );

    console.log('SecurityDashboard: Logging activity', { selectedSlot, relatedBooking, activityForm });

    onLogVehicleActivity({
      slotId: selectedSlot.id,
      slotNumber: selectedSlot.number,
      ownerId: selectedSlot.ownerId || '',
      ownerName: selectedSlot.ownerName || '',
      vehicleNumber: activityForm.vehicleNumber.trim(),
      driverName: activityForm.driverName.trim(),
      driverPhone: activityForm.driverPhone.trim(),
      bookingId: relatedBooking?.id,
      expectedArrival: relatedBooking?.startTime || new Date().toISOString(),
      expectedDeparture: relatedBooking?.endTime || new Date(Date.now() + 3600000).toISOString(),
      actualArrival: activityForm.activityType === 'arrival' ? activityForm.actualTime : undefined,
      actualDeparture: activityForm.activityType === 'departure' ? activityForm.actualTime : undefined,
      status: activityForm.activityType === 'arrival' ? 'arrived' : 'departed',
      notes: activityForm.notes.trim(),
      loggedBy: user.name,
      photos: {
        [activityForm.activityType]: activityForm.photos
      }
    });

    // Show success message
    alert(`Vehicle activity logged for slot ${selectedSlot.number} successfully!`);

    // Reset form and close dialog
    setActivityForm({
      vehicleNumber: '',
      driverName: '',
      driverPhone: '',
      activityType: 'arrival',
      actualTime: new Date().toISOString().slice(0, 16),
      notes: '',
      photos: []
    });
    setIsActivityDialogOpen(false);
    setSelectedSlot(null);
  };

  const handleSendMessage = () => {
    console.log('SecurityDashboard: handleSendMessage called', { messageForm, ownerSlots: ownerSlots.length });

    // Validate required fields
    if (!messageForm.toUserId) {
      alert('Please select an owner to send the message to');
      return;
    }
    if (!messageForm.subject.trim()) {
      alert('Please enter a subject for your message');
      return;
    }
    if (!messageForm.message.trim()) {
      alert('Please enter your message');
      return;
    }

    const targetSlot = messageForm.slotId ? slots.find(s => s.id === messageForm.slotId) : undefined;
    const targetOwner = ownerSlots.find(s => s.ownerId === messageForm.toUserId);
    
    console.log('SecurityDashboard: Sending message', { targetOwner, targetSlot, messageForm });

    onSendMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'security',
      toUserId: messageForm.toUserId,
      toUserName: targetOwner?.ownerName || 'Owner',
      toUserRole: 'owner',
      slotId: messageForm.slotId || undefined,
      slotNumber: targetSlot?.number || undefined,
      messageType: messageForm.messageType,
      subject: messageForm.subject.trim(),
      message: messageForm.message.trim(),
      isUrgent: messageForm.isUrgent
    });

    // Show success message
    alert(`Message sent to ${targetOwner?.ownerName || 'Owner'} successfully!`);

    // Reset form and close dialog
    setMessageForm({
      toUserId: undefined,
      messageType: 'general',
      subject: '',
      message: '',
      isUrgent: false,
      slotId: undefined
    });
    setIsMessageDialogOpen(false);
  };

  const handleCreateAlert = () => {
    console.log('SecurityDashboard: handleCreateAlert called', { alertForm });

    // Validate required fields
    if (!alertForm.slotId) {
      alert('Please select a parking slot');
      return;
    }
    if (!alertForm.description.trim()) {
      alert('Please enter a description for the alert');
      return;
    }

    const targetSlot = slots.find(s => s.id === alertForm.slotId);
    console.log('SecurityDashboard: Creating alert for slot', { targetSlot, alertForm });

    onCreateAlert({
      slotId: alertForm.slotId,
      slotNumber: targetSlot?.number || '',
      alertType: alertForm.alertType,
      priority: alertForm.priority,
      description: alertForm.description.trim(),
      reportedBy: user.name
    });

    // Show success message
    alert(`Security alert created for slot ${targetSlot?.number} successfully!`);

    // Reset form and close dialog
    setAlertForm({
      slotId: undefined,
      alertType: 'violation',
      priority: 'medium',
      description: ''
    });
    setIsAlertDialogOpen(false);
  };

  const handleResolveAlert = () => {
    if (!selectedAlert) return;

    onResolveAlert(selectedAlert.id, resolutionForm.resolution);
    
    // Reset form and close dialog
    setResolutionForm({ resolution: '' });
    setIsResolveAlertDialogOpen(false);
    setSelectedAlert(null);
  };

  console.log('SecurityDashboard: Rendering with dialog states and owner data', { 
    isActivityDialogOpen, 
    isMessageDialogOpen, 
    isAlertDialogOpen,
    uniqueOwnersCount: uniqueOwners.length,
    ownerSlotsCount: ownerSlots.length
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Security Control Center</h1>
                <p className="text-sm text-gray-600">Real-time parking monitoring and communication</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={autoRefresh} 
                  onCheckedChange={setAutoRefresh}
                  id="auto-refresh"
                />
                <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
              </div>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadMessages.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadMessages.length}
                  </Badge>
                )}
              </div>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Owner Slots</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{ownerSlots.length}</div>
              <p className="text-xs text-muted-foreground">Under monitoring</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Today's Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{todayActivities.length}</div>
              <p className="text-xs text-muted-foreground">Logged events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Active Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {vehicleActivities.filter(act => act.status === 'arrived').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently parked</p>
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
              <div className="text-2xl text-orange-600">{activeAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Needs resolution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Overdue</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-red-600">
                {vehicleActivities.filter(act => act.status === 'overdue').length}
              </div>
              <p className="text-xs text-muted-foreground">Delayed departures</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="messages">Communications</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="activities">Activity Log</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Live Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Real-time Parking Monitoring</h2>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    console.log('SecurityDashboard: Log Activity button clicked from header');
                    setIsActivityDialogOpen(true);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>

                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerSlots.map((slot) => {
                const recentActivity = vehicleActivities
                  .filter(act => act.slotId === slot.id)
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];
                
                const relatedBooking = bookings.find(b => 
                  b.slotId === slot.id && (b.status === 'upcoming' || b.status === 'active')
                );

                return (
                  <Card key={slot.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>Slot {slot.number}</span>
                        {recentActivity && (
                          <Badge className={getStatusColor(recentActivity.status)}>
                            {recentActivity.status}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        <span className="block">
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{slot.ownerName}</span>
                          </span>
                          <span className="flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{slot.spaceType}</span>
                          </span>
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentActivity ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{recentActivity.vehicleNumber}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{recentActivity.driverName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{recentActivity.driverPhone}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              Expected: {new Date(recentActivity.expectedArrival).toLocaleString()} - {new Date(recentActivity.expectedDeparture).toLocaleString()}
                            </div>
                            {recentActivity.actualArrival && (
                              <div className="text-xs text-green-600">
                                ✓ Arrived: {new Date(recentActivity.actualArrival).toLocaleString()}
                              </div>
                            )}
                            {recentActivity.actualDeparture && (
                              <div className="text-xs text-gray-600">
                                ✓ Departed: {new Date(recentActivity.actualDeparture).toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          {recentActivity.notes && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {recentActivity.notes}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {relatedBooking ? (
                            <div>
                              <div>Upcoming: {relatedBooking.userName}</div>
                              <div className="text-xs">{new Date(relatedBooking.startTime).toLocaleString()}</div>
                            </div>
                          ) : (
                            'No current activity'
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        <Button 
                          className="flex-1" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('SecurityDashboard: Log button clicked for slot', slot.id);
                            setSelectedSlot(slot);
                            setIsActivityDialogOpen(true);
                          }}
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Log
                        </Button>
                        
                        <Button 
                          className="flex-1" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('SecurityDashboard: Message button clicked for slot', slot.id, 'owner:', slot.ownerId);
                            setMessageForm(prev => ({ 
                              ...prev, 
                              toUserId: slot.ownerId || undefined,
                              slotId: slot.id 
                            }));
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
              })}
            </div>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Owner Communications</h2>
              <Button 
                onClick={() => {
                  console.log('SecurityDashboard: Send Message button clicked from messages tab');
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
                                {message.fromUserRole === 'security' ? 'To' : 'From'}: {message.fromUserRole === 'security' ? message.toUserName : message.fromUserName}
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
                                <span>Slot {message.slotNumber}</span>
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

          {/* Security Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Security Alerts</h2>
              <Button 
                onClick={() => {
                  console.log('SecurityDashboard: Create Alert button clicked');
                  setIsAlertDialogOpen(true);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityAlerts.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No security alerts
                </div>
              ) : (
                securityAlerts
                  .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
                  .map((alert) => (
                    <Card key={alert.id} className={`${alert.status === 'open' ? 'border-orange-200 bg-orange-50' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Slot {alert.slotNumber}</span>
                          </CardTitle>
                          <div className="flex space-x-2">
                            <Badge className={getAlertPriorityColor(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'}>
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {alert.alertType} • {new Date(alert.reportedAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                        <p className="text-xs text-gray-500">Reported by: {alert.reportedBy}</p>
                        
                        {alert.status === 'resolved' && alert.resolution && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-800">
                              <strong>Resolution:</strong> {alert.resolution}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Resolved by {alert.resolvedBy} on {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {alert.status === 'open' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setIsResolveAlertDialogOpen(true);
                            }}
                          >
                            Resolve Alert
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Vehicle Activity Log</h2>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              <ScrollArea className="h-96">
                {vehicleActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No activities logged yet
                  </div>
                ) : (
                  vehicleActivities
                    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                    .map((activity) => (
                      <Card key={activity.id} className="mb-4">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center space-x-2">
                              {activity.status === 'arrived' ? (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              ) : (
                                <LogOut className="h-4 w-4 text-blue-600" />
                              )}
                              <span>Slot {activity.slotNumber} - {activity.vehicleNumber}</span>
                            </CardTitle>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                          <CardDescription>
                            {activity.driverName} • {new Date(activity.loggedAt).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                            <div>
                              <strong>Owner:</strong> {activity.ownerName}
                            </div>
                            <div>
                              <strong>Phone:</strong> {activity.driverPhone}
                            </div>
                            <div>
                              <strong>Expected Arrival:</strong> {new Date(activity.expectedArrival).toLocaleString()}
                            </div>
                            <div>
                              <strong>Expected Departure:</strong> {new Date(activity.expectedDeparture).toLocaleString()}
                            </div>
                          </div>
                          
                          {activity.notes && (
                            <Alert className="mt-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                <strong>Notes:</strong> {activity.notes}
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Logged by: {activity.loggedBy}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Security Reports</h2>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Activities Logged:</span>
                    <span>{todayActivities.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vehicles Arrived:</span>
                    <span>{todayActivities.filter(a => a.status === 'arrived').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vehicles Departed:</span>
                    <span>{todayActivities.filter(a => a.status === 'departed').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Alerts:</span>
                    <span className="text-orange-600">{activeAlerts.length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Communications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Messages:</span>
                    <span>{messages.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Unread:</span>
                    <span className="text-blue-600">{unreadMessages.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sent Today:</span>
                    <span>{messages.filter(m => 
                      new Date(m.timestamp).toDateString() === new Date().toDateString() &&
                      m.fromUserId === user.id
                    ).length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monitored Slots:</span>
                    <span>{ownerSlots.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Auto-refresh:</span>
                    <span className={autoRefresh ? 'text-green-600' : 'text-gray-500'}>
                      {autoRefresh ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Update:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Vehicle Activity</DialogTitle>
            <DialogDescription>
              Record vehicle arrival or departure for slot monitoring
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slot-select">Select Slot</Label>
              <Select value={selectedSlot?.id || undefined} onValueChange={(value) => {
                const slot = ownerSlots.find(s => s.id === value);
                setSelectedSlot(slot || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a slot" />
                </SelectTrigger>
                <SelectContent>
                  {ownerSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      {slot.number} - {slot.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={activityForm.activityType} onValueChange={(value: 'arrival' | 'departure') => 
                setActivityForm(prev => ({ ...prev, activityType: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrival">Vehicle Arrival</SelectItem>
                  <SelectItem value="departure">Vehicle Departure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehicle-number">Vehicle Number</Label>
              <Input
                id="vehicle-number"
                placeholder="DHK-1234"
                value={activityForm.vehicleNumber}
                onChange={(e) => setActivityForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="driver-name">Driver Name</Label>
              <Input
                id="driver-name"
                placeholder="Enter driver name"
                value={activityForm.driverName}
                onChange={(e) => setActivityForm(prev => ({ ...prev, driverName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="driver-phone">Driver Phone</Label>
              <Input
                id="driver-phone"
                placeholder="+880-1XXX-XXXXXX"
                value={activityForm.driverPhone}
                onChange={(e) => setActivityForm(prev => ({ ...prev, driverPhone: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="actual-time">Actual Time</Label>
              <Input
                id="actual-time"
                type="datetime-local"
                value={activityForm.actualTime}
                onChange={(e) => setActivityForm(prev => ({ ...prev, actualTime: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any observations, issues, or additional information..."
              value={activityForm.notes}
              onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogActivity} 
              disabled={!selectedSlot || !activityForm.vehicleNumber.trim() || !activityForm.driverName.trim()}
            >
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to Owner</DialogTitle>
            <DialogDescription>
              Communicate with property owners about their parking spaces
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner-select">Select Owner</Label>
                <Select value={messageForm.toUserId || undefined} onValueChange={(value) => 
                  setMessageForm(prev => ({ ...prev, toUserId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueOwners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="slot-select-msg">Related Slot (Optional)</Label>
                <Select value={messageForm.slotId || undefined} onValueChange={(value) => 
                  setMessageForm(prev => ({ ...prev, slotId: value === 'none' ? undefined : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific slot</SelectItem>
                    {ownerSlots
                      .filter(slot => !messageForm.toUserId || slot.ownerId === messageForm.toUserId)
                      .map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.number} - {slot.ownerName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="message-type">Message Type</Label>
              <Select value={messageForm.messageType} onValueChange={(value: SecurityMessage['messageType']) => 
                setMessageForm(prev => ({ ...prev, messageType: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="arrival">Arrival Notification</SelectItem>
                  <SelectItem value="departure">Departure Notification</SelectItem>
                  <SelectItem value="alert">Security Alert</SelectItem>
                  <SelectItem value="update">Status Update</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                placeholder="Enter your message..."
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
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
              disabled={!messageForm.toUserId || !messageForm.subject.trim() || !messageForm.message.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Security Alert</DialogTitle>
            <DialogDescription>
              Report a security issue or concern for a specific parking slot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alert-slot">Parking Slot</Label>
                <Select value={alertForm.slotId || undefined} onValueChange={(value) => 
                  setAlertForm(prev => ({ ...prev, slotId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.number} - {slot.ownerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="alert-type">Alert Type</Label>
                <Select value={alertForm.alertType} onValueChange={(value: SecurityAlert['alertType']) => 
                  setAlertForm(prev => ({ ...prev, alertType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unauthorized">Unauthorized Access</SelectItem>
                    <SelectItem value="damage">Property Damage</SelectItem>
                    <SelectItem value="violation">Parking Violation</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="alert-priority">Priority Level</Label>
              <Select value={alertForm.priority} onValueChange={(value: SecurityAlert['priority']) => 
                setAlertForm(prev => ({ ...prev, priority: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="alert-description">Description</Label>
              <Textarea
                id="alert-description"
                placeholder="Describe the security issue in detail..."
                value={alertForm.description}
                onChange={(e) => setAlertForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAlert} 
              disabled={!alertForm.slotId || !alertForm.description.trim()}
            >
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Alert Dialog */}
      <Dialog open={isResolveAlertDialogOpen} onOpenChange={setIsResolveAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Security Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as resolved and provide resolution details
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm">Alert Details</h4>
                <p className="text-sm text-gray-600">Slot {selectedAlert.slotNumber} - {selectedAlert.alertType}</p>
                <p className="text-xs text-gray-500">{selectedAlert.description}</p>
              </div>
              
              <div>
                <Label htmlFor="resolution">Resolution Details</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this issue was resolved..."
                  value={resolutionForm.resolution}
                  onChange={(e) => setResolutionForm(prev => ({ ...prev, resolution: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolveAlert} 
              disabled={!resolutionForm.resolution.trim()}
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}