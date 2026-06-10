import { test, expect } from '@playwright/test';

test('TC03 - verify EPAM KB test cases page is protected by authentication', async ({ page }) => {
  await page.goto('https://kb.epam.com/display/EPMXYZ/Test+Cases');
  await expect(page).toHaveURL(/auth|login|signin|access/);
  // TODO: replace this with the actual TC03 flow once the authenticated KB page is available.
});
