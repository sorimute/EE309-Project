import { Shape, Text } from '../types';

export const generateXML = (shapes: Shape[], texts: Text[]): string => {
  if (shapes.length === 0 && texts.length === 0) return "<!-- 코드가 여기에 표시됩니다 -->";
  
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
    <style color="${shape.color}" zIndex="${shape.zIndex}" borderRadius="${borderRadiusValue}"${shadowAttr}${opacityAttr}${glowAttr}${strokeAttr}${imageAttr} />
  </shape>`;
  });
  
  const textParts = texts.map((text) => {
    return `  <text id="${text.id}">
    <position x="${text.x}" y="${text.y}" />
    <size width="${text.width}" height="${text.height}" />
    <content>${text.text}</content>
    <style fontSize="${text.fontSize}" color="${text.color}" fontFamily="${text.fontFamily}" fontWeight="${text.fontWeight}" fontStyle="${text.fontStyle}" textAlign="${text.textAlign}" zIndex="${text.zIndex}" />
  </text>`;
  });
  
  const allParts = [...xmlParts, ...textParts];
  return `<root>\n${allParts.join("\n")}\n</root>`;
};

