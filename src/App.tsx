import { useState, useRef, useEffect } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pendingShapeType, setPendingShapeType] = useState<"rectangle" | "circle" | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, shapeX: 0, shapeY: 0 });
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowShapeMenu(false);
      }
    };

    if (showShapeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShapeMenu]);

  // Delete 키로 도형 삭제, 화살표 키로 도형 이동
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedShape && !pendingShapeType && !isDrawing && canvasRef.current) {
        if (event.key === "Delete" || event.key === "Backspace") {
          setShapes((prevShapes) => prevShapes.filter((shape) => shape.id !== selectedShape.id));
          setSelectedShape(null);
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const rect = canvasRef.current.getBoundingClientRect();
          let newX = selectedShape.x;
          let newY = selectedShape.y;
          const distance = 10;

          if (event.key === "ArrowUp") {
            newY = Math.max(0, selectedShape.y - distance);
          } else if (event.key === "ArrowDown") {
            newY = Math.min(rect.height - selectedShape.height, selectedShape.y + distance);
          } else if (event.key === "ArrowLeft") {
            newX = Math.max(0, selectedShape.x - distance);
          } else if (event.key === "ArrowRight") {
            newX = Math.min(rect.width - selectedShape.width, selectedShape.x + distance);
          }

          const updatedShape = {
            ...selectedShape,
            x: newX,
            y: newY,
          };

          setShapes((prevShapes) => prevShapes.map((shape) => (shape.id === selectedShape.id ? updatedShape : shape)));
          setSelectedShape(updatedShape);
          setShapeX(newX);
          setShapeY(newY);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedShape, pendingShapeType, isDrawing]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // 메뉴가 열려있으면 닫기
    if (showShapeMenu) {
      setShowShapeMenu(false);
    }
    
    // 도형이나 리사이즈 핸들을 클릭한 경우 무시
    const target = e.target as HTMLElement;
    if (target.closest(".resize-handle") || target.style.position === "absolute") {
      return;
    }
    
    // 도형 추가 모드일 때 드래그 시작
    if (pendingShapeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawPreview({ x, y, width: 0, height: 0 });
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isDrawing && pendingShapeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      // 드래그한 영역 계산
      const x = Math.min(drawStart.x, endX);
      const y = Math.min(drawStart.y, endY);
      const width = Math.abs(endX - drawStart.x);
      const height = Math.abs(endY - drawStart.y);
      
      // 최소 크기 체크
      if (width >= 10 && height >= 10) {
        const newShape: Shape = {
          id: Date.now(),
          type: pendingShapeType,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: Math.max(20, width),
          height: Math.max(20, height),
          color: shapeColor,
        };
        setShapes([...shapes, newShape]);
        setSelectedShape(newShape);
      }
      
      setIsDrawing(false);
      setDrawPreview(null);
      setPendingShapeType(null);
    }
    
    // 기존 마우스 업 핸들러도 호출
    handleMouseUp();
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

  const handleMouseDown = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation();
    // 도형 추가 모드일 때는 도형 클릭 무시
    if (pendingShapeType) {
      return;
    }
    const target = e.target as HTMLElement;
    
    // 리사이즈 핸들 클릭인지 확인
    if (target.classList.contains("resize-handle")) {
      const handle = target.getAttribute("data-handle");
      if (handle && canvasRef.current) {
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: shape.width,
          height: shape.height,
          shapeX: shape.x,
          shapeY: shape.y,
        });
        setSelectedShape(shape);
        setShapeColor(shape.color);
        setShapeWidth(shape.width);
        setShapeHeight(shape.height);
        setShapeX(shape.x);
        setShapeY(shape.y);
        setPendingShapeType(null); // 도형 선택 시 추가 모드 해제
      }
      return;
    }

    setSelectedShape(shape);
    setShapeColor(shape.color);
    setShapeWidth(shape.width);
    setShapeHeight(shape.height);
    setShapeX(shape.x);
    setShapeY(shape.y);
    setPendingShapeType(null); // 도형 선택 시 추가 모드 해제

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - shape.x;
      const offsetY = e.clientY - rect.top - shape.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 도형 그리기 중일 때
    if (isDrawing && pendingShapeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);
      
      setDrawPreview({ x, y, width, height });
      return;
    }
    
    if (isResizing && selectedShape && resizeHandle && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = selectedShape.x;
      let newY = selectedShape.y;

      // 리사이즈 핸들에 따라 크기 조절
      // 모서리 핸들 처리 (먼저 처리)
      if (resizeHandle === "nw") {
        newWidth = Math.max(20, resizeStart.width - deltaX);
        newHeight = Math.max(20, resizeStart.height - deltaY);
        newX = resizeStart.shapeX + (resizeStart.width - newWidth);
        newY = resizeStart.shapeY + (resizeStart.height - newHeight);
      } else if (resizeHandle === "ne") {
        newWidth = Math.max(20, resizeStart.width + deltaX);
        newHeight = Math.max(20, resizeStart.height - deltaY);
        newX = resizeStart.shapeX;
        newY = resizeStart.shapeY + (resizeStart.height - newHeight);
      } else if (resizeHandle === "sw") {
        newWidth = Math.max(20, resizeStart.width - deltaX);
        newHeight = Math.max(20, resizeStart.height + deltaY);
        newX = resizeStart.shapeX + (resizeStart.width - newWidth);
        newY = resizeStart.shapeY;
      } else if (resizeHandle === "se") {
        newWidth = Math.max(20, resizeStart.width + deltaX);
        newHeight = Math.max(20, resizeStart.height + deltaY);
        newX = resizeStart.shapeX;
        newY = resizeStart.shapeY;
      } else {
        // 중간 핸들 처리
        // 오른쪽/왼쪽 핸들
        if (resizeHandle === "e") {
          newWidth = Math.max(20, resizeStart.width + deltaX);
          newX = resizeStart.shapeX; // X 위치 유지
          newY = resizeStart.shapeY; // Y 위치 유지
        } else if (resizeHandle === "w") {
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newX = resizeStart.shapeX + (resizeStart.width - newWidth);
          newY = resizeStart.shapeY; // Y 위치 유지
        }
        // 아래/위 핸들
        if (resizeHandle === "s") {
          newHeight = Math.max(20, resizeStart.height + deltaY);
          newX = resizeStart.shapeX; // X 위치 유지
          newY = resizeStart.shapeY; // Y 위치 유지
        } else if (resizeHandle === "n") {
          newHeight = Math.max(20, resizeStart.height - deltaY);
          newX = resizeStart.shapeX; // X 위치 유지
          newY = resizeStart.shapeY + (resizeStart.height - newHeight);
        }
      }

      // 캔버스 경계 체크
      const maxX = rect.width - newX;
      const maxY = rect.height - newY;
      newWidth = Math.min(newWidth, maxX);
      newHeight = Math.min(newHeight, maxY);

      setShapeWidth(newWidth);
      setShapeHeight(newHeight);
      setShapeX(newX);
      setShapeY(newY);

      const updatedShape = {
        ...selectedShape,
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
    } else if (isDragging && selectedShape && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      // 캔버스 경계 내로 제한
      const maxX = rect.width - selectedShape.width;
      const maxY = rect.height - selectedShape.height;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setShapeX(constrainedX);
      setShapeY(constrainedY);

      const updatedShape = {
        ...selectedShape,
        x: constrainedX,
        y: constrainedY,
      };

      setShapes(
        shapes.map((shape) =>
          shape.id === selectedShape.id ? updatedShape : shape
        )
      );
      setSelectedShape(updatedShape);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
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
              className={`p-2 rounded text-sm flex items-center justify-between ${
                selectedShape?.id === shape.id
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              <div
                onClick={() => handleShapeClick(shape)}
                className="flex-1 cursor-pointer"
              >
                {shape.type} {shape.id}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShapes(shapes.filter((s) => s.id !== shape.id));
                  if (selectedShape?.id === shape.id) {
                    setSelectedShape(null);
                  }
                }}
                className="ml-2 p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                title="삭제"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 중간 패널: 미리보기 영역 */}
      <div className="flex-1 flex flex-col bg-gray-200 border-r border-gray-300">
        {/* 툴바 */}
        <div className="bg-white p-3 border-b border-gray-300 flex gap-2 flex-wrap relative">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowShapeMenu(!showShapeMenu)}
              className={`px-4 py-2 rounded ${
                pendingShapeType
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              도형 추가버튼
            </button>
            {showShapeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setPendingShapeType("rectangle");
                    setShowShapeMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t"
                >
                  사각형
                </button>
                <button
                  onClick={() => {
                    setPendingShapeType("circle");
                    setShowShapeMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b"
                >
                  원
                </button>
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            텍스트 추가버튼
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            이미지 추가버튼
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded">
            텍스트 설정 구간
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">도형설정구간</span>
            <input
              type="color"
              value={shapeColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setShapeColor(newColor);
                if (selectedShape) {
                  updateSelectedShape(newColor);
                }
              }}
              disabled={!selectedShape}
              className="h-8 w-16 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedShape ? "색상 변경" : "도형을 선택해주세요"}
            />
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="text-sm text-gray-600 mb-2">미리보기 할수 있는 곳</div>
          <div
            ref={canvasRef}
            className="relative bg-white w-full h-full border-2 border-dashed border-gray-400"
            onMouseMove={handleMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={(e) => {
              if (isDrawing) {
                handleCanvasMouseUp(e);
              }
              handleMouseUp();
            }}
            style={{ cursor: pendingShapeType ? "crosshair" : "default" }}
          >
            {/* 드래그 미리보기 */}
            {drawPreview && (
              <div
                style={{
                  position: "absolute",
                  left: `${drawPreview.x}px`,
                  top: `${drawPreview.y}px`,
                  width: `${drawPreview.width}px`,
                  height: `${drawPreview.height}px`,
                  border: "2px dashed #3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  pointerEvents: "none",
                  borderRadius: pendingShapeType === "circle" ? "50%" : "0",
                }}
              />
            )}
            {shapes.map((shape) => {
              const isSelected = selectedShape?.id === shape.id;
              return (
                <div
                  key={shape.id}
                  onMouseDown={(e) => handleMouseDown(e, shape)}
                  style={{
                    position: "absolute",
                    left: `${shape.x}px`,
                    top: `${shape.y}px`,
                    width: `${shape.width}px`,
                    height: `${shape.height}px`,
                    backgroundColor: shape.color,
                    border: isSelected ? "2px solid red" : "1px solid #ccc",
                    cursor:
                      isDragging && isSelected
                        ? "grabbing"
                        : isSelected
                        ? "move"
                        : "grab",
                    borderRadius: shape.type === "circle" ? "50%" : "0",
                    userSelect: "none",
                  }}
                >
                  {isSelected && (
                    <>
                      {/* 모서리 핸들 */}
                      <div
                        className="resize-handle"
                        data-handle="nw"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "nwse-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="ne"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "nesw-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="sw"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          left: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "nesw-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="se"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "nwse-resize",
                        }}
                      />
                      {/* 중간 핸들 */}
                      <div
                        className="resize-handle"
                        data-handle="n"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "ns-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="s"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "ns-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="w"
                        style={{
                          position: "absolute",
                          left: "-4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "ew-resize",
                        }}
                      />
                      <div
                        className="resize-handle"
                        data-handle="e"
                        style={{
                          position: "absolute",
                          right: "-4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "red",
                          border: "1px solid white",
                          cursor: "ew-resize",
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 오른쪽 패널: 파일명 및 코드 내용 */}
      <div className="w-80 bg-gray-200 p-4 flex flex-col">
        <div className="bg-white rounded p-4 mb-4">
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              지금 선택한 파일 명
            </h2>
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

        <div className="bg-white rounded p-4 flex-1 flex flex-col min-h-0">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            코드 내용
          </div>
          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded flex-1 overflow-auto">
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
