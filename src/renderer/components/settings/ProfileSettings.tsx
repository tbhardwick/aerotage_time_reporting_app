import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useUserProfile } from '../../hooks';
import { UpdateUserProfileRequest } from '../../types/user-profile-api';
import { EmailChangeButton } from './EmailChangeButton';
import { EmailChangeModal } from './EmailChangeModal';
import { EmailChangeStatus, EmailChangeRequest } from './EmailChangeStatus';
import { emailChangeService, CreateEmailChangeRequest } from '../../services/emailChangeService';

interface ProfileFormData {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  hourlyRate: number | '';
  phone: string;
  address: string;
  emergencyContact: string;
}

const ProfileSettings: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user } = state;
  
  // Use the profile API hook
  const { 
    profile, 
    loading: profileLoading, 
    error: profileError, 
    updating, 
    updateProfile, 
    refetch 
  } = useUserProfile(user?.id || null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    jobTitle: '',
    department: '',
    hourlyRate: '',
    phone: '',
    address: '',
    emergencyContact: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [activeEmailChangeRequest, setActiveEmailChangeRequest] = useState<EmailChangeRequest | null>(null);
  const [loadingEmailRequest, setLoadingEmailRequest] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 ProfileSettings debug:', {
      userId: user?.id,
      profileLoading,
      profileError,
      hasProfile: !!profile,
      profileData: profile ? { name: profile.name, email: profile.email } : null,
    });
  }, [user?.id, profileLoading, profileError, profile]);

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (profile) {
      console.log('📝 Initializing form data with profile:', profile);
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        jobTitle: profile.jobTitle || '',
        department: profile.department || '',
        hourlyRate: profile.hourlyRate || '',
        phone: profile.contactInfo?.phone || '',
        address: profile.contactInfo?.address || '',
        emergencyContact: profile.contactInfo?.emergencyContact || '',
      });
    }
  }, [profile]);

  // Load active email change request on component mount
  useEffect(() => {
    if (user?.id) {
      loadActiveEmailChangeRequest();
    }
  }, [user?.id]);

  const loadActiveEmailChangeRequest = async () => {
    if (!user?.id) return;
    
    setLoadingEmailRequest(true);
    try {
      console.log('🔍 Loading active email change request...');
      const activeRequest = await emailChangeService.getActiveRequest();
      console.log('📧 Active email change request:', activeRequest);
      setActiveEmailChangeRequest(activeRequest);
    } catch (error) {
      console.error('Failed to load email change requests:', error);
      // Don't show error to user for this background operation
    } finally {
      setLoadingEmailRequest(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('💾 Submitting profile with form data:', formData);

    setMessage(null);

    try {
      // Prepare the update request
      const updates: UpdateUserProfileRequest = {
        name: formData.name,
        jobTitle: formData.jobTitle || undefined,
        department: formData.department || undefined,
        hourlyRate: typeof formData.hourlyRate === 'number' ? formData.hourlyRate : undefined,
        contactInfo: {
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          emergencyContact: formData.emergencyContact || undefined,
        },
      };

      // Call the API to update the profile
      const updatedProfile = await updateProfile(updates);

      // Update the current user in the context with the API response
      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          name: updatedProfile.name,
          jobTitle: updatedProfile.jobTitle,
          department: updatedProfile.department,
          hourlyRate: updatedProfile.hourlyRate,
          contactInfo: updatedProfile.contactInfo,
          updatedAt: updatedProfile.updatedAt,
        },
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile. Please try again.' 
      });
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        jobTitle: profile.jobTitle || '',
        department: profile.department || '',
        hourlyRate: profile.hourlyRate || '',
        phone: profile.contactInfo?.phone || '',
        address: profile.contactInfo?.address || '',
        emergencyContact: profile.contactInfo?.emergencyContact || '',
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleEmailChangeRequest = () => {
    setShowEmailChangeModal(true);
  };

  const handleEmailChangeSubmit = async (data: CreateEmailChangeRequest) => {
    try {
      console.log('📧 Submitting email change request:', data);
      
      const result = await emailChangeService.submitRequest(data);
      console.log('✅ Email change request submitted successfully:', result);
      
      // Refresh the active request
      await loadActiveEmailChangeRequest();
      
      setMessage({ 
        type: 'success', 
        text: 'Email change request submitted successfully! Please check your email addresses for verification links.' 
      });
      
    } catch (error) {
      console.error('Failed to submit email change request:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleCancelEmailChangeRequest = async (requestId: string) => {
    try {
      console.log('❌ Cancelling email change request:', requestId);
      
      await emailChangeService.cancelRequest(requestId);
      console.log('✅ Email change request cancelled successfully');
      
      // Refresh the active request
      await loadActiveEmailChangeRequest();
      
      setMessage({ 
        type: 'success', 
        text: 'Email change request cancelled successfully.' 
      });
      
    } catch (error) {
      console.error('Failed to cancel email change request:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to cancel email change request. Please try again.' 
      });
    }
  };

  const handleResendVerification = async (requestId: string, emailType: 'current' | 'new') => {
    try {
      console.log('📧 Resending verification email:', { requestId, emailType });
      
      // Show loading state
      setMessage({ 
        type: 'success', 
        text: `Sending verification email to your ${emailType} email address...` 
      });
      
      await emailChangeService.resendVerification(requestId, emailType);
      console.log('✅ Verification email resent successfully');
      
      setMessage({ 
        type: 'success', 
        text: `Verification email sent to your ${emailType} email address. Please check your inbox and spam folder.` 
      });
      
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (error instanceof Error) {
        // Use the enhanced error message from the service
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      
      // Log additional debugging information
      console.error('Resend verification error details:', {
        requestId,
        emailType,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      });
    }
  };

  // Show loading state
  if (profileLoading && !profile) {
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  // Show error state - but handle "new user" case specially
  if (profileError && !profile) {
    // If it's a 404/profile not found, show a "create profile" interface
    if (profileError.includes('Failed to load profile')) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center py-8">
            <div style={{ backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }} className="rounded-lg p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">👋</div>
              <h2 style={{ color: 'var(--color-primary-900)' }} className="text-lg font-semibold mb-2">Welcome to Aerotage!</h2>
              <p style={{ color: 'var(--color-primary-700)' }} className="text-sm mb-4">
                It looks like this is your first time here. Let's set up your profile.
              </p>
              <button
                onClick={() => {
                  // Initialize with basic user data for a new profile
                  setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    jobTitle: '',
                    department: '',
                    hourlyRate: '',
                    phone: '',
                    address: '',
                    emergencyContact: '',
                  });
                  setIsEditing(true);
                }}
                style={{ backgroundColor: '#3b82f6' }}
                className="px-4 py-2 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Create My Profile
              </button>
            </div>
          </div>
          
          {/* Show the form if editing */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div style={{ backgroundColor: 'var(--surface-color)' }} className="p-6 rounded-lg shadow-md">
                <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-medium mb-4">Create Your Profile</h3>
                
                {/* Messages */}
                {message && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    message.type === 'success' 
                      ? 'border' 
                      : 'border'
                  }`}
                  style={{
                    backgroundColor: message.type === 'success' ? 'var(--color-success-50)' : 'var(--color-error-50)',
                    color: message.type === 'success' ? 'var(--color-success-800)' : 'var(--color-error-800)',
                    borderColor: message.type === 'success' ? 'var(--color-success-200)' : 'var(--color-error-200)'
                  }}>
                    {message.text}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--surface-color)', 
                        color: 'var(--text-primary)' 
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--surface-secondary)', 
                        color: 'var(--text-tertiary)' 
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="jobTitle" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--surface-color)', 
                        color: 'var(--text-primary)' 
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--surface-color)', 
                        color: 'var(--text-primary)' 
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ borderTop: '1px solid var(--border-color)' }} className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                    style={{
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-color)',
                      border: '1px solid var(--border-color)'
                    }}
                    className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors duration-200 disabled:opacity-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    style={{ backgroundColor: '#3b82f6' }}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors duration-200 disabled:opacity-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    {updating ? 'Creating Profile...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      );
    }

    // For other errors, show the regular error state
    return (
      <div className="text-center py-8">
        <div style={{ backgroundColor: 'var(--color-error-50)', border: '1px solid var(--color-error-200)' }} className="rounded-lg p-4 max-w-md mx-auto">
          <p style={{ color: 'var(--color-error-800)' }} className="mb-2">Failed to load profile</p>
          <p style={{ color: 'var(--color-error-600)' }} className="text-sm mb-4">{profileError}</p>
          <button
            onClick={refetch}
            style={{ backgroundColor: '#dc2626' }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show message if no profile available
  if (!profile && !profileLoading) {
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--text-secondary)' }}>No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold">Profile Information</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Update your personal and professional information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{ backgroundColor: '#3b82f6' }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-lg border"
        style={{
          backgroundColor: message.type === 'success' ? 'var(--color-success-50)' : 'var(--color-error-50)',
          color: message.type === 'success' ? 'var(--color-success-800)' : 'var(--color-error-800)',
          borderColor: message.type === 'success' ? 'var(--color-success-200)' : 'var(--color-error-200)'
        }}>
          {message.text}
        </div>
      )}

      {/* Active Email Change Request */}
      {activeEmailChangeRequest && (
        <EmailChangeStatus
          request={activeEmailChangeRequest}
          onCancelRequest={handleCancelEmailChangeRequest}
          onResendVerification={handleResendVerification}
        />
      )}

      {/* Email Change Button */}
      {!activeEmailChangeRequest && !loadingEmailRequest && (
        <EmailChangeButton
          currentEmail={formData.email}
          onEmailChangeRequest={handleEmailChangeRequest}
          hasActiveRequest={false}
        />
      )}

      {/* Loading indicator for email request */}
      {loadingEmailRequest && (
        <div style={{ backgroundColor: 'var(--surface-color)' }} className="flex items-center justify-center p-4 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span style={{ color: 'var(--text-secondary)' }} className="text-sm">Checking email change status...</span>
        </div>
      )}

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={showEmailChangeModal}
        onClose={() => setShowEmailChangeModal(false)}
        currentEmail={formData.email}
        onSubmit={handleEmailChangeSubmit}
      />

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }} className="text-md font-medium pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="email" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface-secondary)', 
                  color: 'var(--text-tertiary)' 
                }}
                className="w-full px-3 py-2 rounded-lg text-sm"
              />
              <p style={{ color: 'var(--text-tertiary)' }} className="text-xs mt-1">Email cannot be changed here</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                disabled={!isEditing}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="department" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourlyRate" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                disabled={!isEditing}
                min="0"
                step="0.01"
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface-secondary)', 
                  color: 'var(--text-tertiary)' 
                }}
                className="w-full px-3 py-2 rounded-lg text-sm capitalize"
              />
              <p style={{ color: 'var(--text-tertiary)' }} className="text-xs mt-1">Role is managed by administrators</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }} className="text-md font-medium pb-2">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="emergencyContact" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                  color: 'var(--text-primary)' 
                }}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isEditing 
                    ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                    : ''
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              style={{ 
                border: '1px solid var(--border-color)', 
                backgroundColor: isEditing ? 'var(--surface-color)' : 'var(--surface-secondary)', 
                color: 'var(--text-primary)' 
              }}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                isEditing 
                  ? 'focus:ring-1 focus:ring-blue-500 focus:border-blue-500' 
                  : ''
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div style={{ borderTop: '1px solid var(--border-color)' }} className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updating}
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)'
              }}
              className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors duration-200 disabled:opacity-50"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              style={{ backgroundColor: '#3b82f6' }}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors duration-200 disabled:opacity-50"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSettings; 