import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  MapPin,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  Download,
  Car,
  Activity
} from 'lucide-react';
import { User as UserType, ParkingSlot, Booking, VehicleActivity, SecurityAlert } from '../App';

interface OwnerAnalyticsProps {
  user: UserType;
  slots: ParkingSlot[];
  bookings: Booking[];
  vehicleActivities: VehicleActivity[];
  securityAlerts: SecurityAlert[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function OwnerAnalytics({ 
  user, 
  slots, 
  bookings, 
  vehicleActivities,
  securityAlerts,
  onNavigate, 
  onLogout 
}: OwnerAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Get owner's data
  const ownerSlots = slots.filter(slot => slot.ownerId === user.id);
  const ownerBookings = bookings.filter(booking => 
    ownerSlots.some(slot => slot.id === booking.slotId)
  );
  const ownerActivities = vehicleActivities.filter(activity => activity.ownerId === user.id);
  const ownerAlerts = securityAlerts.filter(alert => {
    const slot = slots.find(s => s.id === alert.slotId);
    return slot?.ownerId === user.id;
  });

  // Calculate metrics based on selected period
  const getPeriodStart = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return weekStart;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        return monthStart;
      case 'quarter':
        const quarterStart = new Date(now);
        quarterStart.setMonth(now.getMonth() - 3);
        return quarterStart;
      case 'year':
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        return yearStart;
      default:
        return new Date(0);
    }
  };

  const periodStart = getPeriodStart();
  const periodBookings = ownerBookings.filter(b => new Date(b.createdAt) >= periodStart);
  const periodActivities = ownerActivities.filter(a => new Date(a.loggedAt) >= periodStart);

