import { useState, useEffect, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { SensorData, DashboardFormProps } from '../types';
import TemperatureGauge from './TemperatureGauge';
import HumidityGauge from './HumidityGauge';
import AirQualityGauge from './AirQualityGauge';
import LightIndicator from './LightIndicator';
import COGauge from './COGauge';
import LPGGauge from './LPGGauge';
import SmokeIndicator from './SmokeIndicator';

// Estilo para los dropdowns y botones
const dropdownStyles = `
  .dropdown-button {
    background-color: #4a5568;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s;
    width: auto;
    border: none;
  }
  .dropdown-button:hover {
    background-color: #5a67d8;
  }
  .dropdown-content {
    background-color: #2d3748;
    border: 1px solid #4a5568;
    border-radius: 0.375rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    position: absolute;
    z-index: 150;
    width: 200px;
  }
  .dropdown-content label {
    display: flex;
    align-items: center;
    padding: 0.25rem 0;
  }
  .button-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }
`;

const DashboardForm: React.FC<DashboardFormProps> = ({
  availableDevices,
  data,
  deviceHistories,
  showHistory,
  setShowHistory,
  updateHistoryChartData,
  updateSummaryBarChartData,
  updateAirQualityChartData,
  getColor,
}) => {
  // Calculamos la calidad del aire para cada dispositivo
  const airQualityByDevice = Object.keys(data).reduce((acc, device) => {
    const deviceData = data[device];
    acc[device] = deviceData
      ? Math.round(
          100 -
            ((deviceData.co * 10000 + deviceData.lpg * 10000 + (deviceData.smoke ? 50 : 0)) / 100)
        )
      : 0;
    return acc;
  }, {} as Record<string, number>);

  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState<boolean>(false);
  const [isDataDropdownOpen, setIsDataDropdownOpen] = useState<boolean>(false);

  // Estado para almacenar el historial de predicciones por dispositivo y tipo de dato
  const [predictionsHistory, setPredictionsHistory] = useState<
    Record<string, Record<string, { timestamp: string; predictedValue: number; actualValue: number | null }[]>>
  >(() => {
    const saved = localStorage.getItem('predictionsHistory');
    return saved ? JSON.parse(saved) : {};
  });

  // Guardar predictionsHistory en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('predictionsHistory', JSON.stringify(predictionsHistory));
  }, [predictionsHistory]);

  // Referencias para los botones de los dropdowns
  const deviceButtonRef = useRef<HTMLButtonElement>(null);
  const dataButtonRef = useRef<HTMLButtonElement>(null);

  // Estado para la visibilidad de datos por dispositivo, inicializado desde localStorage
  const [cardVisibilityByDevice, setCardVisibilityByDevice] = useState<
    Record<
      string,
      {
        temperature: boolean;
        humidity: boolean;
        airQuality: boolean;
        light: boolean;
        co: boolean;
        lpg: boolean;
        motion: boolean;
        smoke: boolean;
      }
    >
  >(() => {
    const saved = localStorage.getItem('cardVisibilityByDevice');
    const defaultVisibility: Record<string, any> = {};
    availableDevices.forEach(device => {
      defaultVisibility[device] = {
        temperature: false,
        humidity: false,
        airQuality: false,
        light: false,
        co: false,
        lpg: false,
        motion: false,
        smoke: false,
      };
    });
    const initialVisibility = saved ? JSON.parse(saved) : defaultVisibility;

    // Asegurarse de que todos los dispositivos disponibles estén presentes
    availableDevices.forEach((device, index) => {
      if (!initialVisibility[device]) {
        const isFirstDevice = index === 0;
        initialVisibility[device] = {
          temperature: isFirstDevice,
          humidity: isFirstDevice,
          airQuality: isFirstDevice,
          light: isFirstDevice,
          co: isFirstDevice,
          lpg: isFirstDevice,
          motion: isFirstDevice,
          smoke: isFirstDevice,
        };
      }
    });

    return initialVisibility;
  });

  // Guardar cardVisibilityByDevice en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('cardVisibilityByDevice', JSON.stringify(cardVisibilityByDevice));
  }, [cardVisibilityByDevice]);

  // Estado para controlar qué dispositivo está seleccionado para configurar
  const [selectedDeviceForConfig, setSelectedDeviceForConfig] = useState<string | null>(null);

  // Actualizamos cardVisibilityByDevice cuando cambian los dispositivos disponibles
  useEffect(() => {
    setCardVisibilityByDevice(prev => {
      const updatedVisibility: Record<string, any> = { ...prev };
      availableDevices.forEach((device, index) => {
        if (!updatedVisibility[device]) {
          // Si es el primer dispositivo y no hay selección previa, seleccionar todos los datos por defecto
          const isFirstDevice = index === 0 && !Object.values(prev).some(device => Object.values(device).some(val => val));
          updatedVisibility[device] = {
            temperature: isFirstDevice,
            humidity: isFirstDevice,
            airQuality: isFirstDevice,
            light: isFirstDevice,
            co: isFirstDevice,
            lpg: isFirstDevice,
            motion: isFirstDevice,
            smoke: isFirstDevice,
          };
        }
      });
      Object.keys(updatedVisibility).forEach(device => {
        if (!availableDevices.includes(device)) {
          delete updatedVisibility[device];
        }
      });
      return updatedVisibility;
    });
    if (availableDevices.length > 0 && !selectedDeviceForConfig) {
      setSelectedDeviceForConfig(availableDevices[0]);
    }
  }, [availableDevices, selectedDeviceForConfig]);

  // Generar predicciones para los dispositivos y tipos de datos seleccionados
  useEffect(() => {
    const dataTypes = ['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'];

    availableDevices.forEach((device) => {
      const deviceHistory = deviceHistories[device] || [];
      const updatedData = deviceHistory.map((item: SensorData) => {
        const ts = item.ts || new Date().toISOString();
        return { ...item, ts };
      });

      if (showHistory && showHistory.device === device) {
        setFilteredData(updatedData);
      }

      dataTypes.forEach((dataKey) => {
        if (updatedData.length >= 2) {
          setPredictionsHistory(
            (prev: Record<string, Record<string, { timestamp: string; predictedValue: number; actualValue: number | null }[]>>) => {
              const devicePredictions = prev[device] || {};
              const dataTypePredictions = devicePredictions[dataKey] || [];

              const newPredictions: { timestamp: string; predictedValue: number; actualValue: number | null }[] = [];
              for (let i = 1; i < updatedData.length - 1; i++) {
                const currentData = updatedData[i];
                const nextData = updatedData[i + 1];
                const predictionTimestamp = nextData.ts;

                let predictedValue: number;
                let actualValue: number | null = null;

                if (dataKey === 'airQuality') {
                  const coPredicted = predictNextValue(updatedData.slice(0, i + 1), 'co');
                  const lpgPredicted = predictNextValue(updatedData.slice(0, i + 1), 'lpg');
                  const smokePredicted = predictNextValue(updatedData.slice(0, i + 1), 'smoke');

                  predictedValue = Math.min(
                    100,
                    Math.max(
                      0,
                      100 - ((coPredicted * 10000 + lpgPredicted * 10000 + (smokePredicted > 0 ? 50 : 0)) / 100)
                    )
                  );

                  actualValue = Math.min(
                    100,
                    Math.max(
                      0,
                      100 - ((nextData.co * 10000 + nextData.lpg * 10000 + (nextData.smoke ? 50 : 0)) / 100)
                    )
                  );
                } else {
                  predictedValue = predictNextValue(updatedData.slice(0, i + 1), dataKey);
                  actualValue = nextData[dataKey as keyof SensorData] as number;
                }

                newPredictions.push({
                  timestamp: predictionTimestamp,
                  predictedValue: predictedValue,
                  actualValue: actualValue,
                });
              }

              if (updatedData.length >= 2) {
                const lastTimestamp = new Date(updatedData[updatedData.length - 1].ts);
                const predictionTimestamp = new Date(lastTimestamp.getTime() + 30 * 1000).toISOString();

                let futurePredictedValue: number;
                if (dataKey === 'airQuality') {
                  const coFuture = predictNextValue(updatedData, 'co');
                  const lpgFuture = predictNextValue(updatedData, 'lpg');
                  const smokeFuture = predictNextValue(updatedData, 'smoke');
                  futurePredictedValue = Math.min(
                    100,
                    Math.max(
                      0,
                      100 - ((coFuture * 10000 + lpgFuture * 10000 + (smokeFuture > 0 ? 50 : 0)) / 100)
                    )
                  );
                } else {
                  futurePredictedValue = predictNextValue(updatedData, dataKey);
                }

                newPredictions.push({
                  timestamp: predictionTimestamp,
                  predictedValue: futurePredictedValue,
                  actualValue: null,
                });
              }

              const earliestTimestamp = updatedData.length > 50
                ? new Date(updatedData[updatedData.length - 50].ts).getTime()
                : updatedData.length > 0
                ? new Date(updatedData[0].ts).getTime()
                : 0;
              let filteredPredictions = newPredictions.filter(
                (pred) => new Date(pred.timestamp).getTime() >= earliestTimestamp
              );

              filteredPredictions = filteredPredictions.filter(
                (pred, index, self) =>
                  index === self.findIndex((p) => p.timestamp === pred.timestamp)
              );

              return {
                ...prev,
                [device]: {
                  ...devicePredictions,
                  [dataKey]: filteredPredictions,
                },
              };
            }
          );
        }
      });
    });

    if (!showHistory) {
      setFilteredData([]);
    }
  }, [deviceHistories, availableDevices, showHistory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const deviceDropdownContent = document.querySelector('.dropdown-content');
      const dataDropdownContent = document.querySelector('.dropdown-content');

      if (
        deviceButtonRef.current &&
        !deviceButtonRef.current.contains(target) &&
        (!deviceDropdownContent || !deviceDropdownContent.contains(target))
      ) {
        setIsDeviceDropdownOpen(false);
      }
      if (
        dataButtonRef.current &&
        !dataButtonRef.current.contains(target) &&
        (!dataDropdownContent || !dataDropdownContent.contains(target))
      ) {
        setIsDataDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredHistoryChartData = (dataKey: string, device: string) => {
    const deviceHistory = deviceHistories[device] || [];
    if (deviceHistory.length === 0) return { labels: [], datasets: [] };

    const sampledData = deviceHistory.slice(-50);

    const historicalEntries = sampledData.map((item: SensorData) => {
      let value: number;
      if (dataKey === 'airQuality') {
        value = Math.min(
          100,
          Math.max(
            0,
            100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
          )
        );
      } else {
        value = item[dataKey as keyof SensorData] as number;
        if (dataKey === 'light' || dataKey === 'motion') {
          value = value ? 1 : 0;
        }
      }
      return { timestamp: item.ts, value };
    });

    const devicePredictions = predictionsHistory[device] || {};
    const dataTypePredictions = devicePredictions[dataKey] || [];

    const historicalPredictions = dataTypePredictions.filter(
      (pred) => pred.actualValue !== null
    );
    const futurePrediction = dataTypePredictions.length > 0
      ? dataTypePredictions[dataTypePredictions.length - 1].actualValue === null
        ? dataTypePredictions[dataTypePredictions.length - 1]
        : null
      : null;

    const historicalTimestamps = historicalEntries.map((entry) => entry.timestamp);
    const uniqueTimestamps = Array.from(new Set(historicalTimestamps)).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    if (futurePrediction && deviceHistory.length >= 2 && ['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'].includes(dataKey)) {
      uniqueTimestamps.push(futurePrediction.timestamp);
    }

    const allLabels = uniqueTimestamps.map((ts, index) => {
      if (index === uniqueTimestamps.length - 1 && futurePrediction && ['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'].includes(dataKey)) {
        return 'Predicción';
      }
      return new Date(ts).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    });

    const historicalData = uniqueTimestamps.map((ts) => {
      const entry = historicalEntries.find((hist) => hist.timestamp === ts);
      return entry ? entry.value : null;
    });

    let predictionData: (number | null)[] = [];
    if (['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'].includes(dataKey) && deviceHistory.length >= 2) {
      predictionData = uniqueTimestamps.map((ts) => {
        const historicalPred = historicalPredictions.find((pred) => pred.timestamp === ts);
        if (historicalPred) {
          return historicalPred.predictedValue;
        }
        if (futurePrediction && ts === futurePrediction.timestamp) {
          return futurePrediction.predictedValue;
        }
        return null;
      });
    } else {
      predictionData = uniqueTimestamps.map(() => null);
    }

    let chartData;

    if (dataKey === 'airQuality') {
      chartData = {
        labels: allLabels,
        datasets: [
          {
            label: 'Calidad del Aire (%)',
            data: historicalData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.3,
            fill: false,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 3,
            pointHoverRadius: 5,
            spanGaps: true,
          },
          {
            label: 'Predicciones de Calidad del Aire (%)',
            data: predictionData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 0,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 5,
            pointHoverRadius: 7,
            showLine: false,
          },
        ],
      };
    } else if (dataKey === 'humidity') {
      chartData = {
        labels: allLabels,
        datasets: [
          {
            label: `Humedad (%)`,
            data: historicalData,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.3,
            fill: false,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 3,
            pointHoverRadius: 5,
            spanGaps: true,
          },
          {
            label: `Predicciones de Humedad (%)`,
            data: predictionData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 0,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 5,
            pointHoverRadius: 7,
            showLine: false,
          },
        ],
      };
    } else {
      chartData = {
        labels: allLabels,
        datasets: [
          {
            label: `${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)} (${
              dataKey === 'temp'
                ? '°C'
                : dataKey === 'humidity'
                ? '%'
                : dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke'
                ? 'ppm'
                : dataKey === 'light'
                ? ''
                : dataKey === 'motion'
                ? ''
                : ''
            })`,
            data: historicalData,
            borderColor: getColor(dataKey),
            backgroundColor: getColor(dataKey, 0.2),
            tension: 0.3,
            fill: false,
            pointBackgroundColor: getColor(dataKey),
            pointRadius: 3,
            pointHoverRadius: 5,
            spanGaps: true,
          },
          ...(dataKey === 'light' || dataKey === 'motion'
            ? []
            : [
                {
                  label: `Predicciones de ${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)} (${
                    dataKey === 'temp'
                      ? '°C'
                      : dataKey === 'humidity'
                      ? '%'
                      : dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke'
                      ? 'ppm'
                      : ''
                  })`,
                  data: predictionData,
                  borderColor: 'rgba(255, 99, 132, 1)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderWidth: 0,
                  pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  showLine: false,
                },
              ]),
        ],
      };
    }

    return chartData;
  };

  const predictNextValue = (history: SensorData[], dataKey: string): number => {
    if (history.length < 2) {
      const lastValue = history.length > 0 ? (history[history.length - 1][dataKey as keyof SensorData] as number) : 0;
      return lastValue;
    }

    const lastValue = history[history.length - 1][dataKey as keyof SensorData] as number;
    const secondLastValue = history[history.length - 2][dataKey as keyof SensorData] as number;
    const trend = lastValue - secondLastValue;
    const predicted = lastValue + trend;
    return Math.max(0, predicted);
  };

  const getDynamicAxisRange = (dataKey: string, device: string) => {
    const deviceHistory = deviceHistories[device] || [];
    if (deviceHistory.length === 0) return { min: 0, max: 100, stepSize: 10 };

    const recentHistory = deviceHistory.slice(-50);

    let values: number[] = [];
    if (dataKey === 'airQuality') {
      values = recentHistory.map((item: SensorData) =>
        Math.min(
          100,
          Math.max(
            0,
            100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
          )
        )
      );
    } else {
      values = recentHistory
        .map((item: SensorData) => {
          const value = item[dataKey as keyof SensorData];
          if (typeof value !== 'number') return 0;
          if (dataKey === 'temp') {
            return Number(value.toFixed(2));
          } else if (dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke') {
            return Number(value.toFixed(6));
          } else if (dataKey === 'humidity') {
            return Number(value.toFixed(1));
          } else if (dataKey === 'light' || dataKey === 'motion') {
            return value ? 1 : 0;
          }
          return value as number;
        })
        .filter((value): value is number => typeof value === 'number');
    }

    if (['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'].includes(dataKey)) {
      const devicePredictions = predictionsHistory[device] || {};
      const dataTypePredictions = devicePredictions[dataKey] || [];
      const predictionValues = dataTypePredictions.map(
        (pred: { timestamp: string; predictedValue: number; actualValue: number | null }) => pred.predictedValue
      );
      values.push(...predictionValues);
    }

    if (values.length === 0) return { min: 0, max: 100, stepSize: 10 };

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    let padding = range * 0.2 || 1;
    let adjustedMin = Math.max(minValue - padding, 0);
    let adjustedMax = maxValue + padding;

    let stepSize: number;
    if (dataKey === 'temp') {
      stepSize = 0.1;
      adjustedMin = Number((Math.floor(adjustedMin / 0.1) * 0.1).toFixed(2));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.1) * 0.1).toFixed(2));
    } else if (dataKey === 'humidity' || dataKey === 'airQuality') {
      stepSize = 0.1;
      adjustedMin = Number((Math.floor(adjustedMin / 0.1) * 0.1).toFixed(1));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.1) * 0.1).toFixed(1));
    } else if (dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke') {
      stepSize = 0.00001;
      adjustedMin = Number((Math.floor(adjustedMin / 0.00001) * 0.00001).toFixed(6));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.00001) * 0.00001).toFixed(6));
    } else if (dataKey === 'light' || dataKey === 'motion') {
      stepSize = 1;
      adjustedMin = 0;
      adjustedMax = 1;
    } else {
      stepSize = (adjustedMax - adjustedMin) / 10;
    }

    return {
      min: adjustedMin,
      max: adjustedMax,
      stepSize,
    };
  };

  const handleCardVisibilityChange = (
    device: string,
    card: keyof typeof cardVisibilityByDevice[string]
  ) => {
    setCardVisibilityByDevice(prev => ({
      ...prev,
      [device]: {
        ...prev[device],
        [card]: !prev[device][card],
      },
    }));
  };

  const handleShowHistory = (
    event: React.MouseEvent<HTMLButtonElement>,
    device: string,
    dataType: string
  ) => {
    event.stopPropagation();
    setIsDeviceDropdownOpen(false);
    setIsDataDropdownOpen(false);
    setShowHistory(
      showHistory?.device === device && showHistory?.dataType === dataType
        ? null
        : { device, dataType }
    );
  };

  const handleDeviceDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDeviceDropdownOpen(prev => !prev);
  };

  const handleDataDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDataDropdownOpen(prev => !prev);
  };

  const handleDeviceSelect = (device: string) => {
    setSelectedDeviceForConfig(device);
    setIsDeviceDropdownOpen(false);
  };

  const axisRange = showHistory
    ? getDynamicAxisRange(showHistory.dataType, showHistory.device)
    : { min: 0, max: 100, stepSize: 10 };

  let chartLabels: string[] = [];
  if (showHistory) {
    const deviceHistory = deviceHistories[showHistory.device] || [];
    const recentHistory = deviceHistory.slice(-50);
    const labels = recentHistory.map((entry: SensorData) =>
      new Date(entry.ts).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    chartLabels = ['temp', 'humidity', 'airQuality', 'co', 'lpg', 'smoke'].includes(showHistory.dataType)
      ? [...labels, 'Predicción']
      : labels;
  }

  const visibleCards: { device: string; type: string; data: SensorData | null }[] = [];
  Object.keys(cardVisibilityByDevice).forEach(device => {
    const visibility = cardVisibilityByDevice[device];
    const deviceData = data[device];
    if (!deviceData) return;
    Object.keys(visibility).forEach(type => {
      if (visibility[type as keyof typeof visibility]) {
        visibleCards.push({ device, type, data: deviceData });
      }
    });
  });

  return (
    <div className="space-y-6 w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-800 min-h-screen p-4">
      <style>{dropdownStyles}</style>

      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold text-gray-200">Tablero de Control</h2>
        <div className="button-wrapper">
          <div className="relative">
            <button
              ref={deviceButtonRef}
              className="dropdown-button"
              onClick={handleDeviceDropdownClick}
            >
              <span>{selectedDeviceForConfig || 'Selecciona un dispositivo'}</span>
              <svg
                className={`w-4 h-4 transform ${isDeviceDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDeviceDropdownOpen && (
              <div className="dropdown-content">
                {availableDevices.length === 0 ? (
                  <div className="text-gray-400 p-2">No hay dispositivos disponibles</div>
                ) : (
                  availableDevices.map(device => (
                    <div
                      key={device}
                      className="p-2 hover:bg-gray-600 cursor-pointer text-white"
                      onClick={() => handleDeviceSelect(device)}
                    >
                      {device}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative">
            {selectedDeviceForConfig ? (
              <>
                <button
                  ref={dataButtonRef}
                  className="dropdown-button"
                  onClick={handleDataDropdownClick}
                >
                  <span>Seleccionar Datos</span>
                  <svg
                    className={`w-4 h-4 transform ${isDataDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDataDropdownOpen && (
                  <div className="dropdown-content">
                    {Object.keys(cardVisibilityByDevice[selectedDeviceForConfig] || {}).map(
                      (card) => (
                        <label
                          key={`${selectedDeviceForConfig}-${card}`}
                          className="flex items-center space-x-2 text-white"
                        >
                          <input
                            type="checkbox"
                            checked={
                              cardVisibilityByDevice[selectedDeviceForConfig]?.[
                                card as keyof typeof cardVisibilityByDevice[string]
                              ] || false
                            }
                            onChange={() =>
                              handleCardVisibilityChange(
                                selectedDeviceForConfig!,
                                card as keyof typeof cardVisibilityByDevice[string]
                              )
                            }
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span>
                            {card === 'temperature' && 'Temperatura'}
                            {card === 'humidity' && 'Humedad'}
                            {card === 'airQuality' && 'Calidad del Aire'}
                            {card === 'light' && 'Estado de la Luz'}
                            {card === 'co' && 'CO'}
                            {card === 'lpg' && 'LPG'}
                            {card === 'motion' && 'Movimiento'}
                            {card === 'smoke' && 'Humo'}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm">
                Selecciona un dispositivo para configurar los datos a mostrar.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleCards.map(({ device, type, data }, index) => {
          if (!data) return null;
          return (
            <div key={`${device}-${type}-${index}`} className="w-full">
              {type === 'temperature' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">Temperatura ({device})</h2>
                  <div className="card-content">
                    <div className="flex items-center space-x-4">
                      <div style={{ width: '60px', height: '120px' }}>
                        <TemperatureGauge temperature={data.temp || 0} />
                      </div>
                      <div className="text-xl font-bold text-gray-800">
                        {data.temp ? `${data.temp.toFixed(2)}°C` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'temp')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'temp'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'humidity' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">Humedad ({device})</h2>
                  <div className="card-content">
                    <div className="relative">
                      <HumidityGauge humidity={data.humidity || 0} />
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'humidity')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'humidity'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'airQuality' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">Calidad del Aire ({device})</h2>
                  <div className="card-content">
                    <div className="relative">
                      <AirQualityGauge airQuality={airQualityByDevice[device] || 0} />
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'airQuality')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'airQuality'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'light' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">Estado de la Luz ({device})</h2>
                  <div className="card-content">
                    <div className="flex flex-col items-center justify-center">
                      <LightIndicator isOn={data.light ?? false} />
                      <div className="text-lg font-bold text-gray-800 mt-2">
                        {data.light ? 'Encendido' : 'Apagado'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'light')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'light'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'co' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">CO ({device})</h2>
                  <div className="card-content">
                    <COGauge co={data.co} />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'co')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'co'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'lpg' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h2 className="card-title">LPG (Gas licuado de petroleo) ({device})</h2>
                  <div className="card-content">
                    <LPGGauge lpg={data.lpg} />
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'lpg')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'lpg'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'motion' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h3 className="card-title">Movimiento ({device})</h3>
                  <div className="card-content">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={data.motion ? '/assets/para-caminar.png' : '/assets/hombre.png'}
                        alt="Estado de movimiento"
                        className="w-8 h-8"
                      />
                      <div className="text-xl font-bold text-gray-800 mt-2">
                        {data.motion ? 'Sí' : 'No'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'motion')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'motion'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}

              {type === 'smoke' && (
                <div className="bg-gray-700 rounded-lg shadow-lg backdrop-blur-md card-container">
                  <h3 className="card-title">Humo ({device})</h3>
                  <div className="card-content">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16">
                        <SmokeIndicator smokeValue={data.smoke} />
                      </div>
                      <div className="text-xl font-bold text-gray-800 mt-2">
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={(e) => handleShowHistory(e, device, 'smoke')}
                      className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
                    >
                      {showHistory?.device === device && showHistory?.dataType === 'smoke'
                        ? 'Ocultar Historial'
                        : 'Ver Historial'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showHistory && (
        <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Historial de{' '}
              {showHistory.dataType === 'airQuality'
                ? 'Calidad del Aire'
                : showHistory.dataType.charAt(0).toUpperCase() + showHistory.dataType.slice(1)}{' '}
              ({showHistory.device})
            </h2>
            <div className="flex space-x-4 items-center">
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="text-indigo-400 text-sm hover:text-indigo-300 transition duration-300"
              >
                {isHistoryExpanded ? 'Contraer' : 'Expandir'}
              </button>
            </div>
          </div>
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-400">No hay datos disponibles.</div>
          ) : (
            <div className={`transition-all duration-300 w-full ${isHistoryExpanded ? 'h-96' : 'h-48'}`}>
              <Line
                data={filteredHistoryChartData(showHistory.dataType, showHistory.device)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: 'top', labels: { color: 'black' } },
                    title: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          const index = context.dataIndex;
                          const datasetIndex = context.datasetIndex;
                          const timestamp = chartLabels[index];

                          let valueStr;
                          if (showHistory.dataType === 'light') {
                            valueStr = value === 1 ? 'Encendido' : 'Apagado';
                          } else if (showHistory.dataType === 'motion') {
                            valueStr = value === 1 ? 'Sí' : 'No';
                          } else {
                            valueStr = value.toString();
                          }

                          if (datasetIndex === 1) {
                            const predEntry = (predictionsHistory[showHistory.device]?.[showHistory.dataType] || []).find(
                              (pred) =>
                                new Date(pred.timestamp).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                }) === (timestamp === 'Predicción' ? chartLabels[chartLabels.length - 2] : timestamp)
                            );
                            let actualValueStr = 'N/A';
                            if (predEntry && predEntry.actualValue !== null) {
                              actualValueStr = predEntry.actualValue.toString();
                            }
                            if (timestamp === 'Predicción') {
                              return [
                                `${label}: ${valueStr} (Predicción)`,
                                `Hora: ${chartLabels[chartLabels.length - 2]}`,
                              ];
                            }
                            return [
                              `${label}: ${valueStr} (Predicción)`,
                              `Valor Real: ${actualValueStr}`,
                              `Hora: ${timestamp}`,
                            ];
                          } else {
                            const predEntry = (predictionsHistory[showHistory.device]?.[showHistory.dataType] || []).find(
                              (pred) =>
                                new Date(pred.timestamp).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                }) === timestamp
                            );
                            let predictedValueStr = 'N/A';
                            if (predEntry) {
                              predictedValueStr = predEntry.predictedValue.toString();
                            }
                            return [
                              `${label}: ${valueStr} (Real)`,
                              ...(showHistory.dataType === 'light' || showHistory.dataType === 'motion'
                                ? []
                                : [`Predicción: ${predictedValueStr}`]),
                              `Hora: ${timestamp}`,
                            ];
                          }
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Tiempo',
                        color: 'black',
                      },
                      ticks: {
                        display: true,
                        color: 'black',
                        callback: (value, index) => {
                          return chartLabels[index] || '';
                        },
                      },
                      grid: { display: false },
                    },
                    y: {
                      title: {
                        display: true,
                        text:
                          showHistory.dataType === 'temp'
                            ? 'Temperatura (°C)'
                            : showHistory.dataType === 'humidity'
                            ? 'Humedad (%)'
                            : showHistory.dataType === 'airQuality'
                            ? 'Calidad del Aire (%)'
                            : showHistory.dataType === 'co'
                            ? 'Monóxido de Carbono (ppm)'
                            : showHistory.dataType === 'lpg'
                            ? 'Gas Licuado de Petróleo (ppm)'
                            : showHistory.dataType === 'smoke'
                            ? 'Humo (ppm)'
                            : showHistory.dataType === 'light'
                            ? 'Luz'
                            : showHistory.dataType === 'motion'
                            ? 'Movimiento'
                            : '',
                        color: 'black',
                      },
                      ticks: {
                        color: 'black',
                        maxTicksLimit: 10,
                        stepSize: axisRange.stepSize,
                        callback: (value) => {
                          if (value === null || value === undefined) return '0';
                          if (showHistory.dataType === 'temp') return Number(value).toFixed(2);
                          if (showHistory.dataType === 'humidity' || showHistory.dataType === 'airQuality')
                            return Number(value).toFixed(1);
                          if (
                            showHistory.dataType === 'co' ||
                            showHistory.dataType === 'lpg' ||
                            showHistory.dataType === 'smoke'
                          )
                            return Number(value).toFixed(6);
                          if (showHistory.dataType === 'light')
                            return value === 1 ? 'Encendido' : 'Apagado';
                          if (showHistory.dataType === 'motion') return value === 1 ? 'Sí' : 'No';
                          return value.toString();
                        },
                      },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      min: axisRange.min,
                      max: axisRange.max,
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardForm;