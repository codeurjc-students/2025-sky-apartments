import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface BookingWithApartment {
  id: number;
  startDate: string;
  endDate: string;
  apartment: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

export interface EditBookingData {
  booking: BookingWithApartment;
  apartment: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

@Component({
  selector: 'app-edit-booking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-booking.component.html',
  styleUrls: ['./edit-booking.component.css']
})
export class EditBooking implements OnInit {
  startDate: Date | null = null;
  endDate: Date | null = null;
  minDate: Date = new Date();
  originalStartDate: Date;
  originalEndDate: Date;
  loading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EditBooking>,
    @Inject(MAT_DIALOG_DATA) public data: EditBookingData
  ) {
    this.originalStartDate = new Date(data.booking.startDate);
    this.originalEndDate = new Date(data.booking.endDate);
  }

  ngOnInit(): void {
    this.startDate = new Date(this.data.booking.startDate);
    this.endDate = new Date(this.data.booking.endDate);

    const today = new Date();
    this.minDate = this.originalStartDate < today ? this.originalStartDate : today;
  }

  onStartDateChange(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.endDate = null;
    }
  }

  getEndMinDate(): Date {
    return this.startDate || this.minDate;
  }

  hasChanges(): boolean {
    if (!this.startDate || !this.endDate) {
      return false;
    }

    const startChanged = this.startDate.getTime() !== this.originalStartDate.getTime();
    const endChanged = this.endDate.getTime() !== this.originalEndDate.getTime();

    return startChanged || endChanged;
  }

  isFormValid(): boolean {
    return !!(this.startDate && this.endDate && this.startDate <= this.endDate);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isFormValid() && this.hasChanges()) {
      this.dialogRef.close({
        startDate: this.startDate,
        endDate: this.endDate
      });
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}