class COUReportsPage {

    constructor(page) {
        this.page = page;

        // Report Center
        this.reportCenterButton = page.getByRole('button', { name: 'Report Center' });

        this.couReport = page.getByText('COU Report');

        // Tabs
        this.periodicTab = page.getByRole('tab', { name: 'Periodic' });

        this.customTab = page.getByRole('tab', { name: 'Custom' });

        this.combinationSearchTab = page.getByRole('tab', { name: 'Combination Search' });

        // Periodic report
        this.dateRadio = page.getByRole('radio', { name: 'Date' });

        this.monthRadio = page.getByRole('radio', { name: 'Month' });

        this.datePicker = page.getByRole('button', {
            name: /Choose date/
        });

        this.monthPicker = page.getByRole('button', {
            name: /Choose date, selected date is/
        });

        // Report type
        this.reportType = page.locator('#reportType');

        this.couTransactionReport = page.getByRole('option', {
            name: 'COU Transaction Report'
        });

        // Channel type
        this.channelType = page.locator('#channelType');

        this.allChannel = page.getByRole('option', {
            name: 'ALL'
        });

        // Combination Search
        this.combinationDatePicker = page.locator('input[name="date"]').locator('..').getByRole('button');

        this.channelId = page.locator('#channelId');

        this.internetBankingOption = page.getByRole('option', { name: 'Internet Banking (Post-login)' });

        this.refId = page.getByPlaceholder('Enter Ref ID');

        this.transactionRefId = page.getByPlaceholder('Enter Transaction Ref ID');

        // Search
        this.searchButton = page.getByRole('button', {
            name: 'Search'
        });

        // Loader
        this.loader = page.locator('.zoom-animation');
    }


    // ==============================
    // Common Methods
    // ==============================

    async openReportCenter() {
        await this.reportCenterButton.click();
    }


    async openCOUReport() {
        await this.couReport.click();

        await this.page.getByText('COU Report').first().waitFor({ state: 'visible' });

        await this.loader.waitFor({ state: 'hidden', timeout: 15000 });
    }


    // ==============================
    // Custom Reports
    // ==============================

    async openCustomTab() {
        await this.customTab.click();
    }


    async selectReportType() {
        await this.reportType.click();
        await this.couTransactionReport.click();
    }


    async selectChannelType() {
        await this.channelType.click();
        await this.allChannel.click();
    }


    // ==============================
    // Periodic Reports
    // ==============================

    async openPeriodicTab() {
        await this.periodicTab.click();
    }


    async selectDateRadio() {
        await this.dateRadio.click();
    }


    async selectMonthRadio() {
        await this.monthRadio.click();
    }


    async openDatePicker() {
        await this.datePicker.click();
    }


    async selectDate(date) {
        await this.page
            .getByRole('gridcell', { name: date.toString() })
            .click();
    }


    async openMonthPicker() {
        await this.monthPicker.click();
    }


    async selectMonth(month) {
        await this.page
            .getByRole('radio', { name: month })
            .click();
    }


    // ==============================
    // Combination Search
    // ==============================

    async openCombinationSearchTab() {
        await this.combinationSearchTab.click();
    }


    async openCombinationDatePicker() {
        await this.combinationDatePicker.click();
    }


    async selectCombinationDate(date) {
        await this.page
            .getByRole('gridcell', { name: date.toString() })
            .click();
    }


    async selectChannel(channelName) {
        await this.channelId.click();

        await this.page
            .getByRole('option', { name: channelName })
            .click();
    }


    async enterReferenceId(refId) {
        await this.refId.fill(refId);
    }


    async enterTransactionReferenceId(transactionRefId) {
        await this.transactionRefId.fill(transactionRefId);
    }


    // ==============================
    // Search
    // ==============================

    async clickSearch() {
        await this.searchButton.click();
    }


    // ==============================
    // Complete Flows
    // ==============================

    async navigateToCOUReports() {
        await this.openReportCenter();
        await this.openCOUReport();
    }


    async searchPeriodicReportByDate(date) {

        await this.openPeriodicTab();

        await this.selectDateRadio();

        await this.openDatePicker();

        await this.selectDate(date);

        await this.selectReportType();

        await this.selectChannelType();

        await this.clickSearch();
    }


    async searchPeriodicReportByMonth(month) {

        await this.openPeriodicTab();

        await this.selectMonthRadio();

        await this.openMonthPicker();

        await this.selectMonth(month);

        await this.selectReportType();

        await this.selectChannelType();

        await this.clickSearch();
    }


    async performCombinationSearch(date,channel,refId,transactionRefId) {

        await this.openCombinationSearchTab();

        await this.openCombinationDatePicker();

        await this.selectCombinationDate(date);

        await this.selectChannel(channel);

        await this.enterReferenceId(refId);

        await this.enterTransactionReferenceId(transactionRefId);

        await this.clickSearch();
    }
}

module.exports = {COUReportsPage};