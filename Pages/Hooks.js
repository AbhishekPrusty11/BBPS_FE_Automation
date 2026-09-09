const { LoginAndLogout } = require('./LoginAndLogout');
const { getSession, saveSession, removeSession } = require('../Utils/sessionManager');
const envConfig = require('../Config/envConfig');


function isTokenExpired(token) {

    try {

        const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
        );

        const currentTime = Math.floor(Date.now() / 1000);

        return payload.exp <= currentTime;

    } catch (error) {

        return true;
    }
}

// ==================================================
// ROLE → DASHBOARD URL
// ==================================================

const dashboardUrls = {
    Maker: 'https://bob-bbps-admin-stage.iserveu.online/admin/dashboard',
    Biller: 'https://bob-bbps-admin-stage.iserveu.online/biller/dashboard',
    Checker: 'https://bob-bbps-admin-stage.iserveu.online/admin/dashboard'
};

// ==================================================
// AUTHENTICATION
// ==================================================


async function setupAuth(page, role = 'Maker') {

    const dashboardUrl = dashboardUrls[role];
    const user = envConfig.credentials[role];

    if (!dashboardUrl) {
        throw new Error(`Dashboard URL not configured for role: ${role}`);
    }

    if (!user) {
        if (!user || !user.Username || !user.Password || !user.Otp) {
            throw new Error(`Incomplete credentials configured for role: ${role}`);

        }
    }
    // if (!user || !user.Username || !user.Password || !user.Otp) {
    //     throw new Error(`Incomplete credentials configured for role: ${role}`);

    // }

    const loginPage = new LoginAndLogout(page);
    const savedSession = getSession(role);


    // ==================================================
    // 1. TRY SAVED SESSION
    // ==================================================

    if (savedSession?.token) {

        console.log(`✓ Saved ${role} session found`);
        if (isTokenExpired(savedSession.token)) {

            console.log(`⚠ ${role} saved session has expired`);

            removeSession(role);
        }
        else {
            console.log(`✓ ${role} saved token is not expired`);

            await loginPage.goTo();
            console.log('URL after goTo:', page.url());

            await page.evaluate((session) => {

                sessionStorage.setItem('token', session.token);

                sessionStorage.setItem('refreshToken', session.refreshToken || '');

                sessionStorage.setItem('dashboardData', session.dashboardData || '');

            }, savedSession);


            try {

                await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

                if (page.url().startsWith(dashboardUrl)) {

                    console.log(`✓ ${role} session reused`);
                    return;
                }

                throw new Error(`Application redirected to ${page.url()}`);

            } catch (error) {

                console.log(`⚠ ${role} saved session rejected by application`);

                await page.evaluate(() => {
                    sessionStorage.clear();

                });

                removeSession(role);
            }
        }
    }

    // ==================================================
    // 2. FRESH LOGIN
    // ==================================================

    console.log(`🔐 Starting fresh ${role} login`);

    await loginPage.goTo();

    // Remove any invalid session

    await page.evaluate(() => {
        sessionStorage.clear();

    });

    console.log(`Login page URL: ${page.url()}`);

    await loginPage.validLogin(user.Username, user.Password, user.Otp);

    await page.locator('.zoom-animation').waitFor({ state: 'hidden', timeout: 30000 });

    await page.waitForURL(url => url.toString().startsWith(dashboardUrl), { timeout: 15000 }

    );

    // ==================================================
    // 4. GET SESSION
    // ==================================================

    const newSession = await page.evaluate(() => ({

        token: sessionStorage.getItem('token'),

        refreshToken: sessionStorage.getItem('refreshToken'),

        dashboardData: sessionStorage.getItem('dashboardData')

    }));


    // ==================================================
    // 5. VALIDATE SESSION
    // ==================================================

    if (!newSession.token) {

        throw new Error(`Authentication token not found after ${role} login`);
    }

    const cookies = await page.context().cookies();

    // ==================================================
    // 6. SAVE SESSION
    // ==================================================

    saveSession(role, newSession, cookies);


    console.log(`✓ ${role} login successful`);
}


module.exports = { setupAuth };