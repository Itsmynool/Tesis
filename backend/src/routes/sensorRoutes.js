import express from 'express';
import sensorController from '../controllers/sensorController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Sensor routes
const router = express.Router();

// Call the controller functions in the routes
// Routes
// Route for getting devices
router.get('/devices', authMiddleware, sensorController.getDevices);
// Route for getting realtime data by device
router.get('/realtime/:device', authMiddleware, sensorController.getRealtimeData);
// Route for getting history data by device
router.get('/history/:device', authMiddleware, sensorController.getHistoryData);

export default router;
