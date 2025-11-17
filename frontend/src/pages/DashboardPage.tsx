import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function DashboardPage() {
  const { t } = useTranslation();
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
              <h1 className="text-xl font-bold text-gray-900">{t('common.appName')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('dashboard.welcome')}</h2>
            <p className="text-gray-600 mb-4">
              {t('dashboard.loggedInAs')} <strong>{user?.email}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              {t('common.role')}: <strong>{user?.role}</strong>
            </p>
            <p className="text-gray-600">
              {t('common.organizationId')}: <strong>{user?.organizationId}</strong>
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/projects"
                  className="block p-6 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    {t('dashboard.manageProjects')}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {t('dashboard.manageProjectsDesc')}
                  </p>
                </Link>
                <div className="block p-6 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-60">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    {t('dashboard.uploadImages')}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {t('dashboard.uploadImagesDesc')}
                  </p>
                </div>
                <div className="block p-6 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-60">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    {t('dashboard.viewReports')}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {t('dashboard.viewReportsDesc')}
                  </p>
                </div>
                <div className="block p-6 bg-gray-50 border-2 border-gray-200 rounded-lg opacity-60">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    {t('dashboard.billing')}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {t('dashboard.billingDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
