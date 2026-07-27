const Credentials = require('../Utils/testData.json');
const BillerDetails = require('../Utils/BillerDetails.json');
const { test, expect, request } = require('../Pages/Hooks')


const scenario = BillerDetails[0];

test(`Create Biller - ${scenario.type} Details`, async ({ page }) => {
    await page.getByText('Biller', { exact: true }).click();
    await page.getByText('Create New Biller', { exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('https://bob-bbps-admin-stage.iserveu.online/admin/billers/create-new-biller');



    await page.getByPlaceholder('Enter Biller Name').fill(scenario.data['Biller Name']);
    await page.getByPlaceholder('Enter BBPS Biller ID').fill(scenario.data['Biller Id']);
    await page.getByText('Select').click();
    await page.getByText('Select').waitFor();
    await page.locator(`text=${scenario.data['Category']}`).click();


    // Fill remaining fields
    await page.getByPlaceholder('Enter TAN Number').fill(scenario.data['TAN Number']);
    await page.getByPlaceholder('Enter GSTIN').fill(scenario.data['GST Number']);
    await page.getByPlaceholder('Enter PIN Code').fill(scenario.data['PIN Code']);
    await page.getByPlaceholder('Enter Address').fill(scenario.data['Address']);
    await page.getByPlaceholder('Enter First Name').fill(scenario.data['First Name']);
    await page.getByPlaceholder('Enter Last Name').fill(scenario.data['Last Name']);
    await page.getByPlaceholder('Enter Mobile Number').fill(scenario.data['Mobile Number']);
    await page.getByPlaceholder('Enter Email ID').fill(scenario.data['Email ID']);
    await page.getByPlaceholder('Enter Account Holder Name').fill(scenario.data['Account Holder Name']);
    await page.getByPlaceholder('Enter Bank Name').fill(scenario.data['Bank Name']);
    await page.getByPlaceholder('Enter Account Number').fill(scenario.data['Account Number']);
    await page.getByPlaceholder('Enter Bank IFSC').fill(scenario.data['Bank IFSC']);


    // Deemed Acceptance
    await page.getByRole('radio', { name: 'No' }).check();

    await page.getByRole('button', { name: 'Create' }).click();

    await page.getByRole('button', { name: 'Ok' }).click();

    const successmsg = await page.locator('text=The Biller has been created successfully and the credentials have been shared via the registered email ID')

    await expect(successmsg).toBeVisible();
});



