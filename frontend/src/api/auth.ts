import { apiClient } from './client';

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  emailVerified: boolean;
}

/**
 * Registration input
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: 'OPERATOR' | 'SITE_OWNER';
}

/**
 * Registration response
 */
export interface RegisterResponse {
  userId: string;
  email: string;
  organizationId: string;
  message: string;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
  mfaRequired?: boolean;
}

/**
 * Auth API client
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (input: RegisterInput): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', input);
    return response.data;
  },

  /**
   * Verify email address
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/verify-email', {
      token,
    });
    return response.data;
  },

  /**
   * Login user
   */
  login: async (input: LoginInput): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', input);

    // Store access token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/password-reset', {
      email,
    });
    return response.data;
  },

  /**
   * Confirm password reset
   */
  confirmPasswordReset: async (
    token: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/password-reset/confirm',
      {
        token,
        newPassword,
      }
    );
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<{ accessToken: string; expiresIn: number }> => {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(
      '/auth/refresh'
    );

    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  },
};
