const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');


test.describe('COU Reports', () => {
    // test.describe.configure({ mode: 'parallel' });
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Checker')
    })

    test('Custom Reports', async ({ couReports }) => {

        await couReports.openReportCenter();
        await couReports.openCOUReport();
        await couReports.openCustomTab();

        await couReports.selectReportType();
        await couReports.selectChannelType();
    })

    test('Periodic Reports with Date', async ({ couReports }) => {

        await couReports.navigateToCOUReports();

        await couReports.searchPeriodicReportByDate(14);

    })

    test('Periodic Reports with Month', async ({ couReports }) => {

        await couReports.navigateToCOUReports();

        await couReports.searchPeriodicReportByMonth('Aug');


    })

    test('Combination Search', async ({ couReports }) => {

        await couReports.navigateToCOUReports();

        await couReports.performCombinationSearch(12, 'Internet Banking (Post-login)', '5646476576', '1234567890');

    })



});



