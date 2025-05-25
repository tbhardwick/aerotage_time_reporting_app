import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        hourlyRate: user.hourlyRate || '',
        phone: user.contactInfo?.phone || '',
        address: user.contactInfo?.address || '',
        emergencyContact: user.contactInfo?.emergencyContact || '',
      });
    }
  }, [user]);

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

    setIsSaving(true);
    setMessage(null);

    try {
      // Update user in context
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: user.id,
          updates: {
            name: formData.name,
            jobTitle: formData.jobTitle,
            department: formData.department,
            hourlyRate: typeof formData.hourlyRate === 'number' ? formData.hourlyRate : undefined,
            contactInfo: {
              ...user.contactInfo,
              phone: formData.phone,
              address: formData.address,
              emergencyContact: formData.emergencyContact,
            },
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // Also update the current user in the state
      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          name: formData.name,
          jobTitle: formData.jobTitle,
          department: formData.department,
          hourlyRate: typeof formData.hourlyRate === 'number' ? formData.hourlyRate : undefined,
          contactInfo: {
            ...user.contactInfo,
            phone: formData.phone,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);

      // TODO: Make API call to update profile on backend
      // await apiClient.updateUserProfile(user.id, formData);

    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        hourlyRate: user.hourlyRate || '',
        phone: user.contactInfo?.phone || '',
        address: user.contactInfo?.address || '',
        emergencyContact: user.contactInfo?.emergencyContact || '',
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Loading profile...</p>
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
                value={user.role}
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
              disabled={isSaving}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSettings; 