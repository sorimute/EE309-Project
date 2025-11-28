import { FileItem } from '../../types';
import { getFileIcon } from '../../utils/fileUtils';

interface FileTabsProps {
  openedFiles: string[];
  activeFile: string;
  files: FileItem[];
  onTabClick: (fileName: string) => void;
  onTabClose: (e: React.MouseEvent, fileName: string) => void;
}

export default function FileTabs({ openedFiles, activeFile, files, onTabClick, onTabClose }: FileTabsProps) {
  return (
    <div className="px-2 pt-1 flex items-end gap-1 overflow-x-auto">
      {openedFiles.map((fileName) => {
        const file = files.find(f => f.name === fileName);
        const icon = getFileIcon(fileName, file?.extension);
        return (
          <div
            key={fileName}
            onClick={() => onTabClick(fileName)}
            className={`px-3 py-1 text-sm flex items-center gap-2 cursor-pointer min-w-fit ${
              activeFile === fileName
                ? "bg-[#1B0F0F] dark:bg-[#1B0F0F] text-white border-t border-pink-300"
                : "bg-black dark:bg-black text-white hover:bg-gray-900 dark:hover:bg-gray-900"
            }`}
          >
            {icon ? (
              <img src={icon} alt={fileName} className="w-auto h-4" />
            ) : (
              <span className="text-xs">{"<>"}</span>
            )}
            <span className="truncate max-w-[120px]">{fileName}</span>
            {openedFiles.length > 1 && (
              <button
                onClick={(e) => onTabClose(e, fileName)}
                className="ml-1 hover:bg-gray-700 dark:hover:bg-gray-700 rounded px-1 text-xs"
                title="닫기"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}


