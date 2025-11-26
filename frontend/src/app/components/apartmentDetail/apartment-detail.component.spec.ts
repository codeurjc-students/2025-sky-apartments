import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApartmentDetailComponent } from './apartment-detail.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { LoginService } from '../../services/user/login.service';
import { ReviewService } from '../../services/review/review.service';
import { UserService } from '../../services/user/user.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ReviewDTO } from '../../dtos/review.dto';
import { UserDTO } from '../../dtos/user.dto';
import { ContactService } from '../../services/contact/contact.service';


describe('ApartmentDetailComponent', () => {
  let component: ApartmentDetailComponent;
  let fixture: ComponentFixture<ApartmentDetailComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let contactService: jasmine.SpyObj<ContactService>;


  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Test Apartment',
    description: 'A beautiful test apartment',
    price: 100,
    services: new Set(['WiFi', 'AC', 'Kitchen']),
    capacity: 4,
    imagesUrl: ['test1.jpg', 'test2.jpg', 'test3.jpg']
  };

  const mockUser: UserDTO = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    roles: ['USER'],
    surname: '',
    phoneNumber: ''
  };

  const mockReview: ReviewDTO = {
    id: 1,
    userId: 1,
    apartmentId: 1,
    userName: 'Test User',
    comment: 'Great apartment!',
    rating: 5,
    date: new Date('2025-01-15')
  };

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getApartmentById',
      'checkAvailability'
    ]);
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['isLogged', 'currentUser']);
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', [
      'getReviewsByApartment',
      'getApartmentRating',
      'canUserReview',
      'createReview',
      'updateReview',
      'deleteReview'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const contactServiceSpy = jasmine.createSpyObj('ContactService', ['sendContactMessage']);

    snackBarSpy.open.and.returnValue({ onAction: () => of({}), dismiss: () => {} } as any);

    const activatedRouteStub = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ApartmentDetailComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([
          { path: 'booking', component: ApartmentDetailComponent },
          { path: 'login', component: ApartmentDetailComponent },
          { path: 'apartments', component: ApartmentDetailComponent },
          { path: 'error', component: ApartmentDetailComponent }
        ])
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Default mocks
    apartmentService.getApartmentById.and.returnValue(of(mockApartment));
    apartmentService.checkAvailability.and.returnValue(of(true));
    loginService.isLogged.and.returnValue(true);
    loginService.currentUser.and.returnValue(mockUser);
    reviewService.getReviewsByApartment.and.returnValue(of([]));
    reviewService.getApartmentRating.and.returnValue(of(4.5));
    reviewService.canUserReview.and.returnValue(of(true));
    userService.getCurrentUser.and.returnValue(of(mockUser));

    fixture = TestBed.createComponent(ApartmentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.apartment).toBeNull();
      expect(component.isLoading).toBe(true);
      expect(component.currentImageIndex).toBe(0);
      expect(component.reviews).toEqual([]);
      expect(component.userReview).toBeNull();
      expect(component.canReview).toBe(false);
      expect(component.selectedCheckIn).toBeNull();
      expect(component.selectedCheckOut).toBeNull();
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
    });

    it('should initialize review form with validators', () => {
      expect(component.reviewForm.get('rating')?.value).toBe(5);
      expect(component.reviewForm.get('comment')?.hasError('required')).toBe(true);
    });

    it('should initialize calendar properties', () => {
      expect(component.calendarDays).toEqual([]);
      expect(component.currentMonth).toBeDefined();
      expect(component.availabilityCache).toBeInstanceOf(Map);
      expect(component.weekDays).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });
  });

  describe('loadApartment', () => {
    it('should set apartment data on success', fakeAsync(() => {
      component.loadApartment(1);
      tick();
      
      expect(component.apartment).toEqual(mockApartment);
      expect(component.isLoading).toBe(false);
    }));

    it('should generate guests options', fakeAsync(() => {
      spyOn(component, 'generateGuestsOptions');
      component.loadApartment(1);
      tick();
      
      expect(component.generateGuestsOptions).toHaveBeenCalled();
    }));

    it('should generate calendar', fakeAsync(() => {
      spyOn(component, 'generateCalendar');
      component.loadApartment(1);
      tick();
      
      expect(component.generateCalendar).toHaveBeenCalled();
    }));

    it('should navigate to error page on failure', () => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      apartmentService.getApartmentById.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      
      component.loadApartment(1);
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Apartment not found',
          code: 404
        }
      });
    });
  });

  describe('Calendar Methods', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.currentMonth = new Date(2025, 9, 1); // October 2025
    });

    it('should generate calendar for current month', () => {
      component.generateCalendar();
      
      expect(component.calendarDays.length).toBe(42); // 6 weeks
    });

    it('should mark today correctly', () => {
      const today = new Date();
      component.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      component.generateCalendar();
      
      const todayCell = component.calendarDays.find(d => d.isToday);
      expect(todayCell).toBeDefined();
      expect(todayCell?.day).toBe(today.getDate());
    });

    it('should mark past dates', () => {
      component.generateCalendar();
      
      const pastDates = component.calendarDays.filter(d => d.isPast);
      expect(pastDates.length).toBeGreaterThan(0);
    });

    it('should navigate to previous month', () => {
      const initialMonth = component.currentMonth.getMonth();
      component.previousMonth();
      
      expect(component.currentMonth.getMonth()).toBe((initialMonth - 1 + 12) % 12);
    });

    it('should navigate to next month', () => {
      const initialMonth = component.currentMonth.getMonth();
      component.nextMonth();
      
      expect(component.currentMonth.getMonth()).toBe((initialMonth + 1) % 12);
    });

    it('should return month year label', () => {
      const label = component.getMonthYearLabel();
      expect(label).toContain('October');
      expect(label).toContain('2025');
    });
  });

  describe('Date Selection', () => {
    let availableDay: any;

    beforeEach(() => {
      component.apartment = mockApartment;
      component.generateCalendar();
      
      // Find an available day in current month
      availableDay = component.calendarDays.find(d => 
        d.isCurrentMonth && !d.isPast
      );
      if (availableDay) {
        availableDay.isAvailable = true;
      }
    });

    it('should not select past dates', () => {
      const pastDay = component.calendarDays.find(d => d.isPast);
      if (pastDay) {
        component.selectDate(pastDay);
        expect(component.selectedCheckIn).toBeNull();
      }
    });

    it('should not select unavailable dates', () => {
      if (availableDay) {
        availableDay.isAvailable = false;
        component.selectDate(availableDay);
        expect(component.selectedCheckIn).toBeNull();
      }
    });

    it('should select check-in date', () => {
      if (availableDay) {
        component.selectDate(availableDay);
        expect(component.selectedCheckIn).toEqual(availableDay.date);
        expect(component.selectedCheckOut).toBeNull();
      }
    });

    it('should select check-out date after check-in', () => {
      if (availableDay) {
        const futureDay = component.calendarDays.find(d => 
          d.isCurrentMonth && !d.isPast && d.date > availableDay.date
        );
        
        if (futureDay) {
          futureDay.isAvailable = true;
          component.selectDate(availableDay);
          component.selectDate(futureDay);
          
          expect(component.selectedCheckIn).toEqual(availableDay.date);
          expect(component.selectedCheckOut).toEqual(futureDay.date);
        }
      }
    });

    it('should calculate booking summary when both dates selected', () => {
      spyOn(component, 'calculateBookingSummary');
      
      if (availableDay) {
        const futureDay = component.calendarDays.find(d => 
          d.isCurrentMonth && !d.isPast && d.date > availableDay.date
        );
        
        if (futureDay) {
          futureDay.isAvailable = true;
          component.selectDate(availableDay);
          component.selectDate(futureDay);
          
          expect(component.calculateBookingSummary).toHaveBeenCalled();
        }
      }
    });
  });

  describe('calculateBookingSummary', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.selectedCheckIn = new Date('2025-10-20');
      component.selectedCheckOut = new Date('2025-10-25');
    });

    it('should calculate number of nights', () => {
      component.calculateBookingSummary();
      expect(component.numberOfNights).toBe(5);
    });

    it('should calculate total price', () => {
      component.calculateBookingSummary();
      expect(component.totalPrice).toBe(500); // 100 * 5
    });

    it('should reset values if dates are null', () => {
      component.selectedCheckIn = null;
      component.calculateBookingSummary();
      
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
    });
  });

  describe('clearDates', () => {
    it('should reset all date selections', () => {
      component.selectedCheckIn = new Date();
      component.selectedCheckOut = new Date();
      component.numberOfNights = 5;
      component.totalPrice = 500;
      
      component.clearDates();
      
      expect(component.selectedCheckIn).toBeNull();
      expect(component.selectedCheckOut).toBeNull();
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
    });
  });

  describe('proceedToBooking', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.selectedCheckIn = new Date('2025-10-20');
      component.selectedCheckOut = new Date('2025-10-25');
      component.selectedGuests = 2;
      loginService.isLogged.and.returnValue(true);
      snackBar.open.calls.reset();
      spyOn(console, 'log'); // Suppress console.log from onGuestsChange
    });

    it('should verify availability before proceeding', fakeAsync(() => {
      component.proceedToBooking();
      tick();
      
      expect(apartmentService.checkAvailability).toHaveBeenCalledWith(
        1,
        '2025-10-20',
        '2025-10-25'
      );
    }));

    it('should navigate to booking page if available', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      component.proceedToBooking();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/booking'], {
        queryParams: {
          apartmentId: 1,
          checkIn: '2025-10-20',
          checkOut: '2025-10-25',
          guests: 2
        }
      });
    }));
  });

  describe('Review Methods', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.user = mockUser;
    });

    it('should separate user review from others', fakeAsync(() => {
      const userReview = { ...mockReview, userId: 1 };
      const otherReview = { ...mockReview, id: 2, userId: 2, userName: 'Other User' };
      reviewService.getReviewsByApartment.and.returnValue(of([userReview, otherReview]));
      loginService.currentUser.and.returnValue({ id: 1 } as any);
      
      component.loadReviews(1);
      tick();
      
      expect(component.userReview).toBeDefined();
      expect(component.reviews.some(r => r.userId === 1)).toBe(false);
    }));

    it('should load more reviews', fakeAsync(() => {
      component.hasMoreReviews = true;
      component.currentPage = 0;
      
      component.loadMoreReviews();
      tick();
      
      expect(component.currentPage).toBe(1);
      expect(reviewService.getReviewsByApartment).toHaveBeenCalledWith(1, 1, 5);
    }));

    it('should toggle review form', () => {
      component.showReviewForm = false;
      component.toggleReviewForm();
      
      expect(component.showReviewForm).toBe(true);
      expect(component.isEditingReview).toBe(false);
    });

    it('should start editing review', () => {
      component.userReview = mockReview;
      component.startEditReview();
      
      expect(component.isEditingReview).toBe(true);
      expect(component.showReviewForm).toBe(true);
      expect(component.reviewForm.value.rating).toBe(mockReview.rating);
      expect(component.reviewForm.value.comment).toBe(mockReview.comment);
    });

    it('should cancel review form', () => {
      component.showReviewForm = true;
      component.isEditingReview = true;
      
      component.cancelReviewForm();
      
      expect(component.showReviewForm).toBe(false);
      expect(component.isEditingReview).toBe(false);
    });

    it('should submit new review', fakeAsync(() => {
      reviewService.createReview.and.returnValue(of(mockReview));
      component.reviewForm.patchValue({
        rating: 5,
        comment: 'Great apartment!'
      });
      
      component.submitReview();
      tick();
      
      expect(reviewService.createReview).toHaveBeenCalled();
      expect(component.userReview).toEqual(mockReview);
      expect(component.showReviewForm).toBe(false);
    }));

    it('should update existing review', fakeAsync(() => {
      component.userReview = mockReview;
      component.isEditingReview = true;
      reviewService.updateReview.and.returnValue(of(mockReview));
      component.reviewForm.patchValue({
        rating: 4,
        comment: 'Updated comment'
      });
      
      component.submitReview();
      tick();
      
      expect(reviewService.updateReview).toHaveBeenCalled();
      expect(component.isEditingReview).toBe(false);
    }));
  });

  describe('Carousel Methods', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
    });

    it('should navigate to next image', () => {
      component.currentImageIndex = 0;
      component.nextImage();
      
      expect(component.currentImageIndex).toBe(1);
    });

    it('should wrap to first image from last', () => {
      component.currentImageIndex = 2;
      component.nextImage();
      
      expect(component.currentImageIndex).toBe(0);
    });

    it('should navigate to previous image', () => {
      component.currentImageIndex = 1;
      component.previousImage();
      
      expect(component.currentImageIndex).toBe(0);
    });

    it('should wrap to last image from first', () => {
      component.currentImageIndex = 0;
      component.previousImage();
      
      expect(component.currentImageIndex).toBe(2);
    });

    it('should go to specific image', () => {
      component.goToImage(2);
      expect(component.currentImageIndex).toBe(2);
    });
  });

  describe('Helper Methods', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-10-20');
      expect(component.formatDate(date)).toBe('2025-10-20');
    });

    it('should get services array', () => {
      component.apartment = mockApartment;
      const services = component.getServicesArray();
      
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBe(3);
    });

    it('should return empty array if no apartment', () => {
      component.apartment = null;
      expect(component.getServicesArray()).toEqual([]);
    });

    it('should generate guests options', () => {
      component.apartment = mockApartment;
      component.generateGuestsOptions();
      
      expect(component.guestsOptions).toEqual([1, 2, 3, 4]);
    });

    it('should get star array for rating', () => {
      const stars = component.getStarArray(3);
      expect(stars).toEqual([true, true, true, false, false]);
    });

    it('should set rating in form', () => {
      component.setRating(4);
      expect(component.reviewForm.value.rating).toBe(4);
    });

    it('should get current user id', () => {
      loginService.currentUser.and.returnValue(mockUser);
      expect(component.getCurrentUserId()).toBe(1);
    });

    it('should format review date', () => {
      const formatted = component.formatReviewDate(new Date('2025-01-15'));
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should get rounded rating', () => {
      component.averageRating = 4.7;
      expect(component.getRoundedRating()).toBe(5);
    });
  });

  describe('isLoggedIn getter', () => {
    it('should return true when logged in', () => {
      loginService.isLogged.and.returnValue(true);
      expect(component.isLoggedIn).toBe(true);
    });

    it('should return false when not logged in', () => {
      loginService.isLogged.and.returnValue(false);
      expect(component.isLoggedIn).toBe(false);
    });
  });

  describe('goBack', () => {
    it('should navigate to apartments page', () => {
      spyOn(router, 'navigate');
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/apartments']);
    });
  });
});