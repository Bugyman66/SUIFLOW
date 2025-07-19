import emailService from './services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailService() {
  console.log('Testing email service...');
  console.log('Email user:', process.env.EMAIL_USER);
  console.log('Email pass:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  
  try {
    const connected = await emailService.testConnection();
    if (connected) {
      console.log('✅ Email service is working!');
      
      // Test sending an actual email
      console.log('Sending test OTP...');
      await emailService.sendOTP('test@example.com', '123456', 'registration');
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Email service connection failed');
    }
  } catch (error) {
    console.error('❌ Email service error:', error);
  }
}

testEmailService();
