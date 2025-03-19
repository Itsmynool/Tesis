import React, { useEffect, useRef } from 'react';

interface LPGGaugeProps {
  lpg: number | null | undefined; // Valor de LPG en ppm
  maxValue?: number; // Valor máximo para la escala (por defecto 0.01)
}

const LPGGauge: React.FC<LPGGaugeProps> = ({ lpg, maxValue = 0.01 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuración del canvas
    canvas.width = 180; // Ajustado para coincidir con el diseño de CO
    canvas.height = 180; // Ajustado para coincidir con el diseño de CO

    // Valor de LPG clampeado
    const clampedLPG = lpg !== null && lpg !== undefined ? Math.min(maxValue, Math.max(0, lpg)) : 0;

    // Configuración de partículas según LPG
    const minParticles = 10; // Mínimo de partículas con LPG = 0
    const maxParticles = 100; // Máximo de partículas con LPG = maxValue
    const particleCount = Math.floor(minParticles + (clampedLPG / maxValue) * (maxParticles - minParticles)); // Escala lineal
    const particleSize = 5;
    const maxSpeed = 0.2 + (clampedLPG / maxValue) * 0.3; // Velocidad ajustada según LPG

    // Generar color según LPG (de azul a rojo)
    const getParticleColor = (lpgValue: number) => {
      const red = Math.min(255, Math.floor(lpgValue * 50000));
      const blue = 255 - red;
      return `rgb(${red}, 100, ${blue})`;
    };

    // Crear partículas distribuidas uniformemente
    let particles: { x: number; y: number; vx: number; vy: number; color: string }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const cols = Math.ceil(Math.sqrt(particleCount));
      const rows = Math.ceil(particleCount / cols);
      const spacingX = canvas.width / cols;
      const spacingY = canvas.height / rows;

      const col = i % cols;
      const row = Math.floor(i / cols);

      particles.push({
        x: col * spacingX + (Math.random() * 10 - 5),
        y: row * spacingY + (Math.random() * 10 - 5),
        vx: (Math.random() - 0.5) * maxSpeed,
        vy: (Math.random() - 0.5) * maxSpeed,
        color: getParticleColor(clampedLPG),
      });
    }

    // Animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fill();

        // Movimiento
        p.x += p.vx;
        p.y += p.vy;

        // Rebote en los bordes
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Limpieza al desmontar el componente
    return () => {
      // No hay necesidad de cancelar requestAnimationFrame explícitamente aquí,
      // ya que el componente se desmontará y el canvas se liberará
    };
  }, [lpg, maxValue]);

  return (
    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        <div>
          <div className="text-lg font-bold text-white">
            {lpg !== null && lpg !== undefined ? lpg.toFixed(6) : 'N/A'} PPM
          </div>
        </div>
      </div>
    </div>
  );
};

export default LPGGauge;