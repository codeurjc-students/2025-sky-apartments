import { Component, OnInit } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {  MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ContactMessageDTO } from '../../dtos/contactMessage.dto';
import { ContactService } from '../../services/contact/contact.service';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  carouselApartments: ApartmentDTO[] = [];
  featuredApartments: ApartmentDTO[] = [];
  currentSlide = 0;
  isLoading = true;
  contactForm: FormGroup;
  isSendingMessage = false;

  constructor(
    private apartmentService: ApartmentService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
    private contactService: ContactService,
    private snackBar: MatSnackBar
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.loadApartments();
    this.startAutoSlide();

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          this.viewportScroller.scrollToAnchor(fragment);
        }, 100);
      }
    });
  }

  loadApartments() {
    this.apartmentService.getAllApartments(0, 10).subscribe({
      next: (apartments) => {
        this.carouselApartments = apartments.slice(0, 6);
        this.featuredApartments = apartments.slice(6, 10);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading apartments:', error);
        this.isLoading = false;
      
        const errorCode = error.status || 500;
        const errorMessage = error.error?.message || 'Failed to load apartments';
        
        this.router.navigate(['/error'], {
          queryParams: {
            code: errorCode,
            message: errorMessage
          }
        });
      }
    });
  }

  startAutoSlide() {
    setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.carouselApartments.length;
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 
      ? this.carouselApartments.length - 1 
      : this.currentSlide - 1;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  viewApartment(id: number) {
    console.log('View apartment', id);
    this.router.navigate(['/apartment', id]);
  }

  onSubmitContact() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSendingMessage = true;

    const contactMessage: ContactMessageDTO = {
      name: this.contactForm.value.name!,
      email: this.contactForm.value.email!,
      subject: this.contactForm.value.subject!,
      message: this.contactForm.value.message!
    };

    this.contactService.sendContactMessage(contactMessage).subscribe({
      next: (response) => {
        this.isSendingMessage = false;
        
        this.snackBar.open('Message sent successfully! We\'ll get back to you soon.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        // Resetear el formulario
        this.contactForm.reset();
        Object.keys(this.contactForm.controls).forEach(key => {
          this.contactForm.get(key)?.setErrors(null);
        });
      },
      error: (error) => {
        this.isSendingMessage = false;
        console.error('Error sending message:', error);
        
        let errorMessage = 'Failed to send message. Please try again later.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getContactErrorMessage(field: string): string {
    const control = this.contactForm.get(field);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('minlength')) {
      return 'Message must be at least 10 characters';
    }
    return '';
  }

  viewAllApartments() {
    this.router.navigate(['/apartments']); 
  }
}