# Inspire Hub Backend API

Express.js backend server for Inspire Hub application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values.

## Development

Run the server in development mode:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the PORT specified in `.env`).

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information and available endpoints

### Planned Endpoints (Not connected yet)

- `/api/accounts` - User account management (client/admin)
- `/api/rooms` - Room management
- `/api/schedules` - Booking/schedule management
- `/api/virtual-office` - Virtual office client management
- `/api/desk-assignments` - Desk assignment management
- `/api/floors` - Floor management
- `/api/upload` - File upload handling

## Project Structure

```
backend/
├── routes/           # API route handlers
│   ├── accounts.js
│   ├── rooms.js
│   ├── schedules.js
│   ├── virtualOffice.js
│   ├── deskAssignments.js
│   ├── floors.js
│   └── upload.js
├── controllers/      # Business logic layer
│   ├── accountsController.js
│   ├── roomsController.js
│   ├── schedulesController.js
│   ├── virtualOfficeController.js
│   ├── deskAssignmentsController.js
│   ├── floorsController.js
│   └── uploadController.js
├── services/         # Service layer for complex business logic
│   ├── accountService.js
│   ├── roomService.js
│   ├── scheduleService.js
│   └── uploadService.js
├── middleware/       # Custom middleware
│   ├── auth.js          # Authentication & authorization
│   ├── validation.js    # Request validation
│   ├── errorHandler.js  # Error handling
│   ├── rateLimiter.js   # Rate limiting
│   └── logger.js        # Custom logging
├── models/          # Data models and schemas
│   ├── Account.js
│   ├── Room.js
│   └── Schedule.js
├── validators/      # Input validation schemas
│   ├── accountValidator.js
│   ├── roomValidator.js
│   ├── scheduleValidator.js
│   └── index.js
├── config/          # Configuration files
│   ├── database.js      # Database configuration
│   ├── firebase.js      # Firebase configuration
│   ├── env.js           # Environment variables
│   └── index.js         # Config exports
├── utils/           # Utility functions
│   ├── logger.js        # Logging utility
│   ├── response.js      # Response helpers
│   ├── validator.js     # Validation helpers
│   ├── asyncHandler.js  # Async handler wrapper
│   └── constants.js     # Application constants
├── sockets/         # WebSocket/Socket.io handlers
│   ├── index.js         # Socket.io setup
│   ├── events.js        # Socket event handlers
│   └── middleware.js    # Socket middleware
├── server.js        # Express server entry point
├── package.json     # Dependencies
└── README.md        # Documentation
```

## Notes

- This backend is currently set up but **not connected** to Firebase or the frontend yet.
- All routes return placeholder responses until implementation is complete.
- Authentication and authorization middleware will be added when connecting to Firebase.
