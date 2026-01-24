import { Component, OnInit } from '@angular/core';
import { ConditionType, DateType, FilterDTO } from '../../dtos/filter.dto';
import { FilterService } from '../../services/booking/filter.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-filters-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './filters-tab.component.html',
  styleUrl: './filters-tab.component.css'
})
export class FiltersTabComponent implements OnInit {
  filters: FilterDTO[] = [];
  selectedFilter?: FilterDTO;
  isEditing = false;
  showForm = false;
  loading = false;

  DateType = DateType;
  ConditionType = ConditionType;

  dateTypes = Object.values(DateType);
  conditionTypes = Object.values(ConditionType);

  weekDaysOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
    { value: '7', label: 'Sunday' }
  ];

  filterCurrentPage: number = 0;
  filterPageSize: number = 10;
  filterHasMore: boolean = true;
  filterLoading: boolean = false;

  constructor(
    private filterService: FilterService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFilters();
  }

  loadFilters(): void {
    this.loading = true;
    this.filterLoading = true;
    
    this.filterService.findAll(this.filterCurrentPage, this.filterPageSize).subscribe({
      next: (filters) => {
        if (!filters || filters.length === 0) {
          this.filterHasMore = false;
        } else if (filters.length < this.filterPageSize) {
          this.filters = [...this.filters, ...filters];
          this.filterHasMore = false;
        } else {
          this.filters = [...this.filters, ...filters];
          this.filterHasMore = true;
        }
        
        this.filterLoading = false;
        this.loading = false;
      },
      error: (error) => {
        this.filterLoading = false;
        this.loading = false;
      
        if (error.status === 204) {
          this.filterHasMore = false;
          return;
        }
        
        this.showMessage('Error loading filters', 'error');
        console.error('Error:', error);
        this.router.navigate(['/error'], { 
          queryParams: { 
            message: error.error?.message || 'Error loading filters', 
            code: error.status || 500 
          } 
        });
      }
    });
  }

  loadMoreFilters(): void {
    this.filterCurrentPage++;
    this.loadFilters();
  }

  newFilter(): void {
    this.selectedFilter = {
      name: '',
      description: '',
      activated: true,
      increment: false,
      dateType: DateType.EVERY_DAY,
      conditionType: ConditionType.NONE
    };
    this.isEditing = false;
    this.showForm = true;
  }

  editFilter(filter: FilterDTO): void {
    this.selectedFilter = { ...filter };
    this.isEditing = true;
    this.showForm = true;
  }

  saveFilter(): void {
    if (!this.selectedFilter) return;

    this.loading = true;

    if (this.isEditing && this.selectedFilter.id) {
      this.filterService.update(this.selectedFilter.id, this.selectedFilter).subscribe({
        next: () => {
          this.showMessage('Filter updated successfully', 'success');
          this.loadFilters();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          this.showMessage('Error updating filter', 'error');
          this.loading = false;
        }
      });
    } else {
      this.filterService.create(this.selectedFilter).subscribe({
        next: () => {
          this.showMessage('Filter created successfully', 'success');
          this.loadFilters();
          this.closeForm();
          this.loading = false;
        },
        error: (error) => {
          this.showMessage('Error creating filter', 'error');
          this.loading = false;
        }
      });
    }
  }

  deleteFilter(id: number): void {
    Swal.fire({
      title: 'Are you sure you want to delete this filter?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.loading = true;
      this.filterService.delete(id).subscribe({
        next: () => {
          this.showMessage('Filter deleted successfully', 'success');
          this.loadFilters();
          this.loading = false;
        },
        error: (error) => {
          this.showMessage('Error deleting filter', 'error');
          this.loading = false;
          console.error('Error:', error);
        }
      });
    });
  }

  toggleActivation(filter: FilterDTO): void {
    if (!filter.id) return;

    const updatedFilter = { ...filter, activated: !filter.activated };
    this.filterService.update(filter.id, updatedFilter).subscribe({
      next: () => {
        this.showMessage( `Filter ${updatedFilter.activated ? 'activated' : 'deactivated'} successfully`, 'success');
        this.loadFilters();
      },
      error: (error) => {
        this.showMessage('Error toggling filter', 'error');
        console.error('Error:', error);
      }
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedFilter = undefined;
    this.isEditing = false;
  }

  // Helper methods for template
  getTypeLabel(filter: FilterDTO): string {
    return filter.increment ? 'Increment' : 'Discount';
  }

  getTypeBadgeClass(filter: FilterDTO): string {
    return filter.increment ? 'badge-danger' : 'badge-success';
  }

  showDateFields(): boolean {
    return this.selectedFilter?.dateType === DateType.DATE_RANGE ||
          this.selectedFilter?.dateType === DateType.DATE_RANGE_WEEK_DAYS;
  }

  showWeekDaysField(): boolean {
    return this.selectedFilter?.dateType === DateType.WEEK_DAYS ||
          this.selectedFilter?.dateType === DateType.DATE_RANGE_WEEK_DAYS;
  }

  showAnticipationHoursField(): boolean {
    return this.selectedFilter?.conditionType === ConditionType.LAST_MINUTE;
  }

  showMinDaysField(): boolean {
    return this.selectedFilter?.conditionType === ConditionType.LONG_STAY;
  }

  onWeekDayChange(day: string, event: any): void {
    if (!this.selectedFilter) return;

    const weekDays = this.selectedFilter.weekDays ? this.selectedFilter.weekDays.split(',') : [];
    
    if (event.target.checked) {
      if (!weekDays.includes(day)) {
        weekDays.push(day);
      }
    } else {
      const index = weekDays.indexOf(day);
      if (index > -1) {
        weekDays.splice(index, 1);
      }
    }

    this.selectedFilter.weekDays = weekDays.sort().join(',');
  }

  isWeekDaySelected(day: string): boolean {
    if (!this.selectedFilter?.weekDays) return false;
    return this.selectedFilter.weekDays.split(',').includes(day);
  }

  formatDateType(dateType: DateType): string {
    const formats: { [key in DateType]: string } = {
      [DateType.EVERY_DAY]: 'Every Day',
      [DateType.DATE_RANGE]: 'Date Range',
      [DateType.WEEK_DAYS]: 'Week Days',
      [DateType.DATE_RANGE_WEEK_DAYS]: 'Date Range + Week Days'
    };
    
    return formats[dateType] || dateType;
  }

  formatConditionType(conditionType?: ConditionType | string): string {
    if (!conditionType || conditionType === 'NONE') return 'None';
    return conditionType.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  clearMessages(): void {
    setTimeout(() => {
    }, 5000);
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }
}