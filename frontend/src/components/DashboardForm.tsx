import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { SensorData, DashboardFormProps } from '../types';
import TemperatureGauge from './TemperatureGauge';
import HumidityGauge from './HumidityGauge';
import AirQualityGauge from './AirQualityGauge';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import LightIndicator from './LightIndicator';
import COGauge from './COGauge';
import LPGGauge from './LPGGauge';
import SmokeIndicator from './SmokeIndicator';

// Estilo personalizado para el DatePicker
const datePickerStyles = `
  .react-datepicker {
    background-color: #2d3748;
    border: 1px solid #4a5568;
    border-radius: 0.5rem;
    font-family: Arial, sans-serif;
  }
  .react-datepicker__header {
    background-color: #4a5568;
    border-bottom: none;
    padding: 0.5rem;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: #ffffff;
  }
  .react-datepicker__day {
    color: #e2e8f0;
    border-radius: 0.25rem;
  }
  .react-datepicker__day:hover {
    background-color: #5a67d8;
    color: #ffffff;
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #5a67d8;
    color: #ffffff;
  }
  .react-datepicker__day--outside-month {
    color: #718096;
  }
  .react-datepicker__navigation {
    top: 0.5rem;
  }
  .react-datepicker__navigation--previous {
    border-right-color: #e2e8f0;
  }
  .react-datepicker__navigation--next {
    border-left-color: #e2e8f0;
  }
  .react-datepicker__triangle {
    display: none;
  }
`;

