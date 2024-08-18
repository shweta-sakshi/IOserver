const nodemailer = require("nodemailer");

const sendMail = async (options) => {
    const transport = nodemailer.createTransport({
        service: process.env.CHEMHUB_SERVICE,
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });
    const mailOption = {
        from: process.env.CHEMHUB_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    await transport.sendMail(mailOption);
}

module.exports = sendMail;