import { test, expect } from '@playwright/test';

const apartmentData = {
  id: 1,
  name: "City Center Loft",
  description: "Modern apartment in the heart of the city",
  address: "123 Main St, Madrid"
};

test.describe('Apartment Detail Page', () => {
  
  test('displays apartment details when apartment exists', async ({ page }) => {
    await page.route('**/api/v1/apartments/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apartmentData)
      });
    });

    await page.goto('http://localhost:4200/apartments/1');

    await expect(page.locator('#apartment-detail')).toBeVisible();
    await expect(page.locator('#apartment-name')).toHaveText(apartmentData.name);
    await expect(page.locator('#apartment-description')).toContainText(apartmentData.description);
  });

  test('shows not found message when apartment does not exist', async ({ page }) => {
    await page.route('**/api/v1/apartments/999', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not found' })
      });
    });

    await page.goto('http://localhost:4200/apartments/999');

    await expect(page.locator('#apartment-not-found')).toBeVisible();
    await expect(page.locator('#apartment-not-found')).toHaveText('No se encontró el apartamento.');
  });

});
