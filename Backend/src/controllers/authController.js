import authService from '../services/authService.js';

// Function for login user in controller
const login = async (req, res) => {
  // Get username and password from request in body
  const { username, password } = req.body;
  try {
    // Login user
    const token = await authService.login(username, password);
    // Return token
    res.json({ token });
  } catch (error) {
    // If error, return error
    res.status(400).json({ message: error.message });
  }
};

// Function for signup user in controller
const signup = async (req, res) => {
  // Get username and password from request in body
  const { username, password } = req.body;
  try {
    // Signup user
    const token = await authService.signup(username, password);
    // Return token
    res.status(201).json({ token });
  } catch (error) {
    // If error, return error
    res.status(400).json({ message: error.message });
  }
};

export default {
  login,
  signup,
};
