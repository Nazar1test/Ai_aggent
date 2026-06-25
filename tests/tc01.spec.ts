import { test, expect } from '@playwright/test';

test('TC01 - Verify EPAM homepage contains Join Our Team Today', async ({ page }) => {
  await page.goto('https://www.epam.com');
  await expect(page.locator('body')).toContainText(/Join Our Team\s+Today/i);
});
