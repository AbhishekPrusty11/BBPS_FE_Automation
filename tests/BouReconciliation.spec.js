const { test } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');

const roles = ['Maker', 'Checker'];
for (const role of roles) {
    test.describe(`BOU Reconciliation - ${role}`, () => {
        test.beforeEach(async ({ page }) => {
            await setupAuth(page, role)
        })

    test('Dates Reconciliation', async ({ page, reconciliation }) => {

        await reconciliation.openBOUReconciliationMenu();
        await reconciliation.enterCustomDateRange();
       
    })
    test('File Upload Reconciliation', async ({ page, reconciliation }) => {

        await reconciliation.openBOUReconciliationMenu();
        await reconciliation.enterCustomDateRange();
        await reconciliation.BOUuploadFile();
        await reconciliation.clkonReconcileBtn();
        
    })
    test('Reconciliation History', async ({ page, reconciliation }) => {
        await reconciliation.openBOUReconciliationMenu();
        await reconciliation.historyBtnClick();
      
    })

})
}