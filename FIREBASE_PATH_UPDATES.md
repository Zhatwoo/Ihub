# Firebase Path Updates

## Changes Made

### 1. Dedicated Desk Requests

**Frontend Change:**
- **File:** `frontend/src/app/client/home/components/DedicatedDeskSection.jsx`
- **Change:** Removed `location` field from desk request data
- **Before:**
  ```javascript
  const requestData = {
    deskId: selectedDesk,
    section: selectedSpace?.title || '',
    location: selectedSpace?.location || '',  // ❌ REMOVED
    requestDate: new Date().toISOString(),
    // ... rest of data
  };
  ```
- **After:**
  ```javascript
  const requestData = {
    deskId: selectedDesk,
    section: selectedSpace?.title || '',
    requestDate: new Date().toISOString(),
    // ... rest of data
  };
  ```

**Firebase Path:** (Unchanged)
```
/accounts/client/users/{userId}/request/desk
```

---

### 2. Private Office Bookings

**Firebase Path Change:**
- **Old Path:** `/privateOfficeRooms/data/requests/{requestId}`
- **New Path:** `/accounts/client/users/{userId}/request/office`

**Backend Changes:**

#### File: `backend/controllers/Client/PrivateOffice/bookingController.js`

**1. createSchedule() - Updated**
- Now stores booking at user-specific path
- Requires `userId` in request body
- Validates user exists before creating booking
- Uses `merge: true` to handle document creation

**2. getScheduleById() - Updated**
- Now requires both `userId` and `scheduleId` parameters
- Reads from user-specific path
- Returns single booking document

**3. getUserSchedules() - Updated**
- Now reads from user-specific path
- Returns array with single booking (since each user has one office booking)
- Simplified query (no need for where clause)

**4. deleteSchedule() - Updated**
- Now requires `userId` parameter
- Deletes from user-specific path
- Still handles room status update if booking was approved

#### File: `backend/controllers/Client/PrivateOffice/routes.js`

**Route Updates:**
```javascript
// POST /api/client/private-office/bookings - Create new booking
router.post('/bookings', authenticate, createSchedule);

// GET /api/client/private-office/user/:userId/bookings - Get user's bookings
router.get('/user/:userId/bookings', authenticate, getUserSchedules);

// GET /api/client/private-office/bookings/:userId - Get booking by user ID
router.get('/bookings/:userId', authenticate, getScheduleById);

// DELETE /api/client/private-office/bookings/:userId - Delete booking
router.delete('/bookings/:userId', authenticate, deleteSchedule);
```

---

## Data Structure Comparison

### Dedicated Desk Request
**Fields Sent to Admin:**
- ✅ `deskId` - Desk identifier
- ✅ `section` - Section name
- ❌ `location` - REMOVED
- ✅ `requestDate` - When request was made
- ✅ `status` - "pending" initially
- ✅ `occupantType` - "Tenant"
- ✅ `firstName`, `lastName` - Client name
- ✅ `email` - Client email
- ✅ `company` - Company name
- ✅ `contact` - Phone number
- ✅ `userId` - Firebase UID

**Firebase Path:**
```
/accounts/client/users/{userId}/request/desk
```

---

### Private Office Booking
**Fields Sent to Admin:**
- ✅ `clientName` - Full name
- ✅ `email` - Email address
- ✅ `contactNumber` - Phone number
- ✅ `companyName` - Company name
- ✅ `room` - Room/office name
- ✅ `roomId` - Unique room identifier
- ✅ `startDate` - Booking start date
- ✅ `endDate` - Booking end date (optional)
- ✅ `startTime` - Start time (optional)
- ✅ `endTime` - End time (optional)
- ✅ `notes` - Additional notes
- ✅ `status` - "pending" initially
- ✅ `requestType` - "privateroom"
- ✅ `userId` - Firebase UID

**Firebase Path:**
```
/accounts/client/users/{userId}/request/office
```

---

## Benefits of New Structure

1. **User-Centric Organization:** All user requests stored under their user document
2. **Consistency:** Matches dedicated desk request structure
3. **Easier Querying:** No need for complex where clauses
4. **Better Data Isolation:** Each user's data is isolated
5. **Simplified Admin Retrieval:** Admin can fetch all requests by iterating through users

---

## Migration Notes

- Old bookings in `/privateOfficeRooms/data/requests/` will need to be migrated
- Admin controllers that read from old path need to be updated
- Frontend API calls already updated to use new endpoints

---

## Files Modified

### Frontend
- ✅ `frontend/src/app/client/home/components/DedicatedDeskSection.jsx`

### Backend
- ✅ `backend/controllers/Client/PrivateOffice/bookingController.js`
- ✅ `backend/controllers/Client/PrivateOffice/routes.js`

---

## Testing Checklist

- [ ] Test desk request submission (location field removed)
- [ ] Test private office booking creation (new Firebase path)
- [ ] Test booking retrieval by user ID
- [ ] Test booking deletion
- [ ] Verify room status updates on booking approval
- [ ] Test admin retrieval of bookings from new path
