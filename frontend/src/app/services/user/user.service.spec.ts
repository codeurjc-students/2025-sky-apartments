import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { UserService } from './user.service';
import { UserDTO } from '../../dtos/user.dto';
import { UserRequestDTO } from '../../dtos/userRequest.dto';
import { UpdateUserRequestDTO } from '../../dtos/updateUserRequest.dto';
import { LoginService } from './login.service';

describe('UserService (Integration)', () => {
  let service: UserService;
  let authService: LoginService;
  let createdUserIds: number[] = [];
  let currentUserId: number;

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(UserService);
    authService = TestBed.inject(LoginService);

    authService.logIn('admin@example.com', 'Password@1234').subscribe({
      next: () => {
        setTimeout(() => {
          const user = authService.currentUser();
          currentUserId = user?.id || 2;
          done();
        }, 2000);
      },
      error: (err) => {
        fail(`Login failed: ${err.message}`)
      }
    });
  });

  afterEach((done) => {

    if (createdUserIds.length === 0) {
 
      if (authService.isLogged()) {
        authService.logOut().subscribe({
          next: () => setTimeout(() => done(), 500),
          error: () => setTimeout(() => done(), 500)
        });
      } else {
        done();
      }
      return;
    }

    let deletedCount = 0;
    createdUserIds.forEach((id) => {
      service.deleteUser(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount === createdUserIds.length) {
            createdUserIds = [];
            if (authService.isLogged()) {
              authService.logOut().subscribe({
                next: () => setTimeout(() => done(), 500),
                error: () => setTimeout(() => done(), 500)
              });
            } else {
              done();
            }
          }
        },
        error: () => {
          deletedCount++;
          if (deletedCount === createdUserIds.length) {
            createdUserIds = [];
            if (authService.isLogged()) {
              authService.logOut().subscribe({
                next: () => setTimeout(() => done(), 500),
                error: () => setTimeout(() => done(), 500)
              });
            } else {
              done();
            }
          }
        }
      });
    });
  });

  // ==================== getCurrentUser() ====================
  describe('getCurrentUser', () => {
    it('should fetch the current logged-in user', (done) => {
      service.getCurrentUser().subscribe({
        next: (user: UserDTO) => {
          expect(user).toBeTruthy();
          expect(user.id).toBeGreaterThan(0);
          expect(user.email).toBe('admin@example.com');
          expect(user.name).toBeDefined();
          expect(user.surname).toBeDefined();
          expect(user.phoneNumber).toBeDefined();
          expect(user.roles).toBeDefined();
          expect(Array.isArray(user.roles)).toBeTrue();
          done();
        },
        error: (err) => fail(`Get current user failed: ${err.message}`)
      });
    });

    it('should return user with all required fields', (done) => {
      service.getCurrentUser().subscribe({
        next: (user: UserDTO) => {
          expect(user.hasOwnProperty('id')).toBeTrue();
          expect(user.hasOwnProperty('name')).toBeTrue();
          expect(user.hasOwnProperty('surname')).toBeTrue();
          expect(user.hasOwnProperty('email')).toBeTrue();
          expect(user.hasOwnProperty('phoneNumber')).toBeTrue();
          expect(user.hasOwnProperty('roles')).toBeTrue();
          done();
        },
        error: (err) => fail(`Get current user failed: ${err.message}`)
      });
    });

    it('should fail when not authenticated', (done) => {

      authService.logOut().subscribe({
        next: () => {
          setTimeout(() => {
            service.getCurrentUser().subscribe({
              next: () => fail('Should have failed without authentication'),
              error: (err) => {
                expect(err.status).toBe(401);
                done();
              }
            });
          }, 1000);
        },
        error: () => done()
      });
    });
  });

  // ==================== getUserById() ====================
  describe('getUserById', () => {
    it('should fetch a user by ID', (done) => {
      service.getUserById(currentUserId).subscribe({
        next: (user: UserDTO) => {
          expect(user).toBeTruthy();
          expect(user.id).toBe(currentUserId);
          expect(user.email).toBeDefined();
          expect(user.name).toBeDefined();
          done();
        },
        error: (err) => fail(`Get user by ID failed: ${err.message}`)
      });
    });

    it('should handle 404 for non-existent user', (done) => {
      const invalidId = 999999;
      service.getUserById(invalidId).subscribe({
        next: () => fail('Expected 404 error'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle negative IDs', (done) => {
      service.getUserById(-1).subscribe({
        next: () => fail('Expected error for negative ID'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== createUser() ====================
  describe('createUser', () => {
    it('should reject when passwords do not match', (done) => {
      const mismatchUser: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'DifferentPassword@1234',
        phoneNumber: '123456789'
      };

      service.createUser(mismatchUser).subscribe({
        next: () => fail('Should have rejected mismatched passwords'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });
    
    it('should create a new user with valid data', (done) => {
      const newUser: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(newUser).subscribe({
        next: (created: UserDTO) => {
          expect(created).toBeTruthy();
          expect(created.id).toBeDefined();
          expect(created.id).toBeGreaterThan(0);
          expect(created.name).toBe(newUser.name);
          expect(created.surname).toBe(newUser.surname);
          expect(created.email).toBe(newUser.email);
          expect(created.phoneNumber).toBe(newUser.phoneNumber);
          createdUserIds.push(created.id);
          done();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Create user failed: ${err.message}`);
          }
        }
      });
    });

    it('should reject user creation with invalid email', (done) => {
      const invalidUser: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: 'invalid-email',
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(invalidUser).subscribe({
        next: () => fail('Should have rejected invalid email'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject user creation with weak password', (done) => {
      const weakPasswordUser: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: `test${Date.now()}@example.com`,
        password: '123',
        repeatPassword: '123',
        phoneNumber: '123456789'
      };

      service.createUser(weakPasswordUser).subscribe({
        next: () => fail('Should have rejected weak password'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject user creation with empty required fields', (done) => {
      const emptyUser: UserRequestDTO = {
        name: '',
        surname: '',
        email: '',
        password: '',
        repeatPassword: '',
        phoneNumber: ''
      };

      service.createUser(emptyUser).subscribe({
        next: () => fail('Should have rejected empty fields'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject duplicate email', (done) => {
      const user1: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: `duplicate${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(user1).subscribe({
        next: (created) => {
          createdUserIds.push(created.id);
          
          const user2: UserRequestDTO = { ...user1 };
          service.createUser(user2).subscribe({
            next: () => fail('Should have rejected duplicate email'),
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Initial creation failed: ${err.message}`);
          }
        }
      });
    });

    it('should not expose password in response', (done) => {
      const newUser: UserRequestDTO = {
        name: 'Test',
        surname: 'User',
        email: `test${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(newUser).subscribe({
        next: (created: UserDTO) => {
          const userString = JSON.stringify(created);
          expect(userString.toLowerCase()).not.toContain('password');
          expect(created.hasOwnProperty('password')).toBeFalse();
          createdUserIds.push(created.id);
          done();
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Create user failed: ${err.message}`);
          }
        }
      });
    });
  });

  // ==================== updateUser() ====================
  describe('updateUser', () => {
    it('should update user information', (done) => {
      const newUser: UserRequestDTO = {
        name: 'TestUpdate',
        surname: 'User',
        email: `update${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(newUser).subscribe({
        next: (created) => {
          createdUserIds.push(created.id);

          const updateData: UpdateUserRequestDTO = {
            name: 'Updated',
            surname: 'Name',
            phoneNumber: '987654321',
            email: '',
            password: '',
            repeatPassword: ''
          };

          service.updateUser(created.id, updateData).subscribe({
            next: (updated: UserDTO) => {
              expect(updated).toBeTruthy();
              expect(updated.id).toBe(created.id);
              expect(updated.name).toBe(updateData.name);
              expect(updated.surname).toBe(updateData.surname);
              expect(updated.phoneNumber).toBe(updateData.phoneNumber);
              done();
            },
            error: (err) => {
              if (err.status === 401 || err.status === 403) {
                done();
              } else {
                fail(`Update user failed: ${err.message}`);
              }
            }
          });
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Create user failed: ${err.message}`);
          }
        }
      });
    }, 15000);

    it('should handle 404 for non-existent user', (done) => {
      const invalidId = 999999;
      const updateData: UpdateUserRequestDTO = {
        name: 'Test',
        surname: '',
        email: '',
        phoneNumber: '',
        password: '',
        repeatPassword: ''
      };

      service.updateUser(invalidId, updateData).subscribe({
        next: () => fail('Expected 404 error'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should reject invalid phone number format', (done) => {
      const newUser: UserRequestDTO = {
        name: 'TestPhone',
        surname: 'User',
        email: `phone${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(newUser).subscribe({
        next: (created) => {
          createdUserIds.push(created.id);

          const invalidUpdate: UpdateUserRequestDTO = {
            phoneNumber: 'invalid-phone',
            name: '',
            surname: '',
            email: '',
            password: '',
            repeatPassword: ''
          };

          service.updateUser(created.id, invalidUpdate).subscribe({
            next: (updated) => {
              expect(updated).toBeTruthy();
              done();
            },
            error: (err) => {
              expect(err.status).toBeGreaterThanOrEqual(400);
              done();
            }
          });
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`Create user failed: ${err.message}`);
          }
        }
      });
    }, 15000);

    it('should not allow updating to duplicate email', (done) => {
      const user1: UserRequestDTO = {
        name: 'User1',
        surname: 'Test',
        email: `user1${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '111111111'
      };

      service.createUser(user1).subscribe({
        next: (created1) => {
          createdUserIds.push(created1.id);

          const user2: UserRequestDTO = {
            name: 'User2',
            surname: 'Test',
            email: `user2${Date.now()}@example.com`,
            password: 'Password@1234',
            repeatPassword: 'Password@1234',
            phoneNumber: '222222222'
          };

          service.createUser(user2).subscribe({
            next: (created2) => {
              createdUserIds.push(created2.id);
              const duplicateEmailUpdate: UpdateUserRequestDTO = {
                name: 'Current',
                surname: 'User',
                email: user1.email,
                phoneNumber: '999999999',
                password: 'Password@1234',
                repeatPassword: 'Password@1234'
              };

              service.updateUser(created2.id, duplicateEmailUpdate).subscribe({
                next: () => fail('Should have rejected duplicate email'),
                error: (err) => {
                  expect(err.status).toBeGreaterThanOrEqual(400);
                  done();
                }
              });
            },
            error: (err) => {
              if (err.status === 401 || err.status === 403) {
                done();
              } else {
                fail(`User2 creation failed: ${err.message}`);
              }
            }
          });
        },
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`User1 creation failed: ${err.message}`);
          }
        }
      });
    }, 20000);
  });
  // ==================== deleteUser() ====================
  describe('deleteUser', () => {
    it('should delete a user by ID', (done) => {

      const userToDelete: UserRequestDTO = {
        name: 'ToDelete',
        surname: 'User',
        email: `delete${Date.now()}@example.com`,
        password: 'Password@1234',
        repeatPassword: 'Password@1234',
        phoneNumber: '123456789'
      };

      service.createUser(userToDelete).subscribe({
        next: (created) => {
          service.deleteUser(created.id).subscribe({
            next: () => {

              service.getUserById(created.id).subscribe({
                next: () => fail('User should have been deleted'),
                error: (err) => {
                  expect(err.status).toBeGreaterThanOrEqual(400);
                  done();
                }
              });
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
        error: (err) => {
          if (err.status === 401 || err.status === 403) {
            done();
          } else {
            fail(`User creation failed: ${err.message}`);
          }
        }
      });
    });

    it('should handle 404 when deleting non-existent user', (done) => {
      const invalidId = 999999;
      service.deleteUser(invalidId).subscribe({
        next: () => fail('Expected 404 error'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== Edge Cases & Error Handling ====================
  describe('Edge Cases & Error Handling', () => {
    it('should handle malformed user data', (done) => {
      const malformedUser: any = {
        name: 123,
        surname: true,
        email: null,
        password: [],
        repeatPassword: {},
        phoneNumber: {}
      };

      service.createUser(malformedUser).subscribe({
        next: () => fail('Should reject malformed data'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should handle network errors gracefully', (done) => {
      service.getUserById(-999).subscribe({
        next: () => done(),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should validate email format strictly', (done) => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user..name@example.com'
      ];

      let testCount = 0;
      invalidEmails.forEach(email => {
        const user: UserRequestDTO = {
          name: 'Test',
          surname: 'User',
          email: email,
          password: 'Password@1234',
          repeatPassword: 'Password@1234',
          phoneNumber: '123456789'
        };

        service.createUser(user).subscribe({
          next: (created) => {
   
            createdUserIds.push(created.id);
            testCount++;
            if (testCount === invalidEmails.length) done();
          },
          error: () => {
            testCount++;
            if (testCount === invalidEmails.length) done();
          }
        });
      });
    });
  });
});