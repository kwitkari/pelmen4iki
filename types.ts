export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
  id: string;
}

export interface DoughStats {
  area: number;
  pelmeniCount: number;
  efficiency: number; // percentage of used area
}

export enum AppMode {
  DRAWING = 'DRAWING',
  CLOSED = 'CLOSED', // Shape is closed, ready to calculate
  OPTIMIZING = 'OPTIMIZING',
  DONE = 'DONE',
}
