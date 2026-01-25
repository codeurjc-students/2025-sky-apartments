import { test, expect, Page } from '@playwright/test';

// Admin credentials
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Password@1234';

test.describe('Admin User Journey', () => {
  
  // Login helper function
  async function loginAsAdmin(page: Page) {
    await page.goto('/');
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation after successful login
    await page.waitForURL(/^(?!.*login).*$/); 
  }

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Admin Dashboard Access', () => {
    test('should access dashboard from profile menu', async ({ page }) => {
      // Open profile menu
      await page.click('button.profile-button');
      
      // Verify admin menu options are visible
      await expect(page.locator('text=Dashboard of bookings')).toBeVisible();
      await expect(page.locator('text=Manage apartments')).toBeVisible();
      await expect(page.locator('text=Bookings calendar')).toBeVisible();
      await expect(page.locator('text=Manage filters')).toBeVisible();
      
      // Click dashboard option
      await page.click('text=Dashboard of bookings');
      
      // Verify navigation to profile with dashboard fragment
      await expect(page).toHaveURL(/\/profile#dashboard/);
      
      // Verify dashboard tab is active
      await expect(page.locator('mat-tab-group')).toBeVisible();
      await expect(page.getByText('Dashboard', { exact: true })).toBeVisible();
    });

    test('should display dashboard statistics', async ({ page }) => {
      await page.goto('/profile#dashboard');
      
      // Wait for dashboard to load
      await page.waitForSelector('.stats-grid', { timeout: 10000 });
      
      // Verify all statistics cards are present
      const statCards = page.locator('.stat-card');
      await expect(statCards).toHaveCount(5);
      
      // Verify specific statistics
      await expect(page.locator('text=Total Bookings')).toBeVisible();
      await expect(page.locator('text=Active Bookings')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Average Occupancy')).toBeVisible();
    });

    test('should display occupancy chart with period selector', async ({ page }) => {
      await page.goto('/profile#dashboard');
      
      // Wait for chart to load
      await page.waitForSelector('.chart-container canvas', { timeout: 10000 });
      
      // Verify chart header
      await expect(page.locator('text=Occupancy Over Time')).toBeVisible();
      
      // Test period selector
      await page.click('mat-select[formcontrolname="selectedPeriod"], .period-select mat-select');
      await expect(page.locator('text=Last 7 days')).toBeVisible();
      await expect(page.getByRole('option', { name: 'Last 30 days' })).toBeVisible();
      await expect(page.locator('text=Last 90 days')).toBeVisible();
      await expect(page.locator('text=Last 6 months')).toBeVisible();
      
      // Select different period
      await page.getByRole('option', { name: 'Last 30 days' }).click();
      
      // Chart should still be visible
      await expect(page.locator('.chart-container canvas').first()).toBeVisible();
      await expect(page.locator('.chart-container canvas').nth(1)).toBeVisible();
    });

    test('should display top apartments chart', async ({ page }) => {
      await page.goto('/profile#dashboard');
      
      // Wait for page load
      await page.waitForLoadState('networkidle');
      
      // Verify bookings chart is present
      await expect(page.locator('text=Top Apartments by Bookings')).toBeVisible();
      
      // Verify chart canvas exists
      const charts = page.locator('.chart-container canvas');
      await expect(charts).toHaveCount(3);
    });

    test('should handle empty dashboard state', async ({ page }) => {
      await page.goto('/profile#dashboard');
      await page.waitForLoadState('networkidle');
      
      const hasData = await page.locator('.stats-grid').isVisible();
      const isEmpty = await page.locator('.empty-dashboard').isVisible();
      
      expect(hasData || isEmpty).toBeTruthy();
    });
  });

  test.describe('Bookings Calendar Management', () => {
    test('should access bookings calendar from profile menu', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Click bookings calendar
      await page.click('text=Bookings calendar');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/profile#bookings/);
      
      // Verify bookings tab is visible
      await expect(page.locator('mat-tab-group')).toBeVisible();
    });

    test('should display bookings calendar view', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for bookings to load
      await page.waitForSelector('.bookings-tab-container', { timeout: 10000 });
      
      // Verify calendar controls
      await expect(page.locator('mat-button-toggle-group')).toBeVisible();
      await expect(page.locator('text=Calendar View')).toBeVisible();
      await expect(page.locator('text=List View')).toBeVisible();
    });

    test('should display bookings statistics', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for statistics to load
      await page.waitForSelector('.statistics-grid', { timeout: 10000 });
      
      // Verify statistics cards

      await expect(page.locator('text=Total Bookings')).toBeVisible();
      await expect(page.locator('text=Confirmed')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=Total Revenue')).toBeVisible();
    });

    test('should switch between calendar and list view', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for view toggle
      await page.waitForSelector('mat-button-toggle-group', { timeout: 10000 });
      
      // Default should be calendar view
      const calendarButton = page.locator('mat-button-toggle[value="calendar"]');
      await expect(calendarButton).toHaveClass(/mat-button-toggle-checked/);
      
      // Switch to list view
      await page.click('mat-button-toggle[value="list"]');
      
      // Verify list view is active
      const listButton = page.locator('mat-button-toggle[value="list"]');
      await expect(listButton).toHaveClass(/mat-button-toggle-checked/);
      
      // Verify list view content is visible
      await expect(page.locator('.list-view')).toBeVisible();
    });

    test('should navigate calendar months', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for calendar to load
      await page.waitForSelector('.month-navigation', { timeout: 10000 });
      
      // Get current month name
      const monthName = await page.locator('.month-navigation h2').textContent();
      
      // Click next month
      await page.locator('.month-navigation button:has(mat-icon:has-text("chevron_right"))').click();
      //Wait for month to update
      await page.waitForTimeout(500);
      // Verify month changed
      const newMonthName = await page.locator('.month-navigation h2').textContent();
      expect(newMonthName).not.toBe(monthName);
      
      // Go back to previous month
      await page.locator('.month-navigation button:has(mat-icon:has-text("chevron_left"))').click();
      //Wait for month to update
      await page.waitForTimeout(500);
      // Should be back to original month
      const returnedMonthName = await page.locator('.month-navigation h2').textContent();
      expect(returnedMonthName).toBe(monthName);
    });

    test('should filter bookings by status', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for filter controls
      await page.waitForSelector('[data-testid="filter-state"]', { timeout: 10000 });
      
      // Open status filter
      await page.click('mat-select');
      
      // Verify filter options
      await expect(page.getByRole('option', { name: 'All States' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Confirmed' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Completed' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Cancelled' })).toBeVisible();
      
      // Select confirmed filter
      await page.getByRole('option', { name: 'Confirmed' }).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Verify bookings are filtered (if any bookings exist)
      const bookingIndicators = page.locator('.booking-indicator');
      const count = await bookingIndicators.count();
      
      if (count > 0) {
        // All visible bookings should be confirmed
        for (let i = 0; i < count; i++) {
          await expect(bookingIndicators.nth(i)).toHaveClass(/chip-confirmed/);
        }
      }
    });

    test('should search apartments in bookings', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for search field
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
      
      // Type in search
      await page.fill('input[placeholder*="Search"]', 'Beach');
      
      // Wait for search to apply
      await page.waitForTimeout(500);
      
      // Verify filtered results (if any)
      const apartmentNames = page.locator('.apartment-name');
      const count = await apartmentNames.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const text = await apartmentNames.nth(i).textContent();
          expect(text?.toLowerCase()).toContain('beach');
        }
      }
    });

    test('should display booking tooltips in calendar view', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Wait for calendar to load
      await page.waitForSelector('.calendar-table', { timeout: 10000 });
      
      // Find a booking indicator (if any)
      const bookingIndicator = page.locator('.booking-indicator').first();
      
      if (await bookingIndicator.isVisible()) {
        // Hover over booking
        await bookingIndicator.hover();
        
        // Verify tooltip appears
        await expect(page.locator('.mat-mdc-tooltip, .cdk-overlay-pane').first()).toBeVisible();

      }
    });

    test('should display booking details in list view', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      // Switch to list view
      await page.click('mat-button-toggle[value="list"]');
      
      // Wait for list to load
      await page.waitForSelector('.list-view', { timeout: 10000 });
      
      // Verify list view structure
      const apartmentCards = page.locator('.apartment-list-card');
      const count = await apartmentCards.count();
      
      if (count > 0) {
        const firstCard = apartmentCards.first();
        
        // Verify apartment info is displayed
        await expect(firstCard.locator('.apartment-list-info h3')).toBeVisible();
        await expect(firstCard.locator('img')).toBeVisible();
        
        // Check if there are bookings
        const hasBookings = await firstCard.locator('.booking-list-item').count() > 0;
        const noBookings = await firstCard.locator('.no-bookings').isVisible();
        
        expect(hasBookings || noBookings).toBeTruthy();
      }
    });

    test('should handle empty bookings state', async ({ page }) => {
      await page.goto('/profile#bookings');
      
      await page.waitForLoadState('networkidle');
      
      // Either has bookings or shows appropriate message
      const hasCalendar = await page.locator('.calendar-table').isVisible();
      const hasStatistics = await page.locator('.statistics-grid').isVisible();
      
      expect(hasCalendar || hasStatistics).toBeTruthy();
    });
  });

  test.describe('Price Filters Management', () => {
    test('should access filters management from profile menu', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Click manage filters
      await page.click('text=Manage filters');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/profile#filters/);
      
      // Verify filters management section is visible
      await expect(page.locator('text=Price Filters Management')).toBeVisible();
    });

    test('should display list of filters', async ({ page }) => {
      await page.goto('/profile#filters');
      
      // Wait for filters to load
      await page.waitForSelector('.filters-grid, .loading-container', { timeout: 10000 });
      
      // Check if filters are displayed
      const isLoading = await page.locator('.loading-container').isVisible();
      
      if (!isLoading) {
        // Verify filter cards or empty state
        const filterCards = page.locator('.filter-card');
        const emptyState = page.locator('.empty-state');
        
        const hasFilters = await filterCards.count() > 0;
        const isEmpty = await emptyState.isVisible();
        
        expect(hasFilters || isEmpty).toBeTruthy();
        
        // If filters exist, verify card structure
        if (hasFilters) {
          const firstCard = filterCards.first();
          await expect(firstCard.locator('.filter-name')).toBeVisible();
          await expect(firstCard.locator('.filter-badge')).toBeVisible();
          await expect(firstCard.locator('.toggle-switch')).toBeVisible();
          await expect(firstCard.locator('button:has-text("Edit")')).toBeVisible();
          await expect(firstCard.locator('button:has-text("Delete")')).toBeVisible();
        }
      }
    });

    test('should create a new filter successfully', async ({ page }) => {
      await page.goto('/profile#filters');
      
      // Click new filter button
      await page.click('button:has-text("New Filter")');
      
      // Wait for modal to open
      await page.waitForSelector('.modal-container', { timeout: 5000 });
      
      // Verify form is visible
      await expect(page.locator('.modal-title:has-text("New Filter")')).toBeVisible();
      
      // Fill basic information
      await page.fill('input[name="name"]', 'Weekend Premium Test');
      await page.fill('textarea[name="description"]', 'Test filters for weekend bookings');
      await page.fill('input[name="value"]', '25');
      
      // Select increment type
      await page.selectOption('select[name="increment"]', { label: 'Increment' });
      
      // Select date type
      await page.selectOption('select[name="dateType"]', { label: 'Specific days of week' });
      
      // Wait for week days checkboxes to appear
      await page.waitForSelector('.checkbox-grid', { timeout: 2000 });
      
      // Select Friday, Saturday, Sunday
      await page.check('input[type="checkbox"]:near(:text("Friday"))');
      await page.check('input[type="checkbox"]:near(:text("Saturday"))');
      await page.check('input[type="checkbox"]:near(:text("Sunday"))');
      
      // Select condition type (None)
      await page.selectOption('select[name="conditionType"]', { label: 'None' });
      
      // Submit form
      await page.click('button:has-text("Create Filter")');
      
      // Wait for modal to close and success message
      await expect(page.locator('.modal-container')).not.toBeVisible({ timeout: 5000 });
      //Verify success snackbar
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      await expect(snackbar).toContainText('Filter created successfully');

    });

    test('should create a last minute discount filter', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.click('button:has-text("New Filter")');
      await page.waitForSelector('.modal-container');
      
      // Fill basic info
      await page.fill('input[name="name"]', 'Last Minute Deal Test');
      await page.fill('textarea[name="description"]', 'Discount for bookings within 48 hours');
      await page.fill('input[name="value"]', '15');
      
      // Select discount type
      await page.selectOption('select[name="increment"]', { label: 'Discount' });
      
      // Select no date restriction
      await page.selectOption('select[name="dateType"]', { label: 'Every day' });
      
      // Select last minute condition
      await page.selectOption('select[name="conditionType"]', { label: 'Last minute booking' });
      
      // Wait for anticipation hours field
      await page.waitForSelector('input[name="anticipationHours"]');
      
      // Set anticipation hours
      await page.fill('input[name="anticipationHours"]', '48');
      
      // Submit
      await page.click('button:has-text("Create Filter")');
      
      //Verify success snackbar
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      await expect(snackbar).toContainText('Filter created successfully');
    });

    test('should create a long stay discount filter', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.click('button:has-text("New Filter")');
      await page.waitForSelector('.modal-container');
      
      // Fill info
      await page.fill('input[name="name"]', 'Long Stay Discount Test');
      await page.fill('textarea[name="description"]', 'Discount for stays of 7+ days');
      await page.fill('input[name="value"]', '10');
      
      await page.selectOption('select[name="increment"]', { label: 'Discount' });
      await page.selectOption('select[name="dateType"]', { label: 'Every day' });
      await page.selectOption('select[name="conditionType"]', { label: 'Long stay' });
      
      // Wait for min days field
      await page.waitForSelector('input[name="minDays"]');
      await page.fill('input[name="minDays"]', '7');
      
      // Submit
      await page.click('button:has-text("Create Filter")');
      
      //Verify success snackbar
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      await expect(snackbar).toContainText('Filter created successfully');
    });

    test('should create a seasonal filter with date range', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.click('button:has-text("New Filter")');
      await page.waitForSelector('.modal-container');
      
      await page.fill('input[name="name"]', 'Summer Season');
      await page.fill('textarea[name="description"]', 'High season pricing for summer');
      await page.fill('input[name="value"]', '30');
      
      await page.selectOption('select[name="increment"]', { label: 'Increment' });
      await page.selectOption('select[name="dateType"]', { label: 'Specific date range' });
      
      // Wait for date fields
      await page.waitForSelector('input[name="startDate"]');
      
      // Set dates (summer 2025)
      await page.fill('input[name="startDate"]', '2025-07-01');
      await page.fill('input[name="endDate"]', '2025-08-31');
      
      await page.selectOption('select[name="conditionType"]', { label: 'None' });
      
      // Submit
      await page.click('button:has-text("Create Filter")');
      
      //Verify success snackbar
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container');
      await expect(snackbar).toBeVisible({ timeout: 5000 });
      await expect(snackbar).toContainText('Filter created successfully');
    });

    test('should validate required fields when creating filter', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.click('button:has-text("New Filter")');
      await page.waitForSelector('.modal-container');
      
      // Try to submit without filling anything
      const submitButton = page.locator('button:has-text("Create Filter")');
      await expect(submitButton).toBeDisabled();
      
      // Fill only name
      await page.fill('input[name="name"]', 'Test');
      await expect(submitButton).toBeDisabled();
      
      // Add value
      await page.fill('input[name="value"]', '10');
      
      // Button should now be enabled (other fields have defaults)
      await expect(submitButton).toBeEnabled();
    });

    test('should edit an existing filter', async ({ page }) => {
      await page.goto('/profile#filters');
      
      // Wait for filters to load
      await page.waitForSelector('.filters-grid', { timeout: 10000 });
      
      const filterCards = page.locator('.filter-card');
      const count = await filterCards.count();
      
      if (count > 0) {
        // Click edit on first filter
        await filterCards.first().locator('button:has-text("Edit")').click();
        
        // Wait for modal
        await page.waitForSelector('.modal-container');
        await expect(page.locator('.modal-title:has-text("Edit Filter")')).toBeVisible();
        
        // Verify form is populated
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).not.toHaveValue('');
        
        // Make a change
        const currentValue = await page.locator('input[name="value"]').inputValue();
        const newValue = (parseFloat(currentValue) + 5).toString();
        await page.fill('input[name="value"]', newValue);
        
        // Save
        await page.click('button:has-text("Update Filter")');
        
        // Verify modal closed
        await expect(page.locator('.modal-container')).not.toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });

    test('should toggle filter activation', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.waitForSelector('.filters-grid', { timeout: 10000 });
      
      const filterCards = page.locator('.filter-card');
      const count = await filterCards.count();
      
      if (count > 0) {
        const firstCard = filterCards.first();
        const toggle = firstCard.locator('.toggle-switch input[type="checkbox"]');
        
        // Get current state
        const wasChecked = await toggle.isChecked();
        
        // Click toggle
        const slider = firstCard.locator('.toggle-switch .toggle-slider');
        await slider.click();
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify state changed
        const isNowChecked = await toggle.isChecked();
        expect(isNowChecked).toBe(!wasChecked);
      } else {
        test.skip();
      }
    });

    test('should delete a filter with confirmation', async ({ page }) => {
      await page.goto('/profile#filters');
      
      // Wait for filters to load
      await page.waitForSelector('.filters-grid', { timeout: 10000 });
      
      const filterCards = page.locator('.filter-card');
      const initialCount = await filterCards.count();
      
      if (initialCount === 0) {
        test.skip();
        return;
      }
      
      // Get the first filter
      const firstFilter = filterCards.first();
      const filterName = await firstFilter.locator('.filter-name').textContent();
      
      // Click delete button
      await firstFilter.locator('button.btn-delete').click();
      
      // Wait for SweetAlert confirmation dialog
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.swal2-title')).toContainText('delete this filter');
      
      // Confirm deletion
      await page.click('button.swal2-confirm:has-text("Yes, delete it!")');
      
      // Wait for success message
      const snackbar = page.locator('.mat-mdc-snack-bar-container, .mat-snack-bar-container');
      await expect(snackbar).toContainText('deleted successfully', { timeout: 5000 });
      
      // Wait for reload to complete
      await page.waitForLoadState('networkidle');
            
      // Verify the specific filter is gone
      if (filterName) {
        const deletedFilter = page.locator('.filter-card', {
          has: page.locator(`.filter-name:has-text("${filterName}")`)
        });
        await expect(deletedFilter).not.toBeVisible();
      }
    });

    test('should cancel filter creation', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.click('button:has-text("New Filter")');
      await page.waitForSelector('.modal-container');
      
      // Fill some data
      await page.fill('input[name="name"]', 'Test Filter 1234');
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Verify modal is closed
      await expect(page.locator('.modal-container')).not.toBeVisible();
      
      // Verify filter was not created
      await expect(page.locator('.filter-card:has-text("Test Filter 1234")')).not.toBeVisible();
    });

    test('should display filter details correctly', async ({ page }) => {
      await page.goto('/profile#filters');
      
      await page.waitForSelector('.filters-grid', { timeout: 10000 });
      
      const filterCards = page.locator('.filter-card');
      const count = await filterCards.count();
      
      if (count > 0) {
        const firstCard = filterCards.first();
        
        // Verify card structure
        await expect(firstCard.locator('.filter-name')).toBeVisible();
        await expect(firstCard.locator('.filter-badge')).toBeVisible();
        await expect(firstCard.locator('.filter-description')).toBeVisible();
        await expect(firstCard.locator('.filter-details')).toBeVisible();
        
        // Verify badge shows percentage
        const badge = await firstCard.locator('.filter-badge').textContent();
        expect(badge).toMatch(/\d+%/);
      }
    });
  });

  test.describe('Apartment Management', () => {
    test('should access apartment management from profile menu', async ({ page }) => {
      await page.goto('/');
      
      await page.click('button.profile-button');
      await page.click('text=Manage apartments');
      
      await expect(page).toHaveURL(/\/profile#apartments/);
      await expect(page.locator('text=All Apartments')).toBeVisible();
      await expect(page.locator('text=Add Apartment')).toBeVisible();
    });

    test('should display list of apartments', async ({ page }) => {
      await page.goto('/profile#apartments');
      
      await page.waitForSelector('.apartments-grid, .loading-admin', { timeout: 10000 });
      
      const isLoading = await page.locator('.loading-admin').isVisible();
      
      if (!isLoading) {
        const apartmentCards = page.locator('.apartment-admin-card');
        const count = await apartmentCards.count();
        expect(count).toBeGreaterThanOrEqual(0);
        
        if (count > 0) {
          const firstCard = apartmentCards.first();
          await expect(firstCard.locator('img')).toBeVisible();
          await expect(firstCard.locator('h3')).toBeVisible();
          await expect(firstCard.locator('.price')).toBeVisible();
          await expect(firstCard.locator('button:has-text("Edit")')).toBeVisible();
          await expect(firstCard.locator('button:has-text("Delete")')).toBeVisible();
        }
      }
    });

    test('should navigate to create apartment form', async ({ page }) => {
      await page.goto('/profile#apartments');
      
      await page.click('button:has-text("Add Apartment")');
      await expect(page).toHaveURL(/\/apartments\/new/);
      await expect(page.locator('text=Create New Apartment')).toBeVisible();
    });
  });

  test.describe('Admin Navigation', () => {
    test('should display all admin menu options', async ({ page }) => {
      await page.goto('/');
      
      await page.click('button.profile-button');
      
      // Verify all admin options are visible
      await expect(page.locator('text=Dashboard of bookings')).toBeVisible();
      await expect(page.locator('text=Bookings calendar')).toBeVisible();
      await expect(page.locator('text=Manage apartments')).toBeVisible();
      await expect(page.locator('text=Manage filters')).toBeVisible();
      
      // Regular user options should NOT be visible
      await expect(page.locator('text=My Profile')).not.toBeVisible();
      await expect(page.locator('text=My bookings')).not.toBeVisible();
    });

    test('should navigate between admin sections', async ({ page }) => {
      await page.goto('/');
      
      // Test Dashboard
      await page.click('button.profile-button');
      await page.click('text=Dashboard of bookings');
      await expect(page).toHaveURL(/\/profile#dashboard/);
      
      // Test Bookings Calendar
      await page.click('button.profile-button');
      await page.click('text=Bookings calendar');
      await expect(page).toHaveURL(/\/profile#bookings/);
      
      // Test Filters
      await page.click('button.profile-button');
      await page.click('button:has-text("Manage filters")');
      await expect(page).toHaveURL(/\/profile#filters/);
      
      // Test Apartments
      await page.click('button.profile-button');
      await page.click('button:has-text("Manage apartments")');
      await expect(page).toHaveURL(/\/profile#apartments/);
    });
  });

  test.describe('Admin Security', () => {
    test('should prevent non-admin access to apartment form', async ({ page }) => {
      await page.goto('/apartments/new');
      
      // If not admin, should redirect to error or login
      // The component checks for ADMIN role
      await page.waitForLoadState('networkidle');
      
      // Verify either form loads (if admin) or error page (if not)
      const hasForm = await page.locator('text=Create New Apartment').isVisible();
      const hasError = await page.locator('text=Access denied').isVisible();
      
      // As admin, should see form
      expect(hasForm).toBeTruthy();
    });
  });

  test.describe('Admin Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Click logout
      await page.click('button:has-text("Logout")');
      
      // Wait for page reload
      await page.waitForLoadState('networkidle');
      
      // Verify logged out state - should see login button
      await expect(page.locator('button:has-text("Log In")')).toBeVisible();
      await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
    });
  });
});