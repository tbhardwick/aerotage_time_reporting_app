import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

interface PreferencesFormData {
  theme: 'light' | 'dark';
  notifications: boolean;
  timezone: string;
  defaultTimeEntryDuration: number;
  autoStartTimer: boolean;
  showTimerInMenuBar: boolean;
  defaultBillableStatus: boolean;
  reminderInterval: number; // in minutes
  workingHoursStart: string;
  workingHoursEnd: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const currencies = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
];

const dateFormats = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'DD.MM.YYYY',
];

const PreferencesSettings: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user } = state;

  const [formData, setFormData] = useState<PreferencesFormData>({
    theme: 'light',
    notifications: true,
    timezone: 'UTC',
    defaultTimeEntryDuration: 60, // 1 hour in minutes
    autoStartTimer: false,
    showTimerInMenuBar: true,
    defaultBillableStatus: true,
    reminderInterval: 15, // 15 minutes
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        theme: user.preferences?.theme || 'light',
        notifications: user.preferences?.notifications ?? true,
        timezone: user.preferences?.timezone || 'UTC',
        // Note: Additional preferences would come from user.preferences object
        // For now, using defaults as these extended preferences aren't in the User type yet
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // Update user preferences in context
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: user.id,
          updates: {
            preferences: {
              theme: formData.theme,
              notifications: formData.notifications,
              timezone: formData.timezone,
              // Additional preferences would be added here when backend supports them
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
          preferences: {
            theme: formData.theme,
            notifications: formData.notifications,
            timezone: formData.timezone,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      setMessage({ type: 'success', text: 'Preferences updated successfully!' });

      // TODO: Make API call to update preferences on backend
      // await apiClient.updateUserPreferences(user.id, formData);

    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Preferences</h2>
        <p className="text-sm text-neutral-600">Customize your application experience</p>
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

      {/* Preferences Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Appearance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-neutral-700 mb-1">
                Theme
              </label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium text-neutral-700 mb-1">
                Date Format
              </label>
              <select
                id="dateFormat"
                name="dateFormat"
                value={formData.dateFormat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {dateFormats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium text-neutral-700 mb-1">
                Time Format
              </label>
              <select
                id="timeFormat"
                name="timeFormat"
                value={formData.timeFormat}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="12h">12 Hour (AM/PM)</option>
                <option value="24h">24 Hour</option>
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-neutral-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Time Tracking
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="defaultTimeEntryDuration" className="block text-sm font-medium text-neutral-700 mb-1">
                Default Time Entry Duration (minutes)
              </label>
              <input
                type="number"
                id="defaultTimeEntryDuration"
                name="defaultTimeEntryDuration"
                value={formData.defaultTimeEntryDuration}
                onChange={handleInputChange}
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="reminderInterval" className="block text-sm font-medium text-neutral-700 mb-1">
                Timer Reminder Interval (minutes)
              </label>
              <select
                id="reminderInterval"
                name="reminderInterval"
                value={formData.reminderInterval}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={0}>No reminders</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
                <option value={120}>Every 2 hours</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoStartTimer"
                name="autoStartTimer"
                checked={formData.autoStartTimer}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoStartTimer" className="ml-2 text-sm text-neutral-700">
                Auto-start timer when opening the application
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showTimerInMenuBar"
                name="showTimerInMenuBar"
                checked={formData.showTimerInMenuBar}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showTimerInMenuBar" className="ml-2 text-sm text-neutral-700">
                Show timer in menu bar
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="defaultBillableStatus"
                name="defaultBillableStatus"
                checked={formData.defaultBillableStatus}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="defaultBillableStatus" className="ml-2 text-sm text-neutral-700">
                Mark new time entries as billable by default
              </label>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Working Hours
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workingHoursStart" className="block text-sm font-medium text-neutral-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="workingHoursStart"
                name="workingHoursStart"
                value={formData.workingHoursStart}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="workingHoursEnd" className="block text-sm font-medium text-neutral-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                id="workingHoursEnd"
                name="workingHoursEnd"
                value={formData.workingHoursEnd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Timezone */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-neutral-900 border-b border-neutral-200 pb-2">
            Notifications & Location
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={formData.notifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="notifications" className="ml-2 text-sm text-neutral-700">
                Enable notifications
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesSettings; 