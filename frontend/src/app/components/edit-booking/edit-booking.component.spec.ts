import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBooking } from './edit-booking.component';

describe('EditBookingComponent', () => {
  let component: EditBooking;
  let fixture: ComponentFixture<EditBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBooking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
