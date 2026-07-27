const { test, expect } = require('@playwright/test')
const Credentials = require('../Utils/testData.json')
const { LoginAndLogout } = require('../Pages/LoginAndLogout')

test('Successful Login', async ({ page }) => {

    const loginpage = new LoginAndLogout(page);
    await loginpage.goTo();
    await loginpage.validLogin(Credentials[0].Username, Credentials[0].Password, Credentials[0].Otp)
    await expect(page).toHaveURL('https://bob-bbps-admin-stage.iserveu.online/admin/dashboard');
    console.log(await page.title())
    await expect(page.getByText('No transactions in last 4 hours.')).waitFor();



})
