import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { 
  Shield, 
  MessageSquare, 
  Activity, 
  AlertTriangle, 
  Car, 
  User, 
  Clock, 
  MapPin, 
  Send, 
  LogOut, 
  Eye,
  Camera,
  FileText,
  Phone,
  CheckCircle,
  XCircle,
  Plus
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
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  const [messageForm, setMessageForm] = useState({
    messageType: 'general' as SecurityMessage['messageType'],
    subject: '',
    message: '',
    isUrgent: false,
    slotId: undefined as string | undefined,
    toUserId: '',
    toUserName: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: ''
  });

  const [activityForm, setActivityForm] = useState({
    slotId: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    expectedArrival: '',
    expectedDeparture: '',
    actualArrival: '',
    actualDeparture: '',
    status: 'expected' as VehicleActivity['status'],
    notes: ''
  });

  const [alertForm, setAlertForm] = useState({
    slotId: '',
    alertType: 'violation' as SecurityAlert['alertType'],
    priority: 'medium' as SecurityAlert['priority'],
    description: ''
  });

  // Get owner slots for messaging
  const ownerSlots = slots.filter(slot => slot.ownerId);
  const unreadMessages = messages.filter(msg => !msg.isRead && msg.toUserId === user.id);
  const openAlerts = securityAlerts.filter(alert => alert.status === 'open');
  const recentActivities = vehicleActivities
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
    .slice(0, 10);

  const handleSendMessage = () => {
    console.log('SecurityDashboard: handleSendMessage called', { messageForm });

    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    if (!messageForm.toUserId) {
      alert('Please select a recipient');
      return;
    }

    const targetSlot = messageForm.slotId ? slots.find(s => s.id === messageForm.slotId) : undefined;

    onSendMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: 'security',
      toUserId: messageForm.toUserId,
      toUserName: messageForm.toUserName,
      toUserRole: 'owner',
      slotId: messageForm.slotId || undefined,
      slotNumber: targetSlot?.number || undefined,
      messageType: messageForm.messageType,
      subject: messageForm.subject.trim(),
      message: messageForm.message.trim(),
      isUrgent: messageForm.isUrgent,
      metadata: {
        vehicleNumber: messageForm.vehicleNumber || undefined,
        driverName: messageForm.driverName || undefined,
        driverPhone: messageForm.driverPhone || undefined
      }
    });

    alert('Message sent successfully!');
    setMessageForm({
      messageType: 'general',
      subject: '',
      message: '',
      isUrgent: false,
      slotId: undefined,
      toUserId: '',
      toUserName: '',
      vehicleNumber: '',
      driverName: '',
      driverPhone: ''
    });
    setIsMessageDialogOpen(false);
  };

  const handleLogActivity = () => {
    console.log('SecurityDashboard: handleLogActivity called', { activityForm });

    if (!activityForm.slotId || !activityForm.vehicleNumber || !activityForm.driverName) {
      alert('Please fill in required fields: slot, vehicle number, and driver name');
      return;
    }

    const slot = slots.find(s => s.id === activityForm.slotId);
    if (!slot) {
      alert('Selected slot not found');
      return;
    }

    onLogVehicleActivity({
      slotId: activityForm.slotId,
      slotNumber: slot.number,
      ownerId: slot.ownerId || 'unknown',
      ownerName: slot.ownerName || 'Unknown Owner',
      vehicleNumber: activityForm.vehicleNumber.trim(),
      driverName: activityForm.driverName.trim(),
      driverPhone: activityForm.driverPhone.trim(),
      expectedArrival: activityForm.expectedArrival,
      expectedDeparture: activityForm.expectedDeparture,
      actualArrival: activityForm.actualArrival || undefined,
      actualDeparture: activityForm.actualDeparture || undefined,
      status: activityForm.status,
      notes: activityForm.notes || undefined,
      loggedBy: user.name
    });

    alert('Vehicle activity logged successfully!');
    setActivityForm({
      slotId: '',
      vehicleNumber: '',
      driverName: '',
      driverPhone: '',
      expectedArrival: '',
      expectedDeparture: '',
      actualArrival: '',
      actualDeparture: '',
      status: 'expected',
      notes: ''
    });
    setIsActivityDialogOpen(false);
  };

  const handleCreateAlert = () => {
    console.log('SecurityDashboard: handleCreateAlert called', { alertForm });

    if (!alertForm.slotId || !alertForm.description.trim()) {
      alert('Please select a slot and provide a description');
      return;
    }

    const slot = slots.find(s => s.id === alertForm.slotId);
    if (!slot) {
      alert('Selected slot not found');
      return;
    }

    onCreateAlert({
      slotId: alertForm.slotId,
      slotNumber: slot.number,
      alertType: alertForm.alertType,
      priority: alertForm.priority,
      description: alertForm.description.trim(),
      reportedBy: user.name
    });

    alert('Security alert created successfully!');
    setAlertForm({
      slotId: '',
      alertType: 'violation',
      priority: 'medium',
      description: ''
    });
    setIsAlertDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
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

  const getPriorityColor = (priority: SecurityAlert['priority']) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl text-gray-900">Security Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor and manage parking space security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadMessages.length} new message{unreadMessages.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <span className="text-sm text-gray-600">Officer {user.name}</span>
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
            <TabsTrigger value="slots">Monitor Slots</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {unreadMessages.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Vehicle Activity</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Total Slots</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">{ownerSlots.length}</div>
                  <p className="text-xs text-muted-foreground">Under monitoring</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm">Active Vehicles</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-green-600">
                    {vehicleActivities.filter(a => a.status === 'arrived').length}
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
                  <CardTitle className="text-sm">Open Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-orange-600">{openAlerts.length}</div>
                  <p className="text-xs text-muted-foreground">Require action</p>
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
                    className="h-20 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      console.log('SecurityDashboard: Send Message button clicked');
                      setIsMessageDialogOpen(true);
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-6 w-6" />
                      <span>Send Message</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => {
                      console.log('SecurityDashboard: Log Activity button clicked');
                      setIsActivityDialogOpen(true);
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-6 w-6" />
                      <span>Log Activity</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20"
                    onClick={() => {
                      console.log('SecurityDashboard: Create Alert button clicked');
                      setIsAlertDialogOpen(true);
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-6 w-6" />
                      <span>Create Alert</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Vehicle Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">
                                {activity.vehicleNumber} - Slot {activity.slotNumber}
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

              <Card>
                <CardHeader>
                  <CardTitle>Open Security Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {openAlerts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                        <p>No open alerts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {openAlerts.map((alert) => (
                          <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">Slot {alert.slotNumber}</p>
                              <Badge className={getPriorityColor(alert.priority)}>
                                {alert.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{alert.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.reportedAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitor Slots Tab */}
          <TabsContent value="slots" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Parking Slots Monitor</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('SecurityDashboard: Log Activity button clicked from slots tab');
                    setIsActivityDialogOpen(true);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('SecurityDashboard: Create Alert button clicked from slots tab');
                    setIsAlertDialogOpen(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownerSlots.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-600 mb-2">No owner slots to monitor</h3>
                  <p className="text-gray-500">Owner slots will appear here when available.</p>
                </div>
              ) : (
                ownerSlots.map((slot) => {
                  const recentActivity = vehicleActivities
                    .filter(activity => activity.slotId === slot.id)
                    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())[0];

                  return (
                    <Card key={slot.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>Slot {slot.number}</span>
                          <Badge className={getStatusColor(slot.status)}>
                            {slot.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{slot.locationName}</span>
                            </div>
                            <div className="text-xs text-gray-500">{slot.locationAddress}</div>
                            {slot.ownerName && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span className="text-xs">Owner: {slot.ownerName}</span>
                              </div>
                            )}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {recentActivity ? (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">{recentActivity.vehicleNumber}</span>
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

                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              console.log('SecurityDashboard: Message button clicked from slot card', slot.id);
                              setMessageForm(prev => ({ 
                                ...prev, 
                                slotId: slot.id,
                                toUserId: slot.ownerId || '',
                                toUserName: slot.ownerName || ''
                              }));
                              setIsMessageDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              console.log('SecurityDashboard: Log Activity button clicked from slot card', slot.id);
                              setActivityForm(prev => ({ ...prev, slotId: slot.id }));
                              setIsActivityDialogOpen(true);
                            }}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            Log
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
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">
                                  {message.fromUserRole === 'security' ? 'To' : 'From'}: {message.fromUserRole === 'security' ? message.toUserName : message.fromUserName}
                                </span>
                                {message.isUrgent && (
                                  <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                )}
                                {message.slotNumber && (
                                  <Badge variant="outline" className="text-xs">
                                    Slot {message.slotNumber}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                              <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!message.isRead && message.toUserId === user.id && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onMarkMessageAsRead(message.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Vehicle Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Vehicle Activity Log</h2>
              <Button 
                onClick={() => {
                  console.log('SecurityDashboard: Log New Activity button clicked');
                  setIsActivityDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log New Activity
              </Button>
            </div>

            <div className="space-y-4">
              {vehicleActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No vehicle activities logged</p>
                  </CardContent>
                </Card>
              ) : (
                vehicleActivities
                  .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                  .map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Car className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {activity.vehicleNumber} - Slot {activity.slotNumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                Driver: {activity.driverName} | Phone: {activity.driverPhone}
                              </p>
                              <p className="text-xs text-gray-500">
                                Logged: {new Date(activity.loggedAt).toLocaleString()}
                              </p>
                              {activity.notes && (
                                <p className="text-xs text-gray-600 mt-1 italic">
                                  "{activity.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={getActivityStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          {/* Security Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg">Security Alerts</h2>
              <Button 
                onClick={() => {
                  console.log('SecurityDashboard: Create New Alert button clicked');
                  setIsAlertDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>

            <div className="space-y-4">
              {securityAlerts.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No security alerts</p>
                  </CardContent>
                </Card>
              ) : (
                securityAlerts
                  .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
                  .map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">Slot {alert.slotNumber}</span>
                              <Badge className={getPriorityColor(alert.priority)}>
                                {alert.priority}
                              </Badge>
                              <Badge variant="outline">
                                {alert.alertType}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                            <p className="text-xs text-gray-500">
                              Reported: {new Date(alert.reportedAt).toLocaleString()}
                            </p>
                            {alert.status === 'resolved' && alert.resolution && (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs text-green-700">
                                  <strong>Resolution:</strong> {alert.resolution}
                                </p>
                                <p className="text-xs text-green-600">
                                  Resolved by {alert.resolvedBy} on {alert.resolvedAt && new Date(alert.resolvedAt).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                          {alert.status === 'open' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const resolution = prompt('Enter resolution details:');
                                if (resolution) {
                                  onResolveAlert(alert.id, resolution);
                                }
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Message to Property Owner</DialogTitle>
            <DialogDescription>
              Communicate with property owners about their parking spaces.
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
                  <SelectItem value="arrival">Vehicle Arrival</SelectItem>
                  <SelectItem value="departure">Vehicle Departure</SelectItem>
                  <SelectItem value="alert">Security Alert</SelectItem>
                  <SelectItem value="inquiry">Question/Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipient">Recipient (Owner)</Label>
              <Select 
                value={messageForm.toUserId} 
                onValueChange={(value) => {
                  const slot = ownerSlots.find(s => s.ownerId === value);
                  setMessageForm(prev => ({ 
                    ...prev, 
                    toUserId: value,
                    toUserName: slot?.ownerName || '',
                    slotId: slot?.id || undefined
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {ownerSlots.map((slot) => (
                    <SelectItem key={slot.ownerId} value={slot.ownerId || ''}>
                      {slot.ownerName} - Slot {slot.number}
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

            {messageForm.messageType === 'arrival' || messageForm.messageType === 'departure' ? (
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
              </>
            ) : null}

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
              disabled={!messageForm.subject.trim() || !messageForm.message.trim() || !messageForm.toUserId}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Vehicle Activity</DialogTitle>
            <DialogDescription>
              Record vehicle movements and activities at parking spaces.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activity-slot">Parking Slot</Label>
              <Select value={activityForm.slotId} onValueChange={(value) => 
                setActivityForm(prev => ({ ...prev, slotId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {ownerSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      Slot {slot.number} - {slot.locationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-status">Activity Status</Label>
              <Select value={activityForm.status} onValueChange={(value: VehicleActivity['status']) => 
                setActivityForm(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expected">Expected</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="departed">Departed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity-vehicle">Vehicle Number</Label>
              <Input
                id="activity-vehicle"
                placeholder="e.g., DHK-1234"
                value={activityForm.vehicleNumber}
                onChange={(e) => setActivityForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="activity-driver">Driver Name</Label>
              <Input
                id="activity-driver"
                placeholder="Driver's full name"
                value={activityForm.driverName}
                onChange={(e) => setActivityForm(prev => ({ ...prev, driverName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="activity-phone">Driver Phone</Label>
              <Input
                id="activity-phone"
                placeholder="+880-XXXX-XXXXX"
                value={activityForm.driverPhone}
                onChange={(e) => setActivityForm(prev => ({ ...prev, driverPhone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="expected-arrival">Expected Arrival</Label>
              <Input
                id="expected-arrival"
                type="datetime-local"
                value={activityForm.expectedArrival}
                onChange={(e) => setActivityForm(prev => ({ ...prev, expectedArrival: e.target.value }))}
              />
            </div>

            {activityForm.status === 'arrived' && (
              <div>
                <Label htmlFor="actual-arrival">Actual Arrival</Label>
                <Input
                  id="actual-arrival"
                  type="datetime-local"
                  value={activityForm.actualArrival}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, actualArrival: e.target.value }))}
                />
              </div>
            )}

            {activityForm.status === 'departed' && (
              <div>
                <Label htmlFor="actual-departure">Actual Departure</Label>
                <Input
                  id="actual-departure"
                  type="datetime-local"
                  value={activityForm.actualDeparture}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, actualDeparture: e.target.value }))}
                />
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="activity-notes">Notes</Label>
              <Textarea
                id="activity-notes"
                placeholder="Additional notes about the activity..."
                value={activityForm.notes}
                onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogActivity} 
              disabled={!activityForm.slotId || !activityForm.vehicleNumber || !activityForm.driverName}
            >
              Log Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Security Alert</DialogTitle>
            <DialogDescription>
              Report security incidents or violations at parking spaces.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alert-slot">Parking Slot</Label>
              <Select value={alertForm.slotId} onValueChange={(value) => 
                setAlertForm(prev => ({ ...prev, slotId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {ownerSlots.map((slot) => (
                    <SelectItem key={slot.id} value={slot.id}>
                      Slot {slot.number} - {slot.locationName}
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
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="violation">Parking Violation</SelectItem>
                  <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="col-span-2">
              <Label htmlFor="alert-description">Description</Label>
              <Textarea
                id="alert-description"
                placeholder="Describe the security incident or issue..."
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
    </div>
  );
}