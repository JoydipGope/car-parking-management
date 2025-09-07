import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Booking, FinePolicy } from '../App';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calculator,
  Award,
  AlertCircle,
  CheckCircle2,
  Timer,
  ArrowLeft
} from 'lucide-react';

interface EnhancedFineAnalyticsProps {
  bookings: Booking[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function EnhancedFineAnalytics({ bookings, onNavigate, onLogout }: EnhancedFineAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [policyFilter, setPolicyFilter] = useState('all');

  // Calculate comprehensive analytics
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled' && b.cancelFine);
  
  const analytics = {
    totalFines: cancelledBookings.reduce((sum, b) => sum + (b.cancelFine || 0), 0),
    averageFine: cancelledBookings.length > 0 ? cancelledBookings.reduce((sum, b) => sum + (b.cancelFine || 0), 0) / cancelledBookings.length : 0,
    totalCancellations: cancelledBookings.length,
    cancellationRate: bookings.length > 0 ? (cancelledBookings.length / bookings.length) * 100 : 0,
    
    // Policy effectiveness
    policyBreakdown: Object.entries(
      cancelledBookings.reduce((acc, b) => {
        const policy = b.cancelPolicy?.split(':')[0] || 'Unknown';
        acc[policy] = (acc[policy] || 0) + (b.cancelFine || 0);
        return acc;
      }, {} as Record<string, number>)
    ).map(([policy, amount]) => ({ policy, amount, count: cancelledBookings.filter(b => b.cancelPolicy?.includes(policy)).length })),

    // Time-based analysis
    hourlyFines: Array.from({ length: 24 }, (_, hour) => {
      const hourBookings = cancelledBookings.filter(b => new Date(b.cancelTime || 0).getHours() === hour);
      return {
        hour,
        amount: hourBookings.reduce((sum, b) => sum + (b.cancelFine || 0), 0),
        count: hourBookings.length
      };
    }),

    // Daily trends (last 30 days)
    dailyTrends: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dayBookings = cancelledBookings.filter(b => {
        const cancelDate = new Date(b.cancelTime || 0);
        return cancelDate.toDateString() === date.toDateString();
      });
      return {
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayBookings.reduce((sum, b) => sum + (b.cancelFine || 0), 0),
        count: dayBookings.length
      };
    }),

    // User behavior analysis
    repeatOffenders: Object.entries(
      cancelledBookings.reduce((acc, b) => {
        acc[b.userId] = acc[b.userId] || { name: b.userName, count: 0, totalFine: 0 };
        acc[b.userId].count++;
        acc[b.userId].totalFine += b.cancelFine || 0;
        return acc;
      }, {} as Record<string, { name: string; count: number; totalFine: number }>)
    ).map(([userId, data]) => ({ userId, ...data }))
     .sort((a, b) => b.count - a.count),

    // Fine range distribution
    fineRanges: [
      { range: '$0-10', count: cancelledBookings.filter(b => (b.cancelFine || 0) <= 10).length },
      { range: '$11-25', count: cancelledBookings.filter(b => (b.cancelFine || 0) > 10 && (b.cancelFine || 0) <= 25).length },
      { range: '$26-50', count: cancelledBookings.filter(b => (b.cancelFine || 0) > 25 && (b.cancelFine || 0) <= 50).length },
      { range: '$51-100', count: cancelledBookings.filter(b => (b.cancelFine || 0) > 50 && (b.cancelFine || 0) <= 100).length },
      { range: '$100+', count: cancelledBookings.filter(b => (b.cancelFine || 0) > 100).length }
    ],

    // Weekend vs Weekday comparison
    weekendVsWeekday: {
      weekend: {
        count: cancelledBookings.filter(b => {
          const day = new Date(b.cancelTime || 0).getDay();
          return day === 0 || day === 6;
        }).length,
        amount: cancelledBookings.filter(b => {
          const day = new Date(b.cancelTime || 0).getDay();
          return day === 0 || day === 6;
        }).reduce((sum, b) => sum + (b.cancelFine || 0), 0)
      },
      weekday: {
        count: cancelledBookings.filter(b => {
          const day = new Date(b.cancelTime || 0).getDay();
          return day >= 1 && day <= 5;
        }).length,
        amount: cancelledBookings.filter(b => {
          const day = new Date(b.cancelTime || 0).getDay();
          return day >= 1 && day <= 5;
        }).reduce((sum, b) => sum + (b.cancelFine || 0), 0)
      }
    },

    // Time before cancellation analysis
    cancellationTiming: {
      immediate: cancelledBookings.filter(b => (b.timeUsedHours || 0) < 0.25).length,
      shortTerm: cancelledBookings.filter(b => (b.timeUsedHours || 0) >= 0.25 && (b.timeUsedHours || 0) < 2).length,
      midTerm: cancelledBookings.filter(b => (b.timeUsedHours || 0) >= 2 && (b.timeUsedHours || 0) < 6).length,
      longTerm: cancelledBookings.filter(b => (b.timeUsedHours || 0) >= 6).length
    }
  };

