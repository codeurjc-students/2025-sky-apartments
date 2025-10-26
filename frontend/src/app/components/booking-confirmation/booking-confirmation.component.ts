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


@Component({
  selector: 'app-booking-confirmation',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
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
  totalPrice: number = 0;
  
  loading: boolean = true;
  bookingInProgress: boolean = false;
  bookingConfirmed: boolean = false;
  bookingId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apartmentService: ApartmentService,
    private bookingService: BookingService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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
        this.totalPrice = apartment.price * this.numberOfNights;
        this.loading = false;
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