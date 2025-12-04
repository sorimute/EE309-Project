import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { FileSystemNode, readDirectory, readDirectoryChildren } from '../../lib/fileSystem/fileSystem';
import { FileTreeNode } from './FileTreeNode';
import './FileTree.css';

export function FileTree() {
  const { projectRoot, selectedFile, setSelectedFile } = useProjectStore();
  const [fileTree, setFileTree] = useState<FileSystemNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectRoot) {
      loadFileTree(projectRoot);
    }
  }, [projectRoot]);

  const loadFileTree = async (root: string) => {
    try {
      setFileTree(null); // 로딩 시작
      // 초기 로드는 재귀적으로 하지 않고 최상위만 로드
      const tree = await readDirectory(root, false);
      setFileTree(tree);
      // 최상위 폴더는 자동으로 확장하지 않음 (사용자가 클릭할 때까지)
      // setExpandedPaths(new Set([root]));
      // 최상위 폴더의 children은 미리 로드하지 않음
    } catch (error) {
      console.error('파일 트리 로드 실패:', error);
      // 에러 발생 시 빈 트리 표시
      setFileTree({
        name: getBasename(root),
        path: root,
        type: 'directory',
        children: [],
      });
    }
  };

  const getBasename = (path: string): string => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  const toggleExpand = async (path: string) => {
    const newExpanded = new Set(expandedPaths);
    const isCurrentlyExpanded = newExpanded.has(path);
    
    if (isCurrentlyExpanded) {
      // 접기
      newExpanded.delete(path);
      setExpandedPaths(newExpanded);
    } else {
      // 펼치기 - 지연 로딩
      newExpanded.add(path);
      setExpandedPaths(newExpanded);
      
      // 해당 디렉토리의 children이 비어있으면 로드
      const node = findNodeInTree(fileTree, path);
      if (node && (!node.children || node.children.length === 0)) {
        await loadDirectoryChildren(path);
      }
    }
  };

  const findNodeInTree = (node: FileSystemNode | null, targetPath: string): FileSystemNode | null => {
    if (!node) return null;
    if (node.path === targetPath) return node;
    
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeInTree(child, targetPath);
        if (found) return found;
      }
    }
    
    return null;
  };

  const loadDirectoryChildren = async (dirPath: string) => {
    if (loadingPaths.has(dirPath)) return; // 이미 로딩 중이면 스킵
    
    setLoadingPaths(prev => new Set(prev).add(dirPath));
    
    try {
      const children = await readDirectoryChildren(dirPath);
      
      // 트리 업데이트
      setFileTree(prevTree => {
        if (!prevTree) {
          console.error('fileTree가 null입니다');
          return prevTree;
        }
        try {
          return updateNodeChildren(prevTree, dirPath, children);
        } catch (error) {
          console.error('트리 업데이트 실패:', error);
          return prevTree;
        }
      });
    } catch (error) {
      console.error(`디렉토리 자식 로드 실패: ${dirPath}`, error);
      // 에러 발생 시에도 빈 배열로 표시
      setFileTree(prevTree => {
        if (!prevTree) return prevTree;
        try {
          return updateNodeChildren(prevTree, dirPath, []);
        } catch (err) {
          console.error('에러 처리 중 실패:', err);
          return prevTree;
        }
      });
    } finally {
      setLoadingPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(dirPath);
        return newSet;
      });
    }
  };

  const updateNodeChildren = (node: FileSystemNode, targetPath: string, newChildren: FileSystemNode[]): FileSystemNode => {
    if (node.path === targetPath) {
      return {
        ...node,
        children: newChildren,
      };
    }
    
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNodeChildren(child, targetPath, newChildren)),
      };
    }
    
    return node;
  };

  if (!fileTree) {
    return (
      <div className="file-tree-container">
        <div className="file-tree-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="file-tree-container">
      {/* 헤더는 Develop의 기존 UI에서 제공되므로 숨김 */}
      {/* <div className="file-tree-header">
        <h3>파일 탐색기</h3>
      </div> */}
      <div className="file-tree-content">
        {fileTree ? (
          <FileTreeNode
            node={fileTree}
            level={0}
            expandedPaths={expandedPaths}
            onToggleExpand={toggleExpand}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            isLoading={loadingPaths.has(fileTree.path)}
          />
        ) : (
          <div className="file-tree-loading">로딩 중...</div>
        )}
      </div>
    </div>
  );
}

