import { useState, useRef, useEffect, useMemo } from "react";
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./App.css";
import cssIcon from "./assets/css.png";
import htmlIcon from "./assets/html.png";
import reactIcon from "./assets/react.svg";
import codeIcon from "./assets/Code.png";
import newfileIcon from "./assets/newfile.png";
import newfolderIcon from "./assets/newfolder.png";
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

type ShapeType = "rectangle" | "roundedRectangle" | "circle" | "ellipse" | "parallelogram" | "star" | "triangle" | "diamond" | "hexagon" | "pentagon" | "image";

interface Shape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderRadius?: number;
  shadowType?: "none" | "outer" | "inner";
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowBlur?: number;
  strokeColor?: string;
  strokeWidth?: number;
  imageUrl?: string;
}

interface FileItem {
  name: string;
  type: "file" | "folder";
  extension: "xml" | "css" | "react";
}

// 도형의 기본 색상 (프로그램에서 사용하는 핑크색)
const DEFAULT_SHAPE_COLOR = "#f9a8d4";

function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [shapeColor, setShapeColor] = useState(DEFAULT_SHAPE_COLOR);
  const [shapeWidth, setShapeWidth] = useState(100);
  const [shapeHeight, setShapeHeight] = useState(100);
  const [_shapeX, setShapeX] = useState(50);
  const [_shapeY, setShapeY] = useState(50);
  const [shapeBorderRadius, setShapeBorderRadius] = useState(0);
  const [borderRadiusInputValue, setBorderRadiusInputValue] = useState<string>("0");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [pendingShapeType, setPendingShapeType] = useState<ShapeType | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, shapeX: 0, shapeY: 0 });
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showShapeColorMenu, setShowShapeColorMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showEffectsMenu, setShowEffectsMenu] = useState(false);
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [showGlowControl, setShowGlowControl] = useState(false);
  const [showStrokeMenu, setShowStrokeMenu] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [codeView, setCodeView] = useState<"xml" | "css" | "react">("xml");
  const [_currentFileName, setCurrentFileName] = useState<string>("React.tsx");
  const [openedFiles, setOpenedFiles] = useState<string[]>(["React.tsx"]); // 열린 파일 목록
  const [activeFile, setActiveFile] = useState<string>("React.tsx"); // 현재 활성화된 파일
  const canvasRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textColorMenuRef = useRef<HTMLDivElement>(null);
  const shapeColorMenuRef = useRef<HTMLDivElement>(null);
  const effectsMenuRef = useRef<HTMLDivElement>(null);
  const strokeMenuRef = useRef<HTMLDivElement>(null);
  const borderRadiusInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 플레이스홀더 파일 목록
  const [files] = useState<FileItem[]>([
    { name: "Test1.xml", type: "file", extension: "xml" },
    { name: "Test2.css", type: "file", extension: "css" },
    { name: "React.tsx", type: "file", extension: "react" },
  ]);

  // clip-path를 사용하는 도형 타입인지 확인
  const isClipPathShape = (type: ShapeType): boolean => {
    return type === "triangle" || type === "diamond" || type === "star" || type === "hexagon" || type === "pentagon";
  };

  // triangle을 제외한 polygon 타입인지 확인 (Effects 비활성화용)
  const isNonTrianglePolygon = (type: ShapeType): boolean => {
    return type === "diamond" || type === "star" || type === "hexagon" || type === "pentagon";
  };

  // 도형 타입에 따른 스타일 반환 (위치 정보 제외, 모양만)
  const getShapeStyle = (shape: Shape) => {
    const baseStyle: React.CSSProperties = {
      width: "100%",
      height: "100%",
      backgroundColor: shape.color,
    };

    // Opacity 적용
    if (shape.opacity !== undefined) {
      baseStyle.opacity = shape.opacity;
    }

    // clip-path를 사용하는 도형은 drop-shadow filter 사용, 그 외는 box-shadow 사용
    const useClipPath = isClipPathShape(shape.type);
    
    // Shadow와 Glow 효과를 결합
    const shadows: string[] = [];
    const filters: string[] = [];
    
    if (shape.shadowType && shape.shadowType !== "none") {
      const offsetX = shape.shadowOffsetX ?? 4;
      const offsetY = shape.shadowOffsetY ?? 4;
      const blur = shape.shadowBlur ?? 8;
      const color = shape.shadowColor ?? "rgba(0, 0, 0, 0.3)";
      
      if (useClipPath) {
        // clip-path를 사용하는 도형은 drop-shadow filter 사용 (outer shadow만 지원)
        if (shape.shadowType === "outer") {
          filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`);
        }
      } else {
        // 일반 도형은 box-shadow 사용
        if (shape.shadowType === "inner") {
          shadows.push(`inset ${offsetX}px ${offsetY}px ${blur}px ${color}`);
        } else {
          shadows.push(`${offsetX}px ${offsetY}px ${blur}px ${color}`);
        }
      }
    }

    // Glow 효과 추가
    if (shape.glowEnabled) {
      const glowColor = shape.glowColor ?? shape.color;
      const glowBlur = shape.glowBlur ?? 20;
      
      if (useClipPath) {
        // clip-path를 사용하는 도형은 filter로 glow 적용
        filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
      } else {
        // 일반 도형은 box-shadow로 glow 적용
        shadows.push(`0 0 ${glowBlur}px ${glowColor}`);
      }
    }

    // Shadow와 filter 적용
    if (shadows.length > 0) {
      baseStyle.boxShadow = shadows.join(", ");
    }
    if (filters.length > 0) {
      baseStyle.filter = filters.join(" ");
    }

    // Stroke (외곽선) 적용
    if (shape.strokeWidth !== undefined && shape.strokeWidth > 0) {
      baseStyle.border = `${shape.strokeWidth}px solid ${shape.strokeColor ?? "#000000"}`;
    }

    // rectangle 타입의 경우 사용자가 설정한 borderRadius 사용
    if (shape.type === "rectangle" && shape.borderRadius !== undefined) {
      return { ...baseStyle, borderRadius: `${shape.borderRadius}px` };
    }

    switch (shape.type) {
      case "rectangle":
        return { ...baseStyle, borderRadius: "0" };
      case "roundedRectangle":
        return { ...baseStyle, borderRadius: "10px" };
      case "circle":
        return { ...baseStyle, borderRadius: "50%" };
      case "ellipse":
        return { ...baseStyle, borderRadius: "50%" };
      case "parallelogram":
        return {
          ...baseStyle,
          transform: "skew(-20deg)",
          transformOrigin: "center",
        };
      case "triangle":
        return {
          ...baseStyle,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          backgroundColor: "transparent",
        };
      case "diamond":
        return {
          ...baseStyle,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        };
      case "star":
        return {
          ...baseStyle,
          clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        };
      case "hexagon":
        return {
          ...baseStyle,
          clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
        };
      case "pentagon":
        return {
          ...baseStyle,
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
        };
      default:
        return baseStyle;
    }
  };

  // 파일 확장자에 따라 아이콘 반환
  const getFileIcon = (fileName: string, fileExtension?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // extension이 react인 경우
    if (fileExtension === "react") {
      return reactIcon;
    }
    
    // 파일명 확장자로 판단
    switch (extension) {
      case 'css':
        return cssIcon;
      case 'html':
      case 'htm':
        return htmlIcon;
      case 'tsx':
      case 'jsx':
        return reactIcon;
      case 'xml':
        return codeIcon;
      default:
        return null;
    }
  };

  // 파일 클릭 시 탭에 추가하거나 전환
  const handleFileClick = (fileName: string) => {
    setCurrentFileName(fileName);
    setActiveFile(fileName);
    
    // 이미 열려있지 않으면 탭에 추가
    if (!openedFiles.includes(fileName)) {
      setOpenedFiles([...openedFiles, fileName]);
    }
  };

  // 탭 클릭 시 파일 전환
  const handleTabClick = (fileName: string) => {
    setCurrentFileName(fileName);
    setActiveFile(fileName);
  };

  // 탭 닫기
  const handleTabClose = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    
    if (openedFiles.length === 1) {
      // 마지막 탭이면 닫지 않음
      return;
    }
    
    const newOpenedFiles = openedFiles.filter(f => f !== fileName);
    setOpenedFiles(newOpenedFiles);
    
    // 닫은 파일이 활성화된 파일이면 다른 파일로 전환
    if (activeFile === fileName) {
      const newActiveFile = newOpenedFiles[newOpenedFiles.length - 1];
      setActiveFile(newActiveFile);
      setCurrentFileName(newActiveFile);
    }
  };

  // XML 코드 생성 (메모이제이션)
  const generateXML = useMemo(() => {
    if (shapes.length === 0) return "<!-- 코드가 여기에 표시됩니다 -->";
    
    const xmlParts = shapes.map((shape) => {
      let borderRadiusValue: string;
      if (shape.type === "circle" || shape.type === "ellipse") {
        borderRadiusValue = "50%";
      } else if (shape.type === "roundedRectangle") {
        borderRadiusValue = "10";
      } else if (shape.borderRadius !== undefined) {
        borderRadiusValue = `${shape.borderRadius}`;
      } else {
        borderRadiusValue = "0";
      }
      
      let shadowAttr = "";
      if (shape.shadowType && shape.shadowType !== "none") {
        const offsetX = shape.shadowOffsetX ?? 4;
        const offsetY = shape.shadowOffsetY ?? 4;
        const blur = shape.shadowBlur ?? 8;
        const color = shape.shadowColor ?? "rgba(0, 0, 0, 0.3)";
        shadowAttr = ` shadowType="${shape.shadowType}" shadowColor="${color}" shadowBlur="${blur}" shadowOffsetX="${offsetX}" shadowOffsetY="${offsetY}"`;
      }
      
      let opacityAttr = "";
      if (shape.opacity !== undefined) {
        opacityAttr = ` opacity="${shape.opacity}"`;
      }
      
      let glowAttr = "";
      if (shape.glowEnabled) {
        const glowColor = shape.glowColor ?? shape.color;
        const glowBlur = shape.glowBlur ?? 20;
        glowAttr = ` glowEnabled="true" glowColor="${glowColor}" glowBlur="${glowBlur}"`;
      }
      
      let strokeAttr = "";
      if (shape.strokeWidth !== undefined && shape.strokeWidth > 0) {
        strokeAttr = ` strokeColor="${shape.strokeColor ?? "#000000"}" strokeWidth="${shape.strokeWidth}"`;
      }
      
      let imageAttr = "";
      if (shape.type === "image" && shape.imageUrl) {
        // base64 이미지는 너무 길 수 있으므로 간단히 표시
        imageAttr = ` imageUrl="[image data]"`;
      }
      
      return `  <shape id="${shape.id}" type="${shape.type}">
    <position x="${shape.x}" y="${shape.y}" />
    <size width="${shape.width}" height="${shape.height}" />
    <style color="${shape.color}" borderRadius="${borderRadiusValue}"${shadowAttr}${opacityAttr}${glowAttr}${strokeAttr}${imageAttr} />
  </shape>`;
    });
    
    return `<root>\n${xmlParts.join("\n")}\n</root>`;
  }, [shapes]);

  // CSS 코드 생성 (메모이제이션)
  const generateCSS = useMemo(() => {
    if (shapes.length === 0) return "/* 코드가 여기에 표시됩니다 */";
    
    const getShapeCSS = (shape: Shape) => {
      let css = `.shape-${shape.id} {\n  position: absolute;\n  left: ${shape.x}px;\n  top: ${shape.y}px;\n  width: ${shape.width}px;\n  height: ${shape.height}px;`;
      
      // 이미지 타입인 경우
      if (shape.type === "image" && shape.imageUrl) {
        css += `\n  background-image: url(${shape.imageUrl});\n  background-size: cover;\n  background-position: center;\n  background-repeat: no-repeat;`;
      } else {
        css += `\n  background-color: ${shape.color};`;
      }
      
      // Opacity 추가
      if (shape.opacity !== undefined) {
        css += `\n  opacity: ${shape.opacity};`;
      }
      
      const useClipPath = isClipPathShape(shape.type);
      
      // borderRadius가 명시적으로 설정된 경우 (rectangle 타입)
      if (shape.borderRadius !== undefined && shape.type === "rectangle") {
        css += `\n  border-radius: ${shape.borderRadius}px;`;
      } else {
        // 도형 타입에 따른 기본 스타일
        switch (shape.type) {
          case "roundedRectangle":
            css += "\n  border-radius: 10px;";
            break;
          case "circle":
          case "ellipse":
            css += "\n  border-radius: 50%;";
            break;
          case "parallelogram":
            css += "\n  transform: skew(-20deg);";
            break;
          case "triangle":
            css += "\n  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);";
            break;
          case "diamond":
            css += "\n  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);";
            break;
          case "star":
            css += "\n  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);";
            break;
          case "hexagon":
            css += "\n  clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);";
            break;
          case "pentagon":
            css += "\n  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);";
            break;
        }
      }
      
      // Shadow와 Glow 효과 추가
      const shadows: string[] = [];
      const filters: string[] = [];
      
      if (shape.shadowType && shape.shadowType !== "none") {
        const offsetX = shape.shadowOffsetX ?? 4;
        const offsetY = shape.shadowOffsetY ?? 4;
        const blur = shape.shadowBlur ?? 8;
        const color = shape.shadowColor ?? "rgba(0, 0, 0, 0.3)";
        
        if (useClipPath) {
          // clip-path를 사용하는 도형은 drop-shadow filter 사용 (outer shadow만 지원)
          if (shape.shadowType === "outer") {
            filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`);
          }
        } else {
          // 일반 도형은 box-shadow 사용
          if (shape.shadowType === "inner") {
            shadows.push(`inset ${offsetX}px ${offsetY}px ${blur}px ${color}`);
          } else {
            shadows.push(`${offsetX}px ${offsetY}px ${blur}px ${color}`);
          }
        }
      }

      // Glow 효과 추가
      if (shape.glowEnabled) {
        const glowColor = shape.glowColor ?? shape.color;
        const glowBlur = shape.glowBlur ?? 20;
        
        if (useClipPath) {
          filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
        } else {
          shadows.push(`0 0 ${glowBlur}px ${glowColor}`);
        }
      }

      // Shadow와 filter 적용
      if (shadows.length > 0) {
        css += `\n  box-shadow: ${shadows.join(", ")};`;
      }
      if (filters.length > 0) {
        css += `\n  filter: ${filters.join(" ")};`;
      }
      
      // Stroke (외곽선) 추가
      if (shape.strokeWidth !== undefined && shape.strokeWidth > 0) {
        css += `\n  border: ${shape.strokeWidth}px solid ${shape.strokeColor ?? "#000000"};`;
      }
      
      css += "\n}";
      return css;
    };
    
    const cssParts = shapes.map((shape) => getShapeCSS(shape));
    
    return cssParts.join("\n\n");
  }, [shapes]);

  // React 코드 생성 (메모이제이션)
  const generateReact = useMemo(() => {
    if (shapes.length === 0) return "// 코드가 여기에 표시됩니다";
    
    const getShapeReact = (shape: Shape) => {
      if (shape.type === "triangle") {
        let svgStyle = `      position: 'absolute',\n      left: ${shape.x},\n      top: ${shape.y},\n      width: ${shape.width},\n      height: ${shape.height},`;
        
        // Opacity 추가
        if (shape.opacity !== undefined) {
          svgStyle += `\n      opacity: ${shape.opacity},`;
        }
        
        // Shadow와 Glow 효과 추가 (SVG의 경우 filter 사용)
        const filters: string[] = [];
        
        if (shape.shadowType && shape.shadowType !== "none" && shape.shadowType === "outer") {
          const offsetX = shape.shadowOffsetX ?? 4;
          const offsetY = shape.shadowOffsetY ?? 4;
          const blur = shape.shadowBlur ?? 8;
          const color = shape.shadowColor ?? "rgba(0, 0, 0, 0.3)";
          filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`);
        }
        
        // Glow 효과 추가
        if (shape.glowEnabled) {
          const glowColor = shape.glowColor ?? shape.color;
          const glowBlur = shape.glowBlur ?? 20;
          filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
        }
        
        if (filters.length > 0) {
          svgStyle += `\n      filter: '${filters.join(" ")}',`;
        }
        
        let polygonProps = "";
        if (shape.strokeWidth !== undefined && shape.strokeWidth > 0) {
          polygonProps = `\n      stroke='${shape.strokeColor ?? "#000000"}'\n      strokeWidth={${shape.strokeWidth}}`;
        }
        
        return `  <svg\n    style={{\n${svgStyle}\n    }}\n  >\n    <polygon\n      points={\`${shape.width / 2},0 0,${shape.height} ${shape.width},${shape.height}\`}\n      fill='${shape.color}'${polygonProps}\n    />\n  </svg>`;
      }
      
      let style = `      position: 'absolute',\n      left: ${shape.x},\n      top: ${shape.y},\n      width: ${shape.width},\n      height: ${shape.height},`;
      
      // 이미지 타입인 경우
      if (shape.type === "image" && shape.imageUrl) {
        style += `\n      backgroundImage: 'url(${shape.imageUrl})',\n      backgroundSize: 'cover',\n      backgroundPosition: 'center',\n      backgroundRepeat: 'no-repeat',`;
      } else {
        style += `\n      backgroundColor: '${shape.color}',`;
      }
      
      // Opacity 추가
      if (shape.opacity !== undefined) {
        style += `\n      opacity: ${shape.opacity},`;
      }
      
      // borderRadius가 명시적으로 설정된 경우 (rectangle 타입)
      if (shape.borderRadius !== undefined && shape.type === "rectangle") {
        style += `\n      borderRadius: ${shape.borderRadius},`;
      } else {
        // 도형 타입에 따른 기본 스타일
        switch (shape.type) {
          case "roundedRectangle":
            style += "\n      borderRadius: '10px',";
            break;
          case "circle":
          case "ellipse":
            style += "\n      borderRadius: '50%',";
            break;
          case "parallelogram":
            style += "\n      transform: 'skew(-20deg)',";
            break;
          case "diamond":
            style += "\n      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',";
            break;
          case "star":
            style += "\n      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',";
            break;
          case "hexagon":
            style += "\n      clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',";
            break;
          case "pentagon":
            style += "\n      clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',";
            break;
        }
      }
      
      // Shadow와 Glow 효과 추가
      const useClipPath = isClipPathShape(shape.type);
      const shadows: string[] = [];
      const filters: string[] = [];
      
      if (shape.shadowType && shape.shadowType !== "none") {
        const offsetX = shape.shadowOffsetX ?? 4;
        const offsetY = shape.shadowOffsetY ?? 4;
        const blur = shape.shadowBlur ?? 8;
        const color = shape.shadowColor ?? "rgba(0, 0, 0, 0.3)";
        
        if (useClipPath) {
          // clip-path를 사용하는 도형은 drop-shadow filter 사용 (outer shadow만 지원)
          if (shape.shadowType === "outer") {
            filters.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`);
          }
        } else {
          // 일반 도형은 box-shadow 사용
          if (shape.shadowType === "inner") {
            shadows.push(`inset ${offsetX}px ${offsetY}px ${blur}px ${color}`);
          } else {
            shadows.push(`${offsetX}px ${offsetY}px ${blur}px ${color}`);
          }
        }
      }

      // Glow 효과 추가
      if (shape.glowEnabled) {
        const glowColor = shape.glowColor ?? shape.color;
        const glowBlur = shape.glowBlur ?? 20;
        
        if (useClipPath) {
          filters.push(`drop-shadow(0 0 ${glowBlur}px ${glowColor})`);
        } else {
          shadows.push(`0 0 ${glowBlur}px ${glowColor}`);
        }
      }

      // Shadow와 filter 적용
      if (shadows.length > 0) {
        style += `\n      boxShadow: '${shadows.join(", ")}',`;
      }
      if (filters.length > 0) {
        style += `\n      filter: '${filters.join(" ")}',`;
      }
      
      // Stroke (외곽선) 추가
      if (shape.strokeWidth !== undefined && shape.strokeWidth > 0) {
        style += `\n      border: '${shape.strokeWidth}px solid ${shape.strokeColor ?? "#000000"}',`;
      }
      
      return `  <div\n    className="shape-${shape.id}"\n    style={{\n${style}\n    }}\n  />`;
    };
    
    const reactParts = shapes.map((shape) => getShapeReact(shape));
    
    return `import React from 'react';\n\nfunction Shapes() {\n  return (\n    <>\n${reactParts.join("\n")}\n    </>\n  );\n}\n\nexport default Shapes;`;
  }, [shapes]);

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
    };

    if (showShapeMenu || showShapeColorMenu || showTextColorMenu || showEffectsMenu || showStrokeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShapeMenu, showShapeColorMenu, showTextColorMenu, showEffectsMenu, showStrokeMenu]);

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

  // Delete 키로 도형 삭제, 화살표 키로 도형 이동
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // input 필드에 포커스가 있으면 도형 삭제/이동을 하지 않음
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
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
    
    // 도형이나 리사이즈 핸들을 클릭한 경우 무시
    // (handleMouseDown에서 stopPropagation이 호출되므로 여기까지 오지 않음)
    const target = e.target as HTMLElement;
    if (target.closest(".resize-handle") || target.closest(".shape-container")) {
      return;
    }
    
    // 도형 추가 모드가 아닐 때 바탕을 클릭하면 선택 해제
    if (!pendingShapeType) {
      setSelectedShape(null);
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
        const finalWidth = Math.max(20, width);
        const finalHeight = Math.max(20, height);
        // 원/타원의 경우 borderRadius를 undefined로 설정 (렌더링 시 50%로 적용됨)
        // rectangle의 경우 0으로 설정 (나중에 사용자가 조정 가능)
        const initialBorderRadius = (pendingShapeType === "circle" || pendingShapeType === "ellipse") 
          ? undefined 
          : (pendingShapeType === "rectangle" ? 0 : undefined);
        const newShape: Shape = {
          id: Date.now(),
          type: pendingShapeType,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width: finalWidth,
          height: finalHeight,
          color: DEFAULT_SHAPE_COLOR,
          borderRadius: initialBorderRadius,
        };
        setShapes([...shapes, newShape]);
        setSelectedShape(newShape);
        // 원/타원의 경우 borderRadius를 0으로 표시 (실제로는 50%로 렌더링됨)
        setShapeBorderRadius(0);
        setBorderRadiusInputValue("0");
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
    strokeWidth?: number
  ) => {
    if (selectedShape) {
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
      setShapeX(newX);
      setShapeY(newY);
      setShapeBorderRadius(newBorderRadius ?? 0);
      setBorderRadiusInputValue((newBorderRadius ?? 0).toString());
    }
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
        const borderRadius = shape.borderRadius ?? (shape.type === "circle" || shape.type === "ellipse" ? Math.min(shape.width, shape.height) / 2 : 0);
        setShapeBorderRadius(borderRadius);
        setBorderRadiusInputValue(borderRadius.toString());
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
    const borderRadius = shape.borderRadius ?? (shape.type === "circle" || shape.type === "ellipse" ? Math.min(shape.width, shape.height) / 2 : 0);
    setShapeBorderRadius(borderRadius);
    setBorderRadiusInputValue(borderRadius.toString());
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
    <div className="h-screen flex bg-black dark:bg-black">
      {/* 왼쪽 패널: 파일 탐색기 (Cursor 스타일) */}
      <div className="w-64 bg-black dark:bg-black border-r border-pink-300/30 dark:border-pink-300/20/30 flex flex-col">
        <div className="px-4 py-2 border-b border-pink-300/30 dark:border-pink-300/20/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white dark:text-white">
            Current Directory
          </h2>
          <div className="flex gap-1">
            <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Add File">
              <img src={newfileIcon} alt="New File" className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Add Folder">
              <img src={newfolderIcon} alt="New Folder" className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-0.5">
            {files.map((file, index) => (
              <div
                key={index}
                onClick={() => handleFileClick(file.name)}
                className={`px-2 py-1.5 rounded text-sm flex items-center gap-2 cursor-pointer ${
                  activeFile === file.name
                    ? "bg-pink-300 dark:bg-pink-300 text-black"
                    : "text-white dark:text-white hover:bg-pink-300 dark:hover:bg-pink-300 hover:text-black"
                }`}
              >
                {file.type === "folder" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                ) : (
                  (() => {
                    const icon = getFileIcon(file.name, file.extension);
                    return icon ? (
                      <img src={icon} alt={file.name} className="w-auto h-4" />
                    ) : (
                      <span className="text-xs">{"<>"}</span>
                    );
                  })()
                )}
                <span className="flex-1 truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 중간 패널: 파워포인트 스타일 캔버스 */}
      <div className="flex-1 flex flex-col bg-black dark:bg-black border-r border-pink-300/30 dark:border-pink-300/20/30">
        {/* 상단 리본 바 */}
        <div className="bg-black dark:bg-black border-b border-pink-300/30 dark:border-pink-300/20/30 px-4 py-3 flex items-center gap-4">
          {/* 아이콘 버튼 그룹 */}
          <div className="flex items-center gap-0.5">
            {/* 텍스트 추가 버튼 */}
            <button className="p-3 bg-black dark:bg-black rounded flex items-center justify-center text-white hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors cursor-pointer">
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
                            
                            const newShape: Shape = {
                              id: Date.now(),
                              type: "image",
                              x: Math.max(0, (rect.width - width) / 2),
                              y: Math.max(0, (rect.height - height) / 2),
                              width: Math.max(50, width),
                              height: Math.max(50, height),
                              color: DEFAULT_SHAPE_COLOR,
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
          <div className="flex flex-col gap-2">
            {/* 첫 번째 줄: Font, Size */}
            <div className="flex items-center gap-2">
              <select className="px-2 py-1 bg-black dark:bg-black text-white border border-pink-300/20 rounded text-sm">
                <option className="bg-black text-white">Nanum Gothic</option>
              </select>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 bg-black dark:bg-black text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20 rounded text-sm flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input 
                  type="number" 
                  value={16} 
                  className="w-16 px-2 py-1 bg-black dark:bg-black text-white border border-pink-300/20 rounded text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" 
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <button className="px-2 py-1 bg-black dark:bg-black text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20 rounded text-sm flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            {/* 두 번째 줄: 색상, Bold, 정렬 */}
            <div className="flex items-center gap-2">
              {/* Text Color 버튼 (아이콘 + 텍스트 + 드롭다운) */}
              <div className="relative" ref={textColorMenuRef}>
                <button 
                  onClick={() => setShowTextColorMenu(!showTextColorMenu)}
                  className="px-3 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20 flex items-center gap-2"
                >
                  <img src={textColorIcon} alt="Text Color" className="w-auto h-4" />
                  <span>Text Color</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTextColorMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-black dark:bg-black border border-pink-300/20 dark:border-pink-300/20 rounded shadow-lg z-10 p-3">
                    <input
                      id="text-color-input-in-dropdown"
                      type="color"
                      value={textColor}
                      onChange={(e) => {
                        setTextColor(e.target.value);
                      }}
                      className="h-32 w-full cursor-pointer"
                    />
                  </div>
                )}
              </div>
              <button className="px-3 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 font-bold border border-pink-300/20">B</button>
              <div className="flex gap-1">
                <button className="px-2 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20">
                  <img src={alignLeftIcon} alt="Align Left" className="w-4 h-4" />
                </button>
                <button className="px-2 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20">
                  <img src={alignCenterIcon} alt="Align Center" className="w-4 h-4" />
                </button>
                <button className="px-2 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20">
                  <img src={alignRightIcon} alt="Align Right" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-20 w-px bg-pink-300/30 dark:bg-pink-300/30"></div>

          {/* 도형 편집 칸 (도형 선택 시 표시) */}
          {selectedShape && (
            <div className="flex flex-col gap-2">
              {/* 첫 번째 줄: Fill Color, Effects */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={shapeColorMenuRef}>
                  <button 
                    onClick={() => {
                      if (selectedShape.type !== "image") {
                        setShowShapeColorMenu(!showShapeColorMenu);
                      }
                    }}
                    disabled={selectedShape.type === "image"}
                    className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                      selectedShape.type === "image"
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
                  {showShapeColorMenu && selectedShape.type !== "image" && (
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
                      />
                    </div>
                  )}
                </div>
                {/* Effects 버튼 */}
                <div className="relative" ref={effectsMenuRef}>
                  <button 
                    onClick={() => {
                      if (!isNonTrianglePolygon(selectedShape.type)) {
                        setShowEffectsMenu(!showEffectsMenu);
                      }
                    }}
                    disabled={isNonTrianglePolygon(selectedShape.type)}
                    className={`px-3 py-1 bg-black dark:bg-black rounded text-sm border border-pink-300/20 flex items-center gap-2 ${
                      isNonTrianglePolygon(selectedShape.type)
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
                  {showEffectsMenu && !isNonTrianglePolygon(selectedShape.type) && (
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
              </div>
              {/* 두 번째 줄: Stroke, Corner Radius */}
              <div className="flex items-center gap-2">
                <div className="relative" ref={strokeMenuRef}>
                  <button 
                    onClick={() => setShowStrokeMenu(!showStrokeMenu)}
                    className="px-3 py-1 bg-black dark:bg-black rounded text-sm text-white hover:bg-gray-800 dark:hover:bg-gray-800 border border-pink-300/20 flex items-center gap-2"
                  >
                    <img src={strokeIcon} alt="Stroke" className="w-auto h-4" />
                    <span>Stroke</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStrokeMenu && (
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
                      className={`w-auto h-4 ${selectedShape.type !== "rectangle" ? "opacity-50" : ""}`} 
                    />
                    <span className={`text-sm ${selectedShape.type !== "rectangle" ? "text-gray-500" : "text-white dark:text-white"}`}>
                      Corner Radius:
                    </span>
                    <input
                      ref={borderRadiusInputRef}
                      type="text"
                      value={borderRadiusInputValue}
                      disabled={selectedShape.type !== "rectangle"}
                      onChange={(e) => {
                        if (selectedShape.type !== "rectangle") return;
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
                        if (selectedShape.type !== "rectangle") return;
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
                        selectedShape.type !== "rectangle" 
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
                      disabled={selectedShape.type !== "rectangle"}
                      onChange={(e) => {
                        if (selectedShape.type !== "rectangle") return;
                        const newRadius = Number(e.target.value);
                        setShapeBorderRadius(newRadius);
                        setBorderRadiusInputValue(newRadius.toString());
                        updateSelectedShape(undefined, undefined, undefined, undefined, undefined, newRadius);
                      }}
                      className={`flex-1 h-2 bg-gray-700 rounded-lg appearance-none ${
                        selectedShape.type !== "rectangle" 
                          ? "opacity-50 cursor-not-allowed" 
                          : "cursor-pointer accent-pink-300"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
            {shapes.map((shape) => {
              const isSelected = selectedShape?.id === shape.id;
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
                          : (isSelected ? "2px solid #f9a8d4" : "none"),
                        cursor: isDragging && isSelected ? "grabbing" : isSelected ? "move" : "grab",
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
                        outline: isSelected ? "2px solid #f9a8d4" : "none",
                        outlineOffset: isSelected ? (shape.strokeWidth && shape.strokeWidth > 0 ? `-${shape.strokeWidth + 2}px` : "-2px") : "0",
                        cursor: isDragging && isSelected ? "grabbing" : isSelected ? "move" : "grab",
                        userSelect: "none",
                      }}
                    />
                  )}
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
            <input type="checkbox" className="accent-pink-300"
            checked={codeView === "react"}
            onChange={() => setCodeView("react")}
            />
            React
          </label>
        </div>

        {/* 파일 탭 (여러 개 열 수 있음) */}
        <div className="px-2 pt-1 flex items-end gap-1 overflow-x-auto">
          {openedFiles.map((fileName) => {
            const file = files.find(f => f.name === fileName);
            const icon = getFileIcon(fileName, file?.extension);
            return (
              <div
                key={fileName}
                onClick={() => handleTabClick(fileName)}
                className={`px-3 py-1 text-sm flex items-center gap-2 cursor-pointer min-w-fit ${
                  activeFile === fileName
                    ? "bg-[#1B0F0F] dark:bg-[#1B0F0F] text-white border-t border-pink-300"
                    : "bg-black dark:bg-black text-white hover:bg-gray-900 dark:hover:bg-gray-900"
                }`}
              >
                {icon ? (
                  <img src={icon} alt={fileName} className="w-auto h-4" />
                ) : (
                  <span className="text-xs">{"<>"}</span>
                )}
                <span className="truncate max-w-[120px]">{fileName}</span>
                {openedFiles.length > 1 && (
                  <button
                    onClick={(e) => handleTabClose(e, fileName)}
                    className="ml-1 hover:bg-gray-700 dark:hover:bg-gray-700 rounded px-1 text-xs"
                    title="닫기"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 코드 편집 창 */}
        <div className="flex-1 overflow-auto -mt-px">
          <SyntaxHighlighter
            language={codeView === "xml" ? "xml" : codeView === "css" ? "css" : "tsx"}
            style={dracula}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.75rem",
              backgroundColor: "#1B0F0F",
              height: "100%",
            }}
            showLineNumbers={false}
          >
            {codeView === "xml" ? generateXML : codeView === "css" ? generateCSS : generateReact}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

export default App;
