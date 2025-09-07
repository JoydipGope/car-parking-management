import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { User } from '../App';
import { ArrowLeft, User as UserIcon, Car, Calendar, CreditCard, Lock, Edit, Save } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function ProfilePage({ user, onNavigate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    vehicleNumber: user.vehicleNumber,
    phone: '+1 (555) 123-4567',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    // In a real app, this would update the user profile
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('user-dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="ml-3 text-lg">Profile & Settings</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
          <div className="p-6">
            <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>ParkEasy</h2>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('user-dashboard')}
              >
                <Car className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onNavigate('book-slot')}
              >
                <Calendar className="mr-3 h-4 w-4" />
                Book Slot
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                style={{ backgroundColor: '#2563EB' }}
              >
                <UserIcon className="mr-3 h-4 w-4" />
                Profile
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl mb-2">Profile & Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user.name}</h3>
                    <p className="text-gray-600">{user.role === 'admin' ? 'Administrator' : 'Car Owner'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input
                      value={profileData.vehicleNumber}
                      onChange={(e) => setProfileData({ ...profileData, vehicleNumber: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <Button className="w-full" style={{ backgroundColor: '#2563EB' }}>
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Subscription Plan
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('subscription')}
                    >
                      Manage
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Trial Plan</p>
                        <p className="text-sm text-gray-600">Active until Dec 23, 2024</p>
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Active
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center mr-3">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 1234</p>
                          <p className="text-sm text-gray-600">Expires 12/26</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>

                    <div className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center mr-3">
                          PAY
                        </div>
                        <div>
                          <p className="font-medium">Mobile Banking</p>
                          <p className="text-sm text-gray-600">•••• •••• 5678</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>

                    <Button variant="outline" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-medium">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Vehicle Number</Label>
                <p className="font-medium">{user.vehicleNumber}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Phone</Label>
                <p className="font-medium">+1 (555) 123-4567</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-6">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => onNavigate('subscription')}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Subscription Plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-3" />
                Payment Methods
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button variant="ghost" className="w-full justify-start text-red-600">
                <ArrowLeft className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}