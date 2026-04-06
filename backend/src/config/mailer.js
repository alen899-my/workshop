const nodemailer = require('nodemailer');

// Ensure you configure these environment variables in your .env file
// GMAIL_USER=your-email@gmail.com
// GMAIL_PASS=your-app-password

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Use an App Password if 2FA is enabled
  },
});

const sendEmail = async (options) => {
  const mailOptions = {
    from: `"Repairo Workshop Support" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
