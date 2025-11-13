import { create } from 'zustand';
import { authAPI, User, LoginInput, RegisterInput } from '../api/auth';
import { getErrorMessage } from '../api/client';

/**
 * Auth store state
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Auth store
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Login user
   */
  login: async (input: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(input);

      if (response.mfaRequired) {
        set({ isLoading: false, error: 'MFA code required' });
        return;
      }

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (input: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(input);
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },

  /**
   * Verify email address
   */
  verifyEmail: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.verifyEmail(token);
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.requestPasswordReset(email);
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Confirm password reset
   */
  confirmPasswordReset: async (token: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.confirmPasswordReset(token, newPassword);
      set({ isLoading: false, error: null });
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) });
      throw error;
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authAPI.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
      // Clear token if getting current user fails
      localStorage.removeItem('accessToken');
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));
