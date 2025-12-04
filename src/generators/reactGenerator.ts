import { Shape, Text } from '../types';
import { isClipPathShape } from '../utils/shapeUtils';

// 개별 요소 생성 함수 (코드 통합용)
function getShapeReact(shape: Shape): string {
    if (shape.type === "triangle") {
      let svgStyle = `      position: 'absolute',\n      left: ${shape.x},\n      top: ${shape.y},\n      width: ${shape.width},\n      height: ${shape.height},\n      zIndex: ${shape.zIndex},`;
      
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
    
    let style = `      position: 'absolute',\n      left: ${shape.x},\n      top: ${shape.y},\n      width: ${shape.width},\n      height: ${shape.height},\n      zIndex: ${shape.zIndex},`;
    
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
    
    // roundedRectangle 타입의 경우 사용자가 설정한 borderRadius 사용
    if (shape.type === "roundedRectangle" && shape.borderRadius !== undefined) {
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
  
function getTextReact(text: Text): string {
    const escapedText = text.text.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    let style = `      position: 'absolute',\n      left: ${text.x},\n      top: ${text.y},\n      width: ${text.width},\n      height: ${text.height},\n      fontSize: ${text.fontSize},\n      color: '${text.color}',\n      fontFamily: '${text.fontFamily}',\n      fontWeight: '${text.fontWeight}',\n      fontStyle: '${text.fontStyle}',\n      textAlign: '${text.textAlign}',\n      zIndex: ${text.zIndex},`;
    return `  <div\n    className="text-${text.id}"\n    style={{\n${style}\n    }}\n  >\n    ${escapedText}\n  </div>`;
  };
  
export const generateReact = (shapes: Shape[], texts: Text[]): string => {
  if (shapes.length === 0 && texts.length === 0) return "// 코드가 여기에 표시됩니다";
  
  const shapeParts = shapes.map((shape) => getShapeReact(shape));
  const textParts = texts.map((text) => getTextReact(text));
  const reactParts = [...shapeParts, ...textParts];
  
  return `import React from 'react';\n\nfunction Shapes() {\n  return (\n    <>\n${reactParts.join("\n")}\n    </>\n  );\n}\n\nexport default Shapes;`;
};

// 개별 요소 생성 함수 export (코드 통합용)
export function getShapeReactCode(shape: Shape): string {
  return getShapeReact(shape);
}

export function getTextReactCode(text: Text): string {
  return getTextReact(text);
}

