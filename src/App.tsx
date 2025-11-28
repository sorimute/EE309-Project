
import { useRef, useEffect } from "react";
import "./App.css";
import newimageIcon from "./assets/newimage.png";
import newshapeIcon from "./assets/newshape.png";
import newtextIcon from "./assets/newtext.png";
import shapeColorIcon from "./assets/shapecolor.png";
import textColorIcon from "./assets/textcolor.png";
import strokeIcon from "./assets/stroke.svg";
import cornerRadiusIcon from "./assets/cornerradius.svg";
import effectsIcon from "./assets/effects.svg";
import alignLeftIcon from "./assets/align_left.png";
import alignCenterIcon from "./assets/align_center.png";
import alignRightIcon from "./assets/align_right.png";

// Types
import { Shape, Text, Group } from './types';

// Constants
import { DEFAULT_SHAPE_COLOR } from './constants/colors';

// Utils
import { isClipPathShape, isNonTrianglePolygon, getShapeStyle } from './utils/shapeUtils';

// Hooks
import { 
  useShapes, 
  useTexts, 
  useCodeEditor, 
  useFileManagement, 
  useSelection, 
  useGroups, 
  useDragAndDrop, 
  useResize 
} from './hooks';

// Components
import EditableText from './components/EditableText';
import FileExplorer from './components/FileExplorer';
import FileTabs from './components/FileTabs';
import CodeEditor from './components/CodeEditor';

