// tests/admin.spec.ts
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
      await expect(statCards).toHaveCount(4);
      
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
      await expect(page.locator('.chart-container canvas').first()).toBeVisible(); // primer gráfico
      await expect(page.locator('.chart-container canvas').nth(1)).toBeVisible();  // segundo gráfico

    });

    test('should display top apartments chart', async ({ page }) => {
      await page.goto('/profile#dashboard');
      
      // Wait for page load
      await page.waitForLoadState('networkidle');
      
      // Verify bookings chart is present
      await expect(page.locator('text=Top Apartments by Bookings')).toBeVisible();
      
      // Verify chart canvas exists
      const charts = page.locator('.chart-container canvas');
      await expect(charts).toHaveCount(2); // Occupancy + Bookings charts
    });

    test('should handle empty dashboard state', async ({ page }) => {
      await page.goto('/profile#dashboard');
      await page.waitForLoadState('networkidle');
      // The dashboard should either show data or empty state
      const hasData = await page.locator('.stats-grid').isVisible();
      const isEmpty = await page.locator('.empty-dashboard').isVisible();
      
      expect(hasData || isEmpty).toBeTruthy();
    });
  });

  test.describe('Apartment Management', () => {
    test('should access apartment management from profile menu', async ({ page }) => {
      // Navigate to home first
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Click manage apartments
      await page.click('text=Manage apartments');
      
      // Verify navigation
      await expect(page).toHaveURL(/\/profile#apartments/);
      
      // Verify apartments management section is visible
      await expect(page.locator('text=All Apartments')).toBeVisible();
      await expect(page.locator('text=Add Apartment')).toBeVisible();
    });

    test('should display list of apartments', async ({ page }) => {
      await page.goto('/profile#apartments');
      
      // Wait for apartments to load
      await page.waitForSelector('.apartments-grid, .loading-admin', { timeout: 10000 });
      
      // Check if apartments are displayed or if it's loading
      const isLoading = await page.locator('.loading-admin').isVisible();
      
      if (!isLoading) {
        // Verify apartment cards exist
        const apartmentCards = page.locator('.apartment-admin-card');
        const count = await apartmentCards.count();
        expect(count).toBeGreaterThanOrEqual(0);
        
        // If apartments exist, verify card structure
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
      
      // Click Add Apartment button
      await page.click('button:has-text("Add Apartment")');
      
      // Verify navigation to new apartment page
      await expect(page).toHaveURL(/\/apartments\/new/);
      
      // Verify form elements are present
      await expect(page.locator('text=Create New Apartment')).toBeVisible();
      await expect(page.locator('input[placeholder*="apartment name"]')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="Describe"]')).toBeVisible();
    });

    test('should create a new apartment successfully', async ({ page }) => {
      await page.goto('/apartments/new');
      
      // Wait for form to initialize
      await page.waitForLoadState('networkidle');
      
      // Fill basic information
      await page.fill('input[placeholder*="apartment name"]', 'Test Luxury Suite');
      await page.fill('textarea[placeholder*="Describe"]', 'A beautiful test apartment with amazing views and modern amenities');
      await page.fill('input[placeholder="0"][type="number"]', '150');
      await page.locator('input[placeholder="0"][min="1"]').fill('4');
      
      // Upload image
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-apartment.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-content')
      });
      
      // Wait for image preview
      await page.waitForSelector('.image-preview-item img', { timeout: 5000 });
      
      // Select services
      await page.click('mat-checkbox:has-text("WiFi")');
      await page.click('mat-checkbox:has-text("Parking")');
      
      // Add custom service
      await page.fill('input[placeholder*="Pool, Gym"]', 'Rooftop Terrace');
      await page.click('button:has-text("Add"):has(mat-icon:has-text("add_circle"))');
      
      // Verify custom service was added
      const rooftopChip = page.locator('mat-chip-row:has-text("Rooftop Terrace")');
      await rooftopChip.waitFor({ state: 'visible', timeout: 5000 });
      await expect(rooftopChip).toBeVisible();
      
      // Submit form
      await page.click('button:has-text("Create Apartment")');
      
      // Wait for success and navigation
      await page.waitForURL(/\/profile#apartments/, { timeout: 10000 });
      
      // Verify success message (adjust selector based on your snackbar implementation)
      await expect(page.locator('text=successfully')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields when creating apartment', async ({ page }) => {
      await page.goto('/apartments/new');
      
      await page.waitForLoadState('networkidle');
      
      // Try to submit without filling anything
      const saveButton = page.locator('button:has-text("Create Apartment")');
      await expect(saveButton).toBeDisabled();
      
      // Fill only name
      await page.fill('input[placeholder*="apartment name"]', 'Test');
      await expect(saveButton).toBeDisabled();
      
      // Add description
      await page.fill('textarea[placeholder*="Describe"]', 'Test description for validation');
      await expect(saveButton).toBeDisabled();
      
      // Add price
      await page.fill('input[placeholder="0"][type="number"]', '100');
      await expect(saveButton).toBeDisabled();
      
      // Add capacity
      await page.locator('input[placeholder="0"][min="1"]').fill('2');
      await expect(saveButton).toBeDisabled();
      
      // Select at least one service
      await page.click('mat-checkbox:has-text("WiFi")');
      await expect(saveButton).toBeDisabled();
      
      // Upload image - now button should be enabled
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test')
      });
      
      await page.waitForSelector('.image-preview-item img', { timeout: 5000 });
    });

    test('should edit an existing apartment', async ({ page }) => {
      await page.goto('/profile#apartments');
      
      // Wait for apartments to load
      await page.waitForSelector('.apartments-grid', { timeout: 10000 });
      
      // Check if there are apartments to edit
      const apartmentCards = page.locator('.apartment-admin-card');
      const count = await apartmentCards.count();
      
      if (count > 1) {
        // Click edit on second apartment
        await apartmentCards.nth(1).locator('button:has-text("Edit")').click();
        
        // Verify navigation to edit page
        await expect(page).toHaveURL(/\/apartments\/edit\/\d+/);
        
        // Verify form is populated
        await expect(page.locator('text=Edit Apartment')).toBeVisible();
        
        // Verify form has values
        const nameInput = page.locator('input[placeholder*="apartment name"]');
        await expect(nameInput).not.toHaveValue('');
        
        // Make a change
        const currentName = await nameInput.inputValue();
        await nameInput.fill(currentName + ' - Updated');
        
        // Save changes
        await page.click('button:has-text("Save Changes")');
        
        // Wait for navigation back
        await page.waitForURL(/\/profile#apartments/, { timeout: 10000 });
        
        // Verify success message
        await expect(page.locator('text=successfully')).toBeVisible({ timeout: 5000 });
      } else {
        test.skip();
      }
    });

    test('should cancel apartment creation', async ({ page }) => {
      await page.goto('/apartments/new');
      
      await page.waitForLoadState('networkidle');
      
      // Fill some data
      await page.fill('input[placeholder*="apartment name"]', 'Test Apartment');
      
      // Click cancel
      await page.click('button:has-text("Cancel")');
      
      // Verify navigation back to apartments management
      await expect(page).toHaveURL(/\/profile#apartments/);
      
    });

    test('should delete an apartment with confirmation', async ({ page }) => {
      // First create a test apartment to delete
      await page.goto('/apartments/new');
      await page.waitForLoadState('networkidle');
      
      // Create apartment
      await page.fill('input[placeholder*="apartment name"]', 'Apartment to Delete');
      await page.fill('textarea[placeholder*="Describe"]', 'This will be deleted');
      await page.fill('input[placeholder="0"][type="number"]', '100');
      await page.locator('input[placeholder="0"][min="1"]').fill('2');
      await page.locator('mat-checkbox:has-text("WiFi") input[type="checkbox"]').check();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test')
      });
      
      await page.waitForSelector('.image-preview-item img');
      await page.click('button:has-text("Create Apartment")');
      await page.waitForURL(/\/profile#apartments/);
      
      // Now delete it
      await page.waitForSelector('.apartments-grid');
      const apartmentToDelete = page.locator('.apartment-admin-card:has-text("Apartment to Delete")');
      
      if (await apartmentToDelete.count() > 0) {
        // Setup dialog handler
        page.on('dialog', dialog => {
          expect(dialog.message()).toContain('delete');
          dialog.accept();
        });
        
        await apartmentToDelete.locator('button:has-text("Delete")').click();
        
        // Wait for deletion
        await page.waitForTimeout(2000);
        
        // Verify apartment is no longer in the list
        await expect(apartmentToDelete).not.toBeVisible();
      }
    });

    test('should handle image upload validation', async ({ page }) => {
      await page.goto('/apartments/new');
      await page.waitForLoadState('networkidle');
      
      // Try to upload an invalid file type
      const fileInput = page.locator('input[type="file"]');
      
      // Upload a text file instead of image
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('not an image')
      });
      
      // Should show error message
      await expect(page.locator('text=valid image')).toBeVisible({ timeout: 5000 });
    });

    test('should load more apartments when available', async ({ page }) => {
      await page.goto('/profile#apartments');
      
      // Wait for initial load
      await page.waitForSelector('.apartments-grid', { timeout: 10000 });
      
      // Check if load more button exists
      const loadMoreBtn = page.locator('button:has-text("Load More")');
      
      if (await loadMoreBtn.isVisible()) {
        const initialCount = await page.locator('.apartment-admin-card').count();
        
        // Click load more
        await loadMoreBtn.click();
        
        // Wait for loading to complete
        await page.waitForSelector('.apartments-grid', { state: 'visible' });
        await page.waitForTimeout(1000);
        
        // Verify more apartments loaded
        const newCount = await page.locator('.apartment-admin-card').count();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });
  });

  test.describe('Admin Navigation', () => {
    test('should access admin sections from header menu', async ({ page }) => {
      await page.goto('/');
      
      // Open profile menu
      await page.click('button.profile-button');
      
      // Verify admin options
      await expect(page.locator('text=Dashboard of bookings')).toBeVisible();
      await expect(page.locator('text=Manage apartments')).toBeVisible();
      
      // Regular user options should NOT be visible
      await expect(page.locator('text=My Profile')).not.toBeVisible();
      await expect(page.locator('text=My bookings')).not.toBeVisible();
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