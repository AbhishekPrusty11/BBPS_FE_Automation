const { test:base, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerDetails = require('../Fixtures/testData/CreateBiller.json');



test.describe('Approve and Reject Biller', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Checker');
    });

    const scenario=BillerDetails[0]

    test('Approve Biller', async ({ page, approvebiller }) => {

        await approvebiller.openBillerVerification();
        await approvebiller.searchBiller(scenario.data);
        await approvebiller.openKycDocuments();
        await approvebiller.ApproveBiller();

    })

})

