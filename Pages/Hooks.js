const { test, expect } = require('@playwright/test');
const Credentials = require('../Utils/testData.json');
const { LoginAndLogout } = require('../Pages/LoginAndLogout');

test.beforeEach(async ({ page }) => {

    const loginpage = new LoginAndLogout(page);

    await loginpage.goTo();
    await loginpage.validLogin(
        Credentials[0].Username,
        Credentials[0].Password,
        Credentials[0].Otp
    );
});
test.afterEach(async ({ page }) => {

    const loginpage = new LoginAndLogout(page);
    await loginpage.logout();

});
module.exports = { test, expect };