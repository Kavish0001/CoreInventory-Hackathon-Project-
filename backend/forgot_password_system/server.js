const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { storeOTP, verifyOTP } = require('./otpStore');
const { sendOTPEmail } = require('./email');

dotenv.config();

const app = express();
app.use(express.json());

// Mock user database (Replace with your actual database logic)
const users = []; 

// 1. Forgot Password - Generate & Send OTP
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        storeOTP(email, otp); 
        await sendOTPEmail(email, otp);
        res.status(200).json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending email. Please try again later.' });
    }
});

// 2. Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const isValid = verifyOTP(email, otp);

    if (isValid) {
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
});

// 3. Reset Password
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Mock DB update
        console.log(`Password reset for ${email}: New hash is ${hashedPassword}`);

        res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
