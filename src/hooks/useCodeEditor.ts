import { useState, useEffect, useMemo } from 'react';
import { generateXML, generateCSS, generateReact } from '../generators';
import { parseXML, parseCSS, parseReact } from '../parsers';
import { Shape, Text } from '../types';

export function useCodeEditor(shapes: Shape[], texts: Text[], setShapes: (shapes: Shape[]) => void, setTexts: (texts: Text[]) => void) {
  const [codeView, setCodeView] = useState<"xml" | "css" | "react">("xml");
  const [codeContent, setCodeContent] = useState<string>("");
  const [isCodeEditing, setIsCodeEditing] = useState<boolean>(false);

  // XML 코드 생성 (메모이제이션)
  const xmlCode = useMemo(() => generateXML(shapes, texts), [shapes, texts]);

  // CSS 코드 생성 (메모이제이션)
  const cssCode = useMemo(() => generateCSS(shapes, texts), [shapes, texts]);

  // React 코드 생성 (메모이제이션)
  const reactCode = useMemo(() => generateReact(shapes, texts), [shapes, texts]);

  // 코드 변경 핸들러
  const handleCodeChange = (newCode: string) => {
    setCodeContent(newCode);
    setIsCodeEditing(true);
    
    try {
      let parsedShapes: Shape[] = [];
      let parsedTexts: Text[] = [];
      
      if (codeView === "xml") {
        const result = parseXML(newCode);
        parsedShapes = result.shapes;
        parsedTexts = result.texts;
      } else if (codeView === "css") {
        const result = parseCSS(newCode);
        parsedShapes = result.shapes;
        parsedTexts = result.texts;
      } else if (codeView === "react") {
        const result = parseReact(newCode);
        parsedShapes = result.shapes;
        parsedTexts = result.texts;
      }
      
      if (parsedShapes.length > 0 || parsedTexts.length > 0) {
        setShapes(parsedShapes);
        setTexts(parsedTexts);
      }
    } catch (error) {
      console.error("코드 파싱 오류:", error);
    }
  };

  // shapes, texts 변경 시 코드 업데이트
  useEffect(() => {
    if (!isCodeEditing) {
      const generatedCode = codeView === "xml" ? xmlCode : codeView === "css" ? cssCode : reactCode;
      setCodeContent(generatedCode);
    }
  }, [shapes, texts, codeView, isCodeEditing, xmlCode, cssCode, reactCode]);
      
  // codeView 변경 시 코드 업데이트
  useEffect(() => {
    setIsCodeEditing(false);
    const generatedCode = codeView === "xml" ? xmlCode : codeView === "css" ? cssCode : reactCode;
    setCodeContent(generatedCode);
  }, [codeView, xmlCode, cssCode, reactCode]);

  // 초기 코드 설정
  useEffect(() => {
    const generatedCode = codeView === "xml" ? xmlCode : codeView === "css" ? cssCode : reactCode;
    setCodeContent(generatedCode);
  }, []);

  return {
    codeView,
    setCodeView,
    codeContent,
    setCodeContent,
    isCodeEditing,
    setIsCodeEditing,
    handleCodeChange,
    xmlCode,
    cssCode,
    reactCode,
  };
}


