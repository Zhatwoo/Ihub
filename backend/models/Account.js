// Account model
// Data schema and structure for accounts

export const AccountTypes = {
  CLIENT: 'client',
  ADMIN: 'admin'
};

export const createAccountSchema = {
  // TODO: Define account schema structure
  // Example:
  // email: String (required, unique)
  // password: String (required, hashed)
  // type: String (required, enum: ['client', 'admin'])
  // name: String (required)
  // createdAt: Timestamp
  // updatedAt: Timestamp
};

export const accountModel = {
  // Helper methods for account operations
  validate(data) {
    // TODO: Implement validation logic
    return true;
  },

  transform(data) {
    // TODO: Transform account data (remove sensitive fields, etc.)
    return data;
  }
};