  const COLORS = ['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 md:p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Enhanced Fine Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced insights into cancellation patterns and fine policy effectiveness
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => onNavigate('admin-dashboard')}
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">${analytics.totalFines.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Fines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">${analytics.averageFine.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Avg Fine</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{analytics.totalCancellations}</p>
              <p className="text-sm text-gray-600">Cancellations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{analytics.cancellationRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Cancel Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{analytics.repeatOffenders.filter(u => u.count > 1).length}</p>
              <p className="text-sm text-gray-600">Repeat Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-indigo-600">
                {analytics.policyBreakdown.length > 0 ? 
                  analytics.policyBreakdown.reduce((max, p) => p.amount > max.amount ? p : max).policy : 'N/A'
                }
              </p>
              <p className="text-sm text-gray-600">Top Policy</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Daily Fine Collection (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [`$${value}`, 'Amount']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `${payload[0].payload.date} (${label})`;
                          }
                          return label;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#2563EB" 
                        fill="#2563EB" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Fine Range Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Fine Amount Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.fineRanges}
                        dataKey="count"
                        nameKey="range"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ range, count, percent }) => 
                          count > 0 ? `${range}: ${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {analytics.fineRanges.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} bookings`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Weekend vs Weekday Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Weekend vs Weekday Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-blue-900">Weekday Fines</h4>
                        <p className="text-2xl font-bold text-blue-600">${analytics.weekendVsWeekday.weekday.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{analytics.weekendVsWeekday.weekday.count} cancellations</p>
                      </div>
                      <Calendar className="h-12 w-12 text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-orange-900">Weekend Fines</h4>
                        <p className="text-2xl font-bold text-orange-600">${analytics.weekendVsWeekday.weekend.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{analytics.weekendVsWeekday.weekend.count} cancellations</p>
                      </div>
                      <Clock className="h-12 w-12 text-orange-400" />
                    </div>
                  </div>
                </div>
                
                {/* Comparison Insights */}
                <div className="mt-4">
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      {analytics.weekendVsWeekday.weekend.amount > analytics.weekendVsWeekday.weekday.amount ?
                        `Weekend fines are ${analytics.weekendVsWeekday.weekday.amount > 0 ? ((analytics.weekendVsWeekday.weekend.amount / analytics.weekendVsWeekday.weekday.amount) * 100 - 100).toFixed(1) : '0'}% higher than weekday fines, indicating higher cancellation penalties during weekends.` :
                        `Weekday fines are ${analytics.weekendVsWeekday.weekend.amount > 0 ? ((analytics.weekendVsWeekday.weekday.amount / analytics.weekendVsWeekday.weekend.amount) * 100 - 100).toFixed(1) : '0'}% higher than weekend fines.`
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            {/* Hourly Fine Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Hourly Fine Collection Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.hourlyFines}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [`$${value}`, 'Fine Amount']}
                      labelFormatter={(label) => `${label}:00`}
                    />
                    <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cancellation Timing Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Timing Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{analytics.cancellationTiming.immediate}</p>
                    <p className="text-sm text-gray-600">Immediate</p>
                    <p className="text-xs text-gray-500">(&lt; 15 min)</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">{analytics.cancellationTiming.shortTerm}</p>
                    <p className="text-sm text-gray-600">Short Term</p>
                    <p className="text-xs text-gray-500">(15min - 2h)</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Timer className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{analytics.cancellationTiming.midTerm}</p>
                    <p className="text-sm text-gray-600">Mid Term</p>
                    <p className="text-xs text-gray-500">(2h - 6h)</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{analytics.cancellationTiming.longTerm}</p>
                    <p className="text-sm text-gray-600">Long Term</p>
                    <p className="text-xs text-gray-500">(6h+)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Effectiveness Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Fine Policy Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.policyBreakdown.map((policy, index) => (
                    <div key={policy.policy} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{policy.policy} Policy</h4>
                        <p className="text-sm text-gray-600">{policy.count} applications</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                          ${policy.amount.toFixed(2)}
                        </p>
                        <Progress 
                          value={analytics.policyBreakdown.length > 0 ? (policy.amount / Math.max(...analytics.policyBreakdown.map(p => p.amount))) * 100 : 0} 
                          className="w-24 h-2 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {analytics.policyBreakdown.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No policy data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Behavior Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.repeatOffenders.slice(0, 10).map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-600">ID: {user.userId.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">${user.totalFine.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{user.count} cancellations</p>
                        {user.count > 2 && (
                          <Badge className="mt-1 bg-red-100 text-red-800">Repeat Offender</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {analytics.repeatOffenders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p>No repeat offenders found</p>
                    <p className="text-sm">All users have good cancellation behavior</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-6">
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Advanced timing analysis coming soon</p>
              <p className="text-sm">Real-time booking patterns, peak hours, and seasonal trends</p>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Peak Fine Collection:</strong> Most fines are collected between 2-4 PM, suggesting users often cancel during midday hours.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Policy Recommendation:</strong> The tiered policy shows highest effectiveness with ${analytics.policyBreakdown.find(p => p.policy.includes('Tiered'))?.amount.toFixed(2) || '0'} collected.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      <strong>User Behavior:</strong> {analytics.repeatOffenders.filter(u => u.count > 2).length} users have multiple cancellations and may benefit from targeted interventions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800">✓ Grace Period Optimization</h4>
                    <p className="text-sm text-green-600">Consider extending grace period to reduce immediate cancellations</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800">✓ Weekend Policy Adjustment</h4>
                    <p className="text-sm text-blue-600">Weekend multipliers are effective - consider similar for holidays</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-800">✓ User Education</h4>
                    <p className="text-sm text-orange-600">Target repeat offenders with booking behavior training</p>
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