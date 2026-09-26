const BillerDetails = require('../Fixtures/testData/CreateBiller.json');
const { test, expect } = require('../Fixtures/customFixtures');
const { setupAuth } = require('../Pages/Hooks')

// Setup auth for Maker role — this spec creates billers (needs Maker privileges)

test.describe('Biller Creation', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })

    const scenario = BillerDetails[0];

    test(`Create Biller - ${scenario.type} Details`, async ({ page, createbiller }) => {

        await createbiller.openCreateBiller();
        await createbiller.fillBillerDetails(scenario.data);
        await createbiller.createBiller();
        await createbiller.verifyCreationSuccess();

    });

})

