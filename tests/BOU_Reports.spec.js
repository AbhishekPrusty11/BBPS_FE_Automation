const { test, expect } = require('../Fixtures/customFixtures/pageFixtures');
const { setupAuth } = require('../Pages/Hooks');
const BillerData = require('../Fixtures/testData/BillerOnboard.json');


// test.describe.configure({ mode: 'parallel' });

test.describe('BOU Reports', () => {
    test.describe.configure({ mode: 'parallel' });
    test.beforeEach(async ({ page }) => {
        await setupAuth(page, 'Maker')
    })



    test('Custom Reports', async ({ page }) => {
        await page.getByRole('button', { name: 'Report Center' }).click();
        await page.getByText('BOU Report').click();
        await expect(page.getByText('BOU Report').first()).toBeVisible();
        await page.locator('.zoom-animation').waitFor({ state: 'hidden', timeout: 15000 });
        await expect(page.getByRole('tab', { name: 'Custom' })).toBeVisible();
        await page.getByRole('tab', { name: 'Custom' }).click();

        // Start Date & End Date

        const today = new Date();

        const day = String(today.getDate() - 1).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        const yesterdayDate = `${day}/${month}/${year}`;

        const dateInputs = page.getByRole('textbox', { name: 'DD/MM/YYYY' });

        await dateInputs.nth(0).fill(yesterdayDate);
        await dateInputs.nth(1).fill(yesterdayDate);

        const billerUsername = page.getByRole('combobox', { name: 'Type Biller Username' });

        await billerUsername.fill('SATYA1234');
        await page.getByRole('option', { name: 'SATYA RANJAN SATYA1234 (9861342205)' }).click();
        // await page.getByRole('combobox', { name: 'Report Type' }).click();
        await page.getByRole('combobox', { name: 'Select Type' }).click();
        await page.getByRole('option', { name: 'BOU Transaction Report' }).click();
        await page.getByRole('button', { name: 'Search' }).click();
        await page.pause()

    })

    test('Periodic Reports', async ({ page }) => {

        await page.getByRole('button', { name: 'Report Center' }).click();
        await page.getByText('BOU Report').click();
        await expect(page.getByText('BOU Report').first()).toBeVisible();
        await page.locator('.zoom-animation').waitFor({ state: 'hidden', timeout: 15000 });
        await expect(page.getByRole('tab', { name: 'Periodic' })).toBeVisible();
        await page.getByRole('tab', { name: 'Periodic' }).click();
        await page.getByRole('combobox', { name: 'Select Periodic' }).click();
        await page.getByRole('option', { name: 'Last 7 days' }).click();
        await page.getByRole('combobox', { name: 'Select Type' }).click();
        await page.getByRole('option', { name: 'BOU Transaction Report' }).click();

        const billerUsername = page.getByRole('combobox', { name: 'Type Biller Username' });

        await billerUsername.fill('SATYA1234');
        await page.getByRole('option', { name: 'SATYA RANJAN SATYA1234 (9861342205)' }).click();
        await page.getByRole('button', { name: 'Search' }).click();
        await page.pause();

    })

    test('Combination Search', async ({ page }) => {

        await page.getByRole('button', { name: 'Report Center' }).click();
        await page.getByText('BOU Report').click();
        await expect(page.getByText('BOU Report').first()).toBeVisible();
        await page.locator('.zoom-animation').waitFor({ state: 'hidden', timeout: 15000 });
        await expect(page.getByRole('tab', { name: 'Combination Search' })).toBeVisible();
        await page.getByRole('tab', { name: 'Combination Search' }).click();

        
        const today = new Date();
        const day = String(today.getDate() - 1).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();

        const yesterdayDate = `${day}/${month}/${year}`;

        const dateInputs = page.getByRole('textbox', { name: 'DD/MM/YYYY' });

        await dateInputs.nth(0).fill(yesterdayDate);

        await page.getByPlaceholder('Enter Reference ID').fill('5646476576');

        const billerUsername = page.getByRole('combobox', { name: 'Type Biller Username' });

        await billerUsername.fill('SATYA1234');
        await page.getByRole('option', { name: 'SATYA RANJAN SATYA1234 (9861342205)' }).click();
        await page.getByRole('button', { name: 'Search' }).click();
        await page.pause();

    })



});



