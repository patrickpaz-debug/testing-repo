/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CourtStatus = 'available' | 'maintenance';

export interface CourtProperties {
  id: string;
  name: string;
  description: string;
  location: string; // Indoor, Outdoor, Center Court
  hourlyRate: number;
  status: CourtStatus;
  maxCapacity: number;
  imageUrl?: string;
}

export class Court {
  private constructor(private readonly props: CourtProperties) {}

  public static create(props: CourtProperties): Court {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Court ID is required.');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('Court name is required.');
    }
    if (props.hourlyRate <= 0) {
      throw new Error('Hourly rate must be greater than zero.');
    }
    if (props.maxCapacity <= 0) {
      throw new Error('Max capacity must be at least 1 person.');
    }

    return new Court({
      ...props,
      name: props.name.trim(),
      description: props.description?.trim() || '',
      location: props.location?.trim() || 'General',
    });
  }

  // Getters
  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get description(): string { return this.props.description; }
  public get location(): string { return this.props.location; }
  public get hourlyRate(): number { return this.props.hourlyRate; }
  public get status(): CourtStatus { return this.props.status; }
  public get maxCapacity(): number { return this.props.maxCapacity; }
  public get imageUrl(): string | undefined { return this.props.imageUrl; }

  // Enterprise Domain methods
  public isAvailable(): boolean {
    return this.props.status === 'available';
  }

  public putUnderMaintenance(): Court {
    return new Court({
      ...this.props,
      status: 'maintenance',
    });
  }

  public makeAvailable(): Court {
    return new Court({
      ...this.props,
      status: 'available',
    });
  }

  public calculatePrice(durationHours: number): number {
    if (durationHours <= 0) return 0;
    return Number((this.props.hourlyRate * durationHours).toFixed(2));
  }

  public toJSON(): CourtProperties {
    return { ...this.props };
  }
}
