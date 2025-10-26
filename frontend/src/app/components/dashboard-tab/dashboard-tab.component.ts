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
import { forkJoin } from 'rxjs';

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

  // Statistics
  totalBookings: number = 0;
  activeBookings: number = 0;
  totalRevenue: number = 0;
  averageOccupancy: number = 0;

  constructor(
    private bookingService: BookingService,
    private apartmentService: ApartmentService
  ) {}

  ngOnInit(): void {
    console.log('Dashboard component initialized');
    console.log('BookingService:', this.bookingService);
    console.log('ApartmentService:', this.apartmentService);
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    console.log('Starting to load dashboard data...');
    
    // First, load all apartments
    this.apartmentService.getAllApartments(0, 100).subscribe({
      next: (apartments) => {
        console.log('Apartments loaded:', apartments.length);
        this.apartments = apartments;
        
        if (apartments.length === 0) {
          console.log('No apartments found');
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
            console.log('Bookings loaded:', bookingsArrays);
            // Flatten all bookings into a single array and filter out null values
            this.allBookings = bookingsArrays
              .flat()
              .filter(booking => booking !== null && booking !== undefined);
            console.log('Total bookings:', this.allBookings.length);
            
            this.calculateStatistics();
            this.generateOccupancyChart();
            this.generateBookingsPerApartmentChart();
            
            this.loading = false;
            console.log('Dashboard data loaded successfully');
          },
          error: (error) => {
            console.error('Error loading bookings:', error);
            // Even if bookings fail, show the dashboard with 0 bookings
            this.allBookings = [];
            this.calculateStatistics();
            this.generateOccupancyChart();
            this.generateBookingsPerApartmentChart();
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
        this.loading = false;
      }
    });
  }

  onPeriodChange(): void {
    this.generateOccupancyChart();
  }

  calculateStatistics(): void {
    this.totalBookings = this.allBookings.length;
    
    const today = new Date();
    this.activeBookings = this.allBookings.filter(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return false;
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return start <= today && end >= today;
    }).length;
    
    this.totalRevenue = this.allBookings.reduce((sum, booking) => {
      return sum + (booking?.cost || 0);
    }, 0);
    
    // Calculate average occupancy percentage
    const days = parseInt(this.selectedPeriod);
    const totalPossibleDays = this.apartments.length * days;
    const occupiedDays = this.calculateOccupiedDays(days);
    this.averageOccupancy = totalPossibleDays > 0 
      ? (occupiedDays / totalPossibleDays) * 100 
      : 0;
  }

  calculateOccupiedDays(days: number): number {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    let totalOccupied = 0;
    
    this.allBookings.forEach(booking => {
      if (!booking || !booking.startDate || !booking.endDate) return;
      
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      if (bookingEnd >= startDate && bookingStart <= new Date()) {
        const overlapStart = bookingStart > startDate ? bookingStart : startDate;
        const overlapEnd = bookingEnd < new Date() ? bookingEnd : new Date();
        
        const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        totalOccupied += Math.max(0, daysDiff);
      }
    });
    
    return totalOccupied;
  }

  generateOccupancyChart(): void {
    const days = parseInt(this.selectedPeriod);
    const dates: string[] = [];
    const occupancyData: number[] = [];
    
    // Generate dates for the selected period
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Count bookings active on this date
      const activeCount = this.allBookings.filter(booking => {
        if (!booking || !booking.startDate || !booking.endDate) return false;
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        return start <= date && end >= date;
      }).length;
      
      occupancyData.push(activeCount);
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

  generateBookingsPerApartmentChart(): void {
    // Count bookings per apartment
    const bookingCounts = new Map<number, number>();
    
    this.allBookings.forEach(booking => {
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