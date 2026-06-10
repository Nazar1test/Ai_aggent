import type { Page } from '@playwright/test';

export const BASE_URL = process.env.ELITEA_BASE_URL || 'https://next.elitea.ai';
export const AGENTS_MENU_PATH = '/agents';

const usernameSelector = 'input[name="username"], input[name="email"], input[type="email"]';
const passwordSelector = 'input[name="password"], input[type="password"]';
const loginButtonSelector = 'button:has-text("Sign In"), button:has-text("Log in"), button:has-text("Login")';

export async function loginToAgentApp(page: Page) {
  await page.goto(BASE_URL);
  if (await page.locator(usernameSelector).count() > 0 && await page.locator(passwordSelector).count() > 0) {
    const username = process.env.ELITEA_USERNAME || 'YOUR_USERNAME';
    const password = process.env.ELITEA_PASSWORD || 'YOUR_PASSWORD';
    await page.fill(usernameSelector, username);
    await page.fill(passwordSelector, password);
    await page.click(loginButtonSelector);
  }
}

export async function openAgentsMenu(page: Page) {
  await page.goto(`${BASE_URL}${AGENTS_MENU_PATH}`);
  await page.waitForLoadState('networkidle');
}
