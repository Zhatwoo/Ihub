// Room model
// Data schema and structure for rooms

export const RoomTypes = {
  PRIVATE_OFFICE: 'private-office',
  MEETING_ROOM: 'meeting-room',
  CONFERENCE_ROOM: 'conference-room'
};

export const createRoomSchema = {
  // TODO: Define room schema structure
  // Example:
  // name: String (required)
  // type: String (required, enum: RoomTypes)
  // capacity: Number (required)
  // floor: String (required)
  // amenities: Array
  // isAvailable: Boolean (default: true)
  // createdAt: Timestamp
  // updatedAt: Timestamp
};

export const roomModel = {
  validate(data) {
    // TODO: Implement validation logic
    return true;
  },

  transform(data) {
    // TODO: Transform room data
    return data;
  }
};
