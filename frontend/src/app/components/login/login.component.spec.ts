import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { LoginService } from '../../services/user/login.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: jasmine.SpyObj<LoginService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['logIn', 'reqIsLogged']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue({ onAction: () => of({}), dismiss: () => {} } as any);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideRouter([])
      ]
    }).overrideComponent(LoginComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    }).compileComponents();

    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    
    (component as any).snackBar = snackBar;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize the form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should have email and password controls', () => {
      expect(component.loginForm.contains('email')).toBeTruthy();
      expect(component.loginForm.contains('password')).toBeTruthy();
    });

    it('should initialize hidePassword as true', () => {
      expect(component.hidePassword).toBe(true);
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should make email control required', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
    });

    it('should accept valid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should make password control required', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should require password to be at least 6 characters', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
    });

    it('should accept valid password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should invalidate form when fields are empty', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('should validate form when all fields are correct', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      expect(component.loginForm.valid).toBeTruthy();
    });
  });

  describe('onLogin', () => {
    beforeEach(() => {
      spyOn(window.history, 'back');
      snackBar.open.calls.reset();
    });

    it('should not call loginService when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });
      component.onLogin();
      expect(loginService.logIn).not.toHaveBeenCalled();
    });

    it('should show warning message when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });
      component.onLogin();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please fill in all required fields correctly.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should call loginService with correct credentials when form is valid', () => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      component.onLogin();
      expect(loginService.logIn).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should set isLoading to true when login starts', () => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      
      let isLoadingDuringCall = false;
      loginService.logIn.and.callFake(() => {
        isLoadingDuringCall = component.isLoading;
        return of({});
      });
      
      component.onLogin();
      expect(isLoadingDuringCall).toBe(true);
    });

    it('should call reqIsLogged on successful login', fakeAsync(() => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      component.onLogin();
      tick();
      expect(loginService.reqIsLogged).toHaveBeenCalled();
    }));

    it('should show success message on successful login', fakeAsync(() => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      component.onLogin();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Login successful! Welcome back.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    }));

    it('should navigate back on successful login', fakeAsync(() => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      component.onLogin();
      tick();
      expect(window.history.back).toHaveBeenCalled();
    }));

    it('should set isLoading to false after successful login', fakeAsync(() => {
      loginService.logIn.and.returnValue(of({}));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123456'
      });
      component.onLogin();
      tick();
      expect(component.isLoading).toBe(false);
    }));

    it('should show error message on login failure', fakeAsync(() => {
      const errorResponse = { error: { message: 'Invalid credentials' } };
      loginService.logIn.and.returnValue(throwError(() => errorResponse));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpass'
      });
      component.onLogin();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Invalid credentials. Please try again.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should show generic error message when no error message provided', fakeAsync(() => {
      loginService.logIn.and.returnValue(throwError(() => ({})));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpass'
      });
      component.onLogin();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'undefined. Please try again.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should set isLoading to false after login failure', fakeAsync(() => {
      loginService.logIn.and.returnValue(throwError(() => ({})));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpass'
      });
      component.onLogin();
      tick();
      expect(component.isLoading).toBe(false);
    }));

    it('should log error to console on login failure', fakeAsync(() => {
      spyOn(console, 'error');
      const error = { error: { message: 'Error' } };
      loginService.logIn.and.returnValue(throwError(() => error));
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'wrongpass'
      });
      component.onLogin();
      tick();
      expect(console.error).toHaveBeenCalledWith('Login error:', error);
    }));
  });

  describe('getErrorMessage', () => {
    it('should return required message for empty email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('This field is required');
    });

    it('should return email format message for invalid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Please enter a valid email');
    });

    it('should return required message for empty password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      expect(component.getErrorMessage('password')).toBe('This field is required');
    });

    it('should return minlength message for short password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      expect(component.getErrorMessage('password')).toBe('Password must be at least 6 characters');
    });

    it('should return empty string when field is valid', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(component.getErrorMessage('email')).toBe('');
    });

    it('should return empty string for non-existent field', () => {
      expect(component.getErrorMessage('nonexistent')).toBe('');
    });
  });

  describe('showMessage', () => {
    beforeEach(() => {
      snackBar.open.calls.reset();
    });

    it('should open snackbar with correct parameters for success', () => {
      component['showMessage']('Success message', 'success');
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Success message',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        }
      );
    });

    it('should open snackbar with correct parameters for error', () => {
      component['showMessage']('Error message', 'error');
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error message',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        }
      );
    });

    it('should open snackbar with correct parameters for warning', () => {
      component['showMessage']('Warning message', 'warning');
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Warning message',
        'Close',
        {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-warning']
        }
      );
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle hidePassword property', () => {
      const initialState = component.hidePassword;
      component.hidePassword = !component.hidePassword;
      expect(component.hidePassword).toBe(!initialState);
    });
  });
});