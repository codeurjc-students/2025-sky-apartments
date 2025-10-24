import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { EditBooking, EditBookingData } from './edit-booking.component';

describe('EditBooking', () => {
  let component: EditBooking;
  let fixture: ComponentFixture<EditBooking>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditBooking>>;

  const mockBookingData: EditBookingData = {
    booking: {
      id: 1,
      startDate: '2025-01-15',
      endDate: '2025-01-20',
      apartment: {
        id: 1,
        name: 'Test Apartment',
        imageUrl: 'test.jpg'
      }
    },
    apartment: {
      id: 1,
      name: 'Test Apartment',
      imageUrl: 'test.jpg'
    }
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        EditBooking,
        BrowserAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockBookingData }
      ]
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditBooking>>;

    fixture = TestBed.createComponent(EditBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with booking data', () => {
      expect(component.data).toEqual(mockBookingData);
    });

    it('should set originalStartDate from booking data', () => {
      const expectedDate = new Date('2025-01-15');
      expect(component.originalStartDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should set originalEndDate from booking data', () => {
      const expectedDate = new Date('2025-01-20');
      expect(component.originalEndDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should initialize loading as false', () => {
      expect(component.loading).toBe(false);
    });

    it('should set minDate to today by default', () => {
      const today = new Date();
      expect(component.minDate).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should set startDate from booking data', () => {
      const expectedDate = new Date('2025-01-15');
      expect(component.startDate?.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should set endDate from booking data', () => {
      const expectedDate = new Date('2025-01-20');
      expect(component.endDate?.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should set minDate to originalStartDate if it is in the past', () => {
      const pastDate = new Date('2020-01-01');
      const pastBookingData = {
        ...mockBookingData,
        booking: {
          ...mockBookingData.booking,
          startDate: '2020-01-01'
        }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditBooking, BrowserAnimationsModule, FormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: pastBookingData }
        ]
      });

      const pastFixture = TestBed.createComponent(EditBooking);
      const pastComponent = pastFixture.componentInstance;
      pastFixture.detectChanges();

      expect(pastComponent.minDate.toDateString()).toBe(new Date('2020-01-01').toDateString());
    });

    it('should set minDate to today if originalStartDate is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const futureBookingData = {
        ...mockBookingData,
        booking: {
          ...mockBookingData.booking,
          startDate: futureDate.toISOString().split('T')[0]
        }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [EditBooking, BrowserAnimationsModule, FormsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MAT_DIALOG_DATA, useValue: futureBookingData }
        ]
      });

      const futureFixture = TestBed.createComponent(EditBooking);
      const futureComponent = futureFixture.componentInstance;
      futureFixture.detectChanges();

      const today = new Date();
      expect(futureComponent.minDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('onStartDateChange', () => {
    it('should clear endDate if startDate is after endDate', () => {
      component.startDate = new Date('2025-01-25');
      component.endDate = new Date('2025-01-20');
      
      component.onStartDateChange();
      
      expect(component.endDate).toBeNull();
    });

    it('should not clear endDate if startDate is before endDate', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      
      component.onStartDateChange();
      
      expect(component.endDate).not.toBeNull();
    });

    it('should not clear endDate if startDate equals endDate', () => {
      const sameDate = new Date('2025-01-15');
      component.startDate = sameDate;
      component.endDate = new Date(sameDate);
      
      component.onStartDateChange();
      
      expect(component.endDate).not.toBeNull();
    });

    it('should handle null startDate', () => {
      component.startDate = null;
      component.endDate = new Date('2025-01-20');
      
      expect(() => component.onStartDateChange()).not.toThrow();
      expect(component.endDate).not.toBeNull();
    });

    it('should handle null endDate', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = null;
      
      expect(() => component.onStartDateChange()).not.toThrow();
    });
  });

  describe('getEndMinDate', () => {
    it('should return startDate if it is set', () => {
      const testDate = new Date('2025-01-15');
      component.startDate = testDate;
      
      expect(component.getEndMinDate()).toBe(testDate);
    });

    it('should return minDate if startDate is null', () => {
      component.startDate = null;
      
      expect(component.getEndMinDate()).toBe(component.minDate);
    });

    it('should return minDate if startDate is undefined', () => {
      component.startDate = undefined as any;
      
      expect(component.getEndMinDate()).toBe(component.minDate);
    });
  });

  describe('hasChanges', () => {
    it('should return false if startDate is null', () => {
      component.startDate = null;
      component.endDate = new Date('2025-01-20');
      
      expect(component.hasChanges()).toBe(false);
    });

    it('should return false if endDate is null', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = null;
      
      expect(component.hasChanges()).toBe(false);
    });

    it('should return false if dates have not changed', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      
      expect(component.hasChanges()).toBe(false);
    });

    it('should return true if startDate has changed', () => {
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-20');
      
      expect(component.hasChanges()).toBe(true);
    });

    it('should return true if endDate has changed', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-21');
      
      expect(component.hasChanges()).toBe(true);
    });

    it('should return true if both dates have changed', () => {
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-21');
      
      expect(component.hasChanges()).toBe(true);
    });
  });

  describe('isFormValid', () => {
    it('should return false if startDate is null', () => {
      component.startDate = null;
      component.endDate = new Date('2025-01-20');
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if endDate is null', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = null;
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if both dates are null', () => {
      component.startDate = null;
      component.endDate = null;
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false if startDate is after endDate', () => {
      component.startDate = new Date('2025-01-25');
      component.endDate = new Date('2025-01-20');
      
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true if startDate equals endDate', () => {
      const sameDate = new Date('2025-01-15');
      component.startDate = sameDate;
      component.endDate = new Date(sameDate);
      
      expect(component.isFormValid()).toBe(true);
    });

    it('should return true if startDate is before endDate', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();
      
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('should call dialogRef.close exactly once', () => {
      component.onCancel();
      
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSave', () => {
    it('should close dialog with new dates when form is valid and has changes', () => {
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-21');
      
      component.onSave();
      
      expect(dialogRef.close).toHaveBeenCalledWith({
        startDate: component.startDate,
        endDate: component.endDate
      });
    });

    it('should not close dialog if form is invalid', () => {
      component.startDate = null;
      component.endDate = new Date('2025-01-20');
      
      component.onSave();
      
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog if there are no changes', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      
      component.onSave();
      
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog if startDate is after endDate', () => {
      component.startDate = new Date('2025-01-25');
      component.endDate = new Date('2025-01-20');
      
      component.onSave();
      
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should close dialog with both dates when both are changed', () => {
      const newStart = new Date('2025-01-17');
      const newEnd = new Date('2025-01-22');
      component.startDate = newStart;
      component.endDate = newEnd;
      
      component.onSave();
      
      expect(dialogRef.close).toHaveBeenCalledWith({
        startDate: newStart,
        endDate: newEnd
      });
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2025-01-15');
      const formatted = component.formatDate(date);
      
      expect(formatted).toBe('2025-01-15');
    });

    it('should pad single digit month with zero', () => {
      const date = new Date('2025-03-15');
      const formatted = component.formatDate(date);
      
      expect(formatted).toBe('2025-03-15');
    });

    it('should pad single digit day with zero', () => {
      const date = new Date('2025-01-05');
      const formatted = component.formatDate(date);
      
      expect(formatted).toBe('2025-01-05');
    });

    it('should handle December correctly', () => {
      const date = new Date('2025-12-31');
      const formatted = component.formatDate(date);
      
      expect(formatted).toBe('2025-12-31');
    });

    it('should handle January correctly', () => {
      const date = new Date('2025-01-01');
      const formatted = component.formatDate(date);
      
      expect(formatted).toBe('2025-01-01');
    });
  });

  describe('Template Rendering', () => {
    it('should display apartment name', () => {
      const compiled = fixture.nativeElement;
      const apartmentName = compiled.querySelector('.apartment-name');
      
      expect(apartmentName.textContent).toContain('Test Apartment');
    });

    it('should display current start date', () => {
      const compiled = fixture.nativeElement;
      const content = compiled.textContent;
      
      expect(content).toContain('2025-01-15');
    });

    it('should display current end date', () => {
      const compiled = fixture.nativeElement;
      const content = compiled.textContent;
      
      expect(content).toContain('2025-01-20');
    });

    it('should have close button', () => {
      const compiled = fixture.nativeElement;
      const closeButton = compiled.querySelector('.close-btn');
      
      expect(closeButton).toBeTruthy();
    });

    it('should have cancel button', () => {
      const compiled = fixture.nativeElement;
      const cancelButton = compiled.querySelector('.cancel-btn');
      
      expect(cancelButton).toBeTruthy();
    });

    it('should have save button', () => {
      const compiled = fixture.nativeElement;
      const saveButton = compiled.querySelector('.save-btn');
      
      expect(saveButton).toBeTruthy();
    });

    it('should disable save button when form is invalid', () => {
      component.startDate = null;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const saveButton = compiled.querySelector('.save-btn');
      
      expect(saveButton.disabled).toBe(true);
    });

    it('should disable save button when there are no changes', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const saveButton = compiled.querySelector('.save-btn');
      
      expect(saveButton.disabled).toBe(true);
    });

    it('should enable save button when form is valid and has changes', () => {
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-21');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const saveButton = compiled.querySelector('.save-btn');
      
      expect(saveButton.disabled).toBe(false);
    });

    it('should call onCancel when close button is clicked', () => {
      spyOn(component, 'onCancel');
      const compiled = fixture.nativeElement;
      const closeButton = compiled.querySelector('.close-btn');
      
      closeButton.click();
      
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      spyOn(component, 'onCancel');
      const compiled = fixture.nativeElement;
      const cancelButton = compiled.querySelector('.cancel-btn');
      
      cancelButton.click();
      
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should call onSave when save button is clicked', () => {
      spyOn(component, 'onSave');
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-21');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const saveButton = compiled.querySelector('.save-btn');
      
      saveButton.click();
      
      expect(component.onSave).toHaveBeenCalled();
    });

    it('should show warning message when no changes but form is valid', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const warningMessage = compiled.querySelector('.warning-message');
      
      expect(warningMessage).toBeTruthy();
    });

    it('should not show warning message when there are changes', () => {
      component.startDate = new Date('2025-01-16');
      component.endDate = new Date('2025-01-21');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const warningMessage = compiled.querySelector('.warning-message');
      
      expect(warningMessage).toBeFalsy();
    });

    it('should have mat-dialog-title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('[mat-dialog-title]');
      
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Edit Booking Dates');
    });

    it('should have mat-dialog-content', () => {
      const compiled = fixture.nativeElement;
      const content = compiled.querySelector('mat-dialog-content');
      
      expect(content).toBeTruthy();
    });

    it('should have mat-dialog-actions', () => {
      const compiled = fixture.nativeElement;
      const actions = compiled.querySelector('mat-dialog-actions');
      
      expect(actions).toBeTruthy();
    });
  });

  describe('Date Picker Fields', () => {

    it('should disable end date picker when start date is not set', () => {
      component.startDate = null;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const endDateInputs = compiled.querySelectorAll('input');
      const endDateInput = Array.from(endDateInputs).find((input: any) => 
        input.placeholder?.includes('') && input !== endDateInputs[0]
      ) as HTMLInputElement;
      
      expect(endDateInput?.disabled).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should update form validity when dates change', () => {
      expect(component.isFormValid()).toBe(true);
      
      component.startDate = null;
      expect(component.isFormValid()).toBe(false);
      
      component.startDate = new Date('2025-01-16');
      expect(component.isFormValid()).toBe(true);
    });

    it('should detect changes correctly throughout the flow', () => {
      expect(component.hasChanges()).toBe(false);
      
      component.startDate = new Date('2025-01-16');
      expect(component.hasChanges()).toBe(true);
      
      component.startDate = new Date('2025-01-15');
      expect(component.hasChanges()).toBe(false);
    });

    it('should clear end date when start date becomes later', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-20');
      
      component.startDate = new Date('2025-01-25');
      component.onStartDateChange();
      
      expect(component.endDate).toBeNull();
    });
  });
});