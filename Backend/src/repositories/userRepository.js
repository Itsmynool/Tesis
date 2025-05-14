import User from '../models/user.js';

// Function for find user by username in database mongo
const findUserByUsername = async (username) => {
  return await User.findOne({ username });
};

// Function for create user in database mongo
const createUser = async (username, hashedPassword) => {
  const newUser = new User({ username, password: hashedPassword });
  return await newUser.save();
};

// Export functions
export default {
  findUserByUsername,
  createUser,
};
