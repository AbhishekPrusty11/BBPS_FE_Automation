require('dotenv').config();

const envConfig = {
    credentials: {
        Maker: {
            Username: process.env.MAKER_USERNAME,
            Password: process.env.MAKER_PASSWORD,
            Otp: process.env.MAKER_OTP
        },

        Biller: {
            Username: process.env.BILLER_USERNAME,
            Password: process.env.BILLER_PASSWORD,
            Otp: process.env.BILLER_OTP
        },

        Checker: {
            Username: process.env.CHECKER_USERNAME,
            Password: process.env.CHECKER_PASSWORD,
            Otp: process.env.CHECKER_OTP
        }
    }
};

module.exports = envConfig;