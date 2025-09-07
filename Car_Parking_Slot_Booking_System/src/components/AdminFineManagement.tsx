import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { FinePolicy, Booking } from '../App';
import {
  ArrowLeft,
  Settings,
  Calculator,
  DollarSign,
  Clock,
  TrendingUp,
  Save,
  Plus,
  Minus,
  Info,
  AlertTriangle,
  Target,
  Timer,
  LogOut
} from 'lucide-react';

interface AdminFineManagementProps {
  onNavigate: (view: string) => void;
  onLogout: () => void;
  bookings?: Booking[];
}

export function AdminFineManagement({ onNavigate, onLogout, bookings = [] }: AdminFineManagementProps) {
  const [selectedTab, setSelectedTab] = useState('policies');
  const [finePolicies, setFinePolicies] = useState<{ [key: string]: FinePolicy }>({
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
  });

  // Calculator state
  const [calculatorBookingStart, setCalculatorBookingStart] = useState('');
  const [calculatorCurrentTime, setCalculatorCurrentTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [calculatorPolicyType, setCalculatorPolicyType] = useState<string>('none');
  const [calculatorResult, setCalculatorResult] = useState<{
    timeUsed: number;
    fine: number;
    description: string;
  } | null>(null);

  // Policy editing state
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyType, setNewPolicyType] = useState<FinePolicy['type']>('immediate');

  const calculateFine = (
    startTime: string,
    endTime: string,
    policy: FinePolicy
  ): { fine: number; description: string; timeUsed: number } => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeUsedMs = end.getTime() - start.getTime();
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

  const handleCalculate = () => {
    if (calculatorBookingStart && calculatorPolicyType !== 'none') {
      const policy = finePolicies[calculatorPolicyType];
      if (policy) {
        const result = calculateFine(calculatorBookingStart, calculatorCurrentTime, policy);
        setCalculatorResult(result);
      }
    } else {
      setCalculatorResult(null);
    }
  };

  const updatePolicy = (policyKey: string, updates: Partial<FinePolicy>) => {
    setFinePolicies(prev => ({
      ...prev,
      [policyKey]: { ...prev[policyKey], ...updates }
    }));
  };

  const addTieredRate = (policyKey: string) => {
    const policy = finePolicies[policyKey];
    if (policy.type === 'tiered' && policy.tieredRates) {
      updatePolicy(policyKey, {
        tieredRates: [...policy.tieredRates, { hours: 0, rate: 0 }]
      });
    }
  };

  const removeTieredRate = (policyKey: string, index: number) => {
    const policy = finePolicies[policyKey];
    if (policy.type === 'tiered' && policy.tieredRates && policy.tieredRates.length > 1) {
      updatePolicy(policyKey, {
        tieredRates: policy.tieredRates.filter((_, i) => i !== index)
      });
    }
  };

  const updateTieredRate = (policyKey: string, index: number, field: 'hours' | 'rate', value: number) => {
    const policy = finePolicies[policyKey];
    if (policy.type === 'tiered' && policy.tieredRates) {
      const newTiers = [...policy.tieredRates];
      newTiers[index] = { ...newTiers[index], [field]: value };
      updatePolicy(policyKey, { tieredRates: newTiers });
    }
  };

  const createNewPolicy = () => {
    if (newPolicyName && !finePolicies[newPolicyName.toLowerCase().replace(/\s+/g, '-')]) {
      const key = newPolicyName.toLowerCase().replace(/\s+/g, '-');
      let newPolicy: FinePolicy;
      
      switch (newPolicyType) {
        case 'immediate':
          newPolicy = { type: 'immediate', immediateRate: 5 };
          break;
        case 'hourly':
          newPolicy = { type: 'hourly', hourlyRate: 2, maxFine: 50 };
          break;
        case 'daily':
          newPolicy = { type: 'daily', dailyRate: 20, maxFine: 100 };
          break;
        case 'tiered':
          newPolicy = {
            type: 'tiered',
            tieredRates: [{ hours: 0, rate: 5 }],
            maxFine: 100
          };
          break;
        default:
          newPolicy = { type: 'none' };
      }
      
      setFinePolicies(prev => ({ ...prev, [key]: newPolicy }));
      setShowCreateDialog(false);
      setNewPolicyName('');
      setNewPolicyType('immediate');
    }
  };

  const getPolicyDisplayName = (key: string) => {
    switch (key) {
      case 'immediate': return 'Fixed Fee Policy';
      case 'hourly': return 'Hourly Rate Policy';
      case 'daily': return 'Daily Rate Policy';
      case 'tiered': return 'Tiered Rate Policy';
      case 'none': return 'No Fine Policy';
      default: return key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Policy';
    }
  };

  // Calculate statistics
  const totalFinesCollected = bookings
    .filter(b => b.status === 'cancelled' && b.cancelFine)
    .reduce((sum, b) => sum + (b.cancelFine || 0), 0);

  const averageFine = bookings.filter(b => b.status === 'cancelled' && b.cancelFine).length > 0 
    ? totalFinesCollected / bookings.filter(b => b.status === 'cancelled' && b.cancelFine).length 
    : 0;

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('admin-dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="ml-3 text-lg">Fine Management</h1>
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
                onClick={() => onNavigate('admin-bookings')}
              >
                <Clock className="mr-3 h-4 w-4" />
                Bookings
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                style={{ backgroundColor: '#2563EB' }}
              >
                <Settings className="mr-3 h-4 w-4" />
                Fine Management
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
          <div className="mb-6">
            <h1 className="text-2xl mb-2">Fine Management System</h1>
            <p className="text-gray-600">Configure cancellation policies and calculate time-based fines</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-semibold text-green-600">${totalFinesCollected.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Fines Collected</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-semibold text-blue-600">${averageFine.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Average Fine</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-semibold text-red-600">{cancelledBookings}</p>
                <p className="text-sm text-gray-600">Cancelled Bookings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Settings className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-semibold text-purple-600">{Object.keys(finePolicies).length}</p>
                <p className="text-sm text-gray-600">Active Policies</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="policies">Policy Configuration</TabsTrigger>
              <TabsTrigger value="calculator">Fine Calculator</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Policy Configuration Tab */}
            <TabsContent value="policies" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Cancellation Fine Policies</h3>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </div>

              <div className="grid gap-6">
                {Object.entries(finePolicies).map(([key, policy]) => (
                  <Card key={key} className="relative">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                          {getPolicyDisplayName(key)}
                          <Badge variant={key === 'none' ? 'secondary' : 'default'}>
                            {policy.type}
                          </Badge>
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPolicy(editingPolicy === key ? null : key)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {policy.type === 'immediate' && (
                        <div>
                          <Label>Fixed Rate ($)</Label>
                          <Input
                            type="number"
                            value={policy.immediateRate || 5}
                            onChange={(e) => updatePolicy(key, { immediateRate: parseFloat(e.target.value) || 0 })}
                            disabled={editingPolicy !== key}
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
                              step="0.01"
                              value={policy.hourlyRate || 2}
                              onChange={(e) => updatePolicy(key, { hourlyRate: parseFloat(e.target.value) || 0 })}
                              disabled={editingPolicy !== key}
                            />
                          </div>
                          <div>
                            <Label>Maximum Fine ($)</Label>
                            <Input
                              type="number"
                              value={policy.maxFine || 50}
                              onChange={(e) => updatePolicy(key, { maxFine: parseFloat(e.target.value) || 0 })}
                              disabled={editingPolicy !== key}
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
                              step="0.01"
                              value={policy.dailyRate || 20}
                              onChange={(e) => updatePolicy(key, { dailyRate: parseFloat(e.target.value) || 0 })}
                              disabled={editingPolicy !== key}
                            />
                          </div>
                          <div>
                            <Label>Maximum Fine ($)</Label>
                            <Input
                              type="number"
                              value={policy.maxFine || 100}
                              onChange={(e) => updatePolicy(key, { maxFine: parseFloat(e.target.value) || 0 })}
                              disabled={editingPolicy !== key}
                            />
                          </div>
                        </div>
                      )}

                      {policy.type === 'tiered' && policy.tieredRates && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label>Tiered Rates</Label>
                            {editingPolicy === key && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addTieredRate(key)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {policy.tieredRates.map((tier, index) => (
                            <div key={index} className="flex gap-3 items-center">
                              <div className="flex-1">
                                <Label className="text-xs">Hours</Label>
                                <Input
                                  type="number"
                                  value={tier.hours}
                                  onChange={(e) => updateTieredRate(key, index, 'hours', parseInt(e.target.value) || 0)}
                                  disabled={editingPolicy !== key}
                                />
                              </div>
                              <span className="text-gray-500 mt-5">→</span>
                              <div className="flex-1">
                                <Label className="text-xs">Rate ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={tier.rate}
                                  onChange={(e) => updateTieredRate(key, index, 'rate', parseFloat(e.target.value) || 0)}
                                  disabled={editingPolicy !== key}
                                />
                              </div>
                              {editingPolicy === key && policy.tieredRates && policy.tieredRates.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeTieredRate(key, index)}
                                  className="mt-5"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {editingPolicy === key && (
                            <div>
                              <Label>Maximum Fine ($)</Label>
                              <Input
                                type="number"
                                value={policy.maxFine || 100}
                                onChange={(e) => updatePolicy(key, { maxFine: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {editingPolicy === key && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button size="sm" onClick={() => setEditingPolicy(null)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingPolicy(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Fine Calculator Tab */}
            <TabsContent value="calculator" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Time-Based Fine Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Booking Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={calculatorBookingStart}
                        onChange={(e) => setCalculatorBookingStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Current Time (Cancellation Time)</Label>
                      <Input
                        type="datetime-local"
                        value={calculatorCurrentTime}
                        onChange={(e) => setCalculatorCurrentTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Policy Type</Label>
                      <Select value={calculatorPolicyType} onValueChange={setCalculatorPolicyType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select policy" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(finePolicies).map(([key, policy]) => (
                            <SelectItem key={key} value={key}>
                              {getPolicyDisplayName(key)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={handleCalculate} className="bg-blue-600 hover:bg-blue-700">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Fine
                    </Button>
                    <Button variant="outline" onClick={() => setCalculatorCurrentTime(new Date().toISOString().slice(0, 16))}>
                      <Timer className="h-4 w-4 mr-2" />
                      Use Current Time
                    </Button>
                  </div>

                  <Separator />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Calculation Result</h4>
                    {calculatorResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Time Used:</span>
                            <p className="font-mono text-lg">{calculatorResult.timeUsed.toFixed(2)} hours</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Policy Applied:</span>
                            <p className="font-medium">{getPolicyDisplayName(calculatorPolicyType)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Calculation:</span>
                            <p className="text-sm">{calculatorResult.description}</p>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-lg">Total Fine Amount:</span>
                            <span className="text-2xl font-bold text-red-600">
                              ${calculatorResult.fine.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Calculator className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          {!calculatorBookingStart 
                            ? 'Set booking start time to calculate fine' 
                            : calculatorPolicyType === 'none' 
                            ? 'Select a policy type to calculate fine'
                            : 'Click "Calculate Fine" to see the result'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fine Policy Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800">Fixed Fee Policy</h5>
                      <p className="text-sm text-blue-600">Charges a flat rate regardless of time used. Example: $5 cancellation fee.</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800">Hourly Rate Policy</h5>
                      <p className="text-sm text-green-600">Charges based on hours used. Example: $2 per hour, max $50.</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h5 className="font-medium text-yellow-800">Daily Rate Policy</h5>
                      <p className="text-sm text-yellow-600">Charges based on days used. Example: $20 per day, max $100.</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h5 className="font-medium text-purple-800">Tiered Rate Policy</h5>
                      <p className="text-sm text-purple-600">Different rates for different time periods. Example: 0-1h: $5, 1-3h: $10, 3-6h: $15.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fine Collection Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Bookings:</span>
                        <span className="font-medium">{bookings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cancelled Bookings:</span>
                        <span className="font-medium">{cancelledBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bookings with Fines:</span>
                        <span className="font-medium">
                          {bookings.filter(b => b.status === 'cancelled' && b.cancelFine).length}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total Fines Collected:</span>
                        <span className="text-green-600">${totalFinesCollected.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Policy Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(finePolicies).map(([key, policy]) => {
                        const usageCount = bookings.filter(b => 
                          b.status === 'cancelled' && 
                          b.cancelPolicy?.toLowerCase().includes(policy.type.toLowerCase())
                        ).length;
                        
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span>{getPolicyDisplayName(key)}</span>
                            <Badge variant="outline">{usageCount} times</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Fine Policy</DialogTitle>
            <DialogDescription>
              Define a new cancellation fine policy for your parking system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Policy Name</Label>
              <Input
                value={newPolicyName}
                onChange={(e) => setNewPolicyName(e.target.value)}
                placeholder="e.g., Premium Policy"
              />
            </div>
            <div>
              <Label>Policy Type</Label>
              <Select value={newPolicyType} onValueChange={(value) => setNewPolicyType(value as FinePolicy['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Fixed Fee</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="daily">Daily Rate</SelectItem>
                  <SelectItem value="tiered">Tiered System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewPolicy} className="bg-blue-600 hover:bg-blue-700">
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="analytics">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="space-y-4">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Policy
            </Button>
            
            {Object.entries(finePolicies).map(([key, policy]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{getPolicyDisplayName(key)}</h4>
                    <Badge variant={key === 'none' ? 'secondary' : 'default'}>
                      {policy.type}
                    </Badge>
                  </div>
                  {policy.type !== 'none' && (
                    <p className="text-sm text-gray-600">
                      {policy.type === 'immediate' && `Fixed rate: $${policy.immediateRate}`}
                      {policy.type === 'hourly' && `$${policy.hourlyRate}/hour (max $${policy.maxFine})`}
                      {policy.type === 'daily' && `$${policy.dailyRate}/day (max $${policy.maxFine})`}
                      {policy.type === 'tiered' && `Tiered rates (max $${policy.maxFine})`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Booking Start</Label>
                  <Input
                    type="datetime-local"
                    value={calculatorBookingStart}
                    onChange={(e) => setCalculatorBookingStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Policy</Label>
                  <Select value={calculatorPolicyType} onValueChange={setCalculatorPolicyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(finePolicies).map(([key, policy]) => (
                        <SelectItem key={key} value={key}>
                          {getPolicyDisplayName(key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700">
                  Calculate Fine
                </Button>
                {calculatorResult && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Result:</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${calculatorResult.fine.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{calculatorResult.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-semibold text-green-600">${totalFinesCollected.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Total Fines</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-semibold text-red-600">{cancelledBookings}</p>
                  <p className="text-xs text-gray-600">Cancelled</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}