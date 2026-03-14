const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
});

/**
 * Send OTP to user email
 * @param {string} to 
 * @param {string} otp 
 */
async function sendOTPEmail(to, otp) {
    const mailOptions = {
        from: `"Core Inventory Support" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>You requested to reset your password. Please use the following 6-digit OTP to proceed:</p>
                <h1 style="color: #4CAF50; letter-spacing: 5px; text-align: center;">${otp}</h1>
                <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
                <br>
                <p>Regards,<br>Core Inventory Team</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
}

module.exports = { sendOTPEmail };
