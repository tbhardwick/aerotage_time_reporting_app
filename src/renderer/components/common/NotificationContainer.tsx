import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/solid';
import { Notification } from '../../types';

const NotificationContainer: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const dispatch = useDispatch();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-error-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-primary-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200';
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      case 'error':
        return 'bg-error-50 border-error-200';
      default:
        return 'bg-primary-50 border-primary-200';
    }
  };

  useEffect(() => {
    notifications.forEach((notification: Notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification: Notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm w-full shadow-medium rounded-xl border p-4 
            ${getBackgroundColor(notification.type)}
            animate-slide-in
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="
                  inline-flex text-neutral-400 hover:text-neutral-600 
                  focus:outline-none focus:ring-2 focus:ring-primary-500 
                  rounded-md p-1 transition-colors
                "
                onClick={() => dispatch(removeNotification(notification.id))}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer; 