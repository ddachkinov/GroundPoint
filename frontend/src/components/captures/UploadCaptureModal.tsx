import { useState, useEffect } from 'react';
import { useCapturesStore } from '../../store/capturesStore';
import { WeatherCondition } from '../../api/captures';

interface UploadCaptureModalProps {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadCaptureModal({
  siteId,
  siteName,
  isOpen,
  onClose,
}: UploadCaptureModalProps) {
  const {
    angles,
    uploadProgress,
    isUploading,
    error,
    listAngles,
    createAngle,
    uploadFile,
    clearUploadProgress,
  } = useCapturesStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isCreatingAngle, setIsCreatingAngle] = useState(false);
  const [newAngleName, setNewAngleName] = useState('');

  const [formData, setFormData] = useState({
    angleId: '',
    captureDate: new Date().toISOString().split('T')[0],
    latitude: '',
    longitude: '',
    weather: '' as WeatherCondition | '',
    notes: '',
  });

  const [validationError, setValidationError] = useState('');

  // Load angles when modal opens
  useEffect(() => {
    if (isOpen && siteId) {
      listAngles(siteId);
    }
  }, [isOpen, siteId, listAngles]);

  // Create preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setValidationError('File type not supported. Please upload JPEG, PNG, or TIFF.');
        return;
      }

      // Validate file size (50 MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setValidationError('File size exceeds 50 MB limit.');
        return;
      }

      setSelectedFile(file);
      setValidationError('');
    }
  };

  const handleCreateAngle = async () => {
    if (!newAngleName.trim()) {
      setValidationError('Angle name is required');
      return;
    }

    try {
      const angle = await createAngle(siteId, { name: newAngleName.trim() });
      setFormData({ ...formData, angleId: angle.id });
      setNewAngleName('');
      setIsCreatingAngle(false);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedFile) {
      setValidationError('Please select a file');
      return;
    }

    if (!formData.angleId) {
      setValidationError('Please select an angle');
      return;
    }

    // Validate capture date
    const captureDate = new Date(formData.captureDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (captureDate > today) {
      setValidationError('Capture date cannot be in the future');
      return;
    }

    // Validate GPS coordinates if provided
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lon = parseFloat(formData.longitude);

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
      await uploadFile(selectedFile, siteId, formData.angleId, {
        capture_date: formData.captureDate,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        weather: formData.weather || undefined,
        notes: formData.notes || undefined,
      });

      // Reset form on success
      setSelectedFile(null);
      setPreviewUrl('');
      setFormData({
        angleId: '',
        captureDate: new Date().toISOString().split('T')[0],
        latitude: '',
        longitude: '',
        weather: '',
        notes: '',
      });

      // Auto-close after successful upload
      setTimeout(() => {
        clearUploadProgress();
        onClose();
      }, 2000);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setPreviewUrl('');
      setValidationError('');
      clearUploadProgress();
      onClose();
    }
  };

  if (!isOpen) return null;

  const uploadProgressEntries = Object.values(uploadProgress);
  const currentUpload = uploadProgressEntries[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Upload Image to {siteName}
              </h3>

              {/* Error Messages */}
              {(error || validationError) && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{validationError || error}</p>
                </div>
              )}

              {/* Upload Progress */}
              {currentUpload && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      {currentUpload.fileName}
                    </span>
                    <span className="text-sm text-blue-700">
                      {currentUpload.status === 'uploading' && `${currentUpload.progress}%`}
                      {currentUpload.status === 'completing' && 'Finalizing...'}
                      {currentUpload.status === 'complete' && 'Complete!'}
                      {currentUpload.status === 'error' && 'Failed'}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        currentUpload.status === 'error'
                          ? 'bg-red-600'
                          : currentUpload.status === 'complete'
                          ? 'bg-green-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${currentUpload.progress}%` }}
                    />
                  </div>
                  {currentUpload.error && (
                    <p className="mt-2 text-sm text-red-600">{currentUpload.error}</p>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/tiff"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: JPEG, PNG, TIFF (max 50 MB)
                </p>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 w-full object-contain rounded border"
                  />
                </div>
              )}

              {/* Angle Selection */}
              <div className="mb-4">
                <label htmlFor="angleId" className="block text-sm font-medium text-gray-700 mb-1">
                  Capture Angle <span className="text-red-500">*</span>
                </label>
                {isCreatingAngle ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAngleName}
                      onChange={(e) => setNewAngleName(e.target.value)}
                      placeholder="Enter angle name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={handleCreateAngle}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingAngle(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <select
                      id="angleId"
                      value={formData.angleId}
                      onChange={(e) => setFormData({ ...formData, angleId: e.target.value })}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isUploading}
                      required
                    >
                      <option value="">Select angle...</option>
                      {angles.map((angle) => (
                        <option key={angle.id} value={angle.id}>
                          {angle.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingAngle(true)}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 whitespace-nowrap"
                      disabled={isUploading}
                    >
                      + New Angle
                    </button>
                  </div>
                )}
              </div>

              {/* Capture Date */}
              <div className="mb-4">
                <label htmlFor="captureDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Capture Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="captureDate"
                  value={formData.captureDate}
                  onChange={(e) => setFormData({ ...formData, captureDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isUploading}
                  required
                />
              </div>

              {/* GPS Coordinates */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 40.7128"
                    step="any"
                    min={-90}
                    max={90}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., -74.0060"
                    step="any"
                    min={-180}
                    max={180}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Weather */}
              <div className="mb-4">
                <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">
                  Weather Conditions
                </label>
                <select
                  id="weather"
                  value={formData.weather}
                  onChange={(e) =>
                    setFormData({ ...formData, weather: e.target.value as WeatherCondition | '' })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isUploading}
                >
                  <option value="">Not specified</option>
                  <option value="SUNNY">Sunny</option>
                  <option value="CLOUDY">Cloudy</option>
                  <option value="RAINY">Rainy</option>
                  <option value="SNOWY">Snowy</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this capture..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isUploading}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500 characters</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
