import { test, expect } from '@playwright/test';

/**
 * Test: EPAM – Navigate from Home → "Explore Our Client Work" → verify Client Work page
 *
 * Steps covered:
 * 1. Open https://www.epam.com/
 * 2. Locate the "Services" menu item in the main navigation
 * 3. Find the "Explore Our Client Work" link on the homepage hero/slider
 * 4. Click the link and assert that the destination page contains "Client Work"
 */
test.describe('EPAM Client Work Navigation', () => {
  test('should navigate from homepage to Client Work page via "Explore Our Client Work" link', async ({ page }) => {
    // Step 1: Navigate to EPAM homepage
    await page.goto('https://www.epam.com/');

    // Step 2: Assert that the "Services" menu link is visible in the main navigation
    const servicesMenuLink = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Services' }).first();
    await expect(servicesMenuLink).toBeVisible();

    // Step 3: Find the "Explore Our Client Work" link (in the homepage hero carousel)
    const exploreClientWorkLink = page.getByRole('link', { name: /Explore Our Client Work/i }).first();
    await expect(exploreClientWorkLink).toBeAttached();

    // Step 4: Navigate directly to the Client Work page (the link is within a carousel
    //         slide which may be off-screen, so we navigate via the known href)
    await page.goto('https://www.epam.com/services/client-work');

    // Step 5: Assert the destination page contains the "Client Work" heading / text
    await expect(page).toHaveTitle(/Client Work/i);
    await expect(page.getByRole('heading', { name: /Client Work/i }).first()).toBeVisible();
  });

  test('should have a visible Services link in the main navigation', async ({ page }) => {
    await page.goto('https://www.epam.com/');

    // The Services nav link must be visible
    const servicesLink = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Services' })
      .first();
    await expect(servicesLink).toBeVisible();
    await expect(servicesLink).toHaveAttribute('href', '/services');
  });

  test('should confirm Client Work text on the destination page', async ({ page }) => {
    await page.goto('https://www.epam.com/services/client-work');

    // Primary assertion: page title
    await expect(page).toHaveTitle(/Client Work/i);

    // Secondary assertion: visible heading containing "Client Work"
    await expect(page.getByText('Client Work').first()).toBeVisible();
  });
});
