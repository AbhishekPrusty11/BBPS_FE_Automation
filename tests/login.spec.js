const Credentials = require('../Fixtures/testData/loginData.json');
const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');


test('Successful Login', async ({ page,loginpage }) => {

    // const loginpage = new LoginAndLogout(page);

    const Role = 'Biller';

    const user = Credentials[Role];

    await loginpage.goTo();

    await loginpage.validLogin(user.Username,user.Password,user.Otp);

    console.log('Page title:', await page.title());

    await expect(page.getByText('No transactions in last 4 hours.')).toBeVisible();

});