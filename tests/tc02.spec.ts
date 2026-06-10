import { test, expect } from '@playwright/test';

test('TC02 - verify EPAM KB login form appears for test case access', async ({ page }) => {
  await page.goto('https://kb.epam.com/display/EPMXYZ/Test+Cases');
  await expect(page.locator('input[type="text"], input[type="email"], input[name="username"], input[name="login"]')).toHaveCount(1);
  await expect(page.locator('input[type="password"], input[name="password"]')).toHaveCount(1);
  // TODO: replace this with the actual TC02 assertions for the target test case.
});
