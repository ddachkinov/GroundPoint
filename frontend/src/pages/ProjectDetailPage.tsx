import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProjectsStore } from '../store/projectsStore';
import { CreateSiteModal } from '../components/projects/CreateSiteModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { EditSiteModal } from '../components/projects/EditSiteModal';
import { UploadCaptureModal } from '../components/captures/UploadCaptureModal';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    currentProject,
    isLoading,
    error,
    getProject,
    archiveProject,
    deleteSite,
    clearCurrentProject,
  } = useProjectsStore();

  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [uploadSiteId, setUploadSiteId] = useState<string | null>(null);
  const [uploadSiteName, setUploadSiteName] = useState<string>('');

  useEffect(() => {
    if (id) {
      getProject(id);
    }
    return () => {
      clearCurrentProject();
    };
  }, [id, getProject, clearCurrentProject]);

  const handleLogout = async () => {
    await logout();
  };

  const handleArchive = async () => {
    if (
      id &&
      window.confirm(
        'Are you sure you want to archive this project? All sites will remain but the project will be archived.'
      )
    ) {
      try {
        await archiveProject(id);
        navigate('/projects');
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await deleteSite(siteId);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Link to="/projects" className="text-blue-600 hover:text-blue-800">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isOperator = user?.role !== 'SITE_OWNER_MEMBER';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold text-gray-900">
                GroundPoint
              </Link>
              <div className="flex space-x-4">
                <Link
                  to="/projects"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Projects
                </Link>
              </div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Projects
            </Link>
          </div>

          {/* Project Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      currentProject.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : currentProject.status === 'PAUSED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : currentProject.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {currentProject.status}
                  </span>
                </div>
                {currentProject.description && (
                  <p className="text-gray-600 mb-4">{currentProject.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Sites:</span>
                    <span className="ml-2 font-medium">{currentProject.siteCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Retention:</span>
                    <span className="ml-2 font-medium">{currentProject.retentionDays} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(currentProject.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(currentProject.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {isOperator && currentProject.status !== 'ARCHIVED' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditProjectModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sites Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Sites</h2>
              {isOperator && currentProject.status === 'ACTIVE' && (
                <button
                  onClick={() => setIsCreateSiteModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Site
                </button>
              )}
            </div>

            {currentProject.sites.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500 mb-4">No sites in this project yet.</p>
                {isOperator && currentProject.status === 'ACTIVE' && (
                  <button
                    onClick={() => setIsCreateSiteModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Your First Site
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capture Types
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProject.sites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{site.name}</div>
                          {site.description && (
                            <div className="text-sm text-gray-500">{site.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {site.latitude && site.longitude ? (
                            <span>
                              {parseFloat(site.latitude).toFixed(6)},{' '}
                              {parseFloat(site.longitude).toFixed(6)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {site.nadir && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                Nadir
                              </span>
                            )}
                            {site.oblique && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                Oblique
                              </span>
                            )}
                            {!site.nadir && !site.oblique && (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(site.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setUploadSiteId(site.id);
                              setUploadSiteName(site.name);
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Upload
                          </button>
                          {isOperator && (
                            <>
                              <button
                                onClick={() => setEditingSiteId(site.id)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSite(site.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {id && (
        <>
          <CreateSiteModal
            projectId={id}
            isOpen={isCreateSiteModalOpen}
            onClose={() => setIsCreateSiteModalOpen(false)}
          />
          <EditProjectModal
            project={currentProject}
            isOpen={isEditProjectModalOpen}
            onClose={() => setIsEditProjectModalOpen(false)}
          />
          {editingSiteId && (
            <EditSiteModal
              siteId={editingSiteId}
              isOpen={true}
              onClose={() => setEditingSiteId(null)}
            />
          )}
          {uploadSiteId && (
            <UploadCaptureModal
              siteId={uploadSiteId}
              siteName={uploadSiteName}
              isOpen={true}
              onClose={() => {
                setUploadSiteId(null);
                setUploadSiteName('');
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
