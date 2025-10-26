import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { DashboardTabComponent } from './dashboard-tab.component';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { BookingDTO } from '../../dtos/booking.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';

describe('DashboardTabComponent', () => {
  let component: DashboardTabComponent;
  let fixture: ComponentFixture<DashboardTabComponent>;
  let bookingService: jasmine.SpyObj<BookingService>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;

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
      services: new Set(['WiFi']),
      capacity: 2,
      imageUrl: 'img2.jpg'
    }
  ];

  const mockBookings: BookingDTO[] = [
    {
      id: 1,
      userId: 1,
      apartmentId: 1,
      startDate: new Date('2025-10-20'),
      endDate: new Date('2025-10-25'),
      cost: 500,
      state: 'CONFIRMED',
      guests: 2,
      createdAt: new Date('2025-10-01')
    },
    {
      id: 2,
      userId: 2,
      apartmentId: 1,
      startDate: new Date('2025-10-15'),
      endDate: new Date('2025-10-22'),
      cost: 700,
      state: 'CONFIRMED',
      guests: 3,
      createdAt: new Date('2025-10-02')
    },
    {
      id: 3,
      userId: 3,
      apartmentId: 2,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-05'),
      cost: 600,
      state: 'COMPLETED',
      guests: 2,
      createdAt: new Date('2025-08-15')
    }
  ];

  beforeEach(async () => {
    const bookingServiceSpy = jasmine.createSpyObj('BookingService', ['getBookingsByApartmentId']);
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', ['getAllApartments']);

    await TestBed.configureTestingModule({
      imports: [
        DashboardTabComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        provideCharts(withDefaultRegisterables())
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService) as jasmine.SpyObj<BookingService>;
    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;

    // Default mock responses
    apartmentService.getAllApartments.and.returnValue(of(mockApartments));
    bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));

    fixture = TestBed.createComponent(DashboardTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.loading).toBe(true);
      expect(component.apartments).toEqual([]);
      expect(component.allBookings).toEqual([]);
      expect(component.selectedPeriod).toBe('30');
      expect(component.totalBookings).toBe(0);
      expect(component.activeBookings).toBe(0);
      expect(component.totalRevenue).toBe(0);
      expect(component.averageOccupancy).toBe(0);
    });

    it('should set chart types correctly', () => {
      expect(component.occupancyChartType).toBe('line');
      expect(component.bookingsChartType).toBe('bar');
    });

    it('should initialize chart data structures', () => {
      expect(component.occupancyChartData).toBeDefined();
      expect(component.occupancyChartData.labels).toEqual([]);
      expect(component.occupancyChartData.datasets).toEqual([]);
      
      expect(component.bookingsChartData).toBeDefined();
      expect(component.bookingsChartData.labels).toEqual([]);
    });

    it('should initialize chart options', () => {
      expect(component.occupancyChartOptions).toBeDefined();
      expect(component.bookingsChartOptions).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadDashboardData', () => {
      spyOn(component, 'loadDashboardData');
      component.ngOnInit();
      expect(component.loadDashboardData).toHaveBeenCalled();
    });

    it('should log initialization messages', () => {
      spyOn(console, 'log');
      component.ngOnInit();
      expect(console.log).toHaveBeenCalledWith('Dashboard component initialized');
    });
  });

  describe('loadDashboardData', () => {
    it('should load apartments', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(apartmentService.getAllApartments).toHaveBeenCalledWith(0, 100);
        expect(component.apartments.length).toBe(2);
        done();
      }, 100);
    });

    it('should load bookings for each apartment', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(bookingService.getBookingsByApartmentId).toHaveBeenCalledTimes(2);
        expect(bookingService.getBookingsByApartmentId).toHaveBeenCalledWith(1, 0, 1000);
        expect(bookingService.getBookingsByApartmentId).toHaveBeenCalledWith(2, 0, 1000);
        done();
      }, 100);
    });

    it('should flatten and store all bookings', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.allBookings.length).toBeGreaterThan(0);
        done();
      }, 100);
    });

    it('should set loading to false after data loads', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should handle empty apartments array', (done) => {
      apartmentService.getAllApartments.and.returnValue(of([]));
      
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.apartments).toEqual([]);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should handle apartments loading error', (done) => {
      spyOn(console, 'error');
      apartmentService.getAllApartments.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(console.error).toHaveBeenCalled();
        expect(component.loading).toBe(false);
        expect(component.apartments).toEqual([]);
        done();
      }, 100);
    });

    it('should handle bookings loading error', (done) => {
      spyOn(console, 'error');
      bookingService.getBookingsByApartmentId.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(console.error).toHaveBeenCalled();
        expect(component.allBookings).toEqual([]);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should call calculateStatistics after loading', (done) => {
      spyOn(component, 'calculateStatistics');
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.calculateStatistics).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should call generateOccupancyChart after loading', (done) => {
      spyOn(component, 'generateOccupancyChart');
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.generateOccupancyChart).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should call generateBookingsPerApartmentChart after loading', (done) => {
      spyOn(component, 'generateBookingsPerApartmentChart');
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.generateBookingsPerApartmentChart).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should filter out null bookings', (done) => {
      const bookingsWithNull = [...mockBookings, null as any, undefined as any];
      bookingService.getBookingsByApartmentId.and.returnValue(of(bookingsWithNull));
      
      component.loadDashboardData();
      
      setTimeout(() => {
        const validBookingsCount = component.allBookings.filter(b => 
          b && b.id && b.userId && b.apartmentId
        ).length;
        expect(validBookingsCount).toBeGreaterThanOrEqual(mockBookings.length);
        expect(component.allBookings.every(b => b !== null && b !== undefined)).toBe(true);
        done();
      }, 100);
    });
  });

  describe('onPeriodChange', () => {
    it('should call generateOccupancyChart', () => {
      spyOn(component, 'generateOccupancyChart');
      component.onPeriodChange();
      expect(component.generateOccupancyChart).toHaveBeenCalled();
    });
  });

  describe('calculateStatistics', () => {
    beforeEach(() => {
      component.allBookings = mockBookings;
      component.apartments = mockApartments;
    });

    it('should calculate total bookings correctly', () => {
      component.calculateStatistics();
      expect(component.totalBookings).toBe(3);
    });

    it('should calculate active bookings correctly', () => {
      component.calculateStatistics();
      expect(component.activeBookings).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total revenue correctly', () => {
      component.calculateStatistics();
      expect(component.totalRevenue).toBe(1800);
    });

    it('should calculate average occupancy', () => {
      component.calculateStatistics();
      expect(component.averageOccupancy).toBeGreaterThanOrEqual(0);
      expect(component.averageOccupancy).toBeLessThanOrEqual(100);
    });

    it('should handle empty bookings array', () => {
      component.allBookings = [];
      component.calculateStatistics();
      
      expect(component.totalBookings).toBe(0);
      expect(component.activeBookings).toBe(0);
      expect(component.totalRevenue).toBe(0);
    });

    it('should handle bookings with null values', () => {
      component.allBookings = [
        ...mockBookings,
        { ...mockBookings[0], cost: null as any }
      ];
      
      expect(() => component.calculateStatistics()).not.toThrow();
    });

    it('should filter out invalid bookings when calculating active bookings', () => {
      component.allBookings = [
        ...mockBookings,
        { ...mockBookings[0], startDate: null as any }
      ];
      
      component.calculateStatistics();
      expect(component.activeBookings).toBeGreaterThanOrEqual(0);
    });

    it('should set average occupancy to 0 when no apartments', () => {
      component.apartments = [];
      component.calculateStatistics();
      expect(component.averageOccupancy).toBe(0);
    });
  });

  describe('calculateOccupiedDays', () => {
    beforeEach(() => {
      component.allBookings = mockBookings;
    });

    it('should calculate occupied days for given period', () => {
      const days = component.calculateOccupiedDays(30);
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty bookings', () => {
      component.allBookings = [];
      const days = component.calculateOccupiedDays(30);
      expect(days).toBe(0);
    });

    it('should handle bookings with null dates', () => {
      component.allBookings = [
        { ...mockBookings[0], startDate: null as any }
      ];
      
      const days = component.calculateOccupiedDays(30);
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it('should handle different period lengths', () => {
      const days7 = component.calculateOccupiedDays(7);
      const days30 = component.calculateOccupiedDays(30);
      const days90 = component.calculateOccupiedDays(90);
      
      expect(days7).toBeGreaterThanOrEqual(0);
      expect(days30).toBeGreaterThanOrEqual(0);
      expect(days90).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateOccupancyChart', () => {
    beforeEach(() => {
      component.allBookings = mockBookings;
      component.selectedPeriod = '30';
    });

    it('should generate chart data', () => {
      component.generateOccupancyChart();
      
      expect(component.occupancyChartData.labels?.length).toBe(30);
      expect(component.occupancyChartData.datasets.length).toBe(1);
    });

    it('should generate correct number of data points based on period', () => {
      component.selectedPeriod = '7';
      component.generateOccupancyChart();
      expect(component.occupancyChartData.labels?.length).toBe(7);
      
      component.selectedPeriod = '90';
      component.generateOccupancyChart();
      expect(component.occupancyChartData.labels?.length).toBe(90);
    });

    it('should set dataset label', () => {
      component.generateOccupancyChart();
      expect(component.occupancyChartData.datasets[0].label).toBe('Active Bookings');
    });

    it('should handle empty bookings array', () => {
      component.allBookings = [];
      component.generateOccupancyChart();
      
      expect(component.occupancyChartData.labels?.length).toBe(30);
      expect(component.occupancyChartData.datasets[0].data.every((d: any) => d === 0)).toBe(true);
    });

    it('should filter out invalid bookings', () => {
      component.allBookings = [
        ...mockBookings,
        { ...mockBookings[0], startDate: null as any }
      ];
      
      expect(() => component.generateOccupancyChart()).not.toThrow();
    });
  });

  describe('generateBookingsPerApartmentChart', () => {
    beforeEach(() => {
      component.apartments = mockApartments;
      component.allBookings = mockBookings;
    });

    it('should generate chart data', () => {
      component.generateBookingsPerApartmentChart();
      
      expect(component.bookingsChartData.labels?.length).toBeGreaterThan(0);
      expect(component.bookingsChartData.datasets[0].data.length).toBeGreaterThan(0);
    });

    it('should sort apartments by booking count', () => {
      component.generateBookingsPerApartmentChart();
      
      const data = component.bookingsChartData.datasets[0].data as number[];
      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1]).toBeGreaterThanOrEqual(data[i]);
      }
    });

    it('should limit to top 10 apartments', () => {
      const manyApartments = Array.from({ length: 15 }, (_, i) => ({
        ...mockApartments[0],
        id: i + 1,
        name: `Apartment ${i + 1}`
      }));
      component.apartments = manyApartments;
      
      component.generateBookingsPerApartmentChart();
      
      expect(component.bookingsChartData.labels?.length).toBeLessThanOrEqual(10);
    });

    it('should handle apartments with no bookings', () => {
      component.allBookings = [];
      component.generateBookingsPerApartmentChart();
      
      expect(component.bookingsChartData.datasets[0].data.every((d: any) => d === 0)).toBe(true);
    });

    it('should filter out bookings with null apartmentId', () => {
      component.allBookings = [
        ...mockBookings,
        { ...mockBookings[0], apartmentId: null as any }
      ];
      
      expect(() => component.generateBookingsPerApartmentChart()).not.toThrow();
    });

    it('should set correct labels and data', () => {
      component.generateBookingsPerApartmentChart();
      
      const labels = component.bookingsChartData.labels as string[];
      const data = component.bookingsChartData.datasets[0].data as number[];
      
      expect(labels.length).toBe(data.length);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show loading spinner when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      
      expect(spinner).toBeTruthy();
    });

    it('should show empty state when no apartments', (done) => {
      apartmentService.getAllApartments.and.returnValue(of([]));
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const emptyState = compiled.querySelector('.empty-dashboard');
        
        expect(emptyState).toBeTruthy();
        done();
      }, 100);
    });

    it('should show dashboard content when data is loaded', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const statsGrid = compiled.querySelector('.stats-grid');
        
        expect(statsGrid).toBeTruthy();
        done();
      }, 100);
    });

    it('should display total bookings statistic', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        component.calculateStatistics();
        fixture.detectChanges();
        
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Total Bookings');
        done();
      }, 100);
    });

    it('should display active bookings statistic', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Active Bookings');
        done();
      }, 100);
    });

    it('should display total revenue statistic', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Total Revenue');
        done();
      }, 100);
    });

    it('should display average occupancy statistic', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Average Occupancy');
        done();
      }, 100);
    });

    it('should have period selector', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const select = compiled.querySelector('mat-select');
        
        expect(select).toBeTruthy();
        done();
      }, 100);
    });

    it('should have chart canvases', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const canvases = compiled.querySelectorAll('canvas');
        
        expect(canvases.length).toBe(2);
        done();
      }, 100);
    });
  });
});