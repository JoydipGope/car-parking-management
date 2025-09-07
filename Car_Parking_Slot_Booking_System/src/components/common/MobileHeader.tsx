import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onBack: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
}

export function MobileHeader({ title, onBack, showLogout, onLogout }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="ml-3 text-lg">{title}</h1>
      </div>
      {showLogout && onLogout && (
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}