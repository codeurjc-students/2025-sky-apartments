import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BookingService } from '../../services/booking/booking.service';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { BookingDTO } from '../../dtos/booking.dto';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { catchError, forkJoin, of } from 'rxjs';
import { ReviewService } from '../../services/review/review.service';
import { ReviewDTO } from '../../dtos/review.dto';

@Component({
  selector: 'app-dashboard-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard-tab.component.html',
  styleUrls: ['./dashboard-tab.component.css']
})
export class DashboardTabComponent implements OnInit {
  loading: boolean = true;
  apartments: ApartmentDTO[] = [];
  allBookings: BookingDTO[] = [];
  
  selectedPeriod: string = '30'; // days
  
  // Occupancy Chart
  occupancyChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  occupancyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Occupancy Over Time',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Active Bookings'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  
  occupancyChartType: ChartType = 'line';
  
  // Bookings per Apartment Chart
  bookingsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Total Bookings',
      data: [],
      backgroundColor: 'rgba(102, 126, 234, 0.8)',
      borderColor: 'rgba(102, 126, 234, 1)',
      borderWidth: 2
    }]
  };
  
  bookingsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Total Bookings per Apartment',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Apartment'
        }
      }
    }
  };
  
  bookingsChartType: ChartType = 'bar';
  
  // Rating Chart
  ratingChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Average Rating',
      data: [],
      backgroundColor: 'rgba(67, 233, 123, 0.8)',
      borderColor: 'rgba(67, 233, 123, 1)',
      borderWidth: 2
    }]
  };
  
  ratingChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top Apartments by Rating',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5
        },
        title: {
          display: true,
          text: 'Average Rating'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Apartment'
        }
      }
    }
  };
  
  ratingChartType: ChartType = 'bar';

  // Statistics
  totalBookings: number = 0;
  activeBookings: number = 0;
  totalRevenue: number = 0;
  averageOccupancy: number = 0;
  averageBookingDuration: number = 0;
  
  // Apartment ratings
  apartmentRatings: Map<number, number> = new Map();
  apartmentReviews: Map<number, ReviewDTO[]> = new Map();

  constructor(
    private bookingService: BookingService,
    private apartmentService: ApartmentService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // First, load all apartments
    this.apartmentService.getAllApartments(0, 100).subscribe({
      next: (apartments) => {
        this.apartments = apartments;
        
        if (apartments.length === 0) {
          this.loading = false;
          this.calculateStatistics();
          this.generateOccupancyChart();
          this.generateBookingsPerApartmentChart();
          return;
        }
        
        // Then load bookings for each apartment
        const bookingRequests = apartments.map(apt => 
          this.bookingService.getBookingsByApartmentId(apt.id, 0, 1000)
        );
        
        forkJoin(bookingRequests).subscribe({
          next: (bookingsArrays) => {
            // Flatten all bookings into a single array and filter out null values
            this.allBookings = bookingsArrays
              .flat()
              .filter(booking => booking !== null && booking !== undefined);
            // Load ratings for all apartments
            this.loadApartmentRatings();
          },
          error: (error) => {
            console.error('Error loading bookings:', error);
            // Even if bookings fail, show the dashboard with 0 bookings
            this.allBookings = [];
            this.calculateStatistics();
            this.generateOccupancyChart();
            this.generateBookingsPerApartmentChart();
            this.generateRatingChart();
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading apartments:', error);
        // Show dashboard even if apartments fail to load
        this.apartments = [];
        this.allBookings = [];
        this.calculateStatistics();
        this.generateOccupancyChart();
        this.generateBookingsPerApartmentChart();
        this.generateRatingChart();
        this.generateRatingChart();
        this.loading = false;
      }
    });
  }

  onPeriodChange(): void {
    this.calculateStatistics();
    this.generateOccupancyChart();
    this.generateBookingsPerApartmentChart();
    this.generateRatingChart();
  }
  
  loadApartmentRatings(): void {
    const ratingRequests = this.apartments.map(apt =>
      this.reviewService.getApartmentRating(apt.id).pipe(
        catchError(() => of(0))
      )
    );
    
    const reviewRequests = this.apartments.map(apt =>
      this.reviewService.getReviewsByApartment(apt.id, 0, 1000).pipe(
        catchError(() => of([]))
      )
    );
    
    forkJoin([forkJoin(ratingRequests), forkJoin(reviewRequests)]).subscribe({
      next: ([ratings, reviewsArrays]) => {
        this.apartments.forEach((apt, index) => {
          this.apartmentRatings.set(apt.id, ratings[index]);
          this.apartmentReviews.set(apt.id, reviewsArrays[index]);
        });
        
        this.calculateStatistics();
        this.generateOccupancyChart();
        this.generateBookingsPerApartmentChart();
        this.generateRatingChart();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ratings:', error);
        this.calculateStatistics();
        this.generateOccupancyChart();
        this.generateBookingsPerApartmentChart();
        this.generateRatingChart();
        this.loading = false;
      }
    });
  }

  // Filtra las reservas por estado COMPLETED o CONFIRMED
  getFilteredBookings(): BookingDTO[] {
    return this.allBookings.filter(booking => 
      booking && 
      (booking.state === 'COMPLETED' || booking.state === 'CONFIRMED')
    );
  }

  // Obtiene el rango de fechas según el período seleccionado
  getDateRange(): { startDate: Date, endDate: Date } {
    const days = parseInt(this.selectedPeriod);
    const endDate = new Date();
    const startDate = new Date();
    
    if (days > 0) {
      // Período pasado
      startDate.setDate(startDate.getDate() - days);
    } else {
      // Período futuro
      startDate.setDate(startDate.getDate());
      endDate.setDate(endDate.getDate() + Math.abs(days));
    }
    
    return { startDate, endDate };
  }

  calculateStatistics(): void {
    const filteredBookings = this.getFilteredBookings();
    const { startDate, endDate } = this.getDateRange();
    
    // Filtrar reservas dentro del rango de fechas seleccionado
    const bookingsInRange = filteredBookings.filter(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return false;
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      // La reserva se solapa con el rango seleccionado
      return bookingEnd >= startDate && bookingStart <= endDate;
    });
    
    this.totalBookings = bookingsInRange.length;
    
    const today = new Date();
    this.activeBookings = filteredBookings.filter(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return false;
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return start <= today && end >= today;
    }).length;
    
    this.totalRevenue = bookingsInRange.reduce((sum, booking) => {
      return sum + (booking?.cost || 0);
    }, 0);
    
    // Calculate average booking duration
    if (bookingsInRange.length > 0) {
      const totalDuration = bookingsInRange.reduce((sum, booking) => {
        if (!booking || !booking.startDate || !booking.endDate) return sum;
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + duration;
      }, 0);
      this.averageBookingDuration = totalDuration / bookingsInRange.length;
    } else {
      this.averageBookingDuration = 0;
    }
    
    // Calculate average occupancy percentage
    const days = Math.abs(parseInt(this.selectedPeriod));
    const totalPossibleDays = this.apartments.length * days;
    const occupiedDays = this.calculateOccupiedDays();
    this.averageOccupancy = totalPossibleDays > 0 
      ? (occupiedDays / totalPossibleDays) * 100 
      : 0;
  }

  calculateOccupiedDays(): number {
    const { startDate, endDate } = this.getDateRange();
    const filteredBookings = this.getFilteredBookings();
    
    let totalOccupied = 0;
    
    filteredBookings.forEach(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return;
      
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      if (bookingEnd >= startDate && bookingStart <= endDate) {
        const overlapStart = bookingStart > startDate ? bookingStart : startDate;
        const overlapEnd = bookingEnd < endDate ? bookingEnd : endDate;
        
        const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        totalOccupied += Math.max(0, daysDiff);
      }
    });
    
    return totalOccupied;
  }

  generateOccupancyChart(): void {
    const days = parseInt(this.selectedPeriod);
    const isFuture = days < 0;
    const absDays = Math.abs(days);
    
    const dates: string[] = [];
    const occupancyData: number[] = [];
    const filteredBookings = this.getFilteredBookings();
    
    // Generate dates for the selected period
    if (isFuture) {
      // Período futuro: desde hoy hacia adelante
      for (let i = 0; i < absDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Count bookings active on this date
        const activeCount = filteredBookings.filter(booking => {
          if (!booking || !booking.startDate || !booking.endDate) return false;
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          return start <= date && end >= date;
        }).length;
        
        occupancyData.push(activeCount);
      }
    } else {
      // Período pasado: desde el pasado hasta hoy
      for (let i = absDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Count bookings active on this date
        const activeCount = filteredBookings.filter(booking => {
          if (!booking || !booking.startDate || !booking.endDate) return false;
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          return start <= date && end >= date;
        }).length;
        
        occupancyData.push(activeCount);
      }
    }
    
    this.occupancyChartData = {
      labels: dates,
      datasets: [{
        label: 'Active Bookings',
        data: occupancyData,
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        fill: true,
        tension: 0.4
      }]
    };
  }
  
  generateRatingChart(): void {
    const { startDate, endDate } = this.getDateRange();
    
    // Calculate average rating for each apartment based on reviews in the selected period
    const apartmentsWithRatings = this.apartments
      .map(apt => {
        const reviews = this.apartmentReviews.get(apt.id) || [];
        
        // Filter reviews by date range
        const reviewsInRange = reviews.filter(review => {
          if (!review || !review.date) return false;
          const reviewDate = new Date(review.date);
          return reviewDate >= startDate && reviewDate <= endDate;
        });
        
        // Calculate average rating for this period
        let avgRating = 0;
        if (reviewsInRange.length > 0) {
          const totalRating = reviewsInRange.reduce((sum, review) => sum + (review.rating || 0), 0);
          avgRating = totalRating / reviewsInRange.length;
        }
        
        return {
          apartment: apt,
          rating: avgRating,
          reviewCount: reviewsInRange.length
        };
      })
      .filter(item => item.rating > 0) // Only apartments with reviews in this period
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10); // Top 10
    
    const labels = apartmentsWithRatings.map(item => item.apartment.name);
    const data = apartmentsWithRatings.map(item => item.rating);
    
    this.ratingChartData = {
      labels: labels,
      datasets: [{
        label: 'Average Rating',
        data: data,
        backgroundColor: 'rgba(67, 233, 123, 0.8)',
        borderColor: 'rgba(67, 233, 123, 1)',
        borderWidth: 2
      }]
    };
  }

  generateBookingsPerApartmentChart(): void {
    const filteredBookings = this.getFilteredBookings();
    const { startDate, endDate } = this.getDateRange();
    
    // Filtrar reservas dentro del rango de fechas
    const bookingsInRange = filteredBookings.filter(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return false;
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return bookingEnd >= startDate && bookingStart <= endDate;
    });
    
    // Count bookings per apartment
    const bookingCounts = new Map<number, number>();
    
    bookingsInRange.forEach(booking => {
      if (!booking || !booking.apartmentId) return;
      const count = bookingCounts.get(booking.apartmentId) || 0;
      bookingCounts.set(booking.apartmentId, count + 1);
    });
    
    // Sort apartments by booking count (descending)
    const sortedApartments = [...this.apartments].sort((a, b) => {
      const countA = bookingCounts.get(a.id) || 0;
      const countB = bookingCounts.get(b.id) || 0;
      return countB - countA;
    });
    
    // Take top 10 apartments
    const topApartments = sortedApartments.slice(0, 10);
    
    const labels = topApartments.map(apt => apt.name);
    const data = topApartments.map(apt => bookingCounts.get(apt.id) || 0);
    
    this.bookingsChartData = {
      labels: labels,
      datasets: [{
        label: 'Total Bookings',
        data: data,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2
      }]
    };
  }
}