import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { mockLogin } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(mockLogin(email, password) as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Aerotage Time Reporting
          </h1>
          <p className="text-neutral-600">
            Sign in to track your time and manage projects
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-medium p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full px-4 py-3 border border-neutral-300 rounded-xl
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  transition-colors
                "
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full px-4 py-3 border border-neutral-300 rounded-xl
                  focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  transition-colors
                "
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full bg-primary-600 hover:bg-primary-700 
                text-white font-medium py-3 px-4 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {isLoading ? (
                <LoadingSpinner size="sm" className="text-white" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Demo credentials:
            </p>
            <div className="mt-2 space-y-1 text-xs text-neutral-500">
              <p>admin@aerotage.com / password123</p>
              <p>manager@aerotage.com / password123</p>
              <p>engineer@aerotage.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 