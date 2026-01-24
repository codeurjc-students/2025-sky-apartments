import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { EMPTY, of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { LoginService } from '../../services/user/login.service';
import { UserService } from '../../services/user/user.service';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { UserDTO } from '../../dtos/user.dto';
import { BookingDTO } from '../../dtos/booking.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockBookingService: jasmine.SpyObj<BookingService>;
  let mockApartmentService: jasmine.SpyObj<ApartmentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let overlayContainer: OverlayContainer;

  const mockUser: UserDTO = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    email: 'john.doe@test.com',
    phoneNumber: '123456789',
    roles: ['USER']
  };

  const mockAdminUser: UserDTO = {
    id: 2,
    name: 'Admin',
    surname: 'User',
    email: 'admin@test.com',
    phoneNumber: '987654321',
    roles: ['ADMIN']
  };

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Luxury Apartment',
    description: 'Beautiful apartment',
    price: 100,
    services: new Set(['WiFi', 'Pool']),
    capacity: 4,
    imagesUrl: ['https://example.com/image.jpg']
  };

  const mockBooking: BookingDTO = {
    id: 1,
    userId: 1,
    apartmentId: 1,
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-11-05'),
    cost: 400,
    state: 'CONFIRMED',
    guests: 2,
    createdAt: new Date('2025-10-15')
  };

  beforeEach(async () => {
    mockLoginService = jasmine.createSpyObj('LoginService', ['isAdmin']);
    mockUserService = jasmine.createSpyObj('UserService', ['getCurrentUser', 'updateUser']);
    mockBookingService = jasmine.createSpyObj('BookingService', [
      'getBookingsByUserId',
      'updateBookingDates',
      'cancelBooking'
    ]);
    mockApartmentService = jasmine.createSpyObj('ApartmentService', [
      'getApartmentById',
      'getAllApartments',
      'deleteApartment'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockActivatedRoute = {
      fragment: of(null)
    };

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: LoginService, useValue: mockLoginService },
        { provide: UserService, useValue: mockUserService },
        { provide: BookingService, useValue: mockBookingService },
        { provide: ApartmentService, useValue: mockApartmentService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    overlayContainer = TestBed.inject(OverlayContainer);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load current user and initialize profile for regular user', fakeAsync(() => {
      mockUserService.getCurrentUser.and.returnValue(of(mockUser));
      mockLoginService.isAdmin.and.returnValue(false);
      mockBookingService.getBookingsByUserId.and.returnValue(of([mockBooking]));
      mockApartmentService.getApartmentById.and.returnValue(of(mockApartment));

      component.ngOnInit();
      tick();

      expect(component.user).toEqual(mockUser);
      expect(component.isAdmin).toBeFalse();
      expect(component.isLoading).toBeFalse();
      expect(mockBookingService.getBookingsByUserId).toHaveBeenCalledWith(1, 0, 10);
    }));

    it('should load current user and initialize profile for admin', fakeAsync(() => {
      mockUserService.getCurrentUser.and.returnValue(of(mockAdminUser));
      mockLoginService.isAdmin.and.returnValue(true);
      mockApartmentService.getAllApartments.and.returnValue(of([mockApartment]));

      component.ngOnInit();
      tick();

      expect(component.user).toEqual(mockAdminUser);
      expect(component.isAdmin).toBeTrue();
      expect(mockApartmentService.getAllApartments).toHaveBeenCalledWith(0, 10);
    }));

    it('should redirect to login on error loading user', fakeAsync(() => {
      mockUserService.getCurrentUser.and.returnValue(throwError(() => ({ status: 401 })));

      component.ngOnInit();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should navigate to correct tab based on fragment', fakeAsync(() => {
      mockActivatedRoute.fragment = of('bookings');
      mockUserService.getCurrentUser.and.returnValue(of(mockUser));
      mockLoginService.isAdmin.and.returnValue(false);
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));

      component.ngOnInit();
      tick(400);

      expect(component.selectedTabIndex).toBe(1);
    }));
  });

  describe('Profile Form', () => {
    beforeEach(() => {
      component.user = mockUser;
      mockLoginService.isAdmin.and.returnValue(false);
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));
      component.initializeProfile();
    });

    it('should initialize profile form with user data', () => {
      expect(component.profileForm.value).toEqual({
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@test.com',
        phoneNumber: '123456789',
        password: '',
        repeatPassword: ''
      });
    });

    it('should validate required fields', () => {
      component.profileForm.patchValue({
        name: '',
        surname: '',
        email: '',
        phoneNumber: ''
      });

      expect(component.profileForm.invalid).toBeTrue();
      expect(component.profileForm.get('name')?.hasError('required')).toBeTrue();
      expect(component.profileForm.get('surname')?.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      component.profileForm.patchValue({ email: 'invalid-email' });

      expect(component.profileForm.get('email')?.hasError('email')).toBeTrue();
    });

    it('should validate phone number pattern', () => {
      component.profileForm.patchValue({ phoneNumber: '123' });

      expect(component.profileForm.get('phoneNumber')?.hasError('pattern')).toBeTrue();
    });

    it('should validate password match', () => {
      component.profileForm.patchValue({
        password: 'password123',
        repeatPassword: 'different123'
      });

      expect(component.profileForm.hasError('passwordMismatch')).toBeTrue();
    });

    it('should validate password minimum length', () => {
      component.profileForm.patchValue({
        password: '12345',
        repeatPassword: '12345'
      });

      expect(component.profileForm.get('password')?.hasError('minlength')).toBeTrue();
    });
  });

  describe('toggleEditProfile', () => {
    beforeEach(() => {
      component.user = mockUser;
      mockLoginService.isAdmin.and.returnValue(false);
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));
      component.initializeProfile();
    });

    it('should toggle edit mode', () => {
      expect(component.isEditingProfile).toBeFalse();

      component.toggleEditProfile();
      expect(component.isEditingProfile).toBeTrue();

      component.toggleEditProfile();
      expect(component.isEditingProfile).toBeFalse();
    });

    it('should reset form when canceling edit', () => {
      component.toggleEditProfile();
      component.profileForm.patchValue({
        name: 'Changed Name',
        password: 'newpass123'
      });

      component.toggleEditProfile();

      expect(component.profileForm.get('name')?.value).toBe('John');
      expect(component.profileForm.get('password')?.value).toBe('');
    });
  });

  describe('saveProfile', () => {
    beforeEach(() => {
      component.user = mockUser;
      mockLoginService.isAdmin.and.returnValue(false);
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));
      component.initializeProfile();
      component.isEditingProfile = true;
    });

    it('should save profile successfully without password', fakeAsync(() => {
      const updatedUser = { ...mockUser, name: 'Jane' };
      mockUserService.updateUser.and.returnValue(of(updatedUser));

      component.profileForm.patchValue({ name: 'Jane' });
      component.saveProfile();
      tick();

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'Jane',
        surname: 'Doe',
        email: 'john.doe@test.com',
        phoneNumber: '123456789'
      }));

      const callArgs = mockUserService.updateUser.calls.mostRecent().args[1];
      expect(callArgs.password).toBeUndefined();
      expect(callArgs.repeatPassword).toBeUndefined();
      expect(component.user).toEqual(updatedUser);
      expect(component.isEditingProfile).toBeFalse();
    }));

    it('should save profile successfully with password', fakeAsync(() => {
      const updatedUser = { ...mockUser };
      mockUserService.updateUser.and.returnValue(of(updatedUser));

      component.profileForm.patchValue({
        password: 'newpass123',
        repeatPassword: 'newpass123'
      });
      component.saveProfile();
      tick();

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, jasmine.objectContaining({
        password: 'newpass123',
        repeatPassword: 'newpass123'
      }));
    }));

    it('should handle save error', fakeAsync(() => {
      mockUserService.updateUser.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );

      component.saveProfile();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], jasmine.any(Object));
    }));
  });

  describe('User Bookings', () => {
    beforeEach(() => {
      component.user = mockUser;
      component.isAdmin = false;
    });

    it('should load user bookings successfully', fakeAsync(() => {
      mockBookingService.getBookingsByUserId.and.returnValue(of([mockBooking]));
      mockApartmentService.getApartmentById.and.returnValue(of(mockApartment));

      component.loadUserBookings();
      tick();

      expect(component.userBookings.length).toBe(1);
      expect(component.userBookings[0].apartment).toEqual(mockApartment);
      expect(component.isLoadingBookings).toBeFalse();
    }));

    it('should handle pagination with loadMore', fakeAsync(() => {
      mockBookingService.getBookingsByUserId.and.returnValue(of([mockBooking]));
      mockApartmentService.getApartmentById.and.returnValue(of(mockApartment));

      component.loadUserBookings();
      tick();

      expect(component.currentPage).toBe(0);

      component.loadMore();
      tick();

      expect(component.currentPage).toBe(1);
      expect(mockBookingService.getBookingsByUserId).toHaveBeenCalledWith(1, 1, 10);
    }));

    it('should handle empty bookings', fakeAsync(() => {
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));

      component.loadUserBookings();
      tick();

      expect(component.userBookings.length).toBe(0);
      expect(component.hasMore).toBeFalse();
    }));

    it('should handle booking load error', fakeAsync(() => {
      mockBookingService.getBookingsByUserId.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Error' } }))
      );

      component.loadUserBookings();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], jasmine.any(Object));
    }));
  });

  describe('updateBooking', () => {
    beforeEach(() => {
      component.user = mockUser;
      // Spy on showMessage to prevent snackBar errors
      spyOn<any>(component, 'showMessage');
    });

    it('should update booking dates successfully', fakeAsync(() => {
      const updatedBooking = { ...mockBooking };
      mockBookingService.updateBookingDates.and.returnValue(of(updatedBooking));
      mockBookingService.getBookingsByUserId.and.returnValue(of([]));

      const newStartDate = new Date('2025-11-10');
      const newEndDate = new Date('2025-11-15');

      component.updateBooking(1, newStartDate, newEndDate);
      tick();

      expect(mockBookingService.updateBookingDates).toHaveBeenCalledWith(
        1,
        '2025-11-10',
        '2025-11-15'
      );
      expect((component as any).showMessage).toHaveBeenCalledWith(
        'Booking updated successfully',
        'success'
      );
    }));

    it('should handle update booking error', fakeAsync(() => {
      mockBookingService.updateBookingDates.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid dates' } }))
      );

      component.updateBooking(1, new Date(), new Date());
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error'], jasmine.any(Object));
    }));
  });

  describe('cancelBooking', () => {
    beforeEach(() => {
      component.user = mockUser;
      // Mock global Swal
      (window as any).Swal = {
        fire: jasmine.createSpy('fire')
      };
    });

    it('should not cancel if user declines', fakeAsync(() => {
      (window as any).Swal.fire.and.returnValue(
        Promise.resolve({ isConfirmed: false })
      );

      component.cancelBooking(1);
      tick();

      expect(mockBookingService.cancelBooking).not.toHaveBeenCalled();
    }));
  });

  describe('Admin Functions', () => {
    beforeEach(() => {
      component.user = mockAdminUser;
      component.isAdmin = true;
    });

    it('should load admin apartments', fakeAsync(() => {
      mockApartmentService.getAllApartments.and.returnValue(of([mockApartment]));

      component.loadAdminData();
      tick();

      expect(component.allApartments.length).toBe(1);
      expect(component.isLoadingAdminData).toBeFalse();
    }));

    it('should handle apartment pagination', fakeAsync(() => {
      mockApartmentService.getAllApartments.and.returnValue(of([mockApartment]));

      component.loadAdminData();
      tick();

      expect(component.aptCurrentPage).toBe(0);

      component.loadMoreApt();
      tick();

      expect(component.aptCurrentPage).toBe(1);
    }));

    it('should delete apartment successfully', fakeAsync(() => {
      spyOn<any>(component, 'showMessage');
      mockApartmentService.deleteApartment.and.returnValue(of(void 0));
      mockApartmentService.getAllApartments.and.returnValue(of([]));
      spyOn(window, 'confirm').and.returnValue(true);

      component.deleteApartment(1);
      tick();

      expect(mockApartmentService.deleteApartment).toHaveBeenCalledWith(1);
      expect((component as any).showMessage).toHaveBeenCalledWith(
        'Apartment deleted successfully',
        'success'
      );
    }));

    it('should not delete apartment if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteApartment(1);

      expect(mockApartmentService.deleteApartment).not.toHaveBeenCalled();
    });

    it('should navigate to add apartment page', () => {
      component.addApartment();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/apartments/new']);
    });

    it('should navigate to edit apartment page', () => {
      component.editApartment(mockApartment);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/apartments/edit', 1]);
    });
  });

  describe('Utility Functions', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-11-01');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('Nov');
      expect(formatted).toContain('2025');
    });

    it('should get correct status class', () => {
      expect(component.getStatusClass('CONFIRMED')).toBe('chip-confirmed');
      expect(component.getStatusClass('COMPLETED')).toBe('chip-completed');
      expect(component.getStatusClass('CANCELLED')).toBe('chip-cancelled');
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });

    it('should get correct error messages', () => {
      component.profileForm.get('email')?.setErrors({ required: true });
      expect(component.getProfileErrorMessage('email')).toBe('This field is required');

      component.profileForm.get('email')?.setErrors({ email: true });
      expect(component.getProfileErrorMessage('email')).toBe('Please enter a valid email');

      component.profileForm.get('phoneNumber')?.setErrors({ pattern: true });
      expect(component.getProfileErrorMessage('phoneNumber')).toBe('Please enter a valid phone number (9-15 digits)');

      component.profileForm.get('password')?.setErrors({ minlength: true });
      expect(component.getProfileErrorMessage('password')).toBe('Password must be at least 6 characters');

      component.profileForm.get('repeatPassword')?.setErrors({ passwordMismatch: true });
      expect(component.getProfileErrorMessage('repeatPassword')).toBe('Passwords do not match');
    });
  });

  describe('navigateToTab Admin', () => {
    it('should navigate to admin tabs correctly', fakeAsync(() => {
      component.isAdmin = true;

      const fragments = [
        { frag: 'dashboard', index: 0 },
        { frag: 'bookings', index: 1 },
        { frag: 'apartments', index: 2 },
        { frag: 'filters', index: 3 }
      ];

      fragments.forEach(item => {
        component.navigateToTab(item.frag);
        tick(300); // Necesario por el setTimeout de 300ms
        expect(component.selectedTabIndex).toBe(item.index, `Failed for fragment: ${item.frag}`);
      });
    }));

    it('should not change tab if fragment is null', fakeAsync(() => {
      component.selectedTabIndex = 5;
      component.navigateToTab(null);
      tick(300);
      expect(component.selectedTabIndex).toBe(5);
    }));
  });

  describe('loadAdminData branches', () => {
    it('should set aptHasMore to false when response is empty', fakeAsync(() => {
      mockApartmentService.getAllApartments.and.returnValue(of([]));
      
      component.loadAdminData();
      tick();

      expect(component.aptHasMore).toBeFalse();
      expect(component.allApartments.length).toBe(0);
    }));

    it('should set aptHasMore to false when receiving fewer items than pageSize', fakeAsync(() => {
      const fewApartments = new Array(5).fill(mockApartment);
      mockApartmentService.getAllApartments.and.returnValue(of(fewApartments));
      component.aptPageSize = 10;

      component.loadAdminData();
      tick();

      expect(component.aptHasMore).toBeFalse();
      expect(component.allApartments.length).toBe(5);
    }));

    it('should set aptHasMore to true when receiving exactly pageSize items', fakeAsync(() => {
      const fullPage = new Array(10).fill(mockApartment);
      mockApartmentService.getAllApartments.and.returnValue(of(fullPage));
      component.aptPageSize = 10;

      component.loadAdminData();
      tick();

      expect(component.aptHasMore).toBeTrue();
    }));

    it('should handle HTTP 204 error by setting aptHasMore to false', fakeAsync(() => {
      mockApartmentService.getAllApartments.and.returnValue(
        throwError(() => ({ status: 204 }))
      );

      component.loadAdminData();
      tick();

      expect(component.aptHasMore).toBeFalse();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));
  });
});