export type ShapeType = "rectangle" | "roundedRectangle" | "circle" | "ellipse" | "parallelogram" | "star" | "triangle" | "diamond" | "hexagon" | "pentagon" | "image";

export interface Shape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
  borderRadius?: number;
  shadowType?: "none" | "outer" | "inner";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowBlur?: number;
  strokeColor?: string;
  strokeWidth?: number;
  imageUrl?: string;
  locked?: boolean; // 잠금 상태
}

