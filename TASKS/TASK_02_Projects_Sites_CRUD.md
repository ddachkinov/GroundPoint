===== BEGIN FILE: TASK_02_Projects_Sites_CRUD.md =====

# TASK 02: Projects and Sites CRUD

## Purpose

Enable Operators to create, read, update, and delete Projects and Sites. Each Project represents a client engagement, and each Site represents a physical location or building section within that Project.

## Priority

Critical. Core entity management required before image uploads and comparisons.

## Dependencies

- TASK_01: Authentication System (user context required).
- Database schema for Project and Site entities.
- Organization entity exists (Operator and Site Owner organizations).

## Acceptance Criteria

1. Operator Admin can create Projects with name, description, associated Site Owner organization, retention policy.
2. Operator Admin can list all Projects in their organization with pagination and filtering.
3. Operator Admin can view Project details including associated Sites.
4. Operator Admin can update Project fields (name, description, status).
5. Operator Admin can archive (soft delete) Projects.
6. Operator Admin can create Sites within a Project with name, address, GPS coordinates.
7. Operator Admin can update Site details.
8. Operator Admin can delete Sites (hard delete if no captures, soft delete otherwise).
9. Site Owner Client can view Projects they are invited to (read-only).
10. Project names unique within an Operator organization.
11. Site names unique within a Project.
12. Projects and Sites scoped by organization, cross-organization access denied.

## UI Description

### Projects List Page (Operator)

**Components:**
- Header with "My Projects" title and "Create Project" button.
- Filter bar: Status dropdown (All, Active, Paused, Completed, Archived), search by name.
- Project cards grid (responsive: 1 column mobile, 2 columns tablet, 3 columns desktop).
- Each card displays: Thumbnail, Project name, Site Owner name, site count, status badge, last updated date.
- Hover actions: View, Edit, Archive icons.
- Pagination controls (50 per page).
- Empty state: "No projects yet. Create your first project to get started."

**Interactions:**
- Click card or "View" to navigate to Project detail page.
- Click "Edit" to open edit modal.
- Click "Archive" to confirm and soft-delete Project.
- Click "Create Project" to open creation modal.

### Create Project Modal

**Components:**
- Form fields:
  - Project Name (text, required, max 200 chars).
  - Description (textarea, optional, max 2000 chars).
  - Site Owner (dropdown, searchable, list of Site Owner organizations or invite new via email).
  - Retention Days (number, default based on subscription tier, editable within tier limits).
- Cancel and Create buttons.

**Interactions:**
- On submit: POST to /api/v1/projects.
- On success: Close modal, refresh project list, show toast "Project created successfully".
- On error: Display validation errors inline.

**Validation:**
- Project name required and unique within organization.
- Site Owner required (can be selected from existing or invited).

### Edit Project Modal

**Components:**
- Same fields as create, pre-populated with current values.
- Additional field: Status (dropdown: Active, Paused, Completed).
- Save and Cancel buttons.

**Interactions:**
- On submit: PATCH to /api/v1/projects/:id.
- On success: Close modal, refresh project, show toast "Project updated".

### Project Detail Page

**Components:**
- Header: Project name, status badge, Edit and Archive buttons.
- Metadata section: Site Owner name, created date, retention policy, description.
- Tabs: Overview, Sites, Timeline, Invoices.
- **Overview Tab:** Quick stats (total images, sites, last capture date), recent activity feed.
- **Sites Tab:** List of sites with "Add Site" button, each site card shows name, address, GPS, image count, actions (View, Edit, Delete).
- **Timeline Tab:** Navigates to timeline view filtered to this Project.
- **Invoices Tab:** Lists invoices for this Project (if payment system enabled).

**Interactions:**
- Click "Add Site" to open site creation modal.
- Click site card to navigate to Site detail page.

### Create Site Modal

**Components:**
- Form fields:
  - Site Name (text, required, max 200 chars).
  - Address (textarea, optional).
  - Latitude (decimal, optional, range -90 to 90).
  - Longitude (decimal, optional, range -180 to 180).
  - Description (textarea, optional, max 1000 chars).
- Cancel and Create buttons.

**Interactions:**
- On submit: POST to /api/v1/projects/:id/sites.
- On success: Close modal, refresh sites list, show toast "Site created".

### Edit Site Modal

**Components:**
- Same fields as create, pre-populated.
- Save and Cancel buttons.

**Interactions:**
- On submit: PATCH to /api/v1/sites/:id.
- On success: Close modal, refresh site, show toast "Site updated".

### Site Detail Page

**Components:**
- Header: Site name, Edit and Delete buttons.
- Metadata: Address, GPS coordinates (with map preview if available), description.
- Camera Angles section: List of defined angles, "Add Angle" button.
- Timeline: Thumbnail grid of captures for this site, filterable by angle.

**Interactions:**
- Click "Add Angle" to define new camera angle.
- Click angle to filter timeline.

### Archive Confirmation Dialog

**Components:**
- Message: "Are you sure you want to archive [Project Name]? This Project will be hidden but can be restored later."
- Cancel and Confirm buttons.

**Interactions:**
- On confirm: DELETE to /api/v1/projects/:id (soft delete, status set to Archived).

## API Endpoints

### POST /api/v1/projects

**Request Body:**
```
{
  "name": "Downtown Office Tower",
  "description": "Monthly progress documentation for new office building",
  "site_owner_org_id": "uuid",
  "retention_days": 365
}
```

**Response (201 Created):**
```
{
  "project_id": "uuid",
  "name": "Downtown Office Tower",
  "status": "Active",
  "operator_org_id": "uuid",
  "site_owner_org_id": "uuid",
  "retention_days": 365,
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Validation:**
- Name: Required, max 200 chars, unique within operator org.
- Site owner org must exist and be of type SiteOwner.
- Retention days within tier limits (Free: 30, Pro: 365, Business: 1095, Enterprise: unlimited).

### GET /api/v1/projects

**Query Parameters:**
- status: Active | Paused | Completed | Archived (optional).
- search: Search term for name (optional).
- limit: Max 100, default 50.
- offset: Pagination offset, default 0.

**Response (200 OK):**
```
{
  "projects": [
    {
      "project_id": "uuid",
      "name": "Downtown Office Tower",
      "status": "Active",
      "site_owner_org_name": "ABC Construction",
      "site_count": 3,
      "image_count": 127,
      "thumbnail_url": "https://cdn.../thumbnail.jpg",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-20T14:30:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**Authorization:** User must be Operator Admin/Member in operator org, or Site Owner invited to project.

### GET /api/v1/projects/:id

**Response (200 OK):**
```
{
  "project_id": "uuid",
  "name": "Downtown Office Tower",
  "description": "Monthly progress documentation",
  "status": "Active",
  "operator_org_id": "uuid",
  "operator_org_name": "Drone Pros LLC",
  "site_owner_org_id": "uuid",
  "site_owner_org_name": "ABC Construction",
  "retention_days": 365,
  "thumbnail_capture_id": "uuid",
  "sites": [
    {
      "site_id": "uuid",
      "name": "North Facade",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "image_count": 45
    }
  ],
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z"
}
```

### PATCH /api/v1/projects/:id

**Request Body:**
```
{
  "name": "Downtown Office Tower - Phase 2",
  "description": "Updated description",
  "status": "Paused"
}
```

**Response (200 OK):**
```
{
  "project_id": "uuid",
  "name": "Downtown Office Tower - Phase 2",
  "status": "Paused",
  "updated_at": "2025-01-21T09:00:00Z"
}
```

**Authorization:** Operator Admin only.

### DELETE /api/v1/projects/:id

**Response (200 OK):**
```
{
  "message": "Project archived successfully"
}
```

**Behavior:** Soft delete (set status to Archived). Hard delete only if no sites, captures, or invoices.

**Authorization:** Operator Admin only.

### POST /api/v1/projects/:id/sites

**Request Body:**
```
{
  "name": "South Facade",
  "address": "123 Main St, New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "South-facing facade documentation"
}
```

**Response (201 Created):**
```
{
  "site_id": "uuid",
  "project_id": "uuid",
  "name": "South Facade",
  "created_at": "2025-01-20T11:00:00Z"
}
```

**Validation:**
- Name: Required, max 200 chars, unique within project.
- GPS coordinates: Valid ranges (-90 to 90 lat, -180 to 180 lon).
- Project must not exceed max sites per tier (Free: 5, Pro: 20, Business: 50, Enterprise: unlimited).

### GET /api/v1/sites/:id

**Response (200 OK):**
```
{
  "site_id": "uuid",
  "project_id": "uuid",
  "name": "South Facade",
  "address": "123 Main St, New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "South-facing facade documentation",
  "angles": [
    {
      "angle_id": "uuid",
      "name": "Ground Level",
      "image_count": 20
    }
  ],
  "image_count": 45,
  "created_at": "2025-01-20T11:00:00Z"
}
```

### PATCH /api/v1/sites/:id

**Request Body:**
```
{
  "name": "South Facade - Updated",
  "address": "123 Main St, Suite 100"
}
```

**Response (200 OK):**
```
{
  "site_id": "uuid",
  "name": "South Facade - Updated",
  "updated_at": "2025-01-21T10:00:00Z"
}
```

### DELETE /api/v1/sites/:id

**Response (200 OK):**
```
{
  "message": "Site deleted successfully"
}
```

**Behavior:** Hard delete if no captures, otherwise return error prompting to archive project instead.

## Test Scenarios

### Test 1: Create Project Successfully

**Steps:**
1. Operator Admin logs in.
2. Clicks "Create Project".
3. Fills form with valid data.
4. Submits.

**Expected:** Project created, appears in list, toast notification shown.

### Test 2: Duplicate Project Name

**Steps:**
1. Create project "Tower A".
2. Attempt to create another project "Tower A" in same organization.

**Expected:** Error "Project name already exists" (400).

### Test 3: List Projects with Pagination

**Steps:**
1. Create 60 projects.
2. GET /api/v1/projects?limit=50&offset=0.
3. Verify 50 projects returned.
4. GET /api/v1/projects?limit=50&offset=50.
5. Verify 10 projects returned.

**Expected:** Pagination works correctly.

### Test 4: Filter Projects by Status

**Steps:**
1. Create projects with statuses Active, Paused, Archived.
2. GET /api/v1/projects?status=Active.

**Expected:** Only Active projects returned.

### Test 5: Update Project

**Steps:**
1. Create project.
2. PATCH /api/v1/projects/:id with new name.

**Expected:** Project name updated, updated_at timestamp changed.

### Test 6: Archive Project

**Steps:**
1. Create project.
2. DELETE /api/v1/projects/:id.

**Expected:** Project status set to Archived, not visible in default list (unless filter includes Archived).

### Test 7: Create Site in Project

**Steps:**
1. Create project.
2. POST /api/v1/projects/:id/sites with site data.

**Expected:** Site created, linked to project, appears in project detail.

### Test 8: Site Name Unique Within Project

**Steps:**
1. Create site "North Facade" in project.
2. Attempt to create another site "North Facade" in same project.

**Expected:** Error "Site name already exists in this project" (400).

### Test 9: GPS Coordinates Validation

**Steps:**
1. Attempt to create site with latitude 100 (invalid).

**Expected:** Error "Invalid latitude, must be between -90 and 90" (400).

### Test 10: Site Owner Cannot Edit Project

**Steps:**
1. Invite Site Owner to project.
2. Site Owner attempts to PATCH project.

**Expected:** Error 403 Forbidden.

### Test 11: Cross-Organization Access Denied

**Steps:**
1. Operator A creates project.
2. Operator B (different org) attempts to GET project.

**Expected:** Error 403 Forbidden.

### Test 12: Exceed Site Quota

**Steps:**
1. Free tier Operator creates project.
2. Create 5 sites (quota limit).
3. Attempt to create 6th site.

**Expected:** Error "Site limit reached for your subscription tier. Upgrade to add more sites." (403).

## Caveats and Edge Cases

### Soft Delete vs Hard Delete

Projects with invoices or captures must be soft-deleted (archived) to preserve data integrity for financial and legal reasons. Only empty projects can be hard-deleted.

### Retention Policy Enforcement

When updating retention days, validate against subscription tier limits. Do not allow setting higher retention than tier allows.

### Orphaned Sites

If project is deleted (archived), sites remain but are not accessible via UI unless project is restored.

### Concurrent Edits

If two users edit same project simultaneously, last write wins. Consider optimistic locking if this becomes an issue (check updated_at timestamp on update).

### Project Thumbnail

Automatically set thumbnail_capture_id to most recent capture in project for visual representation in project list.

### Site GPS Validation

GPS coordinates optional but if provided must be valid. Consider geocoding address to pre-fill GPS if integration available (Google Maps API).

### Project Quota Enforcement

Check project count before creation. Query count where status != Archived and enforce tier limit.

### Empty State Handling

If operator has no projects, display helpful empty state with "Create your first project" CTA.

## Performance Considerations

### Database Indexes

- project.operator_org_id (foreign key index).
- project.status (for filtering).
- project.name (for search, consider full-text search if search becomes complex).
- site.project_id (foreign key index).

### Query Optimization

- Use JOIN to fetch site count and image count in project list query.
- Avoid N+1 queries when loading project list with related data.

### Caching

- Cache project list for operator org in Redis with 5-minute TTL, invalidate on create/update/delete.

## Security Checklist

- [ ] All endpoints require authentication.
- [ ] Authorization checks user role and organization membership.
- [ ] Project and site IDs validated (UUID format).
- [ ] Cross-organization access denied.
- [ ] Input validation on all fields (length, format).
- [ ] SQL injection prevented via ORM parameterized queries.
- [ ] Rate limiting on create endpoints (max 10 projects per hour per user).

===== END FILE: TASK_02_Projects_Sites_CRUD.md =====
