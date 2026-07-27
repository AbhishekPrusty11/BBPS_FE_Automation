const { test, expect } = require('@playwright/test')

test('Biller Onboard', async ({ page }) => {

    await expect(page.getByText('Complete Configuration')).toBeVisible();
    await page.getByRole('button', { name: 'Start Now' }).click();
    await page.getByRole('button',{name:'submit'}).click();
    



})