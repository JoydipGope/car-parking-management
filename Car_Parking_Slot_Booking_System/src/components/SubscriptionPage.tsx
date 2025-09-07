import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Subscription } from '../App';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Calendar,
  CreditCard,
  LogOut,
  Star,
  Zap
} from 'lucide-react';

interface SubscriptionPageProps {
  user: User;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const plans = [
  { 
    id: "trial" as const, 
    name: "Trial", 
    price_usd: 0, 
    price_bdt: 0, 
    desc: "Free for 3 days",
    icon: Star,
    features: [
      "Basic parking slot booking",
      "Up to 3 bookings per day",
      "Email support"
    ],
    color: "from-gray-400 to-gray-600"
  },
  { 
    id: "monthly" as const, 
    name: "Monthly", 
    price_usd: 5, 
    price_bdt: 550, 
    desc: "Perfect for regular users",
    icon: Calendar,
    features: [
      "Unlimited parking slot booking",
      "Priority booking access",
      "24/7 phone support",
      "Booking history & analytics"
    ],
    color: "from-blue-500 to-blue-700",
    popular: true
  },
  { 
    id: "yearly" as const, 
    name: "Yearly", 
    price_usd: 50, 
    price_bdt: 5500, 
    desc: "Best value for power users",
    icon: Crown,
    features: [
      "Everything in Monthly",
      "Advanced booking features",
      "Premium customer support",
      "Early access to new features",
      "2 months free"
    ],
    color: "from-purple-500 to-purple-700"
  }
];

export function SubscriptionPage({ user, onNavigate, onLogout }: SubscriptionPageProps) {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserSubscription();
  }, [user.id]);

  const fetchUserSubscription = async () => {
    try {
      // Mock API call - replace with actual API endpoint
      // const response = await fetch(`/api/subscriptions/${user.id}`);
      // const subscriptions = await response.json();
      
      // Mock current subscription for demo
      const mockSubscription: Subscription = {
        id: '1',
        user_id: user.id,
        plan: 'trial',
        start_date: '2024-12-20',
        end_date: '2024-12-23',
        price_usd: 0,
        price_bdt: 0,
        status: 'active',
        created_at: '2024-12-20'
      };
      setCurrentSubscription(mockSubscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setIsLoading(true);
    setMessage("");
    
    try {
      // Mock API call - replace with actual API endpoint
      // const response = await fetch('/api/subscriptions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ user_id: user.id, plan: plan.id })
      // });
      
      // Mock success response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSubscription: Subscription = {
        id: Date.now().toString(),
        user_id: user.id,
        plan: plan.id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + (plan.id === 'trial' ? 3 : plan.id === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
        price_usd: plan.price_usd,
        price_bdt: plan.price_bdt,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      setCurrentSubscription(newSubscription);
      setMessage(`✅ Successfully subscribed to ${plan.name} plan!`);
    } catch (error) {
      setMessage("❌ Error subscribing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSubscriptionStatus = (subscription: Subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    
    if (subscription.status === 'cancelled') return 'cancelled';
    if (subscription.status === 'expired' || endDate < now) return 'expired';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('user-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="ml-3 text-lg">Subscription</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
          <div className="p-6">
            <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>
              ParkEasy
            </h2>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('user-dashboard')}
              >
                <ArrowLeft className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                style={{ backgroundColor: '#2563EB' }}
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Subscription
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
            <h1 className="text-2xl mb-2">Subscription Management</h1>
            <p className="text-gray-600">Manage your subscription plan and billing</p>
          </div>

          {/* Current Subscription Status */}
          {currentSubscription && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg capitalize">{currentSubscription.plan} Plan</h3>
                      <Badge className={getStatusColor(getSubscriptionStatus(currentSubscription))}>
                        {getSubscriptionStatus(currentSubscription)}
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Active from {formatDate(currentSubscription.start_date)} to {formatDate(currentSubscription.end_date)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ${currentSubscription.price_usd} {currentSubscription.price_usd > 0 && `(৳${currentSubscription.price_bdt})`}
                    </p>
                  </div>
                  {getSubscriptionStatus(currentSubscription) === 'active' && (
                    <div className="mt-4 md:mt-0">
                      <Badge className="bg-green-100 text-green-800">
                        <Zap className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Subscription Plans */}
          <div>
            <h2 className="text-xl mb-4">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                const isCurrentPlan = currentSubscription?.plan === plan.id;
                
                return (
                  <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge style={{ backgroundColor: '#2563EB' }} className="text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-gray-600">{plan.desc}</p>
                      <div className="mt-4">
                        <span className="text-3xl">${plan.price_usd}</span>
                        {plan.price_usd > 0 && (
                          <p className="text-sm text-gray-500 mt-1">≈ ৳{plan.price_bdt}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : "default"}
                        style={!isCurrentPlan ? { backgroundColor: '#2563EB' } : {}}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading || isCurrentPlan}
                      >
                        {isLoading ? (
                          "Processing..."
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : plan.price_usd === 0 ? (
                          "Start Free Trial"
                        ) : (
                          "Subscribe Now"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg capitalize">{currentSubscription.plan}</h3>
                <Badge className={getStatusColor(getSubscriptionStatus(currentSubscription))}>
                  {getSubscriptionStatus(currentSubscription)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Until {formatDate(currentSubscription.end_date)}
              </p>
              <p className="text-sm text-gray-500">
                ${currentSubscription.price_usd} {currentSubscription.price_usd > 0 && `(৳${currentSubscription.price_bdt})`}
              </p>
            </CardContent>
          </Card>
        )}

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Subscription Plans */}
        <div className="space-y-4">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = currentSubscription?.plan === plan.id;
            
            return (
              <Card key={plan.id} className={`${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg">{plan.name}</h3>
                        <div className="text-right">
                          <span className="text-xl">${plan.price_usd}</span>
                          {plan.price_usd > 0 && (
                            <p className="text-xs text-gray-500">≈ ৳{plan.price_bdt}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{plan.desc}</p>
                      <ul className="space-y-1 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        size="sm"
                        variant={isCurrentPlan ? "outline" : "default"}
                        style={!isCurrentPlan ? { backgroundColor: '#2563EB' } : {}}
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading || isCurrentPlan}
                      >
                        {isLoading ? (
                          "Processing..."
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : plan.price_usd === 0 ? (
                          "Start Trial"
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}