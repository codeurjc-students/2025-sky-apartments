import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginService } from '../../services/user/login.service';
import { UserService } from '../../services/user/user.service';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { UserDTO } from '../../dtos/user.dto';
import { BookingDTO } from '../../dtos/booking.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { EditBooking } from '../edit-booking/edit-booking.component';
import Swal from 'sweetalert2';
import { DashboardTabComponent } from '../dashboard-tab/dashboard-tab.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTooltipModule,
    DashboardTabComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('userTabs') userTabs!: MatTabGroup;
  @ViewChild('adminTabs') adminTabs!: MatTabGroup;
  
  user: UserDTO | null = null;
  isAdmin = false;
  isLoading = true;
  selectedTabIndex = 0;
  
  // User data
  profileForm: FormGroup;
  isEditingProfile = false;
  isSavingProfile = false;
  hidePassword = true;
  hideRepeatPassword = true;
  
  // User bookings
  userBookings: BookingWithApartment[] = [];
  isLoadingBookings = false;
  bookingsDisplayedColumns = ['image', 'apartment', 'dates', 'guests', 'price', 'status', 'actions'];
  currentPage: number = 0;
  pageSize: number = 10;
  hasMore: boolean = true;
  loading: boolean = false;

  // Admin data
  allBookings: BookingWithApartment[] = [];
  allApartments: ApartmentDTO[] = [];
  isLoadingAdminData = false;
  apartmentsDisplayedColumns = ['image', 'name', 'price', 'capacity', 'status', 'actions'];
  aptCurrentPage: number = 0;
  aptPageSize: number = 10;
  aptHasMore: boolean = true;
  aptLoading: boolean = false;

  //Admin graphics


  constructor(
    private loginService: LoginService,
    private userService: UserService,
    private bookingService: BookingService,
    private apartmentService: ApartmentService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      password: [''],
      repeatPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const repeatPassword = form.get('repeatPassword');
    
    
    if (password?.value || repeatPassword?.value) {
      if (password?.value !== repeatPassword?.value) {
        repeatPassword?.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
     
      if (password?.value && password.value.length < 6) {
        password.setErrors({ minlength: true });
        return { minlength: true };
      }
    }
    return null;
  }

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.initializeProfile();

        this.route.fragment.subscribe(fragment => {
          this.navigateToTab(fragment);
        });
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  navigateToTab(fragment: string | null) {
    
    if (!fragment) return;
    setTimeout(() => {
      if (this.isAdmin) {
        switch (fragment) {
          case 'dashboard':
            this.selectedTabIndex = 0;
            break;
          case 'apartments':
            this.selectedTabIndex = 1;
            break;
        }
      } else {
        switch (fragment) {
          case 'personal':
            this.selectedTabIndex = 0;
            break;
          case 'bookings':
            this.selectedTabIndex = 1;
            break;
        }
      }
    }, 300);
  }

  initializeProfile() {
    if (!this.user) return;

    this.isAdmin = this.loginService.isAdmin();
    this.profileForm.patchValue({
      name: this.user.name,
      surname: this.user.surname,
      email: this.user.email,
      phoneNumber: this.user.phoneNumber
    });

    if (this.isAdmin) {
      this.loadAdminData();
    } else {
      this.loadUserBookings();
    }
    
    this.isLoading = false;
  }

  loadUserBookings() {
    if (!this.user || !this.user.id) {
      return;
    }
    
    this.isLoadingBookings = true;
    this.loading = true;
    this.bookingService.getBookingsByUserId(this.user.id, this.currentPage, this.pageSize).subscribe({
      next: (bookings) => {
        if (bookings && bookings.length > 0) {
          this.loadBookingsWithApartments(bookings);
          this.hasMore = bookings.length === this.pageSize;
        } else {
          this.hasMore = false;
        }
        this.loading = false;
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
        this.isLoadingBookings = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Failed to load bookings',
            code: error.status || 500
          }
        });
      }
    });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadUserBookings();
  }

  loadBookingsWithApartments(bookings: BookingDTO[]) {
    const apartmentRequests = bookings.map(booking =>
      this.apartmentService.getApartmentById(booking.apartmentId)
    );

    if (apartmentRequests.length === 0) {
      this.isLoadingBookings = false;
      return;
    }

    forkJoin(apartmentRequests).subscribe({
      next: (apartments) => {
        const bookingsWithApartments = bookings.map((booking, index) => ({
          ...booking,
          apartment: apartments[index]
        }));

        this.userBookings = [...this.userBookings, ...bookingsWithApartments];

        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading apartment details:', error);
        this.isLoadingBookings = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Error loading apartment details',
            code: error.status || 500
          }
        });
      }
    });
  }

  loadAdminData() {
    this.isLoadingAdminData = true;
    
    // Load all apartments
    this.aptLoading = true;
    this.apartmentService.getAllApartments(this.aptCurrentPage, this.aptPageSize).subscribe({
      next: (apartments) => {
        if (apartments && apartments.length > 0) {
          this.aptHasMore = apartments.length === this.aptPageSize;
        } else {
          this.aptHasMore = false;
        }
        if (apartments.length != this.aptPageSize) {
          this.aptHasMore = false;
        }
        this.aptLoading = false;
        this.allApartments = [... this.allApartments, ...apartments];
        this.isLoadingAdminData = false;
      },
      error: (error) => {
        console.error('Error loading apartments:', error);
        this.isLoadingAdminData = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Error loading apartments',
            code: error.status || 500
          }
        });
      }
    });
  }

  loadMoreApt(): void {
    this.aptCurrentPage++;
    this.loadAdminData();
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    if (!this.isEditingProfile && this.user) {
     
      this.profileForm.patchValue({
        name: this.user.name,
        surname: this.user.surname,
        email: this.user.email,
        phoneNumber: this.user.phoneNumber,
        password: '',
        repeatPassword: ''
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid || !this.user) {
      this.showMessage('Please fill in all required fields correctly', 'warning');
      return;
    }

    this.isSavingProfile = true;
    const formValue = this.profileForm.value;

    const updateData: any = {
      name: formValue.name,
      surname: formValue.surname,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber
    };

    if (formValue.password && formValue.repeatPassword) {
      updateData.password = formValue.password;
      updateData.repeatPassword = formValue.repeatPassword;
    }

    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('User updated successfully:', updatedUser);
        this.user = updatedUser;
        this.isEditingProfile = false;
        this.isSavingProfile = false;

        this.profileForm.patchValue({
          password: '',
          repeatPassword: ''
        });
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.isSavingProfile = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Error updating profile',
            code: error.status || 500
          }
        });
        
      }
    });
  }


  getProfileErrorMessage(field: string): string {
    const control = this.profileForm.get(field);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number (9-15 digits)';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'CONFIRMED': return 'chip-confirmed';
      case 'COMPLETED': return 'chip-completed';
      case 'CANCELLED': return 'chip-cancelled';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  editBooking(booking: BookingWithApartment) {
    const dialogRef = this.dialog.open(EditBooking, {
      width: '90vw',
      maxWidth: '800px',
      height: 'auto',
      maxHeight: '90vh',
      data: {
        booking,
        apartment: booking.apartment
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateBooking(booking.id, result.startDate, result.endDate);
      }
    });
  }

  updateBooking(bookingId: number, startDate: Date, endDate: Date) {

    const startDateStr = this.formatLocalDateToISODateOnly(startDate);
    const endDateStr = this.formatLocalDateToISODateOnly(endDate);

    this.bookingService.updateBookingDates(bookingId, startDateStr, endDateStr).subscribe({
      next: (updatedBooking) => {
        this.showMessage('Booking updated successfully', 'success');
        this.userBookings = [];
        this.loadUserBookings();
      },
      error: (error) => {
        console.error('Error updating booking:', error);
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Error updating booking. Please try again.',
            code: error.status || 500
          }
        });
      }
    });
  }

  cancelBooking(bookingId: number) {
    Swal.fire({
      title: '¿Cancel booking?',
      text: 'this action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bookingService.cancelBooking(bookingId).subscribe({
          next: () => {
            Swal.fire('Cancelled', 'The booking was cancelled', 'success');
            this.userBookings = [];
            this.loadUserBookings();
          },
          error: (error) => {
            console.error('Error cancelling booking:', error);
            this.router.navigate(['/error'], {
              queryParams: {
                message: error.error?.message || 'Error cancelling booking. Please try again.',
                code: error.status || 500
              }
            });
          }
        });
      }
    });
  }

  editApartment(apartment: ApartmentDTO) {
    this.router.navigate(['/apartments/edit', apartment.id]);
  }

  addApartment() {
    this.router.navigate(['/apartments/new']);
  }

  deleteApartment(apartmentId: number) {
    if (!confirm('Are you sure you want to delete this apartment?')) return;

    this.apartmentService.deleteApartment(apartmentId).subscribe({
      next: () => {
        this.showMessage('Apartment deleted successfully', 'success');
        this.loadAdminData();
      },
      error: (error) => {
        console.error('Error deleting apartment:', error);
        this.showMessage('Error deleting apartment', 'error');
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  private formatLocalDateToISODateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

interface BookingWithApartment extends BookingDTO {
  apartment?: ApartmentDTO;
}