import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { readFile } from '../../lib/fileSystem/fileSystem';
import { CanvasRenderer } from './CanvasRenderer';
import { useCanvasSync } from '../../hooks/useCanvasSync';
import { Shape, Text, ShapeType } from '../../types';
import { DEFAULT_SHAPE_COLOR } from '../../constants/colors';
import { getShapeStyle, isClipPathShape } from '../../utils/shapeUtils';
import EditableText from '../EditableText';
import './Canvas.css';

interface CanvasWithOverlayProps {
  shapes: Shape[];
  texts: Text[];
  selectedShape: Shape | null;
  selectedText: Text | null;
  pendingShapeType: ShapeType | null;
  pendingText: boolean;
  textColor: string;
  shapeColor: string;
  isDragging: boolean;
  isDraggingText: boolean;
  isDrawing: boolean;
  drawStart: { x: number; y: number };
  drawPreview: { x: number; y: number; width: number; height: number } | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  isSelecting: boolean;
  selectedShapeIds: Set<number>;
  selectedTextIds: Set<number>;
  editingTextId: number | null;
  onShapesChange: (shapes: Shape[]) => void;
  onTextsChange: (texts: Text[]) => void;
  onSelectedShapeChange: (shape: Shape | null) => void;
  onSelectedTextChange: (text: Text | null) => void;
  onPendingShapeTypeChange: (type: ShapeType | null) => void;
  onPendingTextChange: (pending: boolean) => void;
  onIsDraggingChange: (dragging: boolean) => void;
  onIsDraggingTextChange: (dragging: boolean) => void;
  onIsDrawingChange: (drawing: boolean) => void;
  onDrawStartChange: (start: { x: number; y: number }) => void;
  onDrawPreviewChange: (preview: { x: number; y: number; width: number; height: number } | null) => void;
  onSelectionBoxChange: (box: { x: number; y: number; width: number; height: number } | null) => void;
  onIsSelectingChange: (selecting: boolean) => void;
  onSelectedShapeIdsChange: (ids: Set<number>) => void;
  onSelectedTextIdsChange: (ids: Set<number>) => void;
  onEditingTextIdChange: (id: number | null) => void;
  onShapeMouseDown: (e: React.MouseEvent, shape: Shape) => void;
  onTextMouseDown: (e: React.MouseEvent, text: Text) => void;
  onTextDoubleClick: (e: React.MouseEvent, text: Text) => void;
  onTextBlur: (id: number) => void;
  onTextKeyDown: (e: React.KeyboardEvent, id: number) => void;
  onTextInput: (id: number) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseUp: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  textInputRef: React.RefObject<HTMLDivElement>;
}

export function CanvasWithOverlay({
  shapes,
  texts,
  selectedShape,
  selectedText,
  pendingShapeType,
  pendingText,
  textColor,
  shapeColor,
  isDragging,
  isDraggingText,
  isDrawing,
  drawStart,
  drawPreview,
  selectionBox,
  isSelecting,
  selectedShapeIds,
  selectedTextIds,
  editingTextId,
  onShapesChange,
  onTextsChange,
  onSelectedShapeChange,
  onSelectedTextChange,
  onPendingShapeTypeChange,
  onPendingTextChange,
  onIsDraggingChange,
  onIsDraggingTextChange,
  onIsDrawingChange,
  onDrawStartChange,
  onDrawPreviewChange,
  onSelectionBoxChange,
  onIsSelectingChange,
  onSelectedShapeIdsChange,
  onSelectedTextIdsChange,
  onEditingTextIdChange,
  onShapeMouseDown,
  onTextMouseDown,
  onTextDoubleClick,
  onTextBlur,
  onTextKeyDown,
  onTextInput,
  onCanvasMouseDown,
  onCanvasMouseUp,
  onMouseMove,
  onMouseUp,
  canvasRef,
  textInputRef,
}: CanvasWithOverlayProps) {
  const { selectedFile } = useProjectStore();
  const [componentCode, setComponentCode] = useState<string>('');
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { syncCanvasToCode } = useCanvasSync();

  useEffect(() => {
    if (selectedFile && (
      selectedFile.endsWith('.tsx') || 
      selectedFile.endsWith('.jsx') ||
      selectedFile.endsWith('.html') ||
      selectedFile.endsWith('.css')
    )) {
      loadComponent(selectedFile);
    } else {
      setComponentCode('');
    }
  }, [selectedFile]);

  // 코드 저장 이벤트 구독 (Ctrl+S로 저장 시)
  useEffect(() => {
    const handleCodeSaved = (event: CustomEvent<string>) => {
      if (selectedFile && (
        selectedFile.endsWith('.tsx') || 
        selectedFile.endsWith('.jsx') ||
        selectedFile.endsWith('.html') ||
        selectedFile.endsWith('.css')
      )) {
        setComponentCode(event.detail);
      }
    };

    window.addEventListener('code-saved' as any, handleCodeSaved as EventListener);
    return () => {
      window.removeEventListener('code-saved' as any, handleCodeSaved as EventListener);
    };
  }, [selectedFile]);

  const loadComponent = async (filePath: string) => {
    try {
      console.log('컴포넌트 로드 시도:', filePath);
      const content = await readFile(filePath);
      console.log('컴포넌트 로드 성공:', filePath);
      setComponentCode(content);
    } catch (error) {
      console.error('컴포넌트 로드 실패:', filePath, error);
      setComponentCode('');
    }
  };

  const handleCanvasChange = (updatedCode: string) => {
    setComponentCode(updatedCode);
    syncCanvasToCode(updatedCode);
  };

  return (
    <div className="canvas-container">
      <div 
        className="canvas-content-wrapper"
        ref={canvasWrapperRef}
      >
        <div 
          className="canvas-content"
          ref={canvasContentRef}
          style={{
            width: '100%',
            maxWidth: '100%',
            position: 'relative',
            minHeight: '100%',
          }}
        >
          {componentCode ? (
            selectedFile && (selectedFile.endsWith('.html') || selectedFile.endsWith('.css')) ? (
              <div className="canvas-html-css-renderer">
                {selectedFile.endsWith('.html') ? (
                  <iframe
                    srcDoc={componentCode}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'white',
                    }}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'white',
                      padding: '20px',
                    }}
                  >
                    <style dangerouslySetInnerHTML={{ __html: componentCode }} />
                    <div style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px',
                    }}>
                      CSS 파일이 적용되었습니다. HTML 파일과 함께 열어서 확인하세요.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CanvasRenderer 
                code={componentCode} 
                onCodeChange={handleCanvasChange}
                zoomLevel={1}
              />
            )
          ) : null}
          
          {/* 도형/텍스트 오버레이 */}
          <div
            ref={canvasRef}
            className="canvas-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'auto',
              cursor: pendingShapeType ? "crosshair" : "default",
            }}
            onMouseMove={onMouseMove}
            onMouseDown={onCanvasMouseDown}
            onMouseUp={onCanvasMouseUp}
            onMouseLeave={(e) => {
              if (isDrawing) {
                onCanvasMouseUp(e);
              }
              onMouseUp();
            }}
          >
            {/* 올가미 선택 박스 */}
            {selectionBox && isSelecting && (
              <div
                style={{
                  position: "absolute",
                  left: `${selectionBox.x}px`,
                  top: `${selectionBox.y}px`,
                  width: `${selectionBox.width}px`,
                  height: `${selectionBox.height}px`,
                  border: "2px dashed #9ca3af",
                  backgroundColor: "rgba(156, 163, 175, 0.1)",
                  pointerEvents: "none",
                  zIndex: 9998,
                }}
              />
            )}
            
            {/* 드래그 미리보기 */}
            {drawPreview && pendingShapeType && (
              <div
                style={{
                  position: "absolute",
                  left: `${drawPreview.x}px`,
                  top: `${drawPreview.y}px`,
                  width: `${drawPreview.width}px`,
                  height: `${drawPreview.height}px`,
                  border: "2px dashed #f9a8d4",
                  backgroundColor: "rgba(249, 168, 212, 0.2)",
                  pointerEvents: "none",
                  zIndex: 9999,
                  borderRadius: pendingShapeType === "circle" || pendingShapeType === "ellipse" 
                    ? "50%" 
                    : pendingShapeType === "roundedRectangle" 
                      ? "10px" 
                      : "0",
                }}
              />
            )}
            
            {/* 도형 렌더링 */}
            {[...shapes].sort((a, b) => a.zIndex - b.zIndex).map((shape) => {
              const isSelected = selectedShape?.id === shape.id;
              const isMultiSelected = selectedShapeIds.has(shape.id);
              return (
                <div
                  key={shape.id}
                  className="shape-container"
                  onMouseDown={(e) => onShapeMouseDown(e, shape)}
                  style={{
                    position: "absolute",
                    left: `${shape.x}px`,
                    top: `${shape.y}px`,
                    width: `${shape.width}px`,
                    height: `${shape.height}px`,
                    pointerEvents: "auto",
                    zIndex: shape.zIndex,
                  }}
                >
                  {shape.type === "triangle" || isClipPathShape(shape.type) ? (
                    <svg
                      style={{
                        width: "100%",
                        height: "100%",
                        opacity: shape.opacity !== undefined ? shape.opacity : undefined,
                      }}
                    >
                      {shape.type === "triangle" ? (
                        <polygon
                          points={`${shape.width / 2},0 0,${shape.height} ${shape.width},${shape.height}`}
                          fill={shape.color}
                          stroke={isSelected ? "#f9a8d4" : "none"}
                          strokeWidth={isSelected ? "2" : "0"}
                        />
                      ) : null}
                    </svg>
                  ) : (
                    <div
                      style={{
                        ...getShapeStyle(shape),
                        outline: (isSelected || isMultiSelected) ? "2px solid #f9a8d4" : "none",
                        cursor: isDragging && isSelected ? "grabbing" : (isSelected || isMultiSelected) ? "move" : "grab",
                      }}
                    />
                  )}
                </div>
              );
            })}
            
            {/* 텍스트 렌더링 */}
            {[...texts].sort((a, b) => a.zIndex - b.zIndex).map((text) => {
              const isSelected = selectedText?.id === text.id;
              const isMultiSelected = selectedTextIds.has(text.id);
              const isEditing = editingTextId === text.id;
              
              if (isEditing) {
                return (
                  <EditableText
                    key={text.id}
                    ref={textInputRef}
                    text={text}
                    onBlur={() => onTextBlur(text.id)}
                    onKeyDown={(e) => onTextKeyDown(e, text.id)}
                    onInput={() => onTextInput(text.id)}
                  />
                );
              }
              
              return (
                <div
                  key={text.id}
                  className="text-container"
                  onMouseDown={(e) => onTextMouseDown(e, text)}
                  onDoubleClick={(e) => onTextDoubleClick(e, text)}
                  style={{
                    position: "absolute",
                    left: `${text.x}px`,
                    top: `${text.y}px`,
                    width: `${text.width}px`,
                    height: `${text.height}px`,
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    fontFamily: text.fontFamily,
                    fontWeight: text.fontWeight,
                    fontStyle: text.fontStyle,
                    textAlign: text.textAlign,
                    cursor: isDraggingText && isSelected ? "grabbing" : (isSelected || isMultiSelected) ? "move" : "grab",
                    border: (isSelected || isMultiSelected) ? "2px dashed #f9a8d4" : "none",
                    padding: (isSelected || isMultiSelected) ? "2px" : "0",
                    borderRadius: "2px",
                    backgroundColor: (isSelected || isMultiSelected) ? "rgba(249, 168, 212, 0.1)" : "transparent",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    zIndex: text.zIndex,
                  }}
                >
                  {text.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

