import { expect, type Locator, type Page } from '@playwright/test';

export type AgentFormData = {
  name: string;
  description: string;
  context: string;
  tag?: string;
};

export class AgentsPage {
  readonly page: Page;

  // Placeholder locators — adjust these to match the real application later.
  readonly agentsMenu: Locator;
  readonly createAgentButton: Locator;
  readonly agentNameInput: Locator;
  readonly agentDescriptionInput: Locator;
  readonly agentContextInput: Locator;
  readonly agentTagInput: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;
  readonly validationError: Locator;
  readonly tagFilterInput: Locator;
  readonly agentCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agentsMenu = page.locator('[data-testid="agents-menu"]');
    this.createAgentButton = page.locator('[data-testid="create-agent-button"]');
    this.agentNameInput = page.locator('[data-testid="agent-name"]');
    this.agentDescriptionInput = page.locator('[data-testid="agent-description"]');
    this.agentContextInput = page.locator('[data-testid="agent-context"]');
    this.agentTagInput = page.locator('[data-testid="agent-tag"]');
    this.saveButton = page.locator('[data-testid="agent-save"]');
    this.successToast = page.locator('[data-testid="toast-success"]');
    this.validationError = page.locator('[data-testid="validation-error"]');
    this.tagFilterInput = page.locator('[data-testid="agent-tag-filter"]');
    this.agentCards = page.locator('[data-testid="agent-card"]');
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/agents`);
    await expect(this.agentsMenu).toBeVisible();
  }

  async openCreateAgentForm() {
    await this.createAgentButton.click();
  }

  async fillAgentForm(data: AgentFormData) {
    await this.agentNameInput.fill(data.name);
    await this.agentDescriptionInput.fill(data.description);
    await this.agentContextInput.fill(data.context);

    if (data.tag) {
      await this.agentTagInput.fill(data.tag);
    }
  }

  async saveAgent() {
    await this.saveButton.click();
  }

  async assertSuccessMessage() {
    await expect(this.successToast).toBeVisible();
  }

  async assertValidationMessage() {
    await expect(this.validationError).toBeVisible();
  }

  async filterByTag(tag: string) {
    await this.tagFilterInput.fill(tag);
    await this.tagFilterInput.press('Enter');
  }
}
