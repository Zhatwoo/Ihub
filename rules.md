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
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
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
    // Only authenticated users can access (admin-only in app logic)
    match /virtual-office-clients/{clientId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ============================================
    // DESK ASSIGNMENTS
    // ============================================
    // Only authenticated users can access (admin-only in app logic)
    match /desk-assignments/{assignmentId} {
      allow read: if isAuthenticated();
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
