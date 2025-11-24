import { Shape, Text, ShapeType } from '../types';

export const parseCSS = (css: string): { shapes: Shape[]; texts: Text[] } => {
  try {
    const parsedShapes: Shape[] = [];
    const parsedTexts: Text[] = [];
    
    // Shape 파싱
    const shapeRegex = /\.shape-(\d+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = shapeRegex.exec(css)) !== null) {
      const id = parseInt(match[1]);
      const styleContent = match[2];
      
      const leftMatch = styleContent.match(/left:\s*(\d+)px/);
      const topMatch = styleContent.match(/top:\s*(\d+)px/);
      const widthMatch = styleContent.match(/width:\s*(\d+)px/);
      const heightMatch = styleContent.match(/height:\s*(\d+)px/);
      const colorMatch = styleContent.match(/background-color:\s*([^;]+);/);
      const zIndexMatch = styleContent.match(/z-index:\s*(\d+);/);
      const borderRadiusMatch = styleContent.match(/border-radius:\s*([^;]+);/);
      const opacityMatch = styleContent.match(/opacity:\s*([^;]+);/);
      
      if (!leftMatch || !topMatch || !widthMatch || !heightMatch) continue;
      
      const x = parseInt(leftMatch[1]);
      const y = parseInt(topMatch[1]);
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      const color = colorMatch ? colorMatch[1].trim() : "#f9a8d4";
      const zIndex = zIndexMatch ? parseInt(zIndexMatch[1]) : 0;
      
      // 타입 추론 (간단한 버전)
      let type: ShapeType = "rectangle";
      if (borderRadiusMatch) {
        const br = borderRadiusMatch[1].trim();
        if (br === "50%") {
          type = width === height ? "circle" : "ellipse";
        } else if (br !== "0" && br !== "0px") {
          type = "roundedRectangle";
        }
      }
      
      const shape: Shape = {
        id,
        type,
        x,
        y,
        width,
        height,
        color,
        zIndex,
      };
      
      if (borderRadiusMatch && borderRadiusMatch[1].trim() !== "50%") {
        const br = borderRadiusMatch[1].trim();
        if (br.endsWith("px")) {
          shape.borderRadius = parseInt(br);
        }
      }
      
      if (opacityMatch) {
        shape.opacity = parseFloat(opacityMatch[1].trim());
      }
      
      parsedShapes.push(shape);
    }
    
    // Text 파싱
    const textRegex = /\.text-(\d+)\s*\{([^}]+)\}/g;
    
    while ((match = textRegex.exec(css)) !== null) {
      const id = parseInt(match[1]);
      const styleContent = match[2];
      
      const leftMatch = styleContent.match(/left:\s*(\d+)px/);
      const topMatch = styleContent.match(/top:\s*(\d+)px/);
      const widthMatch = styleContent.match(/width:\s*(\d+)px/);
      const heightMatch = styleContent.match(/height:\s*(\d+)px/);
      const fontSizeMatch = styleContent.match(/font-size:\s*(\d+)px/);
      const colorMatch = styleContent.match(/color:\s*([^;]+);/);
      const fontFamilyMatch = styleContent.match(/font-family:\s*([^;]+);/);
      const fontWeightMatch = styleContent.match(/font-weight:\s*([^;]+);/);
      const fontStyleMatch = styleContent.match(/font-style:\s*([^;]+);/);
      const textAlignMatch = styleContent.match(/text-align:\s*([^;]+);/);
      const zIndexMatch = styleContent.match(/z-index:\s*(\d+);/);
      
      if (!leftMatch || !topMatch || !widthMatch || !heightMatch) continue;
      
      const parsedText: Text = {
        id,
        x: parseInt(leftMatch[1]),
        y: parseInt(topMatch[1]),
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1]),
        text: "",
        fontSize: fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16,
        color: colorMatch ? colorMatch[1].trim() : "#000000",
        fontFamily: fontFamilyMatch ? fontFamilyMatch[1].trim() : "Arial",
        fontWeight: (fontWeightMatch ? fontWeightMatch[1].trim() : "normal") as "normal" | "bold",
        fontStyle: (fontStyleMatch ? fontStyleMatch[1].trim() : "normal") as "normal" | "italic",
        textAlign: (textAlignMatch ? textAlignMatch[1].trim() : "left") as "left" | "center" | "right",
        zIndex: zIndexMatch ? parseInt(zIndexMatch[1]) : 0,
      };
      
      parsedTexts.push(parsedText);
    }
    
    return { shapes: parsedShapes, texts: parsedTexts };
  } catch (error) {
    console.error("CSS 파싱 오류:", error);
    return { shapes: [], texts: [] };
  }
};

