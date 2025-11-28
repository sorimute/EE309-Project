import { Shape, Text, ShapeType } from '../types';
import { DEFAULT_SHAPE_COLOR } from '../constants/colors';

/**
 * JSX/TSX 코드를 파싱하여 구조를 추출합니다.
 * 간단한 정규식 기반 파서로 시작하되, 확장 가능하게 구조화합니다.
 */
export const parseJSX = (code: string): { shapes: Shape[]; texts: Text[]; originalCode: string } => {
  const shapes: Shape[] = [];
  const texts: Text[] = [];
  
  try {
    // JSX 요소를 찾는 정규식 (간단한 버전)
    // <div>, <span>, <button> 등의 요소를 찾습니다
    const jsxElementRegex = /<(\w+)([^>]*)>([^<]*)<\/\1>/g;
    const selfClosingRegex = /<(\w+)([^>]*)\s*\/>/g;
    
    let elementId = 1;
    let match;
    
    // 일반 JSX 요소 파싱
    while ((match = jsxElementRegex.exec(code)) !== null) {
      const tagName = match[1];
      const attributes = match[2];
      const content = match[3].trim();
      
      // 속성 파싱
      const props: Record<string, any> = {};
      const styleRegex = /style=\{?\{([^}]+)\}\}?/g;
      const classNameRegex = /className=["']([^"']+)["']/g;
      const idRegex = /id=["']([^"']+)["']/g;
      
      // style 속성 추출
      const styleMatch = attributes.match(styleRegex);
      if (styleMatch) {
        const styleContent = styleMatch[0].match(/\{([^}]+)\}/)?.[1] || '';
        const styleProps: Record<string, string> = {};
        
        // CSS 속성 파싱 (예: position: 'absolute', left: 100 등)
        const cssProps = styleContent.split(',').map(s => s.trim());
        cssProps.forEach(prop => {
          const [key, value] = prop.split(':').map(s => s.trim().replace(/['"]/g, ''));
          if (key && value) {
            styleProps[key] = value;
          }
        });
        props.style = styleProps;
      }
      
      // className 추출
      const classNameMatch = attributes.match(classNameRegex);
      if (classNameMatch) {
        props.className = classNameMatch[0].match(/["']([^"']+)["']/)?.[1];
      }
      
      // id 추출
      const idMatch = attributes.match(idRegex);
      if (idMatch) {
        props.id = idMatch[0].match(/["']([^"']+)["']/)?.[1];
      }
      
      // 위치 및 크기 추출
      const style = props.style || {};
      const x = parseInt(style.left || style.x || '0');
      const y = parseInt(style.top || style.y || '0');
      const width = parseInt(style.width || '100');
      const height = parseInt(style.height || '50');
      const backgroundColor = style.backgroundColor || style.background || DEFAULT_SHAPE_COLOR;
      const color = style.color || '#000000';
      const fontSize = parseInt(style.fontSize || '16');
      const zIndex = parseInt(style.zIndex || '0');
      
      // 텍스트가 있는 경우 Text로 변환
      if (content && (tagName === 'span' || tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'label' || tagName === 'button')) {
        texts.push({
          id: elementId++,
          x,
          y,
          width,
          height: height || fontSize * 1.5,
          text: content,
          fontSize,
          color,
          fontFamily: style.fontFamily || 'Arial',
          fontWeight: style.fontWeight || 'normal',
          fontStyle: style.fontStyle || 'normal',
          textAlign: (style.textAlign || 'left') as 'left' | 'center' | 'right',
        });
      } else {
        // 도형으로 변환
        const shapeType: ShapeType = getShapeTypeFromTag(tagName, style);
        
        shapes.push({
          id: elementId++,
          type: shapeType,
          x,
          y,
          width,
          height,
          color: backgroundColor,
          zIndex,
          borderRadius: style.borderRadius ? parseInt(style.borderRadius) : undefined,
          opacity: style.opacity ? parseFloat(style.opacity) : undefined,
        });
      }
    }
    
    // Self-closing 태그 파싱
    while ((match = selfClosingRegex.exec(code)) !== null) {
      const tagName = match[1];
      const attributes = match[2];
      
      const props: Record<string, any> = {};
      const styleRegex = /style=\{?\{([^}]+)\}\}?/g;
      const styleMatch = attributes.match(styleRegex);
      
      if (styleMatch) {
        const styleContent = styleMatch[0].match(/\{([^}]+)\}/)?.[1] || '';
        const styleProps: Record<string, string> = {};
        const cssProps = styleContent.split(',').map(s => s.trim());
        cssProps.forEach(prop => {
          const [key, value] = prop.split(':').map(s => s.trim().replace(/['"]/g, ''));
          if (key && value) {
            styleProps[key] = value;
          }
        });
        props.style = styleProps;
      }
      
      const style = props.style || {};
      const x = parseInt(style.left || style.x || '0');
      const y = parseInt(style.top || style.y || '0');
      const width = parseInt(style.width || '100');
      const height = parseInt(style.height || '50');
      const backgroundColor = style.backgroundColor || style.background || DEFAULT_SHAPE_COLOR;
      const zIndex = parseInt(style.zIndex || '0');
      
      const shapeType: ShapeType = getShapeTypeFromTag(tagName, style);
      
      shapes.push({
        id: elementId++,
        type: shapeType,
        x,
        y,
        width,
        height,
        color: backgroundColor,
        zIndex,
        borderRadius: style.borderRadius ? parseInt(style.borderRadius) : undefined,
        opacity: style.opacity ? parseFloat(style.opacity) : undefined,
      });
    }
    
  } catch (error) {
    console.error('JSX 파싱 오류:', error);
  }
  
  return { shapes, texts, originalCode: code };
};

/**
 * 태그 이름과 스타일을 기반으로 ShapeType을 결정합니다.
 */
const getShapeTypeFromTag = (tagName: string, style: Record<string, string>): ShapeType => {
  // 이미지 태그
  if (tagName === 'img' || tagName === 'image') {
    return 'image';
  }
  
  // border-radius에 따라 결정
  const borderRadius = style.borderRadius;
  if (borderRadius) {
    if (borderRadius === '50%') {
      return 'circle';
    } else if (parseInt(borderRadius) > 0) {
      return 'roundedRectangle';
    }
  }
  
  // 기본적으로 rectangle
  return 'rectangle';
};

