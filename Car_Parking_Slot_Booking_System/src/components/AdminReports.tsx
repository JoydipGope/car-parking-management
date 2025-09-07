import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { ParkingSlot, Booking } from '../App';
import { calculateStats, getMonthlyData, getDailyUsage, handleExportReport } from './utils/reportHelpers';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  Calendar, 
  Car, 
  DollarSign,
  BarChart3,
  FileText,
  LogOut
} from 'lucide-react';

interface AdminReportsProps {
  bookings: Booking[];
  slots: ParkingSlot[];
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export function AdminReports({ bookings, slots, onNavigate, onLogout }: AdminReportsProps) {
  const stats = calculateStats(bookings, slots);
  const monthlyData = getMonthlyData();
  const dailyUsage = getDailyUsage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('admin-dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="ml-3 text-lg">Reports & Analytics</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
          <div className="p-6">
            <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>
              ParkEasy Admin
            </h2>
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => onNavigate('admin-dashboard')}>
                <TrendingUp className="mr-3 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => onNavigate('admin-slots')}>
                <Car className="mr-3 h-4 w-4" />
                Manage Slots
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => onNavigate('admin-bookings')}>
                <Calendar className="mr-3 h-4 w-4" />
                Bookings
              </Button>
              <Button variant="default" className="w-full justify-start" style={{ backgroundColor: '#2563EB' }}>
                <FileText className="mr-3 h-4 w-4" />
                Reports
              </Button>
            </nav>
            
            <div className="absolute bottom-6 left-6 right-6">
              <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Monitor performance and generate insights</p>
            </div>
            
            <div className="flex gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={() => handleExportReport('pdf')} style={{ backgroundColor: '#2563EB' }}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold">${stats.revenue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-semibold">{stats.totalBookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Occupancy Rate</p>
                    <p className="text-2xl font-semibold">{stats.occupancyRate.toFixed(1)}%</p>
                  </div>
                  <Car className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold">{stats.completedBookings}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 text-sm">{month.month}</div>
                        <div className="flex-1">
                          <Progress 
                            value={(month.bookings / 70) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{month.bookings} bookings</div>
                        <div className="text-gray-600">${month.revenue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Usage Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyUsage.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm">{hour.hour}</div>
                        <div className="flex-1">
                          <Progress 
                            value={hour.usage} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                      <div className="text-sm">{hour.usage}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportReport('csv')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleExportReport('pdf')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Download className="h-6 w-6 mb-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleExportReport('excel')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Export Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4 pb-20">
        {/* Mobile Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-xl font-semibold">${stats.revenue}</p>
              <p className="text-xs text-gray-600">Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xl font-semibold">{stats.totalBookings}</p>
              <p className="text-xs text-gray-600">Bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Charts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.slice(-3).map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-6 text-sm">{month.month}</div>
                    <Progress value={(month.bookings / 70) * 100} className="flex-1 h-2" />
                  </div>
                  <div className="text-sm ml-2">{month.bookings}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>
    </div>
  );
}