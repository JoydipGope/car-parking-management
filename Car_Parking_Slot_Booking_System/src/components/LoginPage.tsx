import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, LogIn, User, Shield, Building, Home } from 'lucide-react';
import { RegisterPage } from './RegisterPage';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister?: (
    name: string, 
    email: string, 
    password: string, 
    role: 'user' | 'admin' | 'manager' | 'owner',
    vehicleNumber?: string,
    phone?: string,
    address?: string
  ) => boolean;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!loginData.email.trim()) {
      setError('Email is required');
      setIsSubmitting(false);
      return;
    }

    if (!loginData.password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }

    try {
      onLogin(loginData.email.trim().toLowerCase(), loginData.password);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSuccess = (
    name: string, 
    email: string, 
    password: string, 
    role: 'user' | 'admin' | 'manager' | 'owner',
    vehicleNumber?: string,
    phone?: string,
    address?: string
  ) => {
    if (onRegister) {
      const success = onRegister(name, email, password, role, vehicleNumber, phone, address);
      if (success) {
        setIsRegistering(false);
        setLoginData({ email, password });
        return true;
      }
      return false;
    }
    return false;
  };

  // If in registration mode, show the RegisterPage
  if (isRegistering) {
    return (
      <RegisterPage
        onRegister={handleRegisterSuccess}
        onSwitchToLogin={() => setIsRegistering(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2" style={{ color: '#2563EB' }}>
            <LogIn className="w-6 h-6" />
            ParkEasy
          </CardTitle>
          <CardDescription>
            Smart Parking Slot Booking System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Demo Accounts (Click to Use):</p>
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setLoginData({ email: 'user@test.com', password: '1234' })}
                >
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-medium text-blue-600">User:</span>
                  <span className="ml-2">user@test.com / 1234</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setLoginData({ email: 'admin@test.com', password: '1234' })}
                >
                  <Shield className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-medium text-red-600">Admin:</span>
                  <span className="ml-2">admin@test.com / 1234</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setLoginData({ email: 'manager@test.com', password: '1234' })}
                >
                  <Building className="w-4 h-4 mr-2 text-green-600" />
                  <span className="font-medium text-green-600">Manager:</span>
                  <span className="ml-2">manager@test.com / 1234</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setLoginData({ email: 'owner@test.com', password: '1234' })}
                >
                  <Home className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="font-medium text-purple-600">Owner:</span>
                  <span className="ml-2">owner@test.com / 1234</span>
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create account
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}