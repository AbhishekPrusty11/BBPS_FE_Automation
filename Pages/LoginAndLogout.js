const { expect } = require('@playwright/test');

class LoginAndLogout {

    constructor(page) {

        this.page = page;

        // Login locators
        this.userName = page.getByPlaceholder('Enter your Username');

        this.password = page.getByPlaceholder('Enter your Password');

        this.ChkBox = page.locator('.PrivateSwitchBase-input');

        this.loginBtn = page.getByRole('button', { name: 'Login' });

        // OTP locators
        this.dialog = page.locator("//div[@role='dialog']");

        this.otpFields = page.locator("//input[@autocomplete='one-time-code']");

        this.verifyBtn = page.getByRole('button', { name: 'Verify' });

        // Logout locators
        this.profileBtn = page.locator('.MuiBox-root.css-1dyvuwk');

        this.logoutOption = page.getByText('Logout');

        this.logOut = page.getByRole('button', { name: 'Logout' });
    }


    // ==================================================
    // OPEN LOGIN PAGE
    // ==================================================

    async goTo() {

        await this.page.goto('https://bob-bbps-admin-stage.iserveu.online/client/login',
            {
                waitUntil: 'domcontentloaded'
            }
        );
    }


    // ==================================================
    // LOGIN ACTION
    // ==================================================

    async validLogin(Username, Password, Otp) {

        await this.userName.fill(Username);

        await this.password.fill(Password);

        await this.ChkBox.click();

        await this.loginBtn.click();


        // Wait for OTP dialog
        await this.dialog.waitFor({ state: 'visible' });


        // Enter OTP
        for (let i = 0; i < Otp.length; i++) {

            await this.otpFields.nth(i).fill(Otp[i]);
        }


        await this.verifyBtn.click();


        // Check one-device restriction
        const oneDeviceLoginMessage = this.page.getByText(/Only one device login permitted at a time/i);


        if (
            await oneDeviceLoginMessage.isVisible().catch(() => false)) {

            throw new Error('One-device login restriction triggered by the application.');
        }
    }


    // ==================================================
    // LOGOUT ACTION
    // ==================================================

    async logout() {

        await this.profileBtn.waitFor({ state: 'visible' });

        await this.profileBtn.click();

        await this.logoutOption.click();

        await this.logOut.click();
    }
}


module.exports = { LoginAndLogout };