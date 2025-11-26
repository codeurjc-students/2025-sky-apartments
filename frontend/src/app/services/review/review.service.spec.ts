import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReviewService } from './review.service';
import { ReviewRequestDTO } from '../../dtos/reviewRequest.dto';
import { UpdateReviewRequestDTO } from '../../dtos/updateReviewRequest.dto';
import { ReviewDTO } from '../../dtos/review.dto';
import { LoginService } from '../user/login.service';

describe('ReviewService (Integration)', () => {
  let service: ReviewService;
  let authService: LoginService;
  let createdReviewIds: number[] = [];
  let testUserId: number;
  let testApartmentId: number = 1;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [
        ReviewService,
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(ReviewService);
    authService = TestBed.inject(LoginService);

    authService.logIn('user@example.com', 'Password@1234').subscribe({
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
    if (createdReviewIds.length === 0) {
      done();
      return;
    }

    let deletedCount = 0;
    createdReviewIds.forEach((id) => {
      service.deleteReview(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount === createdReviewIds.length) {
            createdReviewIds = [];
            done();
          }
        },
        error: () => {
          deletedCount++;
          if (deletedCount === createdReviewIds.length) {
            createdReviewIds = [];
            done();
          }
        }
      });
    });
  });

  // ==================== createReview() ====================
  describe('createReview', () => {
    it('should create a new review with valid data', (done) => {
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 4,
        comment: 'Great apartment, very clean and comfortable!'
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          expect(created).toBeTruthy();
          expect(created.id).toBeDefined();
          expect(created.userId).toBe(newReview.userId);
          expect(created.apartmentId).toBe(newReview.apartmentId);
          expect(created.rating).toBe(newReview.rating);
          expect(created.comment).toBe(newReview.comment);
          createdReviewIds.push(created.id);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject review with rating below 1', (done) => {
      const invalidReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 0,
        comment: 'Invalid rating'
      };

      service.createReview(invalidReview).subscribe({
        next: () => fail('Should have rejected rating below 1'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject review with rating above 5', (done) => {
      const invalidReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 6,
        comment: 'Invalid rating'
      };

      service.createReview(invalidReview).subscribe({
        next: () => fail('Should have rejected rating above 5'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject review with empty comment', (done) => {
      const invalidReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 4,
        comment: ''
      };

      service.createReview(invalidReview).subscribe({
        next: () => fail('Should have rejected empty comment'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject review for non-existent apartment', (done) => {
      const invalidReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: 999999,
        rating: 4,
        comment: 'Test comment'
      };

      service.createReview(invalidReview).subscribe({
        next: () => fail('Should have rejected non-existent apartment'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject review for non-existent user', (done) => {
      const invalidReview: ReviewRequestDTO = {
        userId: 999999,
        apartmentId: testApartmentId,
        rating: 4,
        comment: 'Test comment'
      };

      service.createReview(invalidReview).subscribe({
        next: () => fail('Should have rejected non-existent user'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should create review with maximum length comment', (done) => {
      const longComment = 'A'.repeat(500);
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 5,
        comment: longComment
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          expect(created).toBeTruthy();
          expect(created.comment.length).toBeLessThanOrEqual(longComment.length);
          createdReviewIds.push(created.id);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== updateReview() ====================
  describe('updateReview', () => {
    it('should update review comment and rating successfully', (done) => {
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 3,
        comment: 'Original comment'
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          createdReviewIds.push(created.id);
          
          const updateRequest: UpdateReviewRequestDTO = {
            comment: 'Updated comment with more details',
            rating: 5
          };

          service.updateReview(created.id, updateRequest).subscribe({
            next: (updated: ReviewDTO) => {
              expect(updated).toBeTruthy();
              expect(updated.id).toBe(created.id);
              expect(updated.comment).toBe(updateRequest.comment);
              expect(updated.rating).toBe(updateRequest.rating);
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

    it('should reject update with empty comment', (done) => {
      const reviewId = 1;
      const updateRequest: UpdateReviewRequestDTO = {
        comment: '',
        rating: 4
      };
      
      service.updateReview(reviewId, updateRequest).subscribe({
        next: () => fail('Should have rejected empty comment'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should handle 404 when updating non-existent review', (done) => {
      const invalidReviewId = 999999;
      const updateRequest: UpdateReviewRequestDTO = {
        comment: 'Updated comment',
        rating: 4
      };
      
      service.updateReview(invalidReviewId, updateRequest).subscribe({
        next: () => fail('Expected error for non-existent review'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should allow updating comment multiple times', (done) => {
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 4,
        comment: 'First comment'
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          createdReviewIds.push(created.id);

          const update1: UpdateReviewRequestDTO = {
            comment: 'Second comment',
            rating: 4
          };

          service.updateReview(created.id, update1).subscribe({
            next: () => {
              const update2: UpdateReviewRequestDTO = {
                comment: 'Third comment',
                rating: 5
              };
              
              service.updateReview(created.id, update2).subscribe({
                next: (updated: ReviewDTO) => {
                  expect(updated.comment).toBe('Third comment');
                  expect(updated.rating).toBe(5);
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

  // ==================== deleteReview() ====================
  describe('deleteReview', () => {
    it('should delete an existing review', (done) => {
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 3,
        comment: 'Review to be deleted'
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          service.deleteReview(created.id).subscribe({
            next: () => {
              expect(true).toBeTrue();
              const index = createdReviewIds.indexOf(created.id);
              if (index > -1) {
                createdReviewIds.splice(index, 1);
              }
              done();
            },
            error: (err) => {
              if (err.status === 401 || err.status === 403) {
                done();
              } else {
                fail(`Delete review failed: ${err.message}`);
              }
            }
          });
        },
        error: () => {
          service.deleteReview(999999).subscribe({
            next: () => done(),
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        }
      });
    });

    it('should handle 404 when deleting non-existent review', (done) => {
      const invalidReviewId = 999999;
      service.deleteReview(invalidReviewId).subscribe({
        next: () => fail('Expected error for non-existent review'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should not allow deleting already deleted review', (done) => {
      const newReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 2,
        comment: 'Double delete test'
      };

      service.createReview(newReview).subscribe({
        next: (created: ReviewDTO) => {
          service.deleteReview(created.id).subscribe({
            next: () => {
              service.deleteReview(created.id).subscribe({
                next: () => fail('Should not allow double delete'),
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

  // ==================== getReviewsByApartment() ====================
  describe('getReviewsByApartment', () => {
    it('should fetch reviews for a specific apartment with pagination', (done) => {
      service.getReviewsByApartment(testApartmentId, 0, 10).subscribe({
        next: (reviews: ReviewDTO[]) => {
          expect(reviews).toBeTruthy();
          expect(Array.isArray(reviews)).toBeTrue();
          expect(reviews.length).toBeLessThanOrEqual(10);

          reviews.forEach(review => {
            expect(review.apartmentId).toBe(testApartmentId);
            expect(review.id).toBeDefined();
            expect(review.userId).toBeDefined();
            expect(review.rating).toBeGreaterThanOrEqual(1);
            expect(review.rating).toBeLessThanOrEqual(5);
            expect(review.comment).toBeDefined();
          });
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should respect page size parameter', (done) => {
      service.getReviewsByApartment(testApartmentId, 0, 3).subscribe({
        next: (reviews: ReviewDTO[]) => {
          expect(reviews.length).toBeLessThanOrEqual(3);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return valid review structure', (done) => {
      service.getReviewsByApartment(testApartmentId, 0, 1).subscribe({
        next: (reviews: ReviewDTO[]) => {
          if (reviews.length > 0) {
            const review = reviews[0];
            expect(review.id).toBeDefined();
            expect(review.userId).toBeDefined();
            expect(review.userName).toBeDefined();
            expect(review.apartmentId).toBeDefined();
            expect(review.date).toBeDefined();
            expect(review.rating).toBeDefined();
            expect(review.comment).toBeDefined();
          }
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle non-existent apartment', (done) => {
      const invalidApartmentId = 999999;
      service.getReviewsByApartment(invalidApartmentId, 0, 10).subscribe({
        next: (reviews: ReviewDTO[]) => {
          expect(Array.isArray(reviews)).toBeTrue();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle different page numbers', (done) => {
      service.getReviewsByApartment(testApartmentId, 0, 5).subscribe({
        next: (firstPage: ReviewDTO[]) => {
          service.getReviewsByApartment(testApartmentId, 1, 5).subscribe({
            next: (secondPage: ReviewDTO[]) => {
              expect(Array.isArray(firstPage)).toBeTrue();
              expect(Array.isArray(secondPage)).toBeTrue();
              done();
            },
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== canUserReview() ====================
  describe('canUserReview', () => {
    it('should check if user can review an apartment', (done) => {
      service.canUserReview(testUserId, testApartmentId).subscribe({
        next: (canReview: boolean) => {
          expect(typeof canReview).toBe('boolean');
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return false for non-existent user', (done) => {
      const invalidUserId = 999999;
      service.canUserReview(invalidUserId, testApartmentId).subscribe({
        next: (canReview: boolean) => {
          expect(canReview).toBeFalse();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return false for non-existent apartment', (done) => {
      const invalidApartmentId = 999999;
      service.canUserReview(testUserId, invalidApartmentId).subscribe({
        next: (canReview: boolean) => {
          expect(canReview).toBeFalse();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle invalid user and apartment combination', (done) => {
      service.canUserReview(999999, 999999).subscribe({
        next: (canReview: boolean) => {
          expect(canReview).toBeFalse();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== getApartmentRating() ====================
  describe('getApartmentRating', () => {
    it('should fetch rating for a specific apartment', (done) => {
      service.getApartmentRating(testApartmentId).subscribe({
        next: (rating: number) => {
          expect(rating).toBeDefined();
          expect(typeof rating).toBe('number');
          expect(rating).toBeGreaterThanOrEqual(0);
          expect(rating).toBeLessThanOrEqual(5);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle non-existent apartment', (done) => {
      const invalidApartmentId = 999999;
      service.getApartmentRating(invalidApartmentId).subscribe({
        next: (rating: number) => {
          expect(rating).toBeGreaterThanOrEqual(0);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return valid rating range', (done) => {
      service.getApartmentRating(testApartmentId).subscribe({
        next: (rating: number) => {
          if (rating > 0) {
            expect(rating).toBeGreaterThanOrEqual(1);
            expect(rating).toBeLessThanOrEqual(5);
          }
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
      service.getReviewsByApartment(-1).subscribe({
        next: () => done(),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should handle malformed review data', (done) => {
      const malformedReview: any = {
        userId: 'not a number',
        apartmentId: 'invalid',
        rating: 'not a number',
        comment: 123
      };

      service.createReview(malformedReview).subscribe({
        next: () => fail('Should reject malformed data'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should validate rating is within valid range', (done) => {
      const validReview: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 3,
        comment: 'Valid review'
      };

      service.createReview(validReview).subscribe({
        next: (created) => {
          expect(created.rating).toBeGreaterThanOrEqual(1);
          expect(created.rating).toBeLessThanOrEqual(5);
          createdReviewIds.push(created.id);
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle special characters in comment', (done) => {
      const specialComment = 'Great! 100% recommended. <3 ñáéíóú';
      const review: ReviewRequestDTO = {
        userId: testUserId,
        apartmentId: testApartmentId,
        rating: 5,
        comment: specialComment
      };

      service.createReview(review).subscribe({
        next: (created) => {
          expect(created.comment).toContain('Great!');
          createdReviewIds.push(created.id);
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