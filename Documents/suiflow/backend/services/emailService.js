import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Try multiple SMTP configurations for virtualconnekt.com.ng
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Try Gmail SMTP first
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      // Try alternative configuration
      try {
        this.transporter = nodemailer.createTransport({
          host: 'mail.virtualconnekt.com.ng', // Try domain-specific SMTP
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        await this.transporter.verify();
        console.log('Email service connected with domain SMTP');
        return true;
      } catch (altError) {
        console.error('Alternative SMTP also failed:', altError);
        return false;
      }
    }
  }

  async sendOTP(email, otp, purpose = 'registration') {
    console.log(`Attempting to send OTP to: ${email}`);
    
    const subject = purpose === 'registration' 
      ? 'Verify Your Email - SuiFlow Registration'
      : 'Password Reset OTP - SuiFlow';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">SuiFlow ${purpose === 'registration' ? 'Registration' : 'Password Reset'}</h2>
        <p>Hello,</p>
        <p>${purpose === 'registration' 
          ? 'Thank you for registering with SuiFlow. Please use the following OTP to verify your email address:' 
          : 'You have requested to reset your password. Please use the following OTP:'}</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4A90E2; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        
        <p style="color: #666;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">SuiFlow - Secure Payment Processing</p>
      </div>
    `;

    const mailOptions = {
      from: `"SuiFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    try {
      console.log('Sending email with options:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // If the error is authentication-related, provide helpful message
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        throw new Error('Email authentication failed. Please check your email credentials or enable app passwords.');
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(email, businessName) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Welcome to SuiFlow!</h2>
        <p>Hello ${businessName},</p>
        <p>Your merchant account has been successfully created and verified.</p>
        <p>You can now start accepting payments through the SuiFlow platform.</p>
        
        <div style="background-color: #f0f9ff; padding: 20px; margin: 20px 0; border-left: 4px solid #4A90E2;">
          <h3>Getting Started:</h3>
          <ul>
            <li>Log in to your dashboard to configure your payment settings</li>
            <li>Set up your webhook URL for payment notifications</li>
            <li>Create your first payment link or product</li>
          </ul>
        </div>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">SuiFlow - Secure Payment Processing</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to SuiFlow - Account Created Successfully',
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }
}

export default new EmailService();
