import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { BookingConfirmationComponent } from './booking-confirmation.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { BookingService } from '../../services/booking/booking.service';
import { UserService } from '../../services/user/user.service';
import { UserDTO } from '../../dtos/user.dto';
import { BookingRequestDTO } from '../../dtos/bookingRequest.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('BookingConfirmationComponent', () => {
  let component: BookingConfirmationComponent;
  let fixture: ComponentFixture<BookingConfirmationComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let bookingService: jasmine.SpyObj<BookingService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockUser: UserDTO = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    roles: ['USER']
  };

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Test Apartment',
    description: 'A beautiful test apartment',
    price: 100,
    services: new Set(['WiFi', 'AC', 'Kitchen']),
    capacity: 4,
    imageUrl: 'test.jpg'
  };

  const mockBooking = {
    id: 123,
    userId: 1,
    apartmentId: 1,
    startDate: new Date('2025-10-20'),
    endDate: new Date('2025-10-25'),
    guests: 2,
    cost: 500,
    state: 'CONFIRMED',
    createdAt: new Date()
  };

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', ['getApartmentById']);
    const bookingServiceSpy = jasmine.createSpyObj('BookingService', ['createBooking']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue({ onAction: () => of({}), dismiss: () => {} } as any);

    queryParamsSubject = new BehaviorSubject({});
    const activatedRouteStub = {
      queryParams: queryParamsSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        BookingConfirmationComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([
          { path: 'error', component: BookingConfirmationComponent },
          { path: 'login', component: BookingConfirmationComponent },
          { path: 'profile', component: BookingConfirmationComponent },
          { path: 'apartments', component: BookingConfirmationComponent },
          { path: 'apartment/:id', component: BookingConfirmationComponent }
        ])
      ]
    }).overrideComponent(BookingConfirmationComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    bookingService = TestBed.inject(BookingService) as jasmine.SpyObj<BookingService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    userService.getCurrentUser.and.returnValue(of(mockUser));
    apartmentService.getApartmentById.and.returnValue(of(mockApartment));
    bookingService.createBooking.and.returnValue(of(mockBooking));
  });


  function createComponentWithParams(params: any) {
    queryParamsSubject.next(params);
    fixture = TestBed.createComponent(BookingConfirmationComponent);
    component = fixture.componentInstance;
    (component as any).snackBar = snackBar;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponentWithParams({});
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
      
      expect(component.apartment).toBeNull();
      expect(component.user).toBeNull();
      expect(component.apartmentId).toBe(0);
      expect(component.checkIn).toBeNull();
      expect(component.checkOut).toBeNull();
      expect(component.guests).toBe(0);
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
      expect(component.loading).toBe(true);
      expect(component.bookingInProgress).toBe(false);
      expect(component.bookingConfirmed).toBe(false);
      expect(component.bookingId).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should load current user', () => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      expect(userService.getCurrentUser).toHaveBeenCalled();
    });

    it('should set user data on successful load', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      expect(component.user).toEqual(mockUser);
    }));

    it('should navigate to login on user load error', fakeAsync(() => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      userService.getCurrentUser.and.returnValue(throwError(() => new Error('Failed')));
      
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should navigate to error if apartmentId is missing', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      createComponentWithParams({
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking parameters',
          code: 400
        }
      });
    }));

    it('should navigate to error if checkIn is missing', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      createComponentWithParams({
        apartmentId: '1',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking parameters',
          code: 400
        }
      });
    }));

    it('should navigate to error if checkOut is missing', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        guests: '2'
      });
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking parameters',
          code: 400
        }
      });
    }));

    it('should navigate to error if guests is missing', fakeAsync(() => {
      spyOn(router, 'navigate');
      
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25'
      });
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking parameters',
          code: 400
        }
      });
    }));
  });

  describe('calculateNights', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should calculate number of nights correctly', () => {
      component.checkIn = new Date('2025-10-20');
      component.checkOut = new Date('2025-10-25');
      
      component.calculateNights();
      
      expect(component.numberOfNights).toBe(5);
    });

    it('should handle same day check-in and check-out', () => {
      component.checkIn = new Date('2025-10-20');
      component.checkOut = new Date('2025-10-20');
      
      component.calculateNights();
      
      expect(component.numberOfNights).toBe(0);
    });

    it('should handle null checkIn', () => {
      component.checkIn = null;
      component.checkOut = new Date('2025-10-25');
      
      expect(() => component.calculateNights()).not.toThrow();
    });

    it('should handle null checkOut', () => {
      component.checkIn = new Date('2025-10-20');
      component.checkOut = null;
      
      expect(() => component.calculateNights()).not.toThrow();
    });

    it('should round up partial days', () => {
      const checkIn = new Date('2025-10-20T10:00:00');
      const checkOut = new Date('2025-10-22T15:00:00');
      component.checkIn = checkIn;
      component.checkOut = checkOut;
      
      component.calculateNights();
      
      expect(component.numberOfNights).toBeGreaterThanOrEqual(2);
    });
  });

  describe('loadApartmentDetails', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
      component.apartmentId = 1;
      component.numberOfNights = 5;
    });

    it('should load apartment by id', () => {
      component.loadApartmentDetails();
      expect(apartmentService.getApartmentById).toHaveBeenCalledWith(1);
    });

    it('should set apartment data on success', fakeAsync(() => {
      component.loadApartmentDetails();
      tick();
      
      expect(component.apartment).toEqual(mockApartment);
    }));

    it('should calculate total price', fakeAsync(() => {
      component.loadApartmentDetails();
      tick();
      
      expect(component.totalPrice).toBe(500); // 100 * 5 nights
    }));

    it('should set loading to false after success', fakeAsync(() => {
      component.loadApartmentDetails();
      tick();
      
      expect(component.loading).toBe(false);
    }));

    it('should navigate to error page on failure', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.getApartmentById.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      
      component.loadApartmentDetails();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load apartment details',
          code: 404
        }
      });
    }));

    it('should use default error code 500 if not provided', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.getApartmentById.and.returnValue(
        throwError(() => ({}))
      );
      
      component.loadApartmentDetails();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load apartment details',
          code: 500
        }
      });
    }));
  });

  describe('confirmBooking', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
      (component as any).snackBar = snackBar;
      component.user = mockUser;
      component.apartmentId = 1;
      component.checkIn = new Date('2025-10-20');
      component.checkOut = new Date('2025-10-25');
      component.guests = 2;
    });

    it('should not proceed if user is null', () => {
      component.user = null;
      component.confirmBooking();
      expect(bookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should not proceed if checkIn is null', () => {
      component.checkIn = null;
      component.confirmBooking();
      expect(bookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should not proceed if checkOut is null', () => {
      component.checkOut = null;
      component.confirmBooking();
      expect(bookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should create booking with correct data', () => {
      component.confirmBooking();
      
      const expectedRequest: BookingRequestDTO = {
        userId: 1,
        apartmentId: 1,
        startDate: new Date('2025-10-20'),
        endDate: new Date('2025-10-25'),
        guests: 2
      };
      
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userId: expectedRequest.userId,
          apartmentId: expectedRequest.apartmentId,
          guests: expectedRequest.guests
        })
      );
    });

    it('should set bookingConfirmed to true on success', fakeAsync(() => {
      component.confirmBooking();
      tick();
      
      expect(component.bookingConfirmed).toBe(true);
    }));

    it('should set bookingId on success', fakeAsync(() => {
      component.confirmBooking();
      tick();
      
      expect(component.bookingId).toBe(123);
    }));

    it('should set bookingInProgress to false on success', fakeAsync(() => {
      component.confirmBooking();
      tick();
      
      expect(component.bookingInProgress).toBe(false);
    }));

    it('should show success message', fakeAsync(() => {
      component.confirmBooking();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Booking confirmed successfully!',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    }));

    it('should set bookingInProgress to false on error', fakeAsync(() => {
      bookingService.createBooking.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.confirmBooking();
      tick();
      
      expect(component.bookingInProgress).toBe(false);
    }));

    it('should navigate to error page on failure', fakeAsync(() => {
      spyOn(router, 'navigate');
      bookingService.createBooking.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid booking' } }))
      );
      
      component.confirmBooking();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Invalid booking',
          code: 400
        }
      });
    }));

    it('should use default error message if not provided', fakeAsync(() => {
      spyOn(router, 'navigate');
      bookingService.createBooking.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.confirmBooking();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to create booking',
          code: 500
        }
      });
    }));
  });

  describe('goToMyBookings', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should navigate to profile with bookings fragment', () => {
      spyOn(router, 'navigate');
      component.goToMyBookings();
      expect(router.navigate).toHaveBeenCalledWith(['/profile'], { fragment: 'bookings' });
    });
  });

  describe('goToApartments', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should navigate to apartments page', () => {
      spyOn(router, 'navigate');
      component.goToApartments();
      expect(router.navigate).toHaveBeenCalledWith(['/apartments']);
    });
  });

  describe('goBack', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should navigate to apartment detail page', () => {
      spyOn(router, 'navigate');
      component.apartmentId = 5;
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/apartment', 5]);
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should format date correctly', () => {
      const date = new Date('2025-10-20');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('October');
    });

    it('should return empty string for null date', () => {
      const formatted = component.formatDate(null);
      expect(formatted).toBe('');
    });

    it('should include weekday in formatted date', () => {
      const date = new Date('2025-10-20');
      const formatted = component.formatDate(date);
      expect(formatted).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    });
  });

  describe('getServicesArray', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
    });

    it('should convert Set to Array', () => {
      const services = new Set(['WiFi', 'AC', 'Kitchen']);
      const array = component.getServicesArray(services);
      
      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(3);
      expect(array).toContain('WiFi');
      expect(array).toContain('AC');
      expect(array).toContain('Kitchen');
    });

    it('should handle empty Set', () => {
      const services = new Set<string>();
      const array = component.getServicesArray(services);
      
      expect(array.length).toBe(0);
    });
  });

  describe('showMessage', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BookingConfirmationComponent);
      component = fixture.componentInstance;
      (component as any).snackBar = snackBar;
      snackBar.open.calls.reset();
    });

    it('should open snackbar with success style', () => {
      component.showMessage('Success', 'success');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Success',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    });

    it('should open snackbar with error style', () => {
      component.showMessage('Error', 'error');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    });

    it('should open snackbar with warning style', () => {
      component.showMessage('Warning', 'warning');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Warning',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });
  });

  describe('Template Rendering', () => {
    it('should show loading spinner when loading', () => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      
      component.loading = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show booking content when not loading and not confirmed', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      component.loading = false;
      component.bookingConfirmed = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.querySelector('.booking-content');
      expect(content).toBeTruthy();
    }));

    it('should show success container when booking confirmed', () => {
      createComponentWithParams({});
      
      component.loading = false;
      component.bookingConfirmed = true;
      fixture.detectChanges();
      
      const success = fixture.nativeElement.querySelector('.success-container');
      expect(success).toBeTruthy();
    });

    it('should display user information', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      component.loading = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('John');
      expect(content).toContain('john@example.com');
    }));

    it('should display booking dates', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      component.loading = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Check-in');
      expect(content).toContain('Check-out');
    }));

    it('should have confirm booking button', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      component.loading = false;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.confirm-button');
      expect(button).toBeTruthy();
    }));

    it('should disable confirm button when booking in progress', fakeAsync(() => {
      createComponentWithParams({
        apartmentId: '1',
        checkIn: '2025-10-20',
        checkOut: '2025-10-25',
        guests: '2'
      });
      tick();
      
      component.loading = false;
      component.bookingInProgress = true;
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('.confirm-button');
      expect(button.disabled).toBe(true);
    }));
  });
});