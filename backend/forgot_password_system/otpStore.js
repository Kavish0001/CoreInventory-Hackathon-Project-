const otps = new Map();

/**
 * Store an OTP with an expiration time
 * @param {string} email 
 * @param {string} otp 
 * @param {number} durationInMinutes 
 */
function storeOTP(email, otp, durationInMinutes = 10) {
    const expiresAt = Date.now() + durationInMinutes * 60 * 1000;
    otps.set(email, { otp, expiresAt });
}

/**
 * Verify if an OTP is valid and not expired
 * @param {string} email 
 * @param {string} otp 
 * @returns {boolean}
 */
function verifyOTP(email, otp) {
    const record = otps.get(email);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
        otps.delete(email); // Clean up expired OTP
        return false;
    }

    const isValid = record.otp === otp;
    if (isValid) {
        otps.delete(email); // OTP can only be used once
    }
    return isValid;
}

module.exports = { storeOTP, verifyOTP };
