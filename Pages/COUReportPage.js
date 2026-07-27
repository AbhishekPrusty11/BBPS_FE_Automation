/**
 * COUReportPage.js
 *
 * Page Object Model for the COU Report page.
 * Encapsulates all locators and reusable interaction/assertion methods.
 *
 * Application : https://cou-report-7084543.ai.studio/
 * Section     : Report Center → COU Report → Combination Search
 *
 * DOM findings (inspected live):
 *   - Date field        : <input id="search-input-date" type="date" />
 *   - Channel dropdown  : <select id="search-input-channel" />  (native HTML select)
 *   - Ref ID field      : <input id="search-input-refid" placeholder="Enter Ref ID" />
 *   - RRN Number field  : <input id="search-input-rrn"   placeholder="Enter RRN Number" />
 *   - Search button     : <button id="search-submit-btn">Search</button>
 *   - Results table     : <div scrollable="true"> wrapping <table>
 *   - Results search box: <input id="table-search-input" placeholder="Search Here" />
 */

const { expect } = require('@playwright/test');

class COUReportPage {
    /**
     * @param {import('@playwright/test').Page} page - Playwright Page instance
     */
    constructor(page) {
        this.page = page;

        // ─── Sidebar Navigation ────────────────────────────────────────────────
        // "Report Center" collapsible menu item in the left sidebar.
        // .first() prevents collision with any breadcrumb/heading text on the page.
        this.reportCenterMenu = page.locator('span', { hasText: 'Report Center' }).first();

        // "COU Report" sub-menu item revealed after expanding Report Center.
        // .first() prevents collision with the COU Report page heading.
        this.couReportMenuItem = page.locator('span', { hasText: 'COU Report' }).first();

        // ─── Page Load Sentinel ────────────────────────────────────────────────
        // The Combination Search tab is visible as soon as the page has rendered.
        // Used as a stable indicator that the COU Report page is fully loaded.
        this.combinationSearchTab = page.locator('#tab-combination');

        // ─── Combination Search Form Fields ───────────────────────────────────
        // Date field — native <input type="date"> with custom display (DD-MM-YYYY).
        // Playwright fills date inputs in YYYY-MM-DD format regardless of display format.
        this.dateInput = page.locator('#search-input-date');

        // Channel ID — native HTML <select> element.
        // Playwright's selectOption() works directly on native selects.
        this.channelSelect = page.locator('#search-input-channel');

        // Ref ID text input.
        this.refIdInput = page.locator('#search-input-refid');

        // RRN Number text input.
        this.rrnNumberInput = page.locator('#search-input-rrn');

        // ─── Search Button ────────────────────────────────────────────────────
        // Primary: ID-based (most stable). Fallback: role + name.
        this.searchButton = page.locator('#search-submit-btn');

        // ─── Results Area ─────────────────────────────────────────────────────
        // The results table container becomes visible / updates after a search.
        // scrollable="true" is a custom attribute on the wrapper div.
        this.resultsTableContainer = page.locator('[scrollable="true"]');

        // The "Search Here" filter input inside the results card.
        // Waiting for this to be visible confirms the results section has rendered.
        this.tableSearchInput = page.locator('#table-search-input');
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Navigation Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * navigateToCOUReport()
     *
     * Expands the "Report Center" sidebar menu, waits for the "COU Report"
     * sub-menu item to become visible, clicks it, and waits for the COU Report
     * page to be fully loaded.
     */
    async navigateToCOUReport() {
        // Expand "Report Center" in the left sidebar
        await this.reportCenterMenu.click();

        // Wait for the sub-menu item to animate into view
        await this.couReportMenuItem.waitFor({ state: 'visible' });

        // Navigate to the COU Report sub-page
        await this.couReportMenuItem.click();

        // Wait for all network requests triggered by navigation to settle
        await this.page.waitForLoadState('networkidle');

        // Confirm the Combination Search tab is visible — page is fully rendered
        await this.combinationSearchTab.waitFor({ state: 'visible' });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Search Form Interaction Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * selectDate(dateString)
     *
     * Fills the date input field with the given date.
     *
     * The date control is a native `<input type="date">`.
     * Playwright always fills native date inputs using ISO 8601 format (YYYY-MM-DD),
     * regardless of the locale display format shown on screen (DD-MM-YYYY).
     *
     * @param {string} dateString - Date in YYYY-MM-DD format (e.g. '2026-07-03')
     */
    async selectDate(dateString) {
        await this.dateInput.scrollIntoViewIfNeeded();

        // For native <input type="date">, use fill() with ISO format.
        // Playwright converts this internally — the UI shows DD-MM-YYYY.
        await this.dateInput.fill(dateString);

        // Confirm the value was accepted by the input
        await expect(this.dateInput).toHaveValue(dateString);
    }

    /**
     * selectChannel(channelLabel)
     *
     * Selects an option from the Channel ID native <select> dropdown.
     *
     * Uses Playwright's selectOption({ label }) which matches the visible
     * option text — most readable and resistant to value changes.
     *
     * @param {string} channelLabel - The visible text of the option to select
     *                                (e.g. 'All Channels', 'BHIM Baroda Pay UPI')
     */
    async selectChannel(channelLabel) {
        await this.channelSelect.scrollIntoViewIfNeeded();

        // selectOption with label matches by visible option text (case-sensitive)
        await this.channelSelect.selectOption({ label: channelLabel });

        // Confirm the dropdown now shows the selected label
        await expect(this.channelSelect).toHaveValue(
            await this.channelSelect.evaluate(
                (el, label) => [...el.options].find(o => o.text === label)?.value ?? '',
                channelLabel
            )
        );
    }

    /**
     * enterRefId(refId)
     *
     * Clears any existing value and types the Ref ID into the Ref ID input field.
     *
     * @param {string} refId - The reference ID value to enter (e.g. 'REF2026101')
     */
    async enterRefId(refId) {
        await this.refIdInput.scrollIntoViewIfNeeded();

        // clear() + fill() ensures no stale value remains from a previous search
        await this.refIdInput.clear();
        await this.refIdInput.fill(refId);

        await expect(this.refIdInput).toHaveValue(refId);
    }

    /**
     * enterRRNNumber(rrnNumber)
     *
     * Clears any existing value and types the RRN Number into the RRN Number field.
     *
     * @param {string} rrnNumber - The RRN number value to enter (e.g. '12345')
     */
    async enterRRNNumber(rrnNumber) {
        await this.rrnNumberInput.scrollIntoViewIfNeeded();

        await this.rrnNumberInput.clear();
        await this.rrnNumberInput.fill(rrnNumber);

        await expect(this.rrnNumberInput).toHaveValue(rrnNumber);
    }

    /**
     * clickSearch()
     *
     * Asserts the Search button is enabled, then clicks it and waits for
     * the results area to reflect the updated search response.
     *
     * Waits for:
     *   1. The results table container to be visible (confirms the results
     *      section has re-rendered after the API response).
     *   2. Network idle — all XHR/fetch calls from the search API have settled.
     */
    async clickSearch() {
        await this.searchButton.scrollIntoViewIfNeeded();

        // Guard assertion — the button must be enabled before clicking
        await expect(this.searchButton).toBeEnabled();

        // Click Search and concurrently wait for the API response to settle
        await Promise.all([
            this.page.waitForLoadState('networkidle'),
            this.searchButton.click(),
        ]);

        // Confirm the results container is visible — signals the results have loaded
        await this.resultsTableContainer.waitFor({ state: 'visible' });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Orchestration Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * searchCOUReport(searchParams)
     *
     * Orchestrates the complete Combination Search flow:
     *   1. Select Date
     *   2. Select Channel ID
     *   3. Enter Ref ID
     *   4. Enter RRN Number
     *   5. Assert Search button is enabled
     *   6. Click Search
     *   7. Wait for results to load
     *
     * @param {Object} searchParams
     * @param {string} searchParams.date        - ISO date string: 'YYYY-MM-DD'
     * @param {string} searchParams.channelLabel - Visible channel option text
     * @param {string} searchParams.refId        - Reference ID value
     * @param {string} searchParams.rrnNumber    - RRN Number value
     */
    async searchCOUReport({ date, channelLabel, refId, rrnNumber }) {
        // Step 1: Select the date from the date picker
        await this.selectDate(date);

        // Step 2: Select the Channel ID from the dropdown
        await this.selectChannel(channelLabel);

        // Step 3: Enter the Ref ID
        await this.enterRefId(refId);

        // Step 4: Enter the RRN Number
        await this.enterRRNNumber(rrnNumber);

        // Steps 5–7: Assert Search is enabled → click → wait for results
        await this.clickSearch();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Assertion / Verification Methods
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * verifyRRNFieldDisplayed()
     *
     * Validates that the "RRN Number" input field is:
     *   1. Visible on the page
     *   2. Enabled (not disabled / read-only)
     *
     * Scrolls the element into view before asserting to handle off-screen positioning.
     */
    async verifyRRNFieldDisplayed() {
        await this.rrnNumberInput.scrollIntoViewIfNeeded();

        // Assert 1: The RRN Number field is visible
        await expect(this.rrnNumberInput).toBeVisible();

        // Assert 2: The RRN Number field is enabled
        await expect(this.rrnNumberInput).toBeEnabled();
    }

    /**
     * verifySearchResultsLoaded()
     *
     * Asserts that the results section rendered after clicking Search.
     * Checks that the results table container and its internal search input
     * are both visible, confirming the results UI has fully loaded.
     */
    async verifySearchResultsLoaded() {
        // The scrollable results wrapper must be present
        await expect(this.resultsTableContainer).toBeVisible();

        // The table-level search input is rendered only after results load
        await expect(this.tableSearchInput).toBeVisible();
    }
}

module.exports = { COUReportPage };
