/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booking, BookingProperties } from '../entities/Booking';
import { ICourtRepository, IBookingRepository } from '../adapters/RepositoryInterfaces';

export interface BookingCreationParameters {
  courtId: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  notes?: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  activeBookingsCount: number;
  cancelledBookingsCount: number;
  courtStats: Array<{
    courtId: string;
    courtName: string;
    bookingCount: number;
    revenue: number;
    utilizationRate: number; // Percentage
  }>;
}

export class BookingUseCase {
  constructor(
    private readonly courtRepo: ICourtRepository,
    private readonly bookingRepo: IBookingRepository
  ) {}

  public getAllBookings(): Booking[] {
    return this.bookingRepo.getAll();
  }

  public getPlayerBookings(email: string): Booking[] {
    const cleanedEmail = email.trim().toLowerCase();
    return this.bookingRepo.getAll().filter(
      booking => booking.playerEmail === cleanedEmail
    );
  }

  public createBooking(params: BookingCreationParameters): Booking {
    const court = this.courtRepo.getById(params.courtId);
    if (!court) {
      throw new Error('The selected court no longer exists.');
    }

    if (!court.isAvailable()) {
      throw new Error(`The court "${court.name}" is currently under maintenance.`);
    }

    // Check overlaps
    const overlapsExist = this.checkOverlap(params.courtId, params.date, params.startTime, params.endTime);
    if (overlapsExist) {
      throw new Error(`The timeslot ${params.startTime} - ${params.endTime} overlaps with an existing reservation.`);
    }

    // Calculate total price
    const startMins = Booking.timeToMinutes(params.startTime);
    const endMins = Booking.timeToMinutes(params.endTime);
    const durationHours = (endMins - startMins) / 60;
    const totalPrice = court.calculatePrice(durationHours);

    // Create unique ID
    const generatedId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const booking = Booking.create({
      id: generatedId,
      courtId: params.courtId,
      playerName: params.playerName,
      playerEmail: params.playerEmail,
      playerPhone: params.playerPhone,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      totalPrice,
      status: 'confirmed',
      notes: params.notes,
    });

    this.bookingRepo.save(booking);
    return booking;
  }

  public cancelBooking(id: string): Booking {
    const booking = this.bookingRepo.getById(id);
    if (!booking) {
      throw new Error(`Booking with ID "${id}" was not found.`);
    }

    if (booking.status === 'cancelled') {
      throw new Error('This booking has already been cancelled.');
    }

    // Check if appointment is in the past
    const today = new Date().toISOString().split('T')[0];
    if (booking.date < today) {
      throw new Error('Cannot cancel a booking that has already past.');
    }

    const updated = booking.cancel();
    this.bookingRepo.save(updated);
    return updated;
  }

  public checkOverlap(
    courtId: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeBookingId?: string
  ): boolean {
    const startMins = Booking.timeToMinutes(startTime);
    const endMins = Booking.timeToMinutes(endTime);

    const sameDayBookings = this.bookingRepo.getByCourtAndDate(courtId, date);
    
    return sameDayBookings.some(booking => {
      if (booking.status === 'cancelled') return false;
      if (excludeBookingId && booking.id === excludeBookingId) return false;

      const bkStart = Booking.timeToMinutes(booking.startTime);
      const bkEnd = Booking.timeToMinutes(booking.endTime);

      // Overlap formula: start1 < end2 AND start2 < end1
      return startMins < bkEnd && bkStart < endMins;
    });
  }

  public getAnalytics(): BookingAnalytics {
    const bookings = this.bookingRepo.getAll();
    const courts = this.courtRepo.getAll();

    const activeBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const courtStats = courts.map(court => {
      const courtBookings = bookings.filter(b => b.courtId === court.id);
      const courtActive = courtBookings.filter(b => b.status === 'confirmed');
      const revenue = courtActive.reduce((sum, b) => sum + b.totalPrice, 0);

      // Simple relative utilization calculation assuming an 8-hour operating day (480 minutes)
      // for the last 7 potential days. Let's make it a general index
      const operationalBookingsLimit = 7 * 8; // 8 hours slots a day for 7 days = 56 hour blocks
      const actualHoursReserved = courtActive.reduce((sum, b) => sum + b.getDurationHours(), 0);
      const utilizationRate = Math.min(
        100,
        Math.round((actualHoursReserved / Math.max(1, operationalBookingsLimit)) * 100)
      );

      return {
        courtId: court.id,
        courtName: court.name,
        bookingCount: courtActive.length,
        revenue,
        utilizationRate,
      };
    });

    return {
      totalBookings: bookings.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      activeBookingsCount: activeBookings.length,
      cancelledBookingsCount: cancelledBookings.length,
      courtStats,
    };
  }
}
