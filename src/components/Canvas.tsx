import { useState, useRef, useCallback } from 'react';
import { Shape } from '../types/shape';
import { createDefaultShape } from '../utils/shapeUtils';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onShapeUpdate: (id: string, updates: Partial<Omit<Shape, 'id'>>) => void;
  onShapeSelect: (id: string | null) => void;
  onShapeAdd: (shape: Shape) => void;
}

export default function Canvas({
  shapes,
  selectedShapeId,
  onShapeUpdate,
  onShapeSelect,
  onShapeAdd,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, shapeId: string) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on resize handle (bottom-right corner)
    const handleSize = 10;
    const isOnHandle =
      mouseX >= shape.x + shape.width - handleSize &&
      mouseX <= shape.x + shape.width &&
      mouseY >= shape.y + shape.height - handleSize &&
      mouseY <= shape.y + shape.height;

    if (isOnHandle) {
      setIsResizing(true);
      setResizeStart({
        x: mouseX,
        y: mouseY,
        width: shape.width,
        height: shape.height,
      });
      setDraggedShapeId(shapeId);
    } else {
      setIsDragging(true);
      setDragStart({
        x: mouseX - shape.x,
        y: mouseY - shape.y,
      });
      setDraggedShapeId(shapeId);
      onShapeSelect(shapeId);
    }

    e.preventDefault();
  }, [shapes, onShapeSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && draggedShapeId) {
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      onShapeUpdate(draggedShapeId, { x: Math.max(0, newX), y: Math.max(0, newY) });
    } else if (isResizing && draggedShapeId) {
      const deltaX = mouseX - resizeStart.x;
      const deltaY = mouseY - resizeStart.y;
      const newWidth = Math.max(20, resizeStart.width + deltaX);
      const newHeight = Math.max(20, resizeStart.height + deltaY);
      onShapeUpdate(draggedShapeId, { width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, draggedShapeId, dragStart, resizeStart, onShapeUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedShapeId(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onShapeSelect(null);
    }
  }, [onShapeSelect]);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current && !isDragging && !isResizing) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newShape = createDefaultShape(x - 50, y - 50); // Center the shape on click
      onShapeAdd(newShape);
    }
  }, [isDragging, isResizing, onShapeAdd]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
    >
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        return (
          <div
            key={shape.id}
            className={`absolute cursor-move transition-all ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
            }`}
            style={{
              left: `${shape.x}px`,
              top: `${shape.y}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              backgroundColor: shape.color,
              borderRadius: `${shape.borderRadius}px`,
              boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, shape.id);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isSelected && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize"
                style={{
                  transform: 'translate(50%, 50%)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

