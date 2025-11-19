import cssIcon from "../assets/css.png";
import htmlIcon from "../assets/html.png";
import reactIcon from "../assets/react.svg";
import codeIcon from "../assets/Code.png";

// 파일 확장자에 따라 아이콘 반환
export const getFileIcon = (fileName: string, fileExtension?: string): string | null => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // extension이 react인 경우
  if (fileExtension === "react") {
    return reactIcon;
  }
  
  // 파일명 확장자로 판단
  switch (extension) {
    case 'css':
      return cssIcon;
    case 'html':
    case 'htm':
      return htmlIcon;
    case 'tsx':
    case 'jsx':
      return reactIcon;
    case 'xml':
      return codeIcon;
    default:
      return null;
  }
};

