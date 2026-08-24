const { test, expect } = require('@playwright/test');
const Credentials = require('../Fixtures/loginData.json');
const { LoginAndLogout } = require('../Pages/Login');
const { COUReportPage } = require('../Pages/COUReportPage');

// ─── Search Parameters ────────────────────────────────────────────────────────
// Centralised here so test data changes are made in one place.
// NOTE: Playwright fills native date inputs in YYYY-MM-DD (ISO 8601) format.
const SEARCH_PARAMS = {
    date: '2026-07-03',           // Represents: July 3, 2026
    channelLabel: 'All Channels', // Visible text of the dropdown option
    refId: 'REF2026101',          // Reference ID to search for
    rrnNumber: '12345',           // RRN Number to search for
};

// ─── Test Suite ───────────────────────────────────────────────────────────────
test.describe('COU Report — Combination Search', () => {

    /**
     * beforeEach:
     * Navigate to the application before every test case.
     * Login is handled inside individual tests to allow different
     * credential sets in future without modifying the hook.
     */
    test.beforeEach(async ({ page }) => {
        await page.goto('https://cou-report-7084543.ai.studio/');
    });


    // ─── TC_COU_002 ───────────────────────────────────────────────────────────
    test.only('TC_COU_002 — Perform Combination Search and verify results load', async ({ page }) => {

        // ── Step 1: Instantiate page objects ──────────────────────────────────
        const loginPage = new LoginAndLogout(page);
        const couReportPage = new COUReportPage(page);

        // ── Step 2: Login with "biller" credentials ───────────────────────────
        // await loginPage.validLogin(
        //     Credentials.biller.Username,
        //     Credentials.biller.Password,
        //     Credentials.biller.Otp
        // );

        // ── Step 3: Wait for dashboard to fully load after login ───────────────
        // await page.waitForLoadState('networkidle');

        // ── Step 4: Navigate to Report Center → COU Report ────────────────────
        await couReportPage.navigateToCOUReport();

        // ── Step 5: Execute the complete Combination Search flow ───────────────
        // searchCOUReport() performs in sequence:
        //   • selectDate('2026-07-03')           → July 3, 2026
        //   • selectChannel('All Channels')
        //   • enterRefId('REF2026101')
        //   • enterRRNNumber('12345')
        //   • asserts Search button is enabled
        //   • clicks Search
        //   • waits for the results table to render
        await couReportPage.searchCOUReport(SEARCH_PARAMS);

        // ── Step 6: Verify the search results section has loaded ───────────────
        await couReportPage.verifySearchResultsLoaded();
    });

});
