import { useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useCanvasStore } from '../stores/canvasStore';
import { updateElementInCode } from '../lib/ast/codeModifier';
import { readFile, writeFile } from '../lib/fileSystem/fileSystem';

/**
 * Canvas → Code 동기화 Hook
 * Canvas에서 요소를 드래그/리사이즈하면 코드를 업데이트
 */
export function useCanvasSync() {
  const { selectedFile } = useProjectStore();
  const { elementPositions } = useCanvasStore();

  const syncCanvasToCode = useCallback(async (updatedCode: string) => {
    // 이 함수는 Canvas에서 직접 호출되므로, 
    // 실제로는 CanvasRenderer에서 요소 변경 시 호출되어야 함
    if (!selectedFile) return;

    try {
      await writeFile(selectedFile, updatedCode);
    } catch (error) {
      console.error('Canvas → Code 동기화 실패:', error);
    }
  }, [selectedFile]);

  const updateElementFromCanvas = useCallback(async (
    elementId: string,
    updates: {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      style?: Record<string, any>;
    }
  ) => {
    if (!selectedFile) return;

    try {
      const currentCode = await readFile(selectedFile);
      const updatedCode = updateElementInCode(currentCode, elementId, updates);
      await writeFile(selectedFile, updatedCode);
      
      // Monaco Editor에 변경사항 반영을 위해 이벤트 발생
      // (실제로는 Monaco Editor가 파일 변경을 감지하도록 해야 함)
      window.dispatchEvent(new CustomEvent('code-updated', { detail: updatedCode }));
    } catch (error) {
      console.error('Canvas → Code 업데이트 실패:', error);
    }
  }, [selectedFile]);

  return { syncCanvasToCode, updateElementFromCanvas };
}

