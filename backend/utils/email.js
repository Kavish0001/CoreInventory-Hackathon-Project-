const nodemailer = require('nodemailer');
const { getConfig } = require('./env');

const sendEmail = async (options) => {
  const config = getConfig();
  
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  // Define email options
  const mailOptions = {
    from: config.smtp.from,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || null,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
