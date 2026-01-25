import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApartmentDetailComponent } from './apartment-detail.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { LoginService } from '../../services/user/login.service';
import { ReviewService } from '../../services/review/review.service';
import { UserService } from '../../services/user/user.service';
import { FilterService } from '../../services/booking/filter.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ReviewDTO } from '../../dtos/review.dto';
import { UserDTO } from '../../dtos/user.dto';
import { ConditionType, DateType } from '../../dtos/filter.dto';

describe('ApartmentDetailComponent', () => {
  let component: ApartmentDetailComponent;
  let fixture: ComponentFixture<ApartmentDetailComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let userService: jasmine.SpyObj<UserService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let router: jasmine.SpyObj<Router>;

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Beach Paradise',
    description: 'Beautiful beachfront apartment',
    price: 150,
    capacity: 4,
    imagesUrl: ['image1.jpg', 'image2.jpg'],
    services: new Set(['WiFi', 'Pool', 'Parking'])
  };

  const mockUser: UserDTO = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    roles: ['USER']
  };

  const mockReviews: ReviewDTO[] = [
    {
      id: 1,
      userId: 2,
      userName: 'Jane Smith',
      apartmentId: 1,
      rating: 5,
      comment: 'Amazing place!',
      date: new Date('2024-01-15')
    },
    {
      id: 2,
      userId: 3,
      userName: 'Bob Johnson',
      apartmentId: 1,
      rating: 4,
      comment: 'Very nice apartment',
      date: new Date('2024-01-10')
    }
  ];

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getApartmentById',
      'checkAvailability'
    ]);
    
    const loginServiceSpy = jasmine.createSpyObj('LoginService', [
      'isLogged',
      'currentUser'
    ]);
    
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', [
      'getReviewsByApartment',
      'getApartmentRating',
      'canUserReview',
      'createReview',
      'updateReview',
      'deleteReview'
    ]);
    
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getCurrentUser'
    ]);
    
    const filterServiceSpy = jasmine.createSpyObj('FilterService', [
      'getApplicableFilters'
    ]);
    
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ApartmentDetailComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture = TestBed.createComponent(ApartmentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load apartment on init', () => {
      apartmentService.getApartmentById.and.returnValue(of(mockApartment));
      reviewService.getReviewsByApartment.and.returnValue(of(mockReviews));
      reviewService.getApartmentRating.and.returnValue(of(4.5));
      userService.getCurrentUser.and.returnValue(of(mockUser));
      reviewService.canUserReview.and.returnValue(of(true));
      apartmentService.checkAvailability.and.returnValue(of(true));

      component.ngOnInit();

      expect(apartmentService.getApartmentById).toHaveBeenCalledWith(1);
      expect(component.apartment).toEqual(mockApartment);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle apartment not found error', () => {
      const error = { status: 404 };
      apartmentService.getApartmentById.and.returnValue(throwError(() => error));
      // Mock the review service to prevent errors
      reviewService.getReviewsByApartment.and.returnValue(of([]));
      reviewService.getApartmentRating.and.returnValue(of(0));
      userService.getCurrentUser.and.returnValue(of(mockUser));
      reviewService.canUserReview.and.returnValue(of(false));

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Apartment not found',
          code: 404
        }
      });
    });

    it('should generate guests options based on apartment capacity', () => {
      apartmentService.getApartmentById.and.returnValue(of(mockApartment));
      reviewService.getReviewsByApartment.and.returnValue(of([]));
      reviewService.getApartmentRating.and.returnValue(of(0));
      userService.getCurrentUser.and.returnValue(of(mockUser));
      reviewService.canUserReview.and.returnValue(of(false));
      apartmentService.checkAvailability.and.returnValue(of(true));

      component.ngOnInit();

      expect(component.guestsOptions).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Calendar', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.currentMonth = new Date(2024, 0, 15); // January 2024
    });

    it('should generate calendar days correctly', () => {
      component.generateCalendar();

      expect(component.calendarDays.length).toBe(42); // 6 weeks
      
      const currentMonthDays = component.calendarDays.filter(d => d.isCurrentMonth);
      expect(currentMonthDays.length).toBe(31); // January has 31 days
    });

    it('should mark today correctly', () => {
      const today = new Date();
      component.currentMonth = today;
      component.generateCalendar();

      const todayCell = component.calendarDays.find(d => d.isToday);
      expect(todayCell).toBeDefined();
      expect(todayCell?.day).toBe(today.getDate());
    });

    it('should mark past dates correctly', () => {
      component.generateCalendar();

      const pastDays = component.calendarDays.filter(d => d.isPast && d.isCurrentMonth);
      expect(pastDays.length).toBeGreaterThan(0);
    });

    it('should navigate to previous month', () => {
      component.currentMonth = new Date(2024, 1, 1); // February 2024
      spyOn(component, 'generateCalendar');
      spyOn(component, 'loadMonthAvailability');

      component.previousMonth();

      expect(component.currentMonth.getMonth()).toBe(0); // January
      expect(component.generateCalendar).toHaveBeenCalled();
      expect(component.loadMonthAvailability).toHaveBeenCalled();
    });

    it('should navigate to next month', () => {
      component.currentMonth = new Date(2024, 0, 1); // January 2024
      spyOn(component, 'generateCalendar');
      spyOn(component, 'loadMonthAvailability');

      component.nextMonth();

      expect(component.currentMonth.getMonth()).toBe(1); // February
      expect(component.generateCalendar).toHaveBeenCalled();
      expect(component.loadMonthAvailability).toHaveBeenCalled();
    });

    it('should get month/year label correctly', () => {
      component.currentMonth = new Date(2024, 0, 1);

      const label = component.getMonthYearLabel();

      expect(label).toContain('January');
      expect(label).toContain('2024');
    });
  });

  describe('Date Selection', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.generateCalendar();
    });

    it('should select check-in date on first click', () => {
      const availableDay = component.calendarDays.find(d => 
        d.isCurrentMonth && !d.isPast
      )!;
      availableDay.isAvailable = true;

      component.selectDate(availableDay);

      expect(component.selectedCheckIn).toBeTruthy();
      expect(component.selectedCheckOut).toBeNull();
    });

    it('should select check-out date on second click', () => {
      const mockFilterResponse = {
        checkInDate: '2026-06-15',
        checkOutDate: '2026-06-20',
        totalNights: 5,
        filtersByDate: {}
      };
      filterService.getApplicableFilters.and.returnValue(of(mockFilterResponse));
      
      component.currentMonth = new Date(2026, 5, 1); // June 2026
      component.generateCalendar();
      
      const futureDays = component.calendarDays.filter(d => 
        d.isCurrentMonth && !d.isPast
      );
      
      expect(futureDays.length).toBeGreaterThan(5);
      
      const firstDay = futureDays[0];
      const secondDay = futureDays[4];
      
      firstDay.isAvailable = true;
      secondDay.isAvailable = true;

      component.selectDate(firstDay);
      component.selectDate(secondDay);

      expect(component.selectedCheckIn).toBeTruthy();
      expect(component.selectedCheckOut).toBeTruthy();
      expect(component.selectedCheckOut! > component.selectedCheckIn!).toBeTrue();
    });

    it('should not select past dates', () => {
      const pastDay = component.calendarDays.find(d => d.isPast)!;

      component.selectDate(pastDay);

      expect(component.selectedCheckIn).toBeNull();
    });

    it('should not select unavailable dates', () => {
      const unavailableDay = component.calendarDays.find(d => 
        d.isCurrentMonth && !d.isPast
      )!;
      unavailableDay.isAvailable = false;

      component.selectDate(unavailableDay);

      expect(component.selectedCheckIn).toBeNull();
    });

    it('should clear dates', () => {
      component.selectedCheckIn = new Date();
      component.selectedCheckOut = new Date();
      component.numberOfNights = 5;
      component.totalPrice = 750;

      component.clearDates();

      expect(component.selectedCheckIn).toBeNull();
      expect(component.selectedCheckOut).toBeNull();
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
    });

    it('should calculate nights correctly', () => {
      component.selectedCheckIn = new Date(2024, 0, 15);
      component.selectedCheckOut = new Date(2024, 0, 20);

      component.calculateBookingSummary();

      expect(component.numberOfNights).toBe(5);
      expect(component.totalPrice).toBe(750); // 150 * 5
    });
  });

  describe('Booking', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.selectedCheckIn = new Date(2024, 6, 15);
      component.selectedCheckOut = new Date(2024, 6, 20);
      component.selectedGuests = 2;
    });

    it('should show message if dates not selected', () => {
      loginService.isLogged.and.returnValue(true);
      component.selectedCheckIn = null;

      component.proceedToBooking();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should show message if guests not selected', () => {
      loginService.isLogged.and.returnValue(true);
      component.selectedGuests = null;

      component.proceedToBooking();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should check availability and navigate to booking', fakeAsync(() => {
      loginService.isLogged.and.returnValue(true);
      apartmentService.checkAvailability.and.returnValue(of(true));

      component.proceedToBooking();
      tick();

      expect(apartmentService.checkAvailability).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/booking'], {
        queryParams: jasmine.objectContaining({
          apartmentId: 1,
          guests: 2
        })
      });
    }));

    it('should show error if apartment not available', fakeAsync(() => {
      loginService.isLogged.and.returnValue(true);
      apartmentService.checkAvailability.and.returnValue(of(false));
      spyOn(component, 'loadMonthAvailability');

      component.proceedToBooking();
      tick();


      expect(component.loadMonthAvailability).toHaveBeenCalled();
    }));
  });

  describe('Price Filters', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.selectedCheckIn = new Date(2024, 6, 15);
      component.selectedCheckOut = new Date(2024, 6, 20);
      component.numberOfNights = 5;
    });

    it('should load and process filters', () => {
      const mockFilterResponse = {
          "checkInDate": "2026-07-17",
          "checkOutDate": "2026-07-19",
          "totalNights": 2,
          "filtersByDate": {
              "2026-07-17": [
                  {
                      "id": 1,
                      "name": "Weekend Premium",
                      "description": "Price increase for Friday, Saturday and Sunday nights",
                      "activated": true,
                      "increment": true,
                      "value": 20.00,
                      "dateType": DateType.WEEK_DAYS,
                      "weekDays": "5,6,7",
                      "conditionType": ConditionType.NONE
                  }
              ],
              "2026-07-18": [
                  {
                      "id": 1,
                      "name": "Weekend Premium",
                      "description": "Price increase for Friday, Saturday and Sunday nights",
                      "activated": true,
                      "increment": true,
                      "value": 20.00,
                      "dateType": DateType.WEEK_DAYS,
                      "weekDays": "5,6,7",
                      "conditionType": ConditionType.NONE
                  }
              ]
          }
      };
      
      filterService.getApplicableFilters.and.returnValue(of(mockFilterResponse));

      component.calculatePriceWithFilters();

      expect(filterService.getApplicableFilters).toHaveBeenCalled();
      expect(component.appliedFilters.length).toBeGreaterThan(0);
    });

    it('should calculate totals with filters', () => {
      component.appliedFilters = [
        {
          id: 1,
          name: 'Weekend',
          increment: true,
          value: 20,
          nightsApplied: 2,
          impact: 60
        },
        {
          id: 2,
          name: 'Long Stay',
          increment: false,
          value: 10,
          nightsApplied: 5,
          impact: -75
        }
      ];

      component.calculateTotals();

      expect(component.basePrice).toBe(750); // 150 * 5
      expect(component.totalIncrements).toBe(60);
      expect(component.totalDiscounts).toBe(75);
      expect(component.totalPrice).toBe(735); // 750 + 60 - 75
    });

    it('should handle filter loading error gracefully', () => {
      const error = new Error('Filter service error');
      filterService.getApplicableFilters.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.calculatePriceWithFilters();

      expect(console.error).toHaveBeenCalledWith('Error loading filters:', error);
      expect(component.totalPrice).toBe(component.basePrice);
    });
  });

  describe('Reviews', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
    });

    it('should load reviews on init', () => {
      reviewService.getReviewsByApartment.and.returnValue(of(mockReviews));
      loginService.currentUser.and.returnValue(mockUser);

      component.loadReviews(1);

      expect(reviewService.getReviewsByApartment).toHaveBeenCalledWith(1, 0, 5);
      expect(component.reviews.length).toBe(2);
    });

    it('should separate user review from other reviews', () => {
      const userReview: ReviewDTO = {
        id: 3,
        userId: 1,
        userName: 'John Doe',
        apartmentId: 1,
        rating: 5,
        comment: 'My review',
        date: new Date()
      };
      
      loginService.currentUser.and.returnValue(mockUser);
      reviewService.getReviewsByApartment.and.returnValue(of([userReview, ...mockReviews]));

      component.loadReviews(1);

      expect(component.userReview).toEqual(userReview);
      expect(component.reviews.length).toBe(2);
      expect(component.reviews.find(r => r.id === 3)).toBeUndefined();
    });

    it('should load more reviews', () => {
      component.currentPage = 0;
      component.hasMoreReviews = true;
      reviewService.getReviewsByApartment.and.returnValue(of(mockReviews));

      component.loadMoreReviews();

      expect(component.currentPage).toBe(1);
      expect(reviewService.getReviewsByApartment).toHaveBeenCalledWith(1, 1, 5);
    });

    it('should check if user can review', () => {
      userService.getCurrentUser.and.returnValue(of(mockUser));
      reviewService.canUserReview.and.returnValue(of(true));

      component.checkIfUserCanReview(1);

      expect(userService.getCurrentUser).toHaveBeenCalled();
      expect(reviewService.canUserReview).toHaveBeenCalledWith(1, 1);
      expect(component.canReview).toBeTrue();
    });

    it('should toggle review form', () => {
      component.showReviewForm = false;

      component.toggleReviewForm();

      expect(component.showReviewForm).toBeTrue();
      expect(component.isEditingReview).toBeFalse();
    });

    it('should start edit review', () => {
      component.userReview = mockReviews[0];

      component.startEditReview();

      expect(component.isEditingReview).toBeTrue();
      expect(component.showReviewForm).toBeTrue();
      expect(component.reviewForm.value.rating).toBe(mockReviews[0].rating);
      expect(component.reviewForm.value.comment).toBe(mockReviews[0].comment);
    });

    it('should submit new review', () => {
      component.isEditingReview = false;
      component.reviewForm.setValue({ rating: 5, comment: 'Great place to stay!' });
      loginService.currentUser.and.returnValue(mockUser);
      reviewService.createReview.and.returnValue(of(mockReviews[0]));
      reviewService.getApartmentRating.and.returnValue(of(4.5));

      component.submitReview();

      expect(reviewService.createReview).toHaveBeenCalled();
      expect(component.showReviewForm).toBeFalse();
    });

    it('should update existing review', () => {
      component.userReview = mockReviews[0];
      component.isEditingReview = true;
      component.reviewForm.setValue({ rating: 4, comment: 'Updated comment' });
      reviewService.updateReview.and.returnValue(of(mockReviews[0]));
      reviewService.getApartmentRating.and.returnValue(of(4.5));

      component.submitReview();

      expect(reviewService.updateReview).toHaveBeenCalledWith(
        mockReviews[0].id,
        jasmine.objectContaining({
          rating: 4,
          comment: 'Updated comment'
        })
      );
    });

    it('should get star array correctly', () => {
      const stars = component.getStarArray(3);

      expect(stars).toEqual([true, true, true, false, false]);
    });

    it('should set rating', () => {
      component.setRating(4);

      expect(component.reviewForm.value.rating).toBe(4);
    });

    it('should format review date', () => {
      const date = new Date('2024-01-15');

      const formatted = component.formatReviewDate(date);

      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('Image Carousel', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
    });

    it('should navigate to next image', () => {
      component.currentImageIndex = 0;

      component.nextImage();

      expect(component.currentImageIndex).toBe(1);
    });

    it('should wrap to first image from last', () => {
      component.currentImageIndex = 1; // Last image

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

      expect(component.currentImageIndex).toBe(1);
    });

    it('should go to specific image', () => {
      component.goToImage(1);

      expect(component.currentImageIndex).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
    });

    it('should get services array', () => {
      const services = component.getServicesArray();

      expect(services.length).toBe(3);
      expect(services).toContain('WiFi');
      expect(services).toContain('Pool');
      expect(services).toContain('Parking');
    });

    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15);

      const formatted = component.formatDate(date);

      expect(formatted).toBe('2024-01-15');
    });

    it('should check if user is logged in', () => {
      loginService.isLogged.and.returnValue(true);

      expect(component.isLoggedIn).toBeTrue();
    });

    it('should navigate back to apartments list', () => {
      component.goBack();

      expect(router.navigate).toHaveBeenCalledWith(['/apartments']);
    });
  });
});