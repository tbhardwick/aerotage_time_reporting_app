import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

interface NotificationFormData {
  // Email notifications
  emailEnabled: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  
  // Time tracking notifications
  timerReminders: boolean;
  timerReminderInterval: number; // in minutes
  dailyTimeGoal: number; // in hours
  weeklyTimeGoal: number; // in hours
  goalNotifications: boolean;
  
  // System notifications
  systemNotifications: boolean;
  
  // Work events
  timeEntrySubmissionReminders: boolean;
  approvalNotifications: boolean;
  projectDeadlineReminders: boolean;
  overdueTaskNotifications: boolean;
  
  // Invoice and billing
  invoiceStatusUpdates: boolean;
  paymentReminders: boolean;
  
  // Team notifications
  teamActivityUpdates: boolean;
  userInvitationUpdates: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  weekendsQuiet: boolean;
}

const NotificationSettings: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user } = state;

  const [formData, setFormData] = useState<NotificationFormData>({
    emailEnabled: true,
    emailFrequency: 'daily',
    timerReminders: true,
    timerReminderInterval: 30,
    dailyTimeGoal: 8,
    weeklyTimeGoal: 40,
    goalNotifications: true,
    systemNotifications: true,
    timeEntrySubmissionReminders: true,
    approvalNotifications: true,
    projectDeadlineReminders: true,
    overdueTaskNotifications: true,
    invoiceStatusUpdates: true,
    paymentReminders: true,
    teamActivityUpdates: false,
    userInvitationUpdates: true,
    quietHoursEnabled: false,
    quietHoursStart: '18:00',
    quietHoursEnd: '09:00',
    weekendsQuiet: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData(prevData => ({
        ...prevData,
        // Use existing user notification preferences if available
        emailEnabled: user.preferences?.notifications ?? true,
        // Other notification preferences would come from user.notificationSettings
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
      // Update user notification preferences in context
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          id: user.id,
          updates: {
            preferences: {
              ...user.preferences,
              notifications: formData.emailEnabled,
              // Additional notification preferences would be added here when backend supports them
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
            ...user.preferences,
            notifications: formData.emailEnabled,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      setMessage({ type: 'success', text: 'Notification settings updated successfully!' });

      // TODO: Make API call to update notification settings on backend
      // await apiClient.updateNotificationSettings(user.id, formData);

    } catch (error) {
      console.error('Error updating notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to update notification settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)]">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Notification Settings</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Configure how and when you receive notifications</p>
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

      {/* Notification Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Notifications */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Email Notifications
          </h3>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="emailEnabled"
              name="emailEnabled"
              checked={formData.emailEnabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
            />
            <label htmlFor="emailEnabled" className="ml-2 text-sm text-[var(--color-text-secondary)]">
              Enable email notifications
            </label>
          </div>

          {formData.emailEnabled && (
            <div>
              <label htmlFor="emailFrequency" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Email Frequency
              </label>
              <select
                id="emailFrequency"
                name="emailFrequency"
                value={formData.emailFrequency}
                onChange={handleInputChange}
                className="w-full md:w-64 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
                <option value="never">Never</option>
              </select>
            </div>
          )}
        </div>

        {/* Time Tracking Notifications */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Time Tracking
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="timerReminders"
                name="timerReminders"
                checked={formData.timerReminders}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="timerReminders" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Timer reminders when not tracking time
              </label>
            </div>

            {formData.timerReminders && (
              <div className="ml-6">
                <label htmlFor="timerReminderInterval" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Reminder interval
                </label>
                <select
                  id="timerReminderInterval"
                  name="timerReminderInterval"
                  value={formData.timerReminderInterval}
                  onChange={handleInputChange}
                  className="w-full md:w-48 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                  <option value={120}>Every 2 hours</option>
                </select>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="goalNotifications"
                name="goalNotifications"
                checked={formData.goalNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="goalNotifications" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Time goal notifications
              </label>
            </div>

            {formData.goalNotifications && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dailyTimeGoal" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Daily goal (hours)
                  </label>
                  <input
                    type="number"
                    id="dailyTimeGoal"
                    name="dailyTimeGoal"
                    value={formData.dailyTimeGoal}
                    onChange={handleInputChange}
                    min="1"
                    max="16"
                    step="0.5"
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label htmlFor="weeklyTimeGoal" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Weekly goal (hours)
                  </label>
                  <input
                    type="number"
                    id="weeklyTimeGoal"
                    name="weeklyTimeGoal"
                    value={formData.weeklyTimeGoal}
                    onChange={handleInputChange}
                    min="1"
                    max="80"
                    step="0.5"
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Events */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Work Events
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="timeEntrySubmissionReminders"
                name="timeEntrySubmissionReminders"
                checked={formData.timeEntrySubmissionReminders}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="timeEntrySubmissionReminders" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Time entry submission reminders
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="approvalNotifications"
                name="approvalNotifications"
                checked={formData.approvalNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="approvalNotifications" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Time entry approval/rejection notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="projectDeadlineReminders"
                name="projectDeadlineReminders"
                checked={formData.projectDeadlineReminders}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="projectDeadlineReminders" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Project deadline reminders
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="overdueTaskNotifications"
                name="overdueTaskNotifications"
                checked={formData.overdueTaskNotifications}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="overdueTaskNotifications" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Overdue task notifications
              </label>
            </div>
          </div>
        </div>

        {/* Billing & Invoices */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Billing & Invoices
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="invoiceStatusUpdates"
                name="invoiceStatusUpdates"
                checked={formData.invoiceStatusUpdates}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="invoiceStatusUpdates" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Invoice status updates
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="paymentReminders"
                name="paymentReminders"
                checked={formData.paymentReminders}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="paymentReminders" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Payment reminders
              </label>
            </div>
          </div>
        </div>

        {/* Team Updates */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Team Updates
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="teamActivityUpdates"
                name="teamActivityUpdates"
                checked={formData.teamActivityUpdates}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="teamActivityUpdates" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Team activity updates
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="userInvitationUpdates"
                name="userInvitationUpdates"
                checked={formData.userInvitationUpdates}
                onChange={handleInputChange}
                className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
              />
              <label htmlFor="userInvitationUpdates" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                User invitation updates
              </label>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            System
          </h3>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="systemNotifications"
              name="systemNotifications"
              checked={formData.systemNotifications}
              onChange={handleInputChange}
              className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
            />
            <label htmlFor="systemNotifications" className="ml-2 text-sm text-[var(--color-text-secondary)]">
              Enable system/desktop notifications
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            Quiet Hours
          </h3>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="quietHoursEnabled"
              name="quietHoursEnabled"
              checked={formData.quietHoursEnabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
            />
            <label htmlFor="quietHoursEnabled" className="ml-2 text-sm text-[var(--color-text-secondary)]">
              Enable quiet hours (no notifications during these times)
            </label>
          </div>

          {formData.quietHoursEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quietHoursStart" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    id="quietHoursStart"
                    name="quietHoursStart"
                    value={formData.quietHoursStart}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
                <div>
                  <label htmlFor="quietHoursEnd" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    End time
                  </label>
                  <input
                    type="time"
                    id="quietHoursEnd"
                    name="quietHoursEnd"
                    value={formData.quietHoursEnd}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-lg text-sm focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="weekendsQuiet"
                  name="weekendsQuiet"
                  checked={formData.weekendsQuiet}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--color-primary-600)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary-500)]"
                />
                <label htmlFor="weekendsQuiet" className="ml-2 text-sm text-[var(--color-text-secondary)]">
                  Apply quiet hours to weekends
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-[var(--color-border)]">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-[var(--color-primary-600)] text-white rounded-lg hover:bg-[var(--color-primary-700)] transition-colors duration-200 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings; 