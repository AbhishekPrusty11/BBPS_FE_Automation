const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const creatBiller= require('../Fixtures/testData/CreateBiller.json');


test.describe('BOU Reports', () => {
  
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })

      const scenario = creatBiller[0];

    test('Biiler List',async({page})=>{
        await page.getByText('Biller', { exact: true }).click();
        await page.locator('.zoom-animation').waitFor({ state: 'hidden', timeout: 30000 });
        await page.getByText('Biller List', { exact: true }).click();
        await page.getByPlaceholder('Search here....').fill('abcd xyz')
        await page.locator('[data-field="action"] button').first().click();
        await page.getByText('Deactivate').click();
        await page.pause();


    })

})