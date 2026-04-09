const nodemailer = require('nodemailer');

// Ensure you configure these environment variables in your .env file
// GMAIL_USER=your-email@gmail.com
// GMAIL_PASS=your-app-password

// Support for both Gmail and generic SMTP (like Mailtrap)
const transporter = nodemailer.createTransport(
  process.env.EMAIL_HOST 
  ? {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }
  : {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    }
);

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
