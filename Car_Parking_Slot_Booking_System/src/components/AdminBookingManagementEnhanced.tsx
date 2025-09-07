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
import { Progress } from './ui/progress';
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
  Info,
  Bell,
  Eye,
  UserCheck,
  UserX,
  MessageSquare,
  Zap,
  BarChart3,
  TrendingDown,
  Activity,
  Hourglass
} from 'lucide-react';

interface AdminBookingManagementEnhancedProps {
  bookings: Booking[];
  slots: ParkingSlot[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onCancelBooking?: (bookingId: string, policy: FinePolicy) => { fine: number; description: string; timeUsed: number } | null;
  onApproveBooking?: (bookingId: string) => boolean;
  onRejectBooking?: (bookingId: string, reason: string) => boolean;
}

export function AdminBookingManagementEnhanced({ 
  bookings, 
  slots, 
  onNavigate, 
  onLogout, 
  onCancelBooking,
  onApproveBooking,
  onRejectBooking
}: AdminBookingManagementEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<FinePolicy>({
    type: 'none',
    immediateRate: 5,
    hourlyRate: 2,
    dailyRate: 20,
    gracePeriodMinutes: 15,
    tieredRates: [
      { hours: 0, rate: 5, description: 'Immediate cancellation' },
      { hours: 1, rate: 10, description: 'Within first hour' },
      { hours: 3, rate: 15, description: 'Within 3 hours' },
      { hours: 6, rate: 25, description: 'Within 6 hours' },
      { hours: 12, rate: 40, description: 'Half day or more' }
    ],
    maxFine: 100,
    weekendMultiplier: 1.5,
    repeatOffenderMultiplier: 2.0,
    loyaltyDiscount: 10
  });
  
  // Enhanced fine policies with new types
  const predefinedPolicies: { [key: string]: FinePolicy } = {
    none: { 
      type: 'none',
      gracePeriodMinutes: 30
    },
    immediate: { 
      type: 'immediate', 
      immediateRate: 5,
      gracePeriodMinutes: 15
    },
    hourly: { 
      type: 'hourly', 
      hourlyRate: 3, 
      maxFine: 75,
      gracePeriodMinutes: 10,
      weekendMultiplier: 1.5,
      loyaltyDiscount: 10
    },
    daily: { 
      type: 'daily', 
      dailyRate: 25, 
      maxFine: 150,
      gracePeriodMinutes: 30,
      weekendMultiplier: 1.3,
      repeatOffenderMultiplier: 1.8
    },
    progressive: {
      type: 'progressive',
      progressiveRates: [
        { startHour: 0, endHour: 2, baseRate: 5, multiplier: 10 },
        { startHour: 2, endHour: 6, baseRate: 10, multiplier: 15 },
        { startHour: 6, endHour: 24, baseRate: 20, multiplier: 25 }
      ],
      maxFine: 200,
      gracePeriodMinutes: 20
    },
    exponential: {
      type: 'exponential',
      exponentialRate: {
        baseRate: 8,
        growthFactor: 1.8,
        maxExponent: 4
      },
      maxFine: 300,
      gracePeriodMinutes: 15
    },
    tiered: {
      type: 'tiered',
      tieredRates: [
        { hours: 0, rate: 5, description: 'Grace period (first 15 minutes free)' },
        { hours: 1, rate: 12, description: 'First hour penalty' },
        { hours: 3, rate: 20, description: 'Extended stay penalty' },
        { hours: 6, rate: 35, description: 'Half-day penalty' },
        { hours: 12, rate: 50, description: 'Full day penalty' },
        { hours: 24, rate: 80, description: 'Multi-day penalty' }
      ],
      maxFine: 120,
      gracePeriodMinutes: 15,
      weekendMultiplier: 1.4,
      repeatOffenderMultiplier: 2.2,
      loyaltyDiscount: 15
    }
  };

  const calculatePreviewFine = (booking: Booking, policy: FinePolicy): { fine: number; description: string; timeUsed: number } => {
    const bookedAt = new Date(booking.startTime);
    const now = new Date();
    const timeUsedMs = now.getTime() - bookedAt.getTime();
    const timeUsedHours = Math.max(0, timeUsedMs / (1000 * 60 * 60));
    const timeUsedMinutes = Math.max(0, timeUsedMs / (1000 * 60));
    const timeUsedDays = timeUsedHours / 24;

    // Grace period check
    if (policy.gracePeriodMinutes && timeUsedMinutes <= policy.gracePeriodMinutes) {
      return { fine: 0, description: `Grace period (${policy.gracePeriodMinutes} min) - No fine`, timeUsed: timeUsedHours };
    }

    // Weekend/Holiday multipliers
    const isWeekend = [0, 6].includes(bookedAt.getDay());
    const weekendMultiplier = isWeekend && policy.weekendMultiplier ? policy.weekendMultiplier : 1;
    
    // Check user's cancellation history
    const userCancellations = bookings.filter(b => 
      b.userId === booking.userId && 
      b.status === 'cancelled' && 
      b.id !== booking.id
    ).length;
    const repeatMultiplier = userCancellations >= 2 && policy.repeatOffenderMultiplier ? policy.repeatOffenderMultiplier : 1;

    let baseFine = 0;
    let description = '';

    switch (policy.type) {
      case 'none':
        baseFine = 0;
        description = 'No cancellation fee';
        break;
      
      case 'immediate':
        baseFine = policy.immediateRate || 5;
        description = `Fixed fee: $${baseFine}`;
        break;
      
      case 'hourly':
        const hourlyFine = Math.ceil(timeUsedHours) * (policy.hourlyRate || 2);
        baseFine = hourlyFine;
        description = `Hourly: ${Math.ceil(timeUsedHours)}h × $${policy.hourlyRate || 2}`;
        break;
      
      case 'daily':
        const dailyFine = Math.ceil(timeUsedDays) * (policy.dailyRate || 20);
        baseFine = dailyFine;
        description = `Daily: ${Math.ceil(timeUsedDays)}d × $${policy.dailyRate || 20}`;
        break;
      
      case 'progressive':
        if (policy.progressiveRates) {
          const applicableRate = policy.progressiveRates.find(rate => 
            timeUsedHours >= rate.startHour && timeUsedHours < rate.endHour
          ) || policy.progressiveRates[policy.progressiveRates.length - 1];
          
          const progressiveFactor = 1 + (timeUsedHours * applicableRate.multiplier / 100);
          baseFine = applicableRate.baseRate * progressiveFactor;
          description = `Progressive: $${applicableRate.baseRate} × ${progressiveFactor.toFixed(2)}`;
        }
        break;
      
      case 'exponential':
        if (policy.exponentialRate) {
          const exponent = Math.min(timeUsedHours / 6, policy.exponentialRate.maxExponent || 3);
          baseFine = policy.exponentialRate.baseRate * Math.pow(policy.exponentialRate.growthFactor || 1.5, exponent);
          description = `Exponential: $${policy.exponentialRate.baseRate} × ${policy.exponentialRate.growthFactor?.toFixed(1)}^${exponent.toFixed(1)}`;
        }
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
          
          baseFine = applicableTier.rate;
          description = `Tiered: ${applicableTier.hours}+h = $${baseFine}`;
        }
        break;
    }

    // Apply multipliers
    let finalFine = baseFine * weekendMultiplier * repeatMultiplier;

    // Apply loyalty discount
    if (policy.loyaltyDiscount && userCancellations === 0) {
      const discountAmount = finalFine * (policy.loyaltyDiscount / 100);
      finalFine -= discountAmount;
      description += ` | Loyalty: -$${discountAmount.toFixed(2)}`;
    }

    // Add multiplier info
    if (weekendMultiplier > 1) description += ` | Weekend: ×${weekendMultiplier}`;
    if (repeatMultiplier > 1) description += ` | Repeat: ×${repeatMultiplier}`;

    // Apply maximum fine cap
    if (policy.maxFine && finalFine > policy.maxFine) {
      finalFine = policy.maxFine;
      description += ` | Max: $${policy.maxFine}`;
    }

    return { fine: Math.max(0, finalFine), description, timeUsed: timeUsedHours };
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.slotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
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
        case 'pending-only':
          return booking.status === 'pending';
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
      case 'pending':
        return 'bg-orange-100 text-orange-800';
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
      case 'pending':
        return <Hourglass className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  // Enhanced handlers
  const handleApprovalClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowApprovalDialog(true);
  };

