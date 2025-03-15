import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { DashboardProps, SensorData } from '../types';
import DashboardForm from './DashboardForm';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Corrige el ícono predeterminado de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// Definimos una interfaz para las ubicaciones de los dispositivos
interface DeviceLocation {
  device: string;
  name: string;
  lat: number;
  lng: number;
}

// Mapeo manual de direcciones MAC a ubicaciones (Cali, Medellín, Bogotá)
const deviceLocationsMap: { [key: string]: { name: string; lat: number; lng: number } } = {
  '00:0f:00:70:91:0a': { name: 'Sensor Cali', lat: 3.4372, lng: -76.5225 }, // Cali
  '1c:bfce:15:ec:4d': { name: 'Sensor Medellín', lat: 6.2442, lng: -75.5812 }, // Medellín
  'b8:27:eb:bf:9d:51': { name: 'Sensor Bogotá', lat: 4.7110, lng: -74.0721 }, // Bogotá
};

const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocation[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0] || '');
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number>(300000);
  const [showUpdateNotification, setShowUpdateNotification] = useState<boolean>(false);
  const navigate = useNavigate();

  const UPDATE_INTERVAL = 300000; // 5 minutos en milisegundos

  // Obtener dispositivos y mapearlos a ubicaciones
  useEffect(() => {
    const fetchAvailableDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<string[]>('http://localhost:5000/api/data/devices', {
          headers: { 'x-auth-token': token },
        });
        const devices = response.data;
        setAvailableDevices(devices);

        // Mapear los dispositivos a ubicaciones usando el mapeo manual
        const locations = devices
          .filter((device) => deviceLocationsMap[device]) // Solo incluir dispositivos con ubicación definida
          .map((device) => ({
            device,
            name: deviceLocationsMap[device].name,
            lat: deviceLocationsMap[device].lat,
            lng: deviceLocationsMap[device].lng,
          }));
        setDeviceLocations(locations);

        if (!selectedDevice || !devices.includes(selectedDevice)) {
          const deviceWithData = devices.find((dev) => dev === 'b8:27:eb:bf:9d:51') || devices[0];
          if (deviceWithData) {
            setSelectedDevice(deviceWithData);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener dispositivos disponibles: ' + (err.message || 'Desconocido'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDevices();
  }, [token, navigate, setToken]);

  const changeDevice = async (newDevice: string) => {
    if (!newDevice || newDevice === selectedDevice) return;
    try {
      setLoading(true);
      setError(null);
      if (selectedDevice) {
        await axios.post(
          'http://localhost:5000/api/auth/devices/remove',
          { device: selectedDevice },
          { headers: { 'x-auth-token': token } }
        );
      }
      await axios.post(
        'http://localhost:5000/api/auth/devices/add',
        { device: newDevice },
        { headers: { 'x-auth-token': token } }
      );
      setSelectedDevice(newDevice);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setToken(null);
        navigate('/login');
      } else {
        setError('Error al cambiar de dispositivo: ' + (err.message || 'Desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDevice) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<SensorData>(`http://localhost:5000/api/data/realtime/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        setData(response.data);
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 5000);
        setStartTime(new Date());
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener datos en tiempo real: ' + (err.message || 'Desconocido'));
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      if (!selectedDevice) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<SensorData[]>(`http://localhost:5000/api/data/history/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        setHistory(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          navigate('/login');
        } else {
          setError('Error al obtener el historial: ' + (err.message || 'Desconocido'));
        }
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchHistory();
    const interval = setInterval(() => {
      fetchData();
      fetchHistory();
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [selectedDevice, token, navigate, setToken]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeElapsed = now.getTime() - startTime.getTime();
      const remainingMs = Math.max(UPDATE_INTERVAL - timeElapsed, 0);
      setTimeRemaining(remainingMs);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const getTimeRemaining = () => {
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
    if (timeRemaining <= 0) return 'Actualización en curso...';
    return `${minutesRemaining} min ${secondsRemaining} seg restantes`;
  };

  const getTimeSinceLastUpdate = () => {
    const now = new Date();
    const timeElapsed = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(timeElapsed / 60000);
    if (diffMins < 1) return 'Actualizado hace menos de un minuto';
    return `Actualizado hace ${diffMins} minuto${diffMins === 1 ? '' : 's'}`;
  };

  const updateHistoryChartData = (dataKey: string) => {
    if (history.length > 0) {
      const labels = history.map((entry) => new Date(entry.ts).toLocaleTimeString('es-ES'));
      let chartData;

      if (dataKey === 'airQuality') {
        chartData = {
          labels,
          datasets: [
            {
              label: 'Calidad del Aire',
              data: history.map((item) =>
                Math.min(
                  100,
                  Math.max(
                    0,
                    100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
                  )
                )
              ),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.3,
              fill: false,
            },
          ],
        };
      } else {
        chartData = {
          labels,
          datasets: [
            {
              label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
              data: history.map((item) => item[dataKey as keyof SensorData]),
              borderColor: getColor(dataKey),
              backgroundColor: getColor(dataKey, 0.2),
              tension: 0.3,
              fill: false,
            },
          ],
        };
      }

      return chartData;
    }
    return { labels: [], datasets: [] };
  };

  const updateSummaryBarChartData = () => {
    if (data) {
      return {
        labels: ['Temp', 'Humedad', 'CO', 'LPG'],
        datasets: [
          {
            label: 'Valores Normalizados',
            data: [
              data.temp / 50,
              data.humidity / 100,
              data.co * 10000,
              data.lpg * 10000,
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
    return { labels: [], datasets: [] };
  };

  const updateAirQualityChartData = () => {
    if (data) {
      const airQuality = Math.min(
        100,
        Math.max(
          0,
          100 - ((data.co * 10000 + data.lpg * 10000 + (data.smoke ? 50 : 0)) / 100)
        )
      );
      return {
        labels: ['Calidad del Aire', 'Resto'],
        datasets: [
          {
            data: [airQuality, 100 - airQuality],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
            borderWidth: 1,
          },
        ],
      };
    }
    return { labels: [], datasets: [] };
  };

  const getColor = (dataKey: string, opacity: number = 1) => {
    const colors: { [key: string]: string } = {
      temp: 'rgb(75, 192, 192)',
      humidity: 'rgb(255, 99, 132)',
      co: 'rgb(54, 162, 235)',
      lpg: 'rgb(255, 206, 86)',
      light: 'rgb(153, 102, 255)',
      motion: 'rgb(255, 159, 64)',
      smoke: 'rgb(201, 203, 207)',
    };
    return colors[dataKey] ? colors[dataKey].replace('rgb', 'rgba').replace(')', `, ${opacity})`) : 'gray';
  };

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative">
      {showUpdateNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-out">
          <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg">
            Datos actualizados correctamente
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Tablero de Control</h1>
          <div className="flex flex-col items-end space-y-1">
            <div className="text-sm text-gray-400">Última actualización: {getTimeSinceLastUpdate()}</div>
            <div className="text-sm text-gray-400">Tiempo restante: {getTimeRemaining()}</div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
          >
            Cerrar Sesión
          </button>
        </div>

        {error && (
          <div className="text-lg font-semibold text-red-500 mb-4">{error}</div>
        )}

        {/* Mapa interactivo para seleccionar dispositivos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Selecciona un dispositivo en el mapa</h2>
          {deviceLocations.length > 0 ? (
            <MapContainer
              center={[4.7110, -74.0721]} // Centro inicial (Bogotá, como punto medio aproximado)
              zoom={6} // Zoom para mostrar Colombia
              style={{ height: '400px', width: '100%' }}
              className="rounded-lg shadow-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {deviceLocations.map((location) => (
                <Marker
                  key={location.device}
                  position={[location.lat, location.lng]}
                  eventHandlers={{
                    click: () => {
                      changeDevice(location.device);
                    },
                  }}
                >
                  <Popup>
                    <div>
                      <h3 className="font-bold">{location.name}</h3>
                      <p>Dispositivo: {location.device}</p>
                      <button
                        onClick={() => changeDevice(location.device)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <p className="text-gray-400">No hay ubicaciones disponibles para los dispositivos.</p>
          )}
        </div>

        <DashboardForm
          availableDevices={availableDevices}
          selectedDevice={selectedDevice}
          changeDevice={changeDevice}
          data={data}
          history={history}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          updateHistoryChartData={updateHistoryChartData}
          updateSummaryBarChartData={updateSummaryBarChartData}
          updateAirQualityChartData={updateAirQualityChartData}
          getColor={getColor}
        />
      </div>

      {loading && (
        <div className="absolute top-2 left-2 bg-gray-700 text-white px-2 py-1 rounded-full text-sm">
          Actualizando...
        </div>
      )}
    </div>
  );
};

export default Dashboard;