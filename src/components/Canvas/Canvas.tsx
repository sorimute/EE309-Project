import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { readFile } from '../../lib/fileSystem/fileSystem';
import { CanvasRenderer } from './CanvasRenderer';
import { useCanvasSync } from '../../hooks/useCanvasSync';
import './Canvas.css';

export function Canvas() {
  const { selectedFile } = useProjectStore();
  const [componentCode, setComponentCode] = useState<string>('');
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { syncCanvasToCode } = useCanvasSync();

  useEffect(() => {
    if (selectedFile && (
      selectedFile.endsWith('.tsx') || 
      selectedFile.endsWith('.jsx') ||
      selectedFile.endsWith('.html') ||
      selectedFile.endsWith('.css')
    )) {
      loadComponent(selectedFile);
    } else {
      setComponentCode('');
    }
  }, [selectedFile]);

  // 코드 저장 이벤트 구독 (Ctrl+S로 저장 시)
  useEffect(() => {
    const handleCodeSaved = (event: CustomEvent<string>) => {
      if (selectedFile && (
        selectedFile.endsWith('.tsx') || 
        selectedFile.endsWith('.jsx') ||
        selectedFile.endsWith('.html') ||
        selectedFile.endsWith('.css')
      )) {
        setComponentCode(event.detail);
      }
    };

    window.addEventListener('code-saved' as any, handleCodeSaved as EventListener);
    return () => {
      window.removeEventListener('code-saved' as any, handleCodeSaved as EventListener);
    };
  }, [selectedFile]);

  const loadComponent = async (filePath: string) => {
    try {
      console.log('컴포넌트 로드 시도:', filePath);
      const content = await readFile(filePath);
      console.log('컴포넌트 로드 성공:', filePath);
      setComponentCode(content);
    } catch (error) {
      console.error('컴포넌트 로드 실패:', filePath, error);
      setComponentCode('');
    }
  };

  const handleCanvasChange = (updatedCode: string) => {
    setComponentCode(updatedCode);
    syncCanvasToCode(updatedCode);
  };

  return (
    <div className="canvas-container">
      <div 
        className="canvas-content-wrapper"
        ref={canvasWrapperRef}
      >
        <div 
          className="canvas-content"
          ref={canvasContentRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {componentCode ? (
            selectedFile && (selectedFile.endsWith('.html') || selectedFile.endsWith('.css')) ? (
              <div className="canvas-html-css-renderer">
                {selectedFile.endsWith('.html') ? (
                  <iframe
                    srcDoc={componentCode}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'white',
                    }}
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'white',
                      padding: '20px',
                    }}
                  >
                    <style dangerouslySetInnerHTML={{ __html: componentCode }} />
                    <div style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '14px',
                    }}>
                      CSS 파일이 적용되었습니다. HTML 파일과 함께 열어서 확인하세요.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CanvasRenderer 
                code={componentCode} 
                onCodeChange={handleCanvasChange}
                zoomLevel={1}
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
