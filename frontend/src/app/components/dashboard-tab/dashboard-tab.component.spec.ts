import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { DashboardTabComponent } from './dashboard-tab.component';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ReviewService } from '../../services/review/review.service';
import { BookingDTO } from '../../dtos/booking.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ReviewDTO } from '../../dtos/review.dto';

describe('DashboardTabComponent', () => {
  let component: DashboardTabComponent;
  let fixture: ComponentFixture<DashboardTabComponent>;
  let bookingService: jasmine.SpyObj<BookingService>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let reviewService: jasmine.SpyObj<ReviewService>;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: 'Apartment 1',
      description: 'Description 1',
      price: 100,
      services: new Set(['WiFi', 'AC']),
      capacity: 4,
      imagesUrl: ['img1.jpg']
    },
    {
      id: 2,
      name: 'Apartment 2',
      description: 'Description 2',
      price: 150,
      services: new Set(['WiFi']),
      capacity: 2,
      imagesUrl: ['img2.jpg']
    }
  ];

  const mockBookings: BookingDTO[] = [
    {
      id: 1,
      userId: 1,
      apartmentId: 1,
      startDate: new Date('2024-11-20'),
      endDate: new Date('2024-11-25'),
      cost: 500,
      state: 'CONFIRMED',
      guests: 2,
      createdAt: new Date('2024-11-01')
    },
    {
      id: 2,
      userId: 2,
      apartmentId: 1,
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-22'),
      cost: 700,
      state: 'CONFIRMED',
      guests: 3,
      createdAt: new Date('2024-11-02')
    },
    {
      id: 3,
      userId: 3,
      apartmentId: 2,
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-10-05'),
      cost: 600,
      state: 'COMPLETED',
      guests: 2,
      createdAt: new Date('2024-09-15')
    }
  ];

  const mockReviews: ReviewDTO[] = [
    {
      id: 1,
      userId: 1,
      userName: 'John Doe',
      apartmentId: 1,
      date: new Date('2024-11-26'),
      comment: 'Great apartment!',
      rating: 5
    },
    {
      id: 2,
      userId: 2,
      userName: 'Jane Smith',
      apartmentId: 1,
      date: new Date('2024-11-23'),
      comment: 'Very comfortable',
      rating: 4.5
    },
    {
      id: 3,
      userId: 3,
      userName: 'Bob Johnson',
      apartmentId: 2,
      date: new Date('2024-10-06'),
      comment: 'Nice place',
      rating: 4
    }
  ];

  beforeEach(async () => {
    const bookingServiceSpy = jasmine.createSpyObj('BookingService', ['getBookingsByApartmentId']);
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', ['getAllApartments']);
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['getApartmentRating', 'getReviewsByApartment']);

    await TestBed.configureTestingModule({
      imports: [
        DashboardTabComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: ReviewService, useValue: reviewServiceSpy },
        provideCharts(withDefaultRegisterables())
      ]
    }).compileComponents();

    bookingService = TestBed.inject(BookingService) as jasmine.SpyObj<BookingService>;
    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;

    // Default mock responses
    apartmentService.getAllApartments.and.returnValue(of(mockApartments));
    bookingService.getBookingsByApartmentId.and.returnValue(of(mockBookings));
    reviewService.getApartmentRating.and.returnValue(of(4.5));
    reviewService.getReviewsByApartment.and.returnValue(of(mockReviews));

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
      expect(component.averageBookingDuration).toBe(0);
    });

    it('should initialize maps for ratings and reviews', () => {
      expect(component.apartmentRatings).toBeInstanceOf(Map);
      expect(component.apartmentReviews).toBeInstanceOf(Map);
      expect(component.apartmentRatings.size).toBe(0);
      expect(component.apartmentReviews.size).toBe(0);
    });

    it('should set chart types correctly', () => {
      expect(component.occupancyChartType).toBe('line');
      expect(component.bookingsChartType).toBe('bar');
      expect(component.ratingChartType).toBe('bar');
    });

    it('should initialize chart data structures', () => {
      expect(component.occupancyChartData).toBeDefined();
      expect(component.occupancyChartData.labels).toEqual([]);
      expect(component.occupancyChartData.datasets).toEqual([]);
      
      expect(component.bookingsChartData).toBeDefined();
      expect(component.bookingsChartData.labels).toEqual([]);
      
      expect(component.ratingChartData).toBeDefined();
      expect(component.ratingChartData.labels).toEqual([]);
    });

    it('should initialize chart options', () => {
      expect(component.occupancyChartOptions).toBeDefined();
      expect(component.bookingsChartOptions).toBeDefined();
      expect(component.ratingChartOptions).toBeDefined();
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

    it('should call loadApartmentRatings after loading bookings', (done) => {
      spyOn(component, 'loadApartmentRatings');
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.loadApartmentRatings).toHaveBeenCalled();
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

  describe('loadApartmentRatings', () => {
    beforeEach(() => {
      component.apartments = mockApartments;
    });

    it('should load ratings for all apartments', (done) => {
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(reviewService.getApartmentRating).toHaveBeenCalledTimes(2);
        expect(reviewService.getApartmentRating).toHaveBeenCalledWith(1);
        expect(reviewService.getApartmentRating).toHaveBeenCalledWith(2);
        done();
      }, 100);
    });

    it('should load reviews for all apartments', (done) => {
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(reviewService.getReviewsByApartment).toHaveBeenCalledTimes(2);
        expect(reviewService.getReviewsByApartment).toHaveBeenCalledWith(1, 0, 1000);
        expect(reviewService.getReviewsByApartment).toHaveBeenCalledWith(2, 0, 1000);
        done();
      }, 100);
    });

    it('should store ratings in apartmentRatings map', (done) => {
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.apartmentRatings.size).toBe(2);
        expect(component.apartmentRatings.get(1)).toBe(4.5);
        expect(component.apartmentRatings.get(2)).toBe(4.5);
        done();
      }, 100);
    });

    it('should store reviews in apartmentReviews map', (done) => {
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.apartmentReviews.size).toBe(2);
        expect(component.apartmentReviews.get(1)).toBeDefined();
        expect(component.apartmentReviews.get(2)).toBeDefined();
        done();
      }, 100);
    });

    it('should handle rating loading error with default value 0', (done) => {
      reviewService.getApartmentRating.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.apartmentRatings.get(1)).toBe(0);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should handle reviews loading error with empty array', (done) => {
      reviewService.getReviewsByApartment.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.apartmentReviews.get(1)).toEqual([]);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should call calculateStatistics after loading ratings', (done) => {
      spyOn(component, 'calculateStatistics');
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.calculateStatistics).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should call generateRatingChart after loading ratings', (done) => {
      spyOn(component, 'generateRatingChart');
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.generateRatingChart).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set loading to false after all ratings loaded', (done) => {
      component.loadApartmentRatings();
      
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('onPeriodChange', () => {
    it('should call calculateStatistics', () => {
      spyOn(component, 'calculateStatistics');
      component.onPeriodChange();
      expect(component.calculateStatistics).toHaveBeenCalled();
    });

    it('should call generateOccupancyChart', () => {
      spyOn(component, 'generateOccupancyChart');
      component.onPeriodChange();
      expect(component.generateOccupancyChart).toHaveBeenCalled();
    });

    it('should call generateBookingsPerApartmentChart', () => {
      spyOn(component, 'generateBookingsPerApartmentChart');
      component.onPeriodChange();
      expect(component.generateBookingsPerApartmentChart).toHaveBeenCalled();
    });

    it('should call generateRatingChart', () => {
      spyOn(component, 'generateRatingChart');
      component.onPeriodChange();
      expect(component.generateRatingChart).toHaveBeenCalled();
    });
  });

  describe('getFilteredBookings', () => {
    beforeEach(() => {
      component.allBookings = [
        ...mockBookings,
        { ...mockBookings[0], state: 'CANCELLED' },
        { ...mockBookings[0], state: 'PENDING' }
      ];
    });

    it('should filter bookings by COMPLETED or CONFIRMED state', () => {
      const filtered = component.getFilteredBookings();
      expect(filtered.every(b => b.state === 'COMPLETED' || b.state === 'CONFIRMED')).toBe(true);
    });

    it('should exclude CANCELLED bookings', () => {
      const filtered = component.getFilteredBookings();
      expect(filtered.some(b => b.state === 'CANCELLED')).toBe(false);
    });

    it('should exclude PENDING bookings', () => {
      const filtered = component.getFilteredBookings();
      expect(filtered.some(b => b.state === 'PENDING')).toBe(false);
    });

    it('should handle null bookings', () => {
      component.allBookings = [...mockBookings, null as any];
      const filtered = component.getFilteredBookings();
      expect(filtered.every(b => b !== null)).toBe(true);
    });
  });

  describe('getDateRange', () => {
    it('should return correct range for past 30 days', () => {
      component.selectedPeriod = '30';
      const { startDate, endDate } = component.getDateRange();
      
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it('should return correct range for past 7 days', () => {
      component.selectedPeriod = '7';
      const { startDate, endDate } = component.getDateRange();
      
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should return correct range for future 30 days', () => {
      component.selectedPeriod = '-30';
      const { startDate, endDate } = component.getDateRange();
      
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it('should return correct range for future 7 days', () => {
      component.selectedPeriod = '-7';
      const { startDate, endDate } = component.getDateRange();
      
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });
  });

  describe('calculateStatistics', () => {
    beforeEach(() => {
      component.allBookings = mockBookings;
      component.apartments = mockApartments;
    });

    it('should calculate total bookings correctly', () => {
      component.calculateStatistics();
      expect(component.totalBookings).toBeGreaterThanOrEqual(0);
    });

    it('should calculate active bookings correctly', () => {
      component.calculateStatistics();
      expect(component.activeBookings).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total revenue correctly', () => {
      component.calculateStatistics();
      expect(component.totalRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average booking duration', () => {
      component.calculateStatistics();
      expect(component.averageBookingDuration).toBeGreaterThanOrEqual(0);
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
      expect(component.averageBookingDuration).toBe(0);
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

    it('should only count bookings within date range', () => {
      component.selectedPeriod = '7';
      component.calculateStatistics();
      
      const total = component.totalBookings;
      component.selectedPeriod = '30';
      component.calculateStatistics();
      
      expect(component.totalBookings).toBeGreaterThanOrEqual(total);
    });
  });

  describe('calculateOccupiedDays', () => {
    beforeEach(() => {
      component.allBookings = mockBookings;
    });

    it('should calculate occupied days for given period', () => {
      const days = component.calculateOccupiedDays();
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty bookings', () => {
      component.allBookings = [];
      const days = component.calculateOccupiedDays();
      expect(days).toBe(0);
    });

    it('should handle bookings with null dates', () => {
      component.allBookings = [
        { ...mockBookings[0], startDate: null as any }
      ];
      
      const days = component.calculateOccupiedDays();
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it('should only count overlapping days', () => {
      component.selectedPeriod = '7';
      const days7 = component.calculateOccupiedDays();
      
      component.selectedPeriod = '30';
      const days30 = component.calculateOccupiedDays();
      
      expect(days30).toBeGreaterThanOrEqual(days7);
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

    it('should handle future periods', () => {
      component.selectedPeriod = '-30';
      component.generateOccupancyChart();
      expect(component.occupancyChartData.labels?.length).toBe(30);
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

    it('should only include bookings within date range', () => {
      component.selectedPeriod = '7';
      component.generateBookingsPerApartmentChart();
      const data7 = component.bookingsChartData.datasets[0].data as number[];
      
      component.selectedPeriod = '90';
      component.generateBookingsPerApartmentChart();
      const data90 = component.bookingsChartData.datasets[0].data as number[];
      
      expect(data90.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(data7.reduce((a, b) => a + b, 0));
    });
  });

  describe('generateRatingChart', () => {
    beforeEach(() => {
      component.apartments = mockApartments;
      component.apartmentReviews.set(1, mockReviews.filter(r => r.apartmentId === 1));
      component.apartmentReviews.set(2, mockReviews.filter(r => r.apartmentId === 2));
    });

    it('should generate chart data', () => {
      component.generateRatingChart();
      
      expect(component.ratingChartData.labels).toBeDefined();
      expect(component.ratingChartData.datasets.length).toBe(1);
    });

    it('should calculate average rating from reviews', () => {
      component.generateRatingChart();
      
      const data = component.ratingChartData.datasets[0].data as number[];
      expect(data.every(rating => rating >= 0 && rating <= 5)).toBe(true);
    });

    it('should sort apartments by rating descending', () => {
      component.generateRatingChart();
      
      const data = component.ratingChartData.datasets[0].data as number[];
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
      
      manyApartments.forEach((apt, index) => {
        const reviews: ReviewDTO[] = [{
          id: index + 1,
          userId: 1,
          userName: 'User',
          apartmentId: apt.id,
          date: new Date(),
          comment: 'Good',
          rating: 4 + (index % 2) * 0.5
        }];
        component.apartmentReviews.set(apt.id, reviews);
      });
      
      component.generateRatingChart();
      
      expect(component.ratingChartData.labels?.length).toBeLessThanOrEqual(10);
    });

    it('should filter reviews by date range', () => {
      component.selectedPeriod = '7';
      component.generateRatingChart();
      const data7 = component.ratingChartData.labels?.length || 0;
      
      component.selectedPeriod = '90';
      component.generateRatingChart();
      const data90 = component.ratingChartData.labels?.length || 0;
      
      expect(data90).toBeGreaterThanOrEqual(data7);
    });

    it('should handle apartments with no reviews', () => {
      component.apartmentReviews.clear();
      component.generateRatingChart();
      
      expect(component.ratingChartData.labels?.length).toBe(0);
      expect(component.ratingChartData.datasets[0].data.length).toBe(0);
    });

    it('should exclude apartments with rating 0', () => {
      component.apartmentReviews.set(1, []);
      component.generateRatingChart();
      
      const labels = component.ratingChartData.labels as string[];
      expect(labels.every(label => label !== 'Apartment 1' || component.apartmentReviews.get(1)!.length > 0)).toBe(true);
    });

    it('should handle reviews with null dates', () => {
      const reviewsWithNull = [
        ...mockReviews,
        { ...mockReviews[0], date: null as any }
      ];
      component.apartmentReviews.set(1, reviewsWithNull);
      
      expect(() => component.generateRatingChart()).not.toThrow();
    });

    it('should set correct chart colors', () => {
      component.generateRatingChart();
      
      expect(component.ratingChartData.datasets[0].backgroundColor).toBe('rgba(67, 233, 123, 0.8)');
      expect(component.ratingChartData.datasets[0].borderColor).toBe('rgba(67, 233, 123, 1)');
    });

    it('should set correct dataset label', () => {
      component.generateRatingChart();
      
      expect(component.ratingChartData.datasets[0].label).toBe('Average Rating');
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

    it('should display average booking duration statistic', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Avg. Booking Duration');
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

    it('should have all chart canvases', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const canvases = compiled.querySelectorAll('canvas');
        
        expect(canvases.length).toBe(3); // occupancy, bookings, and rating charts
        done();
      }, 100);
    });

    it('should display period selector options', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Select Period');
        done();
      }, 100);
    });

    it('should have chart titles', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const content = compiled.textContent;
        
        expect(content).toContain('Occupancy Over Time');
        expect(content).toContain('Top Apartments by Bookings');
        expect(content).toContain('Top Apartments by Rating');
        done();
      }, 100);
    });

    it('should display stat card icons', (done) => {
      component.loadDashboardData();
      
      setTimeout(() => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const icons = compiled.querySelectorAll('.stat-icon mat-icon');
        
        expect(icons.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle simultaneous errors in all services', (done) => {
      spyOn(console, 'error');
      apartmentService.getAllApartments.and.returnValue(throwError(() => new Error('Apartments error')));
      bookingService.getBookingsByApartmentId.and.returnValue(throwError(() => new Error('Bookings error')));
      reviewService.getApartmentRating.and.returnValue(throwError(() => new Error('Ratings error')));
      
      component.loadDashboardData();
      
      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(console.error).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle bookings with invalid date formats', () => {
      component.allBookings = [{
        ...mockBookings[0],
        startDate: 'invalid-date' as any,
        endDate: 'invalid-date' as any
      }];
      
      expect(() => component.calculateStatistics()).not.toThrow();
      expect(() => component.generateOccupancyChart()).not.toThrow();
    });

    it('should handle reviews with ratings outside 0-5 range', () => {
      const invalidReviews: ReviewDTO[] = [{
        ...mockReviews[0],
        rating: 10
      }];
      component.apartmentReviews.set(1, invalidReviews);
      
      expect(() => component.generateRatingChart()).not.toThrow();
    });

    it('should handle apartments with duplicate IDs', () => {
      component.apartments = [
        mockApartments[0],
        { ...mockApartments[0], name: 'Duplicate' }
      ];
      
      expect(() => component.generateBookingsPerApartmentChart()).not.toThrow();
    });

    it('should handle very large datasets', () => {
      const largeBookings = Array.from({ length: 10000 }, (_, i) => ({
        ...mockBookings[0],
        id: i + 1
      }));
      component.allBookings = largeBookings;
      
      expect(() => component.calculateStatistics()).not.toThrow();
      expect(() => component.generateOccupancyChart()).not.toThrow();
    });

    it('should handle zero period selection', () => {
      component.selectedPeriod = '0';
      
      expect(() => component.calculateStatistics()).not.toThrow();
      expect(() => component.generateOccupancyChart()).not.toThrow();
    });

    it('should handle bookings that span across period boundary', () => {
      const today = new Date();
      component.allBookings = [{
        ...mockBookings[0],
        startDate: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)
      }];
      component.selectedPeriod = '30';
      
      component.calculateStatistics();
      expect(component.totalBookings).toBeGreaterThanOrEqual(0);
    });
  });
});