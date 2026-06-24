# AI Aggent Playwright Tests

This repository contains a generic Playwright scaffold for automating:

- TC01 — Create Agent with All Mandatory Fields
- TC02 — Create Agent Skipping Mandatory Fields
- TC03 — Filter Agents by Tags

## Structure

- `tests/` — Playwright specs for the three test cases
- `pages/agents.page.ts` — shared page object with placeholder locators
- `playwright.config.ts` — Playwright runtime config

## Setup

1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```

2. Run the tests:
   ```bash
   npm test
   ```

## Notes

- The target page `https://kb.epam.com/display/EPMXYZ/Test+Cases` requires authentication.
- All locators are placeholders and should be replaced with real selectors from the application UI.
- Set `BASE_URL` in the environment before running the tests against the real app.
