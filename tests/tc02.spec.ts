import { test } from '@playwright/test';
import { AgentsPage } from '../pages/agents.page';

const BASE_URL = process.env.BASE_URL ?? 'https://example.com';

test('TC02 - Create Agent Skipping Mandatory Fields', async ({ page }) => {
  const agentsPage = new AgentsPage(page);

  await agentsPage.goto(BASE_URL);
  await agentsPage.openCreateAgentForm();
  await agentsPage.fillAgentForm({
    name: '',
    description: 'Test Description',
    context: 'Test Context',
  });
  await agentsPage.saveAgent();

  await agentsPage.assertValidationMessage();
});
