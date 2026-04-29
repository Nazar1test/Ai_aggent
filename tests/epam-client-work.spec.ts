import { test, expect } from '@playwright/test';

test('EPAM Client Work Navigation', async ({ page }) => {
  // Start at the EPAM homepage
  await page.goto('https://www.epam.com/');

  // Open the Services menu (user-centric selector)
  await page.getByRole('link', { name: /Services/i }).click();

  // Click the "Explore Our Client Work" link
  await page.getByRole('link', { name: /Explore Our Client Work/i }).click();

  // Verify the destination page contains the expected text
  await expect(page.getByText(/Client Work/i)).toBeVisible();
});