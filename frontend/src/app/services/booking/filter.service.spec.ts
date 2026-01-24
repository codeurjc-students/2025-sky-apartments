import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FilterService } from './filter.service';
import { FilterDTO, DateType, ConditionType } from '../../dtos/filter.dto';
import { FiltersByDateResponseDTO } from '../../dtos/filterByDateResponse.dto';
import { LoginService } from '../user/login.service';
import { forkJoin } from 'rxjs';

describe('FilterService', () => {
  let service: FilterService;
  let authService: LoginService;
  let createdFilterIds: number[] = [];

  beforeEach((done) => {
    TestBed.configureTestingModule({
      providers: [
        FilterService,
        LoginService,
        provideHttpClient(withInterceptorsFromDi())
      ]
    });
    
    service = TestBed.inject(FilterService);
    authService = TestBed.inject(LoginService);

    authService.logIn('admin@example.com', 'Password@1234').subscribe({
      next: () => done(),
      error: () => done()
    });
  });

  afterEach((done) => {
    if (createdFilterIds.length === 0) {
      done();
      return;
    }

    let deletedCount = 0;
    createdFilterIds.forEach((id) => {
      service.delete(id).subscribe({
        next: () => {
          deletedCount++;
          if (deletedCount === createdFilterIds.length) {
            createdFilterIds = [];
            done();
          }
        },
        error: () => {
          deletedCount++;
          if (deletedCount === createdFilterIds.length) {
            createdFilterIds = [];
            done();
          }
        }
      });
    });
  });

  // ============= FIND ALL TESTS =============

  describe('findAll', () => {
    it('should fetch all filters successfully', (done) => {
      service.findAll().subscribe({
        next: (filters: FilterDTO[]) => {
          expect(filters).toBeTruthy();
          expect(Array.isArray(filters)).toBeTrue();
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should return filters ordered by ID', (done) => {
      service.findAll().subscribe({
        next: (filters: FilterDTO[]) => {
          if (filters.length > 1) {
            for (let i = 0; i < filters.length - 1; i++) {
              expect(filters[i].id).toBeLessThan(filters[i + 1].id!);
            }
          }
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should include all filter properties', (done) => {
      service.findAll().subscribe({
        next: (filters: FilterDTO[]) => {
          if (filters.length > 0) {
            const filter = filters[0];
            expect(filter.id).toBeDefined();
            expect(filter.name).toBeDefined();
            expect(filter.value).toBeDefined();
            expect(filter.dateType).toBeDefined();
            expect(filter.activated).toBeDefined();
          }
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });
  });

  // ============= FIND BY ID TESTS =============

  describe('findById', () => {
    it('should fetch specific filter by ID', (done) => {
      const testFilter = createTestFilterDTO('Find By ID Test');
      
      service.create(testFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          service.findById(created.id!).subscribe({
            next: (found) => {
              expect(found).toBeTruthy();
              expect(found.id).toBe(created.id);
              expect(found.name).toBe('Find By ID Test');
              done();
            },
            error: (err) => {
              fail('Should not fail: ' + err.message);
              done();
            }
          });
        },
        error: (err) => {
          fail('Create failed: ' + err.message);
          done();
        }
      });
    });

    it('should return 404 for non-existent filter', (done) => {
      service.findById(999999).subscribe({
        next: () => {
          fail('Should have failed with 404');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });
    });

    it('should return complete filter data', (done) => {
      const testFilter = createDateRangeFilterDTO('Date Range Test');
      
      service.create(testFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          service.findById(created.id!).subscribe({
            next: (found) => {
              expect(found.dateType).toBe(DateType.DATE_RANGE);
              expect(found.startDate).toBe(testFilter.startDate);
              expect(found.endDate).toBe(testFilter.endDate);
              done();
            },
            error: (err) => {
              fail('Should not fail: ' + err.message);
              done();
            }
          });
        }
      });
    });
  });

  // ============= CREATE TESTS =============

  describe('create', () => {
    it('should create basic filter successfully', (done) => {
      const newFilter = createTestFilterDTO('New Filter Test');
      
      service.create(newFilter).subscribe({
        next: (created) => {
          expect(created).toBeTruthy();
          expect(created.id).toBeDefined();
          expect(created.name).toBe('New Filter Test');
          expect(created.value).toBe(10);
          expect(created.activated).toBeTrue();
          
          createdFilterIds.push(created.id!);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should create filter with DATE_RANGE type', (done) => {
      const dateRangeFilter = createDateRangeFilterDTO('Summer Discount');
      
      service.create(dateRangeFilter).subscribe({
        next: (created) => {
          expect(created.id).toBeDefined();
          expect(created.dateType).toBe(DateType.DATE_RANGE);
          expect(created.startDate).toBe('2024-06-01');
          expect(created.endDate).toBe('2024-08-31');
          
          createdFilterIds.push(created.id!);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should create filter with WEEK_DAYS type', (done) => {
      const weekDaysFilter: FilterDTO = {
        name: 'Weekend Surcharge',
        description: 'Weekend extra charge',
        activated: true,
        increment: true,
        value: 15,
        dateType: DateType.WEEK_DAYS,
        weekDays: '6,7',
        conditionType: ConditionType.NONE
      };
      
      service.create(weekDaysFilter).subscribe({
        next: (created) => {
          expect(created.id).toBeDefined();
          expect(created.dateType).toBe(DateType.WEEK_DAYS);
          expect(created.weekDays).toBe('6,7');
          expect(created.increment).toBeTrue();
          
          createdFilterIds.push(created.id!);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should create filter with LAST_MINUTE condition', (done) => {
      const lastMinuteFilter: FilterDTO = {
        name: 'Last Minute Deal',
        description: 'Last minute discount',
        activated: true,
        increment: false,
        value: 30,
        dateType: DateType.EVERY_DAY,
        conditionType: ConditionType.LAST_MINUTE,
        anticipationHours: 48
      };
      
      service.create(lastMinuteFilter).subscribe({
        next: (created) => {
          expect(created.id).toBeDefined();
          expect(created.conditionType).toBe(ConditionType.LAST_MINUTE);
          expect(created.anticipationHours).toBe(48);
          
          createdFilterIds.push(created.id!);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should create filter with LONG_STAY condition', (done) => {
      const longStayFilter: FilterDTO = {
        name: 'Long Stay Discount',
        description: 'Extended stay discount',
        activated: true,
        increment: false,
        value: 25,
        dateType: DateType.EVERY_DAY,
        conditionType: ConditionType.LONG_STAY,
        minDays: 7
      };
      
      service.create(longStayFilter).subscribe({
        next: (created) => {
          expect(created.id).toBeDefined();
          expect(created.conditionType).toBe(ConditionType.LONG_STAY);
          expect(created.minDays).toBe(7);
          
          createdFilterIds.push(created.id!);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should fail when name is missing', (done) => {
      const invalidFilter: any = {
        description: 'Invalid filter',
        value: 10,
        dateType: DateType.EVERY_DAY
      };
      
      service.create(invalidFilter).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should fail when value is out of range', (done) => {
      const invalidFilter = createTestFilterDTO('Invalid Value');
      invalidFilter.value = 150;
      
      service.create(invalidFilter).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should fail when DATE_RANGE without dates', (done) => {
      const invalidFilter: FilterDTO = {
        name: 'Invalid Date Range',
        description: 'Missing dates',
        activated: true,
        increment: false,
        value: 10,
        dateType: DateType.DATE_RANGE,
        conditionType: ConditionType.NONE
      };
      
      service.create(invalidFilter).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should fail when WEEK_DAYS without days', (done) => {
      const invalidFilter: FilterDTO = {
        name: 'Invalid Week Days',
        description: 'Missing days',
        activated: true,
        increment: false,
        value: 10,
        dateType: DateType.WEEK_DAYS,
        conditionType: ConditionType.NONE
      };
      
      service.create(invalidFilter).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });
  });

  // ============= UPDATE TESTS =============

  describe('update', () => {
    it('should update existing filter', (done) => {
      const originalFilter = createTestFilterDTO('Original Name');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const updateData: FilterDTO = {
            ...created,
            name: 'Updated Name',
            value: 25
          };
          
          service.update(created.id!, updateData).subscribe({
            next: (updated) => {
              expect(updated.id).toBe(created.id);
              expect(updated.name).toBe('Updated Name');
              expect(updated.value).toBe(25);
              done();
            },
            error: (err) => {
              fail('Update failed: ' + err.message);
              done();
            }
          });
        },
        error: (err) => {
          fail('Create failed: ' + err.message);
          done();
        }
      });
    });

    it('should update filter date type', (done) => {
      const originalFilter = createTestFilterDTO('Change Type');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const updateData: FilterDTO = {
            ...created,
            dateType: DateType.WEEK_DAYS,
            weekDays: '1,2,3,4,5'
          };
          
          service.update(created.id!, updateData).subscribe({
            next: (updated) => {
              expect(updated.dateType).toBe(DateType.WEEK_DAYS);
              expect(updated.weekDays).toBe('1,2,3,4,5');
              done();
            },
            error: (err) => {
              fail('Update failed: ' + err.message);
              done();
            }
          });
        }
      });
    });

    it('should update filter condition type', (done) => {
      const originalFilter = createTestFilterDTO('Change Condition');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const updateData: FilterDTO = {
            ...created,
            conditionType: ConditionType.LONG_STAY,
            minDays: 5
          };
          
          service.update(created.id!, updateData).subscribe({
            next: (updated) => {
              expect(updated.conditionType).toBe(ConditionType.LONG_STAY);
              expect(updated.minDays).toBe(5);
              done();
            },
            error: (err) => {
              fail('Update failed: ' + err.message);
              done();
            }
          });
        }
      });
    });

    it('should deactivate filter', (done) => {
      const originalFilter = createTestFilterDTO('Active Filter');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const updateData: FilterDTO = {
            ...created,
            activated: false
          };
          
          service.update(created.id!, updateData).subscribe({
            next: (updated) => {
              expect(updated.activated).toBeFalse();
              done();
            },
            error: (err) => {
              fail('Update failed: ' + err.message);
              done();
            }
          });
        }
      });
    });

    it('should fail when updating non-existent filter', (done) => {
      const updateData = createTestFilterDTO('Non Existent');
      
      service.update(999999, updateData).subscribe({
        next: () => {
          fail('Should have failed with 404');
          done();
        },
        error: (err) => {
          expect(err.status).toBeGreaterThanOrEqual(400);
          done();
        }
      });
    });

    it('should fail when updating with invalid value', (done) => {
      const originalFilter = createTestFilterDTO('Valid Filter');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const invalidUpdate: FilterDTO = {
            ...created,
            value: -10
          };
          
          service.update(created.id!, invalidUpdate).subscribe({
            next: () => {
              fail('Should have failed with validation error');
              done();
            },
            error: (err) => {
              expect(err.status).toBe(400);
              done();
            }
          });
        }
      });
    });

    it('should verify update persists in database', (done) => {
      const originalFilter = createTestFilterDTO('Persistence Test');
      
      service.create(originalFilter).subscribe({
        next: (created) => {
          createdFilterIds.push(created.id!);
          
          const updateData: FilterDTO = {
            ...created,
            name: 'Persisted Update',
            value: 30
          };
          
          service.update(created.id!, updateData).subscribe({
            next: () => {
              service.findById(created.id!).subscribe({
                next: (found) => {
                  expect(found.name).toBe('Persisted Update');
                  expect(found.value).toBe(30);
                  done();
                },
                error: (err) => {
                  fail('FindById failed: ' + err.message);
                  done();
                }
              });
            },
            error: (err) => {
              fail('Update failed: ' + err.message);
              done();
            }
          });
        }
      });
    });
  });

  // ============= DELETE TESTS =============

  describe('delete', () => {
    it('should delete existing filter', (done) => {
      const testFilter = createTestFilterDTO('To Delete');
      
      service.create(testFilter).subscribe({
        next: (created) => {
          const filterId = created.id!;
          
          service.delete(filterId).subscribe({
            next: () => {
              service.findById(filterId).subscribe({
                next: () => {
                  fail('Filter should not exist after deletion');
                  done();
                },
                error: (err) => {
                  expect(err.status).toBe(404);
                  done();
                }
              });
            },
            error: (err) => {
              fail('Delete failed: ' + err.message);
              done();
            }
          });
        },
        error: (err) => {
          fail('Create failed: ' + err.message);
          done();
        }
      });
    });

    it('should fail when deleting non-existent filter', (done) => {
      service.delete(999999).subscribe({
        next: () => {
          fail('Should have failed with 404');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(404);
          done();
        }
      });
    });

    it('should not affect other filters when deleting one', (done) => {
      const filter1 = createTestFilterDTO('Filter 1');
      const filter2 = createTestFilterDTO('Filter 2');
      
      service.create(filter1).subscribe({
        next: (created1) => {
          createdFilterIds.push(created1.id!);
          
          service.create(filter2).subscribe({
            next: (created2) => {
              createdFilterIds.push(created2.id!);
              
              service.delete(created1.id!).subscribe({
                next: () => {
                  service.findById(created2.id!).subscribe({
                    next: (found) => {
                      expect(found).toBeTruthy();
                      expect(found.name).toBe('Filter 2');
                      
                      const index = createdFilterIds.indexOf(created1.id!);
                      if (index > -1) {
                        createdFilterIds.splice(index, 1);
                      }
                      
                      done();
                    },
                    error: (err) => {
                      fail('Filter 2 should still exist: ' + err.message);
                      done();
                    }
                  });
                },
                error: (err) => {
                  fail('Delete failed: ' + err.message);
                  done();
                }
              });
            }
          });
        }
      });
    });
  });

  // ============= GET APPLICABLE FILTERS TESTS =============

  describe('getApplicableFilters', () => {
    it('should return applicable filters for date range', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 4);
      
      const checkInDate = formatDate(tomorrow);
      const checkOutDate = formatDate(dayAfter);
      
      service.getApplicableFilters(checkInDate, checkOutDate).subscribe({
        next: (response: FiltersByDateResponseDTO) => {
          expect(response).toBeTruthy();
          expect(response.checkInDate).toBe(checkInDate);
          expect(response.checkOutDate).toBe(checkOutDate);
          expect(response.totalNights).toBe(3);
          expect(response.filtersByDate).toBeDefined();
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should calculate correct number of nights', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 8);
      
      const checkInDate = formatDate(tomorrow);
      const checkOutDate = formatDate(weekLater);
      
      service.getApplicableFilters(checkInDate, checkOutDate).subscribe({
        next: (response) => {
          expect(response.totalNights).toBe(7);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should handle single night stay', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      const checkInDate = formatDate(tomorrow);
      const checkOutDate = formatDate(dayAfter);
      
      service.getApplicableFilters(checkInDate, checkOutDate).subscribe({
        next: (response) => {
          expect(response.totalNights).toBe(1);
          expect(Object.keys(response.filtersByDate).length).toBeGreaterThanOrEqual(0);
          done();
        },
        error: (err) => {
          fail('Should not fail: ' + err.message);
          done();
        }
      });
    });

    it('should fail when check-in is after check-out', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();
      
      const checkInDate = formatDate(tomorrow);
      const checkOutDate = formatDate(today);
      
      service.getApplicableFilters(checkInDate, checkOutDate).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should fail when check-in equals check-out', (done) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const date = formatDate(tomorrow);
      
      service.getApplicableFilters(date, date).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });

    it('should fail when check-in is in the past', (done) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const checkInDate = formatDate(yesterday);
      const checkOutDate = formatDate(tomorrow);
      
      service.getApplicableFilters(checkInDate, checkOutDate).subscribe({
        next: () => {
          fail('Should have failed with validation error');
          done();
        },
        error: (err) => {
          expect(err.status).toBe(400);
          done();
        }
      });
    });
  });

  // ============= COMPLEX SCENARIOS =============

  describe('Complex Scenarios', () => {
    it('should perform complete CRUD workflow', (done) => {
      const newFilter = createTestFilterDTO('CRUD Test');
      
      service.create(newFilter).subscribe({
        next: (created) => {
          expect(created.id).toBeDefined();
          const filterId = created.id!;
          createdFilterIds.push(filterId);
          
          service.findById(filterId).subscribe({
            next: (found) => {
              expect(found.name).toBe('CRUD Test');
              
              const updateData: FilterDTO = {
                ...found,
                name: 'Updated CRUD',
                value: 30
              };
              
              service.update(filterId, updateData).subscribe({
                next: (updated) => {
                  expect(updated.name).toBe('Updated CRUD');
                  
                  service.delete(filterId).subscribe({
                    next: () => {
                      const index = createdFilterIds.indexOf(filterId);
                      if (index > -1) {
                        createdFilterIds.splice(index, 1);
                      }
                      
                      service.findById(filterId).subscribe({
                        next: () => {
                          fail('Filter should not exist');
                          done();
                        },
                        error: (err) => {
                          expect(err.status).toBe(404);
                          done();
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    });

    it('should handle multiple filters with different types', (done) => {
      const filters = [
        createDateRangeFilterDTO('Summer'),
        {
          name: 'Weekend',
          description: 'Weekend surcharge',
          activated: true,
          increment: true,
          value: 20,
          dateType: DateType.WEEK_DAYS,
          weekDays: '6,7',
          conditionType: ConditionType.NONE
        } as FilterDTO,
        {
          name: 'Long Stay',
          description: 'Long stay discount',
          activated: true,
          increment: false,
          value: 10,
          dateType: DateType.EVERY_DAY,
          conditionType: ConditionType.LONG_STAY,
          minDays: 7
        } as FilterDTO
      ];

      // Crear todos los filtros en paralelo
      forkJoin(filters.map(filter => service.create(filter))).subscribe({
        next: (createdFilters) => {
          // Guardar los IDs para limpieza posterior
          createdFilterIds.push(...createdFilters.map(f => f.id!));
          
          // Obtener todos los filtros
          service.findAll(0, 100).subscribe({
            next: (allFilters) => {
              const myFilters = allFilters.filter(f => 
                createdFilterIds.includes(f.id!)
              );
              expect(myFilters.length).toBe(3);
              
              // Verificar tipos específicos
              const summerFilter = myFilters.find(f => f.name === 'Summer');
              const weekendFilter = myFilters.find(f => f.name === 'Weekend');
              const longStayFilter = myFilters.find(f => f.name === 'Long Stay');
              
              expect(summerFilter).toBeDefined();
              expect(weekendFilter).toBeDefined();
              expect(longStayFilter).toBeDefined();
              
              done();
            },
            error: (err) => {
              done.fail(err);
            }
          });
        },
        error: (err) => {
          done.fail(err);
        }
      });
    });
    
  });

  // ============= HELPER FUNCTIONS =============

  function createTestFilterDTO(name: string): FilterDTO {
    return {
      name: name,
      description: 'Test Description',
      activated: true,
      increment: false,
      value: 10,
      dateType: DateType.EVERY_DAY,
      conditionType: ConditionType.NONE
    };
  }

  function createDateRangeFilterDTO(name: string): FilterDTO {
    return {
      name: name,
      description: 'Date range filter',
      activated: true,
      increment: false,
      value: 15,
      dateType: DateType.DATE_RANGE,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      conditionType: ConditionType.NONE
    };
  }

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});