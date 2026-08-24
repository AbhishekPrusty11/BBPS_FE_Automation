const { expect } = require('@playwright/test');

class CreateBillerPage {

    constructor(page) {
        this.page = page;

        // Navigation
        this.billerMenu = page.getByText('Biller', { exact: true });
        this.createNewBiller = page.getByText('Create New Biller', { exact: true });

        // Basic Details
        this.billerName = page.getByPlaceholder('Enter Biller Name');
        this.billerId = page.getByPlaceholder('Enter BBPS Biller ID');
        this.categorySelect = page.getByText('Select', { exact: true });

        // Other details
        this.tanNumber = page.getByPlaceholder('Enter TAN Number');
        this.gstNumber = page.getByPlaceholder('Enter GSTIN');
        this.pinCode = page.getByPlaceholder('Enter PIN Code');
        this.address = page.getByPlaceholder('Enter Address');

        // Contact details
        this.firstName = page.getByPlaceholder('Enter First Name');
        this.lastName = page.getByPlaceholder('Enter Last Name');
        this.mobileNumber = page.getByPlaceholder('Enter Mobile Number');
        this.emailId = page.getByPlaceholder('Enter Email ID');

        // Bank details
        this.accountHolderName = page.getByPlaceholder('Enter Account Holder Name');
        this.bankName = page.getByPlaceholder('Enter Bank Name');
        this.accountNumber = page.getByPlaceholder('Enter Account Number');
        this.bankIFSC = page.getByPlaceholder('Enter Bank IFSC');

        // Deemed Acceptance
        this.deemedAcceptanceNo = page.getByRole('radio', { name: 'No' });

        // Buttons
        this.createButton = page.getByRole('button', { name: 'Create' });

        this.okButton = page.getByRole('button', { name: 'Ok' });

        // Success message
        this.successMessage = page.getByText(
            'The Biller has been created successfully and the credentials have been shared via the registered email ID',
            { exact: true }
        );
    }


    // ==================================================
    // NAVIGATION
    // ==================================================

    async openCreateBiller() {

        await this.billerMenu.click();

        await this.createNewBiller.click();
        await this.page.waitForLoadState('networkidle');

    }


    // ==================================================
    // FILL BILLER DETAILS
    // ==================================================

    async fillBillerDetails(data) {

        await this.billerName.fill(data['Biller Name']);

        await this.billerId.fill(data['Biller Id']);


        // Category

        await this.categorySelect.click();

        await this.page.getByText(data['Category'], { exact: true }).click();


        // Other details

        await this.tanNumber.fill(data['TAN Number']);

        await this.gstNumber.fill(data['GST Number']);

        await this.pinCode.fill(data['PIN Code']);

        await this.address.fill(data['Address']);


        // Contact details

        await this.firstName.fill(data['First Name']);

        await this.lastName.fill(data['Last Name']);

        await this.mobileNumber.fill(data['Mobile Number']);

        await this.emailId.fill(data['Email ID']);


        // Bank details

        await this.accountHolderName.fill(data['Account Holder Name']);

        await this.bankName.fill(data['Bank Name']);

        await this.accountNumber.fill(data['Account Number']);

        await this.bankIFSC.fill(data['Bank IFSC']);


        // Deemed Acceptance

        await this.deemedAcceptanceNo.check();
    }


    // ==================================================
    // CREATE BILLER
    // ==================================================

    async createBiller() {

        await this.createButton.click();

        await this.okButton.click();

    }


    // ==================================================
    // VALIDATE SUCCESS MESSAGE
    // ==================================================

    async verifyCreationSuccess() {

        await expect(this.successMessage).toBeVisible();

    }

}

module.exports = { CreateBillerPage };