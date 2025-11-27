// tests/user.spec.ts
import { test, expect, Page } from '@playwright/test';

// User credentials
const USER_EMAIL = 'user@example.com';
const USER_PASSWORD = 'Password@1234';

test.describe('Regular User Journey', () => {
  
  // Login helper function
  async function loginAsUser(page: Page) {
    await page.goto('/');
    await page.goto('/login');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after successful login
    await page.waitForURL(/^(?!.*login).*$/); 
  }

  test.describe('User Authentication', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/');
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[type="email"]', USER_EMAIL);
      await page.fill('input[type="password"]', USER_PASSWORD);
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect away from login
      await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
      
      // Verify user is logged in - profile button should be visible
      await expect(page.locator('button.profile-button')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      const snackBars = page.locator('.cdk-overlay-container .mat-mdc-snack-bar-label');
      await snackBars.last().waitFor({ state: 'visible', timeout: 5000 });
      await expect(snackBars.last()).toContainText(/Bad credentials/i);

    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'not-an-email');
      await page.fill('input[type="password"]', 'somepassword');
      
      // Error should appear
      await expect(page.locator('text=/valid email/i')).toBeVisible();
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      const snackBars = page.locator('.cdk-overlay-container .mat-mdc-snack-bar-label');
      await snackBars.last().waitFor({ state: 'visible', timeout: 5000 });
      await expect(snackBars.last()).toContainText(/fill in all required fields/i);;
    });

    test('should require minimum password length', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123');
      
      // Should show error about password length
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/at least 6 characters/i')).toBeVisible();

      await page.click('button[type="submit"]');
      
      // Should show error message
      const snackBars = page.locator('.cdk-overlay-container .mat-mdc-snack-bar-label');
      await snackBars.last().waitFor({ state: 'visible', timeout: 5000 });
      await expect(snackBars.last()).toContainText(/fill in all required fields/i);;
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login');
      
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('mypassword');
      
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click visibility toggle
      await page.click('button[aria-label*="password"] mat-icon');
      
      // Should change to text type
      await expect(page.locator('input[type="text"]')).toBeVisible();
      
      // Click again to hide
      await page.click('button[aria-label*="password"] mat-icon');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should navigate to signup from login page', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('a:has-text("Sign Up")');
      await expect(page).toHaveURL(/\/signup/);
    });
  });


  test.describe('User Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should access profile from header menu', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Verify user menu options (not admin options)
      await expect(page.locator('text=My Profile')).toBeVisible();
      await expect(page.locator('text=My bookings')).toBeVisible();
      
      // Admin options should NOT be visible
      await expect(page.locator('text=Dashboard of bookings')).not.toBeVisible();
      await expect(page.locator('text=Manage apartments')).not.toBeVisible();
      
      // Click My Profile
      await page.click('text=My Profile');
      await expect(page).toHaveURL(/\/profile#personal/);
    });

    test('should display user profile information', async ({ page }) => {
      await page.goto('/profile#personal');
      
      // Wait for profile to load
      await page.waitForSelector('.profile-header, .loading-container', { timeout: 10000 });
      
      // Verify profile header
      await expect(page.locator('.profile-header')).toBeVisible();
      await expect(page.locator('.user-avatar')).toBeVisible();
      
      // Verify form fields
      await expect(page.locator('input[formcontrolname="name"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="surname"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="email"]')).toBeVisible();
      await expect(page.locator('input[formcontrolname="phoneNumber"]')).toBeVisible();
    });

    test('should edit profile information', async ({ page }) => {
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      
      // Click edit button
      await page.click('button.edit-button');
      
      // Fields should now be editable
      const nameInput = page.locator('input[formcontrolname="name"]');
      await expect(nameInput).toBeEditable();
      
      // Make changes
      const currentName = await nameInput.inputValue();
      await nameInput.fill(currentName + ' Updated');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Wait for save to complete
      await page.waitForTimeout(2000);
      
      // Verify change name
      await expect(nameInput).toHaveValue(currentName + ' Updated');

      //Restore field
      await page.click('button.edit-button');
      await expect(nameInput).toBeEditable();
      await nameInput.fill(currentName);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);
      await expect(nameInput).toHaveValue(currentName);


    });

    test('should cancel profile edit', async ({ page }) => {
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      
      // Click edit
      await page.click('button.edit-button');
      
      // Make a change
      const nameInput = page.locator('input[formcontrolname="name"]');
      const originalName = await nameInput.inputValue();
      await nameInput.fill('Different Name');
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Value should be reverted
      await expect(nameInput).toHaveValue(originalName);
    });

    test('should change password', async ({ page }) => {
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      
      // Click edit
      await page.click('button.edit-button');
      
      // Fill password fields
      await page.fill('input[formcontrolname="password"]', 'NewPassword@1234');
      await page.fill('input[formcontrolname="repeatPassword"]', 'NewPassword@1234');
      
      // Save
      await page.click('button:has-text("Save Changes")');
      
      // Wait for completion
      await page.waitForTimeout(2000);

      // Verify password change
      await page.goto('/login');
      await page.fill('input[type="email"]', 'user@example.com');
      await page.fill('input[type="password"]', 'NewPassword@1234');
      await page.click('button[type="submit"]');

      //Restore password
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      await page.click('button.edit-button');
      await page.fill('input[formcontrolname="password"]', USER_PASSWORD);
      await page.fill('input[formcontrolname="repeatPassword"]', USER_PASSWORD);
      await page.click('button:has-text("Save Changes")');
      await page.waitForTimeout(2000);
      
    });

    test('should validate password match', async ({ page }) => {
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      
      // Click edit
      await page.click('button.edit-button');
      
      // Fill mismatched passwords
      await page.fill('input[formcontrolname="password"]', 'NewPassword@1234');
      await page.fill('input[formcontrolname="repeatPassword"]', 'DifferentPassword@1234');
      await page.keyboard.press('Tab');

      // Should show error
      await expect(page.locator('text=/do not match/i')).toBeVisible();
      
      // Save button should be disabled
      await expect(page.locator('button:has-text("Save Changes")')).toBeDisabled();
    });

    test('should validate phone number format', async ({ page }) => {
      await page.goto('/profile#personal');
      await page.waitForSelector('.profile-header');
      
      // Click edit
      await page.click('button.edit-button');
      
      // Enter invalid phone
      await page.fill('input[formcontrolname="phoneNumber"]', 'abc123');
      await page.keyboard.press('Tab');
      
      // Should show error
      await expect(page.locator('text=/valid phone/i')).toBeVisible();
    });
  });

  test.describe('Booking Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should access bookings from profile menu', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      await page.click('text=My bookings');
      
      // Should navigate to bookings tab
      await expect(page).toHaveURL(/\/profile#bookings/);
    });

    test('should display user bookings list', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for bookings to load
      await page.waitForSelector('.bookings-list, .loading-bookings, .empty-state', { timeout: 10000 });
      
      // Check if there are bookings or empty state
      const bookingCards = page.locator('.booking-card');
      const count = await bookingCards.count();
      const hasBookings = count > 0;
      const isEmpty = await page.locator('.empty-state').isVisible();

      expect(hasBookings || isEmpty).toBeTruthy();
    });

    test('should display booking details correctly', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const bookingCard = page.locator('.booking-card').first();
      
      if (await bookingCard.isVisible()) {
        // Verify booking card structure
        await expect(bookingCard.locator('.booking-image img')).toBeVisible();
        await expect(bookingCard.locator('h3')).toBeVisible();
        await expect(bookingCard.locator('mat-icon:has-text("event")')).toBeVisible();
        await expect(bookingCard.locator('mat-icon:has-text("people")')).toBeVisible();
        await expect(bookingCard.locator('mat-icon:has-text("payments")')).toBeVisible();
      }
    });

    test('should edit a booking', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const bookingCard = page.locator('.booking-card').first();
      const editButton = bookingCard.locator('button[mattooltip="Edit booking"]');
      
      if (await editButton.isVisible() && await editButton.isEnabled()) {
        await editButton.click();
        
        // Dialog should open
        await expect(page.locator('mat-dialog-container')).toBeVisible();
        
        // Verify edit form elements
        const dateInputs = page.locator('mat-dialog-container input.mat-mdc-input-element');
        const count = await dateInputs.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should cancel a booking with confirmation', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const bookingCard = page.locator('.booking-card').first();
      const cancelButton = bookingCard.locator('button[mattooltip="Cancel booking"]');
      
      if (await cancelButton.isVisible() && await cancelButton.isEnabled()) {
        // Setup Swal confirmation handler
        page.on('dialog', dialog => {
          expect(dialog.message()).toContain('Cancel');
          dialog.dismiss(); // Dismiss to avoid actually canceling
        });
        
        await cancelButton.click();
      }
    });

    test('should not allow editing completed or cancelled bookings', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      // Look for completed or cancelled bookings
      const completedBooking = page.locator('.booking-card:has(mat-chip.chip-completed, mat-chip.chip-cancelled)').first();
      
      if (await completedBooking.isVisible()) {
        const editBtn = completedBooking.locator('button[mattooltip="Edit booking"]');
        const cancelBtn = completedBooking.locator('button[mattooltip="Cancel booking"]');
        
        // Both buttons should be disabled
        await expect(editBtn).toBeDisabled();
        await expect(cancelBtn).toBeDisabled();
      }
    });

    test('should load more bookings when available', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const loadMoreBtn = page.locator('button:has-text("Load More")');
      
      if (await loadMoreBtn.isVisible()) {
        const initialCount = await page.locator('.booking-card').count();
        
        await loadMoreBtn.click();
        await page.waitForTimeout(2000);
        
        const newCount = await page.locator('.booking-card').count();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    test('should display empty state when no bookings', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const emptyState = page.locator('.empty-state');
      
      if (await emptyState.isVisible()) {
        await expect(emptyState.locator('mat-icon:has-text("event_busy")')).toBeVisible();
        await expect(emptyState.locator('text=No bookings yet')).toBeVisible();
        await expect(emptyState.locator('button:has-text("Browse Apartments")')).toBeVisible();
      }
    });

    test('should navigate to apartments from empty bookings state', async ({ page }) => {
      await page.goto('/profile#bookings');
      await page.waitForLoadState('networkidle');
      
      const browseBtn = page.locator('.empty-state button:has-text("Browse Apartments")');
      
      if (await browseBtn.isVisible()) {
        await browseBtn.click();
        await expect(page).toHaveURL(/\/apartments/);
      }
    });
  });

  test.describe('Creating a Booking', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should validate booking dates', async ({ page }) => {
      await page.goto('/book-apartment');
      await page.waitForLoadState('networkidle');
      
      const checkInInput = page.locator('input[placeholder*="check-in"], input[name*="startDate"]').first();
      
      if (await checkInInput.isVisible()) {
        // Try to set check-out before check-in
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        await checkInInput.fill(tomorrow.toISOString().split('T')[0]);
        
        const checkOutInput = page.locator('input[placeholder*="check-out"], input[name*="endDate"]').first();
        await checkOutInput.fill(yesterday.toISOString().split('T')[0]);
        
        // Should show validation error
        await expect(page.locator('text=/invalid|before|after/i')).toBeVisible({ timeout: 5000 });
      }
    });


    test('should display all booking confirmation details', async ({ page }) => {
      // Navigate with query params to booking confirmation
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      await expect(page.locator('.booking-confirmation-container')).toBeVisible();
      
      // Verify header
      await expect(page.locator('text=Confirm Your Booking')).toBeVisible();
      
      // Verify guest information section
      await expect(page.locator('text=Guest Information')).toBeVisible();
      await expect(page.locator('text=Full Name')).toBeVisible();
      await expect(page.locator('text=Email:')).toBeVisible();
      await expect(page.locator('text=Phone Number')).toBeVisible();
      
      // Verify booking details section
      await expect(page.getByRole('heading', { name: 'Booking Details' })).toBeVisible();
      await expect(page.locator('text=Check-in')).toBeVisible();
      await expect(page.locator('text=Check-out')).toBeVisible();
      await expect(page.locator('text=Number of Nights')).toBeVisible();
      await expect(page.locator('text=Number of Guests')).toBeVisible();
      
      // Verify apartment information
      await expect(page.locator('.apartment-card img')).toBeVisible();
      
      // Verify price summary
      await expect(page.locator('text=Price Summary')).toBeVisible();
      await expect(page.locator('text=Total')).toBeVisible();
      
      // Verify confirm button
      await expect(page.locator('button:has-text("Confirm Booking")')).toBeVisible();
    });

    test('should show included services in confirmation', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Wait for apartment data to load
      await page.waitForSelector('.apartment-card', { timeout: 10000 });
      
      // Verify services section
      const servicesSection = page.locator('.services-section');
      if (await servicesSection.isVisible()) {
        await expect(page.locator('text=Included Services')).toBeVisible();
        
        // Verify service items have check icons
        const serviceItems = page.locator('.service-item');
        const count = await serviceItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should navigate back to apartment detail', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Click back button
      await page.click('button:has-text("Back to Apartment")');
      
      // Should navigate back to apartment detail
      await expect(page).toHaveURL(/\/apartment\/\d+/);
    });

    test('should show cancellation policy', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Verify cancellation policy text
      await expect(page.locator('.cancellation-policy')).toBeVisible();
      await expect(page.locator('text=/Pay when you arrive/i')).toBeVisible();
    });

    test('should calculate correct total price', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4); // 3 nights
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Wait for price to load
      await page.waitForSelector('.price-row.total');
      
      // Verify number of nights is displayed
      await expect(page.locator('text="3 nights"')).toBeVisible();
      
      // Total should be visible
      const totalPrice = page.locator('.price-row.total .value');
      await expect(totalPrice).toBeVisible();
      
      // Value should start with $
      const priceText = await totalPrice.textContent();
      expect(priceText).toMatch(/^\$/);
    });

    test('should handle invalid booking parameters', async ({ page }) => {
      // Try to access booking page without parameters
      await page.goto('/booking');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to error page
      await expect(page).toHaveURL(/\/error/);
    });

    test('should confirm booking successfully', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 290);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 300);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Wait for page to fully load
      await page.waitForSelector('button:has-text("Confirm Booking")');
      
      // Click confirm booking
      await page.click('button:has-text("Confirm Booking")');
      
      // Wait for success state
      await page.waitForSelector('.success-container', { timeout: 15000 });
      
      // Verify success message
      await expect(page.locator('text=Booking Confirmed!')).toBeVisible();
      
      // Verify booking number is displayed
      await expect(page.locator('.booking-number')).toBeVisible();
      await expect(page.locator('text=/Booking #\\d+/i')).toBeVisible();
      
      // Verify confirmation message
      await expect(page.locator('text=/has been confirmed successfully/i')).toBeVisible();
      await expect(page.locator('text=/confirmation email/i')).toBeVisible();
    });

    test('should display booking summary after confirmation', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 130);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 133);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      await page.waitForLoadState('networkidle');
      
      // Confirm booking
      await page.click('button:has-text("Confirm Booking")');
      //await page.waitForSelector('.success-container', { timeout: 15000 });
      
      // Click "Browse More Apartments"
      await page.click('button:has-text("Browse More Apartments")');
      
      // Should navigate to apartments page
      await expect(page).toHaveURL(/\/apartments/);
    });

    test('should show loading spinner while fetching apartment data', async ({ page }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);
      
      const checkInStr = tomorrow.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];
      
      await page.goto(`/booking?apartmentId=1&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=2`);
      
      // Loading spinner should appear briefly
      const spinner = page.locator('.loading-container mat-spinner');
      const spinnerVisible = await spinner.isVisible().catch(() => false);
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Content should be visible after loading
      await expect(page.locator('.booking-content, .loading-container')).toBeVisible();
    });
  });

  test.describe('User Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should navigate through main menu (logged-in user)', async ({ page }) => {
      await page.goto('/');
    
      // ---------- MAIN NAVIGATION ----------
      await page.click('a[routerlink="/home"]');
      await expect(page).toHaveURL(/\/#hero|\/$/);
    
      await page.click('a[routerlink="/apartments"]');
      await expect(page).toHaveURL(/\/apartments/);
    
      await page.click('a[fragment="about"]');
      await page.waitForTimeout(500);
    
      await page.click('a[fragment="contact"]');
      await page.waitForTimeout(500);
    
      // ---------- PROFILE MENU ----------
      const profileButton = page.locator('button.profile-button');
      await expect(profileButton).toBeVisible();
  
      await profileButton.click();
      
      const overlayPane = page.locator('.cdk-overlay-container .cdk-overlay-pane');
      await overlayPane.waitFor({ state: 'visible', timeout: 5000 });
      
      const myProfileItem = overlayPane.getByRole('menuitem', { name: /My Profile/i });
      const myBookingsItem = overlayPane.getByRole('menuitem', { name: /My bookings/i });
      
      await expect(myProfileItem).toBeVisible();
      await expect(myBookingsItem).toBeVisible();
      
      await myProfileItem.click();
    
      await expect(page).toHaveURL(/\/profile(#personal)?/);
    
      await page.goBack();
      await profileButton.click();
    
      await myBookingsItem.click();
      await expect(page).toHaveURL(/\/profile#bookings/);
    });
    
    test('should use mobile menu on small screens', async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Mobile menu button should be visible
      await expect(page.locator('button.mobile-menu-button')).toBeVisible();
      
      // Click to open
      await page.click('button.mobile-menu-button');
      
      // Mobile nav should be visible
      await expect(page.locator('.mobile-nav.open')).toBeVisible();
      
      // Click a link
      await page.click('.mobile-nav a[routerlink="/apartments"]');
      
      // Menu should close
      await expect(page.locator('.mobile-nav.open')).not.toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Click logout
      await page.click('button:has-text("Logout")');
      
      // Wait for page reload
      await page.waitForLoadState('networkidle');
      
      // Verify logged out - should see login/signup buttons
      await expect(page.locator('button:has-text("Log In")')).toBeVisible();
      await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
      
      // Profile button should not be visible
      await expect(page.locator('button.profile-button')).not.toBeVisible();
    });

    test('should not access profile after logout', async ({ page }) => {
      await page.goto('/');
      
      // Logout
      await page.click('button.profile-button');
      await page.click('button:has-text("Logout")');
      await page.waitForLoadState('networkidle');
      
      // Try to access profile
      await page.goto('/profile');
      
      // Should redirect to login or show error
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toMatch(/login|error/);
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page);
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Verify main elements are visible
      await expect(page.locator('.header-toolbar')).toBeVisible();
      await expect(page.locator('.carousel-section')).toBeVisible();
    });

    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Mobile menu should be available
      await expect(page.locator('button.mobile-menu-button')).toBeVisible();
      
      // Desktop nav should be hidden
      await expect(page.locator('.desktop-nav')).not.toBeVisible();
    });
  });
});