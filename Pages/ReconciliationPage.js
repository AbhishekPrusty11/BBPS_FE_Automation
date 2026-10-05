const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

class ReconciliationPage {
    constructor(page) {
        this.page = page;

        this.fromDate = page.getByRole('textbox', { name: 'DD/MM/YYYY' }).nth(0);

        this.toDate = page.getByRole('textbox', { name: 'DD/MM/YYYY' }).nth(1);

        this.chooseDateButtons = page.getByRole('button', { name: 'Choose date' });

        this.submitButton = page.getByRole('button', { name: 'Submit' });
        this.BOUuploadField = page.locator('input[type="file"][accept=".zip"]');
        this.COUuploadField = page.locator('input[type="file"][accept=".txt"]');
        this.reconcileButton = page.getByRole('button', { name: 'Reconcile' });
        this.historyBtn = page.getByRole('button', { name: 'History' })
        this.reconciliationMenu = page.getByText('Reconciliation', { exact: true });
        this.bouReconciliation = page.getByText('BOU Reconciliation', { exact: true });
        this.couReconciliation = page.getByText('COU Reconciliation', { exact: true });
        // Channel type
        this.channelType = page.locator('#mui-component-select-channelType');
        this.COUuploadBtn = page.getByRole('button', {name: 'Upload',exact: true});

    }

    async couFileUpload(){
        await expect(this.COUuploadBtn).toBeVisible();
        await expect(this.COUuploadBtn).toBeEnabled();
        await this.COUuploadBtn.click();
    }

    async selectChannelType(option) {
        await this.channelType.click();

        const listbox = this.page.getByRole('listbox');
        await expect(listbox).toBeVisible();

        await listbox.getByText(option, { exact: true }).click();
    }
    async openBOUReconciliationMenu() {
        await expect(this.reconciliationMenu).toBeVisible();
        await this.reconciliationMenu.click();
        await expect(this.bouReconciliation).toBeVisible();
        await this.bouReconciliation.click();
    }
    async openCOUReconciliationMenu() {
        await expect(this.reconciliationMenu).toBeVisible();
        await this.reconciliationMenu.click();
        await expect(this.couReconciliation).toBeVisible();
        await this.couReconciliation.click();
    }
    async historyBtnClick() {
        await expect(this.historyBtn).toBeVisible();
        await this.historyBtn.click();
    }

    async enterCustomDateRange() {
        const yesterdayDate = await this.getYesterdayDate();
        const day = String(yesterdayDate.getDate());

        // From Date
        await this.chooseDateButtons.nth(0).click();

        await expect(this.page.getByRole('grid', { name: /October 2026/ })).toBeVisible();

        await this.page.getByRole('gridcell', { name: day, exact: true }).click();

        // To Date
        // await this.chooseDateButtons.nth(1).click();

        // await this.page.getByRole('gridcell', { name: day, exact: true }).click();

    }

    async enterCustomStartDate() {
        const yesterdayDate = await this.getYesterdayDate();
        const day = String(yesterdayDate.getDate());

        await this.chooseDateButtons.nth(0).click();

        await this.page.getByRole('gridcell', { name: day, exact: true }).click();
    }

    async getYesterdayDate() {
        const date = new Date();

        date.setDate(date.getDate() - 1);

        return date;
    }
    async submitBtn() {
        await expect(this.submitButton).toBeVisible();
        await expect(this.submitButton).toBeEnabled();
        await this.submitButton.click();
    }
    async clkonReconcileBtn() {
        await expect(this.reconcileButton).toBeVisible();
        await this.reconcileButton.click();
    }

    async BOUuploadFile() {
        const filePath = path.resolve(__dirname, '../billerOnboardData/Dummy_File.zip');

        await expect(this.BOUuploadField).toHaveCount(1);

        await this.BOUuploadField.setInputFiles(filePath);

        console.log('Input file:', await this.BOUuploadField.evaluate(input => input.files?.[0]?.name));

        // Give the application's React state a chance to render
        await expect.poll(async () => {
            return await this.page.locator('body').textContent();
        }).toContain('Dummy_File.zip');
    }
    async COUuploadFile() {
        const filePath = path.resolve(__dirname, '../billerOnboardData/reports.txt');

        await expect(this.COUuploadField).toHaveCount(1);

        await this.COUuploadField.setInputFiles(filePath);

        console.log('Input file:', await this.COUuploadField.evaluate(input => input.files?.[0]?.name));

        // Give the application's React state a chance to render
        await expect.poll(async () => {
            return await this.page.locator('body').textContent();
        }).toContain('reports.txt');
    }
}

module.exports = { ReconciliationPage };