import { useState, useEffect } from 'react';

interface TemperatureGaugeProps {
  temperature: number;
}

const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({ temperature }) => {
  const [animatedTemp, setAnimatedTemp] = useState<number>(-10); // Comienza en el valor mínimo

  useEffect(() => {
    const clampedTemp = Math.min(30, Math.max(-10, temperature));
    setAnimatedTemp(clampedTemp);
  }, [temperature]);

  const tempRange = 40; // De -10 a 30
  const pixelsPerDegree = 100 / tempRange;
  const indicatorPosition = (animatedTemp + 10) * pixelsPerDegree;

  return (
    <div className="relative w-16 h-36 flex-shrink-0">
      <svg width="40" height="120" className="flex-shrink-0">
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Barra del termómetro */}
        <rect
          x="15"
          y="10"
          width="10"
          height="100"
          rx="5"
          fill="url(#tempGradient)"
          className="shadow-md"
        />

        {/* Indicador (Triángulo) */}
        <polygon
          points="10,0 20,0 15,10"
          fill="white"
          className="transition-all duration-1000 ease-in-out"
          style={{
            transform: `translateY(${100 - indicatorPosition}px)`,
          }}
        />

        {/* Etiquetas de la escala de temperatura */}
        <text x="30" y="10" fill="white" fontSize="8" textAnchor="start">30</text>
        <text x="30" y="35" fill="white" fontSize="8" textAnchor="start">20</text>
        <text x="30" y="60" fill="white" fontSize="8" textAnchor="start">10</text>
        <text x="30" y="85" fill="white" fontSize="8" textAnchor="start">0</text>
        <text x="30" y="110" fill="white" fontSize="8" textAnchor="start">-10</text>
      </svg>
    </div>
  );
};

export default TemperatureGauge;