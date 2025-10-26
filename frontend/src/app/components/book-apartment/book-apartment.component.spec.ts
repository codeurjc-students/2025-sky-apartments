import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BookApartmentComponent } from './book-apartment.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('BookApartmentComponent', () => {
  let component: BookApartmentComponent;
  let fixture: ComponentFixture<BookApartmentComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let router: Router;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: 'Apartment 1',
      description: 'Description 1',
      price: 100,
      services: new Set(['WiFi', 'AC']),
      capacity: 4,
      imageUrl: 'img1.jpg'
    },
    {
      id: 2,
      name: 'Apartment 2',
      description: 'Description 2',
      price: 150,
      services: new Set(['WiFi', 'Kitchen']),
      capacity: 2,
      imageUrl: 'img2.jpg'
    }
  ];

  const mockServices = ['WiFi', 'AC', 'Kitchen', 'Parking'];

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getAllServices',
      'searchApartments'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        BookApartmentComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    router = TestBed.inject(Router);

    // Default mock responses
    apartmentService.getAllServices.and.returnValue(of(mockServices));
    apartmentService.searchApartments.and.returnValue(of(mockApartments));

    fixture = TestBed.createComponent(BookApartmentComponent);
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
      expect(component.startDate).toBeNull();
      expect(component.endDate).toBeNull();
      expect(component.currentPage).toBe(0);
      expect(component.pageSize).toBe(10);
      expect(component.hasMore).toBe(true);
      expect(component.loading).toBe(false);
      expect(component.initialLoading).toBe(true);
    });

    it('should set minDate to today', () => {
      const today = new Date();
      expect(component.minDate.toDateString()).toBe(today.toDateString());
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
  });

  describe('loadServices', () => {
    it('should load available services', (done) => {
      component.loadServices();
      
      setTimeout(() => {
        expect(apartmentService.getAllServices).toHaveBeenCalled();
        expect(component.availableServices).toEqual(mockServices);
        done();
      }, 100);
    });

    it('should navigate to error page on failure', () => {
      spyOn(router, 'navigate');
      apartmentService.getAllServices.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );
      
      component.loadServices();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Server error',
          code: 500
        }
      });
    });

    it('should use default error message if not provided', () => {
      spyOn(router, 'navigate');
      apartmentService.getAllServices.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.loadServices();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load services',
          code: 500
        }
      });
    });
  });

  describe('searchApartments', () => {
    it('should search apartments with default options', () => {
      component.searchApartments();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          services: [],
          minCapacity: 1,
          page: 0,
          pageSize: 10
        })
      );
    });

    it('should include dates in search options if set', () => {
      component.startDate = new Date('2025-10-20');
      component.endDate = new Date('2025-10-25');
      
      component.searchApartments();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          startDate: '2025-10-20',
          endDate: '2025-10-25'
        })
      );
    });

    it('should include selected services in search', () => {
      component.selectedServices.add('WiFi');
      component.selectedServices.add('AC');
      
      component.searchApartments();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          services: jasmine.arrayContaining(['WiFi', 'AC'])
        })
      );
    });

    it('should include selected capacity in search', () => {
      component.selectedCapacity = 4;
      
      component.searchApartments();
      
      expect(apartmentService.searchApartments).toHaveBeenCalledWith(
        jasmine.objectContaining({
          minCapacity: 4
        })
      );
    });

    it('should set apartments on successful search', (done) => {
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.apartments).toEqual(mockApartments);
        done();
      }, 100);
    });

    it('should append apartments when not resetting', (done) => {
      component.apartments = [mockApartments[0]];
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.apartments.length).toBeGreaterThan(1);
        done();
      }, 100);
    });

    it('should replace apartments when resetting', (done) => {
      component.apartments = [mockApartments[0]];
      component.searchApartments(true);
      
      setTimeout(() => {
        expect(component.apartments).toEqual(mockApartments);
        done();
      }, 100);
    });

    it('should set loading to false after success', (done) => {
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should set initialLoading to false after first search', (done) => {
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.initialLoading).toBe(false);
        done();
      }, 100);
    });

    it('should set hasMore to false when no results', (done) => {
      apartmentService.searchApartments.and.returnValue(of([]));
      
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.hasMore).toBe(false);
        done();
      }, 100);
    });

    it('should set hasMore based on response length', (done) => {
      const fullPage = Array(10).fill(mockApartments[0]);
      apartmentService.searchApartments.and.returnValue(of(fullPage));
      
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.hasMore).toBe(true);
        done();
      }, 100);
    });

    it('should handle 204 error as no content', (done) => {
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 204 }))
      );
      
      component.searchApartments();
      
      setTimeout(() => {
        expect(component.hasMore).toBe(false);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should navigate to error page on other errors', () => {
      spyOn(router, 'navigate');
      apartmentService.searchApartments.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.searchApartments();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load apartments',
          code: 500
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

    it('should handle December correctly', () => {
      const date = new Date('2025-12-31');
      expect(component.formatDate(date)).toBe('2025-12-31');
    });
  });

  describe('onServiceToggle', () => {
    it('should add service if not selected', () => {
      component.onServiceToggle('WiFi');
      expect(component.selectedServices.has('WiFi')).toBe(true);
    });

    it('should remove service if already selected', () => {
      component.selectedServices.add('WiFi');
      component.onServiceToggle('WiFi');
      expect(component.selectedServices.has('WiFi')).toBe(false);
    });

    it('should search apartments after toggle', () => {
      spyOn(component, 'searchApartments');
      component.onServiceToggle('WiFi');
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('onCapacityChange', () => {
    it('should search apartments after capacity change', () => {
      spyOn(component, 'searchApartments');
      component.selectedCapacity = 4;
      component.onCapacityChange();
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });

    it('should set capacity to 1 if less than 1', () => {
      component.selectedCapacity = 0;
      component.onCapacityChange();
      expect(component.selectedCapacity).toBe(1);
    });

    it('should set capacity to 1 if negative', () => {
      component.selectedCapacity = -5;
      component.onCapacityChange();
      expect(component.selectedCapacity).toBe(1);
    });
  });

  describe('onStartDateChange', () => {
    it('should clear endDate if startDate is after endDate', () => {
      component.startDate = new Date('2025-10-25');
      component.endDate = new Date('2025-10-20');
      
      component.onStartDateChange();
      
      expect(component.endDate).toBeNull();
    });

    it('should not clear endDate if startDate is before endDate', () => {
      component.startDate = new Date('2025-10-20');
      component.endDate = new Date('2025-10-25');
      
      component.onStartDateChange();
      
      expect(component.endDate).not.toBeNull();
    });

    it('should search apartments after date change', () => {
      spyOn(component, 'searchApartments');
      component.startDate = new Date('2025-10-20');
      component.onStartDateChange();
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('onEndDateChange', () => {
    it('should search apartments after date change', () => {
      spyOn(component, 'searchApartments');
      component.endDate = new Date('2025-10-25');
      component.onEndDateChange();
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('clearDates', () => {
    it('should clear both dates', () => {
      component.startDate = new Date('2025-10-20');
      component.endDate = new Date('2025-10-25');
      
      component.clearDates();
      
      expect(component.startDate).toBeNull();
      expect(component.endDate).toBeNull();
    });

    it('should search apartments after clearing dates', () => {
      spyOn(component, 'searchApartments');
      component.clearDates();
      expect(component.searchApartments).toHaveBeenCalledWith(true);
    });
  });

  describe('loadMore', () => {
    it('should increment current page', () => {
      component.currentPage = 0;
      component.loadMore();
      expect(component.currentPage).toBe(1);
    });

    it('should search apartments without reset', () => {
      spyOn(component, 'searchApartments');
      component.loadMore();
      expect(component.searchApartments).toHaveBeenCalledWith();
    });
  });

  describe('goToApartment', () => {
    it('should navigate to apartment detail page', () => {
      spyOn(router, 'navigate');
      component.goToApartment(5);
      expect(router.navigate).toHaveBeenCalledWith(['/apartment', 5]);
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
  });

  describe('getEndMinDate', () => {
    it('should return startDate if set', () => {
      const testDate = new Date('2025-10-20');
      component.startDate = testDate;
      
      expect(component.getEndMinDate()).toBe(testDate);
    });

    it('should return minDate if startDate is null', () => {
      component.startDate = null;
      
      expect(component.getEndMinDate()).toBe(component.minDate);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show initial loading spinner', () => {
      component.initialLoading = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('.loading-container mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show apartments grid when not loading', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = mockApartments;
        fixture.detectChanges();
        
        const grid = fixture.nativeElement.querySelector('.apartments-grid');
        expect(grid).toBeTruthy();
        done();
      }, 100);
    });

    it('should show no results message when no apartments', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = [];
        fixture.detectChanges();
        
        const noResults = fixture.nativeElement.querySelector('.no-results');
        expect(noResults).toBeTruthy();
        done();
      }, 100);
    });

    it('should render apartment cards', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = mockApartments;
        fixture.detectChanges();
        
        const cards = fixture.nativeElement.querySelectorAll('.apartment-card');
        expect(cards.length).toBe(2);
        done();
      }, 100);
    });

    it('should show load more button when hasMore is true', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = mockApartments;
        component.hasMore = true;
        fixture.detectChanges();
        
        const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
        expect(loadMoreBtn).toBeTruthy();
        done();
      }, 100);
    });

    it('should not show load more button when hasMore is false', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = mockApartments;
        component.hasMore = false;
        fixture.detectChanges();
        
        const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
        expect(loadMoreBtn).toBeFalsy();
        done();
      }, 100);
    });

    it('should disable load more button when loading', (done) => {
      setTimeout(() => {
        component.initialLoading = false;
        component.apartments = mockApartments;
        component.hasMore = true;
        component.loading = true;
        fixture.detectChanges();
        
        const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-btn');
        expect(loadMoreBtn.disabled).toBe(true);
        done();
      }, 100);
    });

    it('should show clear dates button when dates are set', () => {
      component.startDate = new Date('2025-10-20');
      fixture.detectChanges();
      
      const clearBtn = fixture.nativeElement.querySelector('.clear-dates-btn');
      expect(clearBtn).toBeTruthy();
    });

    it('should not show clear dates button when dates are not set', () => {
      component.startDate = null;
      component.endDate = null;
      fixture.detectChanges();
      
      const clearBtn = fixture.nativeElement.querySelector('.clear-dates-btn');
      expect(clearBtn).toBeFalsy();
    });

    it('should render service checkboxes', () => {
      component.availableServices = mockServices;
      fixture.detectChanges();
      
      const checkboxes = fixture.nativeElement.querySelectorAll('.service-checkbox');
      expect(checkboxes.length).toBe(mockServices.length);
    });

    it('should show date info when both dates are set', () => {
      component.startDate = new Date('2025-10-20');
      component.endDate = new Date('2025-10-25');
      fixture.detectChanges();
      
      const dateInfo = fixture.nativeElement.querySelector('.date-info');
      expect(dateInfo).toBeTruthy();
    });
  });
});