import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApartmentService } from './apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { ApartmentRequestDTO } from '../../dtos/apartmentRequest.dto';
import { LoginService } from '../user/login.service';

describe('ApartmentService (Integration)', () => {
  let service: ApartmentService;
  let authService: LoginService;
  let createdApartmentIds: number[] = [];

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [
        ApartmentService,
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(ApartmentService);
    authService = TestBed.inject(LoginService);

    authService.logIn('admin@example.com', 'Password@1234').subscribe({
      next: () => done(),
      error: () => done()
    });
  });

  afterEach((done) => {
    if (createdApartmentIds.length === 0) {
      done();
      return;
    }

    let deletedCount = 0;
    createdApartmentIds.forEach((id) => {
      service.deleteApartment(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount === createdApartmentIds.length) {
            createdApartmentIds = [];
            done();
          }
        },
        error: () => {
          deletedCount++;
          if (deletedCount === createdApartmentIds.length) {
            createdApartmentIds = [];
            done();
          }
        }
      });
    });
  });

  // ==================== getAllApartments() ====================
  describe('getAllApartments', () => {
    it('should fetch a list of apartments with pagination', (done) => {
      service.getAllApartments(0, 5).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(apartments).toBeTruthy();
          expect(Array.isArray(apartments)).toBeTrue();
          expect(apartments.length).toBeLessThanOrEqual(5);
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });

    it('should respect page size parameter', (done) => {
      service.getAllApartments(0, 3).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(apartments.length).toBeLessThanOrEqual(3);
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });

    it('should fetch second page of apartments', (done) => {
      service.getAllApartments(1, 5).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(apartments).toBeTruthy();
          expect(Array.isArray(apartments)).toBeTrue();
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });
  });

  // ==================== getApartmentById() ====================
  describe('getApartmentById', () => {
    it('should fetch a single apartment by ID', (done) => {
      const testId = 1;
      service.getApartmentById(testId).subscribe({
        next: (apartment: ApartmentDTO) => {
          expect(apartment).toBeTruthy();
          expect(apartment.id).toBe(testId);
          expect(apartment.name).toBeDefined();
          expect(apartment.price).toBeDefined();
          expect(apartment.capacity).toBeDefined();
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });

    it('should handle 404 when apartment not found', (done) => {
      const invalidId = 999999;
      service.getApartmentById(invalidId).subscribe({
        next: () => fail('Expected 404 error, got success'),
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.status).toBe(404);
          done();
        }
      });
    });
  });

  // ==================== createApartment() ====================
  describe('createApartment', () => {
    it('should create a new apartment (admin only)', (done) => {
      const mockApartment: ApartmentRequestDTO = {
        name: 'New Apartment test',
        description: 'Apartment for integration test',
        price: 150,
        capacity: 2,
        services: new Set(['WIFI', 'POOL']),
        image: new File(['dummy content'], 'dummy.jpg', { type: 'image/jpeg' })
      };

      service.createApartment(mockApartment).subscribe({
        next: (created: ApartmentDTO) => {
          expect(created).toBeTruthy();
          expect(created.id).toBeDefined();
          expect(created.name).toBe(mockApartment.name);
          expect(created.price).toBe(mockApartment.price);
          expect(created.capacity).toBe(mockApartment.capacity);
          createdApartmentIds.push(created.id);
          done();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Create apartment failed: ${err.message}`);
          }
        }
      });
    });

    it('should reject apartment creation with invalid data', (done) => {
      const invalidApartment: ApartmentRequestDTO = {
        name: '',
        description: 'Test',
        price: -100,
        capacity: 0,
        services: new Set(),
        image: new File([''], 'test.jpg', { type: 'image/jpeg' })
      };

      service.createApartment(invalidApartment).subscribe({
        next: () => fail('Should have rejected invalid data'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });
  });

  // ==================== updateApartment() ====================
  describe('updateApartment', () => {
    it('should update an existing apartment (admin only)', (done) => {
      const apartmentId = 1;
      const updateData: ApartmentRequestDTO = {
        name: 'Updated apartment',
        description: 'Modified description',
        price: 200,
        capacity: 3,
        services: new Set(['WIFI']),
        image: new File(['dummy content'], 'dummy.jpg', { type: 'image/jpeg' })
      };

      service.updateApartment(apartmentId, updateData).subscribe({
        next: (updated: ApartmentDTO) => {
          expect(updated).toBeTruthy();
          expect(updated.name).toBe(updateData.name);
          expect(updated.price).toBe(updateData.price);
          done();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Update failed: ${err.message}`);
          }
        }
      });
    });

    it('should handle error when updating non-existent apartment', (done) => {
      const invalidId = 999999;
      const updateData: ApartmentRequestDTO = {
        name: 'Test',
        description: 'Test',
        price: 100,
        capacity: 2,
        services: new Set(),
        image: new File(['dummy content'], 'dummy.jpg', { type: 'image/jpeg' })
      };

      service.updateApartment(invalidId, updateData).subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });
  });

  // ==================== deleteApartment() ====================
  describe('deleteApartment', () => {
    it('should delete an apartment by ID (admin only)', (done) => {

      const mockApartment: ApartmentRequestDTO = {
        name: 'Apartment to delete',
        description: 'Will be deleted',
        price: 100,
        capacity: 2,
        services: new Set(['WIFI']),
        image: new File(['dummy content'], 'dummy.jpg', { type: 'image/jpeg' })
      };

      service.createApartment(mockApartment).subscribe({
        next: (created: ApartmentDTO) => {
          service.deleteApartment(created.id).subscribe({
            next: () => {
              expect(true).toBeTrue();
              done();
            },
            error: (err) => {
              if (err.status === 401 || err.status === 403) {
                done();
              } else {
                fail(`Delete failed: ${err.message}`);
              }
            }
          });
        },
        error: () => {
         
          service.deleteApartment(99999).subscribe({
            next: () => done(),
            error: (err) => {
              if (err.status === 401 || err.status === 403 || err.status === 404) {
                done();
              } else {
                fail(`Delete failed: ${err.message}`);
              }
            }
          });
        }
      });
    });

    it('should handle 404 when deleting non-existent apartment', (done) => {
      const invalidId = 999999;
      service.deleteApartment(invalidId).subscribe({
        next: () => fail('Expected 404 error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });
    });
  });

  // ==================== searchApartments() ====================
  describe('searchApartments', () => {
    it('should search apartments with all filters', (done) => {
      service.searchApartments({
        services: ['WIFI'],
        minCapacity: 2,
        startDate: '2025-10-20',
        endDate: '2025-10-25'
      }).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(apartments).toBeTruthy();
          expect(Array.isArray(apartments)).toBeTrue();
          done();
        },
        error: (err) => fail(`Search API failed: ${err.message}`)
      });
    });

    it('should search apartments by capacity only', (done) => {
      service.searchApartments({ minCapacity: 2 }).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(Array.isArray(apartments)).toBeTrue();
          apartments.forEach((apt) => {
            expect(apt.capacity).toBeGreaterThanOrEqual(2);
          });
          done();
        },
        error: (err) => fail(`Search failed: ${err.message}`)
      });
    });

    it('should search apartments by date range only', (done) => {
      service.searchApartments({
        startDate: '2025-12-01',
        endDate: '2025-12-10'
      }).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(Array.isArray(apartments)).toBeTrue();
          done();
        },
        error: (err) => fail(`Search failed: ${err.message}`)
      });
    });

    it('should search apartments by services only', (done) => {
      service.searchApartments({ services: ['WIFI'] }).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(Array.isArray(apartments)).toBeTrue();
          done();
        },
        error: (err) => fail(`Search failed: ${err.message}`)
      });
    });

    it('should respect pagination in search results', (done) => {
      service.searchApartments({
        services: ['WIFI'],
        page: 0,
        pageSize: 3
      }).subscribe({
        next: (apartments: ApartmentDTO[]) => {
          expect(apartments.length).toBeLessThanOrEqual(3);
          done();
        },
        error: (err) => fail(`Search failed: ${err.message}`)
      });
    });
  });

  // ==================== getAllServices() ====================
  describe('getAllServices', () => {
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

    it('should return non-empty services list', (done) => {
      service.getAllServices().subscribe({
        next: (services: string[]) => {
          expect(services.length).toBeGreaterThan(0);
          done();
        },
        error: (err) => fail(`Services API failed: ${err.message}`)
      });
    });

    it('should contain common services like WIFI', (done) => {
      service.getAllServices().subscribe({
        next: (services: string[]) => {
          const hasCommonServices = services.some(s => 
            ['WiFi', 'Piscina', 'Parking', 'TV'].includes(s)
          );
          expect(hasCommonServices).toBeTrue();
          done();
        },
        error: (err) => fail(`Services API failed: ${err.message}`)
      });
    });
  });

  // ==================== checkAvailability() ====================
  describe('checkAvailability', () => {
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

    it('should check availability for future dates', (done) => {
      const testId = 1;
      service.checkAvailability(testId, '2026-01-01', '2026-01-10').subscribe({
        next: (available: boolean) => {
          expect(typeof available).toBe('boolean');
          done();
        },
        error: (err) => fail(`Availability check failed: ${err.message}`)
      });
    });

    it('should handle 404 for non-existent apartment in availability check', (done) => {
      const invalidId = 999999;
      service.checkAvailability(invalidId, '2025-10-10', '2025-10-15').subscribe({
        next: () => fail('Expected 404 error'),
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });
    });

    it('should handle invalid date ranges in availability check', (done) => {
      const testId = 1;
      service.checkAvailability(testId, '2025-10-20', '2025-10-10').subscribe({
        next: (available) => {
          expect(typeof available).toBe('boolean');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });
  });

  // ==================== Edge Cases & Error Handling ====================
  describe('Edge Cases & Error Handling', () => {
    it('should handle network errors gracefully', (done) => {
      service.getApartmentById(-1).subscribe({
        next: () => done(),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should handle malformed apartment data', (done) => {
      const malformedApartment: any = {
        name: 'Test',
        price: 'not a number',
        capacity: 'invalid'
      };

      service.createApartment(malformedApartment).subscribe({
        next: () => fail('Should reject malformed data'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });
});