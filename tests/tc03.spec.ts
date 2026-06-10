import { test, expect } from '@playwright/test';
import { loginToAgentApp, openAgentsMenu } from './helpers';

test('TC03 - Filter Agents by tags', async ({ page }) => {
  await loginToAgentApp(page);
  await openAgentsMenu(page);

  await page.fill('input[placeholder="Tag"], input[placeholder="Search tags"], input[name="tag"], input[name="tags"]', 'Feature');
  await page.press('input[placeholder="Tag"], input[placeholder="Search tags"], input[name="tag"], input[name="tags"]', 'Enter');

  await expect(page.locator('text=Feature')).toBeVisible();
  await expect(page.locator('text=No agents found')).not.toBeVisible();
});
