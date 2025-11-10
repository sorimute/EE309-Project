export interface Shape {
  id: string;
  type: 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderRadius: number;
}

export interface ShapeUpdate {
  id: string;
  updates: Partial<Omit<Shape, 'id'>>;
}

