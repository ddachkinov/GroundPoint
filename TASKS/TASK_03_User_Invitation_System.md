===== BEGIN FILE: TASK_03_User_Invitation_System.md =====

# TASK 03: User Invitation System

## Purpose

Enable Operator Admins to invite Site Owner Clients and team members (Operator Members, Project Viewers) to Projects. Invitation system uses email-based token flow with role assignment.

## Priority

High. Required for multi-user collaboration and client access.

## Dependencies

- TASK_01: Authentication System.
- TASK_02: Projects and Sites CRUD.
- Email service configured.
- Database schema for ProjectMember and Invitation entities.

## Acceptance Criteria

1. Operator Admin can invite users to a Project by email with specified role (Site Owner Client, Operator Member, Project Viewer).
2. Invitation email sent with unique token link expiring in 7 days.
3. Recipient clicks link, creates account (if new) or logs in (if existing).
4. Upon acceptance, user added to ProjectMember table with specified role.
5. Invited user gains access to Project according to role permissions.
6. Operator Admin can view pending invitations and revoke them.
7. Recipient can decline invitation.
8. If email already associated with account, invitation directly links account to project.
9. Invitations cannot be accepted after expiration.
10. Invitation token is single-use.

## UI Description

### Invite User Button (Project Detail Page)

**Location:** Project detail page header, next to Edit button.

**Components:**
- "Invite" button with icon.
- On click: Opens invite modal.

### Invite User Modal

**Components:**
- Form fields:
  - Email (text input, required, email validation).
  - Role (dropdown: Site Owner Client, Operator Member, Project Viewer).
  - Message (textarea, optional, max 500 chars, included in invitation email).
- Send Invitation and Cancel buttons.

**Interactions:**
- On submit: POST to /api/v1/projects/:id/invite.
- On success: Close modal, show toast "Invitation sent to [email]", refresh invitations list.
- On error: Display error (e.g., "User already has access to this project").

**Validation:**
- Email valid format.
- Role required.
- Cannot invite same email twice to same project (unless previous invitation expired or declined).

### Invitations List (Project Settings)

**Location:** Project detail page, Settings tab, Invitations section.

**Components:**
- Table with columns: Email, Role, Status (Pending, Accepted, Declined, Expired), Sent Date, Actions.
- Actions: Resend (if expired/declined), Revoke (if pending).
- Empty state: "No invitations sent yet."

**Interactions:**
- Click "Resend" to send new invitation email with new token.
- Click "Revoke" to invalidate token (confirmation dialog).

### Accept Invitation Page

**URL:** /accept-invitation?token=xxx

**Components:**
- Message: "You've been invited to join [Project Name] as [Role] by [Inviter Name]."
- If user not logged in:
  - Option 1: Create account (registration form).
  - Option 2: Log in (login form).
- If user logged in:
  - Accept and Decline buttons.

**Interactions:**
- On Accept: POST to /api/v1/invitations/accept with token.
- On success: Redirect to project detail page, show toast "Invitation accepted".
- On Decline: POST to /api/v1/invitations/decline with token.
- On success: Show message "Invitation declined", redirect to homepage.

**Edge Cases:**
- Expired token: Display "Invitation expired. Please request a new invitation."
- Invalid token: Display "Invalid invitation link."
- Already accepted: Display "You already have access to this project."

### Team Members Section (Project Detail)

**Location:** Project detail page, Team tab.

**Components:**
- List of all users with access to project (cards or table).
- Each entry shows: Name, email, role, joined date.
- Remove button (Operator Admin only, cannot remove self).

**Interactions:**
- Click "Remove" to remove user from ProjectMember (confirmation dialog).

## API Endpoints

### POST /api/v1/projects/:id/invite

**Request Body:**
```
{
  "email": "client@example.com",
  "role": "SiteOwnerClient",
  "message": "Looking forward to sharing progress with you!"
}
```

