import { test, expect } from '@playwright/test';

test('EPAM: Services -> Explore Our Client Work leads to Client Work page', async ({ page }) => {
  // Start from EPAM home page
  await page.goto('https://www.epam.com/');

  // Hover the Services menu to reveal the submenu and click the desired link
  const servicesLink = page.getByRole('link', { name: 'Services' });
  await servicesLink.waitFor({ state: 'visible', timeout: 10000 });
  await servicesLink.hover();

  const exploreClientWork = page.getByRole('link', { name: 'Explore Our Client Work' });
  await exploreClientWork.waitFor({ state: 'visible', timeout: 10000 });
  await exploreClientWork.click();

  // Verify the destination page contains the expected text
  await expect(page.getByText('Client Work')).toBeVisible();
});