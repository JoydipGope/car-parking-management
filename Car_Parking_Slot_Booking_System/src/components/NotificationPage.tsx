import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User } from '../App';
import { useNotifications } from './NotificationProvider';
import { 
  ArrowLeft, 
  Bell, 
  BellRing,
  CheckCheck,
  Car,
  Calendar,
  User as UserIcon,
  CreditCard,
  LogOut,
  Clock
} from 'lucide-react';

interface NotificationPageProps {
  user: User;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function NotificationPage({ user, onNavigate, onLogout }: NotificationPageProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="ml-3 text-lg">Notifications</h1>
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
              {user.role === 'admin' ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onNavigate('admin-dashboard')}
                  >
                    <Car className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <Bell className="mr-3 h-4 w-4" />
                    Notifications
                  </Button>
                </>
              ) : (
                <>
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
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onNavigate('booking-history')}
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    History
                  </Button>
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    <Bell className="mr-3 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onNavigate('profile')}
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => onNavigate('subscription')}
                  >
                    <CreditCard className="mr-3 h-4 w-4" />
                    Subscription
                  </Button>
                </>
              )}
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl mb-2">Notifications</h1>
              <p className="text-gray-600">Stay updated with your parking activities</p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  Total Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl">{notifications.length}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl" style={{ color: unreadCount > 0 ? '#EF4444' : '#22C55E' }}>
                  {unreadCount}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCheck className="h-4 w-4" />
                  Read
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl" style={{ color: '#22C55E' }}>
                  {notifications.length - unreadCount}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    You'll receive notifications about slot availability, bookings, and updates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        notification.is_read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-full ${
                              notification.is_read ? 'bg-gray-200' : 'bg-blue-200'
                            }`}>
                              <Bell className={`h-4 w-4 ${
                                notification.is_read ? 'text-gray-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className={`${!notification.is_read ? 'font-medium' : ''}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-500">
                                  {formatTime(notification.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Badge 
                              className="bg-blue-100 text-blue-800 text-xs"
                            >
                              New
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            {notification.is_read ? (
                              <CheckCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-xs">Mark Read</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-3 rounded-lg text-center shadow-sm">
            <BellRing className="h-5 w-5 mx-auto mb-1 text-gray-600" />
            <p className="text-lg">{notifications.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-white p-3 rounded-lg text-center shadow-sm">
            <Bell className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-lg" style={{ color: unreadCount > 0 ? '#EF4444' : '#22C55E' }}>
              {unreadCount}
            </p>
            <p className="text-xs text-gray-600">Unread</p>
          </div>
          <div className="bg-white p-3 rounded-lg text-center shadow-sm">
            <CheckCheck className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg" style={{ color: '#22C55E' }}>
              {notifications.length - unreadCount}
            </p>
            <p className="text-xs text-gray-600">Read</p>
          </div>
        </div>

        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          </div>
        )}

        {/* Notifications */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No notifications</p>
                <p className="text-sm text-gray-500">
                  You'll see updates about slots and bookings here.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer ${!notification.is_read ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      notification.is_read ? 'bg-gray-200' : 'bg-blue-200'
                    }`}>
                      <Bell className={`h-4 w-4 ${
                        notification.is_read ? 'text-gray-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''} mb-1`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs ml-2">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}