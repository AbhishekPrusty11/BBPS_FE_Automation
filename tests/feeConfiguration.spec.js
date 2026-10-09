const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');

// Setup auth for Biller role — runs beforeEach test
// setupAuth('Biller'); 

test.describe('Biller Onboarding', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Biller');

    });

    test('Fee Configuration', async ({ page }) => {

        
    })
})