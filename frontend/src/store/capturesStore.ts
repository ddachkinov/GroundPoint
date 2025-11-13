import { create } from 'zustand';
import {
  capturesAPI,
  Capture,
  Angle,
  RequestUploadUrlInput,
  CompleteUploadInput,
  ListCapturesQuery,
  CreateAngleInput,
} from '../api/captures';
import { getErrorMessage } from '../api/client';

/**
 * Upload progress tracking
 */
interface UploadProgress {
  captureId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completing' | 'complete' | 'error';
  error?: string;
}

/**
 * Captures store state
 */
interface CapturesState {
  // Captures data
  captures: Capture[];
  currentCapture: Capture | null;
  total: number;
  limit: number;
  offset: number;

  // Angles data
  angles: Angle[];

  // Upload progress
  uploadProgress: Record<string, UploadProgress>;

  // UI state
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions - Captures
  listCaptures: (query?: ListCapturesQuery) => Promise<void>;
  getCapture: (captureId: string) => Promise<void>;
  deleteCapture: (captureId: string) => Promise<void>;
  refreshCaptures: () => Promise<void>;

  // Actions - Upload
  uploadFile: (
    file: File,
    siteId: string,
    angleId: string,
    metadata: Omit<CompleteUploadInput, 'capture_id' | 's3_key'>
  ) => Promise<void>;
  cancelUpload: (fileName: string) => void;
  clearUploadProgress: () => void;

  // Actions - Angles
  listAngles: (siteId: string) => Promise<void>;
  createAngle: (siteId: string, input: CreateAngleInput) => Promise<Angle>;

  // Utility actions
  clearError: () => void;
  clearCurrentCapture: () => void;
}

/**
 * Captures store
 */
export const useCapturesStore = create<CapturesState>((set, get) => ({
  // Initial state
  captures: [],
  currentCapture: null,
  total: 0,
  limit: 50,
  offset: 0,
  angles: [],
  uploadProgress: {},
  isLoading: false,
  isUploading: false,
  error: null,

  /**
   * List captures
   */
  listCaptures: async (query?: ListCapturesQuery) => {
    set({ isLoading: true, error: null });
    try {
      const response = await capturesAPI.listCaptures(query);
      set({
        captures: response.captures,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        captures: [],
        total: 0,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Get capture by ID
   */
  getCapture: async (captureId: string) => {
    set({ isLoading: true, error: null });
    try {
      const capture = await capturesAPI.getCapture(captureId);
      set({
        currentCapture: capture,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        currentCapture: null,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Delete capture
   */
  deleteCapture: async (captureId: string) => {
    set({ isLoading: true, error: null });
    try {
      await capturesAPI.deleteCapture(captureId);

      // Remove from captures list
      set((state) => ({
        captures: state.captures.filter((c) => c.capture_id !== captureId),
        isLoading: false,
        error: null,
      }));

      // Clear current capture if it matches
      const currentCapture = get().currentCapture;
      if (currentCapture && currentCapture.capture_id === captureId) {
        set({ currentCapture: null });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Refresh captures list
   */
  refreshCaptures: async () => {
    const { limit, offset } = get();
    await get().listCaptures({ limit, offset });
  },

  /**
   * Upload file with progress tracking
   */
  uploadFile: async (
    file: File,
    siteId: string,
    angleId: string,
    metadata: Omit<CompleteUploadInput, 'capture_id' | 's3_key'>
  ) => {
    const fileName = file.name;

    try {
      // Initialize upload progress
      set((state) => ({
        isUploading: true,
        uploadProgress: {
          ...state.uploadProgress,
          [fileName]: {
            captureId: '',
            fileName,
            progress: 0,
            status: 'uploading',
          },
        },
      }));

      // Step 1: Request pre-signed upload URL
      const uploadUrlInput: RequestUploadUrlInput = {
        site_id: siteId,
        angle_id: angleId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      };

      const urlResponse = await capturesAPI.requestUploadUrl(uploadUrlInput);

      // Update progress with capture ID
      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileName]: {
            ...state.uploadProgress[fileName],
            captureId: urlResponse.capture_id,
          },
        },
      }));

      // Step 2: Upload file to S3 with progress tracking
      await capturesAPI.uploadToS3(urlResponse.upload_url, file, (progress) => {
        set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [fileName]: {
              ...state.uploadProgress[fileName],
              progress,
            },
          },
        }));
      });

      // Step 3: Complete upload with metadata
      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileName]: {
            ...state.uploadProgress[fileName],
            status: 'completing',
            progress: 100,
          },
        },
      }));

      const completeInput: CompleteUploadInput = {
        capture_id: urlResponse.capture_id,
        s3_key: urlResponse.s3_key,
        ...metadata,
      };

      await capturesAPI.completeUpload(completeInput);

      // Mark as complete
      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileName]: {
            ...state.uploadProgress[fileName],
            status: 'complete',
          },
        },
        isUploading: false,
      }));

      // Refresh captures list
      setTimeout(() => {
        get().refreshCaptures();
      }, 500);
    } catch (error) {
      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [fileName]: {
            ...state.uploadProgress[fileName],
            status: 'error',
            error: getErrorMessage(error),
          },
        },
        isUploading: false,
        error: getErrorMessage(error),
      }));
      throw error;
    }
  },

  /**
   * Cancel upload
   */
  cancelUpload: (fileName: string) => {
    set((state) => {
      const newProgress = { ...state.uploadProgress };
      delete newProgress[fileName];
      return {
        uploadProgress: newProgress,
        isUploading: Object.keys(newProgress).length > 0,
      };
    });
  },

  /**
   * Clear all upload progress
   */
  clearUploadProgress: () => {
    set({ uploadProgress: {}, isUploading: false });
  },

  /**
   * List angles for a site
   */
  listAngles: async (siteId: string) => {
    try {
      const angles = await capturesAPI.listAngles(siteId);
      set({ angles, error: null });
    } catch (error) {
      set({
        angles: [],
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Create angle
   */
  createAngle: async (siteId: string, input: CreateAngleInput) => {
    try {
      const angle = await capturesAPI.createAngle(siteId, input);
      set((state) => ({
        angles: [...state.angles, angle].sort((a, b) => a.sortOrder - b.sortOrder),
        error: null,
      }));
      return angle;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Clear current capture
   */
  clearCurrentCapture: () => set({ currentCapture: null }),
}));
