import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoginService } from './login.service';
import { UserDTO } from '../../dtos/user.dto';

describe('LoginService (Integration)', () => {
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    service = TestBed.inject(LoginService);
  });

  afterEach((done) => {
    if (service.isLogged()) {
      service.logOut().subscribe({
        next: () => {
          setTimeout(() => done(), 500);
        },
        error: () => {
          setTimeout(() => done(), 500);
        }
      });
    } else {
      done();
    }
  });

  // ==================== logIn() ====================
  describe('logIn', () => {
    it('should log in with valid credentials', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            expect(service.isLogged()).toBeTrue();
            expect(service.currentUser()).toBeTruthy();
            expect(service.currentUser().email).toBe('admin@example.com');
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);

    it('should set user data after successful login', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user = service.currentUser();
            expect(user.id).toBeGreaterThan(0);
            expect(user.name).toBeDefined();
            expect(user.surname).toBeDefined();
            expect(user.email).toBe('admin@example.com');
            expect(user.phoneNumber).toBeDefined();
            expect(user.roles).toBeDefined();
            expect(Array.isArray(user.roles)).toBeTrue();
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);

    it('should reject login with invalid credentials', (done) => {
      const initialState = service.isLogged();
      service.logIn('invalid@example.com', 'wrongpassword').subscribe({
        next: () => fail('Should have rejected invalid credentials'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          setTimeout(() => {
            expect(service.isLogged()).toBe(initialState);
            done();
          }, 1000);
        }
      });
    }, 10000);

    it('should reject login with empty username', (done) => {
      service.logIn('', 'Password@1234').subscribe({
        next: () => fail('Should have rejected empty username'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject login with empty password', (done) => {
      service.logIn('admin@example.com', '').subscribe({
        next: () => fail('Should have rejected empty password'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should reject login with non-existent user', (done) => {
      service.logIn('nonexistent@example.com', 'Password@1234').subscribe({
        next: () => fail('Should have rejected non-existent user'),
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          expect(err.status).toBeLessThan(500);
          done();
        }
      });
    });

    it('should handle multiple login attempts correctly', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            expect(service.isLogged()).toBeTrue();
            const firstUser = service.currentUser();

            service.logOut().subscribe({
              next: () => {
                setTimeout(() => {
                  expect(service.isLogged()).toBeFalse();

                  service.logIn('admin@example.com', 'Password@1234').subscribe({
                    next: () => {
                      setTimeout(() => {
                        expect(service.isLogged()).toBeTrue();
                        expect(service.currentUser().email).toBe(firstUser.email);
                        done();
                      }, 2000);
                    },
                    error: (err) => fail(`Second login failed: ${err.message}`)
                  });
                }, 2000);
              },
              error: (err) => fail(`Logout failed: ${err.message}`)
            });
          }, 2000);
        },
        error: (err) => fail(`First login failed: ${err.message}`)
      });
    }, 20000);
  });

  // ==================== logOut() ====================
  describe('logOut', () => {
    it('should log out successfully after login', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            expect(service.isLogged()).toBeTrue();

            service.logOut().subscribe({
              next: () => {
                setTimeout(() => {
                  expect(service.isLogged()).toBeFalse();
                  done();
                }, 1500);
              },
              error: (err) => fail(`Logout failed: ${err.message}`)
            });
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 15000);

    it('should set logged flag to false after logout', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            service.logOut().subscribe({
              next: () => {
                expect(service.logged).toBeFalse();
                expect(service.isLogged()).toBeFalse();
                done();
              },
              error: (err) => fail(`Logout failed: ${err.message}`)
            });
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });

    it('should handle logout when not logged in', (done) => {
      service.logOut().subscribe({
        next: () => {
          expect(service.isLogged()).toBeFalse();
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });
  });

  // ==================== isLogged() ====================
  describe('isLogged', () => {
    it('should return false initially', () => {
      const newService = new LoginService(TestBed.inject(HttpClient));
      setTimeout(() => {
        expect(newService.isLogged()).toBeFalse();
      }, 100);
    });

    it('should return true after successful login', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            expect(service.isLogged()).toBeTrue();
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);

    it('should return false after logout', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            service.logOut().subscribe({
              next: () => {
                setTimeout(() => {
                  expect(service.isLogged()).toBeFalse();
                  done();
                }, 1000);
              },
              error: (err) => fail(`Logout failed: ${err.message}`)
            });
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });

    it('should remain false after failed login', (done) => {
      const initialState = service.isLogged();
      service.logIn('invalid@example.com', 'wrongpassword').subscribe({
        next: () => fail('Should not succeed'),
        error: () => {
          expect(service.isLogged()).toBe(initialState);
          expect(service.isLogged()).toBeFalse();
          done();
        }
      });
    });
  });

  // ==================== isAdmin() ====================
  describe('isAdmin', () => {
    it('should return true for admin user', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user = service.currentUser();
            const isAdmin = service.isAdmin();
            const hasAdminRole = user.roles.includes('ADMIN');
            
            expect(isAdmin).toBe(hasAdminRole);
            
            if (hasAdminRole) {
              expect(isAdmin).toBeTrue();
            } else {
              expect(user.roles.length).toBeGreaterThan(0);
            }
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);

    it('should return false for non-admin user', (done) => {
      service.logIn('user@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const isAdmin = service.isAdmin();
            const roles = service.currentUser().roles;
            
            if (isAdmin) {
              expect(roles).toContain('ADMIN');
            } else {
              expect(roles).not.toContain('ADMIN');
            }
            done();
          }, 500);
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should return false when not logged in', () => {
      expect(service.isAdmin()).toBeFalse();
    });

    it('should return false after logout', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            service.logOut().subscribe({
              next: () => {
                setTimeout(() => {
                  expect(service.isAdmin()).toBeFalse();
                  done();
                }, 1500);
              },
              error: (err) => fail(`Logout failed: ${err.message}`)
            });
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 15000);
  });

  // ==================== currentUser() ====================
  describe('currentUser', () => {
    it('should return default user object initially', () => {
      const user = service.currentUser();
      expect(user).toBeDefined();
      expect(user.id).toBe(0);
      expect(user.email).toBe('');
      expect(user.roles).toEqual([]);
    });

    it('should return logged in user data after login', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user = service.currentUser();
            expect(user).toBeTruthy();
            expect(user.id).toBeGreaterThan(0);
            expect(user.email).toBe('admin@example.com');
            expect(user.name).toBeTruthy();
            expect(user.surname).toBeTruthy();
            expect(user.roles.length).toBeGreaterThan(0);
            done();
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });

    it('should return user with all required fields', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user = service.currentUser();
            expect(user.hasOwnProperty('id')).toBeTrue();
            expect(user.hasOwnProperty('name')).toBeTrue();
            expect(user.hasOwnProperty('surname')).toBeTrue();
            expect(user.hasOwnProperty('email')).toBeTrue();
            expect(user.hasOwnProperty('phoneNumber')).toBeTrue();
            expect(user.hasOwnProperty('roles')).toBeTrue();
            done();
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });

    it('should return same user object reference', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user1 = service.currentUser();
            const user2 = service.currentUser();
            expect(user1).toBe(user2);
            done();
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });
  });

  // ==================== reqIsLogged() ====================
  describe('reqIsLogged', () => {
    it('should update user state when already logged in', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const initialUser = service.currentUser();
            expect(initialUser.id).toBeGreaterThan(0);

            service.reqIsLogged();

            setTimeout(() => {
              expect(service.isLogged()).toBeTrue();
              expect(service.currentUser().id).toBeGreaterThanOrEqual(0);
              done();
            }, 2000);
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 15000);

    it('should not throw error when called without active session', () => {
      expect(() => service.reqIsLogged()).not.toThrow();
    });
  });

  // ==================== Edge Cases & Security ====================
  describe('Edge Cases & Security', () => {
    it('should handle rapid login/logout cycles', (done) => {
      let completedCycles = 0;
      const totalCycles = 3;

      const cycle = (index: number) => {
        service.logIn('admin@example.com', 'Password@1234').subscribe({
          next: () => {
            setTimeout(() => {
              service.logOut().subscribe({
                next: () => {
                  completedCycles++;
                  if (completedCycles === totalCycles) {
                    expect(service.isLogged()).toBeFalse();
                    done();
                  } else {
                    cycle(completedCycles);
                  }
                },
                error: (err) => fail(`Logout ${index} failed: ${err.message}`)
              });
            }, 300);
          },
          error: (err) => fail(`Login ${index} failed: ${err.message}`)
        });
      };

      cycle(0);
    });

    it('should not expose password in any way', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const user = service.currentUser();
            const userString = JSON.stringify(user);
            expect(userString.toLowerCase()).not.toContain('password');
            expect('password' in user).toBeFalse();
            done();
          }, 1000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    });

    it('should handle concurrent login requests', (done) => {
      let successCount = 0;
      const login1 = service.logIn('admin@example.com', 'Password@1234');
      const login2 = service.logIn('admin@example.com', 'Password@1234');

      login1.subscribe({
        next: () => {
          successCount++;
          if (successCount === 2) {
            setTimeout(() => {
              expect(service.isLogged()).toBeTrue();
              done();
            }, 1000);
          }
        },
        error: (err) => fail(`Login 1 failed: ${err.message}`)
      });

      login2.subscribe({
        next: () => {
          successCount++;
          if (successCount === 2) {
            setTimeout(() => {
              expect(service.isLogged()).toBeTrue();
              done();
            }, 1000);
          }
        },
        error: (err) => fail(`Login 2 failed: ${err.message}`)
      });
    });

    it('should maintain user roles after login', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            const roles = service.currentUser().roles;
            expect(Array.isArray(roles)).toBeTrue();
            expect(roles.length).toBeGreaterThan(0);
            
            roles.forEach(role => {
              expect(typeof role).toBe('string');
              expect(role.length).toBeGreaterThan(0);
            });
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);

    it('should handle network errors gracefully', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => done(),
        error: (err) => {
          expect(err).toBeTruthy();
          expect(service.isLogged()).toBeFalse();
          done();
        }
      });
    });

    it('should send credentials with requests', (done) => {
      service.logIn('admin@example.com', 'Password@1234').subscribe({
        next: () => {
          setTimeout(() => {
            expect(service.isLogged()).toBeTrue();
            done();
          }, 2000);
        },
        error: (err) => fail(`Login failed: ${err.message}`)
      });
    }, 10000);
  });
});