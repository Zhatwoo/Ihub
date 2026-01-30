# Firestore Index Setup Guide

## Error: FAILED_PRECONDITION (Code 9)

This error occurs because the refactored code uses **Collection Group Queries** which require Firestore indexes.

## Quick Fix

### Option 1: Auto-Create Index (Recommended)

1. Check your **backend console/terminal** for an error message from Firestore
2. Look for a URL that looks like:
   ```
   https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes?create_composite=...
   ```
3. **Click the link** - it will open Firebase Console with the index pre-configured
4. Click **"Create Index"**
5. Wait 2-5 minutes for the index to build
6. Refresh your application

### Option 2: Manual Index Creation

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **"Create Index"** or **"Add Index"**
5. Configure the index:

#### Index Configuration:
```
Collection ID: requests (Collection group)
Fields indexed:
  - status: Ascending
Query scope: Collection group
```

**Important**: Make sure to select **"Collection group"** not "Collection"!

### Option 3: Use firestore.indexes.json (For Deployment)

Create a file `firestore.indexes.json` in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "requests",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy using Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

## Why This Happened

The refactoring changed from:
- **Before**: Simple collection query `firestore.collection('desk-assignments').get()`
- **After**: Collection group query `firestore.collectionGroup('requests').where('status', '==', 'approved').get()`

Collection group queries search across **all subcollections** with the same name, which requires indexes for filtering.

## Temporary Workaround

The code now includes a **fallback mechanism**:
- If the index doesn't exist, it fetches all documents and filters in memory
- This works but is **slower and uses more reads**
- You'll see a warning in the console: `⚠️ Firestore index not found, using fallback method...`

## Verify Index is Working

After creating the index:
1. Restart your backend server
2. Check the console - you should NOT see the fallback warning
3. The application should load faster
4. No more FAILED_PRECONDITION errors

## Additional Indexes You May Need

If you encounter similar errors in other parts of the app, you may need these indexes:

### For Dashboard Stats:
```
Collection ID: requests (Collection group)
Fields: status (Ascending)
Query scope: Collection group
```

### For Virtual Office:
```
Collection ID: requests (Collection group)  
Fields: status (Ascending)
Query scope: Collection group
```

## Need Help?

If you continue to see errors after creating the index:
1. Wait 5-10 minutes (index building can take time)
2. Clear your browser cache
3. Restart the backend server
4. Check Firebase Console → Indexes to verify the index status is "Enabled"

## Performance Note

With the index in place:
- ✅ Queries will be fast (milliseconds)
- ✅ Only reads matching documents
- ✅ Scales well with data growth

Without the index (fallback mode):
- ⚠️ Slower queries (seconds)
- ⚠️ Reads ALL documents then filters
- ⚠️ Higher Firestore costs
- ⚠️ May hit query limits with large datasets
