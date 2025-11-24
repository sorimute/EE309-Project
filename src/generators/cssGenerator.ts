import { Shape, Text } from '../types';
import { isClipPathShape } from '../utils/shapeUtils';

export const generateCSS = (shapes: Shape[], texts: Text[]): string => {
  if (shapes.length === 0 && texts.length === 0) return "/* 코드가 여기에 표시됩니다 */";
  
  const getShapeCSS = (shape: Shape) => {
    let css = `.shape-${shape.id} {\n  position: absolute;\n  left: ${shape.x}px;\n  top: ${shape.y}px;\n  width: ${shape.width}px;\n  height: ${shape.height}px;\n  z-index: ${shape.zIndex};`;
    
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
    
    // roundedRectangle 타입의 경우 사용자가 설정한 borderRadius 사용
    if (shape.type === "roundedRectangle" && shape.borderRadius !== undefined) {
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
  
  const getTextCSS = (text: Text) => {
    let css = `.text-${text.id} {\n  position: absolute;\n  left: ${text.x}px;\n  top: ${text.y}px;\n  width: ${text.width}px;\n  height: ${text.height}px;\n  font-size: ${text.fontSize}px;\n  color: ${text.color};\n  font-family: ${text.fontFamily};\n  font-weight: ${text.fontWeight};\n  font-style: ${text.fontStyle};\n  text-align: ${text.textAlign};\n  z-index: ${text.zIndex};\n}`;
    return css;
  };
  
  const shapeParts = shapes.map((shape) => getShapeCSS(shape));
  const textParts = texts.map((text) => getTextCSS(text));
  
  return [...shapeParts, ...textParts].join("\n\n");
};

