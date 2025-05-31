import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
import { useApiOperations } from '../../hooks/useApiOperations';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Validation schema
const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  billingAddress: z.string().optional(),
  isActive: z.boolean(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ clientId, onClose, onSuccess }) => {
  const { state } = useAppContext();
  const { createClient, updateClient } = useApiOperations();
  const isEditing = !!clientId;
  const client = isEditing ? state.clients.find(c => c.id === clientId) : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      billingAddress: '',
      isActive: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.contactInfo.email || '',
        phone: client.contactInfo.phone || '',
        address: client.contactInfo.address || '',
        billingAddress: client.billingAddress || '',
        isActive: client.isActive,
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        name: data.name,
        contactInfo: {
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        },
        billingAddress: data.billingAddress || undefined,
        isActive: data.isActive,
      };

      if (isEditing && clientId) {
        await updateClient(clientId, clientData);
      } else {
        await createClient(clientData);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--surface-color)' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--color-secondary-50)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Client Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              placeholder="Enter client name"
              style={{
                border: errors.name ? '1px solid var(--color-error-300)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.name && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.name.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Contact Information</h3>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="client@example.com"
                style={{
                  border: errors.email ? '1px solid var(--color-error-300)' : '1px solid var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-primary)'
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error-600)' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="+1 (555) 123-4567"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Address
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="123 Business St, Suite 100, City, State 12345"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Billing Information</h3>
            
            {/* Billing Address */}
            <div>
              <label htmlFor="billingAddress" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Billing Address
              </label>
              <textarea
                id="billingAddress"
                {...register('billingAddress')}
                rows={3}
                className="block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Same as address above or enter different billing address"
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Leave blank to use the same address as above
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded shadow-sm focus:ring-2 focus:ring-offset-2"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--color-primary-600)',
                  backgroundColor: 'var(--background-color)'
                }}
              />
              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Active Client
              </span>
            </label>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Inactive clients won't appear in project creation dropdowns
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface-color)',
                borderColor: 'var(--border-color)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-secondary-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                color: 'var(--color-text-on-primary)',
                backgroundColor: 'var(--color-primary-600)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }
              }}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm; 