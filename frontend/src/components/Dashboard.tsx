import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { DashboardProps, SensorData } from '../types';
import DashboardForm from './DashboardForm';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// Function for the dashboard
const Dashboard: React.FC<DashboardProps> = ({ token, setToken, devices }) => {
  // Constans for dashboard in time and max history
  const UPDATE_INTERVAL = 10000;
  const MAX_HISTORY_ENTRIES = 100; 
  
  // State for available devices
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  // State for selected device in base of localStorage or first device
  const [selectedDevice, setSelectedDevice] = useState<string>(() => {
    const savedDevice = localStorage.getItem('selectedDevice');
    const availableDevices = JSON.parse(localStorage.getItem('availableDevices') || '[]');
    return savedDevice || availableDevices[0] || '';
  });
  // State for device histories in base of localStorage
  const [, setDeviceHistories] = useState<Record<string, SensorData[]>>(() => {
    return JSON.parse(localStorage.getItem('deviceHistories') || '{}');
  });
  // State for set data from selected device in dashboard
  const [data, setData] = useState<SensorData | null>(null);
  // State for history of selected device in dashboard
  const [localHistory, setLocalHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [startTime] = useState<Date>(new Date());
  const [, setTimeRemaining] = useState<number>(30000);
  const [, setShowUpdateNotification] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true); 
  const navigate = useNavigate();

  // Function for fetch available devices in dashboard
  const fetchAvailableDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      // Call API to get available devices
      const response = await axios.get<string[]>('http://localhost:5000/api/sensor/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Set available devices
      const devices = response.data;
      setAvailableDevices(devices);
      localStorage.setItem('availableDevices', JSON.stringify(devices));
      // Set selected device
      const savedDevice = localStorage.getItem('selectedDevice');
      // If no saved device or not in available devices, set first device
      if (!savedDevice || !devices.includes(savedDevice)) {
        const firstDevice = devices[0] || '';
        setSelectedDevice(firstDevice);
        localStorage.setItem('selectedDevice', firstDevice);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setToken(null);
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al obtener dispositivos disponibles: ' + (err.message || 'Desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Function for fetch data in dashboard in real time
  const fetchData = async () => {
    // Get available devices from localStorage
    const devices = JSON.parse(localStorage.getItem('availableDevices') || '[]');
    // If no devices, return
    if (!devices.length) return;
    try {
      setLoading(true);
      setError(null);
      // Call API to get data from each device in real time for 3 devices in parallel
      await Promise.all(devices.map(async (device: string) => {
        try {
          // Call API to get data from device in real time
          const response = await axios.get<SensorData>(`http://localhost:5000/api/sensor/realtime/${device}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          // Get data
          const newData = response.data;
          // Update device history
          setDeviceHistories(prevHistories => {
              // Add new data to history
            const updatedDeviceHistory = [...(prevHistories[device] || []), newData].slice(-MAX_HISTORY_ENTRIES);
            // Update history in localStorage
            const updatedHistories = { ...prevHistories, [device]: updatedDeviceHistory };
            localStorage.setItem('deviceHistories', JSON.stringify(updatedHistories)); 
            // Return updated history
            return updatedHistories;
          });
        } catch (err: any) {
          console.error(`Error al obtener datos del dispositivo ${device}:`, err);
        }
      }));
      // Update local history and data from selected device
      setDeviceHistories(prevHistories => {
        const updatedHistories = { ...prevHistories };
        const latestData = updatedHistories[selectedDevice]?.[updatedHistories[selectedDevice].length - 1] || null;
        setData(latestData);
        setLocalHistory(updatedHistories[selectedDevice] || []);
        return updatedHistories;
      });
      // Update time remaining
      if (!isFirstLoad) {
        setShowUpdateNotification(true);
        setTimeout(() => setShowUpdateNotification(false), 5000);
      }
      setIsFirstLoad(false);
    } catch (err: any) {
      setError('Error al obtener datos en tiempo real: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Function for change device
  const changeDevice = async (newDevice: string) => {
    // If new device is the same as selected device, return
    if (!newDevice || newDevice === selectedDevice) return;
    try {
      setLoading(true);
      setError(null);
      setSelectedDevice(newDevice);
      localStorage.setItem('selectedDevice', newDevice);
      setLocalHistory([]);
      await fetchData();
    } catch (err: any) {
      setError('Error al cambiar de dispositivo: ' + (err.message || 'Desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // UseEffect for fetch available devices and data
  useEffect(() => {
    fetchAvailableDevices();
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedDevice, token, navigate, setToken]);

  // UseEffect for update time remaining
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeElapsed = now.getTime() - startTime.getTime();
      const remainingMs = Math.max(UPDATE_INTERVAL - timeElapsed, 0);
      setTimeRemaining(remainingMs);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const getTimeSinceLastUpdate = () => {
    const now = new Date();
    const timeElapsed = now.getTime() - startTime.getTime();
    const diffSeconds = Math.floor(timeElapsed / 1000);
    if (diffSeconds < 1) return 'Actualizado hace menos de un segundo';
    return `Actualizado hace ${diffSeconds} segundo${diffSeconds === 1 ? '' : 's'}`;
  };

  const updateHistoryChartData = (dataKey: string) => {
    if (localHistory.length > 0) {
      const labels = localHistory.map((entry) => new Date(entry.ts).toLocaleTimeString('es-ES'));
      let chartData;

      if (dataKey === 'airQuality') {
        chartData = {
          labels,
          datasets: [
            {
              label: 'Calidad del Aire',
              data: localHistory.map((item) =>
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
              data: localHistory.map((item) => item[dataKey as keyof SensorData]),
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
          history={localHistory} // Pasamos el historial local
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