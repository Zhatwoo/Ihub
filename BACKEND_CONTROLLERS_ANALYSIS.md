# Backend Controllers Analysis

## Overview
This document provides a comprehensive analysis of all controllers in `backend/controllers/` (excluding Admin folder), their functions, and active usage status.

---

## Controllers Summary

### 1. **accountsController.js**
**Location:** `backend/controllers/accountsController.js`

**Functions:**
- `getAllClientUsers()` - Fetch all client users from Firestore
- `getClientUser(userId)` - Fetch a specific client user by ID
- `getUserDeskRequest(userId)` - Fetch desk request for a specific user
- `getAllDeskRequests()` - Fetch all desk requests from all users
- `getAdminUser(userId)` - Fetch a specific admin user by ID
- `updateAdminUser(userId, updateData)` - Update admin user profile
- `updateDeskRequest(userId, updateData)` - Create or update desk request for a user
- `deleteDeskRequest(userId)` - Delete desk request for a user
- `createAdminUser(email, password, firstName, lastName)` - Create new admin user via Firebase Auth

**Active Usage:** ✅ **YES**
- **Routes:** `backend/routes/accounts.js`
- **Endpoints:**
  - `GET /api/accounts/client/users` - Get all client users
  - `GET /api/accounts/client/users/:userId` - Get specific client user
  - `GET /api/accounts/client/users/:userId/request/desk` - Get user's desk request
  - `GET /api/accounts/client/requests/desk` - Get all desk requests
  - `GET /api/accounts/admin/users/:userId` - Get admin user
  - `PUT /api/accounts/admin/users/:userId` - Update admin user
  - `PUT /api/accounts/client/users/:userId/request/desk` - Create/update desk request
  - `DELETE /api/accounts/client/users/:userId/request/desk` - Delete desk request
  - `POST /api/accounts/admin/users` - Create admin user

---

### 2. **authController.js**
**Location:** `backend/controllers/authController.js`

**Functions:**
- `login(email, password)` - Authenticate user with email/password via Firebase Auth REST API
- `signup(email, password, firstName, lastName, companyName, contact)` - Register new user
- `verifyToken(idToken)` - Verify Firebase ID token (used by auth middleware)
- `getCurrentUser(uid)` - Get current authenticated user's profile

**Active Usage:** ✅ **YES**
- **Routes:** `backend/routes/auth.js`
- **Endpoints:**
  - `POST /api/auth/login` - User login
  - `POST /api/auth/signup` - User registration
  - `GET /api/auth/me` - Get current user (requires authentication)

---

### 3. **emailController.js**
**Location:** `backend/controllers/emailController.js`

**Functions:**
- `sendContactEmail(name, email, phone, subject, message)` - Send contact form email via Resend API
- `sendInquiryEmail(fullName, email, phoneNumber, company, position, preferredStartDate)` - Send virtual office inquiry email
- `sendScheduleEmail(fullName, email)` - Send meeting schedule request email

**Active Usage:** ✅ **YES**
- **Routes:** `backend/routes/emails.js`
- **Endpoints:**
  - `POST /api/emails/contact` - Send contact form
  - `POST /api/emails/inquiry` - Send virtual office inquiry
  - `POST /api/emails/schedule` - Send schedule meeting request
- **Dependencies:** Resend API (email service)

---

### 4. **floorsController.js**
**Location:** `backend/controllers/floorsController.js`

**Functions:**
- `getAllFloors()` - Fetch all floors from Firestore
- `getFloorById(floorId)` - Fetch specific floor by ID
- `createFloor(floorData)` - Create new floor
- `updateFloor(floorId, updateData)` - Update floor information
- `deleteFloor(floorId)` - Delete floor

**Active Usage:** ⚠️ **PARTIALLY** (Routes exist but may not be actively used in frontend)
- **Routes:** `backend/routes/floors.js`
- **Endpoints:**
  - `GET /api/floors` - Get all floors
  - `GET /api/floors/:floorId` - Get specific floor
  - `POST /api/floors` - Create floor
  - `PUT /api/floors/:floorId` - Update floor
  - `DELETE /api/floors/:floorId` - Delete floor
- **Dependencies:** `floorService.js` (service layer)
- **Note:** Routes are defined but frontend may not be actively using these endpoints

---

### 5. **uploadController.js**
**Location:** `backend/controllers/uploadController.js`

**Functions:**
- `uploadFile(file, options)` - Upload file to Firebase Storage or local storage
- `deleteFile(filePath, storageType)` - Delete uploaded file

**Active Usage:** ✅ **YES**
- **Routes:** `backend/routes/upload.js`
- **Endpoints:**
  - `POST /api/upload` - Upload file
  - `DELETE /api/upload` - Delete file
- **Dependencies:** `uploadService.js` (service layer)
- **Storage:** Firebase Storage (primary) with local storage fallback
- **Frontend Usage:** Used in admin pages for room/office image uploads

---

## Admin Controllers (Reorganized)

The following admin controllers have been reorganized into folder structure:

### Dashboard
- `backend/controllers/Admin/Dashboard/dashboardController.js` - Dashboard statistics

### Dedicated Desk
- `backend/controllers/Admin/Dedicated Desk/dedicatedDeskController.js` - Desk assignments and requests
- `backend/controllers/Admin/Dedicated Desk/roomsController.js` - Room management

### Private Office
- `backend/controllers/Admin/Private Office/privateOfficeController.js` - Private office management
- `backend/controllers/Admin/Private Office/schedulesController.js` - Schedule/booking management

### Virtual Office
- `backend/controllers/Admin/Virtual Office/virtualOfficeController.js` - Virtual office clients

### Tenants
- `backend/controllers/Admin/Tenants/tenantsController.js` - Tenant statistics and management

### Billing
- `backend/controllers/Admin/Billing/billingController.js` - Billing dashboard and invoices

---

## Usage Summary Table

| Controller | Status | Routes File | Frontend Usage |
|-----------|--------|------------|-----------------|
| accountsController.js | ✅ Active | accounts.js | Client/Admin account management |
| authController.js | ✅ Active | auth.js | Login/Signup pages |
| emailController.js | ✅ Active | emails.js | Contact form, inquiries |
| floorsController.js | ⚠️ Partial | floors.js | Possibly unused |
| uploadController.js | ✅ Active | upload.js | Admin image uploads |

---

## Recommendations

1. **floorsController.js** - Verify if this is actively used in the frontend. If not, consider removing it to reduce code complexity.

2. **Service Layer** - Both `floorsController.js` and `uploadController.js` use service layers (`floorService.js`, `uploadService.js`). Ensure these services are properly implemented.

3. **Route Updates** - The `dashboard.js` route file has been updated to use the new folder structure for admin controllers.

4. **Admin Routes** - The `admin.js` route file has been updated to import from the new folder structure.

---

## File Organization

```
backend/controllers/
├── accountsController.js (Active)
├── authController.js (Active)
├── emailController.js (Active)
├── floorsController.js (Partial)
├── uploadController.js (Active)
└── Admin/
    ├── Dashboard/
    │   └── dashboardController.js
    ├── Dedicated Desk/
    │   ├── dedicatedDeskController.js
    │   └── roomsController.js
    ├── Private Office/
    │   ├── privateOfficeController.js
    │   └── schedulesController.js
    ├── Virtual Office/
    │   └── virtualOfficeController.js
    ├── Tenants/
    │   └── tenantsController.js
    └── Billing/
        └── billingController.js
```