  // Calculate earnings
  const totalEarnings = ownerBookings
    .filter(b => b.status === 'completed')
    .reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);

  const periodEarnings = periodBookings
    .filter(b => b.status === 'completed')
    .reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);

  // Calculate occupancy rate
  const approvedSlots = ownerSlots.filter(s => s.isOwnerApproved);
  const occupancyRate = approvedSlots.length > 0 
    ? Math.round((ownerBookings.filter(b => b.status === 'active' || b.status === 'upcoming').length / approvedSlots.length) * 100)
    : 0;

  // Calculate average booking duration
  const avgBookingDuration = periodBookings.length > 0 
    ? Math.round(periodBookings.reduce((sum, b) => sum + b.parkingDurationMinutes, 0) / periodBookings.length / 60)
    : 0;

  // Revenue by slot
  const revenueBySlot = ownerSlots.map(slot => {
    const slotBookings = ownerBookings.filter(b => b.slotId === slot.id && b.status === 'completed');
    const revenue = slotBookings.reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);
    return {
      slot,
      bookings: slotBookings.length,
      revenue,
      occupancyHours: slotBookings.reduce((total, b) => total + b.parkingDurationMinutes, 0) / 60
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Monthly trends
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const monthlyData = last6Months.map(month => {
    const monthBookings = ownerBookings.filter(b => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate.getMonth() === month.getMonth() && 
             bookingDate.getFullYear() === month.getFullYear() &&
             b.status === 'completed';
    });
    
    const earnings = monthBookings.reduce((total, booking) => total + (booking.parkingDurationMinutes / 60) * 50, 0);
    
    return {
      month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      bookings: monthBookings.length,
      earnings: earnings,
      hours: monthBookings.reduce((total, b) => total + b.parkingDurationMinutes, 0) / 60
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => onNavigate('owner-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl text-gray-900">Owner Analytics</h1>
                <p className="text-sm text-gray-600">Detailed insights into your parking space performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">৳{totalEarnings.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                ৳{periodEarnings.toFixed(0)} this {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Occupancy Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-blue-600">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                {ownerBookings.filter(b => b.status === 'active' || b.status === 'upcoming').length} of {approvedSlots.length} spaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-purple-600">{ownerBookings.length}</div>
              <p className="text-xs text-muted-foreground">
                {periodBookings.length} this {selectedPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-orange-600">{avgBookingDuration}h</div>
              <p className="text-xs text-muted-foreground">
                Average booking length
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="slots">Slot Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Earnings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Earnings Trend</CardTitle>
                  <CardDescription>Revenue over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((month) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{month.month}</p>
                          <p className="text-xs text-gray-500">{month.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">৳{month.earnings.toFixed(0)}</p>
                          <p className="text-xs text-gray-500">{month.hours.toFixed(1)}h</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status</CardTitle>
                  <CardDescription>Current booking distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { status: 'completed', label: 'Completed', count: ownerBookings.filter(b => b.status === 'completed').length, color: 'bg-green-500' },
                      { status: 'active', label: 'Active', count: ownerBookings.filter(b => b.status === 'active').length, color: 'bg-blue-500' },
                      { status: 'upcoming', label: 'Upcoming', count: ownerBookings.filter(b => b.status === 'upcoming').length, color: 'bg-yellow-500' },
                      { status: 'cancelled', label: 'Cancelled', count: ownerBookings.filter(b => b.status === 'cancelled').length, color: 'bg-red-500' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Car className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl text-green-600">{ownerActivities.filter(a => a.status === 'arrived').length}</div>
                    <div className="text-sm text-gray-600">Vehicles Arrived</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl text-blue-600">{ownerActivities.filter(a => a.status === 'departed').length}</div>
                    <div className="text-sm text-gray-600">Vehicles Departed</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl text-orange-600">{ownerActivities.filter(a => a.status === 'overdue').length}</div>
                    <div className="text-sm text-gray-600">Overdue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Slot Performance Tab */}
          <TabsContent value="slots" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Slot Performance Analysis</CardTitle>
                <CardDescription>Revenue and utilization by parking slot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBySlot.map((data, index) => (
                    <div key={data.slot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">#{index + 1}</div>
                        <div>
                          <p className="text-sm">Space {data.slot.number}</p>
                          <p className="text-xs text-gray-500">{data.slot.locationName}</p>
                          <Badge variant={data.slot.isOwnerApproved ? 'default' : 'secondary'}>
                            {data.slot.approvalStatus || 'approved'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">৳{data.revenue.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">{data.bookings} bookings</p>
                        <p className="text-xs text-gray-500">{data.occupancyHours.toFixed(1)}h occupied</p>
                      </div>
                    </div>
                  ))}
                  {revenueBySlot.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No slot performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Booking patterns over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peak Booking Hours</span>
                      <span className="text-sm">10 AM - 12 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Booked Day</span>
                      <span className="text-sm">Friday</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Lead Time</span>
                      <span className="text-sm">2.5 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Repeat Customer Rate</span>
                      <span className="text-sm">35%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Insights</CardTitle>
                  <CardDescription>Financial performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Revenue per Booking</span>
                      <span className="text-sm">৳{ownerBookings.length > 0 ? (totalEarnings / ownerBookings.filter(b => b.status === 'completed').length).toFixed(0) : '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Revenue Growth (Monthly)</span>
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Best Performing Slot</span>
                      <span className="text-sm">{revenueBySlot[0]?.slot.number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Utilization Efficiency</span>
                      <span className="text-sm">{Math.min(100, Math.round((ownerBookings.length / (approvedSlots.length * 30)) * 100))}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Vehicle Activities</CardTitle>
                  <CardDescription>Latest vehicle movements at your spaces</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ownerActivities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm">{activity.vehicleNumber} - Slot {activity.slotNumber}</p>
                          <p className="text-xs text-gray-500">{activity.driverName}</p>
                          <p className="text-xs text-gray-400">{new Date(activity.loggedAt).toLocaleString()}</p>
                        </div>
                        <Badge variant={
                          activity.status === 'arrived' ? 'default' :
                          activity.status === 'departed' ? 'secondary' :
                          activity.status === 'overdue' ? 'destructive' : 'outline'
                        }>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                    {ownerActivities.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No vehicle activities recorded
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Alerts</CardTitle>
                  <CardDescription>Security incidents at your properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ownerAlerts.slice(0, 10).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm">Slot {alert.slotNumber}</p>
                          <p className="text-xs text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-400">{new Date(alert.reportedAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            alert.priority === 'critical' ? 'destructive' :
                            alert.priority === 'high' ? 'default' :
                            alert.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {alert.priority}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{alert.status}</p>
                        </div>
                      </div>
                    ))}
                    {ownerAlerts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No security alerts
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}