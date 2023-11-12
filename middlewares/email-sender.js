const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');

const transporter = nodemailer.createTransport(emailConfig);

async function sendEmail(email, subject, text) {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
}

module.exports = sendEmail;
