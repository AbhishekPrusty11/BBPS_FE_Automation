const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');

test.describe('Login Tests', () => {

    test('Maker Login', async ({ page }) => {

        await setupAuth(page, 'Maker');

        await expect(page).toHaveURL(/\/admin\/dashboard/);

    });

    // test('Biller Login', async ({ page }) => {

    //     await setupAuth(page, 'Biller');

    //     await expect(page).toHaveURL(/\/biller\/dashboard/);

    // });

    // test('Checker Login', async ({ page }) => {

    //     await setupAuth(page, 'Checker');

    //     await expect(page).toHaveURL(/\/admin\/dashboard/);

    // });

});