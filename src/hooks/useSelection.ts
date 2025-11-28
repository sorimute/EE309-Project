import { useState } from 'react';

export function useSelection() {
  const [selectedShapeIds, setSelectedShapeIds] = useState<Set<number>>(new Set());
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  return {
    selectedShapeIds,
    setSelectedShapeIds,
    selectedTextIds,
    setSelectedTextIds,
    isSelecting,
    setIsSelecting,
    selectionBox,
    setSelectionBox,
  };
}


