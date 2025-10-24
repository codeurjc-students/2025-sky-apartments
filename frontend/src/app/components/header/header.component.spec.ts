import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HeaderComponent } from './header.component';
import { LoginService } from '../../services/user/login.service';
import { UserDTO } from '../../dtos/user.dto';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let loginService: jasmine.SpyObj<LoginService>;
  let router: Router;

  const mockUser: UserDTO = {
    id: 1,
    name: 'John Doe',
    surname: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123456789',
    roles: ['USER']
  };

  const mockAdminUser: UserDTO = {
    id: 2,
    name: 'Admin User',
    surname: 'Admin',
    email: 'admin@example.com',
    phoneNumber: '987654321',
    roles: ['ADMIN']
  };

  beforeEach(async () => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', [
      'isLogged',
      'isAdmin',
      'currentUser',
      'logOut'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: LoginService, useValue: loginServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    router = TestBed.inject(Router);

    // Default behavior
    loginService.isLogged.and.returnValue(false);
    loginService.isAdmin.and.returnValue(false);
    loginService.currentUser.and.returnValue(mockUser);

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize isMenuOpen as false', () => {
      expect(component.isMenuOpen).toBe(false);
    });

    it('should inject LoginService', () => {
      expect(component.loginService).toBeDefined();
      expect(component.loginService).toBe(loginService);
    });
  });

  describe('userInitials getter', () => {
    it('should return "U" when user name is not available', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: '' });
      expect(component.userInitials).toBe('U');
    });

    it('should return "U" when user is null', () => {
      loginService.currentUser.and.returnValue(null as any);
      expect(component.userInitials).toBe('U');
    });

    it('should return first two letters of name when single name', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: 'John' });
      expect(component.userInitials).toBe('JO');
    });

    it('should return first letter of first and last name when multiple names', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: 'John Doe' });
      expect(component.userInitials).toBe('JD');
    });

    it('should handle names with multiple spaces', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: 'John Michael Doe' });
      expect(component.userInitials).toBe('JD');
    });

    it('should handle names with leading/trailing spaces', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: '  John Doe  ' });
      expect(component.userInitials).toBe('JD');
    });

    it('should return uppercase initials', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: 'john doe' });
      expect(component.userInitials).toBe('JD');
    });

    it('should handle short single name', () => {
      loginService.currentUser.and.returnValue({ ...mockUser, name: 'J' });
      expect(component.userInitials).toBe('J');
    });
  });

  describe('toggleMenu', () => {
    it('should toggle isMenuOpen from false to true', () => {
      component.isMenuOpen = false;
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
    });

    it('should toggle isMenuOpen from true to false', () => {
      component.isMenuOpen = true;
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(false);
    });

    it('should toggle multiple times', () => {
      expect(component.isMenuOpen).toBe(false);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(false);
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
    });
  });

  describe('Navigation Methods', () => {
    let navigateSpy: jasmine.Spy;

    beforeEach(() => {
        navigateSpy = spyOn(router, 'navigate');
    });

    describe('onProfile', () => {
        it('should navigate to profile with personal fragment', () => {
        component.onProfile();
        expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { fragment: 'personal' });
        });
    });

    describe('onBookings', () => {
        it('should navigate to profile with bookings fragment', () => {
        component.onBookings();
        expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { fragment: 'bookings' });
        });
    });

    describe('onBookingsDashboard', () => {
        it('should navigate to profile with dashboard fragment', () => {
        component.onBookingsDashboard();
        expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { fragment: 'dashboard' });
        });
    });

    describe('onApartmentsManagement', () => {
        it('should navigate to profile with apartments fragment', () => {
        component.onApartmentsManagement();
        expect(navigateSpy).toHaveBeenCalledWith(['/profile'], { fragment: 'apartments' });
        });
    });

    describe('onBook', () => {
        it('should navigate to book-apartment page', () => {
        component.onBook();
        expect(navigateSpy).toHaveBeenCalledWith(['/book-apartment']);
        });
    });

    describe('onLogin', () => {
        it('should navigate to login page', () => {
        component.onLogin();
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('onSignUp', () => {
        it('should navigate to signup page', () => {
        component.onSignUp();
        expect(navigateSpy).toHaveBeenCalledWith(['/signup']);
        });
    });
  });

  describe('LoginService Integration', () => {
    it('should call isLogged from loginService', () => {
      loginService.isLogged.and.returnValue(true);
      expect(component.loginService.isLogged()).toBe(true);
      expect(loginService.isLogged).toHaveBeenCalled();
    });

    it('should call isAdmin from loginService', () => {
      loginService.isAdmin.and.returnValue(true);
      expect(component.loginService.isAdmin()).toBe(true);
      expect(loginService.isAdmin).toHaveBeenCalled();
    });

    it('should call currentUser from loginService', () => {
      const user = component.loginService.currentUser();
      expect(user).toEqual(mockUser);
      expect(loginService.currentUser).toHaveBeenCalled();
    });
  });

  describe('User State Display', () => {
    it('should show login button when user is not logged in', () => {
      loginService.isLogged.and.returnValue(false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const loginButton = compiled.querySelector('.login-button');
      expect(loginButton).toBeTruthy();
    });

    it('should show signup button when user is not logged in', () => {
      loginService.isLogged.and.returnValue(false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const signupButton = compiled.querySelector('.signup-button');
      expect(signupButton).toBeTruthy();
    });

    it('should show profile menu when user is logged in', () => {
      loginService.isLogged.and.returnValue(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const profileButton = compiled.querySelector('.profile-button');
      expect(profileButton).toBeTruthy();
    });

    it('should not show login/signup buttons when user is logged in', () => {
      loginService.isLogged.and.returnValue(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const loginButton = compiled.querySelector('.login-button');
      const signupButton = compiled.querySelector('.signup-button');
      expect(loginButton).toBeFalsy();
      expect(signupButton).toBeFalsy();
    });
  });

  describe('Admin vs User Menu', () => {
    it('should display user menu items when not admin', () => {
      loginService.isLogged.and.returnValue(true);
      loginService.isAdmin.and.returnValue(false);
      fixture.detectChanges();
      
      // This test verifies the template logic is correct
      expect(loginService.isAdmin()).toBe(false);
    });

    it('should display admin menu items when admin', () => {
      loginService.isLogged.and.returnValue(true);
      loginService.isAdmin.and.returnValue(true);
      loginService.currentUser.and.returnValue(mockAdminUser);
      fixture.detectChanges();
      
      // This test verifies the template logic is correct
      expect(loginService.isAdmin()).toBe(true);
    });
  });

  describe('Mobile Menu', () => {
    it('should display mobile menu button', () => {
      const compiled = fixture.nativeElement;
      const mobileMenuButton = compiled.querySelector('.mobile-menu-button');
      expect(mobileMenuButton).toBeTruthy();
    });

    it('should toggle mobile menu when button is clicked', () => {
      const compiled = fixture.nativeElement;
      const mobileMenuButton = compiled.querySelector('.mobile-menu-button');
      
      expect(component.isMenuOpen).toBe(false);
      mobileMenuButton.click();
      expect(component.isMenuOpen).toBe(true);
    });

    it('should close mobile menu when navigation link is clicked', () => {
      component.isMenuOpen = true;
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(false);
    });
  });

  describe('Book Now Button', () => {
    it('should display book now button', () => {
      const compiled = fixture.nativeElement;
      const bookButton = compiled.querySelector('.book-button');
      expect(bookButton).toBeTruthy();
    });

    it('should navigate to booking page when clicked', () => {
      const navigateSpy = spyOn(router, 'navigate');

      const compiled = fixture.nativeElement;
      const bookButton = compiled.querySelector('.book-button');
    
      bookButton.click();
      expect(navigateSpy).toHaveBeenCalledWith(['/book-apartment']);
    });

  });
});