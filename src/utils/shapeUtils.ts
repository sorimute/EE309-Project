import { ShapeType, Shape } from '../types';

// clip-path를 사용하는 도형 타입인지 확인
export const isClipPathShape = (type: ShapeType): boolean => {
  return type === "triangle" || type === "diamond" || type === "star" || type === "hexagon" || type === "pentagon";
};

// triangle을 제외한 polygon 타입인지 확인 (Effects 비활성화용)
export const isNonTrianglePolygon = (type: ShapeType): boolean => {
  return type === "diamond" || type === "star" || type === "hexagon" || type === "pentagon";
};

// 도형 타입에 따른 스타일 반환 (위치 정보 제외, 모양만)
export const getShapeStyle = (shape: Shape): React.CSSProperties => {
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

  // roundedRectangle 타입의 경우 사용자가 설정한 borderRadius 사용
  if (shape.type === "roundedRectangle" && shape.borderRadius !== undefined) {
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

