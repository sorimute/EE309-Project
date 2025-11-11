import { useState } from "react";
import "./App.css";

interface Shape {
  id: number;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [shapeColor, setShapeColor] = useState("#3b82f6");
  const [shapeWidth, setShapeWidth] = useState(100);
  const [shapeHeight, setShapeHeight] = useState(100);
  const [shapeX, setShapeX] = useState(50);
  const [shapeY, setShapeY] = useState(50);

  const addShape = (type: "rectangle" | "circle") => {
    const newShape: Shape = {
      id: Date.now(),
      type,
      x: shapeX,
      y: shapeY,
      width: shapeWidth,
      height: shapeHeight,
      color: shapeColor,
    };
    setShapes([...shapes, newShape]);
    setSelectedShape(newShape);
  };

  const updateSelectedShape = (
    color?: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number
  ) => {
    if (selectedShape) {
      const newColor = color ?? shapeColor;
      const newWidth = width ?? shapeWidth;
      const newHeight = height ?? shapeHeight;
      const newX = x ?? shapeX;
      const newY = y ?? shapeY;

      const updatedShape = {
        ...selectedShape,
        color: newColor,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      };

      setShapes(
        shapes.map((shape) =>
          shape.id === selectedShape.id ? updatedShape : shape
        )
      );
      setSelectedShape(updatedShape);
    }
  };

  const handleShapeClick = (shape: Shape) => {
    setSelectedShape(shape);
    setShapeColor(shape.color);
    setShapeWidth(shape.width);
    setShapeHeight(shape.height);
    setShapeX(shape.x);
    setShapeY(shape.y);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 왼쪽 패널: 파일 목록 */}
      <div className="w-48 bg-gray-200 p-4 border-r border-gray-300">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          연 파일 내의 목록을 보는 곳
        </h2>
        <div className="space-y-1">
          {shapes.map((shape) => (
            <div
              key={shape.id}
              onClick={() => handleShapeClick(shape)}
              className={`p-2 rounded cursor-pointer text-sm ${
                selectedShape?.id === shape.id
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {shape.type} {shape.id}
            </div>
          ))}
        </div>
      </div>

      {/* 중간 패널: 미리보기 영역 */}
      <div className="flex-1 flex flex-col bg-gray-200 border-r border-gray-300">
        {/* 툴바 */}
        <div className="bg-white p-3 border-b border-gray-300 flex gap-2 flex-wrap">
          <button
            onClick={() => addShape("rectangle")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            도형 추가버튼
          </button>
          <button
            onClick={() => addShape("circle")}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            원 추가버튼
          </button>
          <div className="px-4 py-2 bg-gray-100 rounded">
            텍스트 추가버튼
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            이미지 추가버튼
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            텍스트 설정 구간
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            도형설정구간
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="text-sm text-gray-600 mb-2">미리보기 할수 있는 곳</div>
          <div className="relative bg-white w-full h-full border-2 border-dashed border-gray-400">
            {shapes.map((shape) => (
              <div
                key={shape.id}
                onClick={() => handleShapeClick(shape)}
                style={{
                  position: "absolute",
                  left: `${shape.x}px`,
                  top: `${shape.y}px`,
                  width: `${shape.width}px`,
                  height: `${shape.height}px`,
                  backgroundColor: shape.color,
                  border:
                    selectedShape?.id === shape.id
                      ? "2px solid red"
                      : "1px solid #ccc",
                  cursor: "pointer",
                  borderRadius: shape.type === "circle" ? "50%" : "0",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 패널: 파일명 및 코드 내용 */}
      <div className="w-80 bg-gray-200 p-4">
        <div className="bg-white rounded p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              지금 선택한 파일 명
            </h2>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              S
            </div>
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {selectedShape
              ? `${selectedShape.type}_${selectedShape.id}`
              : "선택된 항목 없음"}
          </div>
        </div>

        <div className="bg-white rounded p-4 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            파일 타입
          </div>
          <div className="space-y-1 text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              html
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              css
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              react
            </label>
          </div>
        </div>

        {/* 도형 설정 구간 */}
        {selectedShape && (
          <div className="bg-white rounded p-4 mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              도형 설정
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  색상
                </label>
                <input
                  type="color"
                  value={shapeColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setShapeColor(newColor);
                    updateSelectedShape(newColor);
                  }}
                  className="w-full h-8 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  너비: {shapeWidth}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={shapeWidth}
                  onChange={(e) => {
                    const newWidth = Number(e.target.value);
                    setShapeWidth(newWidth);
                    updateSelectedShape(undefined, newWidth);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  높이: {shapeHeight}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  value={shapeHeight}
                  onChange={(e) => {
                    const newHeight = Number(e.target.value);
                    setShapeHeight(newHeight);
                    updateSelectedShape(undefined, undefined, newHeight);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  X 위치: {shapeX}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={shapeX}
                  onChange={(e) => {
                    const newX = Number(e.target.value);
                    setShapeX(newX);
                    updateSelectedShape(undefined, undefined, undefined, newX);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Y 위치: {shapeY}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={shapeY}
                  onChange={(e) => {
                    const newY = Number(e.target.value);
                    setShapeY(newY);
                    updateSelectedShape(undefined, undefined, undefined, undefined, newY);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            코드 내용
          </div>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded h-32 overflow-auto">
            {selectedShape
              ? `shape: ${selectedShape.type}\ncolor: ${selectedShape.color}\nwidth: ${selectedShape.width}px\nheight: ${selectedShape.height}px\nx: ${selectedShape.x}px\ny: ${selectedShape.y}px`
              : "코드가 여기에 표시됩니다"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
