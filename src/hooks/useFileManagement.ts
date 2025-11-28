import { useState } from 'react';
import { FileItem } from '../types';
import { DEFAULT_FILES } from '../constants/files';

export function useFileManagement() {
  const [openedFiles, setOpenedFiles] = useState<string[]>(["React.tsx"]);
  const [activeFile, setActiveFile] = useState<string>("React.tsx");
  const [files] = useState<FileItem[]>(DEFAULT_FILES);

  const handleFileClick = (fileName: string) => {
    setActiveFile(fileName);
    
    // 이미 열려있지 않으면 탭에 추가
    if (!openedFiles.includes(fileName)) {
      setOpenedFiles([...openedFiles, fileName]);
    }
  };

  const handleTabClick = (fileName: string) => {
    setActiveFile(fileName);
  };

  const handleTabClose = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    
    if (openedFiles.length === 1) {
      // 마지막 탭이면 닫지 않음
      return;
    }
    
    const newOpenedFiles = openedFiles.filter(f => f !== fileName);
    setOpenedFiles(newOpenedFiles);
    
    // 닫은 파일이 활성화된 파일이면 다른 파일로 전환
    if (activeFile === fileName) {
      const newActiveFile = newOpenedFiles[newOpenedFiles.length - 1];
      setActiveFile(newActiveFile);
    }
  };

  return {
    files,
    openedFiles,
    setOpenedFiles,
    activeFile,
    setActiveFile,
    handleFileClick,
    handleTabClick,
    handleTabClose,
  };
}


