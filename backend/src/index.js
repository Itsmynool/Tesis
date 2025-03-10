import express from 'express';
import cors from 'cors';
import connectMongoDB from './config/db.js';
import { connectPostgreSQL, sequelize } from './config/pgdb.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import dotenv from 'dotenv';
import SensorData from './models/SensorData.js';

dotenv.config();

const app = express();

// Conectar a MongoDB
connectMongoDB();

// Conectar a PostgreSQL y sincronizar el modelo
connectPostgreSQL();
sequelize.options.logging = console.log; // Habilitar logs de Sequelize
SensorData.sync({ alter: false }); // Sincronizar sin alterar la tabla

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));