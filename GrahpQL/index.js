const { ApolloServer, gql } = require('apollo-server');
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'IoT',
  password: '12345',
  port: 5432,
});

// Esquema GraphQL
const typeDefs = gql`
  type IoTDevice {
    time: String
    device_type: String
    energy_consumption_kWh: Float
    temperature_C: Float
    status: String
    humidity_relative: Float
    noise_dB: Float
    opens_per_hour: Int
    alert_temperature: String
    intensity_lumens: Int
    light_color: String
    daily_energy_kWh: Float
  }

  # Promedios diarios
  type DailyAverage {
    device_type: String
    day: String
    avg_temperature: Float
    avg_humidity: Float
  }

  # Consultas disponibles
  type Query {
    # Obtener todos los dispositivos
    devices: [IoTDevice]
    
    # Obtener promedios diarios por tipo de dispositivo
    dailyAverages(device_type: String): [DailyAverage]
  }
`;

const resolvers = {
  Query: {
    // Obtener promedios diarios
    dailyAverages: async (_, { device_type }) => {
      const query = `
        SELECT 
          device_type, 
          time_bucket('1 day', time) AS day, 
          AVG(temperature_C) AS avg_temperature, 
          AVG(humidity_relative) AS avg_humidity
        FROM iot_devices
        ${device_type ? `WHERE device_type = $1` : ""}
        GROUP BY device_type, day
        ORDER BY day;
      `;
      const values = device_type ? [device_type] : [];
      const result = await pool.query(query, values);
      return result.rows.map(row => ({
        device_type: row.device_type,
        day: row.day.toISOString(), // Asegurarse de formatear la fecha
        avg_temperature: row.avg_temperature,
        avg_humidity: row.avg_humidity,
      }));
    },
  },
};

// Crear y lanzar el servidor Apollo
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Servidor GraphQL corriendo en ${url}`);
});
