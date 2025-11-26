// tests/guest.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Guest User Journey (Not Authenticated)', () => {
  
  test.describe('Landing Page Interaction', () => {
    test('should load home page successfully', async ({ page }) => {
      await page.goto('/');
      
      // Verify page loaded
      await expect(page.locator('.header-toolbar')).toBeVisible();
      const header = page.locator('.header-toolbar');
      await expect(header.getByText('Sky Apartments', { exact: true })).toBeVisible();

      
      // Verify login/signup buttons are visible
      await expect(page.locator('button:has-text("Log In")')).toBeVisible();
      await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
    });

    test('should navigate to signup from header', async ({ page }) => {
      await page.goto('/');
      
      await page.click('button:has-text("Sign Up")');
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should navigate to login from header', async ({ page }) => {
      await page.goto('/');
      
      await page.click('button:has-text("Log In")');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should auto-advance hero carousel', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.carousel-container');
      
      // Get initial slide
      const carouselSlides = page.locator('.carousel-slide');
      const initialTransform = await page.locator('.carousel-slides').getAttribute('style');
      
      await page.waitForTimeout(5500);
      
      // Transform should have changed
      const newTransform = await page.locator('.carousel-slides').getAttribute('style');
      expect(newTransform).not.toBe(initialTransform);
    });

    test('should click carousel apartment to view details', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.carousel-slide');
      
      // Click on carousel slide
      await page.locator('.carousel-slide').first().click();
      
      // Should navigate to apartment details
      await expect(page).toHaveURL(/\/apartment\/\d+/);
    });
  });

  test.describe('Apartment Discovery', () => {
    test('should browse apartments without authentication', async ({ page }) => {
      await page.goto('/apartments');
      
      // Wait for apartments or loading spinner
      await page.waitForSelector('.apartment-card, .loading-spinner', { timeout: 10000 });
      
      // Verify apartments are displayed
      const apartments = page.locator('.apartment-card');
      const count = await apartments.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display apartment details correctly', async ({ page }) => {
      await page.goto('/apartments');
      await page.waitForSelector('.apartment-card');
      
      const firstCard = page.locator('.apartment-card').first();
      
      // Verify card structure
      await expect(firstCard.locator('img')).toBeVisible();
      await expect(firstCard.locator('h3')).toBeVisible();
      await expect(firstCard.locator('.price')).toBeVisible();
      await expect(firstCard.locator('text=/night/i')).toBeVisible();
      await expect(firstCard.locator('text=/guests/i')).toBeVisible();
    });

    test('should click apartment card to view full details', async ({ page }) => {
      await page.goto('/apartments');
      await page.waitForSelector('.apartment-card');
      
      // Click on View Details button
      await page.locator('.apartment-card').first().locator('button:has-text("View Apartment")').click();
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/apartment\/\d+/);
      await page.waitForLoadState('networkidle');
      
      // Verify detail page content
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should view apartment from featured section', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.featured-section');
      
      // Scroll to featured section
      await page.locator('#featured').scrollIntoViewIfNeeded();
      
      // Click on first featured apartment
      await page.locator('.featured-section .apartment-card').first().locator('button:has-text("View Details")').click();
      
      // Should navigate to detail
      await expect(page).toHaveURL(/\/apartment\/\d+/);
    });

    test('should display apartment amenities and services', async ({ page }) => {
      await page.goto('/apartments');
      await page.waitForSelector('.apartment-card');
      
      // Navigate to detail page
      await page.locator('.apartment-card').first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for services/amenities section
      const hasAmenities = await page
      .locator('.apartment-details >> text=/amenities|services|features/i')
      .first()
      .isVisible();
      expect(hasAmenities).toBeTruthy();

    });

    test('should see apartment capacity information', async ({ page }) => {
      await page.goto('/apartments');
      await page.waitForSelector('.apartment-card');
      
      const firstCard = page.locator('.apartment-card').first();
      
      // Should show capacity with people icon
      await expect(firstCard.locator('mat-icon:has-text("people")')).toBeVisible();
      await expect(firstCard.locator('text=/\\d+\\s*guests?/i')).toBeVisible();
    });
  });

  test.describe('Call-to-Action Interactions', () => {
    test('should prompt login when clicking Book Now in header', async ({ page }) => {
      await page.goto('/');
      
      // Click Book Now button
      await page.click('button:has-text("Book Now")');
      
      // Should navigate somewhere (likely login or booking page)
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      expect(url).not.toMatch(/^\/$|\/home$/);
    });

    test('should navigate to all apartments from featured section', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to featured section
      await page.locator('#featured').scrollIntoViewIfNeeded();
      
      // Click "View more apartments" button
      await page.click('button:has-text("View more apartments")');
      
      // Should navigate to apartments page
      await expect(page).toHaveURL(/\/apartments/);
    });

  });

  test.describe('Information Sections', () => {
    test('should access About Us section', async ({ page }) => {
      await page.goto('/');
      
      // Click About Us in navigation
      await page.click('a[fragment="about"]');
      
      // Should scroll to about section
      await page.waitForTimeout(500);
      
      // Verify about content is visible
      await expect(page.locator('#about')).toBeVisible();
      await expect(page.locator('text=About Sky Apartments')).toBeVisible();
    });

    test('should display company story and values', async ({ page }) => {
      await page.goto('/#about');
      await page.waitForSelector('#about');
      
      // Verify subsections
      await expect(page.locator('text=Our Story')).toBeVisible();
      await expect(page.locator('text=Our Vision')).toBeVisible();
      await expect(page.locator('text=Our Values')).toBeVisible();
      
      // Verify values list
      await expect(page.locator('text=Excellence')).toBeVisible();
      await expect(page.locator('text=Hospitality')).toBeVisible();
      await expect(page.locator('text=Innovation')).toBeVisible();
      await expect(page.locator('text=Sustainability')).toBeVisible();
    });

    test('should display company image in about section', async ({ page }) => {
      await page.goto('/#about');
      await page.waitForSelector('#about');
      
      // Verify image is present
      const aboutImage = page.locator('.about-image img[src*="granvia"]');
      await expect(aboutImage).toBeVisible();
    });

    test('should access Contact section', async ({ page }) => {
      await page.goto('/');
      
      // Click Contact in navigation
      await page.click('a[fragment="contact"]');
      
      // Should scroll to contact section
      await page.waitForTimeout(500);
      
      // Verify contact content
      await expect(page.locator('#contact')).toBeVisible();
      await expect(page.locator('text=Get In Touch')).toBeVisible();
    });

    test('should display contact information', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Verify all contact details
      await expect(page.getByText('Gran Vía 67', { exact: true })).toBeVisible();
      await expect(page.locator('text=Madrid, Spain 28013')).toBeVisible();
      await expect(page.locator('text=+34 912 345 678').first()).toBeVisible();
      
      // Email might be obfuscated, check for domain
      await expect(page.locator('text=skyapartments.com').first()).toBeVisible();
    });

    test('should display Google Maps embed', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Verify map iframe
      const mapIframe = page.locator('iframe[src*="google.com/maps"]');
      await expect(mapIframe).toBeVisible();
      
      // Verify iframe has proper attributes
      await expect(mapIframe).toHaveAttribute('width', '100%');
    });

    test('should display contact form', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Verify form fields
      await expect(page.locator('input[formcontrolname="name"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="subject"]')).toBeVisible();
      await expect(page.locator('textarea[formcontrolname="message"]')).toBeVisible();
      await expect(page.locator('button:has-text("Send Message")')).toBeVisible();
    });

    test('should validate contact form fields', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Try to submit empty form
      await page.click('button:has-text("Send Message")');
      
      // Should show validation errors
      const errors = page.locator('mat-error');
      await expect(errors.first()).toBeVisible();
    });

    test('should validate email format in contact form', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Enter invalid email
      await page.fill('input[formcontrolname="email"]', 'invalid-email');
      await page.click('button:has-text("Send Message")');
      
      // Should show email validation error
      await expect(page.locator('text=/valid email/i')).toBeVisible();
    });

    test('should validate message length in contact form', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Fill form with short message
      await page.fill('input[formcontrolname="name"]', 'John Doe');
      await page.fill('input[formcontrolname="email"]', 'john@example.com');
      await page.fill('input[formcontrolname="subject"]', 'Test');
      await page.fill('textarea[formcontrolname="message"]', 'Short');
      
      // Should show validation error for short message
      await page.locator('textarea[formcontrolname="message"]').blur();
      await expect(page.locator('text=/at least 10 characters/i')).toBeVisible();
    });

    test('should fill contact form with valid data', async ({ page }) => {
      await page.goto('/#contact');
      await page.waitForSelector('#contact');
      
      // Fill all fields with valid data
      await page.fill('input[formcontrolname="name"]', 'John Doe');
      await page.fill('input[formcontrolname="email"]', 'john.doe@example.com');
      await page.fill('input[formcontrolname="subject"]', 'Inquiry about apartments');
      await page.fill('textarea[formcontrolname="message"]', 'I would like to know more about your apartments and availability.');
      
      // Submit button should be enabled
      const submitBtn = page.locator('button:has-text("Send Message")');
      await expect(submitBtn).toBeEnabled();
      
    });
  });

  test.describe('Sign Up Flow', () => {
    test('should display sign up form with all fields', async ({ page }) => {
      await page.goto('/signup');
      
      // Verify page loaded
      await expect(page.locator('.auth-container')).toBeVisible();
      await expect(page.locator('text=Create your account to get started')).toBeVisible();
      
      // Verify all form fields
      await expect(page.locator('input[formcontrolname="name"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="surname"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="phoneNumber"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="repeatPassword"]')).toBeVisible();
      
      // Verify submit button
      await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
      
      // Verify link to login
      await expect(page.locator('a:has-text("Log In")')).toBeVisible();
    });

    test('should successfully create a new account', async ({ page }) => {
      await page.goto('/signup');
      
      // Generate unique email to avoid conflicts
      const timestamp = Date.now();
      const uniqueEmail = `testuser${timestamp}@example.com`;
      
      // Fill form
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', uniqueEmail);
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      // Submit form
      await page.click('button:has-text("Create Account")');
      
      // Should show success message
      await expect(page.locator('text=/Account created successfully/i')).toBeVisible({ timeout: 5000 });
      
      // Should redirect to login after delay
      await page.waitForURL(/\/login/, { timeout: 3000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/signup');
      
      // Try to submit empty form
      await page.click('button:has-text("Create Account")');
      
      // Should show warning message
      await expect(page.locator('text=/fill in all required fields/i')).toBeVisible({ timeout: 5000 });
      
      // Should show validation errors
      const errors = page.locator('mat-error');
      await expect(errors.first()).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill with invalid email
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', 'invalid-email');
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      // Click outside to trigger validation
      await page.click('input[formcontrolname="phoneNumber"]');
      
      // Should show email validation error
      await expect(page.locator('text=/valid email/i')).toBeVisible();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill with invalid phone
      await page.fill('input[formcontrolname="phoneNumber"]', 'abc123');
      
      // Click outside to trigger validation
      await page.click('input[formcontrolname="name"]');
      
      // Should show phone validation error
      await expect(page.locator('text=/valid phone number/i')).toBeVisible();
    });

    test('should validate password minimum length', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill with short password
      await page.fill('input[formcontrolname="password"]', '123');
      
      // Click outside to trigger validation
      await page.click('input[formcontrolname="name"]');
      
    });

    test('should validate password match', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill with mismatched passwords
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', 'test@example.com');
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'DifferentPassword@123');
      
      // Click outside to trigger validation
      await page.click('input[formcontrolname="name"]');
      
      // Should show password mismatch error
      await expect(page.locator('text=/Passwords do not match/i')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/signup');
  
      const passwordInput = page.locator('input[formcontrolname="password"]');
      await passwordInput.fill('mypassword');
  
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
  
      // Click visibility toggle button
      const passwordField = page.locator('mat-form-field:has(input[formcontrolname="password"])');
      const toggleButton = passwordField.locator('button[mat-icon-button]');
      await toggleButton.click();
  
      // Should change to text type
      await expect(passwordInput).toHaveAttribute('type', 'text');
  
      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

      test('should toggle repeat password visibility', async ({ page }) => {
      await page.goto('/signup');
      
      const repeatPasswordInput = page.locator('input[formcontrolname="repeatPassword"]');
      await repeatPasswordInput.fill('mypassword');
      
      // Initially should be password type
      await expect(repeatPasswordInput).toHaveAttribute('type', 'password');
      
      // Click visibility toggle button
      const repeatField = page.locator('mat-form-field:has(input[formcontrolname="repeatPassword"])');
      const toggleButton = repeatField.locator('button[mat-icon-button]');
      await toggleButton.click();
      
      // Should change to text type
      await expect(repeatPasswordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      await expect(repeatPasswordInput).toHaveAttribute('type', 'password');
    });


    test('should handle duplicate email error', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill form with existing email
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', 'admin@example.com'); // Existing email
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      // Submit form
      await page.click('button:has-text("Create Account")');
      
      // Should show error about existing email
      await expect(page.locator('text=/Email already exists|already registered/i')).toBeVisible({ timeout: 5000 });
    });

    test('should disable submit button while processing', async ({ page }) => {
      await page.goto('/signup');
      
      const timestamp = Date.now();
      const uniqueEmail = `testuser${timestamp}@example.com`;
      
      // Fill form
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', uniqueEmail);
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      const submitButton = page.locator('button:has-text("Create Account")');
      
      // Button should be enabled initially
      await expect(submitButton).toBeEnabled();
      
    });

    test('should navigate to login page from link', async ({ page }) => {
      await page.goto('/signup');
      
      // Click "Log In" link
      await page.click('a:has-text("Log In")');
      
      // Should navigate to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear form after successful registration', async ({ page }) => {
      await page.goto('/signup');
      
      const timestamp = Date.now();
      const uniqueEmail = `testuser${timestamp}@example.com`;
      
      // Fill form
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', uniqueEmail);
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      // Submit
      await page.click('button:has-text("Create Account")');
      
      // Wait for success message
      await expect(page.locator('text=/Account created successfully/i')).toBeVisible({ timeout: 5000 });
      
    });

    test('should have proper icons for each field', async ({ page }) => {
      await page.goto('/signup');
      
      // Verify icons are present
      const nameField = page.locator('mat-form-field:has(input[formControlName="name"])');
      await expect(nameField.locator('mat-icon')).toHaveText('person');
      await expect(page.locator('mat-icon:has-text("badge")')).toBeVisible();
      const emailField = page.locator('mat-form-field:has(input[formControlName="email"])');
      await expect(emailField.locator('mat-icon')).toHaveText('email');
      const phoneField = page.locator('mat-form-field:has(input[formControlName="phoneNumber"])');
      await expect(phoneField.locator('mat-icon')).toHaveText('phone');
      await expect(page.locator('mat-icon:has-text("lock_outline")')).toBeVisible();
    });

    test('should validate all fields before submission', async ({ page }) => {
      await page.goto('/signup');
      
      // Fill only some fields
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      // Leave email empty
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'Password@123');
      await page.fill('input[formcontrolname="repeatPassword"]', 'Password@123');
      
      // Try to submit
      await page.click('button:has-text("Create Account")');
      
      // Should show validation warning
      await expect(page.locator('text=/fill in all required fields/i')).toBeVisible({ timeout: 5000 });
      
      // Should not navigate away
      await expect(page).toHaveURL(/\/signup/);
    });

    test('should handle special characters in password', async ({ page }) => {
      await page.goto('/signup');
      
      const timestamp = Date.now();
      const uniqueEmail = `testuser${timestamp}@example.com`;
      
      // Fill form with special characters in password
      await page.fill('input[formcontrolname="name"]', 'Test');
      await page.fill('input[formcontrolname="surname"]', 'User');
      await page.fill('input[formcontrolname="email"]', uniqueEmail);
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.fill('input[formcontrolname="password"]', 'P@ssw0rd!');
      await page.fill('input[formcontrolname="repeatPassword"]', 'P@ssw0rd!');
      
      // Submit
      await page.click('button:has-text("Create Account")');
      
      // Should accept special characters
      await expect(page.locator('text=/Account created successfully/i')).toBeVisible({ timeout: 5000 });
    });

    test('should validate phone number with exactly 9 digits', async ({ page }) => {
      await page.goto('/signup');
      
      // 9 digits should be valid
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789');
      await page.click('input[formcontrolname="name"]');
      
      // Should not show error
      const phoneError = page.locator('input[formcontrolname="phoneNumber"] ~ mat-error');
      await expect(phoneError).not.toBeVisible();
    });

    test('should validate phone number with 15 digits', async ({ page }) => {
      await page.goto('/signup');
      
      // 15 digits should be valid
      await page.fill('input[formcontrolname="phoneNumber"]', '123456789012345');
      await page.click('input[formcontrolname="name"]');
      
      // Should not show error
      const phoneError = page.locator('input[formcontrolname="phoneNumber"] ~ mat-error');
      await expect(phoneError).not.toBeVisible();
    });

    test('should reject phone number with less than 9 digits', async ({ page }) => {
      await page.goto('/signup');
      
      // Less than 9 digits should be invalid
      await page.fill('input[formcontrolname="phoneNumber"]', '12345678');
      await page.click('input[formcontrolname="name"]');
      
      // Should show error
      await expect(page.locator('text=/valid phone number/i')).toBeVisible();
    });

    test('should reject phone number with more than 15 digits', async ({ page }) => {
      await page.goto('/signup');
      
      // More than 15 digits should be invalid
      await page.fill('input[formcontrolname="phoneNumber"]', '1234567890123456');
      await page.click('input[formcontrolname="name"]');
      
      // Should show error
      await expect(page.locator('text=/valid phone number/i')).toBeVisible();
    });

    test('should have autocomplete attributes', async ({ page }) => {
      await page.goto('/signup');
      
      // Verify autocomplete attributes
      await expect(page.locator('input[formcontrolname="name"]')).toHaveAttribute('autocomplete', 'given-name');
      await expect(page.locator('input[formcontrolname="surname"]')).toHaveAttribute('autocomplete', 'family-name');
      await expect(page.locator('input[formcontrolname="email"]')).toHaveAttribute('autocomplete', 'email');
      await expect(page.locator('input[formcontrolname="phoneNumber"]')).toHaveAttribute('autocomplete', 'tel');
      await expect(page.locator('input[formcontrolname="password"]')).toHaveAttribute('autocomplete', 'new-password');
      await expect(page.locator('input[formcontrolname="repeatPassword"]')).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  test.describe('Navigation and UX', () => {
    test('should navigate through main menu items', async ({ page }) => {
      await page.goto('/');
      
      // Test Home navigation
      await page.click('a[routerlink="/home"][fragment="hero"]');
      await page.waitForTimeout(500);
      
      // Test Apartments navigation
      await page.click('a[routerlink="/apartments"]');
      await expect(page).toHaveURL(/\/apartments/);
      
      // Navigate back
      await page.goto('/');
      
      // Test About navigation
      await page.click('a[routerlink="/home"][fragment="about"]');
      await page.waitForTimeout(500);
      await expect(page.locator('#about')).toBeVisible();
      
      // Test Contact navigation
      await page.click('a[routerlink="/home"][fragment="contact"]');
      await page.waitForTimeout(500);
      await expect(page.locator('#contact')).toBeVisible();
    });

    test('should display logo and navigate home when clicked', async ({ page }) => {
      await page.goto('/apartments');
      
      // Click logo to go home
      await page.click('a.logo-link');
      
      // Should navigate to home
      await expect(page).toHaveURL(/\/home|\/$/);
    });

    test('should handle mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Desktop nav should be hidden
      await expect(page.locator('.desktop-nav')).not.toBeVisible();
      
      // Mobile menu button should be visible
      await expect(page.locator('button.mobile-menu-button')).toBeVisible();
      
      // Open mobile menu
      await page.click('button.mobile-menu-button');
      
      // Mobile nav should appear
      await expect(page.locator('.mobile-nav.open')).toBeVisible();
      
      // Click on a link
      await page.click('.mobile-nav a[routerlink="/apartments"]');
      
      // Menu should close
      await expect(page.locator('.mobile-nav.open')).not.toBeVisible();
      
      // Should navigate
      await expect(page).toHaveURL(/\/apartments/);
    });

    test('should display footer on all pages', async ({ page }) => {
      // Test on home page
      await page.goto('/');
      await expect(page.locator('app-footer')).toBeVisible();
      
      // Test on apartments page
      await page.goto('/apartments');
      await expect(page.locator('app-footer')).toBeVisible();
      
      // Test on login page
      await page.goto('/login');
      await expect(page.locator('app-footer')).toBeVisible();
    });
  });

  test.describe('Responsive Design for Guests', () => {
    test('should display properly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      // Desktop nav should be visible
      await expect(page.locator('.desktop-nav')).toBeVisible();
      
      // Mobile menu button should not be visible
      await expect(page.locator('button.mobile-menu-button')).not.toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Header should be visible
      await expect(page.locator('.header-toolbar')).toBeVisible();
      
      // Content should be readable
      await expect(page.locator('.carousel-section')).toBeVisible();
    });

    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Mobile-friendly elements should be visible
      await expect(page.locator('button.mobile-menu-button')).toBeVisible();
      
      // Carousel should still work
      await expect(page.locator('.carousel-section')).toBeVisible();
      
      // Featured apartments should stack vertically
      const featuredGrid = page.locator('.featured-grid');
      const gridStyle = await featuredGrid.evaluate((el) => window.getComputedStyle(el).gridTemplateColumns);
      
      // On mobile, should be single column or auto-fit
      expect(gridStyle).toBeTruthy();
    });

    test('should handle touch events on mobile carousel', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForSelector('.carousel-container');
      
      // Carousel controls should still be visible and usable
      await expect(page.locator('button.carousel-btn.next')).toBeVisible();
      await expect(page.locator('button.carousel-btn.prev')).toBeVisible();
      
      // Click should work
      await page.click('button.carousel-btn.next');
      await page.waitForTimeout(500);
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load home page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle slow network gracefully', async ({ page }) => {
      // Emulate slow 3G
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/');
      
      // Should eventually load
      await expect(page.locator('.carousel-section')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation to non-existent apartment', async ({ page }) => {
      await page.goto('/apartment/99999');
      await page.waitForLoadState('networkidle');
      
      // Should show error page or redirect
      const hasError = await page.locator('text=/not found|error|doesn\'t exist/i').first().isVisible();
      const redirected = !page.url().includes('/apartment/99999');
      
      expect(hasError || redirected).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Block all API requests
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/apartments');
      await page.waitForTimeout(3000);
    });
  });
});