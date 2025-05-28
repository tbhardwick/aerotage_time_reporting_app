import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useUserProfile } from '../../hooks';
import { UpdateUserProfileRequest } from '../../types/user-profile-api';
import { EmailChangeButton } from './EmailChangeButton';
import { EmailChangeModal } from './EmailChangeModal';
import { EmailChangeStatus, EmailChangeRequest } from './EmailChangeStatus';

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

  // Debug logging
  useEffect(() => {
    console.log('🔍 ProfileSettings debug:', {
      userId: user?.id,
      profileLoading,
      profileError,
      hasProfile: !!profile,
      profileData: profile ? { name: profile.name, email: profile.email } : null
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
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/users/${user?.id}/email-change-requests`);
      // const data = await response.json();
      // const activeRequest = data.find(req => ['pending_verification', 'pending_approval', 'approved'].includes(req.status));
      // setActiveEmailChangeRequest(activeRequest || null);
      
      // Mock data for development
      const mockRequest: EmailChangeRequest = {
        id: 'mock-request-1',
        currentEmail: formData.email,
        newEmail: 'new.email@example.com',
        status: 'pending_verification',
        reason: 'personal_preference',
        requestedAt: new Date().toISOString(),
        verificationStatus: {
          currentEmailVerified: false,
          newEmailVerified: false
        },
        estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Uncomment to test with mock data
      // setActiveEmailChangeRequest(mockRequest);
    } catch (error) {
      console.error('Failed to load email change requests:', error);
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

  const handleEmailChangeSubmit = async (newEmail: string, reason: string, customReason?: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/users/${user?.id}/email-change-request`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ newEmail, reason, customReason })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to submit email change request');
      // }
      // 
      // const data = await response.json();
      
      // Mock successful submission
      console.log('📧 Email change request submitted:', { newEmail, reason, customReason });
      
      // Create mock request for UI
      const mockRequest: EmailChangeRequest = {
        id: 'new-request-' + Date.now(),
        currentEmail: formData.email,
        newEmail,
        status: 'pending_verification',
        reason,
        customReason,
        requestedAt: new Date().toISOString(),
        verificationStatus: {
          currentEmailVerified: false,
          newEmailVerified: false
        },
        estimatedCompletionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      setActiveEmailChangeRequest(mockRequest);
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/email-change-requests/${requestId}/cancel`, {
      //   method: 'DELETE'
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to cancel email change request');
      // }
      
      console.log('❌ Email change request cancelled:', requestId);
      setActiveEmailChangeRequest(null);
      setMessage({ 
        type: 'success', 
        text: 'Email change request cancelled successfully.' 
      });
      
    } catch (error) {
      console.error('Failed to cancel email change request:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to cancel email change request. Please try again.' 
      });
    }
  };

  const handleResendVerification = async (requestId: string, emailType: 'current' | 'new') => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/email-change-requests/${requestId}/resend-verification`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ emailType })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to resend verification email');
      // }
      
      console.log('📧 Verification email resent:', { requestId, emailType });
      setMessage({ 
        type: 'success', 
        text: `Verification email resent to your ${emailType} email address.` 
      });
      
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to resend verification email. Please try again.' 
      });
    }
  };

  // Show loading state
  if (profileLoading && !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)]">Loading profile...</p>
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
            <div className="bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-lg p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-lg font-semibold text-[var(--color-primary-900)] mb-2">Welcome to Aerotage!</h2>
              <p className="text-[var(--color-primary-700)] text-sm mb-4">
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
                className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors duration-200"
              >
                Create My Profile
              </button>
            </div>
          </div>
          
          {/* Show the form if editing */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-[var(--color-surface)] p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">Create Your Profile</h3>
                
                {/* Messages */}
                {message && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    message.type === 'success' 
                      ? 'bg-[var(--color-success-50)] text-[var(--color-success-800)] border border-[var(--color-success-200)]' 
                      : 'bg-[var(--color-error-50)] text-[var(--color-error-800)] border border-[var(--color-error-200)]'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] rounded-lg text-sm text-[var(--color-text-tertiary)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                    className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors duration-200 disabled:opacity-50"
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
        <div className="bg-[var(--color-error-50)] border border-[var(--color-error-200)] rounded-lg p-4 max-w-md mx-auto">
          <p className="text-[var(--color-error-800)] mb-2">Failed to load profile</p>
          <p className="text-[var(--color-error-600)] text-sm mb-4">{profileError}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[var(--color-error-600)] text-white rounded-lg hover:bg-[var(--color-error-700)] transition-colors duration-200"
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
        <p className="text-[var(--color-text-secondary)]">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile Information</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Update your personal and professional information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-[var(--color-success-50)] text-[var(--color-success-800)] border border-[var(--color-success-200)]' 
            : 'bg-[var(--color-error-50)] text-[var(--color-error-800)] border border-[var(--color-error-200)]'
        }`}>
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

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] rounded-lg text-sm text-[var(--color-text-tertiary)]"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Email cannot be changed here</p>
              
              {/* Email Change Button */}
              {!activeEmailChangeRequest && (
                <div className="mt-3">
                  <EmailChangeButton
                    currentEmail={formData.email}
                    onEmailChangeRequest={handleEmailChangeRequest}
                    hasActiveRequest={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
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
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] rounded-lg text-sm text-[var(--color-text-tertiary)] capitalize"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Role is managed by administrators</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>

            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  isEditing 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                    : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                isEditing 
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]' 
                  : 'border-[var(--color-border-light)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updating}
              className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors duration-200 disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={showEmailChangeModal}
        onClose={() => setShowEmailChangeModal(false)}
        currentEmail={formData.email}
        onSubmit={handleEmailChangeSubmit}
      />
    </div>
  );
};

export default ProfileSettings; 