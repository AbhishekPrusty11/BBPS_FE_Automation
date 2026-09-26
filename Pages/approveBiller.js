const { expect } = require('@playwright/test');

class ApproveBillerPage {

    constructor(page) {

        this.page = page;

        // Navigation
        this.billerMenu = page.getByText('Biller').first();
        this.billerVerificationMenu = page.getByText('Biller Verification');

        // Biller Verification
        this.searchBox = page.getByPlaceholder('Search here....');
        this.showBillerDetailscol = page.getByText('Show Biller Details')

        //Biller Row
        this.billerRow = page.locator('.MuiDataGrid-row.MuiDataGrid-row--firstVisible').first();

        // Biller Details Dialog
        this.billerDetailsDialog = page.locator('.MuiPaper-elevation.MuiDialog-paper.MuiDialog-paperWidthLg');

        // KYC
        this.kycDocOption = page.getByRole('tab', { name: 'KYC Documents' });

        // Toast
        this.successVerify = page.locator('.Toastify__toast.Toastify__toast--success');

        //approve button
        this.approveBillerText = this.page.getByText('Approve Biller');

        //Spinner
        this.spinner = page.locator('.zoom-animation');

    }


    async openBillerVerification() {

        await this.billerMenu.click();

        await this.billerVerificationMenu.click();
        await this.page.getByText('Biller Verification').waitFor({ state: 'visible', timeout: 15000 });
        await expect(this.searchBox).toBeVisible();
    }


    async searchBiller(data) {

        // await this.spinner.waitFor({ state: 'hidden', timeout: 15000 });
        // await this.searchBox.fill(billerId);
        // const billerRow = this.page.getByRole('row').filter({ hasText: billerId });

        // try {

        //     await expect(billerRow).toHaveCount(1, {timeout: 10000});
        //     // 4. Actually verify that the row exists
        //     const rowCount = await billerRow.count();

        //     console.log(`Matching rows for ${billerId}: ${rowCount}`);

        //     await this.showBillerDetails(billerRow);

        //     return true;

        // } catch(error) {

        //     console.log(`Biller does not exist: ${billerId}`);
        //     console.log('Actual error:', error.message);

        //     return false;
        // }

        await this.spinner.waitFor({ state: 'hidden', timeout: 15000 });

        await this.searchBox.fill(data['Biller Name']);

        const billerRow = this.page.getByRole('row').filter({ hasText: data['Biller Name'] });

        await this.page.waitForTimeout(1000);

        // console.log('Search value:', data['Biller Name']);
        // console.log('Total rows:', await this.page.getByRole('row').count());
        // console.log('Matching rows:', await billerRow.count());

        const rows = this.page.getByRole('row');

        for (let i = 0; i < await rows.count(); i++) {
            console.log(`ROW ${i}:`, await rows.nth(i).innerText()
            );
        }

        await expect(billerRow).toHaveCount(1, { timeout: 10000 });

        await this.showBillerDetails(billerRow);

        return true;

    }


    async showBillerDetails(billerRow) {

        const showDetailsButton = await billerRow.getByRole('button', { name: 'Show Biller Details' });

        await expect(showDetailsButton).toBeVisible();

        await showDetailsButton.click();

        await expect(this.billerDetailsDialog).toBeVisible();
    }

    async openKycDocuments() {

        await expect(this.kycDocOption).toBeVisible()

        await this.kycDocOption.click();

    }

    async ApproveBiller() {
        const approveButton = this.page.getByRole('button', { name: 'Approve' });
        await approveButton.waitFor({ state: 'visible' });
        await approveButton.click();
        await expect(this.approveBillerText).toBeVisible();
        await this.page.getByRole('button', { name: 'Approve' }).click();



    }
}

module.exports = { ApproveBillerPage };