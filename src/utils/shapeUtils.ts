import { Shape } from '../types/shape';

export const generateId = (): string => {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createDefaultShape = (x: number, y: number): Shape => {
  return {
    id: generateId(),
    type: 'rectangle',
    x,
    y,
    width: 100,
    height: 100,
    color: '#3b82f6',
    borderRadius: 0,
  };
};

export const shapesToCode = (shapes: Shape[]): string => {
  return JSON.stringify(shapes, null, 2);
};

export const codeToShapes = (code: string): Shape[] => {
  try {
    const parsed = JSON.parse(code);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    return [];
  }
};

