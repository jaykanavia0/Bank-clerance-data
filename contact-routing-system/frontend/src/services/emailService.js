import notificationService from './notificationService';

const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};

class EmailService {
  static async initialize() {
    try {
      // Check if EmailJS is loaded
      if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialized successfully');
        return true;
      } else {
        console.error('EmailJS library not loaded');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      return false;
    }
  }

  static async sendEmail(emailData) {
    try {
      // Validate required fields
      if (!emailData.to) {
        throw new Error('Recipient email is required');
      }
      
      if (!emailData.subject || !emailData.message) {
        throw new Error('Subject and message are required');
      }

      // Ensure EmailJS is initialized
      const isInitialized = await this.initialize();
      if (!isInitialized) {
        throw new Error('EmailJS not initialized');
      }

      // Validate configuration
      if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
        throw new Error('EmailJS configuration incomplete. Check your environment variables.');
      }

      // Prepare template parameters - CRITICAL: to_email must match your template
      const templateParams = {
        to_email: emailData.to,                    // This goes to the recipient
        from_email: 'csu.aiml@gmail.com',         // Your verified sender
        to_name: emailData.recipientName || 'Valued Partner',
        from_name: 'Cyber Security Umbrella Team',
        subject: emailData.subject,
        message: emailData.message,
        reply_to: 'csu.aiml@gmail.com'
      };

      console.log('Sending email with params:', {
        ...templateParams,
        message: templateParams.message.substring(0, 100) + '...' // Log truncated message for privacy
      });

      // Send email using EmailJS
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully:', response);
      
      // 🔔 NOTIFICATION INTEGRATION: Track sent email for reply monitoring
      try {
        notificationService.trackSentEmail({
          to: emailData.to,
          recipientName: emailData.recipientName || emailData.to.split('@')[0],
          subject: emailData.subject,
          message: emailData.message,
          sentAt: new Date().toISOString(),
          emailServiceResponse: response
        });

        // Optional: Add a success notification
        notificationService.addNotification({
          title: 'Email Sent Successfully',
          message: `Email sent to ${emailData.recipientName || emailData.to.split('@')[0]} about "${emailData.subject}"`,
          type: 'email_sent',
          senderEmail: 'csu.aiml@gmail.com',
          recipientEmail: emailData.to,
          recipientName: emailData.recipientName,
          subject: emailData.subject,
          sentAt: new Date().toISOString()
        });

        console.log('📧 Email tracked for reply monitoring:', {
          recipient: emailData.to,
          subject: emailData.subject
        });

      } catch (notificationError) {
        // Don't fail the email sending if notification tracking fails
        console.error('⚠️ Failed to track email for notifications:', notificationError);
      }
      
      return {
        success: true,
        response: response,
        recipient: emailData.to,
        subject: emailData.subject,
        sentAt: new Date().toISOString(),
        tracked: true // Indicates the email is being tracked for replies
      };

    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send email';
      if (error.text) {
        errorMessage = `EmailJS Error: ${error.text}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Optional: Add error notification
      try {
        notificationService.addNotification({
          title: 'Email Send Failed',
          message: `Failed to send email to ${emailData.to}: ${errorMessage}`,
          type: 'email_error',
          recipientEmail: emailData.to,
          subject: emailData.subject,
          error: errorMessage
        });
      } catch (notificationError) {
        console.error('Failed to create error notification:', notificationError);
      }

      return {
        success: false,
        error: errorMessage,
        details: error,
        sentAt: new Date().toISOString(),
        tracked: false
      };
    }
  }

  // Test configuration method
  static async testConfiguration() {
    console.log('Testing EmailJS configuration...');
    console.log('Service ID:', EMAILJS_CONFIG.SERVICE_ID ? 'Set' : 'Missing');
    console.log('Template ID:', EMAILJS_CONFIG.TEMPLATE_ID ? 'Set' : 'Missing');
    console.log('Public Key:', EMAILJS_CONFIG.PUBLIC_KEY ? 'Set' : 'Missing');
    
    if (typeof emailjs !== 'undefined') {
      console.log('EmailJS library loaded successfully');
      return true;
    } else {
      console.error('EmailJS library not loaded');
      return false;
    }
  }

  // Alternative method using Web3Forms (backup)
  static async sendEmailViaWeb3Forms(emailData) {
    try {
      const formData = new FormData();
      formData.append('access_key', 'your_web3forms_access_key'); // Replace with actual key
      formData.append('from_name', 'Banking Solutions Team');
      formData.append('from_email', 'csu.aiml@gmail.com');
      formData.append('to_email', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          response: result,
          recipient: emailData.to,
          subject: emailData.subject
        };
      } else {
        throw new Error(result.message || 'Failed to send email');
      }

    } catch (error) {
      console.error('Failed to send email via Web3Forms:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  // Fallback method that tries multiple services
  static async sendEmailWithFallback(emailData) {
    const methods = [
      this.sendEmail.bind(this),
      // this.sendEmailViaWeb3Forms.bind(this), // Uncomment if you have Web3Forms configured
    ];

    for (const method of methods) {
      try {
        const result = await method(emailData);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn('Email service method failed, trying next...', error);
      }
    }

    return {
      success: false,
      error: 'All email services failed'
    };
  }
}

// Enhanced Email template generators
export const EmailTemplates = {
  partnership: (contact) => ({
    subject: `Partnership Opportunity - ${contact.bank_name}`,
    message: `Dear ${contact.name},

I hope this email finds you well. I am reaching out from Banking Router, a smart financial hub that specializes in connecting banking institutions with innovative technology solutions.

We have been following ${contact.bank_name}'s impressive growth and leadership in the banking sector, and we believe there could be significant partnership opportunities between our organizations.

At Banking Router, we provide comprehensive solutions including:
• Advanced digital banking platforms and APIs
• Risk management and regulatory compliance systems  
• Customer experience optimization tools
• AI-powered analytics and reporting dashboards
• Cybersecurity solutions for financial institutions
• Digital transformation consulting and implementation

We would love to explore how Banking Router can support ${contact.bank_name}'s strategic objectives and help enhance your customer experience while streamlining operations.

I would be delighted to schedule a brief meeting at your convenience to discuss how we can create mutual value through partnership.

Thank you for your time and consideration. I look forward to the opportunity to connect with you.

Best regards,

Cyber Security Umbrella Team
Email: support@cybersecurityumbrella.com
Website: www.cybersecurityumbrella.com
Phone: +91-7096022911

---
This email was sent from Banking Router's contact management system.`
  }),

