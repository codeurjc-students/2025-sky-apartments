import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApartmentListComponent } from './apartment-list.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ReviewService } from '../../services/review/review.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('ApartmentListComponent', () => {
  let component: ApartmentListComponent;
  let fixture: ComponentFixture<ApartmentListComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let router: Router;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: 'Luxury Apartment',
      description: 'A beautiful luxury apartment',
      price: 150,
      services: new Set(['WiFi', 'AC', 'Kitchen']),
      capacity: 4,
      imagesUrl: ['apartment1.jpg']
    },
    {
      id: 2,
      name: 'Cozy Studio',
      description: 'A cozy studio apartment',
      price: 80,
      services: new Set(['WiFi', 'Heating']),
      capacity: 2,
      imagesUrl: ['apartment2.jpg']
    }
  ];

  const mockServices = ['WiFi', 'AC', 'Kitchen', 'Heating', 'Pool', 'Gym'];

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'searchApartments',
      'getAllServices'
    ]);

    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', [
      'getApartmentRating'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ApartmentListComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: ReviewService, useValue: reviewServiceSpy },
        provideRouter([
          { path: 'error', component: ApartmentListComponent },
          { path: 'apartment/:id', component: ApartmentListComponent }
        ])
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    router = TestBed.inject(Router);

    // Default mock responses
    apartmentService.getAllServices.and.returnValue(of(mockServices));
    apartmentService.searchApartments.and.returnValue(of(mockApartments));
    reviewService.getApartmentRating.and.returnValue(of(4.5));

    fixture = TestBed.createComponent(ApartmentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.apartments).toEqual([]);
      expect(component.availableServices).toEqual([]);
      expect(component.selectedServices.size).toBe(0);
      expect(component.selectedCapacity).toBe(1);
      expect(component.selectedMinRating).toBe(0);
      expect(component.currentPage).toBe(0);
      expect(component.pageSize).toBe(10);
      expect(component.hasMore).toBe(true);
      expect(component.loading).toBe(false);
      expect(component.initialLoading).toBe(true);
      expect(component.apartmentRatings.size).toBe(0);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadServices', () => {
      spyOn(component, 'loadServices');
      component.ngOnInit();
      expect(component.loadServices).toHaveBeenCalled();
    });

    it('should call searchApartments', () => {
      spyOn(component, 'searchApartments');
      component.ngOnInit();
      expect(component.searchApartments).toHaveBeenCalled();
    });

    it('should load services and apartments on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apartmentService.getAllServices).toHaveBeenCalled();
      expect(apartmentService.searchApartments).toHaveBeenCalled();
      expect(component.availableServices).toEqual(mockServices);
      expect(component.apartments).toEqual(mockApartments);
    }));
  });

  describe('loadServices', () => {
    it('should load available services', fakeAsync(() => {
      component.loadServices();
      tick();

      expect(apartmentService.getAllServices).toHaveBeenCalled();
      expect(component.availableServices).toEqual(mockServices);
    }));

    it('should navigate to error page on service load failure', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.getAllServices.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );

      component.loadServices();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Server error',
          code: 500
        }
      });
    }));

    it('should use default error message if not provided', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.getAllServices.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.loadServices();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load services',
          code: 500
        }
      });
    }));
  });

  describe('searchApartments', () => {
    beforeEach(() => {
      component.selectedCapacity = 2;
      component.selectedServices.add('WiFi');
      component.selectedServices.add('AC');
    });

    it('should call apartment service with correct parameters', () => {
      component.currentPage = 1;
      component.searchApartments();

      expect(apartmentService.searchApartments).toHaveBeenCalledWith({
        services: jasmine.arrayContaining(['WiFi', 'AC']),
        minCapacity: 2,
        page: 1,
        pageSize: 10
      });
    });

    it('should load apartments successfully and fetch ratings', fakeAsync(() => {
      component.searchApartments();
      tick();

      expect(component.apartments).toEqual(mockApartments);
      expect(reviewService.getApartmentRating).toHaveBeenCalledTimes(2);
      expect(component.loading).toBe(false);
      expect(component.initialLoading).toBe(false);
      expect(component.hasMore).toBe(false);
    }));

    it('should filter apartments by minimum rating', fakeAsync(() => {
      component.selectedMinRating = 4.0;
      reviewService.getApartmentRating.and.callFake((id: number) => {
        return id === 1 ? of(4.5) : of(3.5);
      });

      component.searchApartments();
      tick();

      expect(component.apartments.length).toBe(1);
      expect(component.apartments[0].id).toBe(1);
    }));

    it('should append apartments when not resetting', fakeAsync(() => {
      component.apartments = [mockApartments[0]];
      component.apartmentRatings.set(1, 4.5);
      component.searchApartments(false);
      tick();

      expect(component.apartments.length).toBe(3);
    }));

    it('should replace apartments when resetting', fakeAsync(() => {
      component.apartments = [mockApartments[0]];
      component.currentPage = 2;
      component.searchApartments(true);
      tick();

      expect(component.apartments).toEqual(mockApartments);
      expect(component.currentPage).toBe(0);
    }));

    it('should set hasMore to true when response has full page', fakeAsync(() => {
      const fullPage = Array(10).fill(null).map((_, i) => ({
        ...mockApartments[0],
        id: i + 1
      }));
      apartmentService.searchApartments.and.returnValue(of(fullPage));

      component.searchApartments();
      tick();

      expect(component.hasMore).toBe(true);
    }));

    it('should set hasMore to false when response is empty', fakeAsync(() => {
      apartmentService.searchApartments.and.returnValue(of([]));

      component.searchApartments();
      tick();

      expect(component.hasMore).toBe(false);
      expect(component.apartments).toEqual([]);
    }));

    it('should handle rating fetch errors gracefully', fakeAsync(() => {
      reviewService.getApartmentRating.and.returnValue(
        throwError(() => new Error('Rating not found'))
      );

      component.searchApartments();
      tick();

      expect(component.apartments).toEqual(mockApartments);
      expect(component.apartmentRatings.get(1)).toBe(0);
      expect(component.apartmentRatings.get(2)).toBe(0);
    }));

    it('should handle 204 No Content response', fakeAsync(() => {
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 204 }))
      );

      component.searchApartments();
      tick();

      expect(component.hasMore).toBe(false);
      expect(component.loading).toBe(false);
      expect(component.initialLoading).toBe(false);
    }));

    it('should preserve existing apartments on 204 if not first page', fakeAsync(() => {
      component.apartments = [mockApartments[0]];
      component.currentPage = 1;
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 204 }))
      );

      component.searchApartments();
      tick();

      expect(component.apartments.length).toBe(1);
    }));

    it('should clear apartments on 204 if first page', fakeAsync(() => {
      component.apartments = [mockApartments[0]];
      component.currentPage = 0;
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 204 }))
      );

      component.searchApartments();
      tick();

      expect(component.apartments).toEqual([]);
    }));

    it('should navigate to error page on non-204 error', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.searchApartments();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load apartments',
          code: 500
        }
      });
    }));
  });

  describe('onServiceToggle', () => {
    it('should add service when not selected', fakeAsync(() => {
      spyOn(component, 'searchApartments');
      
      component.onServiceToggle('WiFi');
      
      expect(component.selectedServices.has('WiFi')).toBe(true);
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    }));

    it('should remove service when already selected', fakeAsync(() => {
      component.selectedServices.add('WiFi');
      spyOn(component, 'searchApartments');
      
      component.onServiceToggle('WiFi');
      
      expect(component.selectedServices.has('WiFi')).toBe(false);
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    }));

    it('should reset search when toggling service', () => {
      spyOn(component, 'searchApartments');
      
      component.onServiceToggle('AC');
      
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('onCapacityChange', () => {
    it('should search apartments when capacity changes', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedCapacity = 3;
      component.onCapacityChange();
      
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });

    it('should enforce minimum capacity of 1', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedCapacity = -5;
      component.onCapacityChange();
      
      expect(component.selectedCapacity).toBe(1);
    });

    it('should enforce minimum capacity of 1 when 0', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedCapacity = 0;
      component.onCapacityChange();
      
      expect(component.selectedCapacity).toBe(1);
    });

    it('should reset search when capacity changes', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedCapacity = 5;
      component.onCapacityChange();
      
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('onRatingChange', () => {
    it('should search apartments when rating changes', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedMinRating = 4.0;
      component.onRatingChange();
      
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });

    it('should enforce minimum rating of 0', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedMinRating = -2;
      component.onRatingChange();
      
      expect(component.selectedMinRating).toBe(0);
    });

    it('should enforce maximum rating of 5', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedMinRating = 7;
      component.onRatingChange();
      
      expect(component.selectedMinRating).toBe(5);
    });

    it('should reset search when rating changes', () => {
      spyOn(component, 'searchApartments');
      
      component.selectedMinRating = 3.5;
      component.onRatingChange();
      
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('getRating', () => {
    it('should return rating from map', () => {
      component.apartmentRatings.set(1, 4.5);
      
      expect(component.getRating(1)).toBe(4.5);
    });

    it('should return 0 for unknown apartment', () => {
      expect(component.getRating(999)).toBe(0);
    });

    it('should return correct ratings for multiple apartments', () => {
      component.apartmentRatings.set(1, 4.5);
      component.apartmentRatings.set(2, 3.8);
      
      expect(component.getRating(1)).toBe(4.5);
      expect(component.getRating(2)).toBe(3.8);
    });
  });

  describe('loadMore', () => {
    it('should increment current page', () => {
      spyOn(component, 'searchApartments');
      component.currentPage = 0;
      
      component.loadMore();
      
      expect(component.currentPage).toBe(1);
    });

    it('should call searchApartments without reset', () => {
      spyOn(component, 'searchApartments');
      
      component.loadMore();
      
      expect(component.searchApartments).toHaveBeenCalledWith();
    });

    it('should append new apartments to existing ones', fakeAsync(() => {
      component.apartments = [mockApartments[0]];
      component.apartmentRatings.set(1, 4.5);
      component.currentPage = 0;
      
      const newApartments = [mockApartments[1]];
      apartmentService.searchApartments.and.returnValue(of(newApartments));
      
      component.loadMore();
      tick();
      
      expect(component.apartments.length).toBe(2);
      expect(component.apartments).toContain(mockApartments[0]);
      expect(component.apartments).toContain(mockApartments[1]);
    }));
  });

  describe('goToApartment', () => {
    it('should navigate to apartment detail page', () => {
      spyOn(router, 'navigate');
      
      component.goToApartment(5);
      
      expect(router.navigate).toHaveBeenCalledWith(['/apartment', 5]);
    });

    it('should navigate with correct apartment id', () => {
      spyOn(router, 'navigate');
      
      component.goToApartment(123);
      
      expect(router.navigate).toHaveBeenCalledWith(['/apartment', 123]);
    });
  });

  describe('getServicesArray', () => {
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

    it('should return all services from Set', () => {
      const services = new Set(['Service1', 'Service2']);
      const array = component.getServicesArray(services);
      
      expect(array).toEqual(jasmine.arrayContaining(['Service1', 'Service2']));
    });
  });

  describe('Template Rendering', () => {
    it('should show apartments grid when loaded', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const grid = fixture.nativeElement.querySelector('.apartments-grid');
      expect(grid).toBeTruthy();
    }));

    it('should display correct number of apartment cards', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const cards = fixture.nativeElement.querySelectorAll('.apartment-card');
      expect(cards.length).toBe(mockApartments.length);
    }));

    it('should display apartment name', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Luxury Apartment');
      expect(content).toContain('Cozy Studio');
    }));

    it('should display apartment price', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('$150');
      expect(content).toContain('$80');
    }));

    it('should display apartment capacity', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('4 guests');
      expect(content).toContain('2 guests');
    }));

    it('should show empty state when no apartments', fakeAsync(() => {
      apartmentService.searchApartments.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const emptyState = fixture.nativeElement.querySelector('.no-results');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No apartments found');
    }));

    it('should show load more button when hasMore is true', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      component.hasMore = true;
      fixture.detectChanges();
      
      const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
      expect(loadMoreBtn).toBeTruthy();
    }));

    it('should not show load more button when hasMore is false', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      component.hasMore = false;
      fixture.detectChanges();
      
      const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
      expect(loadMoreBtn).toBeFalsy();
    }));

    it('should disable load more button when loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      component.hasMore = true;
      component.loading = true;
      fixture.detectChanges();
      
      const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
      expect(loadMoreBtn.disabled).toBe(true);
    }));

    it('should render service checkboxes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      const checkboxes = fixture.nativeElement.querySelectorAll('.service-checkbox');
      expect(checkboxes.length).toBe(mockServices.length);
    }));

    it('should render capacity input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    }));

    it('should display View Apartment button for each apartment', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.initialLoading = false;
      fixture.detectChanges();
      
      const viewButtons = fixture.nativeElement.querySelectorAll('.view-apartment-btn');
      expect(viewButtons.length).toBe(mockApartments.length);
    }));
  });

  describe('Integration Tests', () => {
    it('should filter apartments when service is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      apartmentService.searchApartments.calls.reset();
      
      component.onServiceToggle('WiFi');
      tick();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          services: ['WiFi']
        })
      );
    }));

    it('should filter apartments when capacity changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      apartmentService.searchApartments.calls.reset();
      
      component.selectedCapacity = 4;
      component.onCapacityChange();
      tick();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          minCapacity: 4
        })
      );
    }));

    it('should filter apartments when rating changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      reviewService.getApartmentRating.and.callFake((id: number) => {
        return id === 1 ? of(4.5) : of(3.0);
      });
      
      component.selectedMinRating = 4.0;
      component.searchApartments(true);
      tick();
      
      expect(component.apartments.length).toBe(1);
      expect(component.apartments[0].id).toBe(1);
    }));

    it('should handle multiple filter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      component.onServiceToggle('WiFi');
      tick();
      
      component.onServiceToggle('AC');
      tick();
      
      component.selectedCapacity = 3;
      component.onCapacityChange();
      tick();
      
      component.selectedMinRating = 3.5;
      component.onRatingChange();
      tick();
      
      expect(component.selectedServices.has('WiFi')).toBe(true);
      expect(component.selectedServices.has('AC')).toBe(true);
      expect(component.selectedCapacity).toBe(3);
      expect(component.selectedMinRating).toBe(3.5);
    }));

    it('should load multiple pages sequentially', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.currentPage).toBe(0);
      
      component.loadMore();
      tick();
      
      expect(component.currentPage).toBe(1);
      
      component.loadMore();
      tick();
      
      expect(component.currentPage).toBe(2);
    }));

    it('should fetch ratings for all apartments on load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(reviewService.getApartmentRating).toHaveBeenCalledWith(1);
      expect(reviewService.getApartmentRating).toHaveBeenCalledWith(2);
      expect(reviewService.getApartmentRating).toHaveBeenCalledTimes(2);
    }));
  });
});