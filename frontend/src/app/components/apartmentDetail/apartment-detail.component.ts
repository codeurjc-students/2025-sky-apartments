import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { LoginService } from '../../services/user/login.service';
import { ReviewService } from '../../services/review/review.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ReviewDTO } from '../../dtos/review.dto';
import { ReviewRequestDTO } from '../../dtos/reviewRequest.dto';
import { UpdateReviewRequestDTO } from '../../dtos/updateReviewRequest.dto';
import { UserService } from '../../services/user/user.service';
import { UserDTO } from '../../dtos/user.dto';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isAvailable: boolean | null; // null = loading
  isSelected: boolean;
  isInRange: boolean;
  isToday: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-apartment-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './apartment-detail.component.html',
  styleUrls: ['./apartment-detail.component.css']
})
export class ApartmentDetailComponent implements OnInit {
  apartment: ApartmentDTO | null = null;
  bookingForm: FormGroup;
  reviewForm: FormGroup;
  isLoading = true;
  guestsOptions: number[] = [];
  user: UserDTO | null = null;
  selectedGuests: number | null = null;

  // Carousel
  currentImageIndex = 0;

  // Math for template
  Math = Math;

  // Reviews
  reviews: ReviewDTO[] = [];
  userReview: ReviewDTO | null = null;
  canReview = false;
  isLoadingReviews = false;
  isSubmittingReview = false;
  showReviewForm = false;
  isEditingReview = false;
  averageRating = 0;
  currentPage = 0;
  pageSize = 5;
  hasMoreReviews = true;

