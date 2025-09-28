import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApartmentsComponent } from './apartments.component';
import { ApartmentService } from '../../services/apartment//apartment.service';
import { of, throwError } from 'rxjs';
import { ApartmentDTO } from '../../dtos/apartment.dto';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('ApartmentsComponent', () => {
  let component: ApartmentsComponent;
  let fixture: ComponentFixture<ApartmentsComponent>;
  let mockApartmentService: jasmine.SpyObj<ApartmentService>;

  const mockApartments: ApartmentDTO[] = [
    {
      id: 1,
      name: "City Center Loft",
      description: "Modern apartment in the heart of the city",
      price: 120,
      services: new Set(["WiFi", "Air Conditioning", "Kitchen"]),
      capacity: 2,
      imageUrl: "https://example.com/images/loft.jpg"
    },
    {
      id: 2,
      name: "Beach House",
      description: "Relaxing house near the beach",
      price: 200,
      services: new Set(["WiFi", "Pool", "Parking"]),
      capacity: 6,
      imageUrl: "https://example.com/images/beach-house.jpg"
    }
  ];


  beforeEach(async () => {
    // Create a mock for ApartmentService
    mockApartmentService = jasmine.createSpyObj('ApartmentService', ['getApartments']);

    await TestBed.configureTestingModule({
      imports: [
        ApartmentsComponent,
        RouterTestingModule // so routerLink works in the template
      ],
      providers: [
        { provide: ApartmentService,
          useValue: mockApartmentService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApartmentsComponent);
    component = fixture.componentInstance;
  });

  it('should display a list of apartments when service returns data', () => {
    mockApartmentService.getApartments.and.returnValue(of(mockApartments));

    fixture.detectChanges(); // triggers ngOnInit

    const items = fixture.debugElement.queryAll(By.css('#apartment-item'));
    expect(items.length).toBe(2);

    const links = fixture.debugElement.queryAll(By.css('#apartment-link'));
    expect(links[0].nativeElement.textContent).toContain(mockApartments[0].name);
    expect(links[1].nativeElement.textContent).toContain(mockApartments[1].name);
  });

  it('should display "no apartments" message when service returns empty list', () => {
    mockApartmentService.getApartments.and.returnValue(of([]));

    fixture.detectChanges();

    const noMessage = fixture.debugElement.query(By.css('#no-apartments-message'));
    expect(noMessage).toBeTruthy();
    expect(noMessage.nativeElement.textContent).toContain('No hay apartamentos disponibles.');
  });

  it('should handle error from service gracefully', () => {
    spyOn(console, 'error'); // avoid logging in test output
    mockApartmentService.getApartments.and.returnValue(throwError(() => new Error('Server error')));

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalled();
    const noMessage = fixture.debugElement.query(By.css('#no-apartments-message'));
    expect(noMessage).toBeTruthy();
  });
});
