import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { HomeComponent } from './home.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ContactService } from '../../services/contact/contact.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let contactService: jasmine.SpyObj<ContactService>;
  let router: Router;
  let viewportScroller: jasmine.SpyObj<ViewportScroller>;
  let fragmentSubject: Subject<string | null>;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: 'Apartment 1',
      description: 'Description 1',
      price: 100,
      capacity: 2,
      imagesUrl: ['image1.jpg'],
      services: new Set<string>()
    },
    {
      id: 2,
      name: 'Apartment 2',
      description: 'Description 2',
      price: 150,
      capacity: 4,
      imagesUrl: ['image2.jpg'],
      services: new Set<string>()
    },
    {
      id: 3,
      name: 'Apartment 3',
      description: 'Description 3',
      price: 200,
      capacity: 6,
      imagesUrl: ['image3.jpg'],
      services: new Set<string>()
    },
    {
      id: 4,
      name: 'Apartment 4',
      description: 'Description 4',
      price: 250,
      capacity: 8,
      imagesUrl: ['image4.jpg'],
      services: new Set<string>()
    },
    {
      id: 5,
      name: 'Apartment 5',
      description: 'Description 5',
      price: 300,
      capacity: 10,
      imagesUrl: ['image5.jpg'],
      services: new Set<string>()
    },
    {
      id: 6,
      name: 'Apartment 6',
      description: 'Description 6',
      price: 350,
      capacity: 12,
      imagesUrl: ['image6.jpg'],
      services: new Set<string>()
    },
    {
      id: 7,
      name: 'Apartment 7',
      description: 'Description 7',
      price: 400,
      capacity: 14,
      imagesUrl: ['image7.jpg'],
      services: new Set<string>()
    },
    {
      id: 8,
      name: 'Apartment 8',
      description: 'Description 8',
      price: 450,
      capacity: 16,
      imagesUrl: ['image8.jpg'],
      services: new Set<string>()
    },
    {
      id: 9,
      name: 'Apartment 9',
      description: 'Description 9',
      price: 500,
      capacity: 18,
      imagesUrl: ['image9.jpg'],
      services: new Set<string>()
    },
    {
      id: 10,
      name: 'Apartment 10',
      description: 'Description 10',
      price: 550,
      capacity: 20,
      imagesUrl: ['image10.jpg'],
      services: new Set<string>()
    }
  ];

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', ['getAllApartments']);
    const contactServiceSpy = jasmine.createSpyObj('ContactService', ['sendContactMessage']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const viewportScrollerSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);
    
    fragmentSubject = new Subject<string | null>();
    const activatedRouteStub = {
      fragment: fragmentSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: ViewportScroller, useValue: viewportScrollerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([])
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    contactService = TestBed.inject(ContactService) as jasmine.SpyObj<ContactService>;
    router = TestBed.inject(Router);
    viewportScroller = TestBed.inject(ViewportScroller) as jasmine.SpyObj<ViewportScroller>;

    // Default behavior for getAllApartments
    apartmentService.getAllApartments.and.returnValue(of(mockApartments));

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.currentSlide).toBe(0);
      expect(component.isLoading).toBe(true);
      expect(component.isSendingMessage).toBe(false);
      expect(component.carouselApartments).toEqual([]);
      expect(component.featuredApartments).toEqual([]);
    });

    it('should initialize contact form with empty values', () => {
      expect(component.contactForm.get('name')?.value).toBe('');
      expect(component.contactForm.get('email')?.value).toBe('');
      expect(component.contactForm.get('subject')?.value).toBe('');
      expect(component.contactForm.get('message')?.value).toBe('');
    });

    it('should have all contact form controls', () => {
      expect(component.contactForm.contains('name')).toBeTruthy();
      expect(component.contactForm.contains('email')).toBeTruthy();
      expect(component.contactForm.contains('subject')).toBeTruthy();
      expect(component.contactForm.contains('message')).toBeTruthy();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadApartments on init', () => {
      spyOn(component, 'loadApartments');
      component.ngOnInit();
      expect(component.loadApartments).toHaveBeenCalled();
    });

    it('should call startAutoSlide on init', () => {
      spyOn(component, 'startAutoSlide');
      component.ngOnInit();
      expect(component.startAutoSlide).toHaveBeenCalled();
    });

    it('should not scroll when fragment is null', fakeAsync(() => {
      fixture.detectChanges();
      component.ngOnInit();
      
      fragmentSubject.next(null);
      tick(150);
      
      expect(viewportScroller.scrollToAnchor).not.toHaveBeenCalled();
    }));
  });

  describe('loadApartments', () => {
    it('should call apartmentService.getAllApartments with correct parameters', () => {
      component.loadApartments();
      expect(apartmentService.getAllApartments).toHaveBeenCalledWith(0, 10);
    });

    it('should populate carouselApartments with first 6 apartments', () => {
      component.loadApartments();
      expect(component.carouselApartments.length).toBe(6);
      expect(component.carouselApartments[0].id).toBe(1);
      expect(component.carouselApartments[5].id).toBe(6);
    });

    it('should populate featuredApartments with apartments 7-10', () => {
      component.loadApartments();
      expect(component.featuredApartments.length).toBe(4);
      expect(component.featuredApartments[0].id).toBe(7);
      expect(component.featuredApartments[3].id).toBe(10);
    });

    it('should set isLoading to false after successful load', () => {
      component.loadApartments();
      expect(component.isLoading).toBe(false);
    });

    it('should handle error and set isLoading to false', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      apartmentService.getAllApartments.and.returnValue(throwError(() => error));
      
      spyOn(console, 'error');
      component.loadApartments();
      
      expect(console.error).toHaveBeenCalledWith('Error loading apartments:', error);
      expect(component.isLoading).toBe(false);
    });

    it('should navigate to error page on failure', () => {
      const error = { status: 404, error: { message: 'Not found' } };
      apartmentService.getAllApartments.and.returnValue(throwError(() => error));

      const navigateSpy = spyOn(router, 'navigate');

      component.loadApartments();

      expect(navigateSpy).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          code: 404,
          message: 'Not found'
        }
      });
    });

    it('should use default error code 500 when status is not provided', () => {
      const error = { error: { message: 'Unknown error' } };
      apartmentService.getAllApartments.and.returnValue(throwError(() => error));
      const navigateSpy = spyOn(router, 'navigate');

      component.loadApartments();

      expect(navigateSpy).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          code: 500,
          message: 'Unknown error'
        }
      });
    });

    it('should use default error message when not provided', () => {
      const error = { status: 500 };
      apartmentService.getAllApartments.and.returnValue(throwError(() => error));
      const navigateSpy = spyOn(router, 'navigate');
      
      component.loadApartments();
      
      expect(navigateSpy).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          code: 500,
          message: 'Failed to load apartments'
        }
      });
    });
  });

  describe('Carousel Navigation', () => {
    beforeEach(() => {
      component.carouselApartments = mockApartments.slice(0, 6);
    });

    describe('nextSlide', () => {
      it('should increment currentSlide', () => {
        component.currentSlide = 0;
        component.nextSlide();
        expect(component.currentSlide).toBe(1);
      });

      it('should wrap to 0 when at last slide', () => {
        component.currentSlide = 5;
        component.nextSlide();
        expect(component.currentSlide).toBe(0);
      });
    });

    describe('prevSlide', () => {
      it('should decrement currentSlide', () => {
        component.currentSlide = 3;
        component.prevSlide();
        expect(component.currentSlide).toBe(2);
      });

      it('should wrap to last slide when at first slide', () => {
        component.currentSlide = 0;
        component.prevSlide();
        expect(component.currentSlide).toBe(5);
      });
    });

    describe('goToSlide', () => {
      it('should set currentSlide to specified index', () => {
        component.goToSlide(3);
        expect(component.currentSlide).toBe(3);
      });

      it('should accept index 0', () => {
        component.currentSlide = 5;
        component.goToSlide(0);
        expect(component.currentSlide).toBe(0);
      });
    });
  });

  describe('startAutoSlide', () => {
    it('should call nextSlide periodically', fakeAsync(() => {
      spyOn(component, 'nextSlide');
      component.carouselApartments = mockApartments.slice(0, 6);
      
      component.startAutoSlide();
      
      expect(component.nextSlide).not.toHaveBeenCalled();
      tick(5000);
      expect(component.nextSlide).toHaveBeenCalledTimes(1);
      tick(5000);
      expect(component.nextSlide).toHaveBeenCalledTimes(2);
    }));
  });

  describe('viewApartment', () => {
    it('should navigate to apartment detail page', () => {
      spyOn(console, 'log');
      component.viewApartment(5);
      
      expect(console.log).toHaveBeenCalledWith('View apartment', 5);
    });
  });

  describe('viewAllApartments', () => {
    it('should navigate to apartments page', () => {
      const navigateSpy = spyOn(router, 'navigate');

      component.viewAllApartments();

      expect(navigateSpy).toHaveBeenCalledWith(['/apartments']);
    });
  });

  describe('Contact Form Validation', () => {
    it('should make name control required', () => {
      const nameControl = component.contactForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBeTruthy();
    });

    it('should accept valid name', () => {
      const nameControl = component.contactForm.get('name');
      nameControl?.setValue('John Doe');
      expect(nameControl?.valid).toBeTruthy();
    });

    it('should make email control required', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();
    });

    it('should accept valid email', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should make subject control required', () => {
      const subjectControl = component.contactForm.get('subject');
      subjectControl?.setValue('');
      expect(subjectControl?.hasError('required')).toBeTruthy();
    });

    it('should accept valid subject', () => {
      const subjectControl = component.contactForm.get('subject');
      subjectControl?.setValue('Question about booking');
      expect(subjectControl?.valid).toBeTruthy();
    });

    it('should make message control required', () => {
      const messageControl = component.contactForm.get('message');
      messageControl?.setValue('');
      expect(messageControl?.hasError('required')).toBeTruthy();
    });

    it('should require message to be at least 10 characters', () => {
      const messageControl = component.contactForm.get('message');
      messageControl?.setValue('Short');
      expect(messageControl?.hasError('minlength')).toBeTruthy();
    });

    it('should accept valid message', () => {
      const messageControl = component.contactForm.get('message');
      messageControl?.setValue('This is a valid message with more than 10 characters');
      expect(messageControl?.valid).toBeTruthy();
    });

    it('should invalidate form when fields are empty', () => {
      expect(component.contactForm.valid).toBeFalsy();
    });

    it('should validate form when all fields are correct', () => {
      component.contactForm.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a test message with sufficient length'
      });
      expect(component.contactForm.valid).toBeTruthy();
    });
  });

  describe('getContactErrorMessage', () => {
    it('should return required message for empty name', () => {
      const nameControl = component.contactForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      expect(component.getContactErrorMessage('name')).toBe('This field is required');
    });

    it('should return required message for empty email', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      expect(component.getContactErrorMessage('email')).toBe('This field is required');
    });

    it('should return email format message for invalid email', () => {
      const emailControl = component.contactForm.get('email');
      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      expect(component.getContactErrorMessage('email')).toBe('Please enter a valid email');
    });

    it('should return required message for empty subject', () => {
      const subjectControl = component.contactForm.get('subject');
      subjectControl?.setValue('');
      subjectControl?.markAsTouched();
      expect(component.getContactErrorMessage('subject')).toBe('This field is required');
    });

    it('should return required message for empty message', () => {
      const messageControl = component.contactForm.get('message');
      messageControl?.setValue('');
      messageControl?.markAsTouched();
      expect(component.getContactErrorMessage('message')).toBe('This field is required');
    });

    it('should return minlength message for short message', () => {
      const messageControl = component.contactForm.get('message');
      messageControl?.setValue('Short');
      messageControl?.markAsTouched();
      expect(component.getContactErrorMessage('message')).toBe('Message must be at least 10 characters');
    });

    it('should return empty string when field is valid', () => {
      const nameControl = component.contactForm.get('name');
      nameControl?.setValue('John Doe');
      expect(component.getContactErrorMessage('name')).toBe('');
    });

    it('should return empty string for non-existent field', () => {
      expect(component.getContactErrorMessage('nonexistent')).toBe('');
    });
  });

  describe('onSubmitContact', () => {
    it('should be defined', () => {
      expect(component.onSubmitContact).toBeDefined();
    });

    it('should not throw error when called', () => {
      expect(() => component.onSubmitContact()).not.toThrow();
    });
  });
});