Automated Playwright Test: EPAM Client Work Navigation

This PR adds a Playwright test that:

1. Navigates to https://www.epam.com/
2. Clicks the "Services" link in the header
3. Clicks "Explore Our Client Work"
4. Asserts that the resulting page contains the text "Client Work"

Commit message: feat: add playwright test for client work navigation