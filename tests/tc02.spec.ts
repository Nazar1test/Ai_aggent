import { test, expect } from '@playwright/test';
import { loginToAgentApp, openAgentsMenu } from './helpers';

test('TC02 - Create Agent skipping mandatory fields', async ({ page }) => {
  await loginToAgentApp(page);
  await openAgentsMenu(page);

  await page.click('button:has-text("+ Agent"), button:has-text("Add Agent"), button:has-text("Create Agent")');
  await page.fill('textarea[name="description"], textarea[placeholder="Description"]', 'Test Description');
  await page.fill('textarea[name="context"], textarea[placeholder="Context"]', 'Test Context');
  await page.click('button:has-text("Save")');

  await expect(page.locator('body')).toContainText(/mandatory|required|missing/i);
});
