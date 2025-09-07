import React from 'react';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  Calendar, 
  Car, 
  FileText,
  DollarSign,
  LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export function AdminSidebar({ currentView, onNavigate, onLogout }: AdminSidebarProps) {
  const navItems = [
    { key: 'admin-dashboard', label: 'Dashboard', icon: TrendingUp },
    { key: 'admin-slots', label: 'Manage Slots', icon: Car },
    { key: 'admin-bookings', label: 'Bookings', icon: Calendar },
    { key: 'admin-fines', label: 'Fine Management', icon: DollarSign },
    { key: 'admin-reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <h2 className="text-xl mb-6" style={{ color: '#2563EB' }}>
          ParkEasy Admin
        </h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <Button
                key={item.key}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start"
                style={isActive ? { backgroundColor: '#2563EB' } : undefined}
                onClick={() => onNavigate(item.key)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        {onLogout && (
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
        )}
      </div>
    </div>
  );
}