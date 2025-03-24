import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

// Function for generate token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Function for login user in service
const login = async (username, password) => {
  // Get user by username
  const user = await userRepository.findUserByUsername(username);
  // If user not found throw error
  if (!user) throw new Error('Invalid credentials');
  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  // If password not match throw error
  if (!isMatch) throw new Error('Invalid credentials');
  // Generate token
  return generateToken(user);
};

// Function for signup user in service
const signup = async (username, password) => {
  // If username or password not provided throw error
  if (!username || !password) throw new Error('Username and password are required.');
  // Get user by username 
  const existingUser = await userRepository.findUserByUsername(username);
  // If user already exists throw error
  if (existingUser) throw new Error('Username already exists');
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Create user
  const newUser = await userRepository.createUser(username, hashedPassword);
  // Generate token
  return generateToken(newUser);
};

export default {
  login,
  signup,
};
