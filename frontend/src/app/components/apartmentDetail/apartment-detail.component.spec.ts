import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApartmentDetailComponent } from './apartment-detail.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { LoginService } from '../../services/user/login.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('ApartmentDetailComponent', () => {
  let component: ApartmentDetailComponent;
  let fixture: ComponentFixture<ApartmentDetailComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Test Apartment',
    description: 'A beautiful test apartment',
    price: 100,
    services: new Set(['WiFi', 'AC', 'Kitchen']),
    capacity: 4,
    imageUrl: 'test.jpg'
  };

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getApartmentById',
      'checkAvailability'
    ]);
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['isLogged']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
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
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([])
      ]
    }).overrideComponent(ApartmentDetailComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    apartmentService.getApartmentById.and.returnValue(of(mockApartment));
    apartmentService.checkAvailability.and.returnValue(of(true));
    loginService.isLogged.and.returnValue(true);

    fixture = TestBed.createComponent(ApartmentDetailComponent);
    component = fixture.componentInstance;
    
    (component as any).snackBar = snackBar;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.apartment).toBeNull();
      expect(component.isLoading).toBe(true);
      expect(component.isCheckingAvailability).toBe(false);
      expect(component.isAvailable).toBe(false);
      expect(component.hasCheckedAvailability).toBe(false);
      expect(component.totalPrice).toBe(0);
      expect(component.numberOfNights).toBe(0);
    });

    it('should initialize booking form with validators', () => {
      expect(component.bookingForm.get('checkIn')?.hasError('required')).toBe(true);
      expect(component.bookingForm.get('checkOut')?.hasError('required')).toBe(true);
      expect(component.bookingForm.get('guests')?.hasError('required')).toBe(true);
    });

    it('should set minDate to today', () => {
      const today = new Date();
      expect(component.minDate.toDateString()).toBe(today.toDateString());
    });

    it('should set maxDate to 12 months from now', () => {
      const maxExpected = new Date();
      maxExpected.setMonth(maxExpected.getMonth() + 12);
      expect(component.maxDate.getMonth()).toBe(maxExpected.getMonth());
    });

    it('should initialize guestsOptions as empty array', () => {
      expect(component.guestsOptions).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should watch for form value changes', () => {
      component.hasCheckedAvailability = true;
      component.isAvailable = true;
      component.totalPrice = 500;
      component.numberOfNights = 5;
      
      fixture.detectChanges();
      component.ngOnInit();
      
      component.bookingForm.patchValue({ checkIn: new Date() });
      
      expect(component.hasCheckedAvailability).toBe(false);
      expect(component.isAvailable).toBe(false);
      expect(component.totalPrice).toBe(0);
      expect(component.numberOfNights).toBe(0);
    });
  });

  describe('loadApartment', () => {
    it('should load apartment by id', () => {
      component.loadApartment(1);
      expect(apartmentService.getApartmentById).toHaveBeenCalledWith(1);
    });

    it('should set apartment data on success', (done) => {
      component.loadApartment(1);
      
      setTimeout(() => {
        expect(component.apartment).toEqual(mockApartment);
        done();
      }, 100);
    });

    it('should call generateGuestsOptions on success', (done) => {
      spyOn(component, 'generateGuestsOptions');
      component.loadApartment(1);
      
      setTimeout(() => {
        expect(component.generateGuestsOptions).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set isLoading to false on success', (done) => {
      component.loadApartment(1);
      
      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      }, 100);
    });

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

    it('should use default error code 500 if not provided', () => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      apartmentService.getApartmentById.and.returnValue(
        throwError(() => ({}))
      );
      
      component.loadApartment(1);
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Apartment not found',
          code: 500
        }
      });
    });
  });

  describe('generateGuestsOptions', () => {
    it('should generate array of guest options based on capacity', () => {
      component.apartment = mockApartment;
      component.generateGuestsOptions();
      
      expect(component.guestsOptions).toEqual([1, 2, 3, 4]);
    });

    it('should set default guests to 1', () => {
      component.apartment = mockApartment;
      component.generateGuestsOptions();
      
      expect(component.bookingForm.get('guests')?.value).toBe(1);
    });

    it('should handle apartment with capacity 1', () => {
      component.apartment = { ...mockApartment, capacity: 1 };
      component.generateGuestsOptions();
      
      expect(component.guestsOptions).toEqual([1]);
    });

    it('should handle apartment with high capacity', () => {
      component.apartment = { ...mockApartment, capacity: 10 };
      component.generateGuestsOptions();
      
      expect(component.guestsOptions.length).toBe(10);
      expect(component.guestsOptions[9]).toBe(10);
    });
  });

  describe('isLoggedIn getter', () => {
    it('should return true when user is logged in', () => {
      loginService.isLogged.and.returnValue(true);
      expect(component.isLoggedIn).toBe(true);
    });

    it('should return false when user is not logged in', () => {
      loginService.isLogged.and.returnValue(false);
      expect(component.isLoggedIn).toBe(false);
    });
  });

  describe('checkAvailability', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.bookingForm.patchValue({
        checkIn: new Date('2025-10-20'),
        checkOut: new Date('2025-10-25'),
        guests: 2
      });
      snackBar.open.calls.reset();
    });

    it('should show warning if form is invalid', () => {
      component.bookingForm.patchValue({ checkIn: null });
      component.checkAvailability();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please select both check-in and check-out dates',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should show warning if apartment is null', () => {
      component.apartment = null;
      component.checkAvailability();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please select both check-in and check-out dates',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should show warning if check-out is not after check-in', () => {
      component.bookingForm.patchValue({
        checkIn: new Date('2025-10-25'),
        checkOut: new Date('2025-10-20')
      });
      component.checkAvailability();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Check-out date must be after check-in date',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should set isCheckingAvailability to true', () => {
      let isCheckingDuringCall = false;
      apartmentService.checkAvailability.and.callFake(() => {
        isCheckingDuringCall = component.isCheckingAvailability;
        return of(true);
      });
      
      component.checkAvailability();
      expect(isCheckingDuringCall).toBe(true);
    });

    it('should call apartmentService.checkAvailability', () => {
      component.checkAvailability();
      
      expect(apartmentService.checkAvailability).toHaveBeenCalledWith(
        1,
        '2025-10-20',
        '2025-10-25'
      );
    });

    it('should set isAvailable on success', fakeAsync(() => {
      component.checkAvailability();
      tick();
      
      expect(component.isAvailable).toBe(true);
    }));

    it('should set hasCheckedAvailability to true', fakeAsync(() => {
      component.checkAvailability();
      tick();
      
      expect(component.hasCheckedAvailability).toBe(true);
    }));

    it('should set isCheckingAvailability to false after check', fakeAsync(() => {
      component.checkAvailability();
      tick();
      
      expect(component.isCheckingAvailability).toBe(false);
    }));

    it('should calculate price when available', fakeAsync(() => {
      spyOn(component, 'calculatePrice');
      component.checkAvailability();
      tick();
      
      expect(component.calculatePrice).toHaveBeenCalled();
    }));

    it('should show success message when available', fakeAsync(() => {
      component.checkAvailability();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Apartment is available for selected dates!',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    }));

    it('should show error message when not available', fakeAsync(() => {
      apartmentService.checkAvailability.and.returnValue(of(false));
      component.checkAvailability();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Sorry, apartment is not available for these dates',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should navigate to error page on service failure', fakeAsync(() => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      apartmentService.checkAvailability.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );
      
      component.checkAvailability();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Server error',
          code: 500
        }
      });
    }));

    it('should use default error message if not provided', fakeAsync(() => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      apartmentService.checkAvailability.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.checkAvailability();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Error checking availability',
          code: 500
        }
      });
    }));
  });

  describe('calculatePrice', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
    });

    it('should calculate number of nights correctly', () => {
      component.bookingForm.patchValue({
        checkIn: new Date('2025-10-20'),
        checkOut: new Date('2025-10-25')
      });
      
      component.calculatePrice();
      
      expect(component.numberOfNights).toBe(5);
    });

    it('should calculate total price correctly', () => {
      component.bookingForm.patchValue({
        checkIn: new Date('2025-10-20'),
        checkOut: new Date('2025-10-25')
      });
      
      component.calculatePrice();
      
      expect(component.totalPrice).toBe(500); // 100 * 5
    });

    it('should not calculate if apartment is null', () => {
      component.apartment = null;
      component.calculatePrice();
      
      expect(component.numberOfNights).toBe(0);
      expect(component.totalPrice).toBe(0);
    });

    it('should handle single night booking', () => {
      const checkIn = new Date('2025-10-20T10:00:00');
      const checkOut = new Date('2025-10-21T11:00:00');
      component.bookingForm.patchValue({ checkIn, checkOut });
      
      component.calculatePrice();
      
      expect(component.numberOfNights).toBeGreaterThanOrEqual(1);
    });
  });

  describe('proceedToBooking', () => {
    beforeEach(() => {
      component.apartment = mockApartment;
      component.hasCheckedAvailability = true;
      component.isAvailable = true;
      loginService.isLogged.and.returnValue(true);
      component.bookingForm.patchValue({
        checkIn: new Date('2025-10-20'),
        checkOut: new Date('2025-10-25'),
        guests: 2
      });
      snackBar.open.calls.reset();
    });

    it('should show warning and navigate to login if not logged in', () => {
      spyOn(router, 'navigate');
      loginService.isLogged.and.returnValue(false);
      
      component.proceedToBooking();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please log in to make a reservation',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should show warning if availability not checked', () => {
      component.hasCheckedAvailability = false;
      
      component.proceedToBooking();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please check availability first',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should show warning if not available', () => {
      component.isAvailable = false;
      
      component.proceedToBooking();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please check availability first',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should navigate to booking page with query params', () => {
      spyOn(router, 'navigate');
      
      component.proceedToBooking();
      
      expect(router.navigate).toHaveBeenCalledWith(['/booking'], {
        queryParams: {
          apartmentId: 1,
          checkIn: '2025-10-20',
          checkOut: '2025-10-25',
          guests: 2
        }
      });
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-10-20');
      expect(component.formatDate(date)).toBe('2025-10-20');
    });

    it('should pad single digit month', () => {
      const date = new Date('2025-03-15');
      expect(component.formatDate(date)).toBe('2025-03-15');
    });

    it('should pad single digit day', () => {
      const date = new Date('2025-10-05');
      expect(component.formatDate(date)).toBe('2025-10-05');
    });
  });

  describe('getServicesArray', () => {
    it('should return array of services', () => {
      component.apartment = mockApartment;
      const services = component.getServicesArray();
      
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBe(3);
      expect(services).toContain('WiFi');
      expect(services).toContain('AC');
      expect(services).toContain('Kitchen');
    });

    it('should return empty array if apartment is null', () => {
      component.apartment = null;
      const services = component.getServicesArray();
      
      expect(services).toEqual([]);
    });

    it('should return empty array if services is undefined', () => {
      component.apartment = { ...mockApartment, services: undefined as any };
      const services = component.getServicesArray();
      
      expect(services).toEqual([]);
    });
  });

  describe('goBack', () => {
    it('should navigate to apartments page', () => {
      spyOn(router, 'navigate');
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/apartments']);
    });
  });

  describe('showMessage', () => {
    beforeEach(() => {
      snackBar.open.calls.reset();
    });

    it('should open snackbar with success style', () => {
      component['showMessage']('Success', 'success');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Success',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    });

    it('should open snackbar with error style', () => {
      component['showMessage']('Error', 'error');
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    });

    it('should open snackbar with warning style', () => {
      component['showMessage']('Warning', 'warning');
      
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
    beforeEach((done) => {
      // Trigger ngOnInit to load apartment
      fixture.detectChanges();
      
      // Wait for apartment to load and set component state
      setTimeout(() => {
        component.apartment = mockApartment;
        component.isLoading = false;
        fixture.detectChanges();
        done();
      }, 150);
    });

    it('should show loading spinner when loading', () => {
      component.isLoading = true;
      component.apartment = null;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.loading-container mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show apartment details when loaded', () => {
      const detailContent = fixture.nativeElement.querySelector('.detail-content');
      expect(detailContent).toBeTruthy();
    });

    it('should display apartment name', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Test Apartment');
    });

    it('should display apartment price', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('$100');
    });

    it('should have check availability button', () => {
      const button = fixture.nativeElement.querySelector('.check-button');
      expect(button).toBeTruthy();
    });

    it('should have back button', () => {
      const backButton = fixture.nativeElement.querySelector('.back-button');
      expect(backButton).toBeTruthy();
    });
  });
});