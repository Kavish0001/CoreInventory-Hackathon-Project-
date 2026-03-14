# Postman API Testing Examples

## 1. Forgot Password
**URL:** `http://localhost:5000/api/forgot-password`  
**Method:** `POST`  
**Body (JSON):**
```json
{
    "email": "user@example.com"
}
```

## 2. Verify OTP
**URL:** `http://localhost:5000/api/verify-otp`  
**Method:** `POST`  
**Body (JSON):**
```json
{
    "email": "user@example.com",
    "otp": "123456"
}
```

## 3. Reset Password
**URL:** `http://localhost:5000/api/reset-password`  
**Method:** `POST`  
**Body (JSON):**
```json
{
    "email": "user@example.com",
    "newPassword": "securePassword123"
}
```

---

### Setup Instructions:
1. Navigate to the `forgot_password_system` folder.
2. Run `npm install express nodemailer bcrypt dotenv`.
3. Create a `.env` file based on `.env.example`.
4. For `EMAIL_PASS`, use a **Gmail App Password** (Don't use your regular password).
5. Start the server with `node server.js`.
