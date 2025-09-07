import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { ParkingSlot, Booking, FinePolicy } from '../App';
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Calendar,
  User,
  Car,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  LogOut,
  TrendingUp,
  DollarSign,
  Timer,
  Settings,
  Calculator,
  AlertTriangle,
  Info
} from 'lucide-react';

interface AdminBookingManagementProps {
  bookings: Booking[];
  slots: ParkingSlot[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onCancelBooking?: (bookingId: string, policy: FinePolicy) => { fine: number; description: string; timeUsed: number } | null;
}

export function AdminBookingManagement({ 
  bookings, 
  slots, 
  onNavigate, 
  onLogout, 
  onCancelBooking 
}: AdminBookingManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<FinePolicy>({
    type: 'none',
    immediateRate: 5,
    hourlyRate: 2,
    dailyRate: 20,
    tieredRates: [
      { hours: 0, rate: 5 },
      { hours: 1, rate: 10 },
      { hours: 3, rate: 15 },
      { hours: 6, rate: 25 },
      { hours: 12, rate: 40 }
    ],
    maxFine: 100
  });
  
  // Default fine policies
  const predefinedPolicies: { [key: string]: FinePolicy } = {
    none: { type: 'none' },
    immediate: { type: 'immediate', immediateRate: 5 },
    hourly: { type: 'hourly', hourlyRate: 2, maxFine: 50 },
    daily: { type: 'daily', dailyRate: 20, maxFine: 100 },
    tiered: {
      type: 'tiered',
      tieredRates: [
        { hours: 0, rate: 5 },
        { hours: 1, rate: 10 },
        { hours: 3, rate: 15 },
        { hours: 6, rate: 25 },
        { hours: 12, rate: 40 }
      ],
      maxFine: 100
    }
  };

  const calculatePreviewFine = (booking: Booking, policy: FinePolicy): { fine: number; description: string; timeUsed: number } => {
    const bookedAt = new Date(booking.startTime);
    const now = new Date();
    const timeUsedMs = now.getTime() - bookedAt.getTime();
    const timeUsedHours = Math.max(0, timeUsedMs / (1000 * 60 * 60));
    const timeUsedDays = timeUsedHours / 24;

    let fine = 0;
    let description = '';

    switch (policy.type) {
      case 'none':
        fine = 0;
        description = 'No cancellation fee';
        break;
      
      case 'immediate':
        fine = policy.immediateRate || 5;
        description = `Fixed cancellation fee: $${fine}`;
        break;
      
      case 'hourly':
        const hourlyFine = Math.ceil(timeUsedHours) * (policy.hourlyRate || 2);
        fine = Math.min(hourlyFine, policy.maxFine || 100);
        description = `Hourly rate: ${Math.ceil(timeUsedHours)} hours × $${policy.hourlyRate || 2} = $${fine}`;
        break;
      
      case 'daily':
        const dailyFine = Math.ceil(timeUsedDays) * (policy.dailyRate || 20);
        fine = Math.min(dailyFine, policy.maxFine || 200);
        description = `Daily rate: ${Math.ceil(timeUsedDays)} days × $${policy.dailyRate || 20} = $${fine}`;
        break;
      
      case 'tiered':
        if (policy.tieredRates) {
          const sortedTiers = policy.tieredRates.sort((a, b) => a.hours - b.hours);
          let applicableTier = sortedTiers[0];
          
          for (const tier of sortedTiers) {
            if (timeUsedHours >= tier.hours) {
              applicableTier = tier;
            } else {
              break;
            }
          }
          
          fine = Math.min(applicableTier.rate, policy.maxFine || 150);
          description = `Tiered rate: ${applicableTier.hours}+ hours = $${fine}`;
        }
        break;
    }

    return { fine: Math.max(0, fine), description, timeUsed: timeUsedHours };
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.slotNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || (() => {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          return bookingDate.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          return bookingDate >= weekAgo;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          return bookingDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking && onCancelBooking) {
      onCancelBooking(selectedBooking.id, selectedPolicy);
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  };

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalFines: bookings
      .filter(b => b.status === 'cancelled' && b.cancelFine)
      .reduce((sum, b) => sum + (b.cancelFine || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('admin-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="ml-3 text-lg">Booking Management</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPolicyDialog(true)}
          className="text-blue-600"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
          <div className="p-6">
            <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>
              ParkEasy Admin
            </h2>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('admin-dashboard')}
              >
                <TrendingUp className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('admin-slots')}
              >
                <Car className="mr-3 h-4 w-4" />
                Manage Slots
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                style={{ backgroundColor: '#2563EB' }}
              >
                <Calendar className="mr-3 h-4 w-4" />
                Bookings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowPolicyDialog(true)}
              >
                <Settings className="mr-3 h-4 w-4" />
                Fine Policies
              </Button>
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl mb-2">Booking Management</h1>
              <p className="text-gray-600">Monitor and manage all parking reservations with cancellation fine control</p>
            </div>
            <Button
              onClick={() => setShowPolicyDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Fine Policies
            </Button>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-blue-600">{stats.active}</p>
                <p className="text-sm text-gray-600">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-yellow-600">{stats.upcoming}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-red-600">{stats.cancelled}</p>
                <p className="text-sm text-gray-600">Cancelled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-green-600">${stats.totalFines.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Fines</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user or slot..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        #{booking.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.userName}</p>
                          <p className="text-sm text-gray-600">ID: {booking.userId.slice(-6)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{booking.slotNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(booking.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">{booking.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 w-fit ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.status === 'cancelled' && booking.cancelFine ? (
                          <div className="text-sm">
                            <p className="font-medium text-red-600">${booking.cancelFine.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{booking.cancelPolicy}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {booking.status === 'upcoming' && (
                            <Button variant="outline" size="sm" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                          {(booking.status === 'active' || booking.status === 'upcoming') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleCancelClick(booking)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No bookings found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Booking with Fine Policy
            </DialogTitle>
            <DialogDescription>
              Select the appropriate fine policy and review the calculated fine before cancelling this booking.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="ml-2 font-mono">#{selectedBooking.id.slice(-8)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">User:</span>
                    <span className="ml-2">{selectedBooking.userName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Slot:</span>
                    <span className="ml-2">{selectedBooking.slotNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Used:</span>
                    <span className="ml-2">
                      {(() => {
                        const bookedAt = new Date(selectedBooking.startTime);
                        const now = new Date();
                        const hours = Math.max(0, (now.getTime() - bookedAt.getTime()) / (1000 * 60 * 60));
                        return `${hours.toFixed(1)} hours`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fine Policy Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Select Fine Policy</Label>
                <div className="space-y-3">
                  {Object.entries(predefinedPolicies).map(([key, policy]) => {
                    const preview = calculatePreviewFine(selectedBooking, policy);
                    return (
                      <div
                        key={key}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPolicy.type === policy.type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPolicy(policy)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium capitalize">
                              {key === 'immediate' ? 'Fixed Fee' : key} Policy
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {preview.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-red-600">
                              ${preview.fine.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {preview.timeUsed.toFixed(1)}h used
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fine Preview */}
              {selectedPolicy && (
                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Fine Calculation:</strong> {calculatePreviewFine(selectedBooking, selectedPolicy).description}
                    <br />
                    <strong>Total Amount:</strong> ${calculatePreviewFine(selectedBooking, selectedPolicy).fine.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Policy Management Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Fine Policy Configuration
            </DialogTitle>
            <DialogDescription>
              Configure and manage cancellation fine policies for different scenarios.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="policies" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="policies">Policy Settings</TabsTrigger>
              <TabsTrigger value="calculator">Fine Calculator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="policies" className="space-y-6">
              <div className="grid gap-6">
                {Object.entries(predefinedPolicies).map(([key, policy]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="capitalize text-lg">
                        {key === 'immediate' ? 'Fixed Fee' : key} Policy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {policy.type === 'immediate' && (
                        <div>
                          <Label>Fixed Rate ($)</Label>
                          <Input
                            type="number"
                            value={policy.immediateRate || 5}
                            onChange={(e) => {
                              const newPolicies = { ...predefinedPolicies };
                              newPolicies[key] = { 
                                ...policy, 
                                immediateRate: parseFloat(e.target.value) || 0 
                              };
                            }}
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Fixed fee applied immediately upon cancellation
                          </p>
                        </div>
                      )}
                      
                      {policy.type === 'hourly' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Rate per Hour ($)</Label>
                            <Input
                              type="number"
                              value={policy.hourlyRate || 2}
                              onChange={(e) => {
                                const newPolicies = { ...predefinedPolicies };
                                newPolicies[key] = { 
                                  ...policy, 
                                  hourlyRate: parseFloat(e.target.value) || 0 
                                };
                              }}
                            />
                          </div>
                          <div>
                            <Label>Maximum Fine ($)</Label>
                            <Input
                              type="number"
                              value={policy.maxFine || 50}
                              onChange={(e) => {
                                const newPolicies = { ...predefinedPolicies };
                                newPolicies[key] = { 
                                  ...policy, 
                                  maxFine: parseFloat(e.target.value) || 0 
                                };
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {policy.type === 'daily' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Rate per Day ($)</Label>
                            <Input
                              type="number"
                              value={policy.dailyRate || 20}
                              onChange={(e) => {
                                const newPolicies = { ...predefinedPolicies };
                                newPolicies[key] = { 
                                  ...policy, 
                                  dailyRate: parseFloat(e.target.value) || 0 
                                };
                              }}
                            />
                          </div>
                          <div>
                            <Label>Maximum Fine ($)</Label>
                            <Input
                              type="number"
                              value={policy.maxFine || 100}
                              onChange={(e) => {
                                const newPolicies = { ...predefinedPolicies };
                                newPolicies[key] = { 
                                  ...policy, 
                                  maxFine: parseFloat(e.target.value) || 0 
                                };
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {policy.type === 'tiered' && policy.tieredRates && (
                        <div className="space-y-3">
                          <Label>Tiered Rates</Label>
                          {policy.tieredRates.map((tier, index) => (
                            <div key={index} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  placeholder="Hours"
                                  value={tier.hours}
                                  onChange={(e) => {
                                    const newPolicies = { ...predefinedPolicies };
                                    if (newPolicies[key].tieredRates) {
                                      newPolicies[key].tieredRates![index].hours = parseInt(e.target.value) || 0;
                                    }
                                  }}
                                />
                              </div>
                              <span className="text-gray-500">→</span>
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  placeholder="Rate ($)"
                                  value={tier.rate}
                                  onChange={(e) => {
                                    const newPolicies = { ...predefinedPolicies };
                                    if (newPolicies[key].tieredRates) {
                                      newPolicies[key].tieredRates![index].rate = parseFloat(e.target.value) || 0;
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="calculator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Fine Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Booking Start Time</Label>
                      <Input type="datetime-local" />
                    </div>
                    <div>
                      <Label>Current Time</Label>
                      <Input 
                        type="datetime-local" 
                        value={new Date().toISOString().slice(0, 16)}
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>Policy Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Fine</SelectItem>
                          <SelectItem value="immediate">Fixed Fee</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                          <SelectItem value="daily">Daily Rate</SelectItem>
                          <SelectItem value="tiered">Tiered System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Calculation Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Time Used:</span>
                        <span className="font-mono">0.0 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Policy:</span>
                        <span>Select a policy above</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg border-t pt-2">
                        <span>Total Fine:</span>
                        <span className="text-red-600">$0.00</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Settings className="h-4 w-4 mr-2" />
              Save Policies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {/* Mobile Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-semibold">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-semibold text-green-600">${stats.totalFines.toFixed(2)}</p>
              <p className="text-xs text-gray-600">Total Fines</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">#{booking.id.slice(-8)}</h3>
                    <p className="text-sm text-gray-600">{booking.userName}</p>
                  </div>
                  <Badge className={`flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
                  </Badge>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    Slot {booking.slotNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                  </div>
                  {booking.status === 'cancelled' && booking.cancelFine && (
                    <div className="flex items-center gap-2 text-red-600">
                      <DollarSign className="h-3 w-3" />
                      Fine: ${booking.cancelFine.toFixed(2)}
                    </div>
                  )}
                </div>
                
                {(booking.status === 'active' || booking.status === 'upcoming') && (
                  <div className="flex gap-2 mt-3">
                    {booking.status === 'upcoming' && (
                      <Button size="sm" variant="outline" className="text-green-600 flex-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 flex-1"
                      onClick={() => handleCancelClick(booking)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No bookings found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}