/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BookingStatus = 'confirmed' | 'cancelled';

export interface BookingProperties {
  id: string;
  courtId: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (e.g. "08:00")
  endTime: string; // HH:MM (e.g. "09:30")
  totalPrice: number;
  status: BookingStatus;
  notes?: string;
}

export class Booking {
  private constructor(private readonly props: BookingProperties) {}

  public static create(props: BookingProperties): Booking {
    // Sanitization & Validation
    if (!props.id || props.id.trim() === '') {
      throw new Error('Booking ID is required.');
    }
    if (!props.courtId || props.courtId.trim() === '') {
      throw new Error('Selected Court ID is required.');
    }
    if (!props.playerName || props.playerName.trim() === '') {
      throw new Error('Player Name is required.');
    }
    if (!this.isValidEmail(props.playerEmail)) {
      throw new Error('A valid email address is required.');
    }
    if (!this.isValidPhone(props.playerPhone)) {
      throw new Error('A valid phone number is required (e.g., 10-15 digits).');
    }
    if (!this.isValidDateFormat(props.date)) {
      throw new Error('Invalid date. Must be in YYYY-MM-DD format.');
    }
    if (!this.isValidTimeFormat(props.startTime) || !this.isValidTimeFormat(props.endTime)) {
      throw new Error('Invalid time. Must be in HH:MM Format (24h).');
    }

    const startMinutes = this.timeToMinutes(props.startTime);
    const endMinutes = this.timeToMinutes(props.endTime);

    if (startMinutes >= endMinutes) {
      throw new Error('Start time must be strictly before end time.');
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 60) {
      throw new Error('Pickleball sessions must be at least 1 hour.');
    }
    if (durationMinutes > 240) {
      throw new Error('Pickleball sessions cannot exceed 4 hours.');
    }

    return new Booking({
      ...props,
      playerName: this.escapeHtml(props.playerName.trim()),
      playerEmail: props.playerEmail.trim().toLowerCase(),
      playerPhone: props.playerPhone.trim(),
      notes: props.notes ? this.escapeHtml(props.notes.trim()) : '',
    });
  }

  // Getters
  public get id(): string { return this.props.id; }
  public get courtId(): string { return this.props.courtId; }
  public get playerName(): string { return this.props.playerName; }
  public get playerEmail(): string { return this.props.playerEmail; }
  public get playerPhone(): string { return this.props.playerPhone; }
  public get date(): string { return this.props.date; }
  public get startTime(): string { return this.props.startTime; }
  public get endTime(): string { return this.props.endTime; }
  public get totalPrice(): number { return this.props.totalPrice; }
  public get status(): BookingStatus { return this.props.status; }
  public get notes(): string | undefined { return this.props.notes; }

  // Enterprise logic
  public cancel(): Booking {
    return new Booking({
      ...this.props,
      status: 'cancelled',
    });
  }

  public getDurationHours(): number {
    const startMinutes = Booking.timeToMinutes(this.props.startTime);
    const endMinutes = Booking.timeToMinutes(this.props.endTime);
    return (endMinutes - startMinutes) / 60;
  }

  // Helper validation & sanitization functions (Defensive Design)
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    return phoneRegex.test(phone);
  }

  private static isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    return timeRegex.test(time);
  }

  public static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static escapeHtml(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  public toJSON(): BookingProperties {
    return { ...this.props };
  }
}
