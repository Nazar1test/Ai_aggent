# AI Aggent Playwright Tests

This repository contains Playwright automation for TC01, TC02, and TC03 from the EliteA Agents smoke suite.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```

2. Configure the target environment:
   ```bash
   export ELITEA_BASE_URL=https://next.elitea.ai
   export ELITEA_USERNAME=your_username
   export ELITEA_PASSWORD=your_password
   ```

3. Run the tests:
   ```bash
   npm test
   ```

## Notes

- The tests are configured to use `https://next.elitea.ai` by default.
- `tests/helpers.ts` contains the shared login flow and base URL configuration.
- Selectors are generic placeholders and should be refined against the actual Agents UI.
- If the app uses different field names or buttons, update the selectors in `tests/tc01.spec.ts`, `tests/tc02.spec.ts`, and `tests/tc03.spec.ts`.