  const handleRejectClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleConfirmApproval = () => {
    if (selectedBooking && onApproveBooking) {
      const success = onApproveBooking(selectedBooking.id);
      if (success) {
        setShowApprovalDialog(false);
        setSelectedBooking(null);
      }
    }
  };

  const handleConfirmReject = () => {
    if (selectedBooking && onRejectBooking && rejectionReason.trim()) {
      const success = onRejectBooking(selectedBooking.id, rejectionReason.trim());
      if (success) {
        setShowRejectDialog(false);
        setSelectedBooking(null);
        setRejectionReason('');
      }
    }
  };

  const handleConfirmCancel = () => {
    if (selectedBooking && onCancelBooking) {
      onCancelBooking(selectedBooking.id, selectedPolicy);
      setShowCancelDialog(false);
      setSelectedBooking(null);
    }
  };

  // Enhanced statistics
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    totalFines: bookings
      .filter(b => b.status === 'cancelled' && b.cancelFine)
      .reduce((sum, b) => sum + (b.cancelFine || 0), 0),
    avgFine: bookings.filter(b => b.cancelFine && b.cancelFine > 0).length > 0 ? 
      bookings.filter(b => b.cancelFine && b.cancelFine > 0)
        .reduce((sum, b) => sum + (b.cancelFine || 0), 0) / 
      bookings.filter(b => b.cancelFine && b.cancelFine > 0).length : 0,
    approvalRate: bookings.filter(b => b.status !== 'pending').length > 0 ?
      (bookings.filter(b => b.approvedBy).length / bookings.filter(b => b.status !== 'pending').length) * 100 : 0
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
        <div className="flex gap-2">
          {stats.pending > 0 && (
            <Badge className="bg-orange-500 text-white">
              {stats.pending} Pending
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPolicyDialog(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Sidebar */}
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
                {stats.pending > 0 && (
                  <Badge className="ml-auto bg-orange-500 text-white text-xs">
                    {stats.pending}
                  </Badge>
                )}
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
              <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
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
              <h1 className="text-2xl mb-2">Enhanced Booking Management</h1>
              <p className="text-gray-600">
                Advanced parking reservation management with AI-powered fine policies and approval workflows
              </p>
            </div>
            <div className="flex gap-2">
              {stats.pending > 0 && (
                <Button
                  onClick={() => setDateFilter('pending-only')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {stats.pending} Pending
                </Button>
              )}
              <Button
                onClick={() => setShowPolicyDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Policies
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-orange-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
                <div className="mt-1">
                  <Progress 
                    value={(stats.pending / Math.max(stats.total, 1)) * 100} 
                    className="h-2"
                  />
                </div>
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
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold text-purple-600">{stats.approvalRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Bookings
              </CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user, slot, or booking ID..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="pending-only">⚠️ Pending Only</SelectItem>
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
                    <TableHead>Duration</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Approval Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className={booking.status === 'pending' ? 'bg-orange-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          #{booking.id.slice(-8)}
                          {booking.status === 'pending' && (
                            <Badge className="bg-orange-500 text-white text-xs">NEW</Badge>
                          )}
                        </div>
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
                        <div className="text-sm">
                          <p>{booking.parkingDurationMinutes} min</p>
                          <p className="text-gray-500">{(booking.parkingDurationMinutes / 60).toFixed(1)}h</p>
                        </div>
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
                        <div className="text-sm">
                          {booking.approvedBy && (
                            <div>
                              <p className="text-green-600 font-medium">✓ {booking.approvedBy}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(booking.approvedAt!).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {booking.rejectedBy && (
                            <div>
                              <p className="text-red-600 font-medium">✗ {booking.rejectedBy}</p>
                              <p className="text-xs text-gray-500">{booking.rejectionReason}</p>
                            </div>
                          )}
                          {booking.status === 'pending' && (
                            <p className="text-orange-600 font-medium">⏳ Awaiting approval</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {booking.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleApprovalClick(booking)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectClick(booking)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(booking.status === 'active' || booking.status === 'upcoming') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleCancelClick(booking)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approve Booking Request
            </DialogTitle>
            <DialogDescription>
              Confirm approval for this parking slot booking.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>User:</strong> {selectedBooking.userName}</div>
                    <div><strong>Slot:</strong> {selectedBooking.slotNumber}</div>
                    <div><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</div>
                    <div><strong>Duration:</strong> {selectedBooking.parkingDurationMinutes} minutes</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmApproval}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              Reject Booking Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this booking request.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>User:</strong> {selectedBooking.userName}</div>
                    <div><strong>Slot:</strong> {selectedBooking.slotNumber}</div>
                    <div><strong>Date:</strong> {new Date(selectedBooking.date).toLocaleDateString()}</div>
                    <div><strong>Duration:</strong> {selectedBooking.parkingDurationMinutes} minutes</div>
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a clear reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim()}
            >
              <X className="h-4 w-4 mr-2" />
              Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Booking with Advanced Fine Policy
            </DialogTitle>
            <DialogDescription>
              Select the appropriate fine policy and review the calculated fine with all applicable modifiers.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-600">Booking ID:</span> <span className="ml-2 font-mono">#{selectedBooking.id.slice(-8)}</span></div>
                  <div><span className="text-gray-600">User:</span> <span className="ml-2">{selectedBooking.userName}</span></div>
                  <div><span className="text-gray-600">Slot:</span> <span className="ml-2">{selectedBooking.slotNumber}</span></div>
                  <div>
                    <span className="text-gray-600">Time Used:</span>
                    <span className="ml-2">
                      {(() => {
                        const bookedAt = new Date(selectedBooking.startTime);
                        const now = new Date();
                        const hours = Math.max(0, (now.getTime() - bookedAt.getTime()) / (1000 * 60 * 60));
                        const minutes = Math.max(0, (now.getTime() - bookedAt.getTime()) / (1000 * 60));
                        return `${hours.toFixed(1)} hours (${minutes.toFixed(0)} min)`;
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Weekend:</span>
                    <span className="ml-2">
                      {[0, 6].includes(new Date(selectedBooking.startTime).getDay()) ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Previous Cancellations:</span>
                    <span className="ml-2">
                      {bookings.filter(b => b.userId === selectedBooking.userId && b.status === 'cancelled').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Fine Policy Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Select Advanced Fine Policy</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(predefinedPolicies).map(([key, policy]) => {
                    const preview = calculatePreviewFine(selectedBooking, policy);
                    return (
                      <div
                        key={key}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPolicy.type === policy.type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPolicy(policy)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="font-medium capitalize text-lg">
                              {key === 'immediate' ? 'Fixed Fee' : key} Policy
                            </h5>
                            {policy.gracePeriodMinutes && (
                              <p className="text-xs text-blue-600">
                                Grace: {policy.gracePeriodMinutes} min
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">
                              ${preview.fine.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {preview.description}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{preview.timeUsed.toFixed(1)}h used</span>
                          {policy.maxFine && <span>Max: ${policy.maxFine}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fine Calculation Breakdown */}
              {selectedPolicy && (
                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div><strong>Policy Type:</strong> {selectedPolicy.type.charAt(0).toUpperCase() + selectedPolicy.type.slice(1)}</div>
                      <div><strong>Fine Calculation:</strong> {calculatePreviewFine(selectedBooking, selectedPolicy).description}</div>
                      <div><strong>Total Amount:</strong> <span className="text-red-600 font-bold">${calculatePreviewFine(selectedBooking, selectedPolicy).fine.toFixed(2)}</span></div>
                      {selectedPolicy.gracePeriodMinutes && (
                        <div><strong>Grace Period:</strong> {selectedPolicy.gracePeriodMinutes} minutes (no charge within this period)</div>
                      )}
                    </div>
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
              Cancel Booking & Apply Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Policy Management Dialog - This would be very long, keeping it brief */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Advanced Fine Policy Configuration
            </DialogTitle>
            <DialogDescription>
              Configure sophisticated cancellation fine policies with AI-powered calculations and multiple modifiers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Advanced fine policy configuration interface</p>
            <p className="text-sm">Real-time preview, policy testing, and analytics dashboard</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPolicyDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}