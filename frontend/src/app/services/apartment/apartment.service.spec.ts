import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApartmentService } from './apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';

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
    service.getApartments().subscribe({
      next: (apartments: ApartmentDTO[]) => {
        expect(apartments).toBeTruthy();
        expect(Array.isArray(apartments)).toBeTrue();

        if (apartments.length > 0) {
          expect(apartments[0].id).toBeDefined();
          expect(apartments[0].name).toBeDefined();
        }

        done();
      },
      error: (err) => {
        fail(`API call failed: ${err.message}`);
      }
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
      error: (err) => {
        fail(`API call failed: ${err.message}`);
      }
    });
  });
});
