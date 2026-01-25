import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingsTabComponent } from './bookings-tab.component';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { BookingDTO } from '../../dtos/booking.dto';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BookingsTabComponent', () => {
  let component: BookingsTabComponent;
  let fixture: ComponentFixture<BookingsTabComponent>;
  let bookingService: jasmine.SpyObj<BookingService>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let router: jasmine.SpyObj<Router>;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: 'Beach Apartment',
      description: 'Beautiful beachfront apartment',
      price: 150,
      capacity: 4,
      imagesUrl: ['image1.jpg'],
      services: new Set(['WiFi', 'Pool'])
    },
    {
      id: 2,
      name: 'City Center Loft',
      description: 'Modern loft in city center',
      price: 200,
      capacity: 2,
      imagesUrl: ['image2.jpg'],
      services: new Set(['WiFi', 'Parking'])
    }
  ];

  const mockBookings: BookingDTO[] = [
    {
      id: 1,
      userId: 101,
      apartmentId: 1,
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-20'),
      guests: 2,
      state: 'CONFIRMED',
      cost: 750,
      createdAt: new Date('2024-12-01')
    },
    {
      id: 2,
      userId: 102,
      apartmentId: 1,
      startDate: new Date('2024-12-25'),
      endDate: new Date('2024-12-30'),
      guests: 4,
      state: 'COMPLETED',
      cost: 750,
      createdAt: new Date('2024-12-01')
    },
    {
      id: 3,
      userId: 103,
      apartmentId: 2,
      startDate: new Date('2024-12-10'),
      endDate: new Date('2024-12-15'),
      guests: 2,
      state: 'CONFIRMED',
      cost: 1000,
      createdAt: new Date('2024-12-01')
    }
  ];

  beforeEach(async () => {
    const bookingServiceSpy = jasmine.createSpyObj('BookingService', [
      'getBookingsByApartmentId'
    ]);
    
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getAllApartments'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        BookingsTabComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService) as jasmine.SpyObj<BookingService>;
    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture = TestBed.createComponent(BookingsTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadData and calculateMonthData', () => {
      spyOn(component, 'loadData');
      spyOn(component, 'calculateMonthData');

      component.ngOnInit();

      expect(component.loadData).toHaveBeenCalled();
      expect(component.calculateMonthData).toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    it('should load apartments and bookings successfully', (done) => {
      apartmentService.getAllApartments.and.returnValue(of(mockApartments));
      bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));

      component.loadData();

      setTimeout(() => {
        expect(apartmentService.getAllApartments).toHaveBeenCalledWith(0, 100);
        expect(component.apartments).toEqual(mockApartments);
        expect(component.bookingsByApartment.length).toBe(2);
        expect(component.loading).toBeFalse();
        done();
      }, 100);
    });

    it('should handle empty apartments list', () => {
      apartmentService.getAllApartments.and.returnValue(of([]));

      component.loadData();

      expect(component.loading).toBeFalse();
      expect(component.apartments).toEqual([]);
    });

    it('should navigate to error page when loading apartments fails', () => {
      const error = { status: 500, error: { message: 'Server error' } };
      apartmentService.getAllApartments.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.loadData();

      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Server error',
          code: 500
        }
      });
      expect(console.error).toHaveBeenCalledWith('Error loading apartments:', error);
    });

    it('should navigate to error page when loading bookings fails', (done) => {
      const error = { status: 500, error: { message: 'Booking error' } };
      apartmentService.getAllApartments.and.returnValue(of(mockApartments));
      bookingService.getBookingsByApartmentId.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.loadData();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/error'], {
          queryParams: {
            message: 'Booking error',
            code: 500
          }
        });
        expect(console.error).toHaveBeenCalledWith('Error loading bookings:', error);
        done();
      }, 100);
    });

    it('should calculate statistics after loading data', (done) => {
      apartmentService.getAllApartments.and.returnValue(of(mockApartments));
      bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));
      spyOn(component, 'calculateStatistics');

      component.loadData();

      setTimeout(() => {
        expect(component.calculateStatistics).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('calculateMonthData', () => {
    it('should calculate month data correctly', () => {
      component.currentMonth = new Date(2024, 0, 15); // January 2024

      component.calculateMonthData();

      expect(component.year).toBe(2024);
      expect(component.month).toBe(0);
      expect(component.daysInMonth).toBe(31);
      expect(component.daysArray.length).toBe(31);
      expect(component.monthName).toContain('January');
      expect(component.monthName).toContain('2024');
    });

    it('should calculate leap year February correctly', () => {
      component.currentMonth = new Date(2024, 1, 15); // February 2024 (leap year)

      component.calculateMonthData();

      expect(component.daysInMonth).toBe(29);
    });

    it('should calculate non-leap year February correctly', () => {
      component.currentMonth = new Date(2023, 1, 15); // February 2023

      component.calculateMonthData();

      expect(component.daysInMonth).toBe(28);
    });
  });

  describe('changeMonth', () => {
    it('should go to previous month', () => {
      component.currentMonth = new Date(2024, 5, 15); // June 2024
      spyOn(component, 'calculateMonthData');

      component.changeMonth(-1);

      expect(component.currentMonth.getMonth()).toBe(4); // May
      expect(component.calculateMonthData).toHaveBeenCalled();
    });

    it('should go to next month', () => {
      component.currentMonth = new Date(2024, 5, 15); // June 2024
      spyOn(component, 'calculateMonthData');

      component.changeMonth(1);

      expect(component.currentMonth.getMonth()).toBe(6); // July
      expect(component.calculateMonthData).toHaveBeenCalled();
    });

    it('should handle year transition forward', () => {
      component.currentMonth = new Date(2024, 11, 15); // December 2024

      component.changeMonth(1);

      expect(component.currentMonth.getMonth()).toBe(0); // January
      expect(component.currentMonth.getFullYear()).toBe(2025);
    });

    it('should handle year transition backward', () => {
      component.currentMonth = new Date(2024, 0, 15); // January 2024

      component.changeMonth(-1);

      expect(component.currentMonth.getMonth()).toBe(11); // December
      expect(component.currentMonth.getFullYear()).toBe(2023);
    });
  });

  describe('applyFilters', () => {
    beforeEach(() => {
      component.bookingsByApartment = [
        {
          apartment: mockApartments[0],
          bookings: [mockBookings[0], mockBookings[1]]
        },
        {
          apartment: mockApartments[1],
          bookings: [mockBookings[2]]
        }
      ];
    });

    it('should show all bookings when filter is ALL', () => {
      component.filterState = 'ALL';
      component.searchTerm = '';

      component.applyFilters();

      expect(component.filteredBookingsByApartment.length).toBe(2);
      expect(component.filteredBookingsByApartment[0].bookings.length).toBe(2);
    });

    it('should filter by CONFIRMED state', () => {
      component.filterState = 'CONFIRMED';
      component.searchTerm = '';

      component.applyFilters();

      const allBookings = component.filteredBookingsByApartment
        .flatMap(item => item.bookings);
      
      expect(allBookings.every(b => b.state === 'CONFIRMED')).toBeTrue();
    });

    it('should filter by COMPLETED state', () => {
      component.filterState = 'COMPLETED';
      component.searchTerm = '';

      component.applyFilters();

      const allBookings = component.filteredBookingsByApartment
        .flatMap(item => item.bookings);
      
      expect(allBookings.every(b => b.state === 'COMPLETED')).toBeTrue();
    });

    it('should filter by apartment name (case insensitive)', () => {
      component.filterState = 'ALL';
      component.searchTerm = 'beach';

      component.applyFilters();

      expect(component.filteredBookingsByApartment.length).toBe(1);
      expect(component.filteredBookingsByApartment[0].apartment.name).toBe('Beach Apartment');
    });

    it('should filter by both state and search term', () => {
      component.filterState = 'CONFIRMED';
      component.searchTerm = 'beach';

      component.applyFilters();

      expect(component.filteredBookingsByApartment.length).toBe(1);
      const bookings = component.filteredBookingsByApartment[0].bookings;
      expect(bookings.every(b => b.state === 'CONFIRMED')).toBeTrue();
    });

    it('should keep apartments with no bookings if they match search', () => {
      component.bookingsByApartment[0].bookings = [];
      component.filterState = 'ALL';
      component.searchTerm = 'beach';

      component.applyFilters();

      expect(component.filteredBookingsByApartment.length).toBe(1);
      expect(component.filteredBookingsByApartment[0].apartment.name).toBe('Beach Apartment');
    });
  });

  describe('onFilterChange', () => {
    it('should call applyFilters', () => {
      spyOn(component, 'applyFilters');

      component.onFilterChange();

      expect(component.applyFilters).toHaveBeenCalled();
    });
  });

  describe('onSearchChange', () => {
    it('should call applyFilters', () => {
      spyOn(component, 'applyFilters');

      component.onSearchChange();

      expect(component.applyFilters).toHaveBeenCalled();
    });
  });

  describe('getBookingForDate', () => {
    beforeEach(() => {
      component.filteredBookingsByApartment = [
        {
          apartment: mockApartments[0],
          bookings: [{
            ...mockBookings[0],
            startDate: new Date('2024-12-15'),
            endDate: new Date('2024-12-20')
          }]
        }
      ];
      component.year = 2024;
      component.month = 11; // December
    });

    it('should return booking if date falls within booking range', () => {
      const booking = component.getBookingForDate(1, 17);

      expect(booking).toBeTruthy();
      expect(booking?.id).toBe(1);
    });

    it('should return booking on start date', () => {
      const booking = component.getBookingForDate(1, 15);

      expect(booking).toBeTruthy();
      expect(booking?.id).toBe(1);
    });

    it('should return booking on end date', () => {
      const booking = component.getBookingForDate(1, 20);

      expect(booking).toBeTruthy();
      expect(booking?.id).toBe(1);
    });

    it('should return null if date is before booking', () => {
      const booking = component.getBookingForDate(1, 14);

      expect(booking).toBeNull();
    });

    it('should return null if date is after booking', () => {
      const booking = component.getBookingForDate(1, 21);

      expect(booking).toBeNull();
    });

    it('should return null if apartment not found', () => {
      const booking = component.getBookingForDate(999, 17);

      expect(booking).toBeNull();
    });
  });

  describe('formatDateToString', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 5);

      const result = component.formatDateToString(date);

      expect(result).toBe('2024-01-05');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 8, 9); // September 9

      const result = component.formatDateToString(date);

      expect(result).toBe('2024-09-09');
    });
  });

  describe('formatDate', () => {
    it('should format date with month abbreviation', () => {
      const date = new Date(2024, 0, 15);

      const result = component.formatDate(date);

      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for CONFIRMED', () => {
      expect(component.getStatusClass('CONFIRMED')).toBe('chip-confirmed');
      expect(component.getStatusClass('confirmed')).toBe('chip-confirmed');
    });

    it('should return correct class for COMPLETED', () => {
      expect(component.getStatusClass('COMPLETED')).toBe('chip-completed');
    });

    it('should return correct class for CANCELLED', () => {
      expect(component.getStatusClass('CANCELLED')).toBe('chip-cancelled');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });
  });

  describe('getDayName', () => {
    it('should return abbreviated day name', () => {
      component.year = 2024;
      component.month = 0; // January 2024

      const dayName = component.getDayName(1); // January 1, 2024 is Monday

      expect(dayName).toBe('Mon');
    });
  });

  describe('getBookingTooltip', () => {
    it('should generate correct tooltip text', () => {
      const booking: BookingDTO = {
        id: 123,
        userId: 456,
        apartmentId: 1,
        startDate: new Date(),
        endDate: new Date(),
        guests: 3,
        state: 'CONFIRMED',
        cost: 500,
        createdAt: new Date()
      };

      const tooltip = component.getBookingTooltip(booking);

      expect(tooltip).toContain('Booking #123');
      expect(tooltip).toContain('3 guests');
      expect(tooltip).toContain('$500');
      expect(tooltip).toContain('User: 456');
    });
  });

  describe('calculateStatistics', () => {
    beforeEach(() => {
      component.bookingsByApartment = [
        {
          apartment: mockApartments[0],
          bookings: [
            { ...mockBookings[0], state: 'CONFIRMED', cost: 750, createdAt: new Date() },
            { ...mockBookings[1], state: 'COMPLETED', cost: 750, createdAt: new Date() }
          ]
        },
        {
          apartment: mockApartments[1],
          bookings: [
            { ...mockBookings[2], state: 'CONFIRMED', cost: 1000, createdAt: new Date() }
          ]
        }
      ];
    });

    it('should calculate total bookings correctly', () => {
      component.calculateStatistics();

      expect(component.totalBookings).toBe(3);
    });

    it('should calculate confirmed bookings correctly', () => {
      component.calculateStatistics();

      expect(component.confirmedBookings).toBe(2);
    });

    it('should calculate completed bookings correctly', () => {
      component.calculateStatistics();

      expect(component.completedBookings).toBe(1);
    });

    it('should calculate total revenue correctly', () => {
      component.calculateStatistics();

      expect(component.totalRevenue).toBe(2500);
    });

    it('should handle empty bookings', () => {
      component.bookingsByApartment = [
        { apartment: mockApartments[0], bookings: [] }
      ];

      component.calculateStatistics();

      expect(component.totalBookings).toBe(0);
      expect(component.confirmedBookings).toBe(0);
      expect(component.completedBookings).toBe(0);
      expect(component.totalRevenue).toBe(0);
    });
  });

  describe('View Type', () => {
    it('should default to calendar view', () => {
      expect(component.viewType).toBe('calendar');
    });

    it('should allow switching to list view', () => {
      component.viewType = 'list';

      expect(component.viewType).toBe('list');
    });
  });

  describe('Integration scenarios', () => {
    it('should properly chain loadData operations', (done) => {
      apartmentService.getAllApartments.and.returnValue(of(mockApartments));
      bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));

      component.loadData();

      setTimeout(() => {
        expect(component.apartments.length).toBe(2);
        expect(component.bookingsByApartment.length).toBe(2);
        expect(component.filteredBookingsByApartment.length).toBe(2);
        expect(component.totalBookings).toBeGreaterThan(0);
        expect(component.loading).toBeFalse();
        done();
      }, 100);
    });

    it('should filter and maintain statistics correctly', (done) => {
      apartmentService.getAllApartments.and.returnValue(of(mockApartments));
      bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));

      component.loadData();

      setTimeout(() => {
        const initialTotal = component.totalBookings;
        
        component.filterState = 'CONFIRMED';
        component.applyFilters();

        // Statistics should not change, only filtered view
        expect(component.totalBookings).toBe(initialTotal);
        expect(component.filteredBookingsByApartment.length).toBeLessThanOrEqual(2);
        done();
      }, 100);
    });
  });
});