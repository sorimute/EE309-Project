import { useState } from 'react';

export function useResize() {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0, 
    shapeX: 0, 
    shapeY: 0 
  });
  const [isResizingText, setIsResizingText] = useState(false);
  const [textResizeHandle, setTextResizeHandle] = useState<string | null>(null);
  const [textResizeStart, setTextResizeStart] = useState({ 
    x: 0, 
    y: 0, 
    width: 0, 
    height: 0, 
    textX: 0, 
    textY: 0 
  });

  return {
    isResizing,
    setIsResizing,
    resizeHandle,
    setResizeHandle,
    resizeStart,
    setResizeStart,
    isResizingText,
    setIsResizingText,
    textResizeHandle,
    setTextResizeHandle,
    textResizeStart,
    setTextResizeStart,
  };
}


