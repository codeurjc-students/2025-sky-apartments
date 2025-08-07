import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApartmentDetailComponent } from './apartment-detail.component';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApartmentService } from '../../services/apartment.service';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { By } from '@angular/platform-browser';

describe('ApartmentDetailComponent', () => {
  let component: ApartmentDetailComponent;
  let fixture: ComponentFixture<ApartmentDetailComponent>;
  let mockApartmentService: jasmine.SpyObj<ApartmentService>;

  const mockApartment: ApartmentDTO = {
    id: 1,
    name: 'Test Apartment',
    description: 'A nice place',
    address: '123 Fake Street'
  };

  beforeEach(async () => {
    // Create a mock of the ApartmentService
    mockApartmentService = jasmine.createSpyObj('ApartmentService', ['getApartmentById']);

    await TestBed.configureTestingModule({
      imports: [ApartmentDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: 1 }
            }
          }
        },
        {
          provide: ApartmentService,
          useValue: mockApartmentService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApartmentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should display apartment data if found', () => {
    mockApartmentService.getApartmentById.and.returnValue(of(mockApartment));

    fixture.detectChanges(); // Triggers ngOnInit and template rendering

    const nameEl = fixture.debugElement.query(By.css('#apartment-name')).nativeElement;
    const descriptionEl = fixture.debugElement.query(By.css('#apartment-description')).nativeElement;
    const addressEl = fixture.debugElement.query(By.css('#apartment-address')).nativeElement;

    expect(nameEl.textContent).toContain(mockApartment.name);
    expect(descriptionEl.textContent).toContain(mockApartment.description);
    expect(addressEl.textContent).toContain(mockApartment.address);
  });

  it('should display "not found" message if apartment is not available', () => {
    mockApartmentService.getApartmentById.and.returnValue(throwError(() => new Error('Not found')));

    fixture.detectChanges(); // Triggers ngOnInit

    const notFoundEl = fixture.debugElement.query(By.css('#apartment-not-found')).nativeElement;
    expect(notFoundEl).toBeTruthy();
    expect(notFoundEl.textContent).toContain('No se encontró el apartamento.');
  });
});
