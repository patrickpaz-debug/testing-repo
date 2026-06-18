/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Court } from '../entities/Court';
import { Booking } from '../entities/Booking';
import { CourtUseCase } from '../usecases/CourtUseCase';
import { BookingUseCase } from '../usecases/BookingUseCase';
import { Calendar, Clock, DollarSign, Users, AlertCircle, CheckCircle2, History, CreditCard, Search, MapPin, PowerOff } from 'lucide-react';

interface PlayerPortalProps {
  courtUseCase: CourtUseCase;
  bookingUseCase: BookingUseCase;
  dataToggleTrigger: boolean;
  onRefreshData: () => void;
}

export default function PlayerPortal({ courtUseCase, bookingUseCase, dataToggleTrigger, onRefreshData }: PlayerPortalProps) {
  // Master lists
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings'>('book');

  // Booking Flow State
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Custom Time Slot Selection Helper
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Player Details Form State
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Conflict Pre-validation & Alerts
  const [hasConflict, setHasConflict] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Success Receipt State
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // My bookings management
  const [queryEmail, setQueryEmail] = useState('');
  const [retrievedBookings, setRetrievedBookings] = useState<Booking[]>([]);
  const [hasSearchedMyBookings, setHasSearchedMyBookings] = useState(false);

  // Global Toast Alert
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    loadCourts();
  }, [dataToggleTrigger]);

  // Compute calculated subtotal price whenever timeslot or court changes
  useEffect(() => {
    calculateSlotIssuesAndPrice();
  }, [selectedCourt, selectedDate, startTime, endTime, dataToggleTrigger]);

  const loadCourts = () => {
    try {
      // Load available courts for players
      const allCourts = courtUseCase.listAllCourts();
      setCourts(allCourts);

      // Default select first court if available
      if (allCourts.length > 0 && !selectedCourt) {
        const available = allCourts.find(c => c.status === 'available') || allCourts[0];
        setSelectedCourt(available);
      }
    } catch (e: any) {
      setUiError('Failed to load court datasets.');
    }
  };

  const calculateSlotIssuesAndPrice = () => {
    if (!selectedCourt) return;
    try {
      // 1. Double booking conflicts checking
      const conflict = bookingUseCase.checkOverlap(
        selectedCourt.id,
        selectedDate,
        startTime,
        endTime
      );
      setHasConflict(conflict);

      // 2. Pricing calculations
      const startMins = Booking.timeToMinutes(startTime);
      const endMins = Booking.timeToMinutes(endTime);
      
      if (endMins > startMins) {
        const durationHours = (endMins - startMins) / 60;
        setEstimatedPrice(selectedCourt.calculatePrice(durationHours));
      } else {
        setEstimatedPrice(0);
      }
    } catch (e) {
      setHasConflict(false);
      setEstimatedPrice(0);
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);

    if (!selectedCourt) {
      setUiError('Please select a pickleball court first.');
      return;
    }

    try {
      // Server-Style Validation in domain entity before saving
      const booking = bookingUseCase.createBooking({
        courtId: selectedCourt.id,
        playerName,
        playerEmail,
        playerPhone,
        date: selectedDate,
        startTime,
        endTime,
        notes,
      });

      // Show receipt modal
      setCompletedBooking(booking);
      setUiSuccess('Booking confirmed successfully!');
      
      // Cleanup Fields
      setPlayerName('');
      setPlayerPhone('');
      setNotes('');
      onRefreshData();
    } catch (e: any) {
      setUiError(e.message || 'Verification failed. Please review your input constraints.');
    }
  };

  const handleRetrieveMyBookings = (e: React.FormEvent) => {
    e.preventDefault();
    setUiError(null);
    setHasSearchedMyBookings(true);

    if (!queryEmail || queryEmail.trim() === '') {
      setUiError('Email address is raw and empty.');
      return;
    }

    try {
      const records = bookingUseCase.getPlayerBookings(queryEmail);
      setRetrievedBookings(records);
      if (records.length === 0) {
        setUiSuccess('No historical reservation matches found. Ensure your spelling is accurate.');
      } else {
        setUiSuccess(`Successfully retrieved ${records.length} records!`);
      }
    } catch (e: any) {
      setUiError(e.message || 'Search execution failed.');
    }
  };

  const handleCancelRetrievedBooking = (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to cancel this booking? This action is irreversible.')) {
      return;
    }
    try {
      bookingUseCase.cancelBooking(id);
      
      // Refresh list
      const records = bookingUseCase.getPlayerBookings(queryEmail);
      setRetrievedBookings(records);
      
      onRefreshData();
      setUiSuccess('Booking cancelled successfully.');
    } catch (e: any) {
      setUiError(e.message || 'Unable to cancel booking.');
    }
  };

  // Pre-generate convenient calendar dates (Next 7 operating days)
  const getNext7Days = () => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 7; i++) {
      const dString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      list.push({
        value: dString,
        dayName,
        dayNum,
        monthName,
        isToday: i === 0,
      });
      date.setDate(date.getDate() + 1);
    }
    return list;
  };

  const nextDaysList = getNext7Days();

  // Operating Hours options
  const hoursList = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00'
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Alert Banner */}
      {uiError && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <h4 className="font-semibold text-rose-900">Validation Error</h4>
            <p className="text-sm">{uiError}</p>
          </div>
        </div>
      )}

      {uiSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h4 className="font-semibold text-emerald-900">Success</h4>
            <p className="text-sm">{uiSuccess}</p>
          </div>
        </div>
      )}

      {/* Booking Mode Selection Tabs */}
      <div className="mb-8 flex border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab('book');
            setCompletedBooking(null);
            setUiError(null);
            setUiSuccess(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'book'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Book Online
        </button>

        <button
          onClick={() => {
            setActiveTab('my-bookings');
            setUiError(null);
            setUiSuccess(null);
          }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeTab === 'my-bookings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <History className="h-4 w-4" />
          Verify My Bookings
        </button>
      </div>

      {/* RENDER SUCCESS RECEIPT MODAL */}
      {completedBooking && (
        <div className="mb-10 overflow-hidden rounded-xl border-2 border-emerald-500 bg-white shadow-lg animate-fade-in">
          <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold">
              <CheckCircle2 className="h-5 w-5" />
              Reservation Confirmed & Saved
            </div>
            <button 
              onClick={() => setCompletedBooking(null)} 
              className="text-xs text-emerald-100 hover:text-white font-semibold underline"
            >
              Close Receipt
            </button>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">TRANSACTION REFERENCE</span>
                <span className="text-lg font-extrabold text-zinc-900 font-mono tracking-tight">{completedBooking.id}</span>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">COURT SELECTION</span>
                    <span className="text-sm font-bold text-zinc-800">
                      {courtUseCase.getCourtById(completedBooking.courtId)?.name || 'Standard Court'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">PLAY DATE</span>
                    <span className="text-sm font-bold text-zinc-800">{completedBooking.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">TIME TIMESLOT</span>
                    <span className="text-sm font-bold text-zinc-800">{completedBooking.startTime} - {completedBooking.endTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">DURATION</span>
                    <span className="text-sm font-bold text-zinc-800">{completedBooking.getDurationHours()} hour(s)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 p-5 border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block tracking-widest">PLAYER DETAILS</span>
                <p className="font-bold text-zinc-900 leading-normal">{completedBooking.playerName}</p>
                <p className="text-xs text-zinc-500">{completedBooking.playerEmail}</p>
                <p className="text-xs text-zinc-500">{completedBooking.playerPhone}</p>
                
                {completedBooking.notes && (
                  <p className="text-[11px] text-zinc-400 mt-2 bg-white border border-zinc-100 p-2 rounded block">
                    <span className="font-semibold block text-[10px] text-zinc-500">NOTES:</span>
                    {completedBooking.notes}
                  </p>
                )}

                <div className="mt-4 border-t border-zinc-200 pt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600 uppercase">Paid Amount (EST)</span>
                  <span className="text-xl font-bold text-emerald-600">${completedBooking.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-zinc-100 pt-4 flex flex-col justify-between sm:flex-row gap-3">
              <p className="text-[10px] text-zinc-400">
                ⚠️ Cancellation Policy: Bookings can be safely cancelled from your dashboard up to 24 hours prior to game commencement.
              </p>
              <button
                onClick={() => {
                  setQueryEmail(completedBooking.playerEmail);
                  setActiveTab('my-bookings');
                  setCompletedBooking(null);
                  // Fire quick lookups
                  setTimeout(() => {
                    setRetrievedBookings(bookingUseCase.getPlayerBookings(completedBooking.playerEmail));
                    setHasSearchedMyBookings(true);
                  }, 100);
                }}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded px-3 py-1.5 border border-emerald-200 self-start sm:self-center hover:bg-emerald-100 transition"
              >
                Go to My Reservations →
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MAIN RENTAL FORM TAB */}
      {activeTab === 'book' && (
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT: COURT SELECTOR & CALENDAR */}
          <div className="lg:col-span-7">
            <h3 className="mb-4 text-base font-bold text-zinc-900 uppercase tracking-tight">Step 1: Select Arena & Date</h3>
            
            {/* Visual Calendar Selector */}
            <div className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {nextDaysList.map(dayObj => (
                <button
                  key={dayObj.value}
                  type="button"
                  onClick={() => setSelectedDate(dayObj.value)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all duration-150 ${
                    selectedDate === dayObj.value
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase ${selectedDate === dayObj.value ? 'text-emerald-100' : 'text-zinc-400'}`}>
                    {dayObj.dayName}
                  </span>
                  <span className="text-xl font-black mt-1 leading-none">{dayObj.dayNum}</span>
                  <span className={`text-[9px] font-semibold uppercase mt-1 ${selectedDate === dayObj.value ? 'text-emerald-200' : 'text-zinc-500'}`}>
                    {dayObj.monthName}
                  </span>
                </button>
              ))}
            </div>

            {/* List of Courts with photos */}
            <div className="space-y-4">
              {courts.map(court => {
                const isSelected = selectedCourt?.id === court.id;
                const isAvailable = court.status === 'available';

                return (
                  <div
                    key={court.id}
                    onClick={() => {
                      if (isAvailable) setSelectedCourt(court);
                    }}
                    className={`group relative overflow-hidden rounded-xl border p-4 bg-white flex flex-col md:flex-row gap-5 transition-all duration-200 cursor-pointer ${
                      !isAvailable 
                        ? 'opacity-60 cursor-not-allowed border-zinc-200 bg-zinc-50'
                        : isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-600/5'
                        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Court visual representation */}
                    <div className="h-28 w-full md:w-36 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                      {court.imageUrl ? (
                        <img 
                          src={court.imageUrl} 
                          alt={court.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400 text-xs">No image</div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-zinc-800 text-sm group-hover:text-emerald-600 transition">
                            {court.name}
                          </h4>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {court.location}
                          </span>
                        </div>
                        <span className="text-xs bg-zinc-100 text-zinc-800 rounded px-2 py-0.5 font-bold uppercase tracking-wider tabular-nums">
                          ${court.hourlyRate.toFixed(2)}/hr
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
                        {court.description}
                      </p>

                      <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-zinc-400" />
                          Capacity: {court.maxCapacity} players
                        </span>
                        
                        {!isAvailable ? (
                          <span className="text-amber-600 font-bold bg-amber-50 rounded px-2 py-0.5 border border-amber-100 flex items-center gap-1">
                            <PowerOff className="h-3 w-3" /> Under Maintenance
                          </span>
                        ) : isSelected ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 rounded px-2 py-0.5 border border-emerald-100">
                            Selected Match Rink
                          </span>
                        ) : (
                          <span className="text-zinc-500 group-hover:text-emerald-600 transition">
                            Click to Select
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SCHEDULING FORM */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 uppercase tracking-wider">
                Step 2: Reserve Your Timeslot
              </h3>

              <form onSubmit={handleBookSubmit} className="mt-4 space-y-4">
                
                {/* Visual Chosen Court Overview */}
                {selectedCourt && (
                  <div className="rounded-lg bg-emerald-50/50 p-3.5 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Selected Court</span>
                      <h5 className="text-xs font-bold text-emerald-950">{selectedCourt.name}</h5>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200/50 rounded px-2 py-0.5">
                      ${selectedCourt.hourlyRate}/Hr
                    </span>
                  </div>
                )}

                {/* Timeslots Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Start Hour *</label>
                    <select
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-850 focus:border-emerald-500 focus:outline-none"
                    >
                      {hoursList.map(hr => (
                        <option key={hr} value={hr}>{hr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">End Hour *</label>
                    <select
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-850 focus:border-emerald-500 focus:outline-none"
                    >
                      {hoursList.map(hr => (
                        <option key={hr} value={hr}>{hr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Overlap & Slot Warnings */}
                {hasConflict && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 p-3 text-rose-800 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Overlapping Reservation Detected.</span>
                      <p className="text-[11px] text-rose-700 leading-normal">
                        This court is already reserved for the selected timeslot on {selectedDate}. Please select another hour slot.
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Information Fields (With strict sanitization) */}
                <div className="space-y-3 pt-3 border-t border-zinc-100">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patrick Paz"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. patrick@example.com"
                      value={playerEmail}
                      onChange={e => setPlayerEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 555-0144"
                      value={playerPhone}
                      onChange={e => setPlayerPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Special Game Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Specify if you require balls or paddle rentals..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Billing Receipt Overview */}
                <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-100 mt-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Est Rental Rate</span>
                    <span className="font-bold text-zinc-700">${selectedCourt?.hourlyRate.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-200 pb-2">
                    <span>Selected Date</span>
                    <span className="font-bold text-zinc-700">{selectedDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="text-xs font-bold text-zinc-600">Estimated Total</span>
                    <span className="text-lg font-extrabold text-emerald-600">${estimatedPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit action */}
                <button
                  type="submit"
                  disabled={hasConflict || estimatedPrice <= 0 || !selectedCourt}
                  className={`w-full rounded-lg py-3 text-center text-sm font-bold text-white shadow-sm transition-all duration-200 ${
                    hasConflict || estimatedPrice <= 0 || !selectedCourt
                      ? 'bg-zinc-300 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirm Reservation Schedule
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* MANAGE / HISTORY TAB */}
      {activeTab === 'my-bookings' && (
        <div className="max-w-2xl mx-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-zinc-900">Manage Your Reservations</h3>
            <p className="text-xs text-zinc-400">Provide your verified email address to search historical logs and cancel plans.</p>
          </div>

          <form onSubmit={handleRetrieveMyBookings} className="flex gap-2 items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4.5 w-4.5 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="Enter email e.g. john@example.com"
                value={queryEmail}
                onChange={e => setQueryEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-4 pl-10 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-zinc-900 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-zinc-850 transition"
            >
              Retrieve Bookings
            </button>
          </form>

          {/* List of Retrieved Bookings */}
          {hasSearchedMyBookings && (
            <div className="border-t border-zinc-150 pt-5 space-y-4">
              {retrievedBookings.length > 0 ? (
                retrievedBookings.map(b => {
                  const isConfirmed = b.status === 'confirmed';
                  const courtObj = courts.find(c => c.id === b.courtId);
                  
                  return (
                    <div 
                      key={b.id} 
                      className={`rounded-lg border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                        isConfirmed ? 'border-zinc-200 bg-white' : 'border-zinc-100 bg-zinc-50/50 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {b.id}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${
                            isConfirmed ? 'text-emerald-700' : 'text-zinc-400'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-zinc-800 text-sm mt-1.5">
                          {courtObj ? courtObj.name : 'Unknown Court'}
                        </h4>
                        
                        <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-4">
                          <span>Date: <span className="font-semibold text-zinc-700">{b.date}</span></span>
                          <span>Hour: <span className="font-semibold text-zinc-700">{b.startTime} - {b.endTime}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block whitespace-nowrap">PRICE ESTIMATE</span>
                          <span className="font-extrabold text-zinc-950">${b.totalPrice.toFixed(2)}</span>
                        </div>

                        {isConfirmed && (
                          <button
                            onClick={() => handleCancelRetrievedBooking(b.id)}
                            className="text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 transition"
                          >
                            Cancel Plan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-sm text-zinc-400 font-normal">
                  No registered active bookings found. Try with: <code className="font-mono bg-zinc-100 text-zinc-700 px-1 rounded text-xs">john@example.com</code> or <code className="font-mono bg-zinc-100 text-zinc-700 px-1 rounded text-xs">jane@example.com</code>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
