
class LoginAndLogout {
    constructor(page) {
        this.page = page;
        this.userName = page.getByPlaceholder('Enter your Username');
        this.password = page.getByPlaceholder('Enter your Password');
        this.ChkBox = page.locator('.PrivateSwitchBase-input');
        this.loginBtn = page.getByRole('button', { name: 'Login' })
        this.dialog = page.locator("//div[@role='dialog']");
        this.otpFields = page.locator("//input[@autocomplete='one-time-code']");
        this.verifyBtn = page.getByRole('button', { name: 'Verify' });
        this.profileBtn = page.locator('.MuiBox-root.css-1dyvuwk');
        this.logoutBtn = page.getByText('Logout');
        this.logOut = page.getByRole('button', { name: 'Logout' });
    }

    async goTo() {
        await this.page.goto('https://bob-bbps-admin-stage.iserveu.online/admin/login')
    }
    async validLogin(Username, Password, Otp) {
        await this.userName.fill(Username);
        await this.password.fill(Password);
        await this.ChkBox.click();
        await this.loginBtn.click();
        await this.dialog.waitFor({ state: 'visible' });

        const otpInputs = this.otpFields;
        for (let i = 0; i < Otp.length; i++) {
            await otpInputs.nth(i).fill(Otp[i]);
        }
        await this.verifyBtn.click();

    }

    async logout() {
        await this.profileBtn.click();
        await this.logoutBtn.waitFor({ state: 'visible' });
        await this.logoutBtn.click();

        // Wait for the confirmation logout button to appear instead of waiting 50 seconds
        await this.logOut.waitFor({ state: 'visible', timeout: 5000 });
        await this.logOut.click();
        await this.page.waitForLoadState('networkidle');
    }
}
module.exports = { LoginAndLogout }