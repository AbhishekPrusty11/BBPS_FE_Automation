require('dotenv').config();

const envConfig = {
    STAG: {
        baseUrl: process.env.STAG_BASE_URL,
        credentials: {
            Maker: {
                Username: process.env.STAG_MAKER_USERNAME,
                Password: process.env.STAG_MAKER_PASSWORD,
                Otp: process.env.STAG_MAKER_OTP
            },

            Biller: {
                Username: process.env.STAG_BILLER_USERNAME,
                Password: process.env.STAG_BILLER_PASSWORD,
                Otp: process.env.STAG_BILLER_OTP
            },

            Checker: {
                Username: process.env.STAG_CHECKER_USERNAME,
                Password: process.env.STAG_CHECKER_PASSWORD,
                Otp: process.env.STAG_CHECKER_OTP
            }
        }
    },
    UAT:{
        baseUrl: process.env.UAT_BASE_URL,
        credentials: {
            Maker: {
                Username: process.env.UAT_MAKER_USERNAME,
                Password: process.env.UAT_MAKER_PASSWORD,
                Otp: process.env.UAT_MAKER_OTP
            },

            Biller: {
                Username: process.env.UAT_BILLER_USERNAME,
                Password: process.env.UAT_BILLER_PASSWORD,
                Otp: process.env.UAT_BILLER_OTP
            },

            Checker: {
                Username: process.env.UAT_CHECKER_USERNAME,
                Password: process.env.UAT_CHECKER_PASSWORD,
                Otp: process.env.UAT_CHECKER_OTP
            }
        }
    }
};

module.exports = envConfig;