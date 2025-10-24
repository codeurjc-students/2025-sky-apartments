import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { ApartmentFormComponent, ApartmentDTO } from './apartment-form.component';
import { ApartmentService } from '../../services/apartment/apartment.service';
import { UserService } from '../../services/user/user.service';

describe('ApartmentFormComponent', () => {
  let component: ApartmentFormComponent;
  let fixture: ComponentFixture<ApartmentFormComponent>;
  let apartmentService: jasmine.SpyObj<ApartmentService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let paramsSubject: Subject<any>;

  const mockAdminUser = {
    id: 1,
    name: 'Admin',
    surname: 'User',
    email: 'admin@test.com',
    phoneNumber: '123456789',
    roles: ['ADMIN']
  };

  const mockNonAdminUser = {
    ...mockAdminUser,
    roles: ['USER']
  };

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Test Apartment',
    description: 'Test Description',
    price: 100,
    capacity: 4,
    services: new Set(['WiFi', 'AC']),
    imageUrl: 'test-image.jpg'
  };

  const mockServices = ['WiFi', 'AC', 'Kitchen', 'Parking'];

  beforeEach(async () => {
    const apartmentServiceSpy = jasmine.createSpyObj('ApartmentService', [
      'getAllServices',
      'getApartmentById',
      'createApartment',
      'updateApartment'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    snackBarSpy.open.and.returnValue({ onAction: () => of({}), dismiss: () => {} } as any);

    paramsSubject = new Subject();
    const activatedRouteStub = {
      params: paramsSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        ApartmentFormComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ApartmentService, useValue: apartmentServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([])
      ]
    }).compileComponents();

    apartmentService = TestBed.inject(ApartmentService) as jasmine.SpyObj<ApartmentService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Default mocks
    userService.getCurrentUser.and.returnValue(of(mockAdminUser));
    apartmentService.getAllServices.and.returnValue(of(mockServices));
    apartmentService.getApartmentById.and.returnValue(of(mockApartment));
    apartmentService.createApartment.and.returnValue(of(mockApartment));
    apartmentService.updateApartment.and.returnValue(of(mockApartment));

    fixture = TestBed.createComponent(ApartmentFormComponent);
    component = fixture.componentInstance;
    (component as any).snackBar = snackBar;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.name).toBe('');
      expect(component.description).toBe('');
      expect(component.price).toBeNull();
      expect(component.capacity).toBeNull();
      expect(component.selectedServices.size).toBe(0);
      expect(component.availableServices).toEqual([]);
      expect(component.imageFile).toBeNull();
      expect(component.imagePreview).toBeNull();
      expect(component.newService).toBe('');
      expect(component.loading).toBe(false);
      expect(component.apartmentId).toBeNull();
      expect(component.mode).toBe('create');
      expect(component.user).toBeNull();
      expect(component.initializing).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should load current user', () => {
      fixture.detectChanges();
      expect(userService.getCurrentUser).toHaveBeenCalled();
    });

    it('should set user on success', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.user).toEqual(mockAdminUser);
        done();
      }, 100);
    });

    it('should navigate to error if user is not admin', () => {
      spyOn(console, 'warn');
      spyOn(router, 'navigate');
      userService.getCurrentUser.and.returnValue(of(mockNonAdminUser));
      
      fixture.detectChanges();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Access denied: Admins only',
          code: 403
        }
      });
    });

    it('should navigate to login on user load error', () => {
      spyOn(console, 'error');
      spyOn(router, 'navigate');
      userService.getCurrentUser.and.returnValue(throwError(() => new Error('Failed')));
      
      fixture.detectChanges();
      
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should set initializing to false for admin user', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.initializing).toBe(false);
        done();
      }, 100);
    });

    it('should call loadServices for admin user', (done) => {
      spyOn(component, 'loadServices');
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.loadServices).toHaveBeenCalled();
        done();
      }, 100);
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

    it('should navigate to error on failure', () => {
      spyOn(router, 'navigate');
      apartmentService.getAllServices.and.returnValue(throwError(() => ({ status: 500 })));
      
      component.loadServices();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to load services',
          code: 500
        }
      });
    });
  });

  describe('loadApartment', () => {
    beforeEach(() => {
      component.loading = false;
    });

    it('should call apartmentService.getApartmentById', () => {
      component.loadApartment(1);
      expect(apartmentService.getApartmentById).toHaveBeenCalledWith(1);
    });

    it('should populate form on success', (done) => {
      spyOn(component, 'populateForm');
      component.loadApartment(1);
      
      setTimeout(() => {
        expect(component.populateForm).toHaveBeenCalledWith(mockApartment);
        done();
      }, 100);
    });

    it('should set loading to false after success', (done) => {
      component.loadApartment(1);
      
      setTimeout(() => {
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should navigate to error on failure', () => {
      spyOn(router, 'navigate');
      apartmentService.getApartmentById.and.returnValue(
        throwError(() => ({ status: 404, error: { message: 'Not found' } }))
      );
      
      component.loadApartment(1);
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Not found',
          code: 404
        }
      });
    });
  });

  describe('populateForm', () => {
    it('should populate all form fields', () => {
      component.populateForm(mockApartment);
      
      expect(component.name).toBe('Test Apartment');
      expect(component.description).toBe('Test Description');
      expect(component.price).toBe(100);
      expect(component.capacity).toBe(4);
      expect(component.selectedServices.has('WiFi')).toBe(true);
      expect(component.selectedServices.has('AC')).toBe(true);
      expect(component.imagePreview).toBe('test-image.jpg');
    });
  });

  describe('onFileSelected', () => {
    let mockFile: File;
    let mockEvent: any;

    beforeEach(() => {
      mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      mockEvent = {
        target: {
          files: [mockFile]
        }
      };
    });

    it('should set imageFile on valid image', () => {
      component.onFileSelected(mockEvent);
      expect(component.imageFile).toBe(mockFile);
    });

    it('should show warning for non-image file', () => {
      const nonImageFile = new File([''], 'test.txt', { type: 'text/plain' });
      mockEvent.target.files = [nonImageFile];
      
      component.onFileSelected(mockEvent);
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Please select a valid image file',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-warning'] })
      );
    });

    it('should show warning for files larger than 5MB', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      mockEvent.target.files = [largeFile];
      
      component.onFileSelected(mockEvent);
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'File size must be less than 5MB',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-warning'] })
      );
    });

    it('should create image preview', (done) => {
      component.onFileSelected(mockEvent);
      
      setTimeout(() => {
        expect(component.imagePreview).toBeTruthy();
        done();
      }, 100);
    });
  });

  describe('removeImage', () => {
    it('should clear imageFile', () => {
      component.imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.removeImage();
      expect(component.imageFile).toBeNull();
    });

    it('should clear imagePreview in create mode', () => {
      component.mode = 'create';
      component.imagePreview = 'test.jpg';
      component.removeImage();
      expect(component.imagePreview).toBeNull();
    });

    it('should keep imagePreview in edit mode', () => {
      component.mode = 'edit';
      component.imagePreview = 'test.jpg';
      component.removeImage();
      expect(component.imagePreview).toBe('test.jpg');
    });
  });

  describe('triggerFileInput', () => {
    it('should trigger click on file input', () => {
      const mockElement = jasmine.createSpyObj('HTMLElement', ['click']);
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      
      component.triggerFileInput();
      
      expect(mockElement.click).toHaveBeenCalled();
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
  });

  describe('addNewService', () => {
    beforeEach(() => {
      component.availableServices = mockServices;
      snackBar.open.calls.reset();
    });

    it('should clear newService input after adding', () => {
      component.newService = 'Pool';
      component.addNewService();
      expect(component.newService).toBe('');
    });

    it('should trim whitespace', () => {
      component.newService = '  Pool  ';
      component.addNewService();
      expect(component.availableServices).toContain('Pool');
    });

    it('should not add empty service', () => {
      component.newService = '';
      const initialLength = component.availableServices.length;
      component.addNewService();
      expect(component.availableServices.length).toBe(initialLength);
    });

    it('should show error for duplicate service in available', () => {
      component.newService = 'WiFi';
      component.addNewService();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'This service already exists',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-error'] })
      );
    });

    it('should show error for duplicate service in selected', () => {
      component.selectedServices.add('Pool');
      component.newService = 'Pool';
      component.addNewService();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'This service already exists',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-error'] })
      );
    });
  });

  describe('removeService', () => {
    it('should remove service from selectedServices', () => {
      component.selectedServices.add('WiFi');
      component.removeService('WiFi');
      expect(component.selectedServices.has('WiFi')).toBe(false);
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      component.name = 'Test';
      component.description = 'Description';
      component.price = 100;
      component.capacity = 4;
      component.selectedServices.add('WiFi');
    });

    it('should return false if name is empty', () => {
      component.name = '';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if description is empty', () => {
      component.description = '';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if price is null', () => {
      component.price = null;
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if price is zero or negative', () => {
      component.price = 0;
      expect(component.isFormValid()).toBe(false);
      component.price = -10;
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if capacity is null', () => {
      component.capacity = null;
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if capacity is zero or negative', () => {
      component.capacity = 0;
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if no services selected', () => {
      component.selectedServices.clear();
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false in create mode without image', () => {
      component.mode = 'create';
      component.imageFile = null;
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true in create mode with all fields', () => {
      component.mode = 'create';
      component.imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(component.isFormValid()).toBe(true);
    });

    it('should return true in edit mode without new image', () => {
      component.mode = 'edit';
      component.imageFile = null;
      component.imagePreview = 'existing.jpg';
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should navigate to profile apartments tab', () => {
      spyOn(router, 'navigate');
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/profile'], { fragment: 'apartments' });
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      component.name = 'Test Apartment';
      component.description = 'Description';
      component.price = 100;
      component.capacity = 4;
      component.selectedServices.add('WiFi');
      component.imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      snackBar.open.calls.reset();
    });

    it('should not save if form is invalid', async () => {
      component.name = '';
      await component.onSave();
      expect(apartmentService.createApartment).not.toHaveBeenCalled();
    });

    it('should not save if already loading', async () => {
      component.loading = true;
      await component.onSave();
      expect(apartmentService.createApartment).not.toHaveBeenCalled();
    });

    it('should show success message and navigate after create', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.mode = 'create';
      component.onSave();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Apartment created successfully',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-success'] })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/profile'], { fragment: 'apartments' });
    }));

    it('should show success message and navigate after update', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.mode = 'edit';
      component.apartmentId = 1;
      component.onSave();
      tick();
      
      expect(snackBar.open).toHaveBeenCalledWith(
        'Apartment updated successfully',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-success'] })
      );
      expect(router.navigate).toHaveBeenCalledWith(['/profile'], { fragment: 'apartments' });
    }));

    it('should navigate to error on create failure', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.createApartment.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Failed' } }))
      );
      
      component.mode = 'create';
      component.onSave();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed',
          code: 500
        }
      });
    }));

    it('should navigate to error on update failure', fakeAsync(() => {
      spyOn(router, 'navigate');
      apartmentService.updateApartment.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.mode = 'edit';
      component.apartmentId = 1;
      component.onSave();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/error'], {
        queryParams: {
          message: 'Failed to update apartment',
          code: 500
        }
      });
    }));
  });

  describe('Helper Methods', () => {
    it('getSelectedServicesArray should return array from Set', () => {
      component.selectedServices.add('WiFi');
      component.selectedServices.add('AC');
      
      const array = component.getSelectedServicesArray();
      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(2);
    });

    it('getTitle should return correct title', () => {
      component.mode = 'create';
      expect(component.getTitle()).toBe('Create New Apartment');
      
      component.mode = 'edit';
      expect(component.getTitle()).toBe('Edit Apartment');
    });

    it('getIcon should return correct icon', () => {
      component.mode = 'create';
      expect(component.getIcon()).toBe('add_home');
      
      component.mode = 'edit';
      expect(component.getIcon()).toBe('edit');
    });

    it('getSaveButtonText should return correct text', () => {
      component.mode = 'create';
      expect(component.getSaveButtonText()).toBe('Create Apartment');
      
      component.mode = 'edit';
      expect(component.getSaveButtonText()).toBe('Save Changes');
    });
  });
});