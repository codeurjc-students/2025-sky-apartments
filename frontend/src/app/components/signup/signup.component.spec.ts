import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SignUpComponent } from './signup.component';
import { UserService } from '../../services/user/user.service';
import { UserRequestDTO } from '../../dtos/userRequest.dto';
import { UserDTO } from '../../dtos/user.dto';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['createUser']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue({ onAction: () => of({}), dismiss: () => {} } as any);

    await TestBed.configureTestingModule({
      imports: [
        SignUpComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideRouter([])
      ]
    }).overrideComponent(SignUpComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    
    // Manually inject the spy into the component
    (component as any).snackBar = snackBar;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize the form with empty values', () => {
      expect(component.signUpForm.get('name')?.value).toBe('');
      expect(component.signUpForm.get('surname')?.value).toBe('');
      expect(component.signUpForm.get('email')?.value).toBe('');
      expect(component.signUpForm.get('phoneNumber')?.value).toBe('');
      expect(component.signUpForm.get('password')?.value).toBe('');
      expect(component.signUpForm.get('repeatPassword')?.value).toBe('');
    });

    it('should have all required form controls', () => {
      expect(component.signUpForm.contains('name')).toBeTruthy();
      expect(component.signUpForm.contains('surname')).toBeTruthy();
      expect(component.signUpForm.contains('email')).toBeTruthy();
      expect(component.signUpForm.contains('phoneNumber')).toBeTruthy();
      expect(component.signUpForm.contains('password')).toBeTruthy();
      expect(component.signUpForm.contains('repeatPassword')).toBeTruthy();
    });

    it('should initialize hidePassword as true', () => {
      expect(component.hidePassword).toBe(true);
    });

    it('should initialize hideConfirmPassword as true', () => {
      expect(component.hideConfirmPassword).toBe(true);
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should make name control required', () => {
      const nameControl = component.signUpForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBeTruthy();
    });

    it('should accept valid name', () => {
      const nameControl = component.signUpForm.get('name');
      nameControl?.setValue('John');
      expect(nameControl?.valid).toBeTruthy();
    });

    it('should make surname control required', () => {
      const surnameControl = component.signUpForm.get('surname');
      surnameControl?.setValue('');
      expect(surnameControl?.hasError('required')).toBeTruthy();
    });

    it('should accept valid surname', () => {
      const surnameControl = component.signUpForm.get('surname');
      surnameControl?.setValue('Doe');
      expect(surnameControl?.valid).toBeTruthy();
    });

    it('should make email control required', () => {
      const emailControl = component.signUpForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.signUpForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
    });

    it('should accept valid email', () => {
      const emailControl = component.signUpForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should make phoneNumber control required', () => {
      const phoneControl = component.signUpForm.get('phoneNumber');
      phoneControl?.setValue('');
      expect(phoneControl?.hasError('required')).toBeTruthy();
    });

    it('should validate phone number pattern (minimum 9 digits)', () => {
      const phoneControl = component.signUpForm.get('phoneNumber');
      phoneControl?.setValue('12345678');
      expect(phoneControl?.hasError('pattern')).toBeTruthy();
    });

    it('should validate phone number pattern (maximum 15 digits)', () => {
      const phoneControl = component.signUpForm.get('phoneNumber');
      phoneControl?.setValue('1234567890123456');
      expect(phoneControl?.hasError('pattern')).toBeTruthy();
    });

    it('should accept valid phone number', () => {
      const phoneControl = component.signUpForm.get('phoneNumber');
      phoneControl?.setValue('123456789');
      expect(phoneControl?.valid).toBeTruthy();
    });

    it('should make password control required', () => {
      const passwordControl = component.signUpForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should require password to be at least 6 characters', () => {
      const passwordControl = component.signUpForm.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();
    });

    it('should accept valid password', () => {
      const passwordControl = component.signUpForm.get('password');
      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should make repeatPassword control required', () => {
      const repeatPasswordControl = component.signUpForm.get('repeatPassword');
      repeatPasswordControl?.setValue('');
      expect(repeatPasswordControl?.hasError('required')).toBeTruthy();
    });

    it('should validate password match', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '654321'
      });
      expect(component.signUpForm.get('repeatPassword')?.hasError('passwordMismatch')).toBeTruthy();
    });

    it('should accept matching passwords', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '123456'
      });
      expect(component.signUpForm.get('repeatPassword')?.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should invalidate form when fields are empty', () => {
      expect(component.signUpForm.valid).toBeFalsy();
    });

    it('should validate form when all fields are correct', () => {
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      expect(component.signUpForm.valid).toBeTruthy();
    });
  });

  describe('passwordMatchValidator', () => {
    it('should return null when passwords match', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '123456'
      });
      const result = component.passwordMatchValidator(component.signUpForm);
      expect(result).toBeNull();
    });

    it('should return error object when passwords do not match', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '654321'
      });
      const result = component.passwordMatchValidator(component.signUpForm);
      expect(result).toEqual({ passwordMismatch: true });
    });

    it('should set error on repeatPassword control when passwords do not match', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '654321'
      });
      component.passwordMatchValidator(component.signUpForm);
      expect(component.signUpForm.get('repeatPassword')?.hasError('passwordMismatch')).toBeTruthy();
    });
  });

  describe('onSignUp', () => {
    beforeEach(() => {
      spyOn(router, 'navigate');
      snackBar.open.calls.reset();
    });

    it('should not call userService when form is invalid', () => {
      component.signUpForm.patchValue({
        name: '',
        surname: '',
        email: '',
        phoneNumber: '',
        password: '',
        repeatPassword: ''
      });
      component.onSignUp();
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should show warning message when form is invalid', () => {
      component.signUpForm.patchValue({
        name: '',
        surname: '',
        email: '',
        phoneNumber: '',
        password: '',
        repeatPassword: ''
      });
      component.onSignUp();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please fill in all required fields correctly.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-warning']
        })
      );
    });

    it('should call userService with correct data when form is valid', () => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      userService.createUser.and.returnValue(of(mockUser));

      const formData = {
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      };
      component.signUpForm.patchValue(formData);
      component.onSignUp();

      const expectedRequest: UserRequestDTO = {
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      };
      expect(userService.createUser).toHaveBeenCalledWith(expectedRequest);
    });

    it('should set isLoading to true when signup starts', () => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      let isLoadingDuringCall = false;

      userService.createUser.and.callFake(() => {
        isLoadingDuringCall = component.isLoading;
        return of(mockUser); // <-- importante
      });

      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });

      component.onSignUp();
      expect(isLoadingDuringCall).toBe(true);
    });


    it('should show success message on successful signup', fakeAsync(() => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      userService.createUser.and.returnValue(of(mockUser));

      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Account created successfully! Please log in.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-success']
        })
      );
    }));

    it('should reset form on successful signup', fakeAsync(() => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      userService.createUser.and.returnValue(of(mockUser));

      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(component.signUpForm.get('name')?.value).toBeNull();
      expect(component.signUpForm.get('email')?.value).toBeNull();
    }));

    it('should set isLoading to false after successful signup', fakeAsync(() => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      userService.createUser.and.returnValue(of(mockUser));

      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(component.isLoading).toBe(false);
    }));
    
    it('should navigate to login after successful signup', fakeAsync(() => {
      const mockUser: UserDTO = {
        id: 1,
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        roles: ["USER"]
      };

      userService.createUser.and.returnValue(of(mockUser));

      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });

      component.onSignUp();
      tick(1500);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));

    
    it('should show error message with status 409 (email exists)', fakeAsync(() => {
      const errorResponse = { status: 409, error: { message: 'Email already registered' } };
      userService.createUser.and.returnValue(throwError(() => errorResponse));
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Email already exists.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should show custom error message when provided', fakeAsync(() => {
      const errorResponse = { status: 400, error: { message: 'Invalid data provided' } };
      userService.createUser.and.returnValue(throwError(() => errorResponse));
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Invalid data provided',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should show generic error message when no specific message provided', fakeAsync(() => {
      userService.createUser.and.returnValue(throwError(() => ({})));
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(snackBar.open).toHaveBeenCalledTimes(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Registration failed. Please try again.',
        'Close',
        jasmine.objectContaining({
          panelClass: ['snackbar-error']
        })
      );
    }));

    it('should set isLoading to false after signup failure', fakeAsync(() => {
      userService.createUser.and.returnValue(throwError(() => ({})));
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(component.isLoading).toBe(false);
    }));

    it('should log error to console on signup failure', fakeAsync(() => {
      spyOn(console, 'error');
      const error = { status: 500, error: { message: 'Server error' } };
      userService.createUser.and.returnValue(throwError(() => error));
      component.signUpForm.patchValue({
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        phoneNumber: '123456789',
        password: '123456',
        repeatPassword: '123456'
      });
      component.onSignUp();
      tick();
      expect(console.error).toHaveBeenCalledWith('Sign up error:', error);
    }));
  });

  describe('getErrorMessage', () => {
    it('should return required message for empty name', () => {
      const nameControl = component.signUpForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      expect(component.getErrorMessage('name')).toBe('This field is required');
    });

    it('should return required message for empty surname', () => {
      const surnameControl = component.signUpForm.get('surname');
      surnameControl?.setValue('');
      surnameControl?.markAsTouched();
      expect(component.getErrorMessage('surname')).toBe('This field is required');
    });

    it('should return email format message for invalid email', () => {
      const emailControl = component.signUpForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Please enter a valid email');
    });

    it('should return pattern message for invalid phone number', () => {
      const phoneControl = component.signUpForm.get('phoneNumber');
      phoneControl?.setValue('123');
      phoneControl?.markAsTouched();
      expect(component.getErrorMessage('phoneNumber')).toBe('Please enter a valid phone number (9-15 digits)');
    });

    it('should return minlength message for short password', () => {
      const passwordControl = component.signUpForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      expect(component.getErrorMessage('password')).toBe('Must be at least 6 characters');
    });

    it('should return password mismatch message', () => {
      component.signUpForm.patchValue({
        password: '123456',
        repeatPassword: '654321'
      });
      const repeatPasswordControl = component.signUpForm.get('repeatPassword');
      repeatPasswordControl?.markAsTouched();
      expect(component.getErrorMessage('repeatPassword')).toBe('Passwords do not match');
    });

    it('should return empty string when field is valid', () => {
      const nameControl = component.signUpForm.get('name');
      nameControl?.setValue('John');
      expect(component.getErrorMessage('name')).toBe('');
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

    it('should toggle hideConfirmPassword property', () => {
      const initialState = component.hideConfirmPassword;
      component.hideConfirmPassword = !component.hideConfirmPassword;
      expect(component.hideConfirmPassword).toBe(!initialState);
    });
  });
});