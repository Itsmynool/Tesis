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
  const pixelsPerDegree = 100 / tempRange; // 100px para 40 grados = 2.5px por grado
  const indicatorPosition = (animatedTemp + 10) * pixelsPerDegree; // De 0 a 100px

  // Ajustar la posición del indicador para que se mueva entre y=10 (30°C) y y=110 (-10°C)
  const adjustedPosition = 10 + (100 - indicatorPosition); // Mapea indicatorPosition al rango del termómetro

  return (
    <div className="relative w-16 h-36 flex-shrink-0">
      <svg width="60" height="120" className="flex-shrink-0"> {/* Aumentado width a 60 para más espacio */}
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#facc15', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Barra del termómetro (aumentada a width="20") */}
        <rect
          x="10" /* Ajustado para centrar: (60 - 20) / 2 = 10 */
          y="0"
          width="20" /* Grosor aumentado a 20 */
          height="115"
          rx="5"
          fill="url(#tempGradient)"
          className="shadow-md"
        />

        {/* Indicador (Barra más ancha y más visible) */}
        <rect
          x="5" /* Centrado respecto a la barra: (60 - 30) / 2 = 15, pero ajustado a 5 para que sobresalga */
          width="30" /* Más ancha para mejor visibilidad */
          height="3" /* Alto de la barrita */
          fill="black"
          className="transition-all duration-1000 ease-in-out"
          style={{
            transform: `translateY(${adjustedPosition}px)`, // Mueve la barra entre y=10 y y=110
          }}
        />

        {/* Etiquetas de la escala de temperatura (ajustadas para no solaparse) */}
        <text x="40" y="10" fill="black" fontSize="8" textAnchor="start">30</text>
        <text x="40" y="35" fill="black" fontSize="8" textAnchor="start">20</text>
        <text x="40" y="60" fill="black" fontSize="8" textAnchor="start">10</text>
        <text x="40" y="85" fill="black" fontSize="8" textAnchor="start">0</text>
        <text x="40" y="110" fill="black" fontSize="8" textAnchor="start">-10</text>
      </svg>
    </div>
  );
};

export default TemperatureGauge;