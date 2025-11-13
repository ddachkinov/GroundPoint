import { apiClient } from './client';

/**
 * Weather condition enum
 */
export type WeatherCondition = 'SUNNY' | 'CLOUDY' | 'RAINY' | 'SNOWY';

/**
 * Processing status enum
 */
export type ProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

/**
 * Angle type
 */
export interface Angle {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Capture type
 */
export interface Capture {
  capture_id: string;
  site_id: string;
  site_name: string;
  angle_id: string;
  angle_name: string;
  capture_date: string;
  file_url?: string;
  thumbnail_url?: string;
  file_size: string;
  image_width: number | null;
  image_height: number | null;
  latitude: string | null;
  longitude: string | null;
  weather: WeatherCondition | null;
  notes: string | null;
  uploaded_by_user_id: string;
  uploaded_by_user_name: string;
  processing_status: ProcessingStatus;
  created_at: string;
}

/**
 * Request upload URL input
 */
export interface RequestUploadUrlInput {
  site_id: string;
  angle_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

/**
 * Upload URL response
 */
export interface UploadUrlResponse {
  capture_id: string;
  upload_url: string;
  s3_key: string;
  expires_in: number;
}

/**
 * Complete upload input
 */
export interface CompleteUploadInput {
  capture_id: string;
  s3_key: string;
  capture_date: string;
  latitude?: number;
  longitude?: number;
  weather?: WeatherCondition;
  notes?: string;
}

/**
 * List captures query
 */
export interface ListCapturesQuery {
  site_id?: string;
  project_id?: string;
  angle_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort?: 'date_asc' | 'date_desc';
}

/**
 * Captures list response
 */
export interface CapturesListResponse {
  captures: Capture[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Create angle input
 */
export interface CreateAngleInput {
  name: string;
  description?: string;
}

/**
 * Calendar query
 */
export interface CalendarQuery {
  site_id?: string;
  project_id?: string;
  angle_id?: string;
  month?: string; // YYYY-MM format
}

/**
 * Calendar date with count
 */
export interface CalendarDate {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Calendar response
 */
export interface CalendarResponse {
  month: string;
  dates: CalendarDate[];
}

/**
 * Captures API client
 */
export const capturesAPI = {
  /**
   * Request pre-signed upload URL
   */
  requestUploadUrl: async (input: RequestUploadUrlInput): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<UploadUrlResponse>('/captures/upload-url', input);
    return response.data;
  },

  /**
   * Upload file to S3 using pre-signed URL
   */
  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    await apiClient.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  /**
   * Complete upload with metadata
   */
  completeUpload: async (
    input: CompleteUploadInput
  ): Promise<{ capture_id: string; processing_status: string; message: string }> => {
    const response = await apiClient.post('/captures/complete', input);
    return response.data;
  },

  /**
   * List captures
   */
  listCaptures: async (query?: ListCapturesQuery): Promise<CapturesListResponse> => {
    const response = await apiClient.get<CapturesListResponse>('/captures', {
      params: query,
    });
    return response.data;
  },

  /**
   * Get capture by ID
   */
  getCapture: async (captureId: string): Promise<Capture> => {
    const response = await apiClient.get<{ capture: Capture }>(`/captures/${captureId}`);
    return response.data.capture;
  },

  /**
   * Delete capture
   */
  deleteCapture: async (captureId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/captures/${captureId}`);
    return response.data;
  },

  /**
   * Create angle for site
   */
  createAngle: async (siteId: string, input: CreateAngleInput): Promise<Angle> => {
    const response = await apiClient.post<{ angle: Angle }>(`/sites/${siteId}/angles`, input);
    return response.data.angle;
  },

  /**
   * List angles for site
   */
  listAngles: async (siteId: string): Promise<Angle[]> => {
    const response = await apiClient.get<{ angles: Angle[] }>(`/sites/${siteId}/angles`);
    return response.data.angles;
  },

  /**
   * Get calendar data (dates with capture counts)
   */
  getCalendarData: async (query?: CalendarQuery): Promise<CalendarResponse> => {
    const response = await apiClient.get<CalendarResponse>('/captures/calendar', {
      params: query,
    });
    return response.data;
  },

  /**
   * Regenerate thumbnail for a capture
   */
  regenerateThumbnail: async (captureId: string): Promise<{ message: string; capture_id: string }> => {
    const response = await apiClient.post<{ message: string; capture_id: string }>(
      `/captures/${captureId}/regenerate-thumbnail`
    );
    return response.data;
  },
};
