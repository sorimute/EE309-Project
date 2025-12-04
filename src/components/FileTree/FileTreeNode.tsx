import { FileSystemNode } from '../../lib/fileSystem/fileSystem';
import './FileTreeNode.css';

interface FileTreeNodeProps {
  node: FileSystemNode;
  level: number;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => Promise<void>;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  isLoading?: boolean;
}

export function FileTreeNode({
  node,
  level,
  expandedPaths,
  onToggleExpand,
  selectedFile,
  onFileSelect,
  isLoading = false,
}: FileTreeNodeProps) {
  // path가 없으면 안전하게 처리
  const nodePath = node.path || node.name || '';
  const isExpanded = nodePath ? expandedPaths.has(nodePath) : false;
  const isSelected = nodePath ? selectedFile === nodePath : false;
  const isReactFile = nodePath ? (nodePath.endsWith('.tsx') || nodePath.endsWith('.jsx')) : false;

  const handleClick = async () => {
    if (!nodePath) return;
    
    if (node.type === 'directory') {
      await onToggleExpand(nodePath);
    } else {
      onFileSelect(nodePath);
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''} ${isReactFile ? 'react-file' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className="file-tree-icon">
          {node.type === 'directory' ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="file-tree-name">{node.name}</span>
        {isLoading && node.type === 'directory' && (
          <span className="file-tree-loading-indicator">...</span>
        )}
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.length === 0 ? (
            <div style={{ paddingLeft: `${(level + 1) * 16 + 8}px`, color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              (비어있음)
            </div>
          ) : (
            node.children.map((child, index) => (
              <FileTreeNode
                key={child.path || `${child.name}-${index}`}
                node={child}
                level={level + 1}
                expandedPaths={expandedPaths}
                onToggleExpand={onToggleExpand}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

