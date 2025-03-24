import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { DashboardProps, SensorData } from '../types';
import DashboardForm from './DashboardForm';
import 'leaflet/dist/leaflet.css';
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
  '1c:bf:ce:15:ec:4d': { name: 'Sensor Medellín', lat: 6.2442, lng: -75.5812 }, // Medellín
  'b8:27:eb:bf:9d:51': { name: 'Sensor Bogotá', lat: 4.7110, lng: -74.0721 }, // Bogotá
};

// Lista de dispositivos (para las consultas)
const DEVICES = [
  'b8:27:eb:bf:9d:51',
  '1c:bf:ce:15:ec:4d',
  '00:0f:00:70:91:0a',
];

// Límite máximo de entradas en el historial por dispositivo
const MAX_HISTORY_ENTRIES = 100;

// Función para obtener el historial desde localStorage
const loadHistoryFromLocalStorage = (deviceId: string): SensorData[] => {
  const key = `history_${deviceId}`;
  const stored = localStorage.getItem(key);
  console.log(`Cargando historial desde localStorage para ${deviceId}:`, stored ? JSON.parse(stored) : []);
  return stored ? JSON.parse(stored) : [];
};

// Función para guardar el historial en localStorage
const saveHistoryToLocalStorage = (deviceId: string, history: SensorData[]) => {
  const key = `history_${deviceId}`;
  console.log(`Guardando historial en localStorage para ${deviceId}:`, history);
  localStorage.setItem(key, JSON.stringify(history));
};

