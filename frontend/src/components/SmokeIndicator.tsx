import React, { useEffect, useRef } from 'react';

interface SmokeIndicatorProps {
  smokeValue: number | null | undefined; // Valor de humo
}

const SmokeIndicator: React.FC<SmokeIndicatorProps> = ({ smokeValue }) => {
  const nubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nubeRef.current && smokeValue !== null && smokeValue !== undefined) {
      // Ajustar color según el valor de humo (0 a 1, normalizado)
      const normalizedSmoke = Math.min(1, Math.max(0, smokeValue)); // Normalizar entre 0 y 1
      const grayValue = 204 - Math.round(normalizedSmoke * 128); // Gris de #ccc (204) a #666 (128)
      const grayColor = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;

      // Ajustar duración de la animación (5s base, ajustada por humo)
      const baseDuration = 5; // Segundos base
      const speedFactor = 1 + (normalizedSmoke * 2); // Más humo = más rápido (mínimo 1s, máximo 3s)
      const animationDuration = `${baseDuration / speedFactor}s`;

      const nubeDivs = nubeRef.current.querySelectorAll('.nube div');
      nubeDivs.forEach((div) => {
        const htmlDiv = div as HTMLElement; // Type assertion
        htmlDiv.style.backgroundColor = grayColor;
        htmlDiv.style.animationDuration = animationDuration;
        htmlDiv.style.webkitAnimationDuration = animationDuration;
      });
    }
  }, [smokeValue]);

  return (
    <>
      <style>
        {`
          #cielito {
            position: relative;
            width: 100%;
            height: 100%;
            top: 0%;
            left: 0%;
            z-index: 0; /* Reducir z-index para que no tape el texto debajo */
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: transparent;
            overflow: visible; /* Asegurar que no haya desbordamiento */
          }

          .nube {
            position: absolute;
            transform: scale(0.5); /* Nube pequeña */
            -webkit-transform: scale(0.5);
            z-index: 0; /* Asegurar que la nube no tape el texto */
          }

          .nube div {
            width: 200px;
            height: 200px;
            border-radius: 100px;
            position: absolute;
            background-color: #ccc; /* Gris inicial, se ajustará dinámicamente */
          }

          .nube div:nth-of-type(1) {
            animation: poof 5s ease-in-out -1s infinite alternate none;
            -webkit-animation: poof 5s ease-in-out -1s infinite alternate none;
            margin-top: -100px;
            margin-left: -100px;
          }

          .nube div:nth-of-type(2) {
            animation: poof 5s ease-in-out -2s infinite alternate none;
            -webkit-animation: poof 5s ease-in-out -2s infinite alternate none;
            margin-top: -90px;
            margin-left: -240px;
          }

          .nube div:nth-of-type(3) {
            animation: poof 5s ease-in-out -3s infinite alternate none;
            -webkit-animation: poof 5s ease-in-out -3s infinite alternate none;
            margin-top: -150px;
            margin-left: -180px;
          }

          .nube div:nth-of-type(4) {
            animation: poof 5s ease-in-out -4s infinite alternate none;
            -webkit-animation: poof 5s ease-in-out -4s infinite alternate none;
            margin-top: -170px;
            margin-left: -60px;
          }

          .nube div:nth-of-type(5) {
            animation: poof 5s ease-in-out -5s infinite alternate none;
            -webkit-animation: poof 5s ease-in-out -5s infinite alternate none;
            margin-top: -90px;
            margin-left: -20px;
          }

          @keyframes poof {
            100% {
              transform: translate(-4px, -2px);
              -webkit-transform: translate(-4px, -2px);
            }
            93% {
              transform: translate(10px, 4px);
              -webkit-transform: translate(10px, 4px);
            }
            82% {
              transform: translate(-6px, -3px);
              -webkit-transform: translate(-6px, -3px);
            }
            74% {
              transform: translate(10px, 8px);
              -webkit-transform: translate(10px, 8px);
            }
            61% {
              transform: translate(-8px, -2px);
              -webkit-transform: translate(-8px, -2px);
            }
            48% {
              transform: translate(10px, -4px);
              -webkit-transform: translate(10px, -4px);
            }
            36% {
              transform: translate(-6px, 4px);
              -webkit-transform: translate(-6px, 4px);
            }
            25% {
              transform: translate(10px, 0px);
              -webkit-transform: translate(10px, 0px);
            }
            15% {
              transform: translate(-5px, -3px);
              -webkit-transform: translate(-5px, -3px);
            }
            8% {
              transform: translate(10px, 2px);
              -webkit-transform: translate(10px, 2px);
            }
            0% {
              transform: translate(-10px, 4px);
              -webkit-transform: translate(-10px, 4px);
            }
          }
        `}
      </style>
      <div id="cielito" className="w-16 h-16 relative">
        <div className="nube" ref={nubeRef}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </>
  );
};

export default SmokeIndicator;