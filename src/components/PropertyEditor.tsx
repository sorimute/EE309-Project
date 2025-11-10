import { Shape } from '../types/shape';

interface PropertyEditorProps {
  shape: Shape | null;
  onUpdate: (updates: Partial<Omit<Shape, 'id'>>) => void;
}

export default function PropertyEditor({ shape, onUpdate }: PropertyEditorProps) {
  if (!shape) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a shape to edit its properties
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Properties</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Width
          </label>
          <input
            type="number"
            value={shape.width}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Height
          </label>
          <input
            type="number"
            value={shape.height}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={shape.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={shape.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Border Radius
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={shape.borderRadius}
              onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
              min="0"
              max="50"
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12 text-right">
              {shape.borderRadius}px
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Type
          </label>
          <select
            value={shape.type}
            onChange={(e) => onUpdate({ type: e.target.value as 'rectangle' | 'circle' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
          </select>
        </div>
      </div>
    </div>
  );
}

