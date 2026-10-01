const { test } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');

test.describe('Biller Creation', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })

    test('COU file Upload Reconciliation', async ({ reconciliation }) => {

        await reconciliation.openCOUReconciliationMenu();
        await reconciliation.enterCustomDateRange();
        await reconciliation.selectChannelType('All');     
        await reconciliation.COUuploadFile();
        await reconciliation.couFileUpload();
        await page.pause();
    })
    test('COU Reconciliation History', async ({ reconciliation }) => {

        await reconciliation.openCOUReconciliationMenu();
        await reconciliation.historyBtnClick();
    })
 
})