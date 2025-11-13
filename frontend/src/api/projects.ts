import { apiClient } from './client';

/**
 * Project status enum
 */
export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

/**
 * Project type
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  operatorOrgId: string;
  siteOwnerOrgId: string;
  status: ProjectStatus;
  retentionDays: number;
  createdAt: string;
  updatedAt: string;
  siteCount?: number;
  captureCount?: number;
  thumbnailUrl?: string | null;
}

/**
 * Site type
 */
export interface Site {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  nadir: boolean;
  oblique: boolean;
  createdAt: string;
  updatedAt: string;
  captureCount?: number;
  thumbnailUrl?: string | null;
}

/**
 * Create project input
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  siteOwnerOrgId: string;
  retentionDays?: number;
}

/**
 * Update project input
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  retentionDays?: number;
}

/**
 * Create site input
 */
export interface CreateSiteInput {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  nadir?: boolean;
  oblique?: boolean;
}

/**
 * Update site input
 */
export interface UpdateSiteInput {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  nadir?: boolean;
  oblique?: boolean;
}

/**
 * List projects query parameters
 */
export interface ListProjectsQuery {
  limit?: number;
  offset?: number;
  status?: ProjectStatus;
  search?: string;
}

/**
 * Paginated projects response
 */
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Projects API client
 */
export const projectsAPI = {
  /**
   * Create a new project
   */
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post<{ project: Project }>('/projects', input);
    return response.data.project;
  },

  /**
   * List all projects for organization
   */
  listProjects: async (query?: ListProjectsQuery): Promise<ProjectListResponse> => {
    const response = await apiClient.get<ProjectListResponse>('/projects', {
      params: query,
    });
    return response.data;
  },

  /**
   * Get project by ID
   */
  getProject: async (projectId: string): Promise<Project & { sites: Site[] }> => {
    const response = await apiClient.get<{ project: Project & { sites: Site[] } }>(
      `/projects/${projectId}`
    );
    return response.data.project;
  },

  /**
   * Update project
   */
  updateProject: async (projectId: string, input: UpdateProjectInput): Promise<Project> => {
    const response = await apiClient.patch<{ project: Project }>(
      `/projects/${projectId}`,
      input
    );
    return response.data.project;
  },

  /**
   * Archive project (soft delete)
   */
  archiveProject: async (projectId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Create site in project
   */
  createSite: async (projectId: string, input: CreateSiteInput): Promise<Site> => {
    const response = await apiClient.post<{ site: Site }>(
      `/projects/${projectId}/sites`,
      input
    );
    return response.data.site;
  },

  /**
   * Get site by ID
   */
  getSite: async (siteId: string): Promise<Site> => {
    const response = await apiClient.get<{ site: Site }>(`/sites/${siteId}`);
    return response.data.site;
  },

  /**
   * Update site
   */
  updateSite: async (siteId: string, input: UpdateSiteInput): Promise<Site> => {
    const response = await apiClient.patch<{ site: Site }>(`/sites/${siteId}`, input);
    return response.data.site;
  },

  /**
   * Delete site
   */
  deleteSite: async (siteId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/sites/${siteId}`);
    return response.data;
  },
};