  // Calendar
  calendarDays: CalendarDay[] = [];
  currentMonth: Date = new Date();
  selectedCheckIn: Date | null = null;
  selectedCheckOut: Date | null = null;
  isLoadingAvailability = false;
  availabilityCache: Map<string, boolean> = new Map();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Booking summary
  numberOfNights = 0;
  totalPrice = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apartmentService: ApartmentService,
    public loginService: LoginService,
    private reviewService: ReviewService,
    private userService: UserService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.bookingForm = this.fb.group({});

    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    const apartmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (apartmentId) {
      this.loadApartment(apartmentId);
      this.loadReviews(apartmentId);
      this.loadAverageRating(apartmentId);
      this.checkIfUserCanReview(apartmentId);
    }
  }

  loadApartment(id: number) {
    this.apartmentService.getApartmentById(id).subscribe({
      next: (apartment) => {
        this.apartment = apartment;
        this.generateGuestsOptions();
        this.isLoading = false;
        this.generateCalendar();
        this.loadMonthAvailability();
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

  // Calendar Methods
  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.calendarDays = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      this.calendarDays.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isAvailable: null,
        isSelected: false,
        isInRange: false,
        isToday: false,
        isPast: date < today
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: true,
        isAvailable: null,
        isSelected: false,
        isInRange: false,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today
      });
    }
    
    // Next month days to complete the grid
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isAvailable: null,
        isSelected: false,
        isInRange: false,
        isToday: false,
        isPast: false
      });
    }
    
    this.updateCalendarSelection();
  }

  loadMonthAvailability() {
    if (!this.apartment) return;
    
    this.isLoadingAvailability = true;
    const currentMonthDays = this.calendarDays.filter(d => d.isCurrentMonth && !d.isPast);
    
    if (currentMonthDays.length === 0) {
      this.isLoadingAvailability = false;
      return;
    }
    
    // Check availability for each day by checking single-day ranges
    const availabilityChecks = currentMonthDays.map(day => {
      const dateStr = this.formatDate(day.date);
      
      // Check cache first
      if (this.availabilityCache.has(dateStr)) {
        return new Promise<{ date: Date, available: boolean }>((resolve) => {
          resolve({ date: day.date, available: this.availabilityCache.get(dateStr)! });
        });
      }
      
      // Make API call
      return this.apartmentService.checkAvailability(
        this.apartment!.id,
        dateStr,
        dateStr
      ).toPromise().then(available => {
        this.availabilityCache.set(dateStr, available!);
        return { date: day.date, available: available! };
      });
    });
    
    Promise.all(availabilityChecks).then(results => {
      results.forEach(result => {
        const calDay = this.calendarDays.find(d => 
          d.date.getTime() === result.date.getTime()
        );
        if (calDay) {
          calDay.isAvailable = result.available;
        }
      });
      this.isLoadingAvailability = false;
    }).catch(error => {
      console.error('Error loading availability:', error);
      this.isLoadingAvailability = false;
    });
  }

  previousMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateCalendar();
    this.loadMonthAvailability();
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateCalendar();
    this.loadMonthAvailability();
  }

  selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isPast || day.isAvailable === false) {
      return;
    }
    
    if (!this.selectedCheckIn || (this.selectedCheckIn && this.selectedCheckOut)) {
      // Start new selection
      this.selectedCheckIn = day.date;
      this.selectedCheckOut = null;
    } else if (day.date > this.selectedCheckIn) {
      // Complete the range
      this.selectedCheckOut = day.date;
      this.calculateBookingSummary();
    } else {
      // Start new selection if clicked date is before check-in
      this.selectedCheckIn = day.date;
      this.selectedCheckOut = null;
    }
    
    this.updateCalendarSelection();
  }

  updateCalendarSelection() {
    this.calendarDays.forEach(day => {
      day.isSelected = false;
      day.isInRange = false;
      
      if (this.selectedCheckIn && day.date.getTime() === this.selectedCheckIn.getTime()) {
        day.isSelected = true;
      }
      
      if (this.selectedCheckOut && day.date.getTime() === this.selectedCheckOut.getTime()) {
        day.isSelected = true;
      }
      
      if (this.selectedCheckIn && this.selectedCheckOut) {
        if (day.date > this.selectedCheckIn && day.date < this.selectedCheckOut) {
          day.isInRange = true;
        }
      }
    });
  }

  calculateBookingSummary() {
    if (!this.selectedCheckIn || !this.selectedCheckOut || !this.apartment) {
      this.numberOfNights = 0;
      this.totalPrice = 0;
      return;
    }
    
    const timeDiff = this.selectedCheckOut.getTime() - this.selectedCheckIn.getTime();
    this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    this.totalPrice = this.numberOfNights * this.apartment.price;
  }

  clearDates() {
    this.selectedCheckIn = null;
    this.selectedCheckOut = null;
    this.numberOfNights = 0;
    this.totalPrice = 0;
    this.updateCalendarSelection();
  }

  onGuestsChange(event: any) {
    console.log('Guests changed to:', event.value);
    console.log('selectedGuests is now:', this.selectedGuests);
  }

  getMonthYearLabel(): string {
    return this.currentMonth.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  proceedToBooking() {
    console.log('Selected guests:', this.selectedGuests);
    
    if (!this.loginService.isLogged()) {
      this.showMessage('Please log in to make a reservation', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.selectedCheckIn || !this.selectedCheckOut) {
      this.showMessage('Please select check-in and check-out dates', 'warning');
      return;
    }

    if (!this.selectedGuests) {
      this.showMessage('Please select number of guests', 'warning');
      return;
    }

    if (!this.apartment) {
      return;
    }

    // Verificar disponibilidad del rango completo antes de proceder
    this.isLoadingAvailability = true;
    const checkIn = this.formatDate(this.selectedCheckIn);
    const checkOut = this.formatDate(this.selectedCheckOut);

    this.apartmentService.checkAvailability(
      this.apartment.id,
      checkIn,
      checkOut
    ).subscribe({
      next: (available) => {
        this.isLoadingAvailability = false;
        
        if (available) {
          this.router.navigate(['/booking'], {
            queryParams: {
              apartmentId: this.apartment?.id,
              checkIn: checkIn,
              checkOut: checkOut,
              guests: this.selectedGuests
            }
          });
        } else {
          this.showMessage('Sorry, the apartment is not available for the complete selected period. Please choose different dates.', 'error');
          // Recargar la disponibilidad del mes para mostrar los días actualizados
          this.loadMonthAvailability();
        }
      },
      error: (error) => {
        console.error('Error checking availability:', error);
        this.isLoadingAvailability = false;
        this.showMessage('Error verifying availability. Please try again.', 'error');
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Review Methods (unchanged)
  loadReviews(apartmentId: number, reset: boolean = true) {
    if (reset) {
      this.currentPage = 0;
      this.reviews = [];
    }

    this.isLoadingReviews = true;
    this.reviewService.getReviewsByApartment(apartmentId, this.currentPage, this.pageSize).subscribe({
      next: (reviews) => {
        const currentUserId = this.getCurrentUserId();
        
        if (this.userReview == null) {
          this.userReview = reviews.find(r => r.userId === currentUserId) || null;
        }
        const otherReviews = reviews.filter(r => r.userId !== currentUserId);
        
        if (reset) {
          this.reviews = otherReviews;
        } else {
          this.reviews = [...this.reviews, ...otherReviews];
        }
        
        this.hasMoreReviews = reviews.length === this.pageSize;
        this.isLoadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.isLoadingReviews = false;
        this.showMessage('Error loading reviews', 'error');
      }
    });
  }

  loadMoreReviews() {
    if (this.apartment && this.hasMoreReviews && !this.isLoadingReviews) {
      this.currentPage++;
      this.loadReviews(this.apartment.id, false);
    }
  }

  loadAverageRating(apartmentId: number) {
    this.reviewService.getApartmentRating(apartmentId).subscribe({
      next: (rating) => {
        this.averageRating = rating;
      },
      error: (error) => {
        console.error('Error loading rating:', error);
      }
    });
  }

  checkIfUserCanReview(apartmentId: number) {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.reviewService.canUserReview(user.id, apartmentId).subscribe({
          next: (canReview) => {
            this.canReview = canReview;
          },
          error: (error) => {
            console.error('Error checking review permission:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching current user:', error);
      }
    });
  }

  toggleReviewForm() {
    this.showReviewForm = !this.showReviewForm;
    if (this.showReviewForm) {
      this.isEditingReview = false;
      this.reviewForm.reset({ rating: 5, comment: '' });
    }
  }

  startEditReview() {
    if (this.userReview) {
      this.isEditingReview = true;
      this.showReviewForm = true;
      this.reviewForm.patchValue({
        rating: this.userReview.rating,
        comment: this.userReview.comment
      });
    }
  }

  cancelReviewForm() {
    this.showReviewForm = false;
    this.isEditingReview = false;
    this.reviewForm.reset({ rating: 5, comment: '' });
  }

  submitReview() {
    if (this.reviewForm.invalid || !this.apartment) {
      this.showMessage('Please fill in all required fields', 'warning');
      return;
    }

    this.isSubmittingReview = true;

    if (this.isEditingReview && this.userReview) {
      const updateRequest: UpdateReviewRequestDTO = {
        comment: this.reviewForm.value.comment,
        rating: this.reviewForm.value.rating
      };

      this.reviewService.updateReview(this.userReview.id, updateRequest).subscribe({
        next: (updatedReview) => {
          this.userReview = updatedReview;
          this.isSubmittingReview = false;
          this.showReviewForm = false;
          this.isEditingReview = false;
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.loadAverageRating(this.apartment!.id);
          this.showMessage('Review updated successfully', 'success');
        },
        error: (error) => {
          console.error('Error updating review:', error);
          this.isSubmittingReview = false;
          this.showMessage('Error updating review', 'error');
        }
      });
    } else {
      const reviewRequest: ReviewRequestDTO = {
        userId: this.getCurrentUserId()!,
        apartmentId: this.apartment.id,
        comment: this.reviewForm.value.comment,
        rating: this.reviewForm.value.rating
      };

      this.reviewService.createReview(reviewRequest).subscribe({
        next: (newReview) => {
          this.userReview = newReview;
          this.canReview = false;
          this.isSubmittingReview = false;
          this.showReviewForm = false;
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.loadAverageRating(this.apartment!.id);
          this.showMessage('Review submitted successfully', 'success');
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.isSubmittingReview = false;
          this.showMessage(error.error?.message || 'Error submitting review', 'error');
        }
      });
    }
  }

  deleteReview() {
    if (!this.userReview) return;
    Swal.fire({
      title: 'Do you want to delete your review?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed || !this.userReview) return;

      this.reviewService.deleteReview(this.userReview.id).subscribe({
        next: () => {
          this.userReview = null;
          this.canReview = true;
          this.showReviewForm = false;
          this.isEditingReview = false;
          if (this.apartment) this.loadAverageRating(this.apartment.id);
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.showMessage('Error deleting review', 'error');
        }
      });
    });
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  getCurrentUserId(): number | null {
    const user = this.loginService.currentUser();
    return user?.id || null;
  }

  formatReviewDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getRoundedRating(): number {
    return Math.round(this.averageRating);
  }

  generateGuestsOptions() {
    if (this.apartment) {
      this.guestsOptions = Array.from(
        { length: this.apartment.capacity }, 
        (_, i) => i + 1
      );
    }
  }

  get isLoggedIn(): boolean {
    return this.loginService.isLogged();
  }

  nextImage() {
    if (this.apartment && this.apartment.imagesUrl.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.apartment.imagesUrl.length;
    }
  }

  previousImage() {
    if (this.apartment && this.apartment.imagesUrl.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.apartment.imagesUrl.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  goToImage(index: number) {
    this.currentImageIndex = index;
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