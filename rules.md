rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is the owner of the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Helper function to check if user is an admin
    // Checks if user exists in /accounts/admin/users/{userId} path
    // Note: This requires the admin document to exist in Firestore
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/accounts/admin/users/$(request.auth.uid));
    }
    
    // Alternative: Allow all authenticated users to read client users collection
    // This is more permissive but allows admin functionality to work
    // You can restrict this later with custom claims or admin document checks
    function canReadClientUsers() {
      return isAuthenticated();
    }

    // ============================================
    // ACCOUNTS COLLECTION
    // ============================================
    
    // Client document (parent document for client users subcollection)
    match /accounts/client {
      // Allow reading the client document itself if needed
      allow read: if isAuthenticated();
    }
    
    // Client users subcollection: /accounts/client/users/{userId}
    match /accounts/client/users/{userId} {
      // Allow users to read their own user document
      // Also allow authenticated users to read (for admin to list all users)
      // This enables admin to fetch all users and their requests
      allow read: if isOwner(userId) || isAdmin() || canReadClientUsers();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isOwner(userId) || isAdmin();
      
      // Info subcollection: /accounts/client/users/{userId}/info/{infoId}
      // Stores user profile information (firstName, lastName, email, etc.)
      // Used by bookings page to match user info with desk-assignments and virtual-office-clients
      // Supports both document reads (info/details) and collection queries (getDocs)
      match /info/{infoId} {
        // Users can read their own info documents (including "details" document)
        // This allows both getDoc() and getDocs() operations
        allow read: if isAuthenticated() && request.auth.uid == userId;
        // Users can create their own info
        allow create: if isAuthenticated() && request.auth.uid == userId;
        // Users can update their own info
        allow update: if isAuthenticated() && request.auth.uid == userId;
        // Users can delete their own info
        allow delete: if isAuthenticated() && request.auth.uid == userId;
      }
      
      // Request subcollection: /accounts/client/users/{userId}/request/{requestType}
      // Allows users to create/update their own desk or privateroom requests
      // requestType can be: 'desk' or 'privateroom'
      // Used for: Desk booking requests and Private Room booking requests
      // These documents are read by the bookings page to display active bookings
      // Admins can also read/update/delete all requests for management
      match /request/{requestType} {
        // Users can read their own requests
        // Also allow authenticated users to read (for admin to see all requests)
        // This enables admin request management page
        allow read: if isOwner(userId) || isAdmin() || canReadClientUsers();
        // Users can create their own requests (desk or privateroom)
        allow create: if isAuthenticated() && isOwner(userId);
        // Users can update their own requests, admins can update any request
        allow update: if isOwner(userId) || isAdmin();
        // Users can delete their own requests, admins can delete any request
        allow delete: if isOwner(userId) || isAdmin();
      }
    }
    
    // Admin document (parent document for admin users subcollection)
    match /accounts/admin {
      // Allow reading the admin document itself if needed
      allow read: if isAuthenticated();
    }
    
    // Admin users subcollection: /accounts/admin/users/{userId}
    match /accounts/admin/users/{userId} {
      allow read: if isOwner(userId) || isAuthenticated();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    // ============================================
    // ROOMS COLLECTION
    // ============================================
    // Authenticated users (clients and admins) can read rooms
    // Only admins can write (create, update, delete)
    // For admin check, we'll allow authenticated users to write for now
    // You can add custom claims or check admin path in your app logic
    match /rooms/{roomId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ============================================
    // SCHEDULES COLLECTION (Bookings/Reservations)
    // ============================================
    // Authenticated users can read and create schedules
    // Users can update/delete their own bookings (by userId or email)
    match /schedules/{scheduleId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        !exists(/databases/$(database)/documents/schedules/$(scheduleId)) ||
        resource.data.userId == request.auth.uid ||
        resource.data.email == request.auth.token.email ||
        request.resource.data.userId == request.auth.uid ||
        request.resource.data.email == request.auth.token.email
      );
      allow delete: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        resource.data.email == request.auth.token.email
      );
    }

    // ============================================
    // VIRTUAL OFFICE CLIENTS
    // ============================================
    // Authenticated users can read to find their own bookings
    // The bookings page filters by email and name on the client side
    // Only admins should create/update/delete (enforced in app logic)
    match /virtual-office-clients/{clientId} {
      // Allow authenticated users to read (for bookings page filtering)
      allow read: if isAuthenticated();
      // Create/update/delete should be admin-only (enforced in app logic)
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ============================================
    // DESK ASSIGNMENTS
    // ============================================
    // Authenticated users can read to find their own desk assignments
    // The bookings page filters by email and name on the client side
    // Only admins should create/update/delete (enforced in app logic)
    match /desk-assignments/{assignmentId} {
      // Allow authenticated users to read (for bookings page filtering)
      allow read: if isAuthenticated();
      // Create/update/delete should be admin-only (enforced in app logic)
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ============================================
    // FLOORS
    // ============================================
    // Only authenticated users can access (admin-only in app logic)
    match /floors/{floorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ============================================
    // DEFAULT DENY RULE
    // ============================================
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
