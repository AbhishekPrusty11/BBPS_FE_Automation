const { test } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');

const roles = ['Maker', 'Checker'];
for (const role of roles) {
    test.describe(`COU Reconciliation - ${role}`, () => {
        test.beforeEach(async ({ page }) => {
            await setupAuth(page, role)
        })

    test('COU file Upload Reconciliation', async ({ reconciliation }) => {

        await reconciliation.openCOUReconciliationMenu();
        await reconciliation.enterCustomDateRange();
        await reconciliation.selectChannelType('All');     
        await reconciliation.COUuploadFile();
        await reconciliation.couFileUpload();

    })
    test('COU Reconciliation History', async ({ reconciliation }) => {

        await reconciliation.openCOUReconciliationMenu();
        await reconciliation.historyBtnClick();
    })
 
})
}