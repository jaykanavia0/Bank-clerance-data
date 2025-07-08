import React, { useState } from 'react';
import { AnimatePresence, motion } from "motion/react";
import EmailTemplate from './EmailTemplate';

function ContactsList({ contacts, isFirstPage = false, allContacts = [] }) {
  // Local state to track contacted status and notes for each contact
  const [contactStatus, setContactStatus] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [tempNotes, setTempNotes] = useState({});
  const [showContactDropdown, setShowContactDropdown] = useState({});
  
  // Email template state
  const [emailTemplate, setEmailTemplate] = useState({
    isOpen: false,
    selectedContact: null
  });
  
  // Hover effect state
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Available contact persons
  const contactPersons = ["Zainab", "Zinat", "Payal", "Farid"];

  // Generate unique ID for each contact
  const getContactId = (contact) => `${contact.bank_id}-${contact.position_type}-${contact.name}`;

  // Email functions
  const openEmailTemplate = (contact) => {
    setEmailTemplate({
      isOpen: true,
      selectedContact: contact
    });
  };

  const closeEmailTemplate = () => {
    setEmailTemplate({
      isOpen: false,
      selectedContact: null
    });
  };

  const handleEmailSent = (contact, emailData) => {
    const contactId = getContactId(contact);
    // Update contact status to include email sent info
    setContactStatus(prev => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        emailSent: true,
        lastEmailSentAt: new Date().toISOString(),
        lastEmailSubject: emailData.subject
      }
    }));
  };

  // Reset all contact data
  const handleResetAllContacts = () => {
    if (window.confirm('Are you sure you want to reset all contact data? This will clear:\n• Contact status\n• Notes\n• Email sent status\n\nThis action cannot be undone.')) {
      setContactStatus({});
      setEditingNotes({});
      setTempNotes({});
      setShowContactDropdown({});
    }
  };

  // Toggle contacted status with person selection
  const toggleContacted = (contactId, contactedBy = null) => {
    const currentStatus = contactStatus[contactId];
    
    if (currentStatus?.contacted) {
      // If already contacted, toggle off
      setContactStatus(prev => ({
        ...prev,
        [contactId]: {
          ...prev[contactId],
          contacted: false,
          contactedAt: null,
          contactedBy: null
        }
      }));
      setShowContactDropdown(prev => ({ ...prev, [contactId]: false }));
    } else {
      if (contactedBy) {
        // If person is selected, mark as contacted
        setContactStatus(prev => ({
          ...prev,
          [contactId]: {
            ...prev[contactId],
            contacted: true,
            contactedAt: new Date().toISOString(),
            contactedBy: contactedBy
          }
        }));
        setShowContactDropdown(prev => ({ ...prev, [contactId]: false }));
      } else {
        // Show dropdown to select person
        setShowContactDropdown(prev => ({ ...prev, [contactId]: true }));
      }
    }
  };

  // Handle contact person selection
  const selectContactPerson = (contactId, person) => {
    toggleContacted(contactId, person);
  };

  // Handle notes editing
  const startEditingNotes = (contactId) => {
    setEditingNotes(prev => ({ ...prev, [contactId]: true }));
    setTempNotes(prev => ({ 
      ...prev, 
      [contactId]: contactStatus[contactId]?.notes || '' 
    }));
  };

  const saveNotes = (contactId) => {
    setContactStatus(prev => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        notes: tempNotes[contactId],
        notesUpdatedAt: new Date().toISOString()
      }
    }));
    setEditingNotes(prev => ({ ...prev, [contactId]: false }));
  };

  const cancelEditingNotes = (contactId) => {
    setEditingNotes(prev => ({ ...prev, [contactId]: false }));
    setTempNotes(prev => ({ ...prev, [contactId]: '' }));
  };

  const renderContact = (contact, index) => {
    const contactId = getContactId(contact);
    const status = contactStatus[contactId];
    const isContacted = status?.contacted || false;
    const isEditingNote = editingNotes[contactId] || false;
    const showDropdown = showContactDropdown[contactId] || false;
    const hasEmailSent = status?.emailSent || false;
    
    return (
      <div 
        key={contactId}
        className="relative group block p-2 h-full w-full"
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <AnimatePresence>
          {hoveredIndex === index && (
            <motion.span
              className="absolute inset-0 h-full w-full bg-neutral-200/50 dark:bg-slate-800/[0.8] block rounded-2xl"
              layoutId="hoverBackground"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.15 },
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.15, delay: 0.2 },
              }}
            />
          )}
        </AnimatePresence>
        
        <div 
          className={`relative z-20 bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/30 group-hover:bg-white/80 group-hover:border-white/50 transition-all duration-200 h-full ${
            isContacted ? '!border-l-4 !border-l-green-500' : ''
          }`}
        >
          {/* Contact Status Indicator - Fixed positioning and click area */}
          <div className="absolute top-3 right-3 z-40 flex gap-1.5">
            {/* Email Button */}
            {contact.email && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEmailTemplate(contact);
                }}
                className={`p-2 rounded-full transition-all duration-200 shadow-sm ${
                  hasEmailSent 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-gray-300 hover:text-blue-500'
                }`}
                title={hasEmailSent ? 'Email sent' : 'Send email'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            
            {/* Contact Status Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleContacted(contactId);
                }}
                className={`p-2 rounded-full transition-all duration-200 shadow-sm ${
                  isContacted 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-gray-300'
                }`}
                title={isContacted ? 'Mark as not contacted' : 'Mark as contacted'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              
              {/* Contact Person Dropdown - Improved positioning and z-index */}
              {showDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowContactDropdown(prev => ({ ...prev, [contactId]: false }));
                    }}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                        Contacted by:
                      </div>
                      {contactPersons.map((person) => (
                        <button
                          key={person}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectContactPerson(contactId, person);
                          }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        >
                          {person}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Information - Improved spacing for new button */}
          <div className="relative z-10 pr-24">
            <h3 className="font-semibold text-lg text-gray-800 mb-1 leading-tight">{contact.name}</h3>
            <p className="text-blue-600 font-medium mb-1">{contact.bank_name}</p>
            <p className="text-gray-500 text-sm mb-3">{contact.position}</p>
            
            {/* Contact Details - Better spacing and click handling */}
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a 
                    href={`mailto:${contact.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-500 hover:text-blue-700 hover:underline text-sm transition-colors duration-150 break-all"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a 
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-500 hover:text-blue-700 hover:underline text-sm transition-colors duration-150"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Email Status Info */}
            {hasEmailSent && status?.lastEmailSentAt && (
              <div className="mt-3 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
                <div className="text-xs text-blue-700 font-medium">
                  ✉ Email sent on {new Date(status.lastEmailSentAt).toLocaleDateString()}
                  {status.lastEmailSubject && (
                    <span className="block text-blue-600 mt-0.5 truncate">
                      Subject: {status.lastEmailSubject}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contact Status Info */}
            {isContacted && status?.contactedAt && (
              <div className="mt-3 px-3 py-1.5 bg-green-50 rounded-md border border-green-200">
                <div className="text-xs text-green-700 font-medium">
                  ✓ Contacted on {new Date(status.contactedAt).toLocaleDateString()}
                  {status.contactedBy && (
                    <span className="block text-green-600 mt-0.5">by {status.contactedBy}</span>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section - Improved styling */}
            <div className="mt-4 border-t border-gray-200 pt-3">
              {isEditingNote ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    rows="3"
                    placeholder="Add notes about your conversation..."
                    value={tempNotes[contactId] || ''}
                    onChange={(e) => setTempNotes(prev => ({ ...prev, [contactId]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        saveNotes(contactId);
                      }}
                      className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        cancelEditingNotes(contactId);
                      }}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {status?.notes ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{status.notes}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEditingNotes(contactId);
                        }}
                        className="text-blue-500 text-sm hover:text-blue-700 transition-colors duration-150 flex items-center gap-1.5 font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit notes
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditingNotes(contactId);
                      }}
                      className="text-blue-500 text-sm hover:text-blue-700 transition-colors duration-150 flex items-center gap-1.5 font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add notes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stats Bar
  const dataToAnalyze = isFirstPage ? allContacts : contacts;
  const totalContacts = dataToAnalyze.length;
  const contactedCount = dataToAnalyze.filter(contact => 
    contactStatus[getContactId(contact)]?.contacted
  ).length;
  const emailSentCount = dataToAnalyze.filter(contact => 
    contactStatus[getContactId(contact)]?.emailSent
  ).length;
  const remainingCount = totalContacts - contactedCount;

  // Person-specific statistics (only for first page)
  const personStats = isFirstPage ? contactPersons.map(person => {
    const personContactedCount = dataToAnalyze.filter(contact => 
      contactStatus[getContactId(contact)]?.contactedBy === person
    ).length;
    return { person, count: personContactedCount };
  }) : [];

  if (contacts.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">No contacts found matching your criteria. Try changing your filters.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Email Template Modal */}
      <EmailTemplate
        isOpen={emailTemplate.isOpen}
        onClose={closeEmailTemplate}
        contact={emailTemplate.selectedContact}
        onSend={handleEmailSent}
      />

      {/* Contact Stats */}
      <div className="mb-6 bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-white/30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stats Section */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="text-gray-900">{totalContacts}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-700">Contacted:</span>
              <span className="text-green-900">{contactedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-700">Emails Sent:</span>
              <span className="text-blue-900">{emailSentCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-700">Remaining:</span>
              <span className="text-orange-900">{remainingCount}</span>
            </div>
            
            {/* Person-specific stats (only on first page) */}
            {isFirstPage && personStats.some(stat => stat.count > 0) && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                {personStats.map(({ person, count }) => (
                  count > 0 && (
                    <div key={person} className="flex items-center gap-2">
                      <span className="font-medium text-blue-700">{person}:</span>
                      <span className="text-blue-900">{count}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {contactedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700">Progress:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(contactedCount / totalContacts) * 100}%` }}
                  />
                </div>
                <span className="text-blue-900">{Math.round((contactedCount / totalContacts) * 100)}%</span>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {(contactedCount > 0 || emailSentCount > 0 || Object.keys(contactStatus).some(id => contactStatus[id]?.notes)) && (
            <button
              onClick={handleResetAllContacts}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
              title="Reset all contact data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* Contacts Grid with Hover Effects */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact, index) => renderContact(contact, index))}
      </div>
    </div>
  );
}

export default ContactsList;