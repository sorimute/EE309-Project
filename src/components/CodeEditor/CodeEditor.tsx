import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  codeView: "xml" | "css" | "react";
  codeContent: string;
  onCodeChange: (value: string) => void;
  onCodeViewChange: (view: "xml" | "css" | "react") => void;
}

export default function CodeEditor({ codeView, codeContent, onCodeChange, onCodeViewChange }: CodeEditorProps) {
  return (
    <div className="flex-1 overflow-auto -mt-px relative">
      <Editor
        height="100%"
        language={codeView === "xml" ? "xml" : codeView === "css" ? "css" : "typescript"}
        value={codeContent || (codeView === "xml" ? "<!-- 코드가 여기에 표시됩니다 -->" : codeView === "css" ? "/* 코드가 여기에 표시됩니다 */" : "// 코드가 여기에 표시됩니다")}
        onChange={(value) => {
          if (value !== undefined) {
            onCodeChange(value);
          }
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}

