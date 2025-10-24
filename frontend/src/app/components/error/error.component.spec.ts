import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;
  let router: Router;
  let queryParamsSubject: Subject<any>;

  beforeEach(async () => {
    queryParamsSubject = new Subject();
    
    const activatedRouteStub = {
      queryParams: queryParamsSubject.asObservable()
    }

    await TestBed.configureTestingModule({
      imports: [
        ErrorComponent,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default error message', () => {
      expect(component.errorMessage).toBe('Something went wrong');
    });

    it('should initialize with default error code 500', () => {
      expect(component.errorCode).toBe(500);
    });

    it('should initialize with default error description', () => {
      expect(component.errorDescription).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('ngOnInit', () => {

    it('should not update message if not provided in params', () => {
      const initialMessage = component.errorMessage;
      fixture.detectChanges();
      
      queryParamsSubject.next({ code: '404' });
      
      expect(component.errorMessage).toBe(initialMessage);
    });

    it('should not update code if not provided in params', () => {
      const initialCode = component.errorCode;
      fixture.detectChanges();
      
      queryParamsSubject.next({ message: 'Test' });
      
      expect(component.errorCode).toBe(initialCode);
    });

    it('should handle empty query params', () => {
      const initialMessage = component.errorMessage;
      const initialCode = component.errorCode;
      fixture.detectChanges();
      
      queryParamsSubject.next({});
      
      expect(component.errorMessage).toBe(initialMessage);
      expect(component.errorCode).toBe(initialCode);
    });
  });

  describe('setErrorDescription', () => {
    it('should set description for 404 error', () => {
      component.setErrorDescription(404);
      expect(component.errorDescription).toBe('The page or resource you are looking for could not be found.');
    });

    it('should set description for 403 error', () => {
      component.setErrorDescription(403);
      expect(component.errorDescription).toBe('You do not have permission to access this resource.');
    });

    it('should set description for 500 error', () => {
      component.setErrorDescription(500);
      expect(component.errorDescription).toBe('An internal server error occurred. Please try again later.');
    });

    it('should set description for 503 error', () => {
      component.setErrorDescription(503);
      expect(component.errorDescription).toBe('The service is temporarily unavailable. Please try again later.');
    });

    it('should set description for 401 error', () => {
      component.setErrorDescription(401);
      expect(component.errorDescription).toBe('You are not authorized to view this page. Please log in.');
    });

    it('should set default description for unknown error code', () => {
      component.setErrorDescription(999);
      expect(component.errorDescription).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should set default description for 400 error', () => {
      component.setErrorDescription(400);
      expect(component.errorDescription).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should set default description for 0 error code', () => {
      component.setErrorDescription(0);
      expect(component.errorDescription).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should handle negative error codes', () => {
      component.setErrorDescription(-1);
      expect(component.errorDescription).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('goHome', () => {
    it('should navigate to home route', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.goHome();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should call router.navigate exactly once', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.goHome();
      expect(navigateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('goBack', () => {
    it('should call window.history.back', () => {
      spyOn(window.history, 'back');
      component.goBack();
      expect(window.history.back).toHaveBeenCalled();
    });

    it('should call window.history.back exactly once', () => {
      spyOn(window.history, 'back');
      component.goBack();
      expect(window.history.back).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display error code', () => {
      component.errorCode = 404;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const errorCode = compiled.querySelector('.error-code');
      expect(errorCode.textContent).toContain('404');
    });

    it('should display error message', () => {
      component.errorMessage = 'Page not found';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const errorTitle = compiled.querySelector('.error-title');
      expect(errorTitle.textContent).toContain('Page not found');
    });

    it('should display error description', () => {
      component.errorDescription = 'Test description';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const errorDesc = compiled.querySelector('.error-description');
      expect(errorDesc.textContent).toContain('Test description');
    });

    it('should have error icon', () => {
      const compiled = fixture.nativeElement;
      const errorIcon = compiled.querySelector('.error-icon mat-icon');
      expect(errorIcon).toBeTruthy();
      expect(errorIcon.textContent).toContain('error_outline');
    });

    it('should have go home button', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const homeButton = Array.from(buttons).find((btn: any) => 
        btn.textContent.includes('Go to Home')
      );
      expect(homeButton).toBeTruthy();
    });

    it('should have go back button', () => {
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const backButton = Array.from(buttons).find((btn: any) => 
        btn.textContent.includes('Go Back')
      );
      expect(backButton).toBeTruthy();
    });

    it('should call goHome when home button is clicked', () => {
      spyOn(component, 'goHome');
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const homeButton = Array.from(buttons).find((btn: any) => 
        btn.textContent.includes('Go to Home')
      ) as HTMLButtonElement;
      
      homeButton.click();
      expect(component.goHome).toHaveBeenCalled();
    });

    it('should call goBack when back button is clicked', () => {
      spyOn(component, 'goBack');
      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const backButton = Array.from(buttons).find((btn: any) => 
        btn.textContent.includes('Go Back')
      ) as HTMLButtonElement;
      
      backButton.click();
      expect(component.goBack).toHaveBeenCalled();
    });

    it('should have mat-card', () => {
      const compiled = fixture.nativeElement;
      const card = compiled.querySelector('mat-card');
      expect(card).toBeTruthy();
    });

    it('should have error-container', () => {
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.error-container');
      expect(container).toBeTruthy();
    });

    it('should have error-actions section', () => {
      const compiled = fixture.nativeElement;
      const actions = compiled.querySelector('.error-actions');
      expect(actions).toBeTruthy();
    });

  });

});