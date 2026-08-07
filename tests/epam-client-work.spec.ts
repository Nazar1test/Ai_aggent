import { test, expect } from '@playwright/test';

test.describe('EPAM navigation tests', () => {
  test('navigate from Services -> Explore Our Client Work and verify Client Work page', async ({ page }) => {
    // Start at EPAM home page
    await page.goto('https://www.epam.com/');

    // Open Services menu - use user-centric selector
    const services = page.getByRole('link', { name: 'Services' });
    await expect(services).toBeVisible();
    await services.click();

    // Click on "Explore Our Client Work"
    const explore = page.getByText('Explore Our Client Work');
    await expect(explore).toBeVisible();
    // Use click via the nearest anchor if the text is inside another element
    await explore.click();

    // Assert the destination page contains "Client Work"
    await expect(page.getByText('Client Work')).toBeVisible();
  });
});