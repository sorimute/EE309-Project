import { useState, useEffect, useRef } from 'react';
import { Shape } from '../types/shape';
import { shapesToCode, codeToShapes } from '../utils/shapeUtils';

interface CodeEditorProps {
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
}

export default function CodeEditor({ shapes, onShapesChange }: CodeEditorProps) {
  const [code, setCode] = useState(shapesToCode(shapes));
  const [isValid, setIsValid] = useState(true);
  const isUserEditingRef = useRef(false);
  const lastShapesRef = useRef<string>(JSON.stringify(shapes));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Only update code if the change came from outside (canvas/property editor)
    // Check if textarea has focus (user is editing)
    const isTextareaFocused = document.activeElement === textareaRef.current;
    const currentShapesStr = JSON.stringify(shapes);
    
    // Update code if shapes changed and user is not actively editing
    if (currentShapesStr !== lastShapesRef.current) {
      if (!isTextareaFocused && !isUserEditingRef.current) {
        // User is not editing, update code immediately
        const newCode = shapesToCode(shapes);
        setCode(newCode);
        lastShapesRef.current = currentShapesStr;
        setIsValid(true);
      } else if (isTextareaFocused) {
        // User is editing, just update the ref to track changes
        // Code will sync when user stops editing (on blur)
        lastShapesRef.current = currentShapesStr;
      }
    }
  }, [shapes]);

  const handleCodeChange = (newCode: string) => {
    isUserEditingRef.current = true;
    setCode(newCode);
    try {
      const parsedShapes = codeToShapes(newCode);
      setIsValid(true);
      onShapesChange(parsedShapes);
      lastShapesRef.current = JSON.stringify(parsedShapes);
    } catch (error) {
      setIsValid(false);
    }
  };

  const handleBlur = () => {
    // Reset the flag when user stops editing
    // Also sync code if shapes changed while user was editing
    setTimeout(() => {
      isUserEditingRef.current = false;
      const currentShapesStr = JSON.stringify(shapes);
      if (currentShapesStr !== lastShapesRef.current) {
        const newCode = shapesToCode(shapes);
        setCode(newCode);
        lastShapesRef.current = currentShapesStr;
      }
    }, 50);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Code Editor</h3>
        {!isValid && (
          <span className="text-xs text-red-500">Invalid JSON</span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        onBlur={handleBlur}
        className={`flex-1 w-full p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 ${
          isValid
            ? 'border-gray-300 focus:ring-blue-500'
            : 'border-red-500 focus:ring-red-500'
        }`}
        spellCheck={false}
      />
      <div className="mt-2 text-xs text-gray-500">
        Edit the JSON to update shapes. Changes sync to canvas in real-time.
      </div>
    </div>
  );
}

