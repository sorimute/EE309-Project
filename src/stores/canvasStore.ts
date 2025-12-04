import { create } from 'zustand';

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasState {
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  elementPositions: Record<string, ElementPosition>;
  updateElementPosition: (id: string, position: Partial<ElementPosition>) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  elementPositions: {},
  updateElementPosition: (id, position) =>
    set((state) => ({
      elementPositions: {
        ...state.elementPositions,
        [id]: {
          ...state.elementPositions[id],
          ...position,
        },
      },
    })),
}));

