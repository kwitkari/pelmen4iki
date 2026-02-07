import React, { useRef, useEffect, useState } from 'react';
import { Point, Circle, AppMode } from '../types';

interface DoughCanvasProps {
  points: Point[];
  circles: Circle[];
  mode: AppMode;
  onAddPoint: (p: Point) => void;
  onClosePolygon: () => void;
  circleRadius: number; // For visualizing the cursor size
}

const DoughCanvas: React.FC<DoughCanvasProps> = ({ 
  points, 
  circles, 
  mode, 
  onAddPoint, 
  onClosePolygon,
  circleRadius
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = () => {
    if (mode !== AppMode.DRAWING || !cursorPos) return;

    // Check if clicking near start point to close
    if (points.length > 2) {
      const start = points[0];
      const dist = Math.sqrt(Math.pow(cursorPos.x - start.x, 2) + Math.pow(cursorPos.y - start.y, 2));
      if (dist < 20) {
        onClosePolygon();
        return;
      }
    }
    onAddPoint(cursorPos);
  };

  // Helper to generate SVG path string
  const getPathString = (pts: Point[]) => {
    if (pts.length === 0) return '';
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return mode === AppMode.DRAWING ? d : `${d} Z`;
  };

  return (
    <div className="relative w-full h-full bg-stone-200 overflow-hidden shadow-inner rounded-xl border border-stone-300">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <svg
        ref={svgRef}
        className={`w-full h-full ${mode === AppMode.DRAWING ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Dough Shape */}
        {points.length > 0 && (
          <path
            d={getPathString(points)}
            fill={mode === AppMode.DRAWING ? 'none' : '#F5E6D3'} // Dough color
            stroke="#A8A29E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 ease-in-out"
          />
        )}

        {/* Closing Hint (Line back to start) */}
        {mode === AppMode.DRAWING && points.length > 0 && cursorPos && (
           <line 
             x1={points[points.length - 1].x} 
             y1={points[points.length - 1].y} 
             x2={cursorPos.x} 
             y2={cursorPos.y} 
             stroke="#A8A29E" 
             strokeWidth="2" 
             strokeDasharray="5,5" 
             className="opacity-50"
           />
        )}

        {/* Start Point Indicator for Closing */}
        {mode === AppMode.DRAWING && points.length > 2 && (
          <circle 
            cx={points[0].x} 
            cy={points[0].y} 
            r={10} 
            fill="transparent" 
            stroke="#10B981" 
            strokeWidth="2"
            className="animate-pulse"
          />
        )}

        {/* Pelmeni Circles */}
        {circles.map((c) => (
          <g key={c.id} className="animate-[popIn_0.3s_ease-out_forwards]">
            <circle
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill="#FFFFFF"
              stroke="#E7E5E4"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            <circle
               cx={c.x}
               cy={c.y}
               r={c.r * 0.4}
               fill="#FEE2E2" // Meat filling hint
               opacity="0.5"
            />
          </g>
        ))}

        {/* Drawing Cursor */}
        {mode === AppMode.DRAWING && cursorPos && (
          <circle
            cx={cursorPos.x}
            cy={cursorPos.y}
            r={4}
            fill="#EF4444"
          />
        )}
      </svg>
      
      {/* Instructions Overlay */}
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl text-center max-w-md">
            <h3 className="text-xl font-bold text-stone-800 mb-2">Create Your Dough</h3>
            <p className="text-stone-600">Click anywhere on the mat to place corners. <br/> Close the loop by clicking the starting point to finish.</p>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; transform-origin: center; }
          100% { transform: scale(1); opacity: 1; transform-origin: center; }
        }
      `}</style>
    </div>
  );
};

export default DoughCanvas;
