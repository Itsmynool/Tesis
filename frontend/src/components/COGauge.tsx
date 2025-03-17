import React, { useRef } from 'react';

interface COGaugeProps {
  co: number | null | undefined;
  maxValue?: number;
}

const COGauge: React.FC<COGaugeProps> = ({ co, maxValue = 0.01 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clampedCO = co !== null && co !== undefined ? Math.min(maxValue, Math.max(0, co)) : 0;
  const smokeCircles = Array.from({ length: 10 }, (_, index) => index);

  // Calcular la duración de la animación basada en el valor de CO
  const animationDuration = 6 - (clampedCO / maxValue) * 4; // Rango de 6s (bajo CO) a 2s (alto CO)

  return (
    <>
      <style>{`
        .smoke-container {
          position: relative;
          width: 180px;
          height: 180px;
          overflow: hidden;
        }

        .smoke-circle {
          list-style: none;
          position: absolute;
          top: 100%;
          left: 50%;
          width: 48px;
          height: 48px;
          background: #666;
          border-radius: 50%;
          animation: animateSmoke ${animationDuration}s infinite linear;
          animation-delay: calc(var(--delay) * 0.3s);
          transform: translateX(-50%);
        }

        @keyframes animateSmoke {
          0% {
            transform: translateX(-50%) translateY(0) scale(0.5);
            opacity: 0.8;
            filter: blur(0px);
          }
          25% {
            transform: translateX(calc(-50% + var(--x-shift, 0%))) translateY(-50px) scale(0.8);
            opacity: 0.6;
            filter: blur(2px);
          }
          50% {
            transform: translateX(calc(-50% + var(--x-shift, 0%) * 1.2)) translateY(-100px) scale(1.0);
            opacity: 0.4;
            filter: blur(5px);
          }
          75% {
            transform: translateX(calc(-50% + var(--x-shift, 0%) * 1.5)) translateY(-150px) scale(1.2);
            opacity: 0.2;
            filter: blur(8px);
          }
          100% {
            transform: translateX(calc(-50% + var(--x-shift, 0%) * 1.8)) translateY(-180px) scale(1.5);
            opacity: 0;
            filter: blur(10px);
          }
        }
      `}</style>

      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden" ref={containerRef}>
        <div className="smoke-container">
          <ul>
            {smokeCircles.map((index) => (
              <li
                key={index}
                className="smoke-circle"
                style={{
                  '--delay': index,
                  '--x-shift': index % 2 === 0 ? '20%' : '-20%', // Simétrico para centrar
                } as React.CSSProperties}
              />
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div>
            <div className="text-lg font-bold text-white">
              {clampedCO.toFixed(6)} PPM
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default COGauge;