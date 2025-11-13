import { useSearchParams } from 'react-router-dom';
import { PasswordResetRequest } from '../components/auth/PasswordResetRequest';
import { PasswordResetConfirm } from '../components/auth/PasswordResetConfirm';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900">GroundPoint</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {token ? <PasswordResetConfirm /> : <PasswordResetRequest />}
        </div>
      </div>
    </div>
  );
}
