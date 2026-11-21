import React, { useRef, useEffect, useState } from 'react';
import type { SpermData } from '../types';
import { Rotate3d, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '../utils';

interface Sperm3DPathProps {
  sperm: SpermData;
  highContrast?: boolean;
  theme?: 'light' | 'dark';
}

export const Sperm3DPath: React.FC<Sperm3DPathProps> = ({ sperm, highContrast, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(4);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const isDark = theme === 'dark';

  // Generate simulated Z-axis if not present
  const path3D = sperm.path.map((p, i) => ({
    ...p,
    z: p.z ?? Math.sin(i * 0.5) * 10 // Simulated helical movement
  }));

  // Calculate centroid for centering the view
  const centroid = path3D.length > 0 ? {
    x: path3D.reduce((sum, p) => sum + p.x, 0) / path3D.length,
    y: path3D.reduce((sum, p) => sum + p.y, 0) / path3D.length,
    z: path3D.reduce((sum, p) => sum + p.z, 0) / path3D.length
  } : { x: 0, y: 0, z: 0 };

  const project = (x: number, y: number, z: number) => {
    // Basic 3D to 2D projection
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    // Center coordinates relative to centroid
    const cx = x - centroid.x;
    const cy = y - centroid.y;
    const cz = z - centroid.z;

    // Rotate around Y
    let x1 = cx * cosY - cz * sinY;
    let z1 = cx * sinY + cz * cosY;

    // Rotate around X
    let y1 = cy * cosX - z1 * sinX;
    let z2 = cy * sinX + z1 * cosX;

    const scale = zoom * 10; // Increased scale for better visibility
    return {
      x: x1 * scale + 150,
      y: y1 * scale + 150,
      z: z2
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid floor
      ctx.strokeStyle = highContrast 
        ? (isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(180, 83, 9, 0.1)')
        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)');
      ctx.lineWidth = 1;
      const gridSize = 100;
      const step = 20;
      for (let i = -gridSize; i <= gridSize; i += step) {
        ctx.beginPath();
        const p1 = project(centroid.x + i, centroid.y + 50, centroid.z - gridSize);
        const p2 = project(centroid.x + i, centroid.y + 50, centroid.z + gridSize);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.beginPath();
        const p3 = project(centroid.x - gridSize, centroid.y + 50, centroid.z + i);
        const p4 = project(centroid.x + gridSize, centroid.y + 50, centroid.z + i);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.stroke();
      }

      // Draw path
      if (path3D.length > 1) {
        ctx.beginPath();
        const start = project(path3D[0].x, path3D[0].y, path3D[0].z);
        ctx.moveTo(start.x, start.y);
        
        for (let i = 1; i < path3D.length; i++) {
          const p = project(path3D[i].x, path3D[i].y, path3D[i].z);
          const alpha = Math.max(0.2, (p.z + 100) / 200);
          const color = highContrast 
            ? (isDark ? `rgba(251, 191, 36, ${alpha})` : `rgba(180, 83, 9, ${alpha})`)
            : (isDark ? `rgba(16, 185, 129, ${alpha})` : `rgba(5, 150, 105, ${alpha})`);
          ctx.strokeStyle = color;
          ctx.lineWidth = highContrast ? 2 : 1;
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Draw head
      if (path3D.length > 0) {
        const last = path3D[path3D.length - 1];
        const head = project(last.x, last.y, last.z);
        ctx.fillStyle = isDark ? '#fff' : '#000';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = highContrast ? (isDark ? '#fbbf24' : '#b45309') : (isDark ? '#10b981' : '#059669');
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    render();
  }, [rotation, zoom, path3D, centroid, isDark, highContrast]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setRotation(prev => ({
      x: prev.x + dy * 0.01,
      y: prev.y + dx * 0.01
    }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className={cn(
      "relative w-full aspect-square rounded-2xl border overflow-hidden mb-6 shadow-2xl cursor-move transition-colors",
      isDark ? "bg-black border-white/10" : "bg-white border-black/10"
    )}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className={cn(
        "absolute top-3 left-3 flex items-center gap-2 px-2 py-1 backdrop-blur-md rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-colors",
        isDark ? "bg-black/60 border-white/10 text-white/80" : "bg-white/60 border-black/10 text-black/80"
      )}>
        <Rotate3d className="w-3 h-3 text-emerald-500" />
        Interactive 3D Reconstruction
      </div>
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(z => Math.min(10, z + 0.5))} 
          className={cn("p-1.5 rounded-lg transition-colors", isDark ? "bg-white/10 hover:bg-white/20 text-white/80" : "bg-black/10 hover:bg-black/20 text-black/80")}
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(1, z - 0.5))} 
          className={cn("p-1.5 rounded-lg transition-colors", isDark ? "bg-white/10 hover:bg-white/20 text-white/80" : "bg-black/10 hover:bg-black/20 text-black/80")}
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <button 
          onClick={() => { setRotation({ x: 0.5, y: 0.5 }); setZoom(4); }} 
          className={cn("p-1.5 rounded-lg transition-colors", isDark ? "bg-white/10 hover:bg-white/20 text-white/80" : "bg-black/10 hover:bg-black/20 text-black/80")}
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
