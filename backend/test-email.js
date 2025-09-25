import { EmailService } from './src/services/email.service';
import { config } from './src/config/config';

async function testEmailService() {
  console.log(' Testing Email Service...');
  
  try {
    const emailService = new EmailService();
    
    // Test basic email sending
    const result = await emailService.sendEmail({
      to: 'fastrevedkids@gmail.com',
      subject: 'Test Email from Diamond Backend',
      template: 'test',
      variables: {
        message: 'This is a test email from your Diamond Backend!',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(' Email sent successfully:', result);
    
  } catch (error) {
    console.error(' Email test failed:', error);
  }
}

// Run the test
testEmailService();
