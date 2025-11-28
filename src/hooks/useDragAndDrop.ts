import { useState } from 'react';
import { Shape, Text } from '../types';

export function useDragAndDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [copiedShape, setCopiedShape] = useState<Shape | null>(null);
  const [copiedText, setCopiedText] = useState<Text | null>(null);
  const [lastPastedPosition, setLastPastedPosition] = useState<{ x: number; y: number } | null>(null);
  const [pasteCount, setPasteCount] = useState(0);

  return {
    isDragging,
    setIsDragging,
    dragOffset,
    setDragOffset,
    isDraggingText,
    setIsDraggingText,
    textDragOffset,
    setTextDragOffset,
    isDrawing,
    setIsDrawing,
    drawStart,
    setDrawStart,
    drawPreview,
    setDrawPreview,
    copiedShape,
    setCopiedShape,
    copiedText,
    setCopiedText,
    lastPastedPosition,
    setLastPastedPosition,
    pasteCount,
    setPasteCount,
  };
}


