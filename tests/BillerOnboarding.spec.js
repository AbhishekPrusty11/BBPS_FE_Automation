const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');

// Setup auth for Biller role — runs beforeEach test
// setupAuth('Biller'); 

test.describe('Biller Onboarding', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Biller');

    });


    test('Basic Details onboarding', async ({ page, onboardingPage }) => {

        await onboardingPage.openBillerOnboarding();
        await onboardingPage.assertBasicDetailsInputsVisible();
        await onboardingPage.fillBasicDetails(BillerData.basicDetails);
        await onboardingPage.saveAndContinue();

        await expect(page.getByText('Biller Configuration')).toBeVisible();

        await onboardingPage.billerConfig();
        await onboardingPage.HODdetails(BillerData.POCDetails);
        await onboardingPage.saveAndContinue();

        // KYC Details
        await onboardingPage.kycDetails(BillerData.KYCDetails);

        // Onboarding Successfull `Message
        await onboardingPage.OnboardingsuccessMessage();
    });


})