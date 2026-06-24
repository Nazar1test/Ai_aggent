import { test } from '@playwright/test';
import { AgentsPage } from '../pages/agents.page';

const BASE_URL = process.env.BASE_URL ?? 'https://example.com';

test('TC03 - Filter Agents by Tags', async ({ page }) => {
  const agentsPage = new AgentsPage(page);

  await agentsPage.goto(BASE_URL);
  await agentsPage.filterByTag('Feature');

  // Placeholder assertion: refine this once real locators/content are known.
  await agentsPage.agentCards.first().waitFor({ state: 'visible' });
});
