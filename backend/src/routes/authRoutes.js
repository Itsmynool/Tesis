import express from 'express';
import authController from '../controllers/authController.js';

// Auth routes
const router = express.Router();

// Call the controller functions in the routes
// Routes
// Route for login
router.post('/login', authController.login);
// Route for signup
router.post('/signup', authController.signup);

export default router;