const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [deviceLocations, setDeviceLocations] = useState<DeviceLocation[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(devices[0] || '');
  const [data, setData] = useState<SensorData | null>(null);
  const [localHistory, setLocalHistory] = useState<{ [key: string]: SensorData[] }>({}); // Historial por dispositivo
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number>(10000); // Inicializamos con 10 segundos
  const [showUpdateNotification, setShowUpdateNotification] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true); // Nueva variable para rastrear la primera carga
  const navigate = useNavigate();

  const UPDATE_INTERVAL = 10000; // 10 segundos en milisegundos

  // Cargar el historial desde localStorage al montar el componente
  useEffect(() => {
    const initialHistory: { [key: string]: SensorData[] } = {};
    DEVICES.forEach((device) => {
      initialHistory[device] = loadHistoryFromLocalStorage(device);
    });
    setLocalHistory(initialHistory);
  }, []);

  // Obtener dispositivos y mapearlos a ubicaciones
  useEffect(() => {
    const fetchAvailableDevices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<string[]>('http://localhost:5000/api/sensor/devices', {
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
          localStorage.removeItem('token'); // Limpiar el token del almacenamiento local
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
      setShowHistory(null); // Resetear el historial al cambiar de dispositivo
      // Actualizar los datos actuales del nuevo dispositivo seleccionado
      if (localHistory[newDevice] && localHistory[newDevice].length > 0) {
        setData(localHistory[newDevice][localHistory[newDevice].length - 1]);
      } else {
        setData(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setToken(null);
        localStorage.removeItem('token'); // Limpiar el token del almacenamiento local
        navigate('/login');
      } else {
        setError('Error al cambiar de dispositivo: ' + (err.message || 'Desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Realizar consultas para el dispositivo seleccionado cada 10 segundos
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDevice) return;
      try {
        setLoading(true);
        setError(null);
        console.log(`Solicitando datos para el dispositivo ${selectedDevice}...`);
        const response = await axios.get<SensorData>(`http://localhost:5000/api/data/realtime/${selectedDevice}`, {
          headers: { 'x-auth-token': token },
        });
        const newData = response.data;
        console.log(`Datos recibidos para el dispositivo ${selectedDevice}:`, newData);
        setData(newData);

        // Solo mostramos la notificación si no es la primera carga
        if (!isFirstLoad) {
          setShowUpdateNotification(true);
          setTimeout(() => setShowUpdateNotification(false), 5000);
        }
        setStartTime(new Date());

        // Agregar el nuevo dato al historial del dispositivo seleccionado
        setLocalHistory((prevHistory) => {
          const deviceHistory = prevHistory[selectedDevice] || [];
          const updatedDeviceHistory = [...deviceHistory, newData];
          // Limitar el historial a las últimas MAX_HISTORY_ENTRIES entradas
          if (updatedDeviceHistory.length > MAX_HISTORY_ENTRIES) {
            updatedDeviceHistory.splice(0, updatedDeviceHistory.length - MAX_HISTORY_ENTRIES);
          }
          const updatedHistory = {
            ...prevHistory,
            [selectedDevice]: updatedDeviceHistory,
          };
          // Guardar en localStorage
          saveHistoryToLocalStorage(selectedDevice, updatedDeviceHistory);
          console.log(`Historial actualizado para ${selectedDevice}:`, updatedDeviceHistory);
          return updatedHistory;
        });

        // Marcamos que la primera carga ya ocurrió
        setIsFirstLoad(false);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
          setToken(null);
          localStorage.removeItem('token'); // Limpiar el token del almacenamiento local
          navigate('/login');
        } else {
          setError('Error al obtener datos en tiempo real: ' + (err.message || 'Desconocido'));
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Realizar la primera consulta inmediatamente
    fetchData();

    // Configurar un intervalo para consultar cada 10 segundos
    const interval = setInterval(() => {
      console.log('Intervalo disparado: solicitando nuevos datos...');
      fetchData();
    }, UPDATE_INTERVAL);

    // Limpiar el intervalo al desmontar el componente
    return () => {
      console.log('Limpiando intervalo...');
      clearInterval(interval);
    };
  }, [selectedDevice, token, navigate, setToken]);

  // Temporizador para mostrar el tiempo restante hasta la próxima actualización
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
    const secondsRemaining = Math.floor(timeRemaining / 1000);
    if (timeRemaining <= 0) return 'Actualización en curso...';
    return `${secondsRemaining} seg restantes`;
  };

  const getTimeSinceLastUpdate = () => {
    const now = new Date();
    const timeElapsed = now.getTime() - startTime.getTime();
    const diffSeconds = Math.floor(timeElapsed / 1000);
    if (diffSeconds < 1) return 'Actualizado hace menos de un segundo';
    return `Actualizado hace ${diffSeconds} segundo${diffSeconds === 1 ? '' : 's'}`;
  };

  const updateHistoryChartData = (dataKey: string) => {
    const history = selectedDevice ? localHistory[selectedDevice] || [] : [];
    console.log(`updateHistoryChartData llamado con dataKey: ${dataKey}, history:`, history);
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

      console.log(`Datos del gráfico generados para ${dataKey}:`, chartData);
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

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Detener la propagación del evento
    e.preventDefault(); // Prevenir cualquier comportamiento por defecto
    console.log('Clic en Cerrar Sesión detectado');
    try {
      console.log('Iniciando cierre de sesión...');
      // Limpiar el token del estado
      setToken(null);
      // Limpiar el token del almacenamiento local (si se está usando)
      localStorage.removeItem('token');
      sessionStorage.removeItem('token'); // También limpiamos sessionStorage por si acaso
      console.log('Token limpiado del estado y almacenamiento local');
      // Redirigir al login
      navigate('/login', { replace: true });
      console.log('Redirigiendo a /login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 relative">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Tablero de Control</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">Última actualización: {getTimeSinceLastUpdate()}</div>
            <button
              onClick={(e) => {
                console.log('Evento onClick disparado en el botón Cerrar Sesión');
                handleLogout(e);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 z-50"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor principal con padding superior para evitar que el contenido quede debajo del header */}
      <div className="pt-20 w-full">
        {error && (
          <div className="text-lg font-semibold text-red-500 mb-4">{error}</div>
        )}

        <DashboardForm
          availableDevices={availableDevices}
          selectedDevice={selectedDevice}
          changeDevice={changeDevice}
          data={data}
          history={selectedDevice ? localHistory[selectedDevice] || [] : []} // Pasamos el historial del dispositivo seleccionado
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

      {showUpdateNotification && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Datos actualizados
        </div>
      )}
    </div>
  );
};

export default Dashboard;