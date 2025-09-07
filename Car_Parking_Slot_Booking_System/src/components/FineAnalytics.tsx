import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { Booking } from '../App';

interface FineAnalyticsProps {
  bookings: Booking[];
}

export function FineAnalytics({ bookings }: FineAnalyticsProps) {
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const paidCancellations = cancelledBookings.filter(b => b.cancelFine && b.cancelFine > 0);
  const freeCancellations = cancelledBookings.filter(b => !b.cancelFine || b.cancelFine === 0);

  const totalFines = paidCancellations.reduce((sum, b) => sum + (b.cancelFine || 0), 0);
  const averageFine = paidCancellations.length > 0 ? totalFines / paidCancellations.length : 0;
  const averageTimeUsed = paidCancellations.length > 0 
    ? paidCancellations.reduce((sum, b) => sum + (b.timeUsedHours || 0), 0) / paidCancellations.length 
    : 0;

  // Group by policy type for analysis
  const policyGroups = paidCancellations.reduce((groups, booking) => {
    const policy = booking.cancelPolicy || 'Unknown';
    const policyType = policy.includes('Fixed') ? 'Fixed Fee' 
                     : policy.includes('Hourly') ? 'Hourly Rate'
                     : policy.includes('Daily') ? 'Daily Rate'
                     : policy.includes('Tiered') ? 'Tiered System'
                     : 'Other';
    
    if (!groups[policyType]) {
      groups[policyType] = { count: 0, totalFine: 0, totalTime: 0 };
    }
    
    groups[policyType].count += 1;
    groups[policyType].totalFine += booking.cancelFine || 0;
    groups[policyType].totalTime += booking.timeUsedHours || 0;
    
    return groups;
  }, {} as Record<string, { count: number; totalFine: number; totalTime: number }>);

  const getPolicyColor = (policy: string) => {
    switch (policy) {
      case 'Fixed Fee': return 'bg-orange-100 text-orange-800';
      case 'Hourly Rate': return 'bg-blue-100 text-blue-800';
      case 'Daily Rate': return 'bg-purple-100 text-purple-800';
      case 'Tiered System': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEfficiencyScore = () => {
    if (cancelledBookings.length === 0) return 100;
    const cancellationRate = (cancelledBookings.length / bookings.length) * 100;
    return Math.max(0, 100 - cancellationRate);
  };

  if (cancelledBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg mb-2">No Cancellation Data</h3>
          <p className="text-gray-600">No cancelled bookings found to analyze.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Statistics */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-lg font-semibold">${totalFines.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Fines</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-lg font-semibold">${averageFine.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Avg Fine</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-lg font-semibold">{averageTimeUsed.toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Avg Time Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-lg font-semibold">{getEfficiencyScore().toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Booking Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Policy Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(policyGroups).map(([policy, data]) => {
              const avgFine = data.count > 0 ? data.totalFine / data.count : 0;
              const avgTime = data.count > 0 ? data.totalTime / data.count : 0;
              const percentage = (data.count / paidCancellations.length) * 100;

              return (
                <div key={policy} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getPolicyColor(policy)}>{policy}</Badge>
                      <span className="text-sm font-medium">{data.count} cancellations</span>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">${data.totalFine.toFixed(2)} total</div>
                      <div className="text-gray-600">${avgFine.toFixed(2)} avg</div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{percentage.toFixed(0)}% of paid cancellations</span>
                    <span>Avg time: {avgTime.toFixed(1)}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancellation Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Cancellations:</span>
              <span className="font-medium">{cancelledBookings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Paid Cancellations:</span>
              <span className="font-medium">{paidCancellations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Free Cancellations:</span>
              <span className="font-medium">{freeCancellations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cancellation Rate:</span>
              <span className="font-medium">
                {((cancelledBookings.length / bookings.length) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fine Collection Rate:</span>
              <span className="font-medium">
                {((paidCancellations.length / cancelledBookings.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Highest Single Fine:</span>
              <span className="font-medium">
                ${Math.max(...paidCancellations.map(b => b.cancelFine || 0)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Most Common Policy:</span>
              <span className="font-medium">
                {Object.entries(policyGroups).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Fine per Hour:</span>
              <span className="font-medium">
                ${averageTimeUsed > 0 ? (averageFine / averageTimeUsed).toFixed(2) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}