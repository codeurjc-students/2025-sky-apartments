import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BookingConfirmationComponent } from './booking-confirmation.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { BookingService } from '../../services/booking/booking.service';
import { UserService } from '../../services/user/user.service';
import { FilterService } from '../../services/booking/filter.service';
import { of, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConditionType, DateType } from '../../dtos/filter.dto';

describe('BookingConfirmationComponent', () => {
  let component: BookingConfirmationComponent;
  let fixture: ComponentFixture<BookingConfirmationComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockApartmentService: jasmine.SpyObj<ApartmentService>;
  let mockBookingService: jasmine.SpyObj<BookingService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockFilterService: jasmine.SpyObj<FilterService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+34123456789',
    roles: ['USER']
  };

  const mockApartment = {
    id: 1,
    name: 'Luxury Apartment',
    description: 'A beautiful apartment in the city center',
    price: 100,
    services: new Set(['WiFi', 'Kitchen', 'Air Conditioning']),
    capacity: 4,
    imagesUrl: ['https://example.com/image1.jpg']
  };

  const mockQueryParams = {
    apartmentId: '1',
    checkIn: '2025-01-15',
    checkOut: '2025-01-20',
    guests: '2'
  };

  const mockFiltersResponse = {
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

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      queryParams: of(mockQueryParams)
    };
    mockApartmentService = jasmine.createSpyObj('ApartmentService', ['getApartmentById']);
    mockBookingService = jasmine.createSpyObj('BookingService', ['createBooking']);
    mockUserService = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    mockFilterService = jasmine.createSpyObj('FilterService', ['getApplicableFilters']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BookingConfirmationComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApartmentService, useValue: mockApartmentService },
        { provide: BookingService, useValue: mockBookingService },
        { provide: UserService, useValue: mockUserService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    mockUserService.getCurrentUser.and.returnValue(of(mockUser));
    mockApartmentService.getApartmentById.and.returnValue(of(mockApartment));
    mockFilterService.getApplicableFilters.and.returnValue(of(mockFiltersResponse));

    fixture = TestBed.createComponent(BookingConfirmationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user on initialization', () => {
      fixture.detectChanges();
      expect(mockUserService.getCurrentUser).toHaveBeenCalled();
      expect(component.user).toEqual(mockUser);
    });

    it('should navigate to login if user loading fails', () => {
      mockUserService.getCurrentUser.and.returnValue(
        throwError(() => ({ status: 401 }))
      );
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should parse query parameters correctly', () => {
      fixture.detectChanges();
      expect(component.apartmentId).toBe(1);
      expect(component.checkIn).toEqual(new Date('2025-01-15'));
      expect(component.checkOut).toEqual(new Date('2025-01-20'));
      expect(component.guests).toBe(2);
    });

    it('should navigate to error page if query parameters are invalid', () => {
      mockActivatedRoute.queryParams = of({});
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking parameters',
          code: 400
        }
      });
    });

    it('should calculate number of nights correctly', () => {
      fixture.detectChanges();
      expect(component.numberOfNights).toBe(5);
    });

    it('should load apartment details', () => {
      fixture.detectChanges();
      expect(mockApartmentService.getApartmentById).toHaveBeenCalledWith(1);
      expect(component.apartment).toEqual(mockApartment);
      expect(component.basePrice).toBe(500); // 100 * 5 nights
    });

    it('should navigate to error page if apartment loading fails', () => {
      mockApartmentService.getApartmentById.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      fixture.detectChanges();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load apartment details',
          code: 404
        }
      });
    });
  });

  describe('calculateNights', () => {
    it('should calculate the correct number of nights', () => {
      component.checkIn = new Date('2025-01-15');
      component.checkOut = new Date('2025-01-20');
      component.calculateNights();
      expect(component.numberOfNights).toBe(5);
    });

    it('should handle single night bookings', () => {
      component.checkIn = new Date('2025-01-15');
      component.checkOut = new Date('2025-01-16');
      component.calculateNights();
      expect(component.numberOfNights).toBe(1);
    });
  });

  describe('loadApplicableFilters', () => {
    beforeEach(() => {
      component.checkIn = new Date('2025-01-15');
      component.checkOut = new Date('2025-01-20');
      component.apartment = mockApartment;
    });

    it('should load applicable filters', () => {
      component.loadApplicableFilters();
      expect(mockFilterService.getApplicableFilters).toHaveBeenCalledWith(
        '2025-01-15',
        '2025-01-20'
      );
    });

    it('should not load filters if checkIn or checkOut is null', () => {
      component.checkIn = null;
      component.loadApplicableFilters();
      expect(mockFilterService.getApplicableFilters).not.toHaveBeenCalled();
    });

    it('should process filters correctly', () => {
      component.loadApplicableFilters();
      expect(component.appliedFilters.length).toBeGreaterThan(0);
    });

    it('should navigate to error page if filter loading fails', () => {
      mockFilterService.getApplicableFilters.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.loadApplicableFilters();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load applicable filters',
          code: 500
        }
      });
    });
  });

  describe('processFiltersForDisplay', () => {

    it('should calculate impact correctly for increments', () => {
      component.apartment = mockApartment;
      const result = component.processFiltersForDisplay(mockFiltersResponse);
      
      const weekendSurcharge = result.find(f => f.id === 1);
      // 100 * (20/100) * 2 nights = 40
      expect(weekendSurcharge?.impact).toBe(40);
    });

    it('should sort filters by impact', () => {
      component.apartment = mockApartment;
      const result = component.processFiltersForDisplay(mockFiltersResponse);
      
      // Verify sorting: higher impacts first
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].impact).toBeGreaterThanOrEqual(result[i + 1].impact);
      }
    });
  });

  describe('calculateTotals', () => {
    beforeEach(() => {
      component.basePrice = 500;
      component.appliedFilters = [
        {
          id: 1,
          name: 'Weekend Surcharge',
          description: 'Extra charge',
          increment: true,
          value: 15,
          nightsApplied: 2,
          impact: 30
        },
        {
          id: 2,
          name: 'Early Bird Discount',
          description: 'Discount',
          increment: false,
          value: 10,
          nightsApplied: 1,
          impact: -10
        }
      ];
    });

    it('should calculate total increments', () => {
      component.calculateTotals();
      expect(component.totalIncrements).toBe(30);
    });

    it('should calculate total discounts', () => {
      component.calculateTotals();
      expect(component.totalDiscounts).toBe(10);
    });

    it('should calculate final total price', () => {
      component.calculateTotals();
      expect(component.totalPrice).toBe(520); // 500 + 30 - 10
    });
  });

  describe('confirmBooking', () => {
    beforeEach(() => {
      fixture.detectChanges(); // Initialize component to set dates from query params
    });

    it('should create booking successfully', () => {
      const mockBooking = {
        id: 1,
        userId: 1,
        apartmentId: 1,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
        guests: 2,
        state: 'CONFIRMED',
        cost: 750,
        createdAt: new Date('2024-12-01')
      };
      mockBookingService.createBooking.and.returnValue(of(mockBooking));

      component.confirmBooking();

      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        userId: 1,
        apartmentId: 1,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-20'),
        guests: 2
      });
      expect(component.bookingConfirmed).toBeTrue();
      expect(component.bookingId).toBe(1);
    });

    it('should not create booking if user is null', () => {
      component.user = null;
      component.confirmBooking();
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should not create booking if checkIn is null', () => {
      component.checkIn = null;
      component.confirmBooking();
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should handle booking creation error', fakeAsync(() => {
      mockBookingService.createBooking.and.returnValue(
        throwError(() => ({ 
          status: 400,
          error: { message: 'Apartment not available' }
        }))
      );

      component.confirmBooking();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Apartment not available',
          code: 400
        }
      });
      expect(component.bookingInProgress).toBeFalse();
    }));

  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('Wednesday');
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2025');
    });

    it('should return empty string for null date', () => {
      expect(component.formatDate(null)).toBe('');
    });
  });

  describe('formatDateForAPI', () => {
    it('should format date for API correctly', () => {
      const date = new Date('2025-01-15');
      expect(component.formatDateForAPI(date)).toBe('2025-01-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date('2025-03-05');
      expect(component.formatDateForAPI(date)).toBe('2025-03-05');
    });
  });

  describe('navigation methods', () => {
    it('should navigate to my bookings', () => {
      component.goToMyBookings();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile'], { 
        fragment: 'bookings' 
      });
    });

    it('should navigate to apartments', () => {
      component.goToApartments();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/apartments']);
    });

    it('should navigate back to apartment details', () => {
      component.apartmentId = 1;
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/apartment', 1]);
    });
  });

  describe('getServicesArray', () => {
    it('should convert Set to Array', () => {
      const services = new Set(['WiFi', 'Kitchen', 'Air Conditioning']);
      const result = component.getServicesArray(services);
      expect(Array.isArray(result)).toBeTrue();
      expect(result.length).toBe(3);
      expect(result).toContain('WiFi');
    });
  });

  describe('template rendering', () => {

    it('should display booking details when loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.loading = false;
      component.bookingConfirmed = false;
      fixture.detectChanges();
      
      const bookingContent = fixture.nativeElement.querySelector('.booking-content');
      expect(bookingContent).toBeTruthy();
    }));

    it('should display success message when booking is confirmed', () => {
      component.loading = false;
      component.bookingConfirmed = true;
      component.bookingId = 123;
      fixture.detectChanges();
      
      const successContainer = fixture.nativeElement.querySelector('.success-container');
      expect(successContainer).toBeTruthy();
    });

    it('should display user information', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.loading = false;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John');
      expect(compiled.textContent).toContain('Doe');
      expect(compiled.textContent).toContain('john.doe@example.com');
    }));

    it('should display apartment information', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.loading = false;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Luxury Apartment');
    }));

    it('should disable confirm button when booking in progress', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.loading = false;
      component.bookingInProgress = true;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.confirm-button');
      expect(button.disabled).toBeTrue();
    }));

    it('should display savings badge when there are discounts', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.loading = false;
      component.totalDiscounts = 50;
      fixture.detectChanges();
      
      const savingsBadge = fixture.nativeElement.querySelector('.savings-badge');
      expect(savingsBadge).toBeTruthy();
      expect(savingsBadge.textContent).toContain('50.00');
    }));
  });
});