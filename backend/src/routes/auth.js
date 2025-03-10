import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import SensorData from '../models/SensorData.js'; // Importar SensorData para obtener dispositivos
import { Sequelize } from 'sequelize';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, devices: user.devices });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  const { username, password, devices } = req.body;

  try {
    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Obtener el primer dispositivo disponible como predeterminado
    const availableDevices = await SensorData.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('device')), 'device']],
    });
    const defaultDevice = availableDevices.length > 0 ? availableDevices[0].device : null;

    if (!defaultDevice) {
      return res.status(500).json({ message: 'No devices available to assign' });
    }

    // Si se envía un arreglo de devices, tomar solo el primero; si no, usar el predeterminado
    let assignedDevice = defaultDevice;
    if (devices && Array.isArray(devices) && devices.length > 0) {
      assignedDevice = devices[0]; // Tomar solo el primer dispositivo
      if (devices.length > 1) {
        console.warn('Only one device is allowed. Using the first one provided.');
      }
    }

    // Validar que el dispositivo asignado exista (opcional, pero recomendado)
    const deviceExists = availableDevices.some(d => d.device === assignedDevice);
    if (!deviceExists) {
      return res.status(400).json({ message: 'Invalid device provided' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      devices: [assignedDevice], // Asignar solo un dispositivo en un arreglo
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, devices: newUser.devices });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Agregar un dispositivo al usuario
router.post('/devices/add', auth, async (req, res) => {
  const { device } = req.body;

  try {
    if (!device || typeof device !== 'string') {
      return res.status(400).json({ message: 'Device must be a non-empty string.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verificar si el usuario ya tiene un dispositivo asignado
    if (user.devices.length > 0) {
      return res.status(400).json({ message: 'User can only have one device assigned' });
    }

    // Verificar si el dispositivo existe
    const availableDevices = await SensorData.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('device')), 'device']],
    });
    if (!availableDevices.some(d => d.device === device)) {
      return res.status(400).json({ message: 'Device does not exist' });
    }

    // Agregar el dispositivo
    user.devices = [device]; // Reemplazar con el nuevo dispositivo (solo uno)
    await user.save();

    res.json({ message: 'Device added successfully', devices: user.devices });
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Eliminar un dispositivo del usuario
router.post('/devices/remove', auth, async (req, res) => {
  const { device } = req.body;

  try {
    if (!device || typeof device !== 'string') {
      return res.status(400).json({ message: 'Device must be a non-empty string.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verificar si el dispositivo está asignado
    if (user.devices.length === 0 || !user.devices.includes(device)) {
      return res.status(400).json({ message: 'Device not assigned to this user' });
    }

    // Eliminar el dispositivo
    user.devices = [];
    await user.save();

    res.json({ message: 'Device removed successfully', devices: user.devices });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;