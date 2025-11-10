import { useState, useRef, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import "./App.css";

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  path: string; // 원본 파일 경로
}

function App() {
  const [images, setImages] = useState<ImageElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "gif", "bmp", "webp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const fileData = await readFile(selected);
        const blob = new Blob([fileData], { type: "image/png" });
        const url = URL.createObjectURL(blob);

        const newImage: ImageElement = {
          id: `img-${Date.now()}`,
          src: url,
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          path: selected,
        };

        setImages([...images, newImage]);
        setSelectedId(newImage.id);
      }
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: "drag" | "resize") => {
    e.stopPropagation();
    const image = images.find((img) => img.id === id);
    if (!image) return;

    setSelectedId(id);

    if (type === "drag") {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - image.x,
        y: e.clientY - image.y,
      });
    } else if (type === "resize") {
      setIsResizing(true);
      const rect = previewRef.current?.getBoundingClientRect();
      if (rect && image) {
        setResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: image.width,
          height: image.height,
        });
      }
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!selectedId) return;

      const image = images.find((img) => img.id === selectedId);
      if (!image) return;

      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        setImages(
          images.map((img) =>
            img.id === selectedId
              ? {
                  ...img,
                  x: Math.max(0, Math.min(newX, (previewRef.current?.clientWidth || 800) - img.width)),
                  y: Math.max(0, Math.min(newY, (previewRef.current?.clientHeight || 600) - img.height)),
                }
              : img
          )
        );
      } else if (isResizing) {
        const rect = previewRef.current?.getBoundingClientRect();
        if (!rect) return;

        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(50, resizeStart.width + deltaX);
        const newHeight = Math.max(50, resizeStart.height + deltaY);

        setImages(
          images.map((img) =>
            img.id === selectedId
              ? {
                  ...img,
                  width: Math.min(newWidth, (previewRef.current?.clientWidth || 800) - img.x),
                  height: Math.min(newHeight, (previewRef.current?.clientHeight || 600) - img.y),
                }
              : img
          )
        );
      }
    },
    [selectedId, isDragging, isResizing, dragOffset, resizeStart, images]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove]);

  const generateCode = () => {
    const imports = `import "./App.css";`;

    const jsxElements = images
      .map(
        (img, index) => `      <img
        src="${img.path}"
        alt="Image ${index + 1}"
        style={{
          position: "absolute",
          left: ${img.x},
          top: ${img.y},
          width: ${img.width},
          height: ${img.height},
        }}
      />`
      )
      .join("\n");

    return `${imports}

function App() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
${jsxElements}
    </div>
  );
}

export default App;`;
  };

  const handleApplyToCode = async () => {
    try {
      const code = generateCode();
      // 프로젝트 루트 기준 상대 경로로 파일 쓰기
      await writeTextFile("src/App.tsx", code);
      alert("코드가 App.tsx에 반영되었습니다!");
    } catch (error) {
      console.error("Error writing file:", error);
      alert("파일 쓰기 중 오류가 발생했습니다: " + (error as Error).message);
    }
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">UI 개발 IDE</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImageUpload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            이미지 추가
          </button>
          {selectedId && (
            <button
              onClick={() => handleDeleteImage(selectedId)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              선택 삭제
            </button>
          )}
          <button
            onClick={handleApplyToCode}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            disabled={images.length === 0}
          >
            코드에 반영
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 미리보기 영역 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 h-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">미리보기</h2>
            <div
              ref={previewRef}
              className="border-2 border-dashed border-gray-300 rounded-lg relative bg-gray-50"
              style={{ width: "100%", height: "calc(100% - 3rem)", minHeight: "500px" }}
              onClick={() => setSelectedId(null)}
            >
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`absolute cursor-move ${
                    selectedId === img.id ? "ring-2 ring-indigo-500" : ""
                  }`}
                  style={{
                    left: `${img.x}px`,
                    top: `${img.y}px`,
                    width: `${img.width}px`,
                    height: `${img.height}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(img.id);
                  }}
                  onMouseDown={(e) => handleMouseDown(e, img.id, "drag")}
                >
                  <img
                    src={img.src}
                    alt="Preview"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  {selectedId === img.id && (
                    <>
                      {/* 리사이즈 핸들 */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 cursor-se-resize rounded-full border-2 border-white"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, img.id, "resize");
                        }}
                      />
                      {/* 위치/크기 정보 */}
                      <div className="absolute -top-8 left-0 bg-indigo-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        x: {img.x}px, y: {img.y}px, w: {img.width}px, h: {img.height}px
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 코드 영역 */}
        <div className="w-1/2 border-l border-gray-200 p-4 overflow-auto bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">생성된 코드</h2>
          <div className="bg-gray-900 rounded-lg p-4 h-full overflow-auto">
            <pre className="text-sm text-green-400 font-mono">
              <code>{generateCode()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