  followUp: (contact) => ({
    subject: `Follow-up: Partnership Discussion with ${contact.bank_name}`,
    message: `Dear ${contact.name},

I hope you are doing well. I wanted to follow up on our previous communication regarding potential partnership opportunities between Banking Router and ${contact.bank_name}.

We remain very enthusiastic about the possibility of working together to deliver innovative banking solutions that can benefit your customers and optimize your operations.

As a quick reminder, Banking Router specializes in:
• Digital banking transformation solutions
• Regulatory compliance and risk management tools
• Customer engagement platforms
• Advanced analytics and business intelligence
• Fintech integration services

If you have had a chance to consider our proposal, I would be happy to discuss next steps, answer any questions you might have, or provide additional information about our solutions.

Please let me know a convenient time for a brief call or meeting. I'm flexible with timing and can accommodate your schedule.

Thank you again for your time and consideration.

Best regards,

Cyber Security Umbrella Team
Email: support@cybersecurityumbrella.com
Website: www.cybersecurityumbrella.com
Phone: +91-7096022911

Looking forward to hearing from you soon.`
  }),

  introduction: (contact) => ({
    subject: `Introduction - Banking Router Solutions for ${contact.bank_name}`,
    message: `Dear ${contact.name},

I hope this message finds you well. I represent Banking Router, a leading smart financial hub focused on delivering cutting-edge banking technology solutions.

We have been impressed by ${contact.bank_name}'s innovation and customer-centric approach in the banking industry. Your institution's commitment to excellence aligns perfectly with our mission to empower financial institutions with advanced technology.

Banking Router offers a comprehensive suite of services designed specifically for progressive banking institutions like ${contact.bank_name}:

🏦 Core Banking Solutions
• Modern core banking systems and APIs
• Real-time payment processing platforms
• Mobile and digital banking applications

🔒 Security & Compliance  
• Advanced cybersecurity solutions
• Regulatory compliance automation
• Risk management frameworks

📊 Analytics & Intelligence
• AI-powered customer insights
• Predictive analytics tools
• Business intelligence dashboards

🚀 Digital Transformation
• Cloud migration and modernization
• Process automation solutions
• Customer experience optimization

We would be honored to introduce you to our innovative solutions and explore how Banking Router can support ${contact.bank_name}'s continued growth and success.

Would you be open to a brief introductory call to explore potential collaboration opportunities?

Thank you for your time, and I look forward to the possibility of working together.

Warm regards,

Cyber Security Umbrella Team
Email: support@cybersecurityumbrella.com
Website: www.cybersecurityumbrella.com
Phone: +91-7096022911`
  })
};

export default EmailService;