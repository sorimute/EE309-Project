import { Shape, Text, ShapeType } from '../types';

export const parseXML = (xml: string): { shapes: Shape[]; texts: Text[] } => {
  try {
    const parsedShapes: Shape[] = [];
    const parsedTexts: Text[] = [];
    
    // Shape 파싱
    const shapeRegex = /<shape id="(\d+)" type="([^"]+)">\s*<position x="(\d+)" y="(\d+)" \/>\s*<size width="(\d+)" height="(\d+)" \/>\s*<style color="([^"]+)"(?: zIndex="(\d+)")?(?: borderRadius="([^"]+)")(?: shadowType="([^"]+)" shadowColor="([^"]+)" shadowBlur="(\d+)" shadowOffsetX="(\d+)" shadowOffsetY="(\d+)")?(?: opacity="([^"]+)")?(?: glowEnabled="([^"]+)" glowColor="([^"]+)" glowBlur="(\d+)")?(?: strokeColor="([^"]+)" strokeWidth="(\d+)")? \/>\s*<\/shape>/g;
    let match;
    
    while ((match = shapeRegex.exec(xml)) !== null) {
      const id = parseInt(match[1]);
      const type = match[2] as ShapeType;
      const x = parseInt(match[3]);
      const y = parseInt(match[4]);
      const width = parseInt(match[5]);
      const height = parseInt(match[6]);
      const color = match[7];
      const zIndex = match[8] ? parseInt(match[8]) : 0;
      const borderRadius = match[9] ? (match[9] === "50%" ? undefined : parseInt(match[9])) : undefined;
      
      const shape: Shape = {
        id,
        type,
        x,
        y,
        width,
        height,
        color,
        zIndex,
        borderRadius,
      };
      
      if (match[10]) {
        shape.shadowType = match[10] as "none" | "outer" | "inner";
        shape.shadowColor = match[11];
        shape.shadowBlur = parseInt(match[12]);
        shape.shadowOffsetX = parseInt(match[13]);
        shape.shadowOffsetY = parseInt(match[14]);
      }
      
      if (match[15]) {
        shape.opacity = parseFloat(match[15]);
      }
      
      if (match[16] === "true") {
        shape.glowEnabled = true;
        shape.glowColor = match[17];
        shape.glowBlur = parseInt(match[18]);
      }
      
      if (match[19]) {
        shape.strokeColor = match[19];
        shape.strokeWidth = parseInt(match[20]);
      }
      
      parsedShapes.push(shape);
    }
    
    // Text 파싱
    const textRegex = /<text id="(\d+)">\s*<position x="(\d+)" y="(\d+)" \/>\s*<size width="(\d+)" height="(\d+)" \/>\s*<content>([^<]*)<\/content>\s*<style fontSize="(\d+)" color="([^"]+)" fontFamily="([^"]+)" fontWeight="([^"]+)" fontStyle="([^"]+)" textAlign="([^"]+)" \/>\s*<\/text>/g;
    
    while ((match = textRegex.exec(xml)) !== null) {
      const id = parseInt(match[1]);
      const x = parseInt(match[2]);
      const y = parseInt(match[3]);
      const width = parseInt(match[4]);
      const height = parseInt(match[5]);
      const text = match[6];
      const fontSize = parseInt(match[7]);
      const color = match[8];
      const fontFamily = match[9];
      const fontWeight = match[10] as "normal" | "bold";
      const fontStyle = match[11] as "normal" | "italic";
      const textAlign = match[12] as "left" | "center" | "right";
      
      const parsedText: Text = {
        id,
        x,
        y,
        width,
        height,
        text,
        fontSize,
        color,
        fontFamily,
        fontWeight,
        fontStyle,
        textAlign,
      };
      
      parsedTexts.push(parsedText);
    }
    
    return { shapes: parsedShapes, texts: parsedTexts };
  } catch (error) {
    console.error("XML 파싱 오류:", error);
    return { shapes: [], texts: [] };
  }
};

