import { create } from 'zustand';
import {
  projectsAPI,
  Project,
  Site,
  CreateProjectInput,
  UpdateProjectInput,
  CreateSiteInput,
  UpdateSiteInput,
  ListProjectsQuery,
  ProjectListResponse,
} from '../api/projects';
import { getErrorMessage } from '../api/client';

/**
 * Projects store state
 */
interface ProjectsState {
  // Projects data
  projects: Project[];
  currentProject: (Project & { sites: Site[] }) | null;
  total: number;
  limit: number;
  offset: number;

  // Sites data
  currentSite: Site | null;

  // UI state
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Actions - Projects
  listProjects: (query?: ListProjectsQuery) => Promise<void>;
  getProject: (projectId: string) => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  updateProject: (projectId: string, input: UpdateProjectInput) => Promise<Project>;
  archiveProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;

  // Actions - Sites
  getSite: (siteId: string) => Promise<void>;
  createSite: (projectId: string, input: CreateSiteInput) => Promise<Site>;
  updateSite: (siteId: string, input: UpdateSiteInput) => Promise<Site>;
  deleteSite: (siteId: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  clearCurrentProject: () => void;
  clearCurrentSite: () => void;
}

/**
 * Projects store
 */
export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  total: 0,
  limit: 50,
  offset: 0,
  currentSite: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  /**
   * List all projects for organization
   */
  listProjects: async (query?: ListProjectsQuery) => {
    set({ isLoading: true, error: null });
    try {
      const response: ProjectListResponse = await projectsAPI.listProjects(query);
      set({
        projects: response.projects,
        total: response.total,
        limit: response.limit,
        offset: response.offset,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        projects: [],
        total: 0,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Get project by ID with sites
   */
  getProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectsAPI.getProject(projectId);
      set({
        currentProject: project,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        currentProject: null,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Create a new project
   */
  createProject: async (input: CreateProjectInput) => {
    set({ isCreating: true, error: null });
    try {
      const project = await projectsAPI.createProject(input);
      set({
        isCreating: false,
        error: null,
      });
      // Refresh projects list
      await get().refreshProjects();
      return project;
    } catch (error) {
      set({
        isCreating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Update project
   */
  updateProject: async (projectId: string, input: UpdateProjectInput) => {
    set({ isUpdating: true, error: null });
    try {
      const project = await projectsAPI.updateProject(projectId, input);

      // Update current project if it matches
      const currentProject = get().currentProject;
      if (currentProject && currentProject.id === projectId) {
        set({
          currentProject: { ...currentProject, ...project },
        });
      }

      // Update in projects list
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? project : p)),
        isUpdating: false,
        error: null,
      }));

      return project;
    } catch (error) {
      set({
        isUpdating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Archive project (soft delete)
   */
  archiveProject: async (projectId: string) => {
    set({ isDeleting: true, error: null });
    try {
      await projectsAPI.archiveProject(projectId);

      // Remove from projects list or mark as archived
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        isDeleting: false,
        error: null,
      }));

      // Clear current project if it matches
      const currentProject = get().currentProject;
      if (currentProject && currentProject.id === projectId) {
        set({ currentProject: null });
      }
    } catch (error) {
      set({
        isDeleting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Refresh projects list with current query params
   */
  refreshProjects: async () => {
    const { limit, offset } = get();
    await get().listProjects({ limit, offset });
  },

  /**
   * Get site by ID
   */
  getSite: async (siteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const site = await projectsAPI.getSite(siteId);
      set({
        currentSite: site,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        currentSite: null,
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Create site in project
   */
  createSite: async (projectId: string, input: CreateSiteInput) => {
    set({ isCreating: true, error: null });
    try {
      const site = await projectsAPI.createSite(projectId, input);

      // Add to current project's sites if loaded
      const currentProject = get().currentProject;
      if (currentProject && currentProject.id === projectId) {
        set({
          currentProject: {
            ...currentProject,
            sites: [...currentProject.sites, site],
            siteCount: (currentProject.siteCount || 0) + 1,
          },
        });
      }

      set({
        isCreating: false,
        error: null,
      });

      return site;
    } catch (error) {
      set({
        isCreating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Update site
   */
  updateSite: async (siteId: string, input: UpdateSiteInput) => {
    set({ isUpdating: true, error: null });
    try {
      const site = await projectsAPI.updateSite(siteId, input);

      // Update in current project's sites if loaded
      const currentProject = get().currentProject;
      if (currentProject) {
        set({
          currentProject: {
            ...currentProject,
            sites: currentProject.sites.map((s) => (s.id === siteId ? site : s)),
          },
        });
      }

      // Update current site if it matches
      const currentSite = get().currentSite;
      if (currentSite && currentSite.id === siteId) {
        set({ currentSite: site });
      }

      set({
        isUpdating: false,
        error: null,
      });

      return site;
    } catch (error) {
      set({
        isUpdating: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Delete site
   */
  deleteSite: async (siteId: string) => {
    set({ isDeleting: true, error: null });
    try {
      await projectsAPI.deleteSite(siteId);

      // Remove from current project's sites if loaded
      const currentProject = get().currentProject;
      if (currentProject) {
        set({
          currentProject: {
            ...currentProject,
            sites: currentProject.sites.filter((s) => s.id !== siteId),
            siteCount: Math.max((currentProject.siteCount || 1) - 1, 0),
          },
        });
      }

      // Clear current site if it matches
      const currentSite = get().currentSite;
      if (currentSite && currentSite.id === siteId) {
        set({ currentSite: null });
      }

      set({
        isDeleting: false,
        error: null,
      });
    } catch (error) {
      set({
        isDeleting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Clear current project
   */
  clearCurrentProject: () => set({ currentProject: null }),

  /**
   * Clear current site
   */
  clearCurrentSite: () => set({ currentSite: null }),
}));
