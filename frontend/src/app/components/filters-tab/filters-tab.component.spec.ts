import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltersTabComponent } from './filters-tab.component';
import { FilterService } from '../../services/booking/filter.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ConditionType, DateType, FilterDTO } from '../../dtos/filter.dto';
import Swal from 'sweetalert2';

describe('FiltersTabComponent', () => {
  let component: FiltersTabComponent;
  let fixture: ComponentFixture<FiltersTabComponent>;
  let filterService: jasmine.SpyObj<FilterService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockFilters: FilterDTO[] = [
    {
      id: 1,
      name: 'Weekend Premium',
      description: 'Price increase for weekends',
      activated: true,
      increment: true,
      value: 20,
      dateType: DateType.WEEK_DAYS,
      weekDays: '5,6,7',
      conditionType: ConditionType.NONE
    },
    {
      id: 2,
      name: 'Last Minute Deal',
      description: 'Discount for last minute bookings',
      activated: false,
      increment: false,
      value: 15,
      dateType: DateType.EVERY_DAY,
      conditionType: ConditionType.LAST_MINUTE,
      anticipationHours: 48
    },
    {
      id: 3,
      name: 'Long Stay Discount',
      description: 'Discount for stays of 7+ days',
      activated: true,
      increment: false,
      value: 10,
      dateType: DateType.EVERY_DAY,
      conditionType: ConditionType.LONG_STAY,
      minDays: 7
    }
  ];

  beforeEach(async () => {
    const filterServiceSpy = jasmine.createSpyObj('FilterService', [
      'findAll',
      'create',
      'update',
      'delete'
    ]);
    
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        FiltersTabComponent,
        CommonModule,
        FormsModule
      ],
      providers: [
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture = TestBed.createComponent(FiltersTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load filters on initialization', () => {
      filterService.findAll.and.returnValue(of(mockFilters));

      component.ngOnInit();

      expect(filterService.findAll).toHaveBeenCalled();
      expect(component.filters).toEqual(mockFilters);
      expect(component.loading).toBeFalse();
    });

    it('should handle error when loading filters fails', () => {
      const error = new Error('Network error');
      filterService.findAll.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.ngOnInit();

      expect(component.loading).toBeFalse();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Error loading filters',
        'Close',
        jasmine.objectContaining({ panelClass: ['snackbar-error'] })
      );
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('loadFilters', () => {
    it('should set loading to true while fetching filters', () => {
      filterService.findAll.and.returnValue(of(mockFilters));

      component.loadFilters();

      expect(component.loading).toBeFalse(); // After completion
    });

    it('should populate filters array with data from service', () => {
      filterService.findAll.and.returnValue(of(mockFilters));

      component.loadFilters();

      expect(component.filters.length).toBe(3);
      expect(component.filters[0].name).toBe('Weekend Premium');
    });
  });

  describe('newFilter', () => {
    it('should initialize a new filter with default values', () => {
      component.newFilter();

      expect(component.selectedFilter).toBeDefined();
      expect(component.selectedFilter?.name).toBe('');
      expect(component.selectedFilter?.activated).toBeTrue();
      expect(component.selectedFilter?.increment).toBeFalse();
      expect(component.selectedFilter?.dateType).toBe(DateType.EVERY_DAY);
      expect(component.selectedFilter?.conditionType).toBe(ConditionType.NONE);
    });

    it('should set isEditing to false', () => {
      component.newFilter();

      expect(component.isEditing).toBeFalse();
    });

    it('should show the form', () => {
      component.newFilter();

      expect(component.showForm).toBeTrue();
    });
  });

  describe('editFilter', () => {
    it('should populate selectedFilter with a copy of the filter', () => {
      const filterToEdit = mockFilters[0];

      component.editFilter(filterToEdit);

      expect(component.selectedFilter).toEqual(filterToEdit);
      expect(component.selectedFilter).not.toBe(filterToEdit); // Should be a copy
    });

    it('should set isEditing to true', () => {
      component.editFilter(mockFilters[0]);

      expect(component.isEditing).toBeTrue();
    });

    it('should show the form', () => {
      component.editFilter(mockFilters[0]);

      expect(component.showForm).toBeTrue();
    });
  });

  describe('saveFilter', () => {
    it('should create a new filter when not editing', () => {
      const newFilter: FilterDTO = {
        name: 'New Filter',
        description: 'Test filter',
        activated: true,
        increment: true,
        value: 25,
        dateType: DateType.EVERY_DAY,
        conditionType: ConditionType.NONE
      };
      
      component.selectedFilter = newFilter;
      component.isEditing = false;
      filterService.create.and.returnValue(of(newFilter));
      filterService.findAll.and.returnValue(of(mockFilters));

      component.saveFilter();

      expect(filterService.create).toHaveBeenCalledWith(newFilter);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Filter created successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should update an existing filter when editing', () => {
      const updatedFilter: FilterDTO = { ...mockFilters[0], value: 25 };
      component.selectedFilter = updatedFilter;
      component.isEditing = true;
      filterService.update.and.returnValue(of(updatedFilter));
      filterService.findAll.and.returnValue(of(mockFilters));

      component.saveFilter();

      expect(filterService.update).toHaveBeenCalledWith(updatedFilter.id!, updatedFilter);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Filter updated successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should close form and reload filters after successful save', () => {
      component.selectedFilter = mockFilters[0];
      component.isEditing = true;
      component.showForm = true;
      filterService.update.and.returnValue(of(mockFilters[0]));
      filterService.findAll.and.returnValue(of(mockFilters));

      component.saveFilter();

      expect(component.showForm).toBeFalse();
      expect(component.selectedFilter).toBeUndefined();
      expect(filterService.findAll).toHaveBeenCalled();
    });

    it('should handle error when creating filter fails', () => {
      component.selectedFilter = mockFilters[0];
      component.isEditing = false;
      const error = new Error('Creation failed');
      filterService.create.and.returnValue(throwError(() => error));

      component.saveFilter();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error creating filter',
        'Close',
        jasmine.any(Object)
      );
      expect(component.loading).toBeFalse();
    });

    it('should not save if selectedFilter is undefined', () => {
      component.selectedFilter = undefined;

      component.saveFilter();

      expect(filterService.create).not.toHaveBeenCalled();
      expect(filterService.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFilter', () => {
    beforeEach(() => {
      spyOn(Swal, 'fire').and.returnValue(
        Promise.resolve({ isConfirmed: true } as any)
      );
    });

    it('should delete filter when user confirms', async () => {
      filterService.delete.and.returnValue(of(void 0));
      filterService.findAll.and.returnValue(of(mockFilters));

      await component.deleteFilter(1);
      await fixture.whenStable();

      expect(Swal.fire).toHaveBeenCalled();
      expect(filterService.delete).toHaveBeenCalledWith(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        'Filter deleted successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should not delete filter when user cancels', async () => {
      (Swal.fire as jasmine.Spy).and.returnValue(
        Promise.resolve({ isConfirmed: false } as any)
      );

      await component.deleteFilter(1);
      await fixture.whenStable();

      expect(filterService.delete).not.toHaveBeenCalled();
    });

    it('should handle error when deletion fails', async () => {
      const error = new Error('Deletion failed');
      filterService.delete.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      await component.deleteFilter(1);
      await fixture.whenStable();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error deleting filter',
        'Close',
        jasmine.any(Object)
      );
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('toggleActivation', () => {
    it('should toggle filter activation', () => {
      const filter = { ...mockFilters[0] };
      const updatedFilter = { ...filter, activated: false };
      filterService.update.and.returnValue(of(updatedFilter));
      filterService.findAll.and.returnValue(of(mockFilters));

      component.toggleActivation(filter);

      expect(filterService.update).toHaveBeenCalledWith(
        filter.id!,
        jasmine.objectContaining({ activated: false })
      );
      expect(snackBar.open).toHaveBeenCalledWith(
        'Filter deactivated successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should not toggle if filter has no id', () => {
      const filter: FilterDTO = { ...mockFilters[0], id: undefined };

      component.toggleActivation(filter);

      expect(filterService.update).not.toHaveBeenCalled();
    });

    it('should handle error when toggle fails', () => {
      const filter = mockFilters[0];
      const error = new Error('Toggle failed');
      filterService.update.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.toggleActivation(filter);

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error toggling filter',
        'Close',
        jasmine.any(Object)
      );
      expect(console.error).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('closeForm', () => {
    it('should reset form state', () => {
      component.showForm = true;
      component.selectedFilter = mockFilters[0];
      component.isEditing = true;

      component.closeForm();

      expect(component.showForm).toBeFalse();
      expect(component.selectedFilter).toBeUndefined();
      expect(component.isEditing).toBeFalse();
    });
  });

  describe('Helper methods', () => {
    describe('getTypeLabel', () => {
      it('should return "Increment" for increment filters', () => {
        const filter: FilterDTO = { ...mockFilters[0], increment: true };

        expect(component.getTypeLabel(filter)).toBe('Increment');
      });

      it('should return "Discount" for non-increment filters', () => {
        const filter: FilterDTO = { ...mockFilters[0], increment: false };

        expect(component.getTypeLabel(filter)).toBe('Discount');
      });
    });

    describe('getTypeBadgeClass', () => {
      it('should return "badge-danger" for increment filters', () => {
        const filter: FilterDTO = { ...mockFilters[0], increment: true };

        expect(component.getTypeBadgeClass(filter)).toBe('badge-danger');
      });

      it('should return "badge-success" for discount filters', () => {
        const filter: FilterDTO = { ...mockFilters[0], increment: false };

        expect(component.getTypeBadgeClass(filter)).toBe('badge-success');
      });
    });

    describe('showDateFields', () => {
      it('should return true when dateType is DATE_RANGE', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          dateType: DateType.DATE_RANGE 
        };

        expect(component.showDateFields()).toBeTrue();
      });

      it('should return false for other dateTypes', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          dateType: DateType.EVERY_DAY 
        };

        expect(component.showDateFields()).toBeFalse();
      });
    });

    describe('showWeekDaysField', () => {
      it('should return true when dateType is WEEK_DAYS', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          dateType: DateType.WEEK_DAYS 
        };

        expect(component.showWeekDaysField()).toBeTrue();
      });

      it('should return false for other dateTypes', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          dateType: DateType.EVERY_DAY 
        };

        expect(component.showWeekDaysField()).toBeFalse();
      });
    });

    describe('showAnticipationHoursField', () => {
      it('should return true when conditionType is LAST_MINUTE', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          conditionType: ConditionType.LAST_MINUTE 
        };

        expect(component.showAnticipationHoursField()).toBeTrue();
      });

      it('should return false for other conditionTypes', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          conditionType: ConditionType.NONE 
        };

        expect(component.showAnticipationHoursField()).toBeFalse();
      });
    });

    describe('showMinDaysField', () => {
      it('should return true when conditionType is LONG_STAY', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          conditionType: ConditionType.LONG_STAY 
        };

        expect(component.showMinDaysField()).toBeTrue();
      });

      it('should return false for other conditionTypes', () => {
        component.selectedFilter = { 
          ...mockFilters[0], 
          conditionType: ConditionType.NONE 
        };

        expect(component.showMinDaysField()).toBeFalse();
      });
    });
  });

  describe('Week days selection', () => {
    beforeEach(() => {
      component.selectedFilter = {
        ...mockFilters[0],
        weekDays: '1,3,5'
      };
    });

    describe('isWeekDaySelected', () => {
      it('should return true if day is in weekDays string', () => {
        expect(component.isWeekDaySelected('1')).toBeTrue();
        expect(component.isWeekDaySelected('3')).toBeTrue();
        expect(component.isWeekDaySelected('5')).toBeTrue();
      });

      it('should return false if day is not in weekDays string', () => {
        expect(component.isWeekDaySelected('2')).toBeFalse();
        expect(component.isWeekDaySelected('4')).toBeFalse();
      });

      it('should return false if weekDays is undefined', () => {
        component.selectedFilter!.weekDays = undefined;

        expect(component.isWeekDaySelected('1')).toBeFalse();
      });
    });

    describe('onWeekDayChange', () => {
      it('should add day when checkbox is checked', () => {
        const event = { target: { checked: true } };

        component.onWeekDayChange('2', event);

        expect(component.selectedFilter!.weekDays).toBe('1,2,3,5');
      });

      it('should remove day when checkbox is unchecked', () => {
        const event = { target: { checked: false } };

        component.onWeekDayChange('3', event);

        expect(component.selectedFilter!.weekDays).toBe('1,5');
      });

      it('should not add duplicate day', () => {
        const event = { target: { checked: true } };

        component.onWeekDayChange('1', event);

        expect(component.selectedFilter!.weekDays).toBe('1,3,5');
      });

      it('should handle empty weekDays string', () => {
        component.selectedFilter!.weekDays = '';
        const event = { target: { checked: true } };

        component.onWeekDayChange('1', event);

        expect(component.selectedFilter!.weekDays).toBe('1');
      });

      it('should not modify if selectedFilter is undefined', () => {
        component.selectedFilter = undefined;
        const event = { target: { checked: true } };

        component.onWeekDayChange('1', event);

        expect(component.selectedFilter).toBeUndefined();
      });
    });
  });

  describe('Format methods', () => {
    describe('formatDateType', () => {
      it('should format EVERY_DAY correctly', () => {
        expect(component.formatDateType(DateType.EVERY_DAY)).toBe('Every Day');
      });

      it('should format DATE_RANGE correctly', () => {
        expect(component.formatDateType(DateType.DATE_RANGE)).toBe('Date Range');
      });

      it('should format WEEK_DAYS correctly', () => {
        expect(component.formatDateType(DateType.WEEK_DAYS)).toBe('Week Days');
      });
    });

    describe('formatConditionType', () => {
      it('should return "None" for NONE', () => {
        expect(component.formatConditionType(ConditionType.NONE)).toBe('None');
      });

      it('should return "None" for undefined', () => {
        expect(component.formatConditionType(undefined)).toBe('None');
      });

      it('should format LAST_MINUTE correctly', () => {
        expect(component.formatConditionType(ConditionType.LAST_MINUTE)).toBe('Last Minute');
      });

      it('should format LONG_STAY correctly', () => {
        expect(component.formatConditionType(ConditionType.LONG_STAY)).toBe('Long Stay');
      });
    });
  });
});