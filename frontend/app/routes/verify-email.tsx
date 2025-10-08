import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { apiClient } from '../lib/api/client';
import { useAuth } from '../lib/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        // apiClient.get already unwraps the response, so we get the data directly
        const response = await apiClient.get(`/auth/verify-email?token=${token}`) as any;
        
        // Backend returns { success: true, message: "..." }
        // apiClient returns the full JSON when there's no 'data' field
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
          
          // If user is logged in, refresh their data to get updated emailVerified status
          if (isLoggedIn) {
            await refreshUser();
            // Redirect to home page after 2 seconds
            setTimeout(() => {
              navigate('/', { state: { emailVerified: true } });
            }, 2000);
          } else {
            // If not logged in, redirect to login page after 3 seconds
            setTimeout(() => {
              navigate('/login', { state: { emailVerified: true } });
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Verification failed');
        }
      } catch (error: any) {
        setStatus('error');
        // ApiError has a 'data' property with the response body
        setMessage(
          error.data?.message || 
          error.message ||
          'Failed to verify email. Please try again or request a new verification link.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Email Verified! ✓
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">
                {isLoggedIn 
                  ? 'Redirecting you to home...'
                  : 'Redirecting you to login...'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Verification Failed
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/resend-verification')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Request New Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
