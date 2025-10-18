import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTabComponent } from './dashboard-tab.component';

describe('DashboardTabComponentComponent', () => {
  let component: DashboardTabComponent;
  let fixture: ComponentFixture<DashboardTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
