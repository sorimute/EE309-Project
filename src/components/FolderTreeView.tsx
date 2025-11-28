import React from 'react';
import { FolderFile } from '../types/folder';

interface FolderTreeViewProps {
  files: FolderFile[];
  activeFile: string;
  expandedFolders: Set<string>;
  onFileClick: (file: FolderFile) => void;
  onFolderToggle: (folderPath: string) => void;
  getFileIcon: (name: string, extension?: string) => string | null;
}

const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  files,
  activeFile,
  expandedFolders,
  onFileClick,
  onFolderToggle,
  getFileIcon,
}) => {
  const renderNode = (node: FolderFile, level: number = 0): React.ReactNode => {
    const paddingLeft = level * 16; // 각 레벨마다 16px 들여쓰기
    
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.path}>
          <div
            onClick={() => onFolderToggle(node.path)}
            className="px-2 py-1.5 rounded text-sm flex items-center gap-2 cursor-pointer text-white dark:text-white hover:bg-pink-300 dark:hover:bg-pink-300 hover:text-black"
            style={{ paddingLeft: `${paddingLeft + 8}px` }}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="flex-1 truncate">{node.name}</span>
          </div>
          {isExpanded && hasChildren && (
            <div>
              {node.children!.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // 파일인 경우
      const icon = getFileIcon(node.name, node.extension === 'tsx' || node.extension === 'jsx' ? 'react' : node.extension as any);
      const isSupported = node.isSupported !== false;
      
      return (
        <div
          key={node.path}
          onClick={() => isSupported && onFileClick(node)}
          className={`px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
            isSupported 
              ? "cursor-pointer" 
              : "cursor-not-allowed opacity-50"
          } ${
            activeFile === node.name
              ? "bg-pink-300 dark:bg-pink-300 text-black"
              : isSupported
                ? "text-white dark:text-white hover:bg-pink-300 dark:hover:bg-pink-300 hover:text-black"
                : "text-gray-500 dark:text-gray-500"
          }`}
          style={{ paddingLeft: `${paddingLeft + 24}px` }}
          title={!isSupported ? `${node.name}은(는) 지원하지 않는 파일 형식입니다` : node.name}
        >
          {icon ? (
            <img src={icon} alt={node.name} className="w-auto h-4" />
          ) : (
            <span className="text-xs">{"<>"}</span>
          )}
          <span className="flex-1 truncate">{node.name}</span>
          {!isSupported && (
            <span className="text-xs text-gray-400">(지원 안 함)</span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-0.5">
      {files.map(file => renderNode(file, 0))}
    </div>
  );
};

export default FolderTreeView;




