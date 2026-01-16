# Bookings Page - Data Source Documentation

## 📍 Firestore Collections Used

### 1. **`schedules` Collection** (Main Bookings Data)
**Location:** `/schedules/{scheduleId}`

**Purpose:** Kumukuha ng lahat ng bookings/reservations

**Fields Expected:**
```javascript
{
  id: string,                    // Document ID
  status: string,                // 'active' | 'upcoming' | 'ongoing' | 'completed' | 'pending' | 'rejected'
  email: string,                 // User email (for filtering)
  userId: string,                // User ID (for filtering)
  room: string,                   // Room name (e.g., "Conference Room A")
  roomId: string,                 // Reference to rooms collection
  clientName: string,             // Client/User name
  startDate: string | timestamp,  // Booking start date
  endDate: string | timestamp,   // Booking end date (optional)
  startTime: string,              // Start time (optional)
  endTime: string,                // End time (optional)
  contactNumber: string,         // Contact number
  createdAt: string | timestamp, // When booking was created
  notes: string                  // Additional notes (optional)
}
```

**Filtering Logic:**
- Status: Only shows bookings with status `'active'`, `'upcoming'`, or `'ongoing'`
- User: Filters by matching `email` or `userId` with current logged-in user

---

### 2. **`rooms` Collection** (Room Information)
**Location:** `/rooms/{roomId}`

**Purpose:** Kumukuha ng room details para sa rental fee

**Fields Expected:**
```javascript
{
  id: string,           // Document ID (matches booking.roomId)
  currency: string,     // 'PHP' | 'USD' | 'EUR' | etc.
  rentFee: number,     // Rental fee amount
  rentFeePeriod: string // 'per hour' | 'per day' | 'per month' | etc.
}
```

**Usage:** 
- Matched with `booking.roomId` to display rental fee information
- Used in card display: `₱1,500 per hour`

---

## 🔍 How Data is Fetched

### Step 1: Get Current User
```javascript
// Uses Firebase Auth
onAuthStateChanged(auth, (user) => {
  setCurrentUser(user);
  // user.email - for email matching
  // user.uid - for userId matching
});
```

### Step 2: Fetch Schedules
```javascript
// Real-time listener on 'schedules' collection
onSnapshot(collection(db, 'schedules'), (snapshot) => {
  // Filter by:
  // 1. Status: 'active', 'upcoming', 'ongoing'
  // 2. User: email === currentUser.email OR userId === currentUser.uid
});
```

### Step 3: Fetch Rooms
```javascript
// Real-time listener on 'rooms' collection
onSnapshot(collection(db, 'rooms'), (snapshot) => {
  // Store all rooms for lookup
  // Used to match booking.roomId with room details
});
```

---

## 📊 Data Flow

```
Firebase Firestore
    │
    ├── schedules collection
    │   └── Filter: status IN ['active', 'upcoming', 'ongoing']
    │   └── Filter: email === currentUser.email OR userId === currentUser.uid
    │   └── Sort: by startDate (ascending)
    │
    └── rooms collection
        └── Used for: rental fee lookup (matching roomId)
```

---

## 🎯 Required Data Structure Example

### Example Booking Document in `schedules`:
```javascript
{
  id: "booking123",
  status: "active",
  email: "user@example.com",
  userId: "firebase-user-uid-123",
  room: "Conference Room A",
  roomId: "room-abc-123",
  clientName: "John Doe",
  startDate: "2024-01-15T09:00:00Z",
  endDate: "2024-01-15T17:00:00Z",
  startTime: "9:00 AM",
  endTime: "5:00 PM",
  contactNumber: "+63 917 123 4567",
  createdAt: "2024-01-10T10:00:00Z",
  notes: "Need projector setup"
}
```

### Example Room Document in `rooms`:
```javascript
{
  id: "room-abc-123",
  currency: "PHP",
  rentFee: 1500,
  rentFeePeriod: "per hour"
}
```

---

## ⚠️ Important Notes

1. **User Filtering:** 
   - Bookings are filtered by current user's `email` OR `userId`
   - Both fields are checked for maximum compatibility

2. **Status Filtering:**
   - Only shows: `'active'`, `'upcoming'`, `'ongoing'`
   - Other statuses (`'completed'`, `'pending'`, `'rejected'`) are excluded

3. **Real-time Updates:**
   - Uses `onSnapshot` for real-time data updates
   - Automatically refreshes when data changes in Firestore

4. **Room Data Matching:**
   - Uses `booking.roomId` to find matching room in `rooms` collection
   - If room not found, rental fee shows as "N/A"

---

## 🔧 Firestore Security Rules

Based on `rules.md`, the `schedules` collection allows:
- ✅ **Read:** All authenticated users
- ✅ **Create:** All authenticated users
- ✅ **Update:** User can only update their own bookings (by userId or email)
- ✅ **Delete:** User can only delete their own bookings (by userId or email)
