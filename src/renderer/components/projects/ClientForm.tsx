import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '../../context/AppContext';
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
  const { state, dispatch } = useAppContext();
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
        dispatch({
          type: 'UPDATE_CLIENT',
          payload: {
            id: clientId,
            updates: clientData,
          },
        });
      } else {
        dispatch({
          type: 'ADD_CLIENT',
          payload: clientData,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            {isEditing ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Client Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="Enter client name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-900">Contact Information</h3>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className={`block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                {...register('address')}
                rows={3}
                className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Business St, Suite 100, City, State 12345"
              />
            </div>
          </div>

          {/* Billing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-900">Billing Information</h3>
            
            {/* Billing Address */}
            <div>
              <label htmlFor="billingAddress" className="block text-sm font-medium text-neutral-700 mb-2">
                Billing Address
              </label>
              <textarea
                id="billingAddress"
                {...register('billingAddress')}
                rows={3}
                className="block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Same as address above or enter different billing address"
              />
              <p className="mt-1 text-sm text-neutral-500">
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
                className="rounded border-neutral-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm font-medium text-neutral-700">
                Active Client
              </span>
            </label>
            <p className="mt-1 text-sm text-neutral-500">
              Inactive clients won't appear in project creation dropdowns
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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