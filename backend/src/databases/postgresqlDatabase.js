import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Connect to PostgreSQL database from .env
const sequelize = new Sequelize(process.env.DATABASE_POSTGRESQL, {
  dialect: 'postgres',
  logging: false,
  host: 'db.bxhjfgboblhpodkggymx.supabase.co',
  port: 5432,
  protocol: 'tcp',
  dialectOptions: {
    useIPv6: false, // Desactiva IPv6
    keepAlive: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});


// Function for connecting to PostgreSQL
const connectPostgreSQL = async () => {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
  } catch (error) {
    // If there is an error
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

export { connectPostgreSQL, sequelize };
