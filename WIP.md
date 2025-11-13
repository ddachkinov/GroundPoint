# Work In Progress

**Date**: 2025-11-13
**Milestone**: 3 - Projects & Sites CRUD
**Status**: 🚧 In Progress

---

## Current Implementation

### Milestone 3: Projects & Sites CRUD (🚧 IN PROGRESS)

**Goal**: Enable Operators to create, read, update, and delete Projects and Sites with proper authorization and validation.

**Reference**: TASK_02_Projects_Sites_CRUD.md

### Implementation Plan

**Backend** (In Progress):
1. Create validators (Zod schemas) for Projects and Sites
2. Implement Projects service (business logic)
3. Implement Sites service (business logic)
4. Implement Projects controller (endpoint handlers)
5. Implement Sites controller (endpoint handlers)
6. Implement routes and register in App
7. Add authorization checks (organization scoping)

**Frontend** (Pending):
1. Projects API client
2. Projects store (Zustand)
3. Projects list page
4. Project detail page
5. Create/edit project modals
6. Sites management UI
7. Create/edit site modals

### API Endpoints to Implement

**Projects**:
- POST /api/v1/projects - Create project
- GET /api/v1/projects - List projects (with pagination, filtering)
- GET /api/v1/projects/:id - Get project details
- PATCH /api/v1/projects/:id - Update project
- DELETE /api/v1/projects/:id - Archive project (soft delete)

**Sites**:
- POST /api/v1/projects/:projectId/sites - Create site in project
- GET /api/v1/sites/:id - Get site details
- PATCH /api/v1/sites/:id - Update site
- DELETE /api/v1/sites/:id - Delete site

### Acceptance Criteria

- [ ] Operator Admin can create projects
- [ ] Projects list with pagination and filtering by status
- [ ] Project names unique within organization
- [ ] Operator Admin can create sites within projects
- [ ] Site names unique within project
- [ ] GPS coordinates validated (-90 to 90 lat, -180 to 180 lon)
- [ ] Cross-organization access denied
- [ ] Site Owner can view projects (read-only)
- [ ] Projects can be archived (soft delete)
- [ ] Sites can be deleted (hard delete if no captures)

**Next Step**: Start implementing backend validators and services
