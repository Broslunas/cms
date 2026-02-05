# Sharing Functionality

## Overview
The sharing functionality allows users to give access to their repositories to other users without copying the files. This is achieved by creating a reference pointer in the invited user's collection that points to the owner's collection.

## Architecture

### Data Model

1. **Owner's Project**:
   Stored in `user_{OWNER_ID}` collection.
   ```javascript
   {
     type: "project",
     repoId: "owner/repo",
     collaborators: [
       { userId: "PARTICIPANT_ID", email: "...", role: "editor" }
     ]
   }
   ```

2. **Participant's Reference**:
   Stored in `user_{PARTICIPANT_ID}` collection.
   ```javascript
   {
     type: "shared_project_reference",
     repoId: "owner/repo",
     ownerId: "OWNER_ID"
   }
   ```

### Database Strategy
- **Per-User Collections**: Data is isolated in `user_{ID}` collections.
- **Cross-Collection Access**: When accessing a shared project, the system reads the reference to determine the `ownerId`, then switches context to read from `user_{OWNER_ID}`.

## API Endpoints

### `POST /api/projects/share`
Invites a user by Email or GitHub Username.
- verifies owner.
- finds target user in `users` collection.
- adds target to owner's `collaborators`.
- adds `shared_project_reference` to target's collection.

### `GET /api/projects` (and Dashboard Page)
Fetches:
1. Own projects (`type: "project"`).
2. Shared references (`type: "shared_project_reference"`).
3. Resolves shared projects by fetching metadata from their respective owners.

### `GET /api/posts`
- If `repoId` is header/param:
- Checks if it is a shared project reference.
- If yes -> reads from Owner's collection.
- If no -> reads from Current User's collection.

## Frontend
- **ShareProjectButton**: Modal to invite users.
- **Dashboard**: Displays shared projects with visual indicators.
