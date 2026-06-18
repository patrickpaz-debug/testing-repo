/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalendarRange, ShieldAlert, Activity, User } from 'lucide-react';

interface NavbarProps {
  currentRole: 'player' | 'admin';
  onChangeRole: (role: 'player' | 'admin') => void;
  onNavigateToMyBookings?: () => void;
}

export default function Navbar({ currentRole, onChangeRole, onNavigateToMyBookings }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Pickleball <span className="text-emerald-600">Booking</span>
            </h1>
            <p className="hidden text-[10px] font-medium text-zinc-400 sm:block">
              Court Reservation & Maintenance Hub
            </p>
          </div>
        </div>

        {/* Navigation & Action Controls */}
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => onChangeRole('player')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              currentRole === 'player'
                ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/10'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <User className="h-4 w-4" />
            Player Portal
          </button>

          <button
            onClick={() => onChangeRole('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              currentRole === 'admin'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Admin Dashboard
          </button>

        </div>

      </div>
    </header>
  );
}
