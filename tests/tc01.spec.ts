import { test, expect } from '@playwright/test';

test('TC01 - open EPAM KB test cases page', async ({ page }) => {
  await page.goto('https://kb.epam.com/display/EPMXYZ/Test+Cases');
  await expect(page).toHaveTitle(/EPAM|Test Cases|Login|Sign in/);
  // TODO: update this test with the actual TC01 steps after authenticated access is available.
});
