/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Court, CourtProperties } from '../entities/Court';
import { Booking, BookingProperties } from '../entities/Booking';
import { ICourtRepository, IBookingRepository } from './RepositoryInterfaces';

const COURTS_STORAGE_KEY = 'pickleball_courts_data';
const BOOKINGS_STORAGE_KEY = 'pickleball_bookings_data';

const INITIAL_COURTS: CourtProperties[] = [
  {
    id: 'court-1',
    name: 'Grand Center Court (Indoor)',
    description: 'Premier indoor climate-controlled court featuring professional cushioned acrylic surfacing, superb shadowless LED lighting, and premium steel net fixtures.',
    location: 'Building A - Main Complex',
    hourlyRate: 25.0,
    status: 'available',
    maxCapacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'court-2',
    name: 'Bayside Court (Outdoor Wind-screened)',
    description: 'Scenic outdoor court featuring high-density professional windscreens, balanced acoustic rebound, solar-responsive line markings, and open ocean breezes.',
    location: 'North Recreation Ridge',
    hourlyRate: 18.0,
    status: 'available',
    maxCapacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'court-3',
    name: 'Skyline Rooftop Arena',
    description: 'Elite rooftop pickleball court featuring breathtaking city panoramic skylines, reinforced perimeter fencing, night-game professional spotlights, and an adjacent spectator lounge.',
    location: 'Leisure Rooftop Level 5',
    hourlyRate: 35.0,
    status: 'available',
    maxCapacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=800'
  }
];

const INITIAL_BOOKINGS: BookingProperties[] = [
  {
    id: 'BK-seed-1',
    courtId: 'court-1',
    playerName: 'John Doe',
    playerEmail: 'john@example.com',
    playerPhone: '555-0199',
    date: new Date().toISOString().split('T')[0], // Today
    startTime: '09:00',
    endTime: '11:30',
    totalPrice: 62.5,
    status: 'confirmed',
    notes: 'Exciting training session with coach.'
  },
  {
    id: 'BK-seed-2',
    courtId: 'court-2',
    playerName: 'Jane Smith',
    playerEmail: 'jane@example.com',
    playerPhone: '555-4044',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '14:00',
    endTime: '15:00',
    totalPrice: 18.0,
    status: 'confirmed',
    notes: 'Friendly double matchup.'
  }
];

export class LocalStorageCourtRepository implements ICourtRepository {
  constructor() {
    this.ensureSeed();
  }

  private ensureSeed(): void {
    if (!localStorage.getItem(COURTS_STORAGE_KEY)) {
      localStorage.setItem(COURTS_STORAGE_KEY, JSON.stringify(INITIAL_COURTS));
    }
  }

  public getAll(): Court[] {
    try {
      const raw = localStorage.getItem(COURTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: CourtProperties[] = JSON.parse(raw);
      return parsed.map(p => Court.create(p));
    } catch (e) {
      console.error('Failed to parse Courts from LocalStorage:', e);
      return [];
    }
  }

  public getById(id: string): Court | null {
    const list = this.getAll();
    return list.find(c => c.id === id) || null;
  }

  public save(court: Court): void {
    const list = this.getAll();
    const index = list.findIndex(c => c.id === court.id);
    if (index !== -1) {
      list[index] = court;
    } else {
      list.push(court);
    }
    localStorage.setItem(COURTS_STORAGE_KEY, JSON.stringify(list.map(c => c.toJSON())));
  }

  public delete(id: string): void {
    const list = this.getAll();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem(COURTS_STORAGE_KEY, JSON.stringify(filtered.map(c => c.toJSON())));
  }
}

export class LocalStorageBookingRepository implements IBookingRepository {
  constructor() {
    this.ensureSeed();
  }

  private ensureSeed(): void {
    if (!localStorage.getItem(BOOKINGS_STORAGE_KEY)) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
    }
  }

  public getAll(): Booking[] {
    try {
      const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: BookingProperties[] = JSON.parse(raw);
      return parsed.map(p => Booking.create(p));
    } catch (e) {
      console.error('Failed to parse Bookings from LocalStorage:', e);
      return [];
    }
  }

  public getById(id: string): Booking | null {
    const list = this.getAll();
    return list.find(b => b.id === id) || null;
  }

  public getByCourtAndDate(courtId: string, date: string): Booking[] {
    const list = this.getAll();
    return list.filter(booking => booking.courtId === courtId && booking.date === date);
  }

  public save(booking: Booking): void {
    const list = this.getAll();
    const index = list.findIndex(b => b.id === booking.id);
    if (index !== -1) {
      list[index] = booking;
    } else {
      list.push(booking);
    }
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(list.map(b => b.toJSON())));
  }
}
