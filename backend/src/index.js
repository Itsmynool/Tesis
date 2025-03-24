import express from 'express';
import cors from 'cors';
import connectMongoDB from './databases/mongoDatabase.js';
import { connectPostgreSQL, sequelize } from './databases/postgresqlDatabase.js';
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/sensorRoutes.js';
import dotenv from 'dotenv';
import SensorData from './models/sensorData.js';

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

// Endpoint for root route
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/sensor', dataRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));