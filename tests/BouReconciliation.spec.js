const { test } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');

test.describe('Biller Creation', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })

    test('Dates Reconciliation', async ({ page, reconciliation }) => {

        await reconciliation.openReconciliationMenu();
        await reconciliation.enterCustomDateRange();
       
    })
    test('File Upload Reconciliation', async ({ page, reconciliation }) => {

        await reconciliation.openReconciliationMenu();
        await reconciliation.enterCustomDateRange();
        await reconciliation.uploadFile();
        await reconciliation.clkonReconcileBtn();
        
    })
    test('Reconciliation History', async ({ page, reconciliation }) => {
        await reconciliation.openReconciliationMenu();
        await reconciliation.historyBtnClick();
      
    })

})