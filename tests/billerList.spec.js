const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const creatBiller= require('../Fixtures/testData/CreateBiller.json');


test.describe('Biller Activation', () => {
  
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })

      const scenario = creatBiller[0];

    test('Biller Activate and Deactivate',async({page,billerlist})=>{
        await billerlist.OpenbillerList();
        await billerlist.searchBiller(scenario.data['Biller Name'])
        await billerlist.clikkDeactivate();

    })

})