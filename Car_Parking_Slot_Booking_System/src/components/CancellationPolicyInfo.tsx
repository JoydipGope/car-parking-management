import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  Zap, 
  Clock, 
  Calendar, 
  Target, 
  DollarSign, 
  AlertTriangle,
  Info
} from 'lucide-react';

export function CancellationPolicyInfo() {
  const policies = [
    {
      type: 'No Fee',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      description: 'Cancel without any charges',
      color: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-800',
      details: [
        'Perfect for promotional bookings',
        'Special circumstances',
        'Customer goodwill gestures',
        'Administrative cancellations'
      ]
    },
    {
      type: 'Fixed Fee',
      icon: <Zap className="w-5 h-5 text-orange-600" />,
      description: 'Flat rate regardless of time used',
      color: 'bg-orange-50 border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
      details: [
        'Covers administrative costs',
        'Simple and predictable',
        'Typically $5-$15',
        'Good for short-term bookings'
      ]
    },
    {
      type: 'Hourly Rate',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      description: 'Charged per hour used (rounded up)',
      color: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      details: [
        'Fair for short-term usage',
        'Usually $1-$5 per hour',
        'Includes maximum cap',
        'Most common policy'
      ]
    },
    {
      type: 'Daily Rate',
      icon: <Calendar className="w-5 h-5 text-purple-600" />,
      description: 'Charged per day used (rounded up)',
      color: 'bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      details: [
        'Better for long-term bookings',
        'Usually $15-$30 per day',
        'Includes maximum cap',
        'Covers opportunity cost'
      ]
    },
    {
      type: 'Tiered System',
      icon: <Target className="w-5 h-5 text-indigo-600" />,
      description: 'Escalating rates based on usage time',
      color: 'bg-indigo-50 border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-800',
      details: [
        '0-1 hours: $5',
        '1-6 hours: $10',
        '6-24 hours: $25',
        '24+ hours: $50'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Cancellation Policy Guide</h2>
        <p className="text-gray-600">
          Understanding different fine structures helps you choose the most appropriate policy for each cancellation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policies.map((policy, index) => (
          <Card key={index} className={`${policy.color} transition-all hover:shadow-md`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {policy.icon}
                  <CardTitle className="text-base">{policy.type}</CardTitle>
                </div>
                <Badge className={policy.badge}>Policy</Badge>
              </div>
              <CardDescription className="text-sm">
                {policy.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm text-gray-700">
                {policy.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-800">Policy Selection Guidelines</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Choose based on the specific situation and customer relationship</li>
                <li>• Consider the actual time the slot was unavailable to other customers</li>
                <li>• Factor in administrative costs and opportunity costs</li>
                <li>• Be consistent with similar situations to maintain fairness</li>
                <li>• Document the reasoning for future reference</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-800">Time Calculation</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Time Used:</strong> Calculated from booking start time to cancellation time</p>
                <p><strong>Rounding:</strong> Hours are rounded up (e.g., 2.1 hours = 3 hours)</p>
                <p><strong>Minimum:</strong> Most policies have a minimum charge even for immediate cancellation</p>
                <p><strong>Maximum:</strong> Caps prevent excessive charges for very long bookings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}