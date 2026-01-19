// Constants utility
// Application-wide constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client'
};

export const SCHEDULE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
};

export const ROOM_TYPES = {
  PRIVATE_OFFICE: 'private-office',
  MEETING_ROOM: 'meeting-room',
  CONFERENCE_ROOM: 'conference-room'
};
