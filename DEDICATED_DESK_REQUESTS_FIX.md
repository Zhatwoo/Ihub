# Dedicated Desk Requests Fix - Multiple Requests Per User

## Problem
The dedicated desk request system was not properly supporting multiple requests per user. The backend was using `userId` as the request ID instead of the actual unique document ID, causing issues when approving/rejecting requests.

## Root Cause
1. **Backend `getDeskRequests`**: Was setting `id: userId` instead of using the actual document ID (`deskRequestDoc.id`)
2. **Backend `updateDeskRequestStatus`**: Was reading from the old path `/accounts/client/users/{userId}/request/desk` instead of the new nested path `/accounts/client/users/{userId}/request/desk/requests/{requestId}`
3. **Backend route**: Was only accepting `userId` parameter, not `requestId`
4. **Frontend handlers**: Were only passing `userId` to the API, not the `requestId`

## Changes Made

### 1. Backend - Dedicated Desk Controller (`backend/controllers/Admin/Dedicated Desk/dedicatedDeskController.js`)

#### Updated `getDeskRequests` function:
- Changed collection group query from `collectionGroup('request')` to `collectionGroup('requests')`
- Added path filtering to only get desk requests from `/request/desk/requests/` path
- **Fixed**: Changed `id: userId` to `id: deskRequestDoc.id` to use the actual document ID
- Now properly returns unique request IDs for each desk request

#### Updated `updateDeskRequestStatus` function:
- Added `requestId` parameter to function signature
- Changed path from `/accounts/client/users/{userId}/request/desk` to `/accounts/client/users/{userId}/request/desk/requests/{requestId}`
- Now reads from and writes to the correct nested collection path
- Properly validates both `userId` and `requestId` are provided

### 2. Backend - Admin Routes (`backend/routes/admin.js`)

#### Updated dedicated desk route:
- Changed from: `router.put('/dedicated-desk/requests/:userId/status', updateDeskRequestStatus);`
- Changed to: `router.put('/dedicated-desk/requests/:userId/:requestId/status', updateDeskRequestStatus);`
- Now accepts both `userId` and `requestId` parameters

### 3. Frontend - Dedicated Desk Page (`frontend/src/app/admin/dedicated-desk/page.js`)

#### Updated `handleAcceptRequest` function:
- Changed API call from: `/api/admin/dedicated-desk/requests/${request.userId}/status`
- Changed to: `/api/admin/dedicated-desk/requests/${request.userId}/${request.id}/status`
- Now passes both `userId` and `requestId` to the backend

#### Updated `handleRejectRequest` function:
- Changed API call from: `/api/admin/dedicated-desk/requests/${request.userId}/status`
- Changed to: `/api/admin/dedicated-desk/requests/${request.userId}/${request.id}/status`
- Now passes both `userId` and `requestId` to the backend

## Firebase Path Structure

### Before (Old - Single Request Per User)
```
/accounts/client/users/{userId}/request/desk
```

### After (New - Multiple Requests Per User)
```
/accounts/client/users/{userId}/request/desk/requests/{requestId}
```

## Testing Checklist
- [ ] User can create multiple desk requests
- [ ] Admin can see all desk requests in the Requests tab
- [ ] Admin can approve a desk request and it creates a desk assignment
- [ ] Admin can reject a desk request
- [ ] Multiple requests from the same user are handled correctly
- [ ] Request IDs are unique and properly tracked
- [ ] Desk assignments are created with correct user information

## Related Files
- `backend/controllers/Client/DedicatedDesk/deskRequestController.js` - Already updated to use nested collection structure
- `backend/controllers/Client/DedicatedDesk/routes.js` - Already updated with correct paths
- `frontend/src/app/admin/private-office/requests/page.js` - Similar fix was applied for private office requests
- `backend/controllers/Admin/Private Office/privateOfficeController.js` - Similar fix was applied for private office requests
