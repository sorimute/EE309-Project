import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import './SelectFolder.css';

interface SelectFolderProps {
  onFolderSelected: (path: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function SelectFolder({ onFolderSelected, isLoading, setIsLoading }: SelectFolderProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSelectFolder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const selected = await open({
        directory: true,
        multiple: false,
        title: '프로젝트 폴더 선택',
      });

      if (selected && typeof selected === 'string') {
        // Tauri 2.0에서는 dialog로 선택한 경로는 자동으로 scope에 포함됨
        console.log('선택한 폴더:', selected);
        onFolderSelected(selected);
      }
    } catch (err) {
      console.error('폴더 선택 에러:', err);
      setError(err instanceof Error ? err.message : '폴더 선택 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="select-folder-container">
      <div className="select-folder-content">
        <h1 className="select-folder-title">CODESIGN IDE</h1>
        <p className="select-folder-subtitle">UI ↔ Code 양방향 수정 IDE</p>
        
        <button
          className="select-folder-button"
          onClick={handleSelectFolder}
          disabled={isLoading}
        >
          {isLoading ? '로딩 중...' : '프로젝트 폴더 선택'}
        </button>

        {error && <div className="select-folder-error">{error}</div>}
      </div>
    </div>
  );
}