const DashboardForm: React.FC<DashboardFormProps> = ({
  availableDevices,
  selectedDevice,
  changeDevice,
  data,
  history,
  showHistory,
  setShowHistory,
  updateHistoryChartData,
  updateSummaryBarChartData,
  updateAirQualityChartData,
  getColor,
}) => {
  console.log('Datos recibidos en history:', history); // Depuración

  const airQuality = data
    ? Math.round(
        100 -
          ((data.co * 10000 + data.lpg * 10000 + (data.smoke ? 50 : 0)) / 100)
      )
    : 0;

  // Estados para el filtrado (aunque estarán inhabilitados)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [startHour, setStartHour] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(23);
  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);

  // Estado para controlar la visibilidad de las tarjetas
  const [cardVisibility, setCardVisibility] = useState({
    temperature: true,
    humidity: true,
    airQuality: true,
    light: true,
    co: true,
    lpg: true,
    motion: true,
    smoke: true,
  });

  // Usar el ts recibido sin modificaciones
  useEffect(() => {
    const updatedData = history.map((item: SensorData) => {
      const ts = item.ts || new Date().toISOString(); // Usar ts del backend o hora actual como respaldo
      return { ...item, ts }; // Mantener ts como string válido
    });
    setFilteredData(updatedData);
    console.log('filteredData actualizado con timestamps:', updatedData); // Depuración
  }, [history]);

  // Obtener el rango de fechas disponible en el historial
  const getAvailableDateRange = () => {
    if (filteredData.length === 0) return { minDate: undefined, maxDate: undefined };
    const dates = filteredData.map((entry) => new Date(entry.ts).getTime());
    const minTimestamp = Math.min(...dates);
    const maxTimestamp = Math.max(...dates);
    const minDate = new Date(minTimestamp);
    const maxDate = new Date(maxTimestamp);
    const result = {
      minDate: isNaN(minDate.getTime()) ? undefined : minDate,
      maxDate: isNaN(maxDate.getTime()) ? undefined : maxDate,
    };
    console.log('Rango de fechas disponible:', result); // Depuración
    return result;
  };

  const { minDate, maxDate } = getAvailableDateRange();

  // Generar opciones de horas (de 00:00 a 23:00)
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));

  // Función para aplicar el filtro (no se usará, pero la dejamos para mantener el código)
  const handleFilter = () => {
    if (!selectedDay) {
      setFilteredData(history);
      console.log('Filtro aplicado (sin día seleccionado), datos:', history);
      return;
    }

    const filtered = filteredData.filter((entry: SensorData) => {
      const entryDate = new Date(entry.ts);
      const entryHour = entryDate.getHours();

      // Filtrar por día exacto
      const isSameDay =
        entryDate.getFullYear() === selectedDay.getFullYear() &&
        entryDate.getMonth() === selectedDay.getMonth() &&
        entryDate.getDate() === selectedDay.getDate();

      // Filtrar por rango de horas
      const isWithinHourRange = entryHour >= startHour && entryHour <= endHour;

      return isSameDay && isWithinHourRange;
    });

    setFilteredData(filtered);
    console.log('Filtro aplicado, datos filtrados:', filtered);
  };

  const filteredHistoryChartData = (dataKey: string) => {
    if (filteredData.length === 0) return { labels: [], datasets: [] };

    const sampledData = filteredData; // Mostramos todos los datos, sin muestreo

    // Generar etiquetas para el eje X como índices vacíos (sin texto)
    const labels = sampledData.map((_, index) => ''); // Etiquetas vacías

    let chartData;

    if (dataKey === 'airQuality') {
      chartData = {
        labels,
        datasets: [
          {
            label: 'Calidad del Aire (%)',
            data: sampledData.map((item: SensorData) =>
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
            label: `${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)} (${
              dataKey === 'temp'
                ? '°C'
                : dataKey === 'humidity'
                ? '%'
                : dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke'
                ? 'ppm'
                : ''
            })`,
            data: sampledData.map((item: SensorData) => {
              const value = item[dataKey as keyof SensorData];
              if (typeof value !== 'number') return 0; // Valor por defecto si no es número
              if (dataKey === 'temp') {
                return Number(value.toFixed(2)); // 2 decimales para temperatura
              } else if (dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke') {
                return Number(value.toFixed(6)); // 6 decimales para ppm
              } else if (dataKey === 'humidity') {
                return Number(value.toFixed(1)); // 1 decimal para humedad
              } else if (dataKey === 'light') {
                return value ? 1 : 0; // Convertir a 0/1 para el gráfico
              } else if (dataKey === 'motion') {
                return value ? 1 : 0; // Convertir a 0/1 para el gráfico
              }
              return value; // Valor por defecto
            }),
            borderColor: getColor(dataKey),
            backgroundColor: getColor(dataKey, 0.2),
            tension: 0.3,
            fill: false,
          },
        ],
      };
    }

    console.log('Datos del gráfico:', chartData); // Depuración
    return chartData;
  };

  const getDynamicAxisRange = (dataKey: string) => {
    if (filteredData.length === 0) return { min: 0, max: 100, stepSize: 10 };

    let values: number[] = [];
    if (dataKey === 'airQuality') {
      values = filteredData.map((item: SensorData) =>
        Math.min(
          100,
          Math.max(
            0,
            100 - ((item.co * 10000 + item.lpg * 10000 + (item.smoke ? 50 : 0)) / 100)
          )
        )
      );
    } else {
      values = filteredData
        .map((item: SensorData) => {
          const value = item[dataKey as keyof SensorData];
          if (typeof value !== 'number') return 0; // Valor por defecto si no es número
          if (dataKey === 'temp') {
            return Number(value.toFixed(2)); // 2 decimales para temperatura
          } else if (dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke') {
            return Number(value.toFixed(6)); // 6 decimales para ppm
          } else if (dataKey === 'humidity') {
            return Number(value.toFixed(1)); // 1 decimal para humedad
          } else if (dataKey === 'light' || dataKey === 'motion') {
            return value ? 1 : 0; // Convertir booleanos a 0/1
          }
          return value as number;
        })
        .filter((value): value is number => typeof value === 'number');
    }

    if (values.length === 0) return { min: 0, max: 100, stepSize: 10 };

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    // Ajustar el rango para que sea más amplio y muestre más valores
    let padding = range * 0.2 || 1; // Padding mayor (20%) para incluir más etiquetas
    let adjustedMin = Math.max(minValue - padding, 0);
    let adjustedMax = maxValue + padding;

    // Definir un stepSize pequeño para mostrar más etiquetas
    let stepSize: number;
    if (dataKey === 'temp') {
      stepSize = 0.1; // Intervalo de 0.1 para temperatura (ejemplo: 20.00, 20.10, 20.20)
      adjustedMin = Number((Math.floor(adjustedMin / 0.1) * 0.1).toFixed(2));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.1) * 0.1).toFixed(2));
    } else if (dataKey === 'humidity' || dataKey === 'airQuality') {
      stepSize = 0.1; // Intervalo de 0.1 para humedad y calidad del aire (ejemplo: 75.0, 75.1, 75.2)
      adjustedMin = Number((Math.floor(adjustedMin / 0.1) * 0.1).toFixed(1));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.1) * 0.1).toFixed(1));
    } else if (dataKey === 'co' || dataKey === 'lpg' || dataKey === 'smoke') {
      stepSize = 0.00001; // Intervalo pequeño para ppm (ejemplo: 0.123450, 0.123460)
      adjustedMin = Number((Math.floor(adjustedMin / 0.00001) * 0.00001).toFixed(6));
      adjustedMax = Number((Math.ceil(adjustedMax / 0.00001) * 0.00001).toFixed(6));
    } else if (dataKey === 'light' || dataKey === 'motion') {
      stepSize = 1; // Solo 0 y 1 para luz y movimiento
      adjustedMin = 0;
      adjustedMax = 1;
    } else {
      stepSize = (adjustedMax - adjustedMin) / 10; // Valor por defecto, 10 etiquetas
    }

    return {
      min: adjustedMin,
      max: adjustedMax,
      stepSize,
    };
  };

  // Función para manejar el cambio de visibilidad de las tarjetas
  const handleCardVisibilityChange = (card: keyof typeof cardVisibility) => {
    setCardVisibility((prev) => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  const axisRange = showHistory ? getDynamicAxisRange(showHistory) : { min: 0, max: 100, stepSize: 10 };

  return (
    <div className="space-y-6 w-full bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-800 min-h-screen p-4">
      <style>{datePickerStyles}</style>

      <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
        <div className="flex items-start space-x-8">
          {/* Selector de Dispositivos */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-2">Cambiar Ubicación</h2>
            <select
              value={selectedDevice || ''}
              onChange={(e) => changeDevice(e.target.value)}
              className="w-full max-w-xs p-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Selecciona un dispositivo
              </option>
              {availableDevices.map((dev) => (
                <option key={dev} value={dev}>
                  {dev}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Checkboxes */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Mostrar Datos:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(cardVisibility).map((card) => (
                <label key={card} className="flex items-center space-x-2 text-white">
                  <input
                    type="checkbox"
                    checked={cardVisibility[card as keyof typeof cardVisibility]}
                    onChange={() => handleCardVisibilityChange(card as keyof typeof cardVisibility)}
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
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperatura */}
        {cardVisibility.temperature && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-1">Temperatura</h2>
            <div className="flex items-center space-x-4">
              <div style={{ width: '60px', height: '120px' }}>
                <TemperatureGauge temperature={data?.temp || 0} />
              </div>
              <div className="text-xl font-bold text-white">
                {data?.temp ? `${data.temp.toFixed(2)}°C` : 'N/A'}
              </div>
            </div>
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'temp' ? null : 'temp')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'temp' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* Humedad */}
        {cardVisibility.humidity && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px] relative">
            <h2 className="text-sm font-semibold text-white mb-2">Humedad</h2>
            <div className="relative">
              <HumidityGauge humidity={data?.humidity || 0} />
            </div>
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'humidity' ? null : 'humidity')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'humidity' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* Calidad del Aire */}
        {cardVisibility.airQuality && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px] relative">
            <h2 className="text-sm font-semibold text-white mb-2">Calidad del Aire</h2>
            <div className="relative">
              <AirQualityGauge airQuality={airQuality} />
            </div>
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'airQuality' ? null : 'airQuality')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'airQuality' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* Estado de la Luz */}
        {cardVisibility.light && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px] relative">
            <h2 className="text-sm font-semibold text-white mb-2 text-center">Estado de la Luz</h2>
            <div className="flex flex-col items-center justify-center">
              <LightIndicator isOn={data?.light ?? false} />
              <div className="text-lg font-bold text-white mt-2">
                {data?.light ? 'Encendido' : 'Apagado'}
              </div>
            </div>
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'light' ? null : 'light')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'light' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* CO */}
        {cardVisibility.co && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-2">CO</h2>
            <COGauge co={data?.co} /> {/* maxValue por defecto es 0.01 */}
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'co' ? null : 'co')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'co' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* LPG */}
        {cardVisibility.lpg && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px]">
            <h2 className="text-sm font-semibold text-white mb-2">LPG (Gas liquado de petroleo)</h2>
            <LPGGauge lpg={data?.lpg} /> {/* maxValue por defecto es 0.01 */}
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === 'lpg' ? null : 'lpg')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'lpg' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}

        {/* Movimiento */}
        {cardVisibility.motion && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px]">
            <h3 className="text-sm font-semibold text-white mb-2">Movimiento</h3>
            <div className="flex flex-col items-center justify-center">
              {/* Imagen dinámica según estado de `motion` */}
              <img
                src={data?.motion ? "/assets/para-caminar.png" : "/assets/hombre.png"}
                alt="Estado de movimiento"
                className="w-8 h-8" // Reducido de w-16 h-16 a w-12 h-12 (48x48px)
              />
              <div className="text-xl font-bold text-white mt-2">{data?.motion ? "Sí" : "No"}</div>
            </div>
            <div className="text-center mt-1">
              <button
                onClick={() => setShowHistory(showHistory === "motion" ? null : "motion")}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === "motion" ? "Ocultar Historial" : "Ver Historial"}
              </button>
            </div>
          </div>
        )}

        {/* Humo */}
        {cardVisibility.smoke && (
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md flex flex-col items-center justify-between min-h-[200px]">
            <h3 className="text-sm font-semibold text-white mb-2">Humo</h3>
            <div className="flex flex-col items-center justify-center">
              {/* Indicador de humo como elemento visual */}
              <div className="w-16 h-16">
                <SmokeIndicator smokeValue={data?.smoke} />
              </div>
            </div>
            <div className="text-center mt-1">
              <div className="text-xl font-bold text-white mt-2">
                {data?.smoke !== undefined && data?.smoke !== null ? data.smoke.toFixed(6) : 'N/A'} PPM
              </div>
              <button
                onClick={() => setShowHistory(showHistory === 'smoke' ? null : 'smoke')}
                className="text-indigo-400 text-xs hover:text-indigo-300 transition duration-300"
              >
                {showHistory === 'smoke' ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Historial */}
      {showHistory && (
        <div className="bg-gray-700 p-4 rounded-lg shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Historial de {showHistory === 'airQuality' ? 'Calidad del Aire' : showHistory.charAt(0).toUpperCase() + showHistory.slice(1)}
            </h2>
            <div className="flex space-x-4 items-center">
              <div className="flex space-x-2 items-center">
                <div>
                  <DatePicker
                    selected={selectedDay}
                    onChange={(date: Date | null) => setSelectedDay(date)}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText="Selecciona un día"
                    className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    dateFormat="dd/MM/yyyy"
                    disabled // Inhabilitado
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled // Inhabilitado
                  >
                    {hourOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-white">-</span>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="p-2 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled // Inhabilitado
                  >
                    {hourOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 opacity-50 cursor-not-allowed"
                  disabled // Inhabilitado
                >
                  Filtrar
                </button>
              </div>
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="text-indigo-400 text-sm hover:text-indigo-300 transition duration-300"
              >
                {isHistoryExpanded ? 'Contraer' : 'Expandir'}
              </button>
            </div>
          </div>
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-400">
              No hay datos disponibles.
            </div>
          ) : (
            <div className={`transition-all duration-300 ${isHistoryExpanded ? 'h-96' : 'h-48'}`}>
              <Line
                data={filteredHistoryChartData(showHistory)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: true, position: 'top', labels: { color: 'white' } },
                    title: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          const index = context.dataIndex;
                          const timestamp = new Date(filteredData[index].ts).toLocaleTimeString('en-US', {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          }); // Mostrar solo HH:mm:ss sin ajustar zona horaria
                          let valueStr;
                          if (showHistory === 'light') {
                            valueStr = value === 1 ? 'Encendido' : 'Apagado';
                          } else if (showHistory === 'motion') {
                            valueStr = value === 1 ? 'Sí' : 'No';
                          } else {
                            valueStr = value.toString();
                          }
                          return `${label}: ${valueStr} (Hora: ${timestamp})`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Tiempo', // Título "Tiempo"
                        color: 'white',
                      },
                      ticks: {
                        display: false, // Ocultar todas las etiquetas del eje X
                        color: 'white',
                      },
                      grid: { display: false },
                    },
                    y: {
                      title: {
                        display: true,
                        text:
                          showHistory === 'temp'
                            ? 'Temperatura (°C)'
                            : showHistory === 'humidity'
                            ? 'Humedad (%)'
                            : showHistory === 'airQuality'
                            ? 'Calidad del Aire (%)'
                            : showHistory === 'co'
                            ? 'Monóxido de Carbono (ppm)'
                            : showHistory === 'lpg'
                            ? 'Gas Licuado de Petróleo (ppm)'
                            : showHistory === 'smoke'
                            ? 'Humo (ppm)'
                            : showHistory === 'light'
                            ? 'Luz'
                            : showHistory === 'motion'
                            ? 'Movimiento'
                            : '',
                        color: 'white',
                      },
                      ticks: {
                        color: 'white',
                        maxTicksLimit: 10, // Permitir hasta 10 etiquetas para más detalle
                        stepSize: axisRange.stepSize, // Usar el stepSize calculado dinámicamente
                        callback: (value) => {
                          if (value === null || value === undefined) return '0';
                          if (showHistory === 'temp') return Number(value).toFixed(2); // 2 decimales para temperatura
                          if (showHistory === 'humidity' || showHistory === 'airQuality')
                            return Number(value).toFixed(1); // 1 decimal para humedad y calidad del aire
                          if (showHistory === 'co' || showHistory === 'lpg' || showHistory === 'smoke')
                            return Number(value).toFixed(6); // 6 decimales para ppm
                          if (showHistory === 'light') return value === 1 ? 'Encendido' : 'Apagado'; // Etiquetas específicas
                          if (showHistory === 'motion') return value === 1 ? 'Sí' : 'No'; // Etiquetas específicas
                          return value.toString(); // Valor por defecto
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