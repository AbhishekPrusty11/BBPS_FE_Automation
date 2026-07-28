'use strict';

const { expect } = require('@playwright/test');

class BillerOnboardingPage {
    constructor(page) {
        this.page = page;
        this.completeConfigurationText = page.getByText('Complete Configuration');
        this.startNowButton = page.getByRole('button', { name: 'Start Now' });
        this.basicDetailsHeading = page.getByText('Basic Details');

        // Logo upload
        this.logoUpload = page.locator('input[type="file"]').first();

        // Basic Details fields
        this.billerNameInput = page.getByPlaceholder('Test Biller').or(page.getByPlaceholder('Enter Biller Name'));
        this.billerLegalNameInput = page.getByPlaceholder('Enter Biller Legal Name');
        this.billerCategoryInput = page.locator('input').filter({ hasText: 'agent collection' }).first();
        this.gstinInput = page.getByPlaceholder('Enter GSTIN');
        this.tanNumberInput = page.getByPlaceholder('Enter TAN Number').or(page.getByPlaceholder('Enter TAN'));
        this.uaAadhaarInput = page.getByPlaceholder('Enter UA Aadhaar');
        this.rocUinInput = page.getByPlaceholder('Enter ROC UIN');
        this.bbpsBillerIdInput = page.getByPlaceholder('Enter BBPS Biller ID').or(page.locator('input').filter({ hasText: 'TEST7896' }).first());

        // Registered Address fields
        this.registeredCountryDropdown = page.locator('select').filter({ hasText: 'India' }).first();
        this.registeredStateDropdown = page.locator('select').filter({ hasText: 'Search' }).nth(0);
        this.registeredDistrictDropdown = page.locator('select').filter({ hasText: 'Search' }).nth(1);
        this.registeredPinCodeInput = page.getByPlaceholder('Enter PIN Code').or(page.locator('input').filter({ hasText: '751024' }).first());
        this.registeredAddressInput = page.getByPlaceholder('Enter Address').or(page.locator('input').filter({ hasText: 'Patia,bbsr' }).first());

        // Communication Address checkbox
        this.sameAsRegisteredCheckbox = page.getByRole('checkbox', { name: /Same as Registered address/i });

        // Communication Address fields
        this.communicationCountryDropdown = page.locator('select').filter({ hasText: 'India' }).nth(1);
        this.communicationStateDropdown = page.locator('select').filter({ hasText: 'Select' }).nth(0);
        this.communicationDistrictDropdown = page.locator('select').filter({ hasText: 'Select' }).nth(1);
        this.communicationPinCodeInput = page.getByPlaceholder('Enter PIN Code').nth(1);
        this.communicationAddressUpload = page.locator('input[type="file"]').nth(1);

        this.saveAndContinueButton = page.getByRole('button', { name: 'Save & Continue' });
    }

    async openBillerOnboarding() {
        await expect(this.completeConfigurationText).toBeVisible();
        await this.startNowButton.click();
        await this.basicDetailsHeading.waitFor({ state: 'visible' });
    }

    async fillBasicDetails(data) {
        // Upload Logo
        if (data.logoFilePath) {
            await this.logoUpload.setInputFiles(data.logoFilePath);
        }

        // Fill Biller Name
        await this.billerNameInput.fill(data.billerName);
        await expect(this.billerNameInput).toHaveValue(data.billerName);

        // Fill Biller Legal Name
        await this.billerLegalNameInput.fill(data.billerLegalName);
        await expect(this.billerLegalNameInput).toHaveValue(data.billerLegalName);

        // Select Biller Category
        await this.billerCategoryInput.click();
        await this.page.getByText(data.billerCategory).click();

        // Fill GSTIN
        await this.gstinInput.fill(data.gstin);
        await expect(this.gstinInput).toHaveValue(data.gstin);

        // Fill TAN Number
        await this.tanNumberInput.fill(data.tanNumber);
        await expect(this.tanNumberInput).toHaveValue(data.tanNumber);

        // Fill UA Aadhaar
        await this.uaAadhaarInput.fill(data.uaAadhaar);
        await expect(this.uaAadhaarInput).toHaveValue(data.uaAadhaar);

        // Fill ROC UIN
        await this.rocUinInput.fill(data.rocUin);
        await expect(this.rocUinInput).toHaveValue(data.rocUin);

        // Fill BBPS Biller ID
        await this.bbpsBillerIdInput.fill(data.bbpsBillerId);
        await expect(this.bbpsBillerIdInput).toHaveValue(data.bbpsBillerId);

        // Fill Registered Address
        if (data.registeredState) {
            await this.registeredStateDropdown.click();
            await this.page.getByText(data.registeredState).click();
        }

        if (data.registeredDistrict) {
            await this.registeredDistrictDropdown.click();
            await this.page.getByText(data.registeredDistrict).click();
        }

        await this.registeredPinCodeInput.fill(data.registeredPinCode);
        await expect(this.registeredPinCodeInput).toHaveValue(data.registeredPinCode);

        await this.registeredAddressInput.fill(data.registeredAddress);
        await expect(this.registeredAddressInput).toHaveValue(data.registeredAddress);

        // Handle Communication Address
        if (data.sameAsCommunication) {
            await this.sameAsRegisteredCheckbox.check();
            await expect(this.sameAsRegisteredCheckbox).toBeChecked();
        } else {
            // Fill Communication Address fields if not same as registered
            if (data.communicationState) {
                await this.communicationStateDropdown.click();
                await this.page.getByText(data.communicationState).click();
            }

            if (data.communicationDistrict) {
                await this.communicationDistrictDropdown.click();
                await this.page.getByText(data.communicationDistrict).click();
            }

            await this.communicationPinCodeInput.fill(data.communicationPinCode);
            await expect(this.communicationPinCodeInput).toHaveValue(data.communicationPinCode);

            if (data.communicationAddress) {
                await this.communicationAddressUpload.setInputFiles(data.communicationAddress);
            }
        }
    }

    async saveAndContinue() {
        await expect(this.saveAndContinueButton).toBeVisible();
        await this.saveAndContinueButton.click();
        await this.page.waitForLoadState('networkidle');
    }
}

module.exports = { BillerOnboardingPage };