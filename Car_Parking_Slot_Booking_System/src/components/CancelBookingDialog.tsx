import React, { useState, useEffect } from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, DollarSign, Clock, Calendar, Info, CheckCircle, Zap, Target } from 'lucide-react';
import { Booking, FinePolicy } from '../App';

interface CancelBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCancel: (bookingId: string, selectedPolicy: FinePolicy) => { fine: number; description: string; timeUsed: number } | null;
}

export function CancelBookingDialog({ isOpen, onClose, booking, onCancel }: CancelBookingDialogProps) {
  const [selectedPolicyType, setSelectedPolicyType] = useState<FinePolicy['type']>('hourly');
  const [customRates, setCustomRates] = useState({
    immediate: 5,
    hourly: 2,
    daily: 20,
    maxFine: 100
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFine, setPreviewFine] = useState({ fine: 0, description: '', timeUsed: 0 });

  // Predefined policy templates
  const policyTemplates: Record<string, FinePolicy> = {
    none: {
      type: 'none'
    },
    immediate: {
      type: 'immediate',
      immediateRate: customRates.immediate
    },
    hourly: {
      type: 'hourly',
      hourlyRate: customRates.hourly,
      maxFine: customRates.maxFine
    },
    daily: {
      type: 'daily',
      dailyRate: customRates.daily,
      maxFine: customRates.maxFine * 2
    },
    tiered: {
      type: 'tiered',
      tieredRates: [
        { hours: 0, rate: 5 },    // 0-1 hours: $5
        { hours: 1, rate: 10 },   // 1-6 hours: $10
        { hours: 6, rate: 25 },   // 6-24 hours: $25
        { hours: 24, rate: 50 }   // 24+ hours: $50
      ],
      maxFine: 100
    }
  };

  useEffect(() => {
    if (booking) {
      calculatePreviewFine();
    }
  }, [booking, selectedPolicyType, customRates]);

  const calculatePreviewFine = () => {
    if (!booking) return;

    const policy = policyTemplates[selectedPolicyType];
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
        description = `${Math.ceil(timeUsedHours)} hours × $${policy.hourlyRate || 2} = $${fine}`;
        break;
      
      case 'daily':
        const dailyFine = Math.ceil(timeUsedDays) * (policy.dailyRate || 20);
        fine = Math.min(dailyFine, policy.maxFine || 200);
        description = `${Math.ceil(timeUsedDays)} days × $${policy.dailyRate || 20} = $${fine}`;
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
          description = `Tiered rate (${applicableTier.hours}+ hours): $${fine}`;
        }
        break;
    }

    setPreviewFine({ fine: Math.max(0, fine), description, timeUsed: timeUsedHours });
  };

  const getTimeUsed = () => {
    if (!booking) return { hoursUsed: 0, daysUsed: 0, minutesUsed: 0 };
    
    const bookedAt = new Date(booking.startTime);
    const now = new Date();
    const timeUsedMs = now.getTime() - bookedAt.getTime();
    const hoursUsed = timeUsedMs / (1000 * 60 * 60);
    const daysUsed = hoursUsed / 24;
    const minutesUsed = timeUsedMs / (1000 * 60);

    return {
      hoursUsed: Math.max(0, hoursUsed),
      daysUsed: Math.max(0, daysUsed),
      minutesUsed: Math.max(0, minutesUsed)
    };
  };

  const handleCancelConfirm = async () => {
    if (!booking) return;
    
    setIsProcessing(true);
    try {
      const selectedPolicy = policyTemplates[selectedPolicyType];
      const result = onCancel(booking.id, selectedPolicy);
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) return null;

  const { hoursUsed, daysUsed, minutesUsed } = getTimeUsed();

  const formatTimeUsed = () => {
    if (minutesUsed < 60) {
      return `${Math.ceil(minutesUsed)} minutes`;
    } else if (hoursUsed < 24) {
      return `${Math.ceil(hoursUsed)} hours`;
    } else {
      return `${Math.ceil(daysUsed)} days`;
    }
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'none': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'immediate': return <Zap className="w-4 h-4 text-orange-600" />;
      case 'hourly': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'daily': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'tiered': return <Target className="w-4 h-4 text-indigo-600" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Cancel Booking - Policy Selection
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choose a cancellation policy for slot <strong>{booking.slotNumber}</strong>. 
            Different policies apply different fine structures based on usage time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Slot:</span>
                  <Badge variant="outline">{booking.slotNumber}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booked At:</span>
                  <span>{new Date(booking.startTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Used:</span>
                  <span className="font-medium">{formatTimeUsed()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-blue-100 text-blue-800">{booking.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Cancellation Policy</Label>
            
            <Tabs value={selectedPolicyType} onValueChange={(value) => setSelectedPolicyType(value as FinePolicy['type'])}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="none" className="text-xs">
                  <div className="flex items-center gap-1">
                    {getPolicyIcon('none')}
                    Free
                  </div>
                </TabsTrigger>
                <TabsTrigger value="immediate" className="text-xs">
                  <div className="flex items-center gap-1">
                    {getPolicyIcon('immediate')}
                    Fixed
                  </div>
                </TabsTrigger>
                <TabsTrigger value="hourly" className="text-xs">
                  <div className="flex items-center gap-1">
                    {getPolicyIcon('hourly')}
                    Hourly
                  </div>
                </TabsTrigger>
                <TabsTrigger value="daily" className="text-xs">
                  <div className="flex items-center gap-1">
                    {getPolicyIcon('daily')}
                    Daily
                  </div>
                </TabsTrigger>
                <TabsTrigger value="tiered" className="text-xs">
                  <div className="flex items-center gap-1">
                    {getPolicyIcon('tiered')}
                    Tiered
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="none" className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPolicyIcon('none')}
                      <h4 className="font-medium">No Cancellation Fee</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Cancel this booking without any charges. This is typically used for promotional bookings or special circumstances.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="immediate" className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPolicyIcon('immediate')}
                      <h4 className="font-medium">Fixed Cancellation Fee</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      A fixed fee regardless of time used. Good for covering administrative costs.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="immediateRate">Fixed Fee Amount ($)</Label>
                      <Input
                        id="immediateRate"
                        type="number"
                        step="0.1"
                        min="0"
                        value={customRates.immediate}
                        onChange={(e) => setCustomRates(prev => ({ ...prev, immediate: parseFloat(e.target.value) || 0 }))}
                        className="w-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hourly" className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPolicyIcon('hourly')}
                      <h4 className="font-medium">Hourly Rate Policy</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Charges based on the number of hours the slot was reserved (rounded up).
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Rate per Hour ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.1"
                          min="0"
                          value={customRates.hourly}
                          onChange={(e) => setCustomRates(prev => ({ ...prev, hourly: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxFineHourly">Max Fine ($)</Label>
                        <Input
                          id="maxFineHourly"
                          type="number"
                          step="1"
                          min="0"
                          value={customRates.maxFine}
                          onChange={(e) => setCustomRates(prev => ({ ...prev, maxFine: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="daily" className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPolicyIcon('daily')}
                      <h4 className="font-medium">Daily Rate Policy</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Charges based on the number of days the slot was reserved (rounded up).
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="dailyRate">Rate per Day ($)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        step="1"
                        min="0"
                        value={customRates.daily}
                        onChange={(e) => setCustomRates(prev => ({ ...prev, daily: parseFloat(e.target.value) || 0 }))}
                        className="w-32"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tiered" className="space-y-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPolicyIcon('tiered')}
                      <h4 className="font-medium">Tiered Rate Policy</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Different rates based on how long the slot was used. Escalates with longer usage.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2 font-medium text-gray-700">
                        <span>Time Range</span>
                        <span>Fine Amount</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>0-1 hours</span>
                        <span>$5</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>1-6 hours</span>
                        <span>$10</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>6-24 hours</span>
                        <span>$25</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span>24+ hours</span>
                        <span>$50</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Fine Preview */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Cancellation Fine Preview:</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-800">${previewFine.fine.toFixed(2)}</div>
                  <div className="text-xs text-red-600">{previewFine.description}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelConfirm}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isProcessing ? 'Processing...' : `Cancel & Pay $${previewFine.fine.toFixed(2)}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}