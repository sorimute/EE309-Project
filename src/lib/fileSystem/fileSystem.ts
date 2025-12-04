import { readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs';

export interface FileSystemNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemNode[];
}

const IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  'dist',
  'build',
  '.next',
  '.vite',
  'src-tauri',
];

function shouldIgnore(name: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => name.includes(pattern));
}

function getBasename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function joinPath(...parts: string[]): string {
  // Windows와 Unix 경로 모두 지원
  const separator = parts[0]?.includes('\\') ? '\\' : '/';
  return parts
    .filter(p => p)
    .join(separator)
    .replace(/[/\\]+/g, separator);
}

export async function readDirectory(dirPath: string, recursive: boolean = false): Promise<FileSystemNode> {
  try {
    console.log('readDirectory 호출:', dirPath);
    const entries = await readDir(dirPath, { recursive: false });
    console.log('readDir 결과:', entries);
    const name = getBasename(dirPath);
    
    const node: FileSystemNode = {
      name,
      path: dirPath,
      type: 'directory',
      children: [],
    };

    for (const entry of entries) {
      if (shouldIgnore(entry.name)) {
        continue;
      }

      // Tauri 2.0의 readDir는 FileEntry[]를 반환
      // FileEntry는 { name: string, path: string, isDirectory?: boolean } 형태
      // path가 없으면 부모 경로와 name을 조합
      const entryPath = (entry as any).path || joinPath(dirPath, entry.name);
      
      // 여러 가능한 속성 확인
      let isDirectory = false;
      if ('isDirectory' in entry && entry.isDirectory === true) {
        isDirectory = true;
      } else if ('kind' in entry && (entry as any).kind === 'directory') {
        isDirectory = true;
      } else if ('type' in entry && (entry as any).type === 'directory') {
        isDirectory = true;
      } else if ('children' in entry && (entry as any).children !== undefined) {
        // Tauri 1.x 스타일
        isDirectory = true;
      }
      
      console.log('Entry:', entry.name, 'path:', entryPath, 'isDirectory:', isDirectory, 'entry keys:', Object.keys(entry));
      
      if (isDirectory) {
        if (recursive) {
          // 재귀적으로 읽기 (초기 로드 시에만)
          try {
            const childNode = await readDirectory(entryPath, recursive);
            node.children!.push(childNode);
          } catch (error) {
            console.warn(`디렉토리 읽기 실패: ${entryPath}`, error);
            // 에러가 발생해도 빈 디렉토리로 추가
            node.children!.push({
              name: entry.name,
              path: entryPath,
              type: 'directory',
              children: [],
            });
          }
        } else {
          // 지연 로딩: 디렉토리만 추가하고 children은 나중에 로드
          node.children!.push({
            name: entry.name,
            path: entryPath,
            type: 'directory',
            children: [], // 빈 배열로 시작, 확장 시 로드
          });
        }
      } else {
        // 파일인 경우
        node.children!.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
        });
      }
    }

    // 정렬: 디렉토리 먼저, 그 다음 파일
    node.children!.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return node;
  } catch (error) {
    console.error(`디렉토리 읽기 실패: ${dirPath}`, error);
    throw error;
  }
}

// 단일 디렉토리의 직접 자식만 읽기 (지연 로딩용)
export async function readDirectoryChildren(dirPath: string): Promise<FileSystemNode[]> {
  try {
    console.log('readDirectoryChildren 호출:', dirPath);
    const entries = await readDir(dirPath, { recursive: false });
    console.log('readDir 결과 (children):', entries);
    const children: FileSystemNode[] = [];

    for (const entry of entries) {
      if (shouldIgnore(entry.name)) {
        continue;
      }

      // Tauri 2.0의 readDir는 FileEntry[]를 반환
      // path가 없으면 부모 경로와 name을 조합
      const entryPath = (entry as any).path || joinPath(dirPath, entry.name);
      
      // 여러 가능한 속성 확인
      let isDirectory = false;
      if ('isDirectory' in entry && entry.isDirectory === true) {
        isDirectory = true;
      } else if ('kind' in entry && (entry as any).kind === 'directory') {
        isDirectory = true;
      } else if ('type' in entry && (entry as any).type === 'directory') {
        isDirectory = true;
      } else if ('children' in entry && (entry as any).children !== undefined) {
        // Tauri 1.x 스타일
        isDirectory = true;
      }
      
      console.log('Entry (children):', entry.name, 'path:', entryPath, 'isDirectory:', isDirectory, 'entry keys:', Object.keys(entry));
      
      if (isDirectory) {
        children.push({
          name: entry.name,
          path: entryPath,
          type: 'directory',
          children: [], // 빈 배열로 시작
        });
      } else {
        children.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
        });
      }
    }

    // 정렬: 디렉토리 먼저, 그 다음 파일
    children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return children;
  } catch (error) {
    console.error(`디렉토리 자식 읽기 실패: ${dirPath}`, error);
    throw error;
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    const content = await readTextFile(filePath);
    return content;
  } catch (error) {
    console.error(`파일 읽기 실패: ${filePath}`, error);
    // 에러 상세 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
    }
    throw error;
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await writeTextFile(filePath, content);
  } catch (error) {
    console.error(`파일 쓰기 실패: ${filePath}`, error);
    throw error;
  }
}

