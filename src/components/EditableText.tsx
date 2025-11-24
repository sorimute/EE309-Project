import { forwardRef, useRef, useEffect, useImperativeHandle } from "react";
import { Text } from '../types';

interface EditableTextProps {
  text: Text;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: () => void;
}

const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(
  ({ text, onBlur, onKeyDown, onInput }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    
    useImperativeHandle(ref, () => divRef.current as HTMLDivElement);
    
    // 편집 모드로 전환될 때만 내용 설정
    useEffect(() => {
      if (divRef.current && divRef.current.textContent !== text.text) {
        divRef.current.textContent = text.text;
      }
    }, []); // 빈 의존성 배열 - 마운트 시에만 실행
    
    return (
      <div
        ref={divRef}
        className="text-container"
        contentEditable
        suppressContentEditableWarning
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onInput={onInput}
        style={{
          position: "absolute",
          left: `${text.x}px`,
          top: `${text.y}px`,
          width: `${text.width}px`,
          height: `${text.height}px`,
          fontSize: `${text.fontSize}px`,
          color: text.color,
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          fontStyle: text.fontStyle,
          textAlign: text.textAlign,
          cursor: "text",
          userSelect: "text",
          border: "2px solid #f9a8d4",
          padding: "2px",
          borderRadius: "2px",
          backgroundColor: "rgba(249, 168, 212, 0.1)",
          outline: "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          overflow: "hidden",
          boxSizing: "border-box",
          zIndex: text.zIndex,
        }}
      />
    );
  }
);

EditableText.displayName = "EditableText";

export default EditableText;