function App() {
  // Hooks
  const shapesHook = useShapes();
  const textsHook = useTexts();
  const fileManagement = useFileManagement();
  const selection = useSelection();
  const groups = useGroups();
  const dragAndDrop = useDragAndDrop();
  const resize = useResize();
  
  // Destructure shapes hook
  const {
    shapes,
    setShapes,
    selectedShape,
    setSelectedShape,
    shapeColor,
    setShapeColor,
    shapeWidth,
    setShapeWidth,
    shapeHeight,
    setShapeHeight,
    shapeBorderRadius,
    setShapeBorderRadius,
    borderRadiusInputValue,
    setBorderRadiusInputValue,
    pendingShapeType,
    setPendingShapeType,
    showShapeMenu,
    setShowShapeMenu,
    showShapeColorMenu,
    setShowShapeColorMenu,
    showEffectsMenu,
    setShowEffectsMenu,
    showOpacityControl,
    setShowOpacityControl,
    showGlowControl,
    setShowGlowControl,
    showStrokeMenu,
    setShowStrokeMenu,
    showBringForwardMenu,
    setShowBringForwardMenu,
    showSendBackwardMenu,
    setShowSendBackwardMenu,
  } = shapesHook;

  // Destructure texts hook
  const {
    texts,
    setTexts,
    selectedText,
    setSelectedText,
    textColor,
    setTextColor,
    pendingText,
    setPendingText,
    editingTextId,
    setEditingTextId,
    showTextColorMenu,
    setShowTextColorMenu,
    textInputRef,
  } = textsHook;

  // Destructure file management hook
  const {
    files,
    openedFiles,
    setOpenedFiles,
    activeFile,
    setActiveFile,
    handleFileClick,
    handleTabClick,
    handleTabClose,
  } = fileManagement;

  // Destructure selection hook
  const {
    selectedShapeIds,
    setSelectedShapeIds,
    selectedTextIds,
    setSelectedTextIds,
    isSelecting,
    setIsSelecting,
    selectionBox,
    setSelectionBox,
  } = selection;

  // Destructure groups hook
  const {
    groups: groupsState,
    setGroups,
    selectedGroup,
    setSelectedGroup,
    groupDragStart,
    setGroupDragStart,
  } = groups;
  
  // Alias for easier use
  const groupsArray = groupsState;

  // Destructure drag and drop hook
  const {
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
  } = dragAndDrop;

  // Destructure resize hook
  const {
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
  } = resize;

  // Code editor hook
  const {
    codeView,
    setCodeView,
    codeContent,
    setCodeContent,
    isCodeEditing,
    setIsCodeEditing,
    handleCodeChange,
  } = useCodeEditor(shapes, texts, setShapes, setTexts);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textColorMenuRef = useRef<HTMLDivElement>(null);
  const shapeColorMenuRef = useRef<HTMLDivElement>(null);
  const effectsMenuRef = useRef<HTMLDivElement>(null);
  const strokeMenuRef = useRef<HTMLDivElement>(null);
  const borderRadiusInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bringForwardMenuRef = useRef<HTMLDivElement>(null);
  const sendBackwardMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowShapeMenu(false);
      }
      if (shapeColorMenuRef.current && !shapeColorMenuRef.current.contains(event.target as Node)) {
        setShowShapeColorMenu(false);
      }
      if (textColorMenuRef.current && !textColorMenuRef.current.contains(event.target as Node)) {
        setShowTextColorMenu(false);
      }
      if (effectsMenuRef.current && !effectsMenuRef.current.contains(event.target as Node)) {
        setShowEffectsMenu(false);
      }
      if (strokeMenuRef.current && !strokeMenuRef.current.contains(event.target as Node)) {
        setShowStrokeMenu(false);
      }
      if (bringForwardMenuRef.current && !bringForwardMenuRef.current.contains(event.target as Node)) {
        setShowBringForwardMenu(false);
      }
      if (sendBackwardMenuRef.current && !sendBackwardMenuRef.current.contains(event.target as Node)) {
        setShowSendBackwardMenu(false);
      }
    };

    if (showShapeMenu || showShapeColorMenu || showTextColorMenu || showEffectsMenu || showStrokeMenu || showBringForwardMenu || showSendBackwardMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShapeMenu, showShapeColorMenu, showTextColorMenu, showEffectsMenu, showStrokeMenu, showBringForwardMenu, showSendBackwardMenu]);

  // 드롭다운이 열릴 때 자동으로 color input 클릭
  useEffect(() => {
    if (showShapeColorMenu) {
      // 약간의 지연을 두고 color input을 클릭하여 브라우저 색상 선택 팝업 열기
      const timer = setTimeout(() => {
        const colorInput = document.getElementById('shape-color-input-in-dropdown') as HTMLInputElement;
        if (colorInput) {
          colorInput.click();
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [showShapeColorMenu]);

  // Text Color 드롭다운이 열릴 때 자동으로 color input 클릭
  useEffect(() => {
    if (showTextColorMenu) {
      // 약간의 지연을 두고 color input을 클릭하여 브라우저 색상 선택 팝업 열기
      const timer = setTimeout(() => {
        const colorInput = document.getElementById('text-color-input-in-dropdown') as HTMLInputElement;
        if (colorInput) {
          colorInput.click();
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [showTextColorMenu]);

  // activeFile 변경 시 확장자에 따라 codeView 자동 설정
  useEffect(() => {
    const file = files.find(f => f.name === activeFile);
    const extension = activeFile.split('.').pop()?.toLowerCase();
    
    if (file?.extension === "react" || extension === "tsx" || extension === "jsx") {
      setCodeView("react");
    } else if (file?.extension === "css" || extension === "css") {
      setCodeView("css");
    } else if (file?.extension === "xml" || extension === "xml") {
      setCodeView("xml");
    } else {
      // 기본값은 xml
      setCodeView("xml");
    }
  }, [activeFile, files]);

  // 편집 모드로 전환될 때 자동으로 포커스 및 텍스트 선택
  useEffect(() => {
    if (editingTextId && textInputRef.current) {
      textInputRef.current.focus();
      // 텍스트 전체 선택
      const range = document.createRange();
      range.selectNodeContents(textInputRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingTextId]);
  // Delete 키로 도형 삭제, 화살표 키로 도형 이동
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // input 필드나 contentEditable 요소에 포커스가 있으면 도형/텍스트 삭제/이동을 하지 않음
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === "INPUT" || 
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true"
      );
      
      if (isInputFocused) {
        return;
      }
      
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
          // setShapeX(newX); // Not used
          // setShapeY(newY); // Not used
        }
      }
      
      // 그룹 삭제
      if (selectedGroup && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        // 그룹에 속한 모든 도형과 텍스트 삭제
        setShapes((prevShapes) => prevShapes.filter((shape) => !selectedGroup.shapeIds.includes(shape.id)));
        setTexts((prevTexts) => prevTexts.filter((text) => !selectedGroup.textIds.includes(text.id)));
        setGroups((prevGroups) => prevGroups.filter((g) => g.id !== selectedGroup.id));
        setSelectedGroup(null);
        return;
      }
      
      // 텍스트 삭제 (편집 모드가 아닐 때만)
      if (selectedText && !pendingText && !editingTextId && canvasRef.current) {
        if (event.key === "Delete" || event.key === "Backspace") {
          setTexts((prevTexts) => prevTexts.filter((text) => text.id !== selectedText.id));
          setSelectedText(null);
        }
      }
      
      // Ctrl+C: 복사
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        if (selectedShape) {
          event.preventDefault();
          setCopiedShape(selectedShape);
          setCopiedText(null);
          setLastPastedPosition(null); // 복사 시 붙여넣기 위치 초기화
          setPasteCount(0);
        } else if (selectedText) {
          event.preventDefault();
          setCopiedText(selectedText);
          setCopiedShape(null);
          setLastPastedPosition(null); // 복사 시 붙여넣기 위치 초기화
          setPasteCount(0);
        }
      }
      
      // Ctrl+G: 그룹화 (최소 2개 이상 선택되어야 함)
      if ((event.ctrlKey || event.metaKey) && event.key === "g" && !event.shiftKey) {
        const totalSelected = selectedShapeIds.size + selectedTextIds.size;
        if (totalSelected >= 2) {
          event.preventDefault();
          createGroup();
        }
      }
      
      // Ctrl+Shift+G: 그룹 해제
      if ((event.ctrlKey || event.metaKey) && event.key === "G" && event.shiftKey) {
        event.preventDefault();
        ungroup();
      }
      
      // Ctrl+V: 붙여넣기
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        if (copiedShape && canvasRef.current) {
          event.preventDefault();
          const rect = canvasRef.current.getBoundingClientRect();
          const offset = 20; // 붙여넣기 시 약간 오프셋을 주어 겹치지 않게
          
          // 생성 순서에 따라 zIndex 설정
          const allItems = [
            ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
            ...texts.map(t => ({ id: t.id, type: 'text' as const }))
          ].sort((a, b) => a.id - b.id);
          
          // 마지막 붙여넣기 위치가 있으면 그 위치에서 오프셋, 없으면 원본 위치에서 오프셋
          let newX: number;
          let newY: number;
          
          if (lastPastedPosition) {
            // 이전 붙여넣기 위치에서 오프셋
            newX = Math.max(0, Math.min(lastPastedPosition.x + offset, rect.width - copiedShape.width));
            newY = Math.max(0, Math.min(lastPastedPosition.y + offset, rect.height - copiedShape.height));
          } else {
            // 첫 번째 붙여넣기: 원본 위치에서 오프셋
            newX = Math.max(0, Math.min(copiedShape.x + offset, rect.width - copiedShape.width));
            newY = Math.max(0, Math.min(copiedShape.y + offset, rect.height - copiedShape.height));
          }
          
          const newShape: Shape = {
            ...copiedShape,
            id: Date.now(),
            x: newX,
            y: newY,
            zIndex: allItems.length + 1,
          };
          
          setShapes([...shapes, newShape]);
          setSelectedShape(newShape);
          setSelectedText(null);
          setLastPastedPosition({ x: newX, y: newY });
          setPasteCount(prev => prev + 1);
        } else if (copiedText && canvasRef.current) {
          event.preventDefault();
          const rect = canvasRef.current.getBoundingClientRect();
          const offset = 20; // 붙여넣기 시 약간 오프셋을 주어 겹치지 않게
          
          // 생성 순서에 따라 zIndex 설정
          const allItems = [
            ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
            ...texts.map(t => ({ id: t.id, type: 'text' as const }))
          ].sort((a, b) => a.id - b.id);
          
          // 마지막 붙여넣기 위치가 있으면 그 위치에서 오프셋, 없으면 원본 위치에서 오프셋
          let newX: number;
          let newY: number;
          
          if (lastPastedPosition) {
            // 이전 붙여넣기 위치에서 오프셋
            newX = Math.max(0, Math.min(lastPastedPosition.x + offset, rect.width - copiedText.width));
            newY = Math.max(0, Math.min(lastPastedPosition.y + offset, rect.height - copiedText.height));
          } else {
            // 첫 번째 붙여넣기: 원본 위치에서 오프셋
            newX = Math.max(0, Math.min(copiedText.x + offset, rect.width - copiedText.width));
            newY = Math.max(0, Math.min(copiedText.y + offset, rect.height - copiedText.height));
          }
          
          const newText: Text = {
            ...copiedText,
            id: Date.now(),
            x: newX,
            y: newY,
            zIndex: allItems.length + 1,
          };
          
          setTexts([...texts, newText]);
          setSelectedText(newText);
          setSelectedShape(null);
          setLastPastedPosition({ x: newX, y: newY });
          setPasteCount(prev => prev + 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedShape, selectedText, pendingShapeType, pendingText, isDrawing, editingTextId, copiedShape, copiedText, shapes, texts, lastPastedPosition]);

  // 텍스트 추가 핸들러
  const handleAddText = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 생성 순서에 따라 zIndex 설정: 모든 요소(도형+텍스트)를 id(생성 시간) 순으로 정렬하여 순차적으로 zIndex 할당
      const allItems = [
        ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
        ...texts.map(t => ({ id: t.id, type: 'text' as const }))
      ].sort((a, b) => a.id - b.id);
      
      const newText: Text = {
        id: Date.now(),
        x: centerX - 100,
        y: centerY,
        width: 200,
        height: 50,
        text: "텍스트를 입력하세요",
        fontSize: 16,
        color: textColor,
        fontFamily: "Nanum Gothic",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left",
        zIndex: allItems.length + 1, // 생성 순서에 따라 zIndex 할당
      };
      
      setTexts([...texts, newText]);
      setSelectedText(newText);
      setSelectedShape(null);
      setPendingText(false);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // 메뉴가 열려있으면 닫기
    if (showShapeMenu) {
      setShowShapeMenu(false);
    }
    if (showShapeColorMenu) {
      setShowShapeColorMenu(false);
    }
    if (showTextColorMenu) {
      setShowTextColorMenu(false);
    }
    if (showEffectsMenu) {
      setShowEffectsMenu(false);
    }
    if (showOpacityControl) {
      setShowOpacityControl(false);
    }
    if (showGlowControl) {
      setShowGlowControl(false);
    }
    if (showStrokeMenu) {
      setShowStrokeMenu(false);
    }
    
    // 도형 추가 모드가 아닐 때만 도형 클릭 무시
    // 도형 추가 모드일 때는 도형 위에서도 드래그로 새 도형 생성 가능
    const target = e.target as HTMLElement;
    const isOnElement = target.closest(".resize-handle") || 
                        target.closest(".text-resize-handle") || 
                        target.closest(".shape-container") || 
                        target.closest(".text-container") || 
                        target.closest(".group-container");
    
    // 리사이즈 핸들은 항상 무시 (도형 생성 모드가 아니어도)
    if (target.closest(".resize-handle") || target.closest(".text-resize-handle")) {
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
      return;
    }
    
    // 요소 위에 있으면 올가미 선택 시작하지 않음
    if (isOnElement && !pendingShapeType) {
      return;
    }
    
    // 도형 추가 모드가 아닐 때 바탕을 클릭하면 선택 해제
    if (!pendingShapeType && !pendingText) {
      // Ctrl 키를 누르지 않았을 때만 선택 해제 (Ctrl 키를 누르면 기존 선택 유지)
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedShape(null);
        setSelectedText(null);
        setSelectedGroup(null);
        setSelectedShapeIds(new Set());
        setSelectedTextIds(new Set());
      }
    }
    
    // 올가미 선택 모드 시작 (빈 공간에서 드래그)
    if (!pendingShapeType && !pendingText && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setIsSelecting(true);
      setSelectionBox({ x, y, width: 0, height: 0 });
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
        const finalWidth = Math.max(20, width);
        const finalHeight = Math.max(20, height);
        // roundedRectangle의 경우 기본값 10으로 설정
        const initialBorderRadius = pendingShapeType === "roundedRectangle" ? 10 : undefined;
        // 생성 순서에 따라 zIndex 설정: 모든 요소(도형+텍스트)를 id(생성 시간) 순으로 정렬하여 순차적으로 zIndex 할당
        const allItems = [
          ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
          ...texts.map(t => ({ id: t.id, type: 'text' as const }))
        ].sort((a, b) => a.id - b.id);
        
        const newShapeId = Date.now();
        const newShape: Shape = {
          id: newShapeId,
          type: pendingShapeType,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: finalWidth,
          height: finalHeight,
          color: DEFAULT_SHAPE_COLOR,
          zIndex: allItems.length + 1, // 생성 순서에 따라 zIndex 할당
          borderRadius: initialBorderRadius,
        };
        setShapes([...shapes, newShape]);
        setSelectedShape(newShape);
        const borderRadius = newShape.borderRadius ?? (newShape.type === "roundedRectangle" ? 10 : 0);
        setShapeBorderRadius(borderRadius);
        setBorderRadiusInputValue(borderRadius.toString());
      }
      
      setIsDrawing(false);
      setDrawPreview(null);
      setPendingShapeType(null);
    } else if (isSelecting && selectionBox && canvasRef.current) {
      // 올가미 선택 완료: 선택 박스 안에 포함된 요소들 선택
      const box = selectionBox;
      const minX = Math.min(box.x, box.x + box.width);
      const maxX = Math.max(box.x, box.x + box.width);
      const minY = Math.min(box.y, box.y + box.height);
      const maxY = Math.max(box.y, box.y + box.height);
      
      const newSelectedShapeIds = new Set<number>();
      const newSelectedTextIds = new Set<number>();
      
      // 모든 도형들 중 선택 박스와 겹치는 것 선택 (그룹에 속한 것도 포함)
      shapes.forEach(shape => {
        const shapeRight = shape.x + shape.width;
        const shapeBottom = shape.y + shape.height;
        // 요소가 선택 박스와 겹치는지 확인 (부분 겹침도 포함)
        if (shape.x < maxX && shapeRight > minX && shape.y < maxY && shapeBottom > minY) {
          newSelectedShapeIds.add(shape.id);
        }
      });
      
      // 모든 텍스트들 중 선택 박스와 겹치는 것 선택 (그룹에 속한 것도 포함)
      texts.forEach(text => {
        const textRight = text.x + text.width;
        const textBottom = text.y + text.height;
        // 요소가 선택 박스와 겹치는지 확인 (부분 겹침도 포함)
        if (text.x < maxX && textRight > minX && text.y < maxY && textBottom > minY) {
          newSelectedTextIds.add(text.id);
        }
      });
      
      // Ctrl 키를 누르지 않았을 때만 기존 선택을 대체
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedShapeIds(newSelectedShapeIds);
        setSelectedTextIds(newSelectedTextIds);
        setSelectedShape(null);
        setSelectedText(null);
        setSelectedGroup(null);
      } else {
        // Ctrl 키를 누르면 기존 선택에 추가
        const combinedShapeIds = new Set([...selectedShapeIds, ...newSelectedShapeIds]);
        const combinedTextIds = new Set([...selectedTextIds, ...newSelectedTextIds]);
        setSelectedShapeIds(combinedShapeIds);
        setSelectedTextIds(combinedTextIds);
        setSelectedShape(null);
        setSelectedText(null);
        setSelectedGroup(null);
      }
      
      setIsSelecting(false);
      setSelectionBox(null);
    }
    
    // 기존 마우스 업 핸들러도 호출
    handleMouseUp();
  };

  const updateSelectedShape = (
    color?: string,
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    borderRadius?: number,
    shadowType?: "none" | "outer" | "inner",
    shadowColor?: string,
    shadowBlur?: number,
    shadowOffsetX?: number,
    shadowOffsetY?: number,
    opacity?: number,
    glowEnabled?: boolean,
    glowColor?: string,
    glowBlur?: number,
    strokeColor?: string,
    strokeWidth?: number,
  ) => {
    if (selectedShape) {
      // 잠금된 도형은 속성 변경 불가능
      if (selectedShape.locked) {
        return;
      }
      // 선택된 도형의 현재 값을 기본값으로 사용 (state가 아닌 실제 도형 데이터 사용)
      const newColor = color ?? selectedShape.color;
      const newWidth = width ?? selectedShape.width;
      const newHeight = height ?? selectedShape.height;
      const newX = x ?? selectedShape.x;
      const newY = y ?? selectedShape.y;
      // 원의 경우 borderRadius를 undefined로 유지, 그 외에는 명시적으로 설정된 값 사용
      const newBorderRadius = borderRadius !== undefined 
        ? borderRadius 
        : selectedShape.type === "circle" || selectedShape.type === "ellipse"
          ? undefined 
          : (selectedShape.borderRadius ?? 0);

      const updatedShape = {
        ...selectedShape,
        color: newColor,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
        borderRadius: newBorderRadius,
        shadowType: shadowType !== undefined ? shadowType : selectedShape.shadowType,
        shadowColor: shadowColor !== undefined ? shadowColor : selectedShape.shadowColor,
        shadowBlur: shadowBlur !== undefined ? shadowBlur : selectedShape.shadowBlur,
        shadowOffsetX: shadowOffsetX !== undefined ? shadowOffsetX : selectedShape.shadowOffsetX,
        shadowOffsetY: shadowOffsetY !== undefined ? shadowOffsetY : selectedShape.shadowOffsetY,
        opacity: opacity !== undefined ? opacity : selectedShape.opacity,
        glowEnabled: glowEnabled !== undefined ? glowEnabled : selectedShape.glowEnabled,
        glowColor: glowColor !== undefined ? glowColor : selectedShape.glowColor,
        glowBlur: glowBlur !== undefined ? glowBlur : selectedShape.glowBlur,
        strokeColor: strokeColor !== undefined ? strokeColor : selectedShape.strokeColor,
        strokeWidth: strokeWidth !== undefined ? strokeWidth : selectedShape.strokeWidth,
      };

      setShapes(
        shapes.map((shape) =>
          shape.id === selectedShape.id ? updatedShape : shape
        )
      );
      setSelectedShape(updatedShape);
      // state도 업데이트하여 UI 동기화
      setShapeColor(newColor);
      setShapeWidth(newWidth);
      setShapeHeight(newHeight);
      // setShapeX(newX); // Not used
      // setShapeY(newY); // Not used
      setShapeBorderRadius(newBorderRadius ?? 0);
      setBorderRadiusInputValue((newBorderRadius ?? 0).toString());
    }
  };

  // z-index 조정 함수들
  const bringToFront = () => {
    if (selectedShape) {
      setShapes(prevShapes => {
        const maxShapeZIndex = prevShapes.length > 0 ? Math.max(...prevShapes.map(s => s.zIndex)) : 0;
        const maxTextZIndex = texts.length > 0 ? Math.max(...texts.map(t => t.zIndex)) : 0;
        const maxZIndex = Math.max(maxShapeZIndex, maxTextZIndex);
        const updatedShape = { ...selectedShape, zIndex: maxZIndex + 1 };
        const newShapes = prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
        setSelectedShape(updatedShape);
        return newShapes;
      });
    } else if (selectedText) {
      setTexts(prevTexts => {
        const maxShapeZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex)) : 0;
        const maxTextZIndex = prevTexts.length > 0 ? Math.max(...prevTexts.map(t => t.zIndex)) : 0;
        const maxZIndex = Math.max(maxShapeZIndex, maxTextZIndex);
        const updatedText = { ...selectedText, zIndex: maxZIndex + 1 };
        const newTexts = prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
        setSelectedText(updatedText);
        return newTexts;
      });
    }
  };

  const bringForward = () => {
    if (selectedShape) {
      setShapes(prevShapes => {
        // 도형과 텍스트를 통합하여 현재 zIndex보다 큰 zIndex를 가진 요소들 중 가장 작은 값 찾기
        const allItems = [
          ...prevShapes.filter(s => s.id !== selectedShape.id),
          ...texts
        ];
        const higherZIndices = allItems
          .filter(item => item.zIndex > selectedShape.zIndex)
          .map(item => item.zIndex);
        
        if (higherZIndices.length === 0) {
          // 더 높은 zIndex가 없으면 최대값 + 1
          const maxShapeZIndex = prevShapes.length > 0 ? Math.max(...prevShapes.map(s => s.zIndex)) : 0;
          const maxTextZIndex = texts.length > 0 ? Math.max(...texts.map(t => t.zIndex)) : 0;
          const maxZIndex = Math.max(maxShapeZIndex, maxTextZIndex);
          const updatedShape = { ...selectedShape, zIndex: maxZIndex + 1 };
          const newShapes = prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
          setSelectedShape(updatedShape);
          return newShapes;
        } else {
          // 가장 작은 더 높은 zIndex로 교환
          const targetZIndex = Math.min(...higherZIndices);
          const targetShape = prevShapes.find(s => s.zIndex === targetZIndex);
          const targetText = texts.find(t => t.zIndex === targetZIndex);
          
          if (targetShape) {
            const updatedSelected = { ...selectedShape, zIndex: targetZIndex };
            const updatedTarget = { ...targetShape, zIndex: selectedShape.zIndex };
            const newShapes = prevShapes.map(s => 
              s.id === selectedShape.id ? updatedSelected : 
              s.id === targetShape.id ? updatedTarget : s
            );
            setSelectedShape(updatedSelected);
            return newShapes;
          } else if (targetText) {
            const updatedShape = { ...selectedShape, zIndex: targetZIndex };
            const updatedText = { ...targetText, zIndex: selectedShape.zIndex };
            setTexts(texts.map(t => t.id === targetText.id ? updatedText : t));
            setSelectedShape(updatedShape);
            return prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
          }
        }
        return prevShapes;
      });
    } else if (selectedText) {
      setTexts(prevTexts => {
        // 도형과 텍스트를 통합하여 현재 zIndex보다 큰 zIndex를 가진 요소들 중 가장 작은 값 찾기
        const allItems = [
          ...shapes,
          ...prevTexts.filter(t => t.id !== selectedText.id)
        ];
        const higherZIndices = allItems
          .filter(item => item.zIndex > selectedText.zIndex)
          .map(item => item.zIndex);
        
        if (higherZIndices.length === 0) {
          // 더 높은 zIndex가 없으면 최대값 + 1
          const maxShapeZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex)) : 0;
          const maxTextZIndex = prevTexts.length > 0 ? Math.max(...prevTexts.map(t => t.zIndex)) : 0;
          const maxZIndex = Math.max(maxShapeZIndex, maxTextZIndex);
          const updatedText = { ...selectedText, zIndex: maxZIndex + 1 };
          const newTexts = prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
          setSelectedText(updatedText);
          return newTexts;
        } else {
          // 가장 작은 더 높은 zIndex로 교환
          const targetZIndex = Math.min(...higherZIndices);
          const targetShape = shapes.find(s => s.zIndex === targetZIndex);
          const targetText = prevTexts.find(t => t.zIndex === targetZIndex);
          
          if (targetShape) {
            const updatedText = { ...selectedText, zIndex: targetZIndex };
            const updatedShape = { ...targetShape, zIndex: selectedText.zIndex };
            setShapes(shapes.map(s => s.id === targetShape.id ? updatedShape : s));
            setSelectedText(updatedText);
            return prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
          } else if (targetText) {
            const updatedSelected = { ...selectedText, zIndex: targetZIndex };
            const updatedTarget = { ...targetText, zIndex: selectedText.zIndex };
            const newTexts = prevTexts.map(t => 
              t.id === selectedText.id ? updatedSelected : 
              t.id === targetText.id ? updatedTarget : t
            );
            setSelectedText(updatedSelected);
            return newTexts;
          }
        }
        return prevTexts;
      });
    }
  };

  const sendBackward = () => {
    if (selectedShape) {
      setShapes(prevShapes => {
        // 도형과 텍스트를 통합하여 현재 zIndex보다 작은 zIndex를 가진 요소들 중 가장 큰 값 찾기 (최소 1)
        const allItems = [
          ...prevShapes.filter(s => s.id !== selectedShape.id),
          ...texts
        ];
        const lowerZIndices = allItems
          .filter(item => item.zIndex < selectedShape.zIndex && item.zIndex >= 1)
          .map(item => item.zIndex);
        
        if (lowerZIndices.length === 0) {
          // 더 낮은 zIndex가 없으면 최소값 - 1 (하지만 최소 1)
          const minShapeZIndex = prevShapes.length > 0 ? Math.min(...prevShapes.map(s => s.zIndex)) : 1;
          const minTextZIndex = texts.length > 0 ? Math.min(...texts.map(t => t.zIndex)) : 1;
          const minZIndex = Math.min(minShapeZIndex, minTextZIndex);
          const newZIndex = Math.max(1, minZIndex - 1);
          const updatedShape = { ...selectedShape, zIndex: newZIndex };
          const newShapes = prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
          setSelectedShape(updatedShape);
          return newShapes;
        } else {
          // 가장 큰 더 낮은 zIndex로 교환
          const targetZIndex = Math.max(...lowerZIndices);
          const targetShape = prevShapes.find(s => s.zIndex === targetZIndex);
          const targetText = texts.find(t => t.zIndex === targetZIndex);
          
          if (targetShape) {
            const updatedSelected = { ...selectedShape, zIndex: targetZIndex };
            const updatedTarget = { ...targetShape, zIndex: selectedShape.zIndex };
            const newShapes = prevShapes.map(s => 
              s.id === selectedShape.id ? updatedSelected : 
              s.id === targetShape.id ? updatedTarget : s
            );
            setSelectedShape(updatedSelected);
            return newShapes;
          } else if (targetText) {
            const updatedShape = { ...selectedShape, zIndex: targetZIndex };
            const updatedText = { ...targetText, zIndex: selectedShape.zIndex };
            setTexts(texts.map(t => t.id === targetText.id ? updatedText : t));
            setSelectedShape(updatedShape);
            return prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
          }
        }
        return prevShapes;
      });
    } else if (selectedText) {
      setTexts(prevTexts => {
        // 도형과 텍스트를 통합하여 현재 zIndex보다 작은 zIndex를 가진 요소들 중 가장 큰 값 찾기 (최소 1)
        const allItems = [
          ...shapes,
          ...prevTexts.filter(t => t.id !== selectedText.id)
        ];
        const lowerZIndices = allItems
          .filter(item => item.zIndex < selectedText.zIndex && item.zIndex >= 1)
          .map(item => item.zIndex);
        
        if (lowerZIndices.length === 0) {
          // 더 낮은 zIndex가 없으면 최소값 - 1 (하지만 최소 1)
          const minShapeZIndex = shapes.length > 0 ? Math.min(...shapes.map(s => s.zIndex)) : 1;
          const minTextZIndex = prevTexts.length > 0 ? Math.min(...prevTexts.map(t => t.zIndex)) : 1;
          const minZIndex = Math.min(minShapeZIndex, minTextZIndex);
          const newZIndex = Math.max(1, minZIndex - 1);
          const updatedText = { ...selectedText, zIndex: newZIndex };
          const newTexts = prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
          setSelectedText(updatedText);
          return newTexts;
        } else {
          // 가장 큰 더 낮은 zIndex로 교환
          const targetZIndex = Math.max(...lowerZIndices);
          const targetShape = shapes.find(s => s.zIndex === targetZIndex);
          const targetText = prevTexts.find(t => t.zIndex === targetZIndex);
          
          if (targetShape) {
            const updatedText = { ...selectedText, zIndex: targetZIndex };
            const updatedShape = { ...targetShape, zIndex: selectedText.zIndex };
            setShapes(shapes.map(s => s.id === targetShape.id ? updatedShape : s));
            setSelectedText(updatedText);
            return prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
          } else if (targetText) {
            const updatedSelected = { ...selectedText, zIndex: targetZIndex };
            const updatedTarget = { ...targetText, zIndex: selectedText.zIndex };
            const newTexts = prevTexts.map(t => 
              t.id === selectedText.id ? updatedSelected : 
              t.id === targetText.id ? updatedTarget : t
            );
            setSelectedText(updatedSelected);
            return newTexts;
          }
        }
        return prevTexts;
      });
    }
  };

  const sendToBack = () => {
    if (selectedShape) {
      setShapes(prevShapes => {
        // 도형과 텍스트를 통합하여 최소값 계산 (최소 1, 캔버스가 0)
        const minShapeZIndex = prevShapes.length > 0 ? Math.min(...prevShapes.map(s => s.zIndex)) : 1;
        const minTextZIndex = texts.length > 0 ? Math.min(...texts.map(t => t.zIndex)) : 1;
        const minZIndex = Math.min(minShapeZIndex, minTextZIndex);
        // 최소값이 1보다 작으면 1로, 그렇지 않으면 최소값 - 1 (하지만 최소 1)
        const newZIndex = Math.max(1, minZIndex - 1);
        const updatedShape = { ...selectedShape, zIndex: newZIndex };
        const newShapes = prevShapes.map(s => s.id === selectedShape.id ? updatedShape : s);
        setSelectedShape(updatedShape);
        return newShapes;
      });
    } else if (selectedText) {
      setTexts(prevTexts => {
        // 도형과 텍스트를 통합하여 최소값 계산 (최소 1, 캔버스가 0)
        const minShapeZIndex = shapes.length > 0 ? Math.min(...shapes.map(s => s.zIndex)) : 1;
        const minTextZIndex = prevTexts.length > 0 ? Math.min(...prevTexts.map(t => t.zIndex)) : 1;
        const minZIndex = Math.min(minShapeZIndex, minTextZIndex);
        // 최소값이 1보다 작으면 1로, 그렇지 않으면 최소값 - 1 (하지만 최소 1)
        const newZIndex = Math.max(1, minZIndex - 1);
        const updatedText = { ...selectedText, zIndex: newZIndex };
        const newTexts = prevTexts.map(t => t.id === selectedText.id ? updatedText : t);
        setSelectedText(updatedText);
        return newTexts;
      });
    }
  };

  // 그룹 바운딩 박스 업데이트 함수
  const updateGroupBounds = (group: Group) => {
    const groupShapes = shapes.filter(s => group.shapeIds.includes(s.id));
    const groupTexts = texts.filter(t => group.textIds.includes(t.id));
    
    if (groupShapes.length === 0 && groupTexts.length === 0) {
      return group;
    }
    
    const allItems = [...groupShapes, ...groupTexts];
    const minX = Math.min(...allItems.map(item => item.x));
    const minY = Math.min(...allItems.map(item => item.y));
    const maxX = Math.max(...allItems.map(item => item.x + item.width));
    const maxY = Math.max(...allItems.map(item => item.y + item.height));
    
    return {
      ...group,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  
  // 그룹 생성 함수
  const createGroup = () => {
    // 최소 2개 이상 선택되어야 그룹화 가능
    const totalSelected = selectedShapeIds.size + selectedTextIds.size;
    if (totalSelected < 2) {
      return;
    }
    
    // 선택된 요소들의 바운딩 박스 계산
    const selectedShapes = shapes.filter(s => selectedShapeIds.has(s.id));
    const selectedTexts = texts.filter(t => selectedTextIds.has(t.id));
    
    if (selectedShapes.length === 0 && selectedTexts.length === 0) {
      return;
    }
    
    const allItems = [...selectedShapes, ...selectedTexts];
    const minX = Math.min(...allItems.map(item => item.x));
    const minY = Math.min(...allItems.map(item => item.y));
    const maxX = Math.max(...allItems.map(item => item.x + item.width));
    const maxY = Math.max(...allItems.map(item => item.y + item.height));
    
    // 생성 순서에 따라 zIndex 설정
    const allGroupItems = [
      ...groupsArray.map(g => ({ id: g.id, type: 'group' as const })),
      ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
      ...texts.map(t => ({ id: t.id, type: 'text' as const }))
    ].sort((a, b) => a.id - b.id);
    
    const newGroup: Group = {
      id: Date.now(),
      shapeIds: Array.from(selectedShapeIds),
      textIds: Array.from(selectedTextIds),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      zIndex: allGroupItems.length + 1,
    };
    
    setGroups([...groupsArray, newGroup]);
    setSelectedGroup(newGroup);
    setSelectedShape(null);
    setSelectedText(null);
    setSelectedShapeIds(new Set());
    setSelectedTextIds(new Set());
  };
  
  // 그룹 해제 함수
  const ungroup = () => {
    if (!selectedGroup) return;
    
    // 그룹 해제: 그룹 삭제하고 요소들은 그대로 유지
    setGroups(groupsArray.filter(g => g.id !== selectedGroup.id));
    setSelectedGroup(null);
    setSelectedShape(null);
    setSelectedText(null);
    setSelectedShapeIds(new Set());
    setSelectedTextIds(new Set());
  };
  
  const handleMouseDown = (e: React.MouseEvent, shape: Shape) => {
    // 도형 추가 모드일 때는 이벤트를 캔버스까지 전파하여 도형 생성 가능하도록 함
    if (pendingShapeType) {
      return; // stopPropagation을 호출하지 않아 이벤트가 캔버스까지 전파됨
    }
    e.stopPropagation();
    
    // 잠금된 도형은 드래그/리사이즈 불가능
    if (shape.locked) {
      setSelectedShape(shape);
      return;
    }
    
    const target = e.target as HTMLElement;
    
    // 그룹에 속한 도형인지 확인
    const group = groupsArray.find(g => g.shapeIds.includes(shape.id));
    
    // 그룹에 속한 도형은 리사이즈 불가
    if (group && target.classList.contains("resize-handle")) {
      // 그룹에 속한 도형 클릭 시 그룹만 선택
      const updatedGroup = updateGroupBounds(group);
      setSelectedGroup(updatedGroup);
      setSelectedShape(null);
      setSelectedText(null);
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - updatedGroup.x;
        const offsetY = e.clientY - rect.top - updatedGroup.y;
        setDragOffset({ x: offsetX, y: offsetY });
        setIsDragging(true);
        
        // 그룹 드래그 시작 시 초기 위치 저장 (상대 위치 유지를 위해)
        const shapePositions = new Map<number, { x: number; y: number }>();
        const textPositions = new Map<number, { x: number; y: number }>();
        shapes.forEach(shape => {
          if (updatedGroup.shapeIds.includes(shape.id)) {
            shapePositions.set(shape.id, { x: shape.x, y: shape.y });
          }
        });
        texts.forEach(text => {
          if (updatedGroup.textIds.includes(text.id)) {
            textPositions.set(text.id, { x: text.x, y: text.y });
          }
        });
        setGroupDragStart({
          groupX: updatedGroup.x,
          groupY: updatedGroup.y,
          shapePositions,
          textPositions,
        });
      }
      return;
    }
    
    // 리사이즈 핸들 클릭인지 확인 (그룹에 속하지 않은 도형만)
    if (target.classList.contains("resize-handle") && !group) {
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
        // setShapeX(shape.x); // Not used
        // setShapeY(shape.y); // Not used
        const borderRadius = shape.borderRadius ?? (shape.type === "circle" || shape.type === "ellipse" ? Math.min(shape.width, shape.height) / 2 : 0);
        setShapeBorderRadius(borderRadius);
        setBorderRadiusInputValue(borderRadius.toString());
        setPendingShapeType(null); // 도형 선택 시 추가 모드 해제
      }
      return;
    }
    
    if (group && !e.ctrlKey && !e.metaKey) {
      // 그룹에 속한 도형 클릭 시 그룹만 선택 (개별 요소는 선택/드래그 불가)
      e.stopPropagation();
      const updatedGroup = updateGroupBounds(group);
      setSelectedGroup(updatedGroup);
      setSelectedShape(null);
      setSelectedText(null);
      setSelectedShapeIds(new Set());
      setSelectedTextIds(new Set());
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - updatedGroup.x;
        const offsetY = e.clientY - rect.top - updatedGroup.y;
        setDragOffset({ x: offsetX, y: offsetY });
        setIsDragging(true);
        
        // 그룹 드래그 시작 시 초기 위치 저장 (상대 위치 유지를 위해)
        const shapePositions = new Map<number, { x: number; y: number }>();
        const textPositions = new Map<number, { x: number; y: number }>();
        shapes.forEach(shape => {
          if (updatedGroup.shapeIds.includes(shape.id)) {
            shapePositions.set(shape.id, { x: shape.x, y: shape.y });
          }
        });
        texts.forEach(text => {
          if (updatedGroup.textIds.includes(text.id)) {
            textPositions.set(text.id, { x: text.x, y: text.y });
          }
        });
        setGroupDragStart({
          groupX: updatedGroup.x,
          groupY: updatedGroup.y,
          shapePositions,
          textPositions,
        });
      }
      return;
    }
    
    // Ctrl+클릭: 다중 선택 (그룹에 속하지 않은 요소만)
    if (e.ctrlKey || e.metaKey) {
      if (!group) {
        const newSelectedShapeIds = new Set(selectedShapeIds);
        if (newSelectedShapeIds.has(shape.id)) {
          newSelectedShapeIds.delete(shape.id);
        } else {
          newSelectedShapeIds.add(shape.id);
        }
        setSelectedShapeIds(newSelectedShapeIds);
        setSelectedShape(null);
        setSelectedText(null);
        setSelectedGroup(null);
      }
    } else {
      // 일반 클릭: 단일 선택 (그룹에 속하지 않은 요소만)
      if (!group) {
        setSelectedShape(shape);
        setSelectedShapeIds(new Set([shape.id]));
        setSelectedTextIds(new Set());
        setSelectedText(null);
        setSelectedGroup(null);
      }
    }
    
    setShapeColor(shape.color);
    setShapeWidth(shape.width);
    setShapeHeight(shape.height);
        // setShapeX(shape.x); // Not used
        // setShapeY(shape.y); // Not used
    const borderRadius = shape.borderRadius ?? (shape.type === "roundedRectangle" ? 10 : 0);
    setShapeBorderRadius(borderRadius);
    setBorderRadiusInputValue(borderRadius.toString());
    setPendingShapeType(null); // 도형 선택 시 추가 모드 해제

    // 그룹에 속하지 않은 도형만 드래그 가능
    if (!group && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - shape.x;
      const offsetY = e.clientY - rect.top - shape.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDragging(true);
    }
  };

  const handleTextMouseDown = (e: React.MouseEvent, text: Text) => {
    e.stopPropagation();
    
    // 편집 모드가 아닐 때만 드래그 처리
    if (editingTextId === text.id) {
      return;
    }
    
    // 잠금된 텍스트는 드래그/리사이즈 불가능
    if (text.locked) {
      setSelectedText(text);
      return;
    }
    
    const target = e.target as HTMLElement;
    
    // 그룹에 속한 텍스트인지 확인
    const group = groupsArray.find(g => g.textIds.includes(text.id));
    
    // 그룹에 속한 텍스트는 리사이즈 불가
    if (group && target.classList.contains("text-resize-handle")) {
      // 그룹에 속한 텍스트 클릭 시 그룹만 선택
      const updatedGroup = updateGroupBounds(group);
      setSelectedGroup(updatedGroup);
      setSelectedText(null);
      setSelectedShape(null);
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - updatedGroup.x;
        const offsetY = e.clientY - rect.top - updatedGroup.y;
        setTextDragOffset({ x: offsetX, y: offsetY });
        setIsDraggingText(true);
        
        // 그룹 드래그 시작 시 초기 위치 저장 (상대 위치 유지를 위해)
        const shapePositions = new Map<number, { x: number; y: number }>();
        const textPositions = new Map<number, { x: number; y: number }>();
        shapes.forEach(shape => {
          if (updatedGroup.shapeIds.includes(shape.id)) {
            shapePositions.set(shape.id, { x: shape.x, y: shape.y });
          }
        });
        texts.forEach(text => {
          if (updatedGroup.textIds.includes(text.id)) {
            textPositions.set(text.id, { x: text.x, y: text.y });
          }
        });
        setGroupDragStart({
          groupX: updatedGroup.x,
          groupY: updatedGroup.y,
          shapePositions,
          textPositions,
        });
      }
      return;
    }
    
    // 리사이즈 핸들 클릭인지 확인 (그룹에 속하지 않은 텍스트만)
    if (target.classList.contains("text-resize-handle") && !group) {
      const handle = target.getAttribute("data-handle");
      if (handle && canvasRef.current) {
        setIsResizingText(true);
        setTextResizeHandle(handle);
        setTextResizeStart({
          x: e.clientX,
          y: e.clientY,
          width: text.width,
          height: text.height,
          textX: text.x,
          textY: text.y,
        });
        setSelectedText(text);
        setIsDraggingText(false);
      }
      return;
    }
    
    if (group && !e.ctrlKey && !e.metaKey) {
      // 그룹에 속한 텍스트 클릭 시 그룹만 선택 (개별 요소는 선택/드래그 불가)
      e.stopPropagation();
      const updatedGroup = updateGroupBounds(group);
      setSelectedGroup(updatedGroup);
      setSelectedText(null);
      setSelectedShape(null);
      setSelectedShapeIds(new Set());
      setSelectedTextIds(new Set());
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - updatedGroup.x;
        const offsetY = e.clientY - rect.top - updatedGroup.y;
        setTextDragOffset({ x: offsetX, y: offsetY });
        setIsDraggingText(true);
        
        // 그룹 드래그 시작 시 초기 위치 저장 (상대 위치 유지를 위해)
        const shapePositions = new Map<number, { x: number; y: number }>();
        const textPositions = new Map<number, { x: number; y: number }>();
        shapes.forEach(shape => {
          if (updatedGroup.shapeIds.includes(shape.id)) {
            shapePositions.set(shape.id, { x: shape.x, y: shape.y });
          }
        });
        texts.forEach(text => {
          if (updatedGroup.textIds.includes(text.id)) {
            textPositions.set(text.id, { x: text.x, y: text.y });
          }
        });
        setGroupDragStart({
          groupX: updatedGroup.x,
          groupY: updatedGroup.y,
          shapePositions,
          textPositions,
        });
      }
      return;
    }
    
    // Ctrl+클릭: 다중 선택 (그룹에 속하지 않은 요소만)
    if (e.ctrlKey || e.metaKey) {
      if (!group) {
        const newSelectedTextIds = new Set(selectedTextIds);
        if (newSelectedTextIds.has(text.id)) {
          newSelectedTextIds.delete(text.id);
        } else {
          newSelectedTextIds.add(text.id);
        }
        setSelectedTextIds(newSelectedTextIds);
        setSelectedText(null);
        setSelectedShape(null);
        setSelectedGroup(null);
      }
    } else {
      // 일반 클릭: 단일 선택 (그룹에 속하지 않은 요소만)
      if (!group) {
        setSelectedText(text);
        setSelectedTextIds(new Set([text.id]));
        setSelectedShapeIds(new Set());
        setSelectedShape(null);
        setSelectedGroup(null);
      }
    }
    
    setPendingShapeType(null);
    setPendingText(false);
    
    // 더블클릭이면 편집 모드로 전환하지 않고 드래그 시작 (그룹에 속하지 않은 텍스트만)
    if (e.detail === 1 && !group) {
      // 단일 클릭: 드래그 준비
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - text.x;
        const offsetY = e.clientY - rect.top - text.y;
        setTextDragOffset({ x: offsetX, y: offsetY });
        setIsDraggingText(true);
      }
    }
  };

  const handleTextDoubleClick = (e: React.MouseEvent, text: Text) => {
    e.stopPropagation();
    setEditingTextId(text.id);
    setSelectedText(text);
    setIsDraggingText(false);
  };

  const handleTextBlur = (textId: number) => {
    if (textInputRef.current) {
      const newText = textInputRef.current.innerText || textInputRef.current.textContent || "";
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === textId ? { ...t, text: newText } : t
        )
      );
    }
    setEditingTextId(null);
  };

  const handleTextInput = (textId: number) => {
    // 실시간으로 state 업데이트 (코드 반영을 위해)
    // 하지만 contentEditable의 내용은 직접 조작하지 않으므로 커서 위치는 유지됨
    if (textInputRef.current) {
      const newText = textInputRef.current.innerText || textInputRef.current.textContent || "";
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === textId ? { ...t, text: newText } : t
        )
      );
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent, textId: number) => {
    // Backspace와 Delete는 기본 동작을 허용 (커서 이동 방해하지 않음)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur(textId);
    } else if (e.key === "Escape") {
      setEditingTextId(null);
    }
    // Backspace와 Delete는 기본 동작을 그대로 사용
  };

  // Bold 토글 핸들러
  const handleBoldToggle = () => {
    if (selectedText && !selectedText.locked) {
      const newFontWeight = selectedText.fontWeight === "bold" ? "normal" : "bold";
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, fontWeight: newFontWeight } : t
        )
      );
      setSelectedText({ ...selectedText, fontWeight: newFontWeight });
    }
  };

  // Italic 토글 핸들러
  const handleItalicToggle = () => {
    if (selectedText && !selectedText.locked) {
      const newFontStyle = selectedText.fontStyle === "italic" ? "normal" : "italic";
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, fontStyle: newFontStyle } : t
        )
      );
      setSelectedText({ ...selectedText, fontStyle: newFontStyle });
    }
  };

  // 폰트 크기 감소 핸들러
  const handleFontSizeDecrease = () => {
    if (selectedText) {
      const newFontSize = Math.max(8, selectedText.fontSize - 1);
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, fontSize: newFontSize } : t
        )
      );
      setSelectedText({ ...selectedText, fontSize: newFontSize });
    }
  };

  // 폰트 크기 증가 핸들러
  const handleFontSizeIncrease = () => {
    if (selectedText) {
      const newFontSize = Math.min(200, selectedText.fontSize + 1);
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, fontSize: newFontSize } : t
        )
      );
      setSelectedText({ ...selectedText, fontSize: newFontSize });
    }
  };

  // 텍스트 정렬 핸들러
  const handleTextAlignLeft = () => {
    if (selectedText && !selectedText.locked) {
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, textAlign: "left" } : t
        )
      );
      setSelectedText({ ...selectedText, textAlign: "left" });
    }
  };

  const handleTextAlignCenter = () => {
    if (selectedText && !selectedText.locked) {
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, textAlign: "center" } : t
        )
      );
      setSelectedText({ ...selectedText, textAlign: "center" });
    }
  };

  const handleTextAlignRight = () => {
    if (selectedText && !selectedText.locked) {
      setTexts((prevTexts) =>
        prevTexts.map((t) =>
          t.id === selectedText.id ? { ...t, textAlign: "right" } : t
        )
      );
      setSelectedText({ ...selectedText, textAlign: "right" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 텍스트 리사이즈 처리
    if (isResizingText && selectedText && textResizeHandle && canvasRef.current) {
      // 잠금된 텍스트는 리사이즈 불가능
      if (selectedText.locked) {
        return;
      }
      
      // 그룹에 속한 텍스트는 리사이즈 불가
      const group = groupsArray.find(g => g.textIds.includes(selectedText.id));
      if (group) {
        return;
      }
      
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - textResizeStart.x;
      const deltaY = e.clientY - textResizeStart.y;
      
      let newWidth = textResizeStart.width;
      let newHeight = textResizeStart.height;
      let newX = selectedText.x;
      let newY = selectedText.y;

      // 리사이즈 핸들에 따라 크기 조절
      if (textResizeHandle === "nw") {
        newWidth = Math.max(50, textResizeStart.width - deltaX);
        newHeight = Math.max(30, textResizeStart.height - deltaY);
        newX = textResizeStart.textX + (textResizeStart.width - newWidth);
        newY = textResizeStart.textY + (textResizeStart.height - newHeight);
      } else if (textResizeHandle === "ne") {
        newWidth = Math.max(50, textResizeStart.width + deltaX);
        newHeight = Math.max(30, textResizeStart.height - deltaY);
        newX = textResizeStart.textX;
        newY = textResizeStart.textY + (textResizeStart.height - newHeight);
      } else if (textResizeHandle === "sw") {
        newWidth = Math.max(50, textResizeStart.width - deltaX);
        newHeight = Math.max(30, textResizeStart.height + deltaY);
        newX = textResizeStart.textX + (textResizeStart.width - newWidth);
        newY = textResizeStart.textY;
      } else if (textResizeHandle === "se") {
        newWidth = Math.max(50, textResizeStart.width + deltaX);
        newHeight = Math.max(30, textResizeStart.height + deltaY);
        newX = textResizeStart.textX;
        newY = textResizeStart.textY;
      } else if (textResizeHandle === "e") {
        newWidth = Math.max(50, textResizeStart.width + deltaX);
        newX = textResizeStart.textX;
        newY = textResizeStart.textY;
      } else if (textResizeHandle === "w") {
        newWidth = Math.max(50, textResizeStart.width - deltaX);
        newX = textResizeStart.textX + (textResizeStart.width - newWidth);
        newY = textResizeStart.textY;
      } else if (textResizeHandle === "s") {
        newHeight = Math.max(30, textResizeStart.height + deltaY);
        newX = textResizeStart.textX;
        newY = textResizeStart.textY;
      } else if (textResizeHandle === "n") {
        newHeight = Math.max(30, textResizeStart.height - deltaY);
        newX = textResizeStart.textX;
        newY = textResizeStart.textY + (textResizeStart.height - newHeight);
      }

      // 캔버스 경계 체크
      const maxX = rect.width - newX;
      const maxY = rect.height - newY;
      newWidth = Math.min(newWidth, maxX);
      newHeight = Math.min(newHeight, maxY);

      const updatedText = {
        ...selectedText,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      };

      setTexts(texts.map((t) => (t.id === selectedText.id ? updatedText : t)));
      setSelectedText(updatedText);
      return;
    }
    
    // 그룹 드래그 처리 (텍스트 드래그로 처리)
    if (isDraggingText && selectedGroup && canvasRef.current && groupDragStart) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newGroupX = e.clientX - rect.left - textDragOffset.x;
      const newGroupY = e.clientY - rect.top - textDragOffset.y;
      
      // 그룹의 이동 거리 계산
      let deltaX = newGroupX - groupDragStart.groupX;
      let deltaY = newGroupY - groupDragStart.groupY;
      
      // 그룹 바운딩 박스를 기준으로 경계 체크 (그룹 전체가 경계 내에 있도록)
      const minGroupX = groupDragStart.groupX + deltaX;
      const minGroupY = groupDragStart.groupY + deltaY;
      const maxGroupX = minGroupX + selectedGroup.width;
      const maxGroupY = minGroupY + selectedGroup.height;
      
      // 경계를 벗어나면 delta 조정 (그룹 전체가 경계 내에 있도록)
      if (minGroupX < 0) {
        deltaX = -groupDragStart.groupX;
      } else if (maxGroupX > rect.width) {
        deltaX = rect.width - groupDragStart.groupX - selectedGroup.width;
      }
      
      if (minGroupY < 0) {
        deltaY = -groupDragStart.groupY;
      } else if (maxGroupY > rect.height) {
        deltaY = rect.height - groupDragStart.groupY - selectedGroup.height;
      }
      
      // 그룹 내 모든 도형 이동 (초기 위치 기준으로 상대 위치 유지, 같은 delta만큼 이동)
      const updatedShapes = shapes.map(shape => {
        if (selectedGroup.shapeIds.includes(shape.id)) {
          const initialPos = groupDragStart.shapePositions.get(shape.id);
          if (initialPos) {
            return { ...shape, x: initialPos.x + deltaX, y: initialPos.y + deltaY };
          }
        }
        return shape;
      });
      
      // 그룹 내 모든 텍스트 이동 (초기 위치 기준으로 상대 위치 유지, 같은 delta만큼 이동)
      const updatedTexts = texts.map(text => {
        if (selectedGroup.textIds.includes(text.id)) {
          const initialPos = groupDragStart.textPositions.get(text.id);
          if (initialPos) {
            return { ...text, x: initialPos.x + deltaX, y: initialPos.y + deltaY };
          }
        }
        return text;
      });
      
      // 그룹 위치 업데이트
      const updatedGroup = {
        ...selectedGroup,
        x: groupDragStart.groupX + deltaX,
        y: groupDragStart.groupY + deltaY,
      };
      
      // 그룹 바운딩 박스 업데이트
      const finalGroup = updateGroupBounds(updatedGroup);
      
      setShapes(updatedShapes);
      setTexts(updatedTexts);
      setGroups(groupsArray.map(g => g.id === selectedGroup.id ? finalGroup : g));
      setSelectedGroup(finalGroup);
      return;
    }
    
    // 편집 모드가 아닐 때만 텍스트 드래그 처리
    if (isDraggingText && selectedText && canvasRef.current && editingTextId !== selectedText.id) {
      // 잠금된 텍스트는 드래그 불가능
      if (selectedText.locked) {
        return;
      }
      
      // 그룹에 속한 텍스트는 개별 드래그 불가
      const group = groupsArray.find(g => g.textIds.includes(selectedText.id));
      if (group) {
        return;
      }
      
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - textDragOffset.x;
      const newY = e.clientY - rect.top - textDragOffset.y;
      
      const updatedText = {
        ...selectedText,
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      };
      
      setTexts(texts.map((t) => (t.id === selectedText.id ? updatedText : t)));
      setSelectedText(updatedText);
      return;
    }
    
    // 올가미 선택 중일 때
    if (isSelecting && selectionBox && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const x = Math.min(selectionBox.x, currentX);
      const y = Math.min(selectionBox.y, currentY);
      const width = Math.abs(currentX - selectionBox.x);
      const height = Math.abs(currentY - selectionBox.y);
      
      setSelectionBox({ x, y, width, height });
      return;
    }
    
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
      // 잠금된 도형은 리사이즈 불가능
      if (selectedShape.locked) {
        return;
      }
      
      // 그룹에 속한 도형은 리사이즈 불가
      const group = groupsArray.find(g => g.shapeIds.includes(selectedShape.id));
      if (group) {
        return;
      }
      
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.shapeX;
      let newY = resizeStart.shapeY;

      // 리사이즈 핸들에 따라 크기 조절
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
      } else if (resizeHandle === "e") {
          newWidth = Math.max(20, resizeStart.width + deltaX);
        newX = resizeStart.shapeX;
        newY = resizeStart.shapeY;
        } else if (resizeHandle === "w") {
          newWidth = Math.max(20, resizeStart.width - deltaX);
          newX = resizeStart.shapeX + (resizeStart.width - newWidth);
        newY = resizeStart.shapeY;
      } else if (resizeHandle === "s") {
          newHeight = Math.max(20, resizeStart.height + deltaY);
        newX = resizeStart.shapeX;
        newY = resizeStart.shapeY;
        } else if (resizeHandle === "n") {
          newHeight = Math.max(20, resizeStart.height - deltaY);
        newX = resizeStart.shapeX;
          newY = resizeStart.shapeY + (resizeStart.height - newHeight);
      }

      // 캔버스 경계 체크
      const maxX = rect.width - newX;
      const maxY = rect.height - newY;
      newWidth = Math.min(newWidth, maxX);
      newHeight = Math.min(newHeight, maxY);

      setShapeWidth(newWidth);
      setShapeHeight(newHeight);
      // setShapeX(newX); // Not used
      // setShapeY(newY); // Not used

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
    } else if (isDragging && selectedGroup && canvasRef.current && groupDragStart) {
      // 그룹 드래그: 그룹 내 모든 요소를 함께 이동 (상대 위치 유지)
      const rect = canvasRef.current.getBoundingClientRect();
      const newGroupX = e.clientX - rect.left - dragOffset.x;
      const newGroupY = e.clientY - rect.top - dragOffset.y;
      
      // 그룹의 이동 거리 계산
      let deltaX = newGroupX - groupDragStart.groupX;
      let deltaY = newGroupY - groupDragStart.groupY;
      
      // 그룹 바운딩 박스를 기준으로 경계 체크 (그룹 전체가 경계 내에 있도록)
      const minGroupX = groupDragStart.groupX + deltaX;
      const minGroupY = groupDragStart.groupY + deltaY;
      const maxGroupX = minGroupX + selectedGroup.width;
      const maxGroupY = minGroupY + selectedGroup.height;
      
      // 경계를 벗어나면 delta 조정 (그룹 전체가 경계 내에 있도록)
      if (minGroupX < 0) {
        deltaX = -groupDragStart.groupX;
      } else if (maxGroupX > rect.width) {
        deltaX = rect.width - groupDragStart.groupX - selectedGroup.width;
      }
      
      if (minGroupY < 0) {
        deltaY = -groupDragStart.groupY;
      } else if (maxGroupY > rect.height) {
        deltaY = rect.height - groupDragStart.groupY - selectedGroup.height;
      }
      
      // 그룹 내 모든 도형 이동 (초기 위치 기준으로 상대 위치 유지, 같은 delta만큼 이동)
      const updatedShapes = shapes.map(shape => {
        if (selectedGroup.shapeIds.includes(shape.id)) {
          const initialPos = groupDragStart.shapePositions.get(shape.id);
          if (initialPos) {
            return { ...shape, x: initialPos.x + deltaX, y: initialPos.y + deltaY };
          }
        }
        return shape;
      });
      
      // 그룹 내 모든 텍스트 이동 (초기 위치 기준으로 상대 위치 유지, 같은 delta만큼 이동)
      const updatedTexts = texts.map(text => {
        if (selectedGroup.textIds.includes(text.id)) {
          const initialPos = groupDragStart.textPositions.get(text.id);
          if (initialPos) {
            return { ...text, x: initialPos.x + deltaX, y: initialPos.y + deltaY };
          }
        }
        return text;
      });
      
      // 그룹 위치 업데이트
      const updatedGroup = {
        ...selectedGroup,
        x: groupDragStart.groupX + deltaX,
        y: groupDragStart.groupY + deltaY,
      };
      
      // 그룹 바운딩 박스 업데이트
      const finalGroup = updateGroupBounds(updatedGroup);
      
      setShapes(updatedShapes);
      setTexts(updatedTexts);
      setGroups(groupsArray.map(g => g.id === selectedGroup.id ? finalGroup : g));
      setSelectedGroup(finalGroup);
      return;
    } else if (isDragging && selectedShape && canvasRef.current) {
      // 잠금된 도형은 드래그 불가능
      if (selectedShape.locked) {
        return;
      }
      
      // 그룹에 속한 도형은 개별 드래그 불가
      const group = groupsArray.find(g => g.shapeIds.includes(selectedShape.id));
      if (group) {
        return;
      }
      
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;

      // 캔버스 경계 내로 제한
      const maxX = rect.width - selectedShape.width;
      const maxY = rect.height - selectedShape.height;
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      // setShapeX(constrainedX); // Not used
      // setShapeY(constrainedY); // Not used

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
    setIsDraggingText(false);
    setIsResizing(false);
    setIsResizingText(false);
    setResizeHandle(null);
    setTextResizeHandle(null);
    setGroupDragStart(null);
  };

  return (
    <div className="h-screen flex bg-black dark:bg-black">
      {/* 왼쪽 패널: 파일 탐색기 */}
      <FileExplorer 
        files={files}
        activeFile={activeFile}
        onFileClick={handleFileClick}
      />

      {/* 중간 패널: 파워포인트 스타일 캔버스 */}
      <div className="flex-1 flex flex-col bg-black dark:bg-black border-r border-pink-300/30 dark:border-pink-300/20/30">
        {/* 상단 리본 바 */}
        <div className="bg-black dark:bg-black border-b border-pink-300/30 dark:border-pink-300/20/30 px-4 py-3 flex items-center gap-4">
          {/* 아이콘 버튼 그룹 */}
          <div className="flex items-center gap-0.5">
            {/* 텍스트 추가 버튼 */}
            <button 
              onClick={handleAddText}
              className={`p-3 rounded flex items-center justify-center ${
                pendingText
                  ? "bg-gray-800 dark:bg-gray-800 text-white"
                  : "bg-black dark:bg-black text-white hover:bg-gray-800 dark:hover:bg-gray-800"
              } transition-colors cursor-pointer`}
            >
              <img src={newtextIcon} alt="New Text" className="w-14 h-auto" />
            </button>

            {/* 도형 추가 버튼 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                className={`p-3 rounded flex items-center justify-center ${
                  pendingShapeType
                    ? "bg-gray-800 dark:bg-gray-800 text-white"
                    : "bg-black dark:bg-black text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                }`}
              >
                <img src={newshapeIcon} alt="New Shape" className="w-16 h-auto" />
              </button>
              {showShapeMenu && (
                <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 min-w-[200px] max-h-[400px] overflow-y-auto">
                  {/* Rectangles */}
                  <div className="px-3 py-1 text-xs text-gray-400 border-b border-pink-300/10">
                    Rectangles
                  </div>
                  <div className="flex gap-1 p-2">
                    <button
                      onClick={() => {
                        setPendingShapeType("rectangle");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Rectangle"
                    >
                      <div className="w-8 h-8 bg-pink-300 rounded-sm"></div>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("roundedRectangle");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Rounded Rectangle"
                    >
                      <div className="w-8 h-8 bg-pink-300 rounded"></div>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("parallelogram");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Parallelogram"
                    >
                      <div className="w-8 h-8 bg-pink-300" style={{ transform: "skew(-20deg)" }}></div>
                    </button>
                  </div>
                  
                  {/* Circles */}
                  <div className="px-3 py-1 text-xs text-gray-400 border-b border-pink-300/10">
                    Circles
                  </div>
                  <div className="flex gap-1 p-2">
                    <button
                      onClick={() => {
                        setPendingShapeType("circle");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Circle"
                    >
                      <div className="w-8 h-8 bg-pink-300 rounded-full"></div>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("ellipse");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Ellipse"
                    >
                      <div className="w-10 h-8 bg-pink-300 rounded-full"></div>
                    </button>
                  </div>
                  
                  {/* Polygons */}
                  <div className="px-3 py-1 text-xs text-gray-400 border-b border-pink-300/10">
                    Polygons
                  </div>
                  <div className="flex gap-1 p-2">
                    <button
                      onClick={() => {
                        setPendingShapeType("triangle");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Triangle"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        <polygon points="16,4 4,28 28,28" fill="#f9a8d4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("diamond");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Diamond"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        <polygon points="16,4 28,16 16,28 4,16" fill="#f9a8d4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("star");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Star"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        <polygon points="16,2 19.5,12.2 30,12.2 21.2,18.6 24.7,28.8 16,22.4 7.3,28.8 10.8,18.6 2,12.2 12.5,12.2" fill="#f9a8d4" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-1 p-2">
                    <button
                      onClick={() => {
                        setPendingShapeType("pentagon");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Pentagon"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        <polygon points="16,4 28,12 24,26 8,26 4,12" fill="#f9a8d4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setPendingShapeType("hexagon");
                        setShowShapeMenu(false);
                      }}
                      className="flex-1 p-2 hover:bg-gray-800 dark:hover:bg-gray-800 rounded flex items-center justify-center"
                      title="Hexagon"
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32">
                        <polygon points="16,4 24,8 28,16 24,24 16,28 8,24 4,16 8,8" fill="#f9a8d4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 이미지 추가 버튼 */}
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && canvasRef.current) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const originalImageUrl = event.target?.result as string;
                      const img = new Image();
                      img.onload = () => {
                        const rect = canvasRef.current?.getBoundingClientRect();
                        if (rect) {
                          // 이미지의 원본 비율 유지하면서 적절한 크기로 조정
                          const maxWidth = 400;
                          const maxHeight = 400;
                          let width = img.width;
                          let height = img.height;
                          
                          // 비율 유지하면서 최대 크기로 조정
                          if (width > maxWidth || height > maxHeight) {
                            const ratio = Math.min(maxWidth / width, maxHeight / height);
                            width = width * ratio;
                            height = height * ratio;
                          }
                          
                          // Canvas를 사용하여 이미지 압축
                          const canvas = document.createElement('canvas');
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            // JPEG로 압축 (품질 0.8)
                            const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
                            
                            // 생성 순서에 따라 zIndex 설정: 모든 요소(도형+텍스트)를 id(생성 시간) 순으로 정렬하여 순차적으로 zIndex 할당
                            const allItems = [
                              ...shapes.map(s => ({ id: s.id, type: 'shape' as const })),
                              ...texts.map(t => ({ id: t.id, type: 'text' as const }))
                            ].sort((a, b) => a.id - b.id);
                            
                            const newShape: Shape = {
                              id: Date.now(),
                              type: "image",
                              x: Math.max(0, (rect.width - width) / 2),
                              y: Math.max(0, (rect.height - height) / 2),
                              width: Math.max(50, width),
                              height: Math.max(50, height),
                              color: DEFAULT_SHAPE_COLOR,
                              zIndex: allItems.length + 1, // 생성 순서에 따라 zIndex 할당
                              imageUrl: compressedImageUrl,
                            };
                            setShapes([...shapes, newShape]);
                            setSelectedShape(newShape);
                          }
                        }
                      };
                      img.src = originalImageUrl;
                    };
                    reader.readAsDataURL(file);
                  }
                  // 같은 파일을 다시 선택할 수 있도록 reset
                  e.target.value = "";
                }}
              />
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="p-3 bg-black dark:bg-black rounded flex items-center justify-center text-white hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
              <img src={newimageIcon} alt="New Image" className="w-14 h-auto" />
            </button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-20 w-px bg-pink-300/30 dark:bg-pink-300/30"></div>

          {/* 텍스트 편집 칸 (두 줄로 배치) */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            {/* 첫 번째 줄: Font, Size */}
            <div className="flex items-center gap-2">
              <select className="px-2 py-1 bg-black dark:bg-black text-white border border-pink-300/20 rounded text-sm">
                <option className="bg-black text-white">Nanum Gothic</option>
              </select>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleFontSizeDecrease}
                  disabled={!selectedText || selectedText?.locked}
                  className={`px-2 py-1 bg-black dark:bg-black border border-pink-300/20 rounded text-sm flex items-center justify-center ${
                    !selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input 
                  type="number" 
                  value={selectedText?.fontSize || 16} 
                  disabled={!selectedText || selectedText?.locked}
                  onChange={(e) => {
                    if (selectedText && !selectedText.locked) {
                      const newFontSize = Math.max(8, Math.min(200, parseInt(e.target.value) || 16));
                      setTexts((prevTexts) =>
                        prevTexts.map((t) =>
                          t.id === selectedText.id ? { ...t, fontSize: newFontSize } : t
                        )
                      );
                      setSelectedText({ ...selectedText, fontSize: newFontSize });
                    }
                  }}
                  className={`w-9 px-1 py-1 bg-black dark:bg-black text-white border border-pink-300/20 rounded text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] ${
                    !selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <button 
                  onClick={handleFontSizeIncrease}
                  disabled={!selectedText || selectedText?.locked}
                  className={`px-2 py-1 bg-black dark:bg-black border border-pink-300/20 rounded text-sm flex items-center justify-center ${
                    !selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 두 번째 줄: Text Color, B, I */}
            <div className="flex items-center gap-2">
              {/* Text Color 버튼 (아이콘 + 텍스트 + 드롭다운) */}
              <div className="relative" ref={textColorMenuRef}>
                <button 
                  onClick={() => setShowTextColorMenu(!showTextColorMenu)}
                  disabled={!selectedText || selectedText?.locked}
                  className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                    !selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                  <img src={textColorIcon} alt="Text Color" className="w-auto h-4" />
                  <span>Text Color</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTextColorMenu && !selectedText?.locked && (
                  <div 
                    className="absolute bottom-full left-0 mb-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedText ? (
                    <input
                      id="text-color-input-in-dropdown"
                      type="color"
                        value={selectedText.color}
                      onChange={(e) => {
                          if (selectedText && !selectedText.locked) {
                            const newColor = e.target.value;
                            setTextColor(newColor);
                            // 선택된 텍스트가 있으면 해당 텍스트의 색상도 변경
                            setTexts((prevTexts) =>
                              prevTexts.map((t) =>
                                t.id === selectedText.id ? { ...t, color: newColor } : t
                              )
                            );
                            setSelectedText({ ...selectedText, color: newColor });
                          }
                      }}
                        onClick={(e) => e.stopPropagation()}
                      className="h-32 w-full cursor-pointer"
                        style={{ 
                          border: 'none',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          background: 'transparent'
                        }}
                      />
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-8">
                        텍스트를 선택해주세요
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={handleBoldToggle}
                disabled={!selectedText || selectedText?.locked}
                className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 ${
                  selectedText?.fontWeight === "bold" ? "bg-gray-800" : ""
                } ${!selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
                style={{ fontWeight: "bold" }}
              >
                B
              </button>
              <button 
                onClick={handleItalicToggle}
                disabled={!selectedText || selectedText?.locked}
                className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 ${
                  selectedText?.fontStyle === "italic" ? "bg-gray-800" : ""
                } ${!selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
                style={{ fontStyle: "italic" }}
              >
                I
              </button>
            </div>
            {/* 세 번째 줄: 텍스트 정렬 버튼 */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleTextAlignLeft}
                disabled={!selectedText || selectedText?.locked}
                className={`px-2 py-1 bg-black dark:bg-black rounded text-sm border ${
                  selectedText?.textAlign === "left"
                    ? "border-pink-300 bg-pink-300/20"
                    : "border-pink-300/20"
                } ${!selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
              >
                <img src={alignLeftIcon} alt="Align Left" className="w-4 h-4" />
              </button>
              <button
                onClick={handleTextAlignCenter}
                disabled={!selectedText || selectedText?.locked}
                className={`px-2 py-1 bg-black dark:bg-black rounded text-sm border ${
                  selectedText?.textAlign === "center"
                    ? "border-pink-300 bg-pink-300/20"
                    : "border-pink-300/20"
                } ${!selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
              >
                <img src={alignCenterIcon} alt="Align Center" className="w-4 h-4" />
              </button>
              <button
                onClick={handleTextAlignRight}
                disabled={!selectedText || selectedText?.locked}
                className={`px-2 py-1 bg-black dark:bg-black rounded text-sm border ${
                  selectedText?.textAlign === "right"
                    ? "border-pink-300 bg-pink-300/20"
                    : "border-pink-300/20"
                } ${!selectedText || selectedText?.locked ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
              >
                <img src={alignRightIcon} alt="Align Right" className="w-4 h-4" />
              </button>
              {/* Lock 버튼 */}
              <button
                onClick={() => {
                  if (selectedText) {
                    const updatedText = {
                      ...selectedText,
                      locked: !selectedText.locked,
                    };
                    setTexts(
                      texts.map((t) =>
                        t.id === selectedText.id ? updatedText : t
                      )
                    );
                    setSelectedText(updatedText);
                  }
                }}
                disabled={!selectedText}
                className={`w-8 h-8 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center justify-center text-white hover:bg-gray-800 dark:hover:bg-gray-800 ${
                  selectedText?.locked ? "bg-pink-300/20" : ""
                } ${!selectedText ? "opacity-50 cursor-not-allowed" : ""}`}
                title={selectedText?.locked ? "Unlock" : "Lock"}
              >
                {selectedText?.locked ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-20 w-px bg-pink-300/30 dark:bg-pink-300/30"></div>

          {/* 도형 편집 칸 */}
          <div className="flex flex-col gap-2 min-w-[270px]">
            {/* 첫 번째 줄: Fill Color, Effects, Lock */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative" ref={shapeColorMenuRef}>
                <button 
                  onClick={() => {
                    if (selectedShape && selectedShape.type !== "image" && !selectedShape.locked) {
                      setShowShapeColorMenu(!showShapeColorMenu);
                    }
                  }}
                  disabled={!selectedShape || selectedShape.type === "image" || selectedShape.locked}
                  className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                    !selectedShape || selectedShape.type === "image" || selectedShape.locked
                      ? "text-gray-500 cursor-not-allowed opacity-50"
                      : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                    <img src={shapeColorIcon} alt="Shape Color" className="w-auto h-4" />
                    <span>Fill Color</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showShapeColorMenu && selectedShape && selectedShape.type !== "image" && !selectedShape.locked && (
                    <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 p-3">
                      <input
                        id="shape-color-input-in-dropdown"
                        type="color"
                        value={shapeColor}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          setShapeColor(newColor);
                          updateSelectedShape(newColor);
                        }}
                        className="h-32 w-full cursor-pointer"
                        disabled={selectedShape?.locked}
                      />
                    </div>
                  )}
                </div>
              {/* Effects 버튼 */}
              <div className="relative" ref={effectsMenuRef}>
                <button 
                  onClick={() => {
                    if (selectedShape && !isNonTrianglePolygon(selectedShape.type)) {
                      setShowEffectsMenu(!showEffectsMenu);
                    }
                  }}
                  disabled={!selectedShape || isNonTrianglePolygon(selectedShape?.type) || selectedShape?.locked}
                  className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                    !selectedShape || isNonTrianglePolygon(selectedShape?.type) || selectedShape?.locked
                      ? "text-gray-500 cursor-not-allowed opacity-50"
                      : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                    <img src={effectsIcon} alt="Effects" className="w-auto h-4" />
                    <span>Effect</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                {showEffectsMenu && selectedShape && !isNonTrianglePolygon(selectedShape.type) && (
                    <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 min-w-[200px]">
                      <div className="px-3 py-1 text-xs text-gray-400 border-b border-pink-300/10">
                        Shadow Effects
                      </div>
                      <button
                        onClick={() => {
                          updateSelectedShape(undefined, undefined, undefined, undefined, undefined, undefined, "none");
                          setShowEffectsMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 dark:hover:bg-gray-800 ${
                          selectedShape?.shadowType === "none" || !selectedShape?.shadowType
                            ? "text-pink-300"
                            : "text-white"
                        }`}
                      >
                        None
                      </button>
                      <button
                        onClick={() => {
                          updateSelectedShape(
                            undefined, undefined, undefined, undefined, undefined, undefined,
                            "outer",
                            selectedShape?.shadowColor ?? "rgba(0, 0, 0, 0.3)",
                            selectedShape?.shadowBlur ?? 8,
                            selectedShape?.shadowOffsetX ?? 4,
                            selectedShape?.shadowOffsetY ?? 4
                          );
                          setShowEffectsMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 dark:hover:bg-gray-800 ${
                          selectedShape?.shadowType === "outer"
                            ? "text-pink-300"
                            : "text-white"
                        }`}
                      >
                        Outer Shadow
                      </button>
                      <button
                        onClick={() => {
                          updateSelectedShape(
                            undefined, undefined, undefined, undefined, undefined, undefined,
                            "inner",
                            selectedShape?.shadowColor ?? "rgba(0, 0, 0, 0.3)",
                            selectedShape?.shadowBlur ?? 8,
                            selectedShape?.shadowOffsetX ?? 4,
                            selectedShape?.shadowOffsetY ?? 4
                          );
                          setShowEffectsMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 dark:hover:bg-gray-800 ${
                          selectedShape?.shadowType === "inner"
                            ? "text-pink-300"
                            : "text-white"
                        }`}
                      >
                        Inner Shadow
                      </button>
                      <div className="px-3 py-1 text-xs text-gray-400 border-t border-b border-pink-300/10 mt-1">
                        Other Effects
                      </div>
                      <button
                        onClick={() => {
                          setShowOpacityControl(!showOpacityControl);
                          setShowGlowControl(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 dark:hover:bg-gray-800 text-white flex items-center justify-between"
                      >
                        <span>Opacity</span>
                        <span className="text-xs text-gray-400">
                          {selectedShape?.opacity !== undefined ? Math.round(selectedShape.opacity * 100) : 100}%
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowGlowControl(!showGlowControl);
                          setShowOpacityControl(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 dark:hover:bg-gray-800 ${
                          selectedShape?.glowEnabled
                            ? "text-pink-300"
                            : "text-white"
                        }`}
                      >
                        Glow
                      </button>
                      {showOpacityControl && (
                        <div className="px-3 py-2 border-t border-pink-300/10 bg-gray-900">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-white">Opacity:</span>
                            <span className="text-xs text-gray-400">
                              {selectedShape?.opacity !== undefined ? Math.round(selectedShape.opacity * 100) : 100}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={selectedShape?.opacity ?? 1}
                            onChange={(e) => {
                              updateSelectedShape(
                                undefined, undefined, undefined, undefined, undefined, undefined,
                                undefined, undefined, undefined, undefined, undefined,
                                parseFloat(e.target.value)
                              );
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-300"
                          />
                          <button
                            onClick={() => {
                              updateSelectedShape(
                                undefined, undefined, undefined, undefined, undefined, undefined,
                                undefined, undefined, undefined, undefined, undefined,
                                1
                              );
                            }}
                            className="mt-2 w-full px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded"
                          >
                            Reset to 100%
                          </button>
                        </div>
                      )}
                      {showGlowControl && (
                        <div className="px-3 py-2 border-t border-pink-300/10 bg-gray-900">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedShape?.glowEnabled ?? false}
                              onChange={(e) => {
                                updateSelectedShape(
                                  undefined, undefined, undefined, undefined, undefined, undefined,
                                  undefined, undefined, undefined, undefined, undefined,
                                  undefined,
                                  e.target.checked,
                                  selectedShape?.glowColor ?? selectedShape?.color ?? DEFAULT_SHAPE_COLOR,
                                  selectedShape?.glowBlur ?? 20
                                );
                              }}
                              className="accent-pink-300"
                            />
                            <span className="text-xs text-white">Enable Glow</span>
                          </div>
                          {selectedShape?.glowEnabled && (
                            <>
                              <div className="mb-2">
                                <label className="text-xs text-white block mb-1">Glow Color:</label>
                                <input
                                  type="color"
                                  value={selectedShape?.glowColor ?? selectedShape?.color ?? DEFAULT_SHAPE_COLOR}
                                  onChange={(e) => {
                                    updateSelectedShape(
                                      undefined, undefined, undefined, undefined, undefined, undefined,
                                      undefined, undefined, undefined, undefined, undefined,
                                      undefined,
                                      true,
                                      e.target.value,
                                      selectedShape?.glowBlur ?? 20
                                    );
                                  }}
                                  className="w-full h-8 cursor-pointer"
                                />
                              </div>
                              <div className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="text-xs text-white">Blur:</label>
                                  <span className="text-xs text-gray-400">
                                    {selectedShape?.glowBlur ?? 20}px
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="5"
                                  max="50"
                                  step="1"
                                  value={selectedShape?.glowBlur ?? 20}
                                  onChange={(e) => {
                                    updateSelectedShape(
                                      undefined, undefined, undefined, undefined, undefined, undefined,
                                      undefined, undefined, undefined, undefined, undefined,
                                      undefined,
                                      true,
                                      selectedShape?.glowColor ?? selectedShape?.color ?? DEFAULT_SHAPE_COLOR,
                                      parseInt(e.target.value)
                                    );
                                  }}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-300"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              {/* Lock 버튼 */}
              <button
                onClick={() => {
                  if (selectedShape) {
                    const updatedShape = {
                      ...selectedShape,
                      locked: !selectedShape.locked,
                    };
                    setShapes(
                      shapes.map((s) =>
                        s.id === selectedShape.id ? updatedShape : s
                      )
                    );
                    setSelectedShape(updatedShape);
                  }
                }}
                disabled={!selectedShape}
                className={`w-8 h-8 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center justify-center ${
                  selectedShape?.locked ? "bg-pink-300/20" : ""
                } ${!selectedShape ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"}`}
                title={selectedShape?.locked ? "Unlock" : "Lock"}
              >
                {selectedShape?.locked ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            {/* 두 번째 줄: Stroke, Corner Radius */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={strokeMenuRef}>
                <button 
                  onClick={() => setShowStrokeMenu(!showStrokeMenu)}
                  disabled={!selectedShape || selectedShape?.locked}
                  className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                    !selectedShape || selectedShape?.locked
                      ? "text-gray-500 cursor-not-allowed opacity-50"
                      : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                >
                    <img src={strokeIcon} alt="Stroke" className="w-auto h-4" />
                    <span>Stroke</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                {showStrokeMenu && selectedShape && (
                  <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 min-w-[220px]">
                    <div className="px-3 py-2">
                      <div className="mb-3">
                        <label className="text-xs text-white block mb-2">Stroke Color:</label>
                        <input
                          type="color"
                          value={selectedShape?.strokeColor ?? "#000000"}
                          onChange={(e) => {
                            updateSelectedShape(
                              undefined, undefined, undefined, undefined, undefined, undefined,
                              undefined, undefined, undefined, undefined, undefined,
                              undefined, undefined, undefined, undefined,
                              e.target.value,
                              selectedShape?.strokeWidth ?? 1
                            );
                          }}
                          className="w-full h-10 cursor-pointer"
                        />
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-white">Stroke Width:</label>
                          <span className="text-xs text-gray-400">
                            {selectedShape?.strokeWidth ?? 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={selectedShape?.strokeWidth ?? 0}
                          onChange={(e) => {
                            const width = parseInt(e.target.value);
                            updateSelectedShape(
                              undefined, undefined, undefined, undefined, undefined, undefined,
                              undefined, undefined, undefined, undefined, undefined,
                              undefined, undefined, undefined, undefined,
                              selectedShape?.strokeColor ?? "#000000",
                              width
                            );
                          }}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-300"
                        />
                      </div>
                      <button
                        onClick={() => {
                          updateSelectedShape(
                            undefined, undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined, undefined,
                            undefined, undefined, undefined, undefined,
                            undefined,
                            0
                          );
                          setShowStrokeMenu(false);
                        }}
                        className="w-full px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded"
                      >
                        Remove Stroke
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Corner Radius */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={cornerRadiusIcon} 
                    alt="Corner Radius" 
                    className={`w-auto h-4 ${!selectedShape || selectedShape.type !== "roundedRectangle" ? "opacity-50" : ""}`} 
                  />
                  <span className={`text-sm ${!selectedShape || selectedShape.type !== "roundedRectangle" ? "text-gray-500" : "text-white dark:text-white"}`}>
                    Corner Radius:
                  </span>
                  <input
                    ref={borderRadiusInputRef}
                    type="text"
                    value={borderRadiusInputValue}
                    disabled={!selectedShape || selectedShape.type !== "roundedRectangle" || selectedShape.locked}
                    onChange={(e) => {
                      if (!selectedShape || selectedShape.type !== "roundedRectangle" || selectedShape.locked) return;
                        const input = e.target.value;
                        // 빈 문자열이거나 숫자만 허용
                        if (input === '' || /^\d+$/.test(input)) {
                          const cursorPosition = e.target.selectionStart || 0;
                          setBorderRadiusInputValue(input);
                          
                          // 숫자가 입력된 경우에만 도형 업데이트
                          if (input !== '' && /^\d+$/.test(input)) {
                            const maxRadius = Math.min(shapeWidth, shapeHeight) / 2;
                            const newRadius = Math.max(0, Math.min(Number(input), maxRadius));
                            setShapeBorderRadius(newRadius);
                            updateSelectedShape(undefined, undefined, undefined, undefined, undefined, newRadius);
                          }
                          
                          // 커서 위치 복원
                          setTimeout(() => {
                            if (borderRadiusInputRef.current) {
                              const newPosition = Math.min(cursorPosition, input.length);
                              borderRadiusInputRef.current.setSelectionRange(newPosition, newPosition);
                            }
                          }, 0);
                        }
                      }}
                      onBlur={(e) => {
                        if (!selectedShape || selectedShape.type !== "roundedRectangle") return;
                        // 포커스를 잃을 때 빈 값이면 현재 borderRadius 값으로 복원
                        const value = e.target.value;
                        if (value === '' || isNaN(Number(value)) || value === '0') {
                          const maxRadius = Math.min(shapeWidth, shapeHeight) / 2;
                          const finalRadius = Math.max(0, Math.min(Number(value) || 0, maxRadius));
                          setShapeBorderRadius(finalRadius);
                          setBorderRadiusInputValue(finalRadius.toString());
                          updateSelectedShape(undefined, undefined, undefined, undefined, undefined, finalRadius);
                        } else {
                          // 유효한 값이면 최대값 체크
                          const maxRadius = Math.min(shapeWidth, shapeHeight) / 2;
                          const finalRadius = Math.max(0, Math.min(Number(value), maxRadius));
                          setShapeBorderRadius(finalRadius);
                          setBorderRadiusInputValue(finalRadius.toString());
                          updateSelectedShape(undefined, undefined, undefined, undefined, undefined, finalRadius);
                        }
                      }}
                      className={`w-16 px-2 py-1 bg-black dark:bg-black border rounded text-sm ${
                        !selectedShape || selectedShape.type !== "roundedRectangle" 
                          ? "text-gray-500 border-gray-600 cursor-not-allowed opacity-50" 
                          : "text-white border-pink-300/20"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.min(shapeWidth, shapeHeight) / 2}
                      value={shapeBorderRadius}
                      disabled={!selectedShape || selectedShape.type !== "roundedRectangle"}
                      onChange={(e) => {
                        if (!selectedShape || selectedShape.type !== "roundedRectangle") return;
                        const newRadius = Number(e.target.value);
                        setShapeBorderRadius(newRadius);
                        setBorderRadiusInputValue(newRadius.toString());
                        updateSelectedShape(undefined, undefined, undefined, undefined, undefined, newRadius);
                      }}
                      className={`flex-1 h-2 bg-gray-700 rounded-lg appearance-none ${
                        !selectedShape || selectedShape.type !== "roundedRectangle" 
                          ? "opacity-50 cursor-not-allowed" 
                          : "cursor-pointer accent-pink-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            {/* 세 번째 줄: z-index 조정 버튼들 */}
            <div className="flex items-center gap-2">
              {/* Bring Forward 버튼 */}
              <div className="relative" ref={bringForwardMenuRef}>
                <button 
                  onClick={() => {
                    if (selectedShape || selectedText) {
                      setShowBringForwardMenu(!showBringForwardMenu);
                    }
                  }}
                  disabled={!selectedShape && !selectedText}
                  className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                    !selectedShape && !selectedText ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                  }`}
                  title="Bring Forward"
                >
                  {/* 두 개의 겹쳐진 사각형 아이콘 */}
                  <div className="relative w-5 h-5">
                    <div className="absolute top-0 left-0 w-3 h-3 border border-pink-300 bg-pink-300/30"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border border-white"></div>
                  </div>
                  <span>Bring Forward</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showBringForwardMenu && (selectedShape || selectedText) && (
                    <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 min-w-[160px]">
                      <button
                        onClick={() => {
                          bringForward();
                          setShowBringForwardMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                      >
                        Bring Forward
                      </button>
                      <button
                        onClick={() => {
                          bringToFront();
                          setShowBringForwardMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border-t border-pink-300/20"
                      >
                        Bring to Front
                      </button>
                    </div>
                  )}
                </div>
                {/* Send Backward 버튼 */}
                <div className="relative" ref={sendBackwardMenuRef}>
                  <button 
                    onClick={() => {
                      if (selectedShape || selectedText) {
                        setShowSendBackwardMenu(!showSendBackwardMenu);
                      }
                    }}
                    disabled={!selectedShape && !selectedText}
                    className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                      !selectedShape && !selectedText ? "opacity-50 cursor-not-allowed text-gray-500" : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                    }`}
                    title="Send Backward"
                  >
                    {/* 두 개의 겹쳐진 사각형 아이콘 */}
                    <div className="relative w-5 h-5">
                      <div className="absolute top-0 left-0 w-3 h-3 border border-white"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border border-pink-300 bg-pink-300/30"></div>
                    </div>
                    <span>Send Backward</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showSendBackwardMenu && (selectedShape || selectedText) && (
                  <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 min-w-[160px]">
                    <button
                      onClick={() => {
                        sendBackward();
                        setShowSendBackwardMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                    >
                      Send Backward
                    </button>
                    <button
                      onClick={() => {
                        sendToBack();
                        setShowSendBackwardMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border-t border-pink-300/20"
                    >
                      Send to Back
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* 네 번째 줄: 그룹화 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={createGroup}
                disabled={selectedShapeIds.size + selectedTextIds.size < 2}
                className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                  selectedShapeIds.size + selectedTextIds.size < 2
                    ? "opacity-50 cursor-not-allowed text-gray-500"
                    : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                }`}
                title="Group (Ctrl+G) - 최소 2개 이상 선택 필요"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Group</span>
              </button>
              <button
                onClick={ungroup}
                disabled={!selectedGroup}
                className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                  !selectedGroup
                    ? "opacity-50 cursor-not-allowed text-gray-500"
                    : "text-white hover:bg-gray-800 dark:hover:bg-gray-800"
                }`}
                title="Ungroup (Ctrl+Shift+G)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Ungroup</span>
              </button>
            </div>
          </div>
        </div>

        {/* 캔버스 영역 (파워포인트 스타일 - 흰색 배경) */}
        <div className="flex-1 p-8 overflow-auto bg-black dark:bg-black">
          <div
            ref={canvasRef}
            className="relative bg-white w-full h-full shadow-lg"
            style={{ cursor: pendingShapeType ? "crosshair" : "default", minHeight: "600px" }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleCanvasMouseDown}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={(e) => {
              if (isDrawing) {
                handleCanvasMouseUp(e);
              }
              handleMouseUp();
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
                  zIndex: 9998, // 모든 도형 위에 표시되도록 매우 높은 z-index 설정
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
                  zIndex: 9999, // 모든 도형 위에 표시되도록 매우 높은 z-index 설정
                  borderRadius: pendingShapeType === "circle" || pendingShapeType === "ellipse" 
                    ? "50%" 
                    : pendingShapeType === "roundedRectangle" 
                      ? "10px" 
                      : pendingShapeType === "rectangle"
                        ? `${shapeBorderRadius}px`
                        : "0",
                  clipPath: pendingShapeType === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" :
                           pendingShapeType === "diamond" ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" :
                           pendingShapeType === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" :
                           pendingShapeType === "hexagon" ? "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)" :
                           pendingShapeType === "pentagon" ? "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" : undefined,
                  transform: pendingShapeType === "parallelogram" ? "skew(-20deg)" : undefined,
                }}
              />
            )}
            {[...shapes].sort((a, b) => a.zIndex - b.zIndex).map((shape) => {
              const isSelected = selectedShape?.id === shape.id;
              const isMultiSelected = selectedShapeIds.has(shape.id);
              const isInGroup = groupsArray.some(g => g.shapeIds.includes(shape.id));
              return (
                <div
                  key={shape.id}
                  className="shape-container"
                  onMouseDown={(e) => handleMouseDown(e, shape)}
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
                        filter: (() => {
                          const filters: string[] = [];
                          if (shape.shadowType && shape.shadowType !== "none" && shape.shadowType === "outer") {
                            filters.push(`drop-shadow(${shape.shadowOffsetX ?? 4}px ${shape.shadowOffsetY ?? 4}px ${shape.shadowBlur ?? 8}px ${shape.shadowColor ?? "rgba(0, 0, 0, 0.3)"})`);
                          }
                          if (shape.glowEnabled) {
                            const glowColor = shape.glowColor ?? shape.color;
                            const glowBlur = shape.glowBlur ?? 20;
                            filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
                          }
                          return filters.length > 0 ? filters.join(" ") : undefined;
                        })(),
                      }}
                    >
                      {shape.type === "triangle" ? (
                      <polygon
                        points={`${shape.width / 2},0 0,${shape.height} ${shape.width},${shape.height}`}
                        fill={shape.color}
                          stroke={shape.strokeWidth && shape.strokeWidth > 0 
                            ? (shape.strokeColor ?? "#000000")
                            : (isSelected ? "#f9a8d4" : "none")}
                          strokeWidth={shape.strokeWidth && shape.strokeWidth > 0 
                            ? shape.strokeWidth 
                            : (isSelected ? "2" : "0")}
                      />
                      ) : shape.type === "diamond" ? (
                        <polygon
                          points={`${shape.width / 2},0 ${shape.width},${shape.height / 2} ${shape.width / 2},${shape.height} 0,${shape.height / 2}`}
                          fill={shape.color}
                          stroke={shape.strokeWidth && shape.strokeWidth > 0 
                            ? (shape.strokeColor ?? "#000000")
                            : (isSelected ? "#f9a8d4" : "none")}
                          strokeWidth={shape.strokeWidth && shape.strokeWidth > 0 
                            ? shape.strokeWidth 
                            : (isSelected ? "2" : "0")}
                        />
                      ) : shape.type === "star" ? (
                        <polygon
                          points={`${shape.width * 0.5},0 ${shape.width * 0.61},${shape.height * 0.35} ${shape.width * 0.98},${shape.height * 0.35} ${shape.width * 0.68},${shape.height * 0.57} ${shape.width * 0.79},${shape.height * 0.91} ${shape.width * 0.5},${shape.height * 0.7} ${shape.width * 0.21},${shape.height * 0.91} ${shape.width * 0.32},${shape.height * 0.57} ${shape.width * 0.02},${shape.height * 0.35} ${shape.width * 0.39},${shape.height * 0.35}`}
                          fill={shape.color}
                          stroke={shape.strokeWidth && shape.strokeWidth > 0 
                            ? (shape.strokeColor ?? "#000000")
                            : (isSelected ? "#f9a8d4" : "none")}
                          strokeWidth={shape.strokeWidth && shape.strokeWidth > 0 
                            ? shape.strokeWidth 
                            : (isSelected ? "2" : "0")}
                        />
                      ) : shape.type === "hexagon" ? (
                        <polygon
                          points={`${shape.width * 0.3},0 ${shape.width * 0.7},0 ${shape.width},${shape.height * 0.5} ${shape.width * 0.7},${shape.height} ${shape.width * 0.3},${shape.height} 0,${shape.height * 0.5}`}
                          fill={shape.color}
                          stroke={shape.strokeWidth && shape.strokeWidth > 0 
                            ? (shape.strokeColor ?? "#000000")
                            : (isSelected ? "#f9a8d4" : "none")}
                          strokeWidth={shape.strokeWidth && shape.strokeWidth > 0 
                            ? shape.strokeWidth 
                            : (isSelected ? "2" : "0")}
                        />
                      ) : shape.type === "pentagon" ? (
                        <polygon
                          points={`${shape.width * 0.5},0 ${shape.width},${shape.height * 0.38} ${shape.width * 0.82},${shape.height} ${shape.width * 0.18},${shape.height} 0,${shape.height * 0.38}`}
                          fill={shape.color}
                          stroke={shape.strokeWidth && shape.strokeWidth > 0 
                            ? (shape.strokeColor ?? "#000000")
                            : (isSelected ? "#f9a8d4" : "none")}
                          strokeWidth={shape.strokeWidth && shape.strokeWidth > 0 
                            ? shape.strokeWidth 
                            : (isSelected ? "2" : "0")}
                        />
                      ) : null}
                    </svg>
                  ) : shape.type === "image" ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${shape.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: shape.opacity !== undefined ? shape.opacity : undefined,
                        border: shape.strokeWidth && shape.strokeWidth > 0 
                          ? `${shape.strokeWidth}px solid ${shape.strokeColor ?? "#000000"}`
                          : (isSelected ? (shape.locked ? "2px solid #ff6b6b" : "2px solid #f9a8d4") : "none"),
                        cursor: shape.locked ? "not-allowed" : (isDragging && isSelected ? "grabbing" : isSelected ? "move" : "grab"),
                        userSelect: "none",
                        filter: (() => {
                          const filters: string[] = [];
                          if (shape.shadowType && shape.shadowType !== "none" && shape.shadowType === "outer") {
                            filters.push(`drop-shadow(${shape.shadowOffsetX ?? 4}px ${shape.shadowOffsetY ?? 4}px ${shape.shadowBlur ?? 8}px ${shape.shadowColor ?? "rgba(0, 0, 0, 0.3)"})`);
                          }
                          if (shape.glowEnabled) {
                            const glowColor = shape.glowColor ?? shape.color;
                            const glowBlur = shape.glowBlur ?? 20;
                            filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
                          }
                          return filters.length > 0 ? filters.join(" ") : undefined;
                        })(),
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        ...getShapeStyle(shape),
                        outline: (isSelected || isMultiSelected) ? (shape.locked ? "2px solid #ff6b6b" : "2px solid #f9a8d4") : "none",
                        outlineOffset: (isSelected || isMultiSelected) ? (shape.strokeWidth && shape.strokeWidth > 0 ? `-${shape.strokeWidth + 2}px` : "-2px") : "0",
                        cursor: shape.locked ? "not-allowed" : (isDragging && isSelected ? "grabbing" : (isSelected || isMultiSelected) ? "move" : "grab"),
                        userSelect: "none",
                        opacity: isInGroup && !isSelected ? 0.8 : undefined,
                      }}
                    />
                  )}
                  {(isSelected || isMultiSelected) && !shape.locked && (
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
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
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "ew-resize",
                        }}
                      />
                    </>
                  )}
                  {/* 잠금 아이콘 표시 */}
                  {shape.locked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(255, 107, 107, 0.9)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                      }}
                      title="잠금됨"
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            {/* 그룹 바운딩 박스 렌더링 */}
            {[...groupsArray].sort((a, b) => a.zIndex - b.zIndex).map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              const updatedGroup = updateGroupBounds(group);
              
              return (
                <div
                  key={group.id}
                  className="group-container"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (!e.ctrlKey && !e.metaKey) {
                      setSelectedGroup(updatedGroup);
                      setSelectedShape(null);
                      setSelectedText(null);
                      if (canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left - updatedGroup.x;
                        const offsetY = e.clientY - rect.top - updatedGroup.y;
                        setDragOffset({ x: offsetX, y: offsetY });
                        setIsDragging(true);
                        
                        // 그룹 드래그 시작 시 초기 위치 저장 (상대 위치 유지를 위해)
                        const shapePositions = new Map<number, { x: number; y: number }>();
                        const textPositions = new Map<number, { x: number; y: number }>();
                        shapes.forEach(shape => {
                          if (updatedGroup.shapeIds.includes(shape.id)) {
                            shapePositions.set(shape.id, { x: shape.x, y: shape.y });
                          }
                        });
                        texts.forEach(text => {
                          if (updatedGroup.textIds.includes(text.id)) {
                            textPositions.set(text.id, { x: text.x, y: text.y });
                          }
                        });
                        setGroupDragStart({
                          groupX: updatedGroup.x,
                          groupY: updatedGroup.y,
                          shapePositions,
                          textPositions,
                        });
                      }
                    }
                  }}
                  style={{
                    position: "absolute",
                    left: `${updatedGroup.x}px`,
                    top: `${updatedGroup.y}px`,
                    width: `${updatedGroup.width}px`,
                    height: `${updatedGroup.height}px`,
                    border: isSelected ? "2px dashed #f9a8d4" : "none",
                    backgroundColor: isSelected ? "rgba(249, 168, 212, 0.1)" : "transparent",
                    pointerEvents: isSelected ? "auto" : "none",
                    zIndex: updatedGroup.zIndex,
                    cursor: isSelected ? "move" : "default",
                  }}
                >
                  {/* 그룹 내 도형과 텍스트는 이미 렌더링되므로 여기서는 바운딩 박스만 표시 */}
                </div>
              );
            })}
            {/* 텍스트 렌더링 */}
            {[...texts].sort((a, b) => a.zIndex - b.zIndex).map((text) => {
              const isSelected = selectedText?.id === text.id;
              const isMultiSelected = selectedTextIds.has(text.id);
              const isEditing = editingTextId === text.id;
              const isInGroup = groupsArray.some(g => g.textIds.includes(text.id));
              
              if (isEditing) {
                return (
                  <EditableText
                    key={text.id}
                    ref={textInputRef}
                    text={text}
                    onBlur={() => handleTextBlur(text.id)}
                    onKeyDown={(e) => handleTextKeyDown(e, text.id)}
                    onInput={() => handleTextInput(text.id)}
                  />
                );
              }
              
              return (
                <div
                  key={text.id}
                  className="text-container"
                  onMouseDown={(e) => handleTextMouseDown(e, text)}
                  onDoubleClick={(e) => handleTextDoubleClick(e, text)}
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
                    cursor: text.locked ? "not-allowed" : (isDraggingText && isSelected ? "grabbing" : (isSelected || isMultiSelected) ? "move" : "grab"),
                    userSelect: "none",
                    border: (isSelected || isMultiSelected) ? (text.locked ? "2px dashed #ff6b6b" : "2px dashed #f9a8d4") : "none",
                    padding: (isSelected || isMultiSelected) ? "2px" : "0",
                    borderRadius: "2px",
                    backgroundColor: (isSelected || isMultiSelected) ? "rgba(249, 168, 212, 0.1)" : "transparent",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    zIndex: text.zIndex,
                    opacity: isInGroup && !isSelected ? 0.8 : undefined,
                  }}
                >
                  {text.text}
                  {(isSelected || isMultiSelected) && !text.locked && (
                    <>
                      {/* 모서리 핸들 */}
                      {/* 모서리 핸들 */}
                      <div
                        className="text-resize-handle"
                        data-handle="nw"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "nwse-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="ne"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "nesw-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="sw"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          left: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "nesw-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="se"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          right: "-4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "nwse-resize",
                        }}
                      />
                      {/* 중간 핸들 */}
                      <div
                        className="text-resize-handle"
                        data-handle="n"
                        style={{
                          position: "absolute",
                          top: "-4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "ns-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="s"
                        style={{
                          position: "absolute",
                          bottom: "-4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "ns-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="w"
                        style={{
                          position: "absolute",
                          left: "-4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "ew-resize",
                        }}
                      />
                      <div
                        className="text-resize-handle"
                        data-handle="e"
                        style={{
                          position: "absolute",
                          right: "-4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#f9a8d4",
                          border: "1px solid #000000",
                          cursor: "ew-resize",
                        }}
                      />
                    </>
                  )}
                  {/* 잠금 아이콘 표시 */}
                  {text.locked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(255, 107, 107, 0.9)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                      }}
                      title="잠금됨"
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 오른쪽 패널: 코드 에디터 */}
      <div className="w-[480px] bg-black dark:bg-black flex flex-col">
        {/* Code Editor 제목 (맨 위) */}
        <div className="px-4 py-2 border-b border-pink-300/30 dark:border-pink-300/20/30">
          <h3 className="text-sm font-semibold text-white dark:text-white">Code Editor</h3>
        </div>

        {/* 파일 타입 체크박스 */}
        <div className="px-4 py-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white dark:text-white cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-pink-300" 
              checked={codeView === "xml"}
              onChange={() => setCodeView("xml")}
            />
            XML
          </label>
          <label className="flex items-center gap-2 text-sm text-white dark:text-white cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-pink-300" 
              checked={codeView === "css"}
              onChange={() => setCodeView("css")}
            />
            CSS
          </label>
          <label className="flex items-center gap-2 text-sm text-white dark:text-white cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-pink-300"
              checked={codeView === "react"}
              onChange={() => setCodeView("react")}
            />
            React
          </label>
        </div>

        {/* 파일 탭 */}
        <FileTabs
          openedFiles={openedFiles}
          activeFile={activeFile}
          files={files}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
        />

        {/* 코드 편집 창 */}
        <CodeEditor
          codeView={codeView}
          codeContent={codeContent}
          onCodeChange={handleCodeChange}
          onCodeViewChange={setCodeView}
        />
      </div>
    </div>
  );
}

export default App;
