import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { UserService } from '../../services/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ApartmentDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  services: Set<string>;
  capacity: number;
  imageUrl: string;
}

@Component({
  selector: 'app-apartment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './apartment-form.component.html',
  styleUrls: ['./apartment-form.component.css']
})
export class ApartmentFormComponent implements OnInit {
  name: string = '';
  description: string = '';
  price: number | null = null;
  capacity: number | null = null;
  selectedServices: Set<string> = new Set();
  availableServices: string[] = [];
  imageFile: File | null = null;
  imagePreview: string | null = null;
  newService: string = '';
  loading: boolean = false;
  apartmentId: number | null = null;
  mode: 'create' | 'edit' = 'create';
  user: any = null;
  initializing: boolean = true;

  constructor(
    private apartmentService: ApartmentService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // First verify user is logged in and is admin
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        
        // Check if user has ADMIN role
        if (!user.roles.includes('ADMIN')) {
          console.warn('Access denied: User does not have ADMIN role');
          this.router.navigate(['/error'], {
            queryParams: {
              message: 'Access denied: Admins only',
              code: 403
            }
          });
        }

        // User is admin, proceed to load services and form data
        this.initializing = false;
        this.loadServices();
        
        // Check if we're editing an existing apartment
        this.route.params.subscribe(params => {
          if (params['id']) {
            this.apartmentId = +params['id'];
            this.mode = 'edit';
            this.loadApartment(this.apartmentId);
          }
        });
      },
      error: (error) => {
        console.error('Error loading current user:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  loadServices(): void {
    this.apartmentService.getAllServices().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: (error) => {
        this.router.navigate(['/error'], {
          queryParams: {
            message: 'Failed to load services',
            code: error.status || 500
          }
        });
      }
    });
  }

  loadApartment(id: number): void {
    this.loading = true;
    this.apartmentService.getApartmentById(id).subscribe({
      next: (apartment) => {
        this.populateForm(apartment);
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.router.navigate(['/error'], {
          queryParams: {
            message: error.error?.message ||'Failed to load apartment',
            code: error.status || 500
          }
        });
      }
    });
  }

  populateForm(apartment: ApartmentDTO): void {
    this.name = apartment.name;
    this.description = apartment.description;
    this.price = apartment.price;
    this.capacity = apartment.capacity;
    this.selectedServices = new Set(apartment.services);
    this.imagePreview = apartment.imageUrl;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showMessage('Please select a valid image file', 'warning');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('File size must be less than 5MB', 'warning');
        return;
      }

      this.imageFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    // In edit mode, don't remove the preview (keep original image)
    if (this.mode === 'create') {
      this.imagePreview = null;
    }
  }

  triggerFileInput(): void {
    document.getElementById('fileInput')?.click();
  }

  onServiceToggle(service: string): void {
    if (this.selectedServices.has(service)) {
      this.selectedServices.delete(service);
    } else {
      this.selectedServices.add(service);
    }
  }

  addNewService(): void {
    const serviceName = this.newService.trim();
    
    if (!serviceName) {
      return;
    }

    // Check if service already exists
    if (this.availableServices.includes(serviceName) || this.selectedServices.has(serviceName)) {
      this.showMessage('This service already exists', 'error');
      this.newService = '';
      return;
    }

    // Add to available services and select it
    this.availableServices.push(serviceName);
    this.selectedServices.add(serviceName);
    this.newService = '';
  }

  removeService(service: string): void {
    this.selectedServices.delete(service);
  }

  isFormValid(): boolean {
    const hasName = this.name.trim().length > 0;
    const hasDescription = this.description.trim().length > 0;
    const hasValidPrice = this.price !== null && this.price > 0;
    const hasValidCapacity = this.capacity !== null && this.capacity > 0;
    const hasServices = this.selectedServices.size > 0;
    
    // For create mode, image is required
    if (this.mode === 'create') {
      return hasName && hasDescription && hasValidPrice && hasValidCapacity && hasServices && this.imageFile !== null;
    }
    
    // For edit mode, image is optional (can keep existing)
    return hasName && hasDescription && hasValidPrice && hasValidCapacity && hasServices;
  }

  onCancel(): void {
    this.router.navigate(['/profile'], { fragment: 'apartments' });
  }

  async onSave(): Promise<void> {
    if (!this.isFormValid() || this.loading) {
      return;
    }

    this.loading = true;

    // If in edit mode and no new image was uploaded, fetch the current image
    let imageToSend: File = this.imageFile!;
    
    if (this.mode === 'edit' && !this.imageFile && this.imagePreview) {
      try {
        imageToSend = await this.urlToFile(this.imagePreview, 'apartment-image.jpg');
      } catch (error) {
        console.error('Error converting image URL to file:', error);
        this.loading = false;
        this.showMessage('Error processing the apartment image. Please try uploading a new image.', 'error');
        return;
      }
    }

    const apartmentData = {
      name: this.name.trim(),
      description: this.description.trim(),
      price: this.price!,
      capacity: this.capacity!,
      services: this.selectedServices,
      image: imageToSend
    };

    if (this.mode === 'create') {
      this.apartmentService.createApartment(apartmentData).subscribe({
        next: (apartment) => {
          this.loading = false;
          this.showMessage('Apartment created successfully', 'success');
          this.router.navigate(['/profile'], { fragment: 'apartments' });
        },
        error: (error) => {
          this.loading = false;
          this.router.navigate(['/error'], {
            queryParams: {
              message: error.error?.message || 'Failed to create apartment',
              code: error.status || 500
            }
          });
        }
      });
    } else {
      this.apartmentService.updateApartment(this.apartmentId!, apartmentData).subscribe({
        next: (apartment) => {
          this.showMessage('Apartment updated successfully', 'success');
          this.loading = false;
          this.router.navigate(['/profile'], { fragment: 'apartments' });
        },
        error: (error) => {
          this.loading = false;
          this.router.navigate(['/error'], {
            queryParams: {
              message: 'Failed to update apartment',
              code: error.status || 500
            }
          });
        }
      });
    }
  }

  // Helper method to convert URL to File
  private async urlToFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }

  getSelectedServicesArray(): string[] {
    return Array.from(this.selectedServices);
  }

  getTitle(): string {
    return this.mode === 'create' ? 'Create New Apartment' : 'Edit Apartment';
  }

  getIcon(): string {
    return this.mode === 'create' ? 'add_home' : 'edit';
  }

  getSaveButtonText(): string {
    return this.mode === 'create' ? 'Create Apartment' : 'Save Changes';
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