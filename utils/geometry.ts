import { Point, Circle } from '../types';

// Check if a point is inside a polygon using Ray Casting algorithm
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate the shortest distance from a point to any edge of the polygon
export function distanceToPolygonEdge(point: Point, polygon: Point[]): number {
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    minDistance = Math.min(minDistance, distanceToSegment(point, p1, p2));
  }

  return minDistance;
}

function distanceToSegment(p: Point, v: Point, w: Point): number {
  const l2 = dist2(v, w);
  if (l2 === 0) return Math.sqrt(dist2(p, v));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.sqrt(dist2(p, projection));
}

function dist2(v: Point, w: Point): number {
  return (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
}

export function calculatePolygonArea(polygon: Point[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area / 2);
}

// Hexagonal Packing Algorithm
// Tries multiple rotations and offsets to find the best fit
export function optimizeCircles(polygon: Point[], radius: number, spacing: number = 2): Circle[] {
  const bounds = getBoundingBox(polygon);
  const bestCircles: Circle[] = [];
  let maxCount = 0;

  // Hexagonal packing constants
  const r = radius;
  // Effective distance between centers (radius * 2 + spacing gap)
  const d = (r * 2) + spacing; 
  const rowHeight = d * Math.sqrt(3) / 2;

  // Optimization strategy: Rotate the grid (0, 15, 30, 45 degrees) and try small offsets
  // Since rotating the polygon is harder to visualize, we rotate the grid points relative to the polygon.
  
  const angles = [0, 15, 30, 45, 60]; 
  const offsets = [0, d/4, d/2, 3*d/4];

  let bestResult: Circle[] = [];

  for (const angle of angles) {
    const rad = angle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Grid basis vectors
    const u = { x: d * cos, y: d * sin };
    const v = { x: d * Math.cos(rad + Math.PI / 3), y: d * Math.sin(rad + Math.PI / 3) }; // 60 degrees from u
    
    // We scan a large enough area to cover the bounding box regardless of rotation
    // A simplified approach: Generate a standard hex grid, rotate the points, then check inclusion.
    
    // Create a dense grid covering the bounding box diagonal
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const diagonal = Math.sqrt(width*width + height*height);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const steps = Math.ceil(diagonal / d) + 2;

    for (const offX of [0, d/2]) { // minimal offsets check
      for (const offY of [0, rowHeight/2]) {
        const candidates: Circle[] = [];
        
        for (let row = -steps; row <= steps; row++) {
          for (let col = -steps; col <= steps; col++) {
             // Hex grid logic
             // x = col * d + (row % 2) * (d / 2)
             // y = row * rowHeight
             
             const hexX = col * d + (row % 2) * (d / 2) + offX;
             const hexY = row * rowHeight + offY;

             // Rotate point around center to simulate grid rotation relative to shape
             const rotatedX = (hexX * cos - hexY * sin) + centerX;
             const rotatedY = (hexX * sin + hexY * cos) + centerY;
             
             const p: Point = { x: rotatedX, y: rotatedY };

             // 1. Coarse check: Bounding box
             if (p.x < bounds.minX - r || p.x > bounds.maxX + r || p.y < bounds.minY - r || p.y > bounds.maxY + r) continue;

             // 2. Strict check: Inside polygon AND not clipping edges
             if (isPointInPolygon(p, polygon)) {
                const dist = distanceToPolygonEdge(p, polygon);
                if (dist >= r) {
                  candidates.push({
                    x: p.x,
                    y: p.y,
                    r: radius,
                    id: `${angle}-${row}-${col}`
                  });
                }
             }
          }
        }

        if (candidates.length > maxCount) {
          maxCount = candidates.length;
          bestResult = candidates;
        }
      }
    }
  }

  return bestResult;
}

function getBoundingBox(polygon: Point[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}
