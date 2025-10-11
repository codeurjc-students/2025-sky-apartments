import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApartmentService } from './apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ApartmentRequestDTO } from '../../dtos/apartmentRequest.dto';

describe('ApartmentService (Integration)', () => {
  let service: ApartmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApartmentService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(ApartmentService);
  });

  it('should fetch a list of apartments from the real API', (done) => {
    service.getAllApartments().subscribe({
      next: (apartments: ApartmentDTO[]) => {
        expect(apartments).toBeTruthy();
        expect(Array.isArray(apartments)).toBeTrue();
        done();
      },
      error: (err) => fail(`API call failed: ${err.message}`)
    });
  });

  it('should fetch a single apartment by ID from the real API', (done) => {
    const testId = 1;
    service.getApartmentById(testId).subscribe({
      next: (apartment: ApartmentDTO) => {
        expect(apartment).toBeTruthy();
        expect(apartment.id).toBe(testId);
        expect(apartment.name).toBeDefined();
        done();
      },
      error: (err) => fail(`API call failed: ${err.message}`)
    });
  });
  /*
  it('should create a new apartment with image', (done) => {
    const mockImage = new File([new Blob(['fake image content'], { type: 'image/png' })], 'test-image.png', { type: 'image/png' });

    const mockApartment: ApartmentRequestDTO = {
      name: 'Test Apartment with Image',
      description: 'Testing image upload',
      price: 150.75,
      capacity: 3,
      services: new Set<string>(['wifi', 'pool']),
      image: mockImage,
    };

    service.createApartment(mockApartment).subscribe({
      next: (created: ApartmentDTO) => {
        expect(created).toBeTruthy();
        expect(created.id).toBeDefined();
        expect(created.name).toBe(mockApartment.name);
        done();
      },
      error: (err) => {
        fail(`API call failed: ${err.message}`);
      }
    });
  });


  it('should update an existing apartment successfully', (done) => {
    const testId = 1;
    const mockImage = new File([new Blob(['fake image content'], { type: 'image/png' })], 'test-image.png', { type: 'image/png' });
    const updated: ApartmentRequestDTO = {
      name: 'Updated Name',
      description: 'Updated description',
      price: 300,
      capacity: 4,
      services: new Set<string>(['wifi']),
      image: mockImage,
    };

    service.updateApartment(testId, updated).subscribe({
      next: (apartment: ApartmentDTO) => {
        expect(apartment).toBeTruthy();
        expect(apartment.name).toBe(updated.name);
        done();
      },
      error: (err) => fail(`Update API failed: ${err.message}`)
    });
  });
  */
  it('should fetch all available services', (done) => {
    service.getAllServices().subscribe({
      next: (services: string[]) => {
        expect(services).toBeTruthy();
        expect(Array.isArray(services)).toBeTrue();
        expect(services.length).toBeGreaterThanOrEqual(0);
        done();
      },
      error: (err) => fail(`Services API failed: ${err.message}`)
    });
  });


  it('should check apartment availability between dates', (done) => {
    const testId = 1;
    service.checkAvailability(testId, '2025-10-10', '2025-10-15').subscribe({
      next: (available: boolean) => {
        expect(typeof available).toBe('boolean');
        done();
      },
      error: (err) => fail(`Availability API failed: ${err.message}`)
    });
  });
  
  it('should handle 404 when apartment not found', (done) => {
    const invalidId = 999999;
    service.getApartmentById(invalidId).subscribe({
      next: () => fail('Expected 404 error, got success'),
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.status).toBe(404);
        expect(err.error.message).toContain('Apartment not found');
        done();
      }
    });
  });
  /*
  it('should handle 400 when creating apartment with invalid data', (done) => {
    const invalidApartment: ApartmentRequestDTO = {
      name: '', // invalid
      description: '',
      price: -50,
      capacity: 0,
      services: new Set<string>(),
      image: new File([new Blob(['invalid'], { type: 'image/png' })], 'invalid.png', { type: 'image/png' }),
    };

    service.createApartment(invalidApartment).subscribe({
      next: () => fail('Expected 400 error, got success'),
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('400');
        done();
      }
    });
  });
  
  it('should handle 404 when deleting non-existent apartment', (done) => {
    const invalidId = 999999;
    service.deleteApartment(invalidId).subscribe({
      next: () => fail('Expected 404 error, got success'),
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('404');
        done();
      }
    });
  });
  */
  
});
