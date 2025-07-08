import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import EmailService, { EmailTemplates } from '../services/emailService';

function EmailTemplate({ isOpen, onClose, contact, onSend }) {
  // Default email data that gets reset
  const getDefaultEmailData = () => ({
    to: contact?.email || '',
    subject: `Partnership Opportunity - ${contact?.bank_name || 'Banking Solutions'}`,
    message: `Dear ${contact?.name || 'Sir/Madam'},

I hope this email finds you well. I am writing to you from Banking Router, a smart financial hub that specializes in connecting banking institutions with innovative solutions.

We have been following ${contact?.bank_name || 'your esteemed institution'}'s growth and success in the banking sector, and we believe there could be valuable partnership opportunities between our organizations.

At Banking Router, we offer:
• Advanced banking technology solutions
• Risk management and compliance systems
• Customer experience optimization platforms
• Digital transformation consulting
• Regulatory compliance support

We would love to explore how we can collaborate with ${contact?.bank_name || 'your institution'} to deliver enhanced value to your customers and streamline your operations.

I would appreciate the opportunity to schedule a brief meeting at your convenience to discuss potential collaboration opportunities in more detail.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,

Cyber Security Umbrella team
Email: support@cybersecurityumbrella.com
Website: www.cybersecurityumbrella.com
Phone: +91-7096022911

---
This email was sent from our Banking Router contact management system.`
  });

  const [emailData, setEmailData] = useState(getDefaultEmailData());
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // Update email data when contact changes
  React.useEffect(() => {
    if (contact) {
      setEmailData(getDefaultEmailData());
      setSelectedTemplate('custom');
      setError('');
      setEmailSent(false);
    }
  }, [contact]);

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle template selection
  const handleTemplateChange = (templateType) => {
    setSelectedTemplate(templateType);
    if (templateType !== 'custom' && contact) {
      const template = EmailTemplates[templateType](contact);
      setEmailData(prev => ({
        ...prev,
        subject: template.subject,
        message: template.message
      }));
    }
  };

  // Reset email data to defaults
  const handleReset = () => {
    setEmailData(getDefaultEmailData());
    setSelectedTemplate('custom');
    setError('');
  };

  const sendEmail = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use the email service to send the email
      const result = await EmailService.sendEmailWithFallback({
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message,
        recipientName: contact?.name
      });

      if (result.success) {
        setEmailSent(true);
        onSend(contact, emailData);
        
        // Auto close after success
        setTimeout(() => {
          onClose();
          setEmailSent(false);
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to send email. Please try again.');
      console.error('Email sending error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!emailData.to || !emailData.subject || !emailData.message) {
      setError('Please fill in all required fields.');
      return;
    }
    sendEmail();
  };

  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Send Email</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sending to: {contact.name} ({contact.bank_name})
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Email Form */}
          <div className="p-6 space-y-6">
            {/* Template Selection and Reset Button Row */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="custom">Custom Message</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="introduction">Introduction</option>
                  <option value="followUp">Follow-up</option>
                </select>
              </div>
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                title="Reset to default template"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>

            {/* Email Headers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="email"
                  value="Banking Router <csu.aiml@gmail.com>"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              {/* To Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="recipient@example.com"
                  />
                  {contact?.email && emailData.to !== contact.email && (
                    <button
                      onClick={() => handleInputChange('to', contact.email)}
                      className="px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
                      title="Use contact's email"
                    >
                      Use Contact Email
                    </button>
                  )}
                </div>
                {contact?.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    Contact's email: {contact.email}
                  </p>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email subject"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={emailData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Your message here..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Success Message */}
            {emailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email sent successfully!
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || emailSent}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                  </svg>
                  Sending...
                </>
              ) : emailSent ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sent
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EmailTemplate;