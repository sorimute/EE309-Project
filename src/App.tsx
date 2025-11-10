import { useState, useCallback } from "react";
import "./App.css";
import Canvas from "./components/Canvas";
import CodeEditor from "./components/CodeEditor";
import PropertyEditor from "./components/PropertyEditor";
import { Shape } from "./types/shape";
import { createDefaultShape } from "./utils/shapeUtils";

function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const selectedShape = shapes.find((s) => s.id === selectedShapeId) || null;

  // Handle shape updates from canvas (drag, resize)
  const handleShapeUpdate = useCallback((id: string, updates: Partial<Omit<Shape, 'id'>>) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape))
    );
  }, []);

  // Handle shape updates from code editor
  const handleShapesChange = useCallback((newShapes: Shape[]) => {
    setShapes(newShapes);
    // Clear selection if selected shape no longer exists
    if (selectedShapeId && !newShapes.find((s) => s.id === selectedShapeId)) {
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

  // Handle shape updates from property editor
  const handlePropertyUpdate = useCallback((updates: Partial<Omit<Shape, 'id'>>) => {
    if (selectedShapeId) {
      handleShapeUpdate(selectedShapeId, updates);
    }
  }, [selectedShapeId, handleShapeUpdate]);

  // Add shape from code
  const handleAddShape = useCallback(() => {
    const newShape = createDefaultShape(50, 50);
    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
  }, []);

  // Add shape from canvas click
  const handleCanvasAddShape = useCallback((shape: Shape) => {
    setShapes((prev) => [...prev, shape]);
    setSelectedShapeId(shape.id);
  }, []);

  // Delete selected shape
  const handleDeleteShape = useCallback(() => {
    if (selectedShapeId) {
      setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Bidirectional Shape Editor
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleAddShape}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Add Shape (Code)
              </button>
              {selectedShapeId && (
                <button
                  onClick={handleDeleteShape}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Edit shapes on canvas or in code. Changes sync bidirectionally. Double-click canvas to add a shape.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Panel - Canvas */}
          <div className="col-span-7 bg-white rounded-lg shadow-md p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Canvas</h2>
            <div className="flex-1 min-h-0">
              <Canvas
                shapes={shapes}
                selectedShapeId={selectedShapeId}
                onShapeUpdate={handleShapeUpdate}
                onShapeSelect={setSelectedShapeId}
                onShapeAdd={handleCanvasAddShape}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Property Editor */}
            <div className="bg-white rounded-lg shadow-md flex flex-col min-h-0">
              <PropertyEditor
                shape={selectedShape}
                onUpdate={handlePropertyUpdate}
              />
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col flex-1 min-h-0">
              <CodeEditor shapes={shapes} onShapesChange={handleShapesChange} />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 bg-white rounded-lg shadow-md p-3">
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Adding Shapes:</strong> Click "Add Shape (Code)" button or double-click on canvas</p>
            <p><strong>Canvas → Code:</strong> Drag, resize, or edit properties to update code automatically</p>
            <p><strong>Code → Canvas:</strong> Edit JSON code to update shapes on canvas in real-time</p>
            <p><strong>Properties:</strong> Size (width/height), Color, Border Radius - Edit via property panel or code</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
