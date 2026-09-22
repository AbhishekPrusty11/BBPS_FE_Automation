const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');


test.describe('BOU Reports', () => {
    // test.describe.configure({ mode: 'parallel' });
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })


    // test('Custom Reports', async ({ page, bouReports }) => {

    //     await bouReports.openReportCenter();
    //     await bouReports.openBOUReport();
    //     await bouReports.openCustomTab();
    //     await bouReports.enterCustomDateRange();
    //     await bouReports.enterBillerUsername("SATYA1234");
    //     await bouReports.selectBiller();
    //     await bouReports.selectReportType();
    //     await bouReports.search();


    // })

    // test('Periodic Reports', async ({ page, bouReports }) => {

    //     // const bouReportsPage = new BOUReportsPage(page);
    //     await bouReports.openReportCenter();
    //     await bouReports.openBOUReport();
    //     await bouReports.openPeriodicTab();
    //     await bouReports.selectPeriodicRange();
    //     await bouReports.selectReportType();
    //     await bouReports.enterBillerUsername("SATYA1234");
    //     await bouReports.selectBiller();
    //     await bouReports.search();
    //     await page.pause();

    // })

    test('Combination Search', async ({ page, bouReports }) => {

        await bouReports.openReportCenter();
        await bouReports.openBOUReport();
        await bouReports.openCombinationSearchTab();
        await bouReports.enterCustomStartDate();
        await bouReports.enterReferenceId("5646476576");
        await bouReports.enterBillerUsername("SATYA1234");
        await bouReports.selectBiller();
        await bouReports.search();
        await page.pause();

        

    })



});



