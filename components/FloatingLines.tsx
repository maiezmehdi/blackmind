
import React, { useRef, useEffect } from 'react';

interface FloatingLinesProps {
  linesGradient?: string[];
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
}

const FloatingLines: React.FC<FloatingLinesProps> = ({
  linesGradient = ["#E945F5", "#2F4BC0", "#E945F5"],
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width: number;
    let height: number;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const linesCount = 12;
    const pointsCount = 20;
    let time = 0;

    const render = () => {
      time += 0.005 * animationSpeed;
      
      // Interpolate mouse
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * mouseDamping;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * mouseDamping;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < linesCount; i++) {
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        linesGradient.forEach((color, index) => {
          gradient.addColorStop(index / (linesGradient.length - 1), color);
        });

        // Soft glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = linesGradient[1] || linesGradient[0];
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.4 - (i / linesCount) * 0.3;

        for (let j = 0; j < pointsCount; j++) {
          const x = (j / (pointsCount - 1)) * width;
          let y = (height / 2) + Math.sin(time + (i * 0.5) + (j * 0.3)) * 100;
          
          // Apply mouse interaction (bending)
          if (interactive) {
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = Math.exp(-dist / (bendRadius * 40));
            y += dy * influence * bendStrength;
          }

          // Apply parallax
          if (parallax) {
            const parallaxX = (mouseRef.current.x / width - 0.5) * parallaxStrength * 100 * (i / linesCount);
            const parallaxY = (mouseRef.current.y / height - 0.5) * parallaxStrength * 100 * (i / linesCount);
            if (j === 0) ctx.moveTo(x + parallaxX, y + parallaxY);
            else ctx.lineTo(x + parallaxX, y + parallaxY);
          } else {
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [linesGradient, animationSpeed, interactive, bendRadius, bendStrength, mouseDamping, parallax, parallaxStrength]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  );
};

export default FloatingLines;
