import { Shape, Text, ShapeType } from '../types';

export const parseReact = (react: string): { shapes: Shape[]; texts: Text[] } => {
  try {
    const parsedShapes: Shape[] = [];
    const parsedTexts: Text[] = [];
    
    // Shape 파싱 (div)
    const divRegex = /<div\s+className="shape-(\d+)"\s+style=\{\{([^}]+)\}\}\s*\/>/g;
    let match;
    
    while ((match = divRegex.exec(react)) !== null) {
      const id = parseInt(match[1]);
      const styleContent = match[2];
      
      const leftMatch = styleContent.match(/left:\s*(\d+)/);
      const topMatch = styleContent.match(/top:\s*(\d+)/);
      const widthMatch = styleContent.match(/width:\s*(\d+)/);
      const heightMatch = styleContent.match(/height:\s*(\d+)/);
      const colorMatch = styleContent.match(/backgroundColor:\s*'([^']+)'/);
      const zIndexMatch = styleContent.match(/zIndex:\s*(\d+)/);
      const borderRadiusMatch = styleContent.match(/borderRadius:\s*'?([^',}]+)'?/);
      
      if (!leftMatch || !topMatch || !widthMatch || !heightMatch) continue;
      
      const x = parseInt(leftMatch[1]);
      const y = parseInt(topMatch[1]);
      const width = parseInt(widthMatch[1]);
      const height = parseInt(heightMatch[1]);
      const color = colorMatch ? colorMatch[1] : "#f9a8d4";
      const zIndex = zIndexMatch ? parseInt(zIndexMatch[1]) : 0;
      
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
        if (!br.endsWith("%") && !br.endsWith("px")) {
          shape.borderRadius = parseInt(br);
        }
      }
      
      parsedShapes.push(shape);
    }
    
    // Text 파싱
    const textDivRegex = /<div\s+className="text-(\d+)"\s+style=\{\{([^}]+)\}\}\s*>\s*([^<]+)\s*<\/div>/g;
    
    while ((match = textDivRegex.exec(react)) !== null) {
      const id = parseInt(match[1]);
      const styleContent = match[2];
      const text = match[3].trim();
      
      const leftMatch = styleContent.match(/left:\s*(\d+)/);
      const topMatch = styleContent.match(/top:\s*(\d+)/);
      const widthMatch = styleContent.match(/width:\s*(\d+)/);
      const heightMatch = styleContent.match(/height:\s*(\d+)/);
      const fontSizeMatch = styleContent.match(/fontSize:\s*(\d+)/);
      const colorMatch = styleContent.match(/color:\s*'([^']+)'/);
      
      if (!leftMatch || !topMatch || !widthMatch || !heightMatch) continue;
      
      const parsedText: Text = {
        id,
        x: parseInt(leftMatch[1]),
        y: parseInt(topMatch[1]),
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1]),
        text,
        fontSize: fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16,
        color: colorMatch ? colorMatch[1] : "#000000",
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left",
      };
      
      parsedTexts.push(parsedText);
    }
    
    return { shapes: parsedShapes, texts: parsedTexts };
  } catch (error) {
    console.error("React 파싱 오류:", error);
    return { shapes: [], texts: [] };
  }
};

