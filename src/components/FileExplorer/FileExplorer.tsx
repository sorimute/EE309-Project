import { FileItem } from '../../types';
import { getFileIcon } from '../../utils/fileUtils';
import newfileIcon from "../../assets/newfile.png";
import newfolderIcon from "../../assets/newfolder.png";

interface FileExplorerProps {
  files: FileItem[];
  activeFile: string;
  onFileClick: (fileName: string) => void;
}

export default function FileExplorer({ files, activeFile, onFileClick }: FileExplorerProps) {
  return (
    <div className="w-64 bg-black dark:bg-black border-r border-pink-300/30 dark:border-pink-300/20/30 flex flex-col">
      <div className="px-4 py-2 border-b border-pink-300/30 dark:border-pink-300/20/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white dark:text-white">
          Current Directory
        </h2>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Add File">
            <img src={newfileIcon} alt="New File" className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Add Folder">
            <img src={newfolderIcon} alt="New Folder" className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-pink-300 dark:hover:bg-pink-300 rounded text-white hover:text-black transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-0.5">
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => onFileClick(file.name)}
              className={`px-2 py-1.5 rounded text-sm flex items-center gap-2 cursor-pointer ${
                activeFile === file.name
                  ? "bg-pink-300 dark:bg-pink-300 text-black"
                  : "text-white dark:text-white hover:bg-pink-300 dark:hover:bg-pink-300 hover:text-black"
              }`}
            >
              {file.type === "folder" ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              ) : (
                (() => {
                  const icon = getFileIcon(file.name, file.extension);
                  return icon ? (
                    <img src={icon} alt={file.name} className="w-auto h-4" />
                  ) : (
                    <span className="text-xs">{"<>"}</span>
                  );
                })()
              )}
              <span className="flex-1 truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


