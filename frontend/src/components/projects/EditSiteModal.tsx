import { useState, useEffect } from 'react';
import { useProjectsStore } from '../../store/projectsStore';

interface EditSiteModalProps {
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSiteModal({ siteId, isOpen, onClose }: EditSiteModalProps) {
  const { currentProject, updateSite, isUpdating, error } = useProjectsStore();

  // Find the site in currentProject
  const site = currentProject?.sites.find((s) => s.id === siteId);

  const [formData, setFormData] = useState({
    name: site?.name || '',
    description: site?.description || '',
    latitude: site?.latitude || '',
    longitude: site?.longitude || '',
    nadir: site?.nadir || false,
    oblique: site?.oblique || false,
  });

  const [validationError, setValidationError] = useState('');

  // Update form when site changes
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        description: site.description || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        nadir: site.nadir,
        oblique: site.oblique,
      });
    }
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Basic validation
    if (!formData.name.trim()) {
      setValidationError('Site name is required');
      return;
    }

    // Validate GPS coordinates if provided
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude.toString());
      const lon = parseFloat(formData.longitude.toString());

      if (isNaN(lat) || lat < -90 || lat > 90) {
        setValidationError('Latitude must be between -90 and 90');
        return;
      }

      if (isNaN(lon) || lon < -180 || lon > 180) {
        setValidationError('Longitude must be between -180 and 180');
        return;
      }
    }

    try {
      await updateSite(siteId, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude.toString()) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude.toString()) : undefined,
        nadir: formData.nadir,
        oblique: formData.oblique,
      });

      onClose();
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleClose = () => {
    if (site) {
      setFormData({
        name: site.name,
        description: site.description || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        nadir: site.nadir,
        oblique: site.oblique,
      });
    }
    setValidationError('');
    onClose();
  };

  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Site</h3>

              {/* Error Messages */}
              {(error || validationError) && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{validationError || error}</p>
                </div>
              )}

              {/* Site Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  maxLength={1000}
                />
              </div>

              {/* GPS Coordinates */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="latitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    step="any"
                    min={-90}
                    max={90}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    step="any"
                    min={-180}
                    max={180}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Capture Types */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capture Types
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.nadir}
                      onChange={(e) => setFormData({ ...formData, nadir: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Nadir (straight down) captures
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.oblique}
                      onChange={(e) => setFormData({ ...formData, oblique: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Oblique (angled) captures
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
