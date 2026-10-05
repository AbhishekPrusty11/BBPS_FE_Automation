class billerListPage {
    constructor(page) {
        this.page = page
        this.billerMenu = page.getByText('Biller', { exact: true });
        this.animationpage = page.locator('.zoom-animation');
        this.billerListsubMenu = page.getByText('Biller List', { exact: true });
        this.searchbiller = page.getByPlaceholder('Search here....');
        this.ActionButton = page.locator('[data-field="action"] button');
        this.deactivateBtn = page.getByText('Deactivate');

    }

    async OpenbillerList() {
        await this.billerMenu.click();
        await this.animationpage.waitFor({ state: 'hidden', timeout: 30000 });
        await this.billerListsubMenu.click();

    }
    async searchBiller(billerName) {

        await this.searchbiller.fill(billerName)

    }
    async clikkDeactivate() {
        await this.ActionButton.first().click();
        await this.deactivateBtn.click();
    }


}
module.exports = { billerListPage }