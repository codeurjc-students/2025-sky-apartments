import { test, expect } from '@playwright/test';

const apartmentsData = [
  {
    id: 1,
    name: "City Center Loft",
    description: "Modern apartment in the heart of the city",
    address: "123 Main St, Madrid"
  },
  {
    id: 2,
    name: "Beach House",
    description: "Relaxing house near the beach",
    address: "456 Ocean Drive, Valencia"
  }
];

test.describe('Apartment list', () => {
  
  test('show apartment list when there are', async ({ page }) => {
    // Mock with predefined apartments data
    await page.route('**/api/apartments/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apartmentsData)
      });
    });

    await page.goto('http://localhost:4200/');

    await expect(page.locator('#title')).toHaveText('Listado de apartamentos');
    await expect(page.locator('#apartments-list')).toBeVisible();

    const items = page.locator('#apartment-item');
    await expect(items).toHaveCount(apartmentsData.length);

    // Verify that the first apartment link has the correct text
    const firstLink = page.locator('#apartment-link').first();
    await expect(firstLink).toHaveText(apartmentsData[0].name);
  });

  test('show 204 message when there are not apartments', async ({ page }) => {
    // Mock with 204 No Content response
    await page.route('**/api/apartments/', async route => {
      await route.fulfill({
        status: 204,
        contentType: 'application/json',
        body: ''
      });
    });

    await page.goto('http://localhost:4200/');

    await expect(page.locator('#no-apartments-message')).toBeVisible();
    await expect(page.locator('#no-apartments-message')).toHaveText('No hay apartamentos disponibles.');
  });

});

