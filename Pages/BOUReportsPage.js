const { expect } = require("@playwright/test");


class BOUReportsPage {

    constructor(page) {
        this.page = page

        // Navigation
        this.reportCenterButton = page.getByRole("button", {
            name: "Report Center"
        });

        this.bouReport = page.getByText("BOU Report").first();

        // Loading animation
        this.loadingAnimation = page.locator(".zoom-animation");

        // Tabs
        this.customTab = page.getByRole("tab", {name: "Custom"});

        this.periodicTab = page.getByRole("tab", {name: "Periodic"});

        this.combinationSearchTab = page.getByRole("tab", {name: "Combination Search"});

        // Date fields
        this.dateInputs = page.getByRole("textbox", {name: "DD/MM/YYYY"});

        // Biller
        this.billerUsername = page.getByRole("combobox", {
            name: "Type Biller Username"
        });

        this.billerOption = page.getByRole("option", {
            name: "SATYA RANJAN SATYA1234 (9861342205)"
        });

        // Report Type
        this.reportType = page.getByRole("combobox", {
            name: "Select Type"
        });

        this.bouTransactionReport = page.getByRole("option", {
            name: "BOU Transaction Report"
        });

        // Periodic
        this.periodicDropdown = page.getByRole("combobox", {
            name: "Select Periodic"
        });

        this.last7DaysOption = page.getByRole("option", {
            name: "Last 7 days"
        });

        // Combination Search
        this.referenceId = page.getByPlaceholder(
            "Enter Reference ID"
        );

        // Search
        this.searchButton = page.getByRole("button", {name: "Search"});
    }

    async openReportCenter() {
        await this.reportCenterButton.click();
    }

    async openBOUReport() {
        await this.bouReport.click();

        await expect(this.bouReport).toBeVisible();

        await this.loadingAnimation.waitFor({
            state: "hidden",
            timeout: 15000
        });
    }

    async openCustomTab() {
        await expect(this.customTab).toBeVisible();
        await this.customTab.click();
    }

    async openPeriodicTab() {
        await expect(this.periodicTab).toBeVisible();
        await this.periodicTab.click();
    }

    async openCombinationSearchTab() {
        await expect(this.combinationSearchTab).toBeVisible();
        await this.combinationSearchTab.click();
    }

    async getYesterdayDate() {
        const today = new Date();

        const day = String(today.getDate() - 1).padStart(2, "0");
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const year = today.getFullYear();

        return `${day}/${month}/${year}`;
    }

    async enterCustomDateRange() {
        const yesterdayDate = await this.getYesterdayDate();

        await this.dateInputs.nth(0).fill(yesterdayDate);
        await this.dateInputs.nth(1).fill(yesterdayDate);
    }

    async enterCustomStartDate() {
        const yesterdayDate = await this.getYesterdayDate();

        await this.dateInputs.nth(0).fill(yesterdayDate);
    }

    async enterBillerUsername(username) {
        await this.billerUsername.fill(username);
    }

    async selectBiller() {
        await this.billerOption.click();
    }

    async selectReportType() {
        await this.reportType.click();
        await this.bouTransactionReport.click();
    }

    async selectPeriodicRange() {
        await this.periodicDropdown.click();
        await this.last7DaysOption.click();
    }

    async enterReferenceId(referenceId) {
        await this.referenceId.fill(referenceId);
    }

    async search() {
        await this.searchButton.click();
    }

    async verifyCustomTabVisible() {
        await expect(this.customTab).toBeVisible();
    }

    async verifyPeriodicTabVisible() {
        await expect(this.periodicTab).toBeVisible();
    }

    async verifyCombinationSearchTabVisible() {
        await expect(this.combinationSearchTab).toBeVisible();
    }
}

module.exports = { BOUReportsPage };
