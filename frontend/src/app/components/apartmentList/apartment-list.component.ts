import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ReviewService } from '../../services/review/review.service';

@Component({
  selector: 'app-apartment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './apartment-list.component.html',
  styleUrls: ['./apartment-list.component.css']
})
export class ApartmentListComponent implements OnInit {
  apartments: ApartmentDTO[] = [];
  availableServices: string[] = [];
  selectedServices: Set<string> = new Set();
  selectedCapacity: number = 1;
  selectedMinRating: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;
  hasMore: boolean = true;
  loading: boolean = false;
  initialLoading: boolean = true;
  apartmentRatings: Map<number, number> = new Map();

  constructor(
    private apartmentService: ApartmentService,
    private reviewService: ReviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.searchApartments();
  }

  loadServices(): void {
    this.apartmentService.getAllServices().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: (error) => {
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message || 'Failed to load services',
            code: error.status || 500
          }
        });
      }
    });
  }

  searchApartments(reset: boolean = false): void {
    if (reset) {
      this.currentPage = 0;
      this.apartments = [];
      this.hasMore = true;
    }

    this.loading = true;
    const options = {
      services: Array.from(this.selectedServices),
      minCapacity: this.selectedCapacity,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.apartmentService.searchApartments(options).subscribe({
        next: (response) => {
          if (!response || response.length === 0) {
            this.hasMore = false;
            if (this.currentPage === 0) {
              this.apartments = [];
            }
          } else {
            // Load ratings for the fetched apartments
            this.loadRatingsForApartments(response).then(() => {
              // Filter apartments based on selected minimum rating
              const filteredApartments = response.filter(apt => {
                const rating = this.apartmentRatings.get(apt.id) || 0;
                return rating >= this.selectedMinRating;
              });

              if (reset) {
                this.apartments = filteredApartments;
              } else {
                this.apartments = [...this.apartments, ...filteredApartments];
              }
              
              this.hasMore = response.length === this.pageSize;
            });
          }
          this.loading = false;
          this.initialLoading = false;
        },
        error: (error) => {
          if (error.status === 204) {
            this.hasMore = false;
            if (this.currentPage === 0) {
              this.apartments = [];
            }
            this.loading = false;
            this.initialLoading = false;
          } else {
            this.router.navigate(['/error'], {
              queryParams: {
                message: 'Failed to load apartments',
                code: error.status || 500
              }
            });
          }
        }
      });
  }

  private async loadRatingsForApartments(apartments: ApartmentDTO[]): Promise<void> {
    const ratingPromises = apartments.map(apt => 
      this.reviewService.getApartmentRating(apt.id).toPromise()
        .then(rating => {
          this.apartmentRatings.set(apt.id, rating || 0);
        })
        .catch(() => {
          this.apartmentRatings.set(apt.id, 0);
        })
    );
    
    await Promise.all(ratingPromises);
  }

  onRatingChange(): void {
    if (this.selectedMinRating < 0) {
      this.selectedMinRating = 0;
    }
    if (this.selectedMinRating > 5) {
      this.selectedMinRating = 5;
    }
    this.searchApartments(true);
  }

  getRating(apartmentId: number): number {
    return this.apartmentRatings.get(apartmentId) || 0;
  }

  onServiceToggle(service: string): void {
    if (this.selectedServices.has(service)) {
      this.selectedServices.delete(service);
    } else {
      this.selectedServices.add(service);
    }
    this.searchApartments(true);
  }

  onCapacityChange(): void {
    if (this.selectedCapacity < 1) {
      this.selectedCapacity = 1;
    }
    this.searchApartments(true);
  }

  loadMore(): void {
    this.currentPage++;
    this.searchApartments();
  }

  goToApartment(apartmentId: number): void {
    this.router.navigate(['/apartment', apartmentId]);
  }

  getServicesArray(services: Set<string>): string[] {
    return Array.from(services);
  }
}