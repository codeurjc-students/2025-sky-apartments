import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';


import { ApartmentDTO } from '../../dtos/apartment.dto';
import { BookingDTO } from '../../dtos/booking.dto';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';


interface BookingsByApartment {
  apartment: ApartmentDTO;
  bookings: BookingDTO[];
}

@Component({
  selector: 'app-bookings-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],
  templateUrl: './bookings-tab.component.html',
  styleUrls: ['./bookings-tab.component.css']
})
export class BookingsTabComponent implements OnInit {
  bookingsByApartment: BookingsByApartment[] = [];
  filteredBookingsByApartment: BookingsByApartment[] = [];
  apartments: ApartmentDTO[] = [];
  loading = true;
  currentMonth = new Date();
  viewType: 'calendar' | 'list' = 'calendar';
  filterState = 'ALL';
  searchTerm = '';

  daysInMonth: number = 0;
  startingDayOfWeek: number = 0;
  year: number = 0;
  month: number = 0;
  monthName: string = '';
  daysArray: number[] = [];

  // Statistics
  totalBookings = 0;
  confirmedBookings = 0;
  completedBookings = 0;
  totalRevenue = 0;

  constructor(
    private bookingService: BookingService,
    private apartmentService: ApartmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    this.calculateMonthData();
  }

  loadData() {
    this.loading = true;
    
    this.apartmentService.getAllApartments(0, 100).subscribe({
      next: (apartments) => {
        this.apartments = apartments;
        
        if (apartments.length === 0) {
          this.loading = false;
          return;
        }

        const bookingRequests = apartments.map(apt =>
          this.bookingService.getBookingsByApartmentId(apt.id, 0, 100).pipe(
            map(bookings => ({ apartment: apt, bookings }))
          )
        );
        
        forkJoin(bookingRequests).subscribe({
          next: (data) => {
            this.bookingsByApartment = data;
            this.applyFilters();
            this.calculateStatistics();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading bookings:', error);
            this.loading = false;
            this.router.navigate(['/error'], {
              queryParams: {
                message: error.error?.message || 'Error loading bookings',
                code: error.status || 500
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading apartments:', error);
        this.loading = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Error loading apartments',
            code: error.status || 500
          }
        });
      }
    });
  }

  calculateMonthData() {
    this.year = this.currentMonth.getFullYear();
    this.month = this.currentMonth.getMonth();
    
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    
    this.daysInMonth = lastDay.getDate();
    this.startingDayOfWeek = firstDay.getDay();
    this.monthName = this.currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    this.daysArray = Array.from({ length: this.daysInMonth }, (_, i) => i + 1);
  }

  changeMonth(direction: number) {
    const newDate = new Date(this.currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    this.currentMonth = newDate;
    this.calculateMonthData();
  }

  applyFilters() {
    this.filteredBookingsByApartment = this.bookingsByApartment.map(item => ({
      ...item,
      bookings: item.bookings.filter(b => 
        (this.filterState === 'ALL' || b.state === this.filterState) &&
        (this.searchTerm === '' || 
         item.apartment.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
      )
    })).filter(item => 
      this.searchTerm === '' || item.bookings.length > 0 || 
      item.apartment.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  getBookingForDate(apartmentId: number, day: number): BookingDTO | null {
    const apartment = this.filteredBookingsByApartment.find(
      b => b.apartment.id === apartmentId
    );
    
    if (!apartment) return null;

    const date = new Date(this.year, this.month, day);
    const dateStr = this.formatDateToString(date);
    
    return apartment.bookings.find(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const currentDate = new Date(dateStr);
      
      return currentDate >= startDate && currentDate <= endDate;
    }) || null;
  }

  formatDateToString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return 'chip-confirmed';
      case 'COMPLETED': return 'chip-completed';
      case 'CANCELLED': return 'chip-cancelled';
      default: return '';
    }
  }

  getDayName(day: number): string {
    const date = new Date(this.year, this.month, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getBookingTooltip(booking: BookingDTO): string {
    return `Booking #${booking.id}\n${booking.guests} guests\n$${booking.cost} User: ${booking.userId}`;
  }

  calculateStatistics() {
    this.totalBookings = this.bookingsByApartment.reduce(
      (acc, item) => acc + item.bookings.length, 0
    );
    
    this.confirmedBookings = this.bookingsByApartment.reduce(
      (acc, item) => acc + item.bookings.filter(b => b.state === 'CONFIRMED').length, 0
    );
    
    this.completedBookings = this.bookingsByApartment.reduce(
      (acc, item) => acc + item.bookings.filter(b => b.state === 'COMPLETED').length, 0
    );
    
    this.totalRevenue = this.bookingsByApartment.reduce(
      (acc, item) => acc + item.bookings.reduce((sum, b) => sum + b.cost, 0), 0
    );
  }

}