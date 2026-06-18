/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Court, CourtProperties } from '../entities/Court';
import { ICourtRepository, IBookingRepository } from '../adapters/RepositoryInterfaces';

export class CourtUseCase {
  constructor(
    private readonly courtRepo: ICourtRepository,
    private readonly bookingRepo: IBookingRepository
  ) {}

  public listAllCourts(): Court[] {
    return this.courtRepo.getAll();
  }

  public getCourtById(id: string): Court | null {
    return this.courtRepo.getById(id);
  }

  public addCourt(properties: CourtProperties): Court {
    // Entities validate the base logic
    const court = Court.create(properties);
    this.courtRepo.save(court);
    return court;
  }

  public updateCourt(properties: CourtProperties): Court {
    const existing = this.courtRepo.getById(properties.id);
    if (!existing) {
      throw new Error(`Court with ID "${properties.id}" search yielded no results.`);
    }
    const court = Court.create(properties);
    this.courtRepo.save(court);
    return court;
  }

  public toggleMaintenance(id: string): Court {
    const court = this.courtRepo.getById(id);
    if (!court) {
      throw new Error(`Court with ID "${id}" was not found.`);
    }

    let updated: Court;
    if (court.status === 'available') {
      updated = court.putUnderMaintenance();
    } else {
      updated = court.makeAvailable();
    }

    this.courtRepo.save(updated);
    return updated;
  }

  public deleteCourt(id: string): void {
    const court = this.courtRepo.getById(id);
    if (!court) {
      throw new Error(`Court with ID "${id}" was not found.`);
    }

    // Enterprise rule: Check if this court has active/confirmed bookings on or after today
    const bookings = this.bookingRepo.getAll();
    const today = new Date().toISOString().split('T')[0];
    const hasUpcomingActiveBookings = bookings.some(b => 
      b.courtId === id && 
      b.status === 'confirmed' && 
      b.date >= today
    );

    if (hasUpcomingActiveBookings) {
      throw new Error('Cannot delete this court because it has active, confirmed upcoming bookings. Please cancel or update those bookings first.');
    }

    this.courtRepo.delete(id);
  }
}
