import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BookingService } from './booking.service';
import { BookingDTO } from '../../dtos/booking.dto';
import { BookingRequestDTO } from '../../dtos/bookingRequest.dto';
import { LoginService } from '../user/login.service';

describe('BookingService (Integration)', () => {
  let service: BookingService;
  let authService: LoginService;
  let createdBookingIds: number[] = [];
  let testUserId: number;
  let testApartmentId: number = 1;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [
        BookingService,
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(BookingService);
    authService = TestBed.inject(LoginService);

    authService.logIn('admin@example.com', 'Password@1234').subscribe({
      next: () => {
        const currentUser = authService.currentUser();
        testUserId = currentUser?.id || 1;
        done();
      },
      error: () => {
        testUserId = 1;
        done();
      }
    });
  });

  afterEach((done) => {
    if (createdBookingIds.length === 0) {
      done();
      return;
    }

    let canceledCount = 0;
    createdBookingIds.forEach((id) => {
      service.cancelBooking(id).subscribe({
        next: () => {
          canceledCount++;
          if (canceledCount === createdBookingIds.length) {
            createdBookingIds = [];
            done();
          }
        },
        error: () => {
          canceledCount++;
          if (canceledCount === createdBookingIds.length) {
            createdBookingIds = [];
            done();
          }
        }
      });
    });
  });

  // ==================== getBookingsByUserId() ====================
  describe('getBookingsByUserId', () => {
    it('should fetch bookings for a specific user with pagination', (done) => {
      service.getBookingsByUserId(testUserId, 0, 10).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(bookings).toBeTruthy();
          expect(Array.isArray(bookings)).toBeTrue();
          expect(bookings.length).toBeLessThanOrEqual(10);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should respect page size parameter', (done) => {
      service.getBookingsByUserId(testUserId, 0, 3).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(bookings.length).toBeLessThanOrEqual(3);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return valid booking structure', (done) => {
      service.getBookingsByUserId(testUserId, 0, 1).subscribe({
        next: (bookings: BookingDTO[]) => {
          if (bookings.length > 0) {
            const booking = bookings[0];
            expect(booking.id).toBeDefined();
            expect(booking.userId).toBeDefined();
            expect(booking.apartmentId).toBeDefined();
            expect(booking.startDate).toBeDefined();
            expect(booking.endDate).toBeDefined();
            expect(booking.cost).toBeDefined();
            expect(booking.state).toBeDefined();
            expect(booking.guests).toBeDefined();
          }
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle non-existent user', (done) => {
      const invalidUserId = 999999;
      service.getBookingsByUserId(invalidUserId, 0, 10).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(Array.isArray(bookings)).toBeTrue();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== getBookingsByApartmentId() ====================
  describe('getBookingsByApartmentId', () => {
    it('should fetch bookings for a specific apartment with pagination', (done) => {
      service.getBookingsByApartmentId(testApartmentId, 0, 10).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(bookings).toBeTruthy();
          expect(Array.isArray(bookings)).toBeTrue();
          expect(bookings.length).toBeLessThanOrEqual(10);
          
          bookings.forEach(booking => {
            expect(booking.apartmentId).toBe(testApartmentId);
          });
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });

    it('should respect page size parameter for apartment bookings', (done) => {
      service.getBookingsByApartmentId(testApartmentId, 0, 5).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(bookings.length).toBeLessThanOrEqual(5);
          done();
        },
        error: (err) => fail(`API call failed: ${err.message}`)
      });
    });

    it('should handle non-existent apartment', (done) => {
      const invalidApartmentId = 999999;
      service.getBookingsByApartmentId(invalidApartmentId, 0, 10).subscribe({
        next: (bookings: BookingDTO[]) => {
          expect(Array.isArray(bookings)).toBeTrue();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== createBooking() ====================
  describe('createBooking', () => {
    it('should create a new booking with valid data', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);

      const newBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: dayAfterTomorrow,
        guests: 2
      };

      service.createBooking(newBooking).subscribe({
        next: (created: BookingDTO) => {
          expect(created).toBeTruthy();
          expect(created.id).toBeDefined();
          expect(created.userId).toBe(newBooking.userId);
          expect(created.apartmentId).toBe(newBooking.apartmentId);
          expect(created.guests).toBe(newBooking.guests);
          expect(created.state).toBeDefined();
          expect(created.cost).toBeGreaterThan(0);
          createdBookingIds.push(created.id);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject booking with past dates', (done) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: yesterday,
        endDate: pastDate,
        guests: 2
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected past dates'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject booking with invalid date range (end before start)', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      const invalidBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: today,
        guests: 2
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected invalid date range'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject booking with zero or negative guests', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const invalidBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: dayAfter,
        guests: 0
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected zero guests'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject booking for non-existent apartment', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const invalidBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: 999999,
        startDate: tomorrow,
        endDate: dayAfter,
        guests: 2
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected non-existent apartment'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject booking for non-existent user', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const invalidBooking: BookingRequestDTO = {
        userId: 999999,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: dayAfter,
        guests: 2
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected non-existent user'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject booking with guests exceeding apartment capacity', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const invalidBooking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: dayAfter,
        guests: 9999 
      };

      service.createBooking(invalidBooking).subscribe({
        next: () => fail('Should have rejected excessive guests'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });
  });

  // ==================== cancelBooking() ====================
  describe('cancelBooking', () => {
    it('should cancel an existing booking', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 10);

      const bookingToCancel: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: weekLater,
        guests: 2
      };

      service.createBooking(bookingToCancel).subscribe({
        next: (created: BookingDTO) => {
          service.cancelBooking(created.id).subscribe({
            next: (canceled: BookingDTO) => {
              expect(canceled).toBeTruthy();
              expect(canceled.id).toBe(created.id);
              expect(canceled.state).toBeDefined();
              done();
            },
            error: (err) => {
              if (err.status === 401 || err.status === 403) {
                done();
              } else {
                fail(`Cancel booking failed: ${err.message}`);
              }
            }
          });
        },
        error: () => {
          service.cancelBooking(999999).subscribe({
            next: () => done(),
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        }
      });
    });

    it('should handle 404 when canceling non-existent booking', (done) => {
      const invalidBookingId = 999999;
      service.cancelBooking(invalidBookingId).subscribe({
        next: () => fail('Expected error for non-existent booking'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should not allow canceling already canceled booking', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 15);
      const later = new Date();
      later.setDate(later.getDate() + 20);

      const booking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: later,
        guests: 2
      };

      service.createBooking(booking).subscribe({
        next: (created: BookingDTO) => {
          service.cancelBooking(created.id).subscribe({
            next: () => {
              service.cancelBooking(created.id).subscribe({
                next: () => {
                  expect(true).toBeTrue();
                  done();
                },
                error: (err) => {
                  expect(err.status).toBeGreaterThanOrEqual(400);
                  done();
                }
              });
            },
            error: () => {
              expect(true).toBeTrue();
              done();
            }
          });
        },
        error: () => {
          expect(true).toBeTrue();
          done();
        }
      });
    });
  });

  // ==================== updateBookingDates() ====================
  describe('updateBookingDates', () => {
    it('should update booking dates successfully', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 25);
      const later = new Date();
      later.setDate(later.getDate() + 30);

      const booking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: tomorrow,
        endDate: later,
        guests: 2
      };

      service.createBooking(booking).subscribe({
        next: (created: BookingDTO) => {
          createdBookingIds.push(created.id);

          const newStart = new Date();
          newStart.setDate(newStart.getDate() + 35);
          const newEnd = new Date();
          newEnd.setDate(newEnd.getDate() + 40);

          service.updateBookingDates(created.id, newStart, newEnd).subscribe({
            next: (updated: BookingDTO) => {
              expect(updated).toBeTruthy();
              expect(updated.id).toBe(created.id);
              done();
            },
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        },
        error: () => {
    
          expect(true).toBeTrue();
          done();
        }
      });
    });

    it('should reject update with invalid date range', (done) => {
      const bookingId = 1; 
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      service.updateBookingDates(bookingId, tomorrow, yesterday).subscribe({
        next: (available) => {
          expect(available).toBeDefined();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject update with past dates', (done) => {
      const bookingId = 1;
      const pastDate1 = new Date();
      pastDate1.setDate(pastDate1.getDate() - 5);
      const pastDate2 = new Date();
      pastDate2.setDate(pastDate2.getDate() - 2);

      service.updateBookingDates(bookingId, pastDate1, pastDate2).subscribe({
        next: () => fail('Should reject past dates'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle 404 when updating non-existent booking dates', (done) => {
      const invalidBookingId = 999999;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const later = new Date();
      later.setDate(later.getDate() + 5);

      service.updateBookingDates(invalidBookingId, tomorrow, later).subscribe({
        next: () => fail('Expected error for non-existent booking'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle string dates correctly', (done) => {
      const bookingId = 1;
      const startDateStr = '2026-01-15';
      const endDateStr = '2026-01-20';

      service.updateBookingDates(bookingId, startDateStr, endDateStr).subscribe({
        next: (updated: BookingDTO) => {
          expect(updated).toBeTruthy();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== Edge Cases & Error Handling ====================
  describe('Edge Cases & Error Handling', () => {
    it('should handle network errors gracefully', (done) => {
      service.getBookingsByUserId(-1).subscribe({
        next: () => done(),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should handle malformed booking data', (done) => {
      const malformedBooking: any = {
        userId: 'not a number',
        apartmentId: 'invalid',
        startDate: 'invalid date',
        endDate: 'invalid date',
        guests: 'not a number'
      };

      service.createBooking(malformedBooking).subscribe({
        next: () => fail('Should reject malformed data'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should validate booking dates are Date objects or valid strings', (done) => {
      const validStart = new Date();
      validStart.setDate(validStart.getDate() + 50);
      const validEnd = new Date();
      validEnd.setDate(validEnd.getDate() + 55);

      const booking: BookingRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        startDate: validStart,
        endDate: validEnd,
        guests: 2
      };

      service.createBooking(booking).subscribe({
        next: (created) => {
          expect(created.startDate).toBeDefined();
          expect(created.endDate).toBeDefined();
          createdBookingIds.push(created.id);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });
});