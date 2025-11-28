export interface FolderFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  isSupported?: boolean; // 지원하는 파일 형식인지 여부
  children?: FolderFile[]; // 하위 파일/폴더
  isExpanded?: boolean; // 폴더가 펼쳐져 있는지
  level?: number; // 트리 레벨 (들여쓰기용)
}

