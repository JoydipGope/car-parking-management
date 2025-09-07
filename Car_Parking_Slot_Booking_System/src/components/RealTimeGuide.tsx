import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Building, 
  User, 
  Shield, 
  Zap,
  ArrowRight,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

interface RealTimeGuideProps {
  isConnected: boolean;
  userRole: 'user' | 'admin' | 'manager';
}

export function RealTimeGuide({ isConnected, userRole }: RealTimeGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRoleFeatures = () => {
    switch (userRole) {
      case 'admin':
        return [
          {
            icon: <Building className="w-5 h-5 text-blue-600" />,
            title: 'Tenant Slot Approvals',
            description: 'Get instant notifications when managers create new tenant slots requiring approval',
            events: ['tenant_slot_created', 'slot_approved', 'slot_rejected']
          },
          {
            icon: <Bell className="w-5 h-5 text-green-600" />,
            title: 'New Bookings',
            description: 'Real-time alerts when users book parking slots',
            events: ['new_booking', 'booking_cancelled']
          },
          {
            icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
            title: 'System Notifications',
            description: 'Critical system updates and user activity monitoring',
            events: ['slot_created', 'slot_updated', 'slot_deleted']
          }
        ];
      case 'manager':
        return [
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: 'Slot Approvals',
            description: 'Instant updates when admin approves or rejects your tenant slots',
            events: ['slot_approved', 'slot_rejected']
          },
          {
            icon: <Bell className="w-5 h-5 text-blue-600" />,
            title: 'Tenant Notifications',
            description: 'Updates about your tenant slots and booking activities',
            events: ['notification', 'booking_updates']
          }
        ];
      case 'user':
        return [
          {
            icon: <Building className="w-5 h-5 text-blue-600" />,
            title: 'New Slot Alerts',
            description: 'Get notified when new parking slots become available',
            events: ['slot_created', 'slot_approved']
          },
          {
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: 'Booking Updates',
            description: 'Real-time updates about your bookings and any changes',
            events: ['booking_confirmed', 'booking_cancelled']
          }
        ];
      default:
        return [];
    }
  };

  const features = getRoleFeatures();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Real-Time Features
            <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Connection Status */}
        <Alert className={`mb-4 ${isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <AlertTitle className={isConnected ? 'text-green-800' : 'text-red-800'}>
              {isConnected ? 'Real-Time Connection Active' : 'Connection Lost'}
            </AlertTitle>
          </div>
          <AlertDescription className={isConnected ? 'text-green-700' : 'text-red-700'}>
            {isConnected 
              ? 'You will receive instant notifications for all relevant activities.'
              : 'Refresh the page to reconnect. Some features may not work until reconnected.'
            }
          </AlertDescription>
        </Alert>

        {/* Role-specific Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Available for {userRole.charAt(0).toUpperCase() + userRole.slice(1)}s
          </h4>
          
          <div className="grid gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {feature.icon}
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{feature.title}</h5>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                  {isExpanded && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {feature.events.map((event, eventIndex) => (
                          <Badge key={eventIndex} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Technical Details */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                How It Works
              </h4>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Uses Socket.IO for real-time bidirectional communication</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Automatically reconnects if connection is lost</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Events are filtered based on your user role and permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Graceful fallback to polling when real-time connection fails</span>
                </div>
              </div>
            </div>

            {/* Event Timeline Example */}
            {userRole === 'admin' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tenant Slot Approval Workflow
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">1. Manager creates tenant slot</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs">tenant_slot_created</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-gray-600">2. Admin receives notification</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs bg-amber-50">pending_approval</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">3. Admin approves/rejects</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs bg-green-50">slot_approved</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">4. Manager gets instant update</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs bg-purple-50">notification</Badge>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!isConnected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Reconnect to Real-Time Updates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}