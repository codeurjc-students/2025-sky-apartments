import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FooterComponent,
        BrowserAnimationsModule
      ],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should set currentYear to current year', () => {
      const expectedYear = new Date().getFullYear();
      expect(component.currentYear).toBe(expectedYear);
    });

    it('should initialize quickLinks array', () => {
      expect(component.quickLinks).toBeDefined();
      expect(Array.isArray(component.quickLinks)).toBe(true);
    });

    it('should initialize legalLinks array', () => {
      expect(component.legalLinks).toBeDefined();
      expect(Array.isArray(component.legalLinks)).toBe(true);
    });
  });

  describe('quickLinks', () => {
    it('should have 4 quick links', () => {
      expect(component.quickLinks.length).toBe(4);
    });

    it('should have Hero link', () => {
      const heroLink = component.quickLinks.find(link => link.label === 'Hero');
      expect(heroLink).toBeDefined();
      expect(heroLink?.route).toBe('/home');
      expect(heroLink?.fragment).toBe('hero');
    });

    it('should have Featured link', () => {
      const featuredLink = component.quickLinks.find(link => link.label === 'Featured');
      expect(featuredLink).toBeDefined();
      expect(featuredLink?.route).toBe('/home');
      expect(featuredLink?.fragment).toBe('featured');
    });

    it('should have About link', () => {
      const aboutLink = component.quickLinks.find(link => link.label === 'About');
      expect(aboutLink).toBeDefined();
      expect(aboutLink?.route).toBe('/home');
      expect(aboutLink?.fragment).toBe('about');
    });

    it('should have Contact link', () => {
      const contactLink = component.quickLinks.find(link => link.label === 'Contact');
      expect(contactLink).toBeDefined();
      expect(contactLink?.route).toBe('/home');
      expect(contactLink?.fragment).toBe('contact');
    });

    it('should have all links with route property', () => {
      const allHaveRoute = component.quickLinks.every(link => link.route !== undefined);
      expect(allHaveRoute).toBe(true);
    });

    it('should have all links with fragment property', () => {
      const allHaveFragment = component.quickLinks.every(link => link.fragment !== undefined);
      expect(allHaveFragment).toBe(true);
    });

    it('should have all links with label property', () => {
      const allHaveLabel = component.quickLinks.every(link => link.label !== undefined);
      expect(allHaveLabel).toBe(true);
    });
  });

  describe('legalLinks', () => {
    it('should have 4 legal links', () => {
      expect(component.legalLinks.length).toBe(4);
    });

    it('should have Privacy Policy link', () => {
      const privacyLink = component.legalLinks.find(link => link.label === 'Privacy Policy');
      expect(privacyLink).toBeDefined();
      expect(privacyLink?.href).toBe('privacy.html');
    });

    it('should have Terms & Conditions link', () => {
      const termsLink = component.legalLinks.find(link => link.label === 'Terms & Conditions');
      expect(termsLink).toBeDefined();
      expect(termsLink?.href).toBe('terms.html');
    });

    it('should have Cookie Policy link', () => {
      const cookieLink = component.legalLinks.find(link => link.label === 'Cookie Policy');
      expect(cookieLink).toBeDefined();
      expect(cookieLink?.href).toBe('cookies.html');
    });

    it('should have GDPR Compliance link', () => {
      const gdprLink = component.legalLinks.find(link => link.label === 'GDPR Compliance');
      expect(gdprLink).toBeDefined();
      expect(gdprLink?.href).toBe('gdpr.html');
    });

    it('should have all links with href property', () => {
      const allHaveHref = component.legalLinks.every(link => link.href !== undefined);
      expect(allHaveHref).toBe(true);
    });

    it('should have all links with label property', () => {
      const allHaveLabel = component.legalLinks.every(link => link.label !== undefined);
      expect(allHaveLabel).toBe(true);
    });

    it('should have all href ending with .html', () => {
      const allHaveHtmlExtension = component.legalLinks.every(link => link.href.endsWith('.html'));
      expect(allHaveHtmlExtension).toBe(true);
    });
  });

  describe('scrollToTop', () => {
   
    it('should scroll to top position (0)', () => {
      spyOn(window, 'scrollTo');
      component.scrollToTop();
      const callArgs = (window.scrollTo as jasmine.Spy).calls.mostRecent().args[0];
      expect(callArgs.top).toBe(0);
    });

    it('should use smooth scrolling behavior', () => {
      spyOn(window, 'scrollTo');
      component.scrollToTop();
      const callArgs = (window.scrollTo as jasmine.Spy).calls.mostRecent().args[0];
      expect(callArgs.behavior).toBe('smooth');
    });
  });

  describe('Template Rendering', () => {
    it('should display current year in copyright', () => {
      const compiled = fixture.nativeElement;
      const copyright = compiled.querySelector('.copyright');
      expect(copyright.textContent).toContain(component.currentYear.toString());
    });

    it('should display Sky Apartments text', () => {
      const compiled = fixture.nativeElement;
      const footerLogo = compiled.querySelector('.footer-logo h3');
      expect(footerLogo.textContent).toContain('Sky Apartments');
    });

    it('should render all quick links', () => {
      const compiled = fixture.nativeElement;
      const quickLinkSection = compiled.querySelectorAll('.footer-section')[1];
      const links = quickLinkSection.querySelectorAll('li');
      expect(links.length).toBe(component.quickLinks.length);
    });

    it('should render all legal links', () => {
      const compiled = fixture.nativeElement;
      const legalLinkSection = compiled.querySelectorAll('.footer-section')[2];
      const links = legalLinkSection.querySelectorAll('li');
      expect(links.length).toBe(component.legalLinks.length);
    });

    it('should display company description', () => {
      const compiled = fixture.nativeElement;
      const description = compiled.querySelector('.footer-description');
      expect(description).toBeTruthy();
      expect(description.textContent).toContain('Premium accommodations');
    });

    it('should display contact address', () => {
      const compiled = fixture.nativeElement;
      const contactInfo = compiled.querySelector('.contact-info');
      expect(contactInfo.textContent).toContain('Gran Vía 67');
      expect(contactInfo.textContent).toContain('28013 Madrid, Spain');
    });

    it('should display contact phone', () => {
      const compiled = fixture.nativeElement;
      const contactInfo = compiled.querySelector('.contact-info');
      expect(contactInfo.textContent).toContain('+34 912 345 678');
    });

    it('should display contact email', () => {
      const compiled = fixture.nativeElement;
      const contactInfo = compiled.querySelector('.contact-info');
      expect(contactInfo.textContent).toContain('info@skyapartments.com');
    });

    it('should display business hours', () => {
      const compiled = fixture.nativeElement;
      const contactInfo = compiled.querySelector('.contact-info');
      expect(contactInfo.textContent).toContain('Mon - Fri: 9:00 - 20:00');
      expect(contactInfo.textContent).toContain('Sat - Sun: 10:00 - 18:00');
    });

    it('should have scroll to top button', () => {
      const compiled = fixture.nativeElement;
      const scrollButton = compiled.querySelector('.scroll-top');
      expect(scrollButton).toBeTruthy();
    });

    it('should call scrollToTop when scroll button is clicked', () => {
      spyOn(component, 'scrollToTop');
      const compiled = fixture.nativeElement;
      const scrollButton = compiled.querySelector('.scroll-top');
      scrollButton.click();
      expect(component.scrollToTop).toHaveBeenCalled();
    });

    it('should have footer bottom section', () => {
      const compiled = fixture.nativeElement;
      const footerBottom = compiled.querySelector('.footer-bottom');
      expect(footerBottom).toBeTruthy();
    });

    it('should display privacy link in bottom bar', () => {
      const compiled = fixture.nativeElement;
      const bottomLinks = compiled.querySelector('.bottom-links');
      expect(bottomLinks.textContent).toContain('Privacy');
    });

    it('should display terms link in bottom bar', () => {
      const compiled = fixture.nativeElement;
      const bottomLinks = compiled.querySelector('.bottom-links');
      expect(bottomLinks.textContent).toContain('Terms');
    });

    it('should display GDPR link in bottom bar', () => {
      const compiled = fixture.nativeElement;
      const bottomLinks = compiled.querySelector('.bottom-links');
      expect(bottomLinks.textContent).toContain('GDPR');
    });

    it('should have separators between bottom links', () => {
      const compiled = fixture.nativeElement;
      const separators = compiled.querySelectorAll('.separator');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Link Attributes', () => {
    it('should have target="_blank" on legal links', () => {
      const compiled = fixture.nativeElement;
      const legalLinkSection = compiled.querySelectorAll('.footer-section')[2];
      const links = legalLinkSection.querySelectorAll('a');
      links.forEach((link: HTMLAnchorElement) => {
        expect(link.getAttribute('target')).toBe('_blank');
      });
    });

    it('should have rel="noopener" on legal links', () => {
      const compiled = fixture.nativeElement;
      const legalLinkSection = compiled.querySelectorAll('.footer-section')[2];
      const links = legalLinkSection.querySelectorAll('a');
      links.forEach((link: HTMLAnchorElement) => {
        expect(link.getAttribute('rel')).toBe('noopener');
      });
    });

    it('should have target="_blank" on bottom bar links', () => {
      const compiled = fixture.nativeElement;
      const bottomLinks = compiled.querySelectorAll('.bottom-links a');
      bottomLinks.forEach((link: HTMLAnchorElement) => {
        expect(link.getAttribute('target')).toBe('_blank');
      });
    });

    it('should have rel="noopener" on bottom bar links', () => {
      const compiled = fixture.nativeElement;
      const bottomLinks = compiled.querySelectorAll('.bottom-links a');
      bottomLinks.forEach((link: HTMLAnchorElement) => {
        expect(link.getAttribute('rel')).toBe('noopener');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on scroll to top button', () => {
      const compiled = fixture.nativeElement;
      const scrollButton = compiled.querySelector('.scroll-top');
      expect(scrollButton.getAttribute('aria-label')).toBe('Scroll to top');
    });
  });

  describe('Icons', () => {
    it('should display apartment icon in logo', () => {
      const compiled = fixture.nativeElement;
      const logoIcon = compiled.querySelector('.footer-logo mat-icon');
      expect(logoIcon.textContent).toContain('apartment');
    });

    it('should display location icon in contact info', () => {
      const compiled = fixture.nativeElement;
      const icons = compiled.querySelectorAll('.contact-item mat-icon');
      const locationIcon = Array.from(icons).find((icon: any) => icon.textContent.includes('location_on'));
      expect(locationIcon).toBeTruthy();
    });

    it('should display phone icon in contact info', () => {
      const compiled = fixture.nativeElement;
      const icons = compiled.querySelectorAll('.contact-item mat-icon');
      const phoneIcon = Array.from(icons).find((icon: any) => icon.textContent.includes('phone'));
      expect(phoneIcon).toBeTruthy();
    });

    it('should display email icon in contact info', () => {
      const compiled = fixture.nativeElement;
      const icons = compiled.querySelectorAll('.contact-item mat-icon');
      const emailIcon = Array.from(icons).find((icon: any) => icon.textContent.includes('email'));
      expect(emailIcon).toBeTruthy();
    });

    it('should display schedule icon in contact info', () => {
      const compiled = fixture.nativeElement;
      const icons = compiled.querySelectorAll('.contact-item mat-icon');
      const scheduleIcon = Array.from(icons).find((icon: any) => icon.textContent.includes('schedule'));
      expect(scheduleIcon).toBeTruthy();
    });

    it('should display up arrow icon in scroll button', () => {
      const compiled = fixture.nativeElement;
      const scrollIcon = compiled.querySelector('.scroll-top mat-icon');
      expect(scrollIcon.textContent).toContain('keyboard_arrow_up');
    });

    it('should display chevron icons in quick links', () => {
      const compiled = fixture.nativeElement;
      const quickLinkSection = compiled.querySelectorAll('.footer-section')[1];
      const chevrons = quickLinkSection.querySelectorAll('mat-icon');
      expect(chevrons.length).toBe(component.quickLinks.length);
    });

    it('should display chevron icons in legal links', () => {
      const compiled = fixture.nativeElement;
      const legalLinkSection = compiled.querySelectorAll('.footer-section')[2];
      const chevrons = legalLinkSection.querySelectorAll('mat-icon');
      expect(chevrons.length).toBe(component.legalLinks.length);
    });
  });
});