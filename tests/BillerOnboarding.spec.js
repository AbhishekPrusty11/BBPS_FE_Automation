const { test, expect } = require('@playwright/test');
const Credentials = require('../Utils/testData.json');
const BillerData = require('../Utils/billerData.json');
const { LoginAndLogout } = require('../Pages/LoginAndLogout');
const { BillerOnboardingPage } = require('../Pages/BillerOnboardingPage');

test('Basic Details onboarding', async ({ page }) => {
    const loginPage = new LoginAndLogout(page);
    const onboardingPage = new BillerOnboardingPage(page);

    await loginPage.goTo();
    await loginPage.validLogin(
        Credentials.newBiller.username,
        Credentials.newBiller.password,
        Credentials.newBiller.otp
    );

    await onboardingPage.openBillerOnboarding();
    await onboardingPage.fillBasicDetails(BillerData.basicDetails);
    await onboardingPage.saveAndContinue();

    await expect(page.getByText('Contact Details')).toBeVisible();
});
