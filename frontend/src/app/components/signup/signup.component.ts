import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { UserRequestDTO } from '../../dtos/userRequest.dto';

@Component({
  selector: 'app-signup',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignUpComponent {
  signUpForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signUpForm = this.fb.group({
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repeatPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const repeatPassword = form.get('repeatPassword');
    
    if (password && repeatPassword && password.value !== repeatPassword.value) {
      repeatPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSignUp() {
    if (this.signUpForm.valid) {
      this.isLoading = true;
      const { name, surname, email, phoneNumber, password, repeatPassword } = this.signUpForm.value;

      const userRequest: UserRequestDTO = {
        name,
        surname,
        email,
        phoneNumber,
        password,
        repeatPassword
      };

      this.userService.createUser(userRequest).subscribe({
        next: () => {
          this.showMessage('Account created successfully! Please log in.', 'success');
          this.signUpForm.reset();
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error) => {
          console.error('Sign up error:', error);
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.status === 409) {
            errorMessage = 'Email already exists.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.showMessage(errorMessage, 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.showMessage('Please fill in all required fields correctly.', 'warning');
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  getErrorMessage(field: string): string {
    const control = this.signUpForm.get(field);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number (9-15 digits)';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
}