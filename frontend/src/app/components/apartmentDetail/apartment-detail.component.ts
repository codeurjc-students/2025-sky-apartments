import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { LoginService } from '../../services/user/login.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';

@Component({
  selector: 'app-apartment-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './apartment-detail.component.html',
  styleUrls: ['./apartment-detail.component.css']
})
export class ApartmentDetailComponent implements OnInit {
  apartment: ApartmentDTO | null = null;
  bookingForm: FormGroup;
  isLoading = true;
  isCheckingAvailability = false;
  isAvailable = false;
  hasCheckedAvailability = false;
  totalPrice = 0;
  numberOfNights = 0;
  minDate = new Date();
  maxDate = new Date(new Date().setMonth(new Date().getMonth() + 12));
  guestsOptions: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apartmentService: ApartmentService,
    private loginService: LoginService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.bookingForm = this.fb.group({
      checkIn: ['', [Validators.required]],
      checkOut: ['', [Validators.required]],
      guests: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    const apartmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (apartmentId) {
      this.loadApartment(apartmentId);
    }

    // Watch for date changes
    this.bookingForm.valueChanges.subscribe(() => {
      this.hasCheckedAvailability = false;
      this.isAvailable = false;
      this.totalPrice = 0;
      this.numberOfNights = 0;
    });
  }

  loadApartment(id: number) {
    this.apartmentService.getApartmentById(id).subscribe({
      next: (apartment) => {
        this.apartment = apartment;
        this.generateGuestsOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading apartment:', error);
        this.router.navigate(['/error'], { 
          queryParams: { 
            message: 'Apartment not found',
            code: error.status || 500
          } 
        });
      }
    });
  }

  generateGuestsOptions() {
    if (this.apartment) {
      this.guestsOptions = Array.from(
        { length: this.apartment.capacity }, 
        (_, i) => i + 1
      );
      // Set default to 1 guest
      this.bookingForm.patchValue({ guests: 1 });
    }
  }

  get isLoggedIn(): boolean {
    return this.loginService.isLogged();
  }

  checkAvailability() {
    if (this.bookingForm.invalid || !this.apartment) {
      this.showMessage('Please select both check-in and check-out dates', 'warning');
      return;
    }

    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;

    if (checkIn >= checkOut) {
      this.showMessage('Check-out date must be after check-in date', 'warning');
      return;
    }

    this.isCheckingAvailability = true;
    const startDate = this.formatDate(checkIn);
    const endDate = this.formatDate(checkOut);

    this.apartmentService.checkAvailability(this.apartment.id, startDate, endDate).subscribe({
      next: (available) => {
        this.isAvailable = available;
        this.hasCheckedAvailability = true;
        this.isCheckingAvailability = false;

        if (available) {
          this.calculatePrice();
          this.showMessage('Apartment is available for selected dates!', 'success');
        } else {
          this.showMessage('Sorry, apartment is not available for these dates', 'error');
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
        this.isCheckingAvailability = false;
        this.router.navigate(['/error'], { 
          queryParams: { 
            message: error.error?.message || 'Error checking availability',
            code: error.status || 500
          } 
        });
      }
    });
  }

  calculatePrice() {
    if (!this.apartment) return;

    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;

    const timeDiff = checkOut.getTime() - checkIn.getTime();
    this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    this.totalPrice = this.numberOfNights * this.apartment.price;
  }

  proceedToBooking() {
    if (!this.isLoggedIn) {
      this.showMessage('Please log in to make a reservation', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.hasCheckedAvailability || !this.isAvailable) {
      this.showMessage('Please check availability first', 'warning');
      return;
    }

    const checkIn = this.formatDate(this.bookingForm.get('checkIn')?.value);
    const checkOut = this.formatDate(this.bookingForm.get('checkOut')?.value);
    const guests = this.bookingForm.get('guests')?.value;

    // Navigate to booking confirmation page
    this.router.navigate(['/booking'], {
      queryParams: {
        apartmentId: this.apartment?.id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getServicesArray(): string[] {
    return this.apartment?.services
      ? Array.from(this.apartment.services).map(s => s.toString())
      : [];
  }

  goBack() {
    this.router.navigate(['/apartments']);
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}