**Response (201 Created):**
```
{
  "invitation_id": "uuid",
  "email": "client@example.com",
  "role": "SiteOwnerClient",
  "status": "Pending",
  "expires_at": "2025-01-22T10:00:00Z",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Validation:**
- Email: Valid format, required.
- Role: Must be one of allowed roles.
- Project must exist and user must be Operator Admin.
- Email not already invited to project (unless previous expired/declined).

**Behavior:**
- Generate unique invitation token (UUID).
- Store Invitation record with token, expiration (7 days from now).
- Send email to recipient with invitation link: `{frontend_url}/accept-invitation?token={token}`.

### GET /api/v1/projects/:id/invitations

**Query Parameters:**
- status: Pending | Accepted | Declined | Expired (optional).

**Response (200 OK):**
```
{
  "invitations": [
    {
      "invitation_id": "uuid",
      "email": "client@example.com",
      "role": "SiteOwnerClient",
      "status": "Pending",
      "invited_by_user_name": "John Doe",
      "sent_at": "2025-01-15T10:00:00Z",
      "expires_at": "2025-01-22T10:00:00Z"
    }
  ],
  "total": 5
}
```

### POST /api/v1/invitations/accept

**Request Body:**
```
{
  "token": "invitation-token-uuid"
}
```

**Response (200 OK):**
```
{
  "message": "Invitation accepted successfully",
  "project": {
    "project_id": "uuid",
    "name": "Downtown Office Tower",
    "role": "SiteOwnerClient"
  }
}
```

**Validation:**
- Token must exist, not expired, not already accepted.
- User must be authenticated.

**Behavior:**
- Create or update ProjectMember record (user_id, project_id, role).
- Update Invitation status to Accepted, set accepted_at timestamp.
- Send confirmation email to inviter "User [name] accepted your invitation to [project]".

### POST /api/v1/invitations/decline

**Request Body:**
```
{
  "token": "invitation-token-uuid"
}
```

**Response (200 OK):**
```
{
  "message": "Invitation declined"
}
```

**Behavior:**
- Update Invitation status to Declined.
- Send notification email to inviter "User [email] declined your invitation to [project]".

### POST /api/v1/invitations/:id/revoke

**Response (200 OK):**
```
{
  "message": "Invitation revoked successfully"
}
```

**Authorization:** Operator Admin who sent invitation or Superadmin.

**Behavior:**
- Update Invitation status to Revoked.
- Token becomes invalid.

### DELETE /api/v1/projects/:id/members/:user_id

**Response (200 OK):**
```
{
  "message": "User removed from project"
}
```

**Authorization:** Operator Admin only, cannot remove self.

**Behavior:**
- Delete ProjectMember record.
- Send notification email to removed user "You have been removed from [project]".

## Test Scenarios

### Test 1: Invite New User Successfully

**Steps:**
1. Operator Admin invites "newuser@example.com" to project.
2. Verify invitation email sent.
3. Recipient clicks link, creates account.
4. Accepts invitation.

**Expected:** User added to ProjectMember, can access project with specified role.

### Test 2: Invite Existing User

**Steps:**
1. Invite "existinguser@example.com" (user already registered).
2. User logs in, accepts invitation.

**Expected:** User added to ProjectMember without creating new account.

### Test 3: Duplicate Invitation Prevention

**Steps:**
1. Invite "user@example.com" to project.
2. Attempt to invite same email again.

**Expected:** Error "User already invited to this project" (400).

### Test 4: Expired Token

**Steps:**
1. Invite user.
2. Manually set invitation expiration to past date.
3. User attempts to accept.

**Expected:** Error "Invitation expired. Please request a new invitation." (400).

### Test 5: Revoke Invitation

**Steps:**
1. Invite user.
2. Operator Admin revokes invitation.
3. User attempts to accept.

**Expected:** Error "Invitation invalid or revoked" (400).

### Test 6: Decline Invitation

**Steps:**
1. Invite user.
2. User declines invitation.

**Expected:** Invitation status set to Declined, inviter notified.

### Test 7: Remove Team Member

**Steps:**
1. Invite and accept user to project.
2. Operator Admin removes user from team.

**Expected:** ProjectMember deleted, user loses access, notification sent.

### Test 8: Cannot Remove Self

**Steps:**
1. Operator Admin attempts to remove themselves from project.

**Expected:** Error "Cannot remove yourself from project" (403).

### Test 9: Site Owner Client Cannot Invite

**Steps:**
1. Site Owner Client attempts to invite another user.

**Expected:** Error 403 Forbidden.

### Test 10: Invitation Email Contains Correct Information

**Steps:**
1. Invite user with custom message.
2. Check email received.

**Expected:** Email contains project name, inviter name, role, custom message, accept link.

### Test 11: Resend Invitation

**Steps:**
1. Invite user.
2. Invitation expires.
3. Operator Admin clicks "Resend".

**Expected:** New invitation created with new token, email sent.

### Test 12: List Invitations with Filter

**Steps:**
1. Send multiple invitations with different statuses.
2. GET /api/v1/projects/:id/invitations?status=Pending.

**Expected:** Only pending invitations returned.

## Caveats and Edge Cases

### Multiple Pending Invitations

If user was invited, declined, then invited again, both invitations exist as separate records. Only most recent should be displayed in UI. Consider cleaning up old declined/expired invitations periodically.

### Email Already Registered

If invitee email already registered, streamline flow: On login, check for pending invitations and prompt user to accept.

### Invitation to Multiple Projects

Same user can be invited to multiple projects by same or different operators. Each project has separate ProjectMember record and invitation.

### Role Change

If user already has access to project with role A, and is invited again with role B, consider this an attempt to change role. Either reject or update existing ProjectMember role.

### Invitation Email Deliverability

If invitation email bounces, mark invitation as Failed and notify inviter to check email address.

### Token Security

Invitation tokens are sensitive (grant access). Generate cryptographically secure random tokens (UUID v4). Store hashed version in database if extra security needed.

### Auto-Expiration Job

Run daily cron job to mark expired invitations (expires_at < now and status = Pending) as Expired.

### Notification Preferences

Respect inviter's notification preferences. Some users may not want notifications when invitations accepted/declined.

## Performance Considerations

### Database Indexes

- invitation.token (unique index for fast lookup).
- invitation.email (index for finding invitations by recipient).
- invitation.project_id (index for listing invitations per project).
- invitation.expires_at (index for expiration job).

### Email Queuing

Enqueue invitation emails as background jobs to avoid blocking API response.

### Cache Invalidation

When user accepts invitation, invalidate cached project access for that user.

## Security Checklist

- [ ] Invitation tokens cryptographically secure (UUID v4 or stronger).
- [ ] Tokens single-use (accepted or declined state prevents reuse).
- [ ] Tokens expire after 7 days.
- [ ] Authorization checks: Only Operator Admin can invite.
- [ ] Validate email format to prevent injection attacks.
- [ ] Rate limit invitation endpoint (max 20 invitations per hour per user).
- [ ] Invitation link uses HTTPS.
- [ ] Revoked tokens immediately invalid.

===== END FILE: TASK_03_User_Invitation_System.md =====
