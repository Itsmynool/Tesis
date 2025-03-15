import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AirQualityGaugeProps {
  airQuality: number;
}

const AirQualityGauge: React.FC<AirQualityGaugeProps> = ({ airQuality }) => {
  const [chartData, setChartData] = useState<any>({
    datasets: [],
  });

  useEffect(() => {
    const clampedAirQuality = Math.min(100, Math.max(0, airQuality));

    const data = {
      datasets: [
        {
          data: [clampedAirQuality, 100 - clampedAirQuality],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.2)'],
          borderWidth: 0,
          circumference: 180,
          rotation: -90,
        },
      ],
      labels: ['Calidad del Aire', 'Resto'],
    };

    setChartData(data);
  }, [airQuality]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    animation: {
      duration: 0,
    },
  };

  return (
    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
      <div className="w-full h-full">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        <div>
          <div className="text-lg font-bold text-white">{airQuality.toFixed(0)}%</div>
          <div className="text-xs text-gray-400">Índice</div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityGauge;