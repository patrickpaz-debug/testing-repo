/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Court } from '../entities/Court';
import { Booking } from '../entities/Booking';

export interface ICourtRepository {
  getAll(): Court[];
  getById(id: string): Court | null;
  save(court: Court): void;
  delete(id: string): void;
}

export interface IBookingRepository {
  getAll(): Booking[];
  getById(id: string): Booking | null;
  getByCourtAndDate(courtId: string, date: string): Booking[];
  save(booking: Booking): void;
}
