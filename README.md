# AI Aggent Playwright Tests

This repository contains a Playwright test automation skeleton for TC01, TC02, and TC03.

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
- The provided GitHub API token could not be validated in this environment, so remote repository creation or push operations are not complete.
- Replace the placeholder assertions inside `tests/tc01.spec.ts`, `tests/tc02.spec.ts`, and `tests/tc03.spec.ts` with the actual test case steps once authenticated access is available.
