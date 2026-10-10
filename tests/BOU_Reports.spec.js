const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');


// const roles = ['Maker', 'Checker','Biller'];

const roles = ['Maker', 'Checker'];

for (const role of roles) {

    test.describe(`BOU Reports - ${role}`, () => {

        test.beforeEach(async ({ page }) => {
            await setupAuth(page, role)
        })

        test.only('Custom Reports', async ({ bouReports }) => {

            await bouReports.openReportCenter();
            await bouReports.openBOUReport();
            await bouReports.openCustomTab();
            await bouReports.enterCustomDateRange();
            await bouReports.enterBillerUsername("SATYA1234");
            await bouReports.selectBiller();
            await bouReports.selectReportType();
            await bouReports.search();
        })

        test('Periodic Reports', async ({ bouReports }) => {

            await bouReports.openReportCenter();
            await bouReports.openBOUReport();
            await bouReports.openPeriodicTab();
            await bouReports.selectPeriodicRange();
            await bouReports.selectReportType();
            await bouReports.enterBillerUsername("SATYA1234");
            await bouReports.selectBiller();
            await bouReports.search();

        })

        test('Combination Search', async ({ bouReports }) => {

            await bouReports.openReportCenter();
            await bouReports.openBOUReport();
            await bouReports.openCombinationSearchTab();
            await bouReports.enterCustomStartDate();
            await bouReports.enterReferenceId("5646476576");
            await bouReports.enterBillerUsername("SATYA1234");
            await bouReports.selectBiller();
            await bouReports.search();

        })

    });

}

