const sendEmail = require('../../config/mailer');

/**
 * @desc    Handle Contact Form Inquiries
 * @route   POST /api/contact
 * @access  Public
 */
exports.handleInquiry = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Incomplete details. Name, phone, and message are required.' 
    });
  }

  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #008080; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">New Workshop Inquiry</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Contact Details</p>
          <div style="background-color: #f7f9f9; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${phone || 'Not Provided'}</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Message Content</p>
          <div style="line-height: 1.6; color: #333; font-size: 16px; white-space: pre-wrap;">
            ${message}
          </div>
        </div>
        <div style="background-color: #f0f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 0;">This inquiry was sent from the WorkshopPro landing page.</p>
        </div>
      </div>
    `;

    const emailSent = await sendEmail({
      to: 'alenjames899@gmail.com',
      subject: `New Inquiry: ${subject || 'Contact Form'}`,
      html: htmlContent,
      text: `Inquiry from ${name} (${email}, ${phone}):\n\n${message}`
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, error: 'Transmission error. Please try again later.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Inquiry successfully transmitted. Alen will contact you shortly.' 
    });

  } catch (error) {
    console.error('Contact Inquiry Error:', error);
    res.status(500).json({ success: false, error: 'Internal platform error during transmission.' });
  }
};
