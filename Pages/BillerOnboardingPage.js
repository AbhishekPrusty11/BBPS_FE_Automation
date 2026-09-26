'use strict';

const path = require('path');
const { expect } = require('@playwright/test');

class BillerOnboardingPage {
    constructor(page) {
        this.page = page;
        this.completeConfigurationDialog = page.getByRole('dialog').filter({ hasText: 'Complete Configuration' });
        this.completeConfigurationText = page.getByText('Complete Configuration');
        this.startNowButton = this.completeConfigurationDialog.getByRole('button', { name: 'Start Now' });
        this.basicDetailsHeading = page.getByText('Basic Details');

        // Logo upload
        this.logoUpload = page.locator('input[type="file"]').first();

        // Basic Details fields
        // this.billerNameInput = page.getByPlaceholder('Test Biller').or(page.getByPlaceholder('Enter Biller Name'));
        this.billerLegalNameInput = page.getByPlaceholder('Enter Biller Legal Name');
        this.billerCategoryInput = page.locator('input').filter({ hasText: 'agent collection' }).first();
        this.gstinInput = page.getByPlaceholder('Enter GSTIN');
        this.tanNumberInput = page.getByPlaceholder('Enter TAN Number').or(page.getByPlaceholder('Enter TAN'));
        this.uaAadhaarInput = page.getByPlaceholder('Enter UA Aadhaar');
        this.rocUinInput = page.getByPlaceholder('Enter ROC UIN');
        this.billerConfigText = page.getByText('Biller Configuration');

        // Registered Address fields
        this.registeredStateDropdown = page.getByLabel('State').first();
        this.registeredDistrictDropdown = page.getByLabel('District').first();

        // Communication Address checkbox       
        this.sameAsRegisteredCheckbox = page.getByRole('checkbox', { name: /Same as Registered address/i });
        this.saveAndContinueButton = page.getByRole('button', { name: 'Save & Continue' });


        //Biller config
        // this.offlineRadioBtn = page.getByLabel('radio',{name:'Offline'});
        this.offlineRadioBtn = page.locator('label', { hasText: 'Offline' });

        //POC Details
        this.hodName = page.getByPlaceholder('Enter HOD POC Name');
        this.pocEmail = page.getByPlaceholder('Enter HOD POC Email');
        this.pocMobile = page.getByPlaceholder('Enter HOD POC Mobile');

        // KYC Details
        this.kycText = page.getByText(/Submit KYC Doc/i);
        this.kycDocNameInput = page.getByPlaceholder('Enter Document Name').first();
        this.uploadDoc = page.locator('input[type="file"]').first();
        this.submitBtn = page.getByRole('button', { name: 'Submit' }).first();

        // Onboarding Success Validation Locators
        this.submitSuccessMsg = page.getByText(/submitted successfully|submit successful/i).first();
        this.onboardingCompletedMsg = page.getByText(/onboarding completed|onboarding complete/i).first();
        this.successMsg = page.getByRole('heading', { name: /submitted successfully|submit successful/i }).or(this.submitSuccessMsg);
    }

    async openBillerOnboarding() {
        await expect(this.completeConfigurationText).toBeVisible();
        await expect(this.completeConfigurationDialog).toBeVisible();
        await expect(this.startNowButton).toBeVisible();
        await expect(this.startNowButton).toBeEnabled();
        await this.startNowButton.scrollIntoViewIfNeeded();
        await this.startNowButton.click();
        // await this.basicDetailsHeading.waitFor({ state: 'visible' });
    }
    async fillBasicDetails(data) {
        // Upload Logo
        if (data.logoFilePath) {
            // const assetPath = this.resolveAssetPath(data.logoFilePath);
            await this.logoUpload.setInputFiles(data.logoFilePath);
        }

        // Fill Biller Legal Name
        await this.billerLegalNameInput.fill(data.billerLegalName);
        await expect(this.billerLegalNameInput).toHaveValue(data.billerLegalName);

        // Fill UA Aadhaar
        await this.uaAadhaarInput.fill(data.uaAadhaar);
        await expect(this.uaAadhaarInput).toHaveValue(data.uaAadhaar);

        // Fill ROC UIN
        await this.rocUinInput.fill(data.rocUin);
        await expect(this.rocUinInput).toHaveValue(data.rocUin);

        // Fill Registered Address

        if (data.registeredState) {
            await this.registeredStateDropdown.click();
            await this.page.getByText(data.registeredState).click();
        }

        if (data.registeredDistrict) {
            await this.registeredDistrictDropdown.click();
            await this.page.getByText(data.registeredDistrict).click();
        }
        await this.sameAsRegisteredCheckbox.check();

    }

    async saveAndContinue() {
        await expect(this.saveAndContinueButton).toBeVisible();
        await this.saveAndContinueButton.click();
        await this.page.waitForLoadState('networkidle');

    }
    async billerConfig() {
        await expect(this.billerConfigText).toBeVisible();
        console.log('Biller Configuration page is visible');
        await expect(this.offlineRadioBtn).toBeEnabled();
        await this.offlineRadioBtn.click();
        await expect(this.offlineRadioBtn).toBeChecked();
        await this.saveAndContinue();

    }

    async HODdetails(data) {
        await this.hodName.fill(data.hodName);
        await this.pocEmail.fill(data.pocEmail);
        await this.pocMobile.fill(data.pocMobile);
        await this.saveAndContinue();
    }

    async enterFirstDocumentName(docName) {
        const docInputs = this.page.getByPlaceholder('Enter Document Name');
        await expect(docInputs.first()).toBeVisible();
        await this.kycDocNameInput.fill(docName);
        await expect(this.kycDocNameInput).toHaveValue(docName);
    }

    async kycDetails(data) {
        await this.kycText.waitFor({ state: 'visible' });
        await this.enterFirstDocumentName(data.kycDocName);
        if (data.kycFilePath) {
            await this.uploadDoc.setInputFiles(data.kycFilePath);
        }
        await expect(this.submitBtn).toBeEnabled();
        await this.submitBtn.click();
    }

    async submitKycDocuments() {
        await expect(this.submitBtn).toBeEnabled();
        await this.submitBtn.click();
    }

    async verifyKycSubmissionSuccess() {
        const submitSuccess = this.page.getByRole('heading', { name: /submitted successfully|submit successful/i })
            .or(this.page.getByText(/submitted successfully|submit successful/i))
            .first();

        // const onboardingCompleted = this.page.getByText(/onboarding completed|onboarding complete/i)
        //     .or(this.page.getByRole('heading', { name: /onboarding completed|onboarding complete/i }))
        //     .first();

        await expect(submitSuccess).toBeVisible({ timeout: 15000 });
        // await expect(onboardingCompleted).toBeVisible({ timeout: 15000 });
    }

    async OnboardingsuccessMessage() {
        await this.verifyKycSubmissionSuccess();
        console.log('Onboarding successful message and completion validated successfully');
    }

}

module.exports = { BillerOnboardingPage };