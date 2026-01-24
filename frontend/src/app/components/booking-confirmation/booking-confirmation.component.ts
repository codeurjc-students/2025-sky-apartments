import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserDTO } from '../../dtos/user.dto';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { BookingService } from '../../services/booking/booking.service';
import { BookingRequestDTO } from '../../dtos/bookingRequest.dto';
import { UserService } from '../../services/user/user.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { FilterService } from '../../services/booking/filter.service';
import { MatTooltipModule } from '@angular/material/tooltip';

interface AppliedFilter {
  id: number;
  name: string;
  description: string;
  increment: boolean;
  value: number;
  nightsApplied: number;
  impact: number;
}

@Component({
  selector: 'app-booking-confirmation',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './booking-confirmation.component.html',
  styleUrls: ['./booking-confirmation.component.css']
})
export class BookingConfirmationComponent implements OnInit {
  apartment: ApartmentDTO | null = null;
  user: UserDTO | null = null;
  
  apartmentId: number = 0;
  checkIn: Date | null = null;
  checkOut: Date | null = null;
  guests: number = 0;
  numberOfNights: number = 0;

  basePrice: number = 0;
  totalPrice: number = 0;
  appliedFilters: AppliedFilter[] = [];
  totalIncrements: number = 0;
  totalDiscounts: number = 0;
  
  loading: boolean = true;
  loadingFilters: boolean = false;
  bookingInProgress: boolean = false;
  bookingConfirmed: boolean = false;
  bookingId: number = 0;

  Math = Math; // Expose Math to template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apartmentService: ApartmentService,
    private bookingService: BookingService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    console.log('Initializing BookingConfirmationComponent');
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.router.navigate(['/login']);
      }
    });

    this.route.queryParams.subscribe(params => {
      this.apartmentId = +params['apartmentId'];
      this.checkIn = params['checkIn'] ? new Date(params['checkIn']) : null;
      this.checkOut = params['checkOut'] ? new Date(params['checkOut']) : null;
      this.guests = +params['guests'];

      if (!this.apartmentId || !this.checkIn || !this.checkOut || !this.guests) {
        this.router.navigate(['/error'], {
          queryParams: {
            message: 'Invalid booking parameters',
            code: 400
          }
        });
        return;
      }
      console.log('Booking parameters:', {
        apartmentId: this.apartmentId,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guests: this.guests
      });
      this.calculateNights();
      this.loadApartmentDetails();
    });
  }

  calculateNights(): void {
    if (this.checkIn && this.checkOut) {
      const diffTime = Math.abs(this.checkOut.getTime() - this.checkIn.getTime());
      this.numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  loadApartmentDetails(): void {
    this.loading = true;
    this.apartmentService.getApartmentById(this.apartmentId).subscribe({
      next: (apartment) => {
        this.apartment = apartment;
        this.basePrice = apartment.price * this.numberOfNights;
        this.totalPrice = this.basePrice;
        this.loading = false;
        console.log('Apartment details loaded:', apartment);
        this.loadApplicableFilters();
      },
      error: (error) => {
        this.router.navigate(['/error'], {
          queryParams: {
            message: 'Failed to load apartment details',
            code: error.status || 500
          }
        });
      }
    });
  }

  loadApplicableFilters(): void {
    console.log('Loading applicable filters for booking.');
    if (!this.checkIn || !this.checkOut) return;
    console.log('Check-in date:', this.checkIn);
    this.loadingFilters = true;
    const checkInStr = this.formatDateForAPI(this.checkIn);
    const checkOutStr = this.formatDateForAPI(this.checkOut);

    this.filterService.getApplicableFilters(checkInStr, checkOutStr).subscribe({
      next: (response) => {
        this.appliedFilters = this.processFiltersForDisplay(response);
        this.calculateTotals();
        this.loadingFilters = false;
      },
      error: (error) => {
        console.error('Error loading filters:', error);
        this.router.navigate(['/error'], {
          queryParams: {
            message: 'Failed to load applicable filters',
            code: error.status || 500
          }
        });
      }
    });
  }

  processFiltersForDisplay(response: any): AppliedFilter[] {
    const filtersByNight: Map<number, any> = new Map();
    
    // Process each night's filters
    Object.entries(response.filtersByDate).forEach(([date, filters]) => {
      (filters as any[]).forEach(filter => {
        const key = filter.id;
        if (filtersByNight.has(key)) {
          filtersByNight.get(key).nightsApplied++;
        } else {
          filtersByNight.set(key, {
            ...filter,
            nightsApplied: 1
          });
        }
      });
    });

    // Calculate impact for each filter
    return Array.from(filtersByNight.values()).map(filter => {
      const pricePerNight = this.apartment!.price;
      const impact = (pricePerNight * (filter.value / 100)) * filter.nightsApplied;
      
      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || 'No description available',
        increment: filter.increment,
        value: filter.value,
        nightsApplied: filter.nightsApplied,
        impact: filter.increment ? impact : -impact
      };
    }).sort((a, b) => b.impact - a.impact); // Sort by impact
  }

  calculateTotals(): void {
    this.totalIncrements = this.appliedFilters
      .filter(f => f.increment)
      .reduce((sum, f) => sum + f.impact, 0);
    
    this.totalDiscounts = Math.abs(this.appliedFilters
      .filter(f => !f.increment)
      .reduce((sum, f) => sum + f.impact, 0));
    
    this.totalPrice = this.basePrice + this.totalIncrements - this.totalDiscounts;
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  confirmBooking(): void {
    if (!this.user || !this.checkIn || !this.checkOut) {
      return;
    }

    this.bookingInProgress = true;

    const bookingRequest: BookingRequestDTO = {
      userId: this.user.id,
      apartmentId: this.apartmentId,
      startDate: this.checkIn,
      endDate: this.checkOut,
      guests: this.guests
    };

    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (booking) => {
        this.bookingConfirmed = true;
        this.bookingId = booking.id;
        this.bookingInProgress = false;
        this.showMessage('Booking confirmed successfully!', 'success');
      },
      error: (error) => {
        this.bookingInProgress = false;
        const errorMessage = error.error?.message || 'Failed to create booking';
        this.router.navigate(['/error'], {
          queryParams: {
            message: errorMessage,
            code: error.status || 500
          }
        });
      }
    });
  }

  goToMyBookings(): void {
    this.router.navigate(['/profile'], { fragment: 'bookings' });
  }

  goToApartments(): void {
    this.router.navigate(['/apartments']);
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  goBack(): void {
    this.router.navigate(['/apartment', this.apartmentId]);
  }

  getServicesArray(services: Set<string>): string[] {
    return Array.from(services);
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}