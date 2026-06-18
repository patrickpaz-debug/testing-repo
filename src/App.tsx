/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import Navbar from './components/Navbar';
import PlayerPortal from './components/PlayerPortal';
import AdminPanel from './components/AdminPanel';
import { LocalStorageCourtRepository, LocalStorageBookingRepository } from './adapters/StorageGateway';
import { CourtUseCase } from './usecases/CourtUseCase';
import { BookingUseCase } from './usecases/BookingUseCase';
import { ShieldCheck, BookOpen, Server, Layers } from 'lucide-react';

export default function App() {
  // Clean Architecture singletons
  const courtRepoRef = useRef(new LocalStorageCourtRepository());
  const bookingRepoRef = useRef(new LocalStorageBookingRepository());
  
  const courtUseCaseRef = useRef(new CourtUseCase(courtRepoRef.current, bookingRepoRef.current));
  const bookingUseCaseRef = useRef(new BookingUseCase(courtRepoRef.current, bookingRepoRef.current));

  const [role, setRole] = useState<'player' | 'admin'>('player');
  // State trigger to notify components that sister dataset has changed
  const [dataToggleTrigger, setDataToggleTrigger] = useState(false);

  const handleRefreshData = () => {
    setDataToggleTrigger(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Prime Header Navigation */}
      <Navbar currentRole={role} onChangeRole={setRole} />

      {/* Main Container Area */}
      <main className="flex-grow">
        {role === 'player' ? (
          <PlayerPortal
            courtUseCase={courtUseCaseRef.current}
            bookingUseCase={bookingUseCaseRef.current}
            dataToggleTrigger={dataToggleTrigger}
            onRefreshData={handleRefreshData}
          />
        ) : (
          <AdminPanel
            courtUseCase={courtUseCaseRef.current}
            bookingUseCase={bookingUseCaseRef.current}
            onRefreshData={handleRefreshData}
          />
        )}
      </main>

      {/* Architecture Architecture & Security Manifest Card */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-t border-zinc-200">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold tracking-tight text-zinc-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            Compliance Manifesto (Clean Architecture &amp; Security Mandates)
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-xs leading-relaxed text-zinc-500">
            <div>
              <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                Entities (Inner Core)
              </h5>
              <p>
                Our core models (<code className="font-mono bg-zinc-100 px-1 rounded">Court</code> &amp; <code className="font-mono bg-zinc-100 px-1 rounded">Booking</code>) encapsulate enterprise regulations completely independent of React rendering engines, network states, trackers, or libraries.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                Use Cases (Application Rules)
              </h5>
              <p>
                Business validations like time-reservation conflicts, rental limits (min 1hr / max 4hr), and court availability checks are isolated entirely from layouts inside our decoupled UseCase classes.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <Server className="h-3.5 w-3.5 text-zinc-400" />
                Interface Adapters
              </h5>
              <p>
                The storage interfaces act as decoupled gates mapping domain object signatures to raw serialized variables handled safely inside the browser's persistent key-value mechanics.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                Security Countermeasures
              </h5>
              <p>
                All data entries undergo active escape sanitization preventing DOM scripting threats. Domain entities prevent transaction corruption from overlapping double-bookings, preserving state integrity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Humble Footer */}
      <footer className="bg-zinc-100 border-t border-zinc-200 py-6 text-center text-xs text-zinc-400">
        <p>© 2026 Pickleball Booking Hub. Crafted with pride for Business Owners and Players.</p>
      </footer>

    </div>
  );
}
