import { useAuthStore } from '../store/authStore';

export function DashboardPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">GroundPoint</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to GroundPoint!</h2>
            <p className="text-gray-600 mb-4">
              You're logged in as <strong>{user?.email}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Role: <strong>{user?.role}</strong>
            </p>
            <p className="text-gray-600">
              Organization ID: <strong>{user?.organizationId}</strong>
            </p>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-blue-800 text-sm">
                🚧 Dashboard features are under development. Coming soon:
              </p>
              <ul className="mt-2 text-blue-700 text-sm list-disc list-inside">
                <li>Project management</li>
                <li>Site creation and monitoring</li>
                <li>Image upload and timeline view</li>
                <li>Invoice generation and payments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
