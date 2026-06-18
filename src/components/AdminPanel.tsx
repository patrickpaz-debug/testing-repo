/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Court, CourtProperties, CourtStatus } from '../entities/Court';
import { Booking } from '../entities/Booking';
import { CourtUseCase } from '../usecases/CourtUseCase';
import { BookingUseCase, BookingAnalytics } from '../usecases/BookingUseCase';
import { PlusCircle, Search, HelpCircle, Trash2, AlertTriangle, RefreshCw, Layers, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface AdminPanelProps {
  courtUseCase: CourtUseCase;
  bookingUseCase: BookingUseCase;
  onRefreshData: () => void;
}

export default function AdminPanel({ courtUseCase, bookingUseCase, onRefreshData }: AdminPanelProps) {
  // Lists
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);

  // Filters
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [selectedCourtFilter, setSelectedCourtFilter] = useState('all');

  // New Court Form State
  const [isAddingCourt, setIsAddingCourt] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtDescription, setNewCourtDescription] = useState('');
  const [newCourtLocation, setNewCourtLocation] = useState('');
  const [newCourtRate, setNewCourtRate] = useState('20.00');
  const [newCourtCapacity, setNewCourtCapacity] = useState('4');
  const [newCourtImageUrl, setNewCourtImageUrl] = useState('');

  // Editing Court State
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // Notifications State
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allCourts = courtUseCase.listAllCourts();
      const allBookings = bookingUseCase.getAllBookings();
      const calculatedAnalytics = bookingUseCase.getAnalytics();

      setCourts(allCourts);
      setBookings(allBookings);
      setAnalytics(calculatedAnalytics);
    } catch (e: any) {
      setErrorToast(e.message || 'Fatal error Loading administrative dataset.');
    }
  };

  // Helper clear toasts
  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setErrorToast(null);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setSuccessToast(null);
    setTimeout(() => setErrorToast(null), 6500);
  };

  const handleCreateCourt = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedRate = parseFloat(newCourtRate);
      const parsedCapacity = parseInt(newCourtCapacity, 10);

      const generatedId = `court-${Date.now()}`;
      courtUseCase.addCourt({
        id: generatedId,
        name: newCourtName,
        description: newCourtDescription,
        location: newCourtLocation,
        hourlyRate: isNaN(parsedRate) ? 20.0 : parsedRate,
        status: 'available',
        maxCapacity: isNaN(parsedCapacity) ? 4 : parsedCapacity,
        imageUrl: newCourtImageUrl.trim() || undefined,
      });

      // Clear Form
      setNewCourtName('');
      setNewCourtDescription('');
      setNewCourtLocation('');
      setNewCourtRate('20.00');
      setNewCourtCapacity('4');
      setNewCourtImageUrl('');
      setIsAddingCourt(false);

      loadData();
      onRefreshData();
      triggerSuccess('Court created successfully with all business rules validated!');
    } catch (e: any) {
      triggerError(e.message || 'Validation error while creating court.');
    }
  };

  const handleToggleMaintenance = (courtId: string) => {
    try {
      const updated = courtUseCase.toggleMaintenance(courtId);
      loadData();
      onRefreshData();
      triggerSuccess(`Court state updated down to "${updated.status}"`);
    } catch (e: any) {
      triggerError(e.message || 'State modification failure.');
    }
  };

  const handleDeleteCourt = (courtId: string) => {
    if (!window.confirm('Are you strictly sure you want to delete this pickleball court instance? This is irreversible.')) {
      return;
    }
    try {
      courtUseCase.deleteCourt(courtId);
      loadData();
      onRefreshData();
      triggerSuccess('Court deleted permanently.');
    } catch (e: any) {
      triggerError(e.message || 'Deletion vetoed due to application integrity rules.');
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will immediately notify systems and release the court.')) {
      return;
    }
    try {
      bookingUseCase.cancelBooking(bookingId);
      loadData();
      onRefreshData();
      triggerSuccess('Player booking cancelled successfully.');
    } catch (e: any) {
      triggerError(e.message || 'Operation failed.');
    }
  };

  const handleSaveCourtEdits = (court: Court) => {
    try {
      const parsedRate = parseFloat(editRate);
      const parsedCapacity = parseInt(editCapacity, 10);

      courtUseCase.updateCourt({
        ...court.toJSON(),
        hourlyRate: isNaN(parsedRate) ? court.hourlyRate : parsedRate,
        maxCapacity: isNaN(parsedCapacity) ? court.maxCapacity : parsedCapacity,
      });

      setEditingCourtId(null);
      loadData();
      onRefreshData();
      triggerSuccess('Court financial and operational constraints updated!');
    } catch (e: any) {
      triggerError(e.message || 'Constraint validation failure.');
    }
  };

  const startEditingCourt = (court: Court) => {
    setEditingCourtId(court.id);
    setEditRate(court.hourlyRate.toString());
    setEditCapacity(court.maxCapacity.toString());
  };

  // Filter bookings based on UI input
  const filteredBookings = bookings.filter(b => {
    const playerMatch = b.playerName.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                        b.playerEmail.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                        b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase());
    const courtMatch = selectedCourtFilter === 'all' || b.courtId === selectedCourtFilter;
    return playerMatch && courtMatch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Alert Header/Banner */}
      {errorToast && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <h4 className="font-semibold text-rose-900">Operational Integrity Veto</h4>
            <p className="text-sm">{errorToast}</p>
          </div>
        </div>
      )}

      {successToast && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h4 className="font-semibold text-emerald-900">Command Executed Successfully</h4>
            <p className="text-sm">{successToast}</p>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Control Center</h2>
          <p className="text-sm text-zinc-500">Configure pickleball court rates, toggle maintenance periods, review operations, and audit user logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              triggerSuccess('All systems synced from durable storage.');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition"
            title="Reload Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAddingCourt(!isAddingCourt)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add New Court
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {analytics && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">${analytics.totalRevenue.toFixed(2)}</p>
            <p className="mt-1 text-xs text-zinc-400">Total in confirmed reservation accounts</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Reservations</span>
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{analytics.activeBookingsCount}</p>
            <p className="mt-1 text-xs text-zinc-400">Total upcoming sessions booked</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cancellation Rate</span>
              <XCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">
              {analytics.totalBookings > 0 
                ? `${Math.round((analytics.cancelledBookingsCount / analytics.totalBookings) * 100)}%` 
                : '0%'}
            </p>
            <p className="mt-1 text-xs text-secondary text-zinc-400">{analytics.cancelledBookingsCount} released reservation plans</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Arena Count</span>
              <Layers className="h-5 w-5 text-sky-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{courts.length}</p>
            <p className="mt-1 text-xs text-zinc-400">{courts.filter(c => c.status === 'available').length} Available for booking</p>
          </div>
        </div>
      )}

      {/* Add New Court Slide Down Form */}
      {isAddingCourt && (
        <form onSubmit={handleCreateCourt} className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 shadow-inner animate-fade-in">
          <h3 className="mb-4 text-base font-bold text-zinc-900">Add New Pickleball Court Instance</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Court Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Center Court A"
                value={newCourtName}
                onChange={e => setNewCourtName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Location / Zone *</label>
              <input
                type="text"
                required
                placeholder="e.g., Building C, Rooftop East"
                value={newCourtLocation}
                onChange={e => setNewCourtLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Hourly Rental Rate ($) *</label>
              <input
                type="number"
                step="0.50"
                required
                value={newCourtRate}
                onChange={e => setNewCourtRate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Max Player Capacity *</label>
              <select
                value={newCourtCapacity}
                onChange={e => setNewCourtCapacity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="2">2 Players (Singles Only)</option>
                <option value="4">4 Players (Singles / Doubles)</option>
                <option value="6">6 Players (Practice Facility)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600">Illustration Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/...."
                value={newCourtImageUrl}
                onChange={e => setNewCourtImageUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-zinc-600">Court Facility Description *</label>
              <textarea
                required
                rows={2}
                placeholder="Provide a comprehensive operational description of this specific rink/court..."
                value={newCourtDescription}
                onChange={e => setNewCourtDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddingCourt(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Confirm Creation
            </button>
          </div>
        </form>
      )}

      {/* Courts Management Grid Section */}
      <section className="mb-12">
        <h3 className="mb-4 text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-zinc-500" />
          Active Arenas & Maintenance Controls
        </h3>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courts.map(court => {
            const isEditing = editingCourtId === court.id;
            const courtUtilization = analytics?.courtStats.find(s => s.courtId === court.id);

            return (
              <div 
                key={court.id} 
                className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 ${
                  court.status === 'maintenance' ? 'border-amber-200 ring-2 ring-amber-500/5' : 'border-zinc-200'
                }`}
              >
                {/* Court Image Banner */}
                <div className="relative h-40 bg-zinc-100">
                  {court.imageUrl ? (
                    <img 
                      src={court.imageUrl} 
                      alt={court.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-400 text-xs">
                      No Image Provided
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${
                      court.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {court.status === 'available' ? 'Operational' : 'In Maintenance'}
                    </span>
                  </div>
                </div>

                {/* Court Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2">
                    <h4 className="text-base font-bold text-zinc-900">{court.name}</h4>
                    <span className="text-xs text-zinc-400">{court.location}</span>
                  </div>

                  <p className="mb-4 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {court.description}
                  </p>

                  {/* Pricing and Capacity Constraint Edit Form */}
                  <div className="mt-auto mb-4 border-t border-zinc-100 pt-4">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Rate/Hr ($)</label>
                          <input
                            type="number"
                            value={editRate}
                            onChange={e => setEditRate(e.target.value)}
                            className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Max Players</label>
                          <input
                            type="number"
                            value={editCapacity}
                            onChange={e => setEditCapacity(e.target.value)}
                            className="mt-1 w-full rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900"
                          />
                        </div>
                        <div className="col-span-2 mt-2 flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCourtId(null)}
                            className="rounded px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-200 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCourtEdits(court)}
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-zinc-700">
                        <div>
                          <span className="font-semibold text-zinc-900">${court.hourlyRate.toFixed(2)}</span>
                          <span className="text-zinc-400">/hr</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-400">Capacity: </span>
                          <span className="font-semibold text-zinc-900">{court.maxCapacity} players</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Utilization KPI Bar */}
                  {courtUtilization && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold mb-1">
                        <span>UTILITY RATE</span>
                        <span>{courtUtilization.utilizationRate}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            courtUtilization.utilizationRate > 60 
                              ? 'bg-indigo-500' 
                              : courtUtilization.utilizationRate > 25 
                              ? 'bg-emerald-500' 
                              : 'bg-zinc-300'
                          }`}
                          style={{ width: `${courtUtilization.utilizationRate}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Total Arena Revenue: <span className="font-bold text-zinc-600">${courtUtilization.revenue.toFixed(2)}</span>
                      </p>
                    </div>
                  )}

                  {/* Operational Control Actions */}
                  <div className="flex gap-2 border-t border-zinc-100 pt-4 mt-auto">
                    <button
                      onClick={() => handleToggleMaintenance(court.id)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-center border transition-all duration-150 ${
                        court.status === 'available'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {court.status === 'available' ? 'Set Out of Order' : 'Set Active'}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => startEditingCourt(court)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition"
                      >
                        Adjust Rates
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCourt(court.id)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                      title="Decommission Court"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Global Booking Ledger Audit Log */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Global Booking Ledger</h3>
            <p className="text-sm text-zinc-400">Verify and monitor player schedules, verify billing status, and release courts.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search name, email, or transaction ID..."
                value={bookingSearchQuery}
                onChange={e => setBookingSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-4 pl-9 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none sm:w-64"
              />
            </div>

            {/* Court Filter */}
            <select
              value={selectedCourtFilter}
              onChange={e => setSelectedCourtFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Courts</option>
              {courts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-100">
          <table className="w-full border-collapse text-left text-xs text-zinc-500">
            <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Player Details</th>
                <th className="px-6 py-4">Court Arena</th>
                <th className="px-6 py-4">Reservation Time</th>
                <th className="px-6 py-4">Transaction Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white font-medium">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => {
                  const courtObj = courts.find(c => c.id === b.courtId);
                  const isConfirmed = b.status === 'confirmed';

                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900">{b.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-900 font-bold">{b.playerName}</div>
                        <div className="text-[10px] text-zinc-400 leading-normal">{b.playerEmail}</div>
                        <div className="text-[10px] text-zinc-400">{b.playerPhone}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-700">
                        {courtObj ? courtObj.name : 'Unknown Court'}
                      </td>
                      <td className="px-6 py-4 text-zinc-700">
                        <div className="font-semibold text-zinc-900">{b.date}</div>
                        <div className="text-[11px] text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5 inline-block mt-0.5">
                          {b.startTime} - {b.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-900 font-bold">
                        ${b.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                          isConfirmed 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isConfirmed ? (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="rounded px-2.5 py-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 transition inline-flex items-center gap-1"
                          >
                            Veto Booking
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic font-normal">Released</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-400 font-normal">
                    No active or historical bookings found matching current query params.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
