import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  const { verifyEmail, error } = useAuthStore();

  useEffect(() => {
    if (token) {
      verifyEmail(token)
        .then(() => {
          setSuccess(true);
        })
        .catch(() => {
          // Error is stored in the store
        })
        .finally(() => {
          setVerifying(false);
        });
    } else {
      setVerifying(false);
    }
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900">GroundPoint</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {verifying && (
            <div className="text-center">
              <p className="text-gray-600">Verifying your email address...</p>
            </div>
          )}

          {!verifying && success && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <p className="font-medium">Email verified successfully!</p>
                <p className="text-sm mt-1">You can now log in to your account.</p>
              </div>
              <div className="text-center">
                <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                  Go to login
                </Link>
              </div>
            </div>
          )}

          {!verifying && !success && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Verification failed</p>
                <p className="text-sm mt-1">{error || 'Invalid or expired verification token.'}</p>
              </div>
              <div className="text-center">
                <Link
                  to="/register"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Create a new account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
