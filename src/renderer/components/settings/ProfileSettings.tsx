import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useUserProfile } from '../../hooks';
import { UpdateUserProfileRequest } from '../../types/user-profile-api';

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

  // Show loading state
  if (profileLoading && !profile) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Loading profile...</p>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Aerotage!</h2>
              <p className="text-blue-700 text-sm mb-4">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Create My Profile
              </button>
            </div>
          </div>
          
          {/* Show the form if editing */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Your Profile</h3>
                
                {/* Messages */}
                {message && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800 mb-2">Failed to load profile</p>
          <p className="text-red-600 text-sm mb-4">{profileError}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
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
        <p className="text-neutral-500">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Profile Information</h2>
          <p className="text-sm text-neutral-600">Update your personal and professional information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-sm text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed here</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-lg text-sm text-neutral-500 capitalize"
              />
              <p className="text-xs text-neutral-500 mt-1">Role is managed by administrators</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>

            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-neutral-700 mb-1">
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
                    ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">
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
                  ? 'border-neutral-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                  : 'border-neutral-200 bg-neutral-50'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updating}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
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