import React, { useEffect, useRef, useState } from 'react';
import { parseComponent, ComponentNode } from '../../lib/ast/componentParser';
import { updateElementInCode } from '../../lib/ast/codeModifier';
import { parseTailwindClasses } from '../../lib/utils/tailwindParser';
import { parseImports, loadImportedComponent } from '../../lib/ast/importResolver';
import { useCanvasStore } from '../../stores/canvasStore';
import { useProjectStore } from '../../stores/projectStore';
import './CanvasRenderer.css';

interface CanvasRendererProps {
  code: string;
  onCodeChange: (updatedCode: string) => void;
  zoomLevel?: number;
}

export function CanvasRenderer({ code, onCodeChange, zoomLevel = 1 }: CanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactRootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [componentTree, setComponentTree] = useState<ComponentNode | null>(null);
  const elementIdMapRef = useRef<Map<ComponentNode, string>>(new Map());
  const { selectedFile } = useProjectStore();
  const { selectedElementId, setSelectedElementId, updateElementPosition } = useCanvasStore();
  
  // 컴포넌트 트리 경로 기반 일관된 ID 생성
  const generateElementId = (node: ComponentNode, depth: number, path: number[] = []): string => {
    // 이미 생성된 ID가 있으면 재사용
    if (elementIdMapRef.current.has(node)) {
      return elementIdMapRef.current.get(node)!;
    }
    
    // node.id가 있으면 사용
    if (node.id) {
      elementIdMapRef.current.set(node, node.id);
      return node.id;
    }
    
    // 경로 기반 ID 생성 (일관성 유지)
    const pathString = path.length > 0 ? path.join('-') : 'root';
    const typePrefix = node.type.substring(0, 3).toLowerCase();
    const newId = `el-${typePrefix}-${depth}-${pathString}`;
    elementIdMapRef.current.set(node, newId);
    return newId;
  };

  useEffect(() => {
    const parseWithImports = async () => {
      try {
        console.log('컴포넌트 파싱 시도, 코드 길이:', code.length);
        
        // Import 문 파싱
        const imports = parseImports(code);
        const importedComponents = new Map<string, ComponentNode>();
        
        // Import된 컴포넌트 로드
        if (selectedFile && imports.length > 0) {
          for (const importInfo of imports) {
            // Default export 처리
            if (importInfo.default) {
              // Default export의 로컬 이름 사용 (예: import Profile from ... -> Profile)
              const defaultName = importInfo.default;
              
              try {
                const component = await loadImportedComponent(
                  importInfo.source,
                  'default',
                  selectedFile
                );
                if (component) {
                  // Default export는 로컬 이름으로 저장
                  importedComponents.set(defaultName, component);
                  console.log(`컴포넌트 로드 성공 (default): ${defaultName} from ${importInfo.source}`);
                }
              } catch (error) {
                console.warn(`컴포넌트 로드 실패 (default): ${defaultName} from ${importInfo.source}`, error);
              }
            }
            
            // Named exports 처리
            for (const importedName of importInfo.imported) {
              // default는 이미 처리했으므로 건너뛰기
              if (importedName === 'default' || importedName === '*') {
                continue;
              }
              
              try {
                const component = await loadImportedComponent(
                  importInfo.source,
                  importedName,
                  selectedFile
                );
                if (component) {
                  importedComponents.set(importedName, component);
                  console.log(`컴포넌트 로드 성공: ${importedName} from ${importInfo.source}`);
                }
              } catch (error) {
                console.warn(`컴포넌트 로드 실패: ${importedName} from ${importInfo.source}`, error);
              }
            }
          }
        }
        
        // 컴포넌트 파싱 (importedComponents 포함)
        const parsed = parseComponent(code, {
          currentFile: selectedFile || undefined,
          importedComponents,
        });
        
        console.log('파싱 결과:', parsed);
        
        // 파싱된 트리에서 문제가 있는 부분 확인
        const checkForObjectIssues = (node: ComponentNode, path: string = 'root') => {
          if (node.props) {
            Object.entries(node.props).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null && !Array.isArray(value) && key !== 'style') {
                console.warn(`[object Object] 발견: ${path}.props.${key}`, value);
              }
            });
          }
          if (node.children) {
            node.children.forEach((child, idx) => {
              if (child && typeof child === 'object' && 'type' in child) {
                checkForObjectIssues(child, `${path}.children[${idx}]`);
              } else {
                console.warn(`유효하지 않은 자식: ${path}.children[${idx}]`, child);
              }
            });
          }
        };
        checkForObjectIssues(parsed);
        
        setComponentTree(parsed);
        // ID 맵 초기화
        elementIdMapRef.current.clear();
      } catch (error) {
        console.error('컴포넌트 파싱 실패:', error);
        setComponentTree({
          type: 'div',
          props: {},
          children: [
            {
              type: 'text',
              text: '파싱 오류가 발생했습니다. 콘솔을 확인하세요.',
            },
          ],
        });
        elementIdMapRef.current.clear();
      }
    };
    
    parseWithImports();
  }, [code, selectedFile]);

  // 선택된 요소에 ghost box 생성
  useEffect(() => {
    if (!selectedElementId || !reactRootRef.current || !overlayRef.current) {
      if (overlayRef.current) {
        overlayRef.current.innerHTML = '';
      }
      return;
    }

    const root = reactRootRef.current;
    const overlay = overlayRef.current;
    console.log('Ghost box 생성 시도, selectedElementId:', selectedElementId);
    const element = root.querySelector(`[data-element-id="${selectedElementId}"]`) as HTMLElement;

    if (!element) {
      console.warn('요소를 찾을 수 없습니다:', selectedElementId);
      // 모든 data-element-id 요소 확인
      const allElements = root.querySelectorAll('[data-element-id]');
      console.log('사용 가능한 요소들:', Array.from(allElements).map(el => el.getAttribute('data-element-id')));
      return;
    }

    console.log('요소 찾음, Ghost box 생성:', element);

    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 실행
    const timer = setTimeout(() => {
      createGhostBoxForElement(element, selectedElementId);
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedElementId, componentTree]);

  // 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!selectedElementId) return;

      const target = e.target as HTMLElement;
      const root = reactRootRef.current;
      const overlay = overlayRef.current;
      
      if (!root || !overlay) return;

      // 클릭된 요소가 ghost box나 그 자식인지 확인
      const ghostBox = overlay.querySelector('.ghost-box');
      if (ghostBox && (ghostBox === target || ghostBox.contains(target))) {
        return; // ghost box를 클릭한 경우는 무시
      }

      // 클릭된 요소가 실제 요소인지 확인
      const clickedElement = target.closest('[data-element-id]');
      if (clickedElement && clickedElement.getAttribute('data-element-id') === selectedElementId) {
        return; // 선택된 요소를 클릭한 경우는 무시
      }

      // 외부를 클릭한 경우 선택 해제
      setSelectedElementId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedElementId, setSelectedElementId]);

  // 루트 컨테이너 기준 절대 좌표 계산 (zoom 고려)
  const getAbsolutePosition = (el: HTMLElement): { left: number; top: number } => {
    const root = reactRootRef.current;
    if (!root) return { left: 0, top: 0 };

    // transform: scale()이 적용된 경우, getBoundingClientRect()는
    // 스케일이 적용된 후의 화면 좌표를 반환하므로 부정확할 수 있습니다
    // offsetLeft/offsetTop을 사용하여 부모 기준 상대 위치 계산
    // 이 방법은 transform의 영향을 받지 않습니다
    let left = el.offsetLeft;
    let top = el.offsetTop;
    
    // offsetParent를 따라 올라가면서 누적
    let parent = el.offsetParent as HTMLElement | null;
    while (parent && parent !== root) {
      // root의 직접 자식인지 확인
      if (parent === root.parentElement || parent.contains(root)) {
        break;
      }
      left += parent.offsetLeft;
      top += parent.offsetTop;
      parent = parent.offsetParent as HTMLElement | null;
    }

    return { left, top };
  };

  // Ghost Box 생성
  const createGhostBoxForElement = (el: HTMLElement, elementId: string) => {
    const root = reactRootRef.current;
    const overlay = overlayRef.current;
    if (!root || !overlay) return;

    overlay.innerHTML = '';

    // zoom이 적용된 rect를 zoom으로 나누어 실제 크기 계산
    const rect = el.getBoundingClientRect();
    const actualWidth = rect.width / zoomLevel;
    const actualHeight = rect.height / zoomLevel;
    
    // 요소의 절대 위치 계산
    const { left, top } = getAbsolutePosition(el);
    
    const box = document.createElement('div');
    box.className = 'ghost-box';
    box.setAttribute('data-element-id', elementId);
    box.style.position = 'absolute';
    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.style.width = actualWidth + 'px';
    box.style.height = actualHeight + 'px';
    box.style.border = '2px dashed #007acc';
    box.style.boxSizing = 'border-box';
    box.style.pointerEvents = 'auto';
    box.style.cursor = 'move';
    box.style.backgroundColor = 'rgba(0, 122, 204, 0.05)';
    box.style.zIndex = '1000';
    box.style.margin = '0';
    box.style.padding = '0';

    // 리사이즈 핸들 추가
    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    handles.forEach((dir) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${dir}`;
      handle.setAttribute('data-direction', dir);
      box.appendChild(handle);
    });

    overlay.appendChild(box);
    attachDragHandlers(box, elementId);
    attachResizeHandlers(box, elementId);
  };

  // 드래그 핸들러
  const attachDragHandlers = (box: HTMLDivElement, elementId: string) => {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let actualElement: HTMLElement | null = null;
    let placeholder: HTMLElement | null = null;
    let originalHeight = 0;
    let originalWidth = 0;
    let originalMarginTop = 0;
    let originalMarginBottom = 0;

    box.addEventListener('mousedown', (e) => {
      // 리사이즈 핸들을 클릭한 경우는 드래그하지 않음
      if ((e.target as HTMLElement).classList.contains('resize-handle')) {
        return;
      }

      dragging = true;
      // 마우스 좌표는 zoom이 적용된 화면 좌표이므로, 실제 좌표로 변환
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(box.style.left) || 0;
      startTop = parseFloat(box.style.top) || 0;

      const root = reactRootRef.current;
      if (root) {
        actualElement = root.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
        
        if (actualElement) {
          // 원래 크기와 마진 저장 (레이아웃 유지용)
          // zoom이 적용된 rect를 zoom으로 나누어 실제 크기 계산
          const rect = actualElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(actualElement);
          
          // 요소가 실제로 차지하는 공간 계산 (margin 포함)
          // getBoundingClientRect()는 border-box를 기준으로 하므로
          // margin을 별도로 계산해야 함
          originalWidth = rect.width / zoomLevel;
          originalHeight = rect.height / zoomLevel;
          originalMarginTop = (parseFloat(computedStyle.marginTop) || 0) / zoomLevel;
          originalMarginBottom = (parseFloat(computedStyle.marginBottom) || 0) / zoomLevel;
          
          // 드래그 중에는 실제 요소를 투명하게 만들기 (레이아웃은 유지)
          actualElement.style.opacity = '0.3';
        }
      }

      e.stopPropagation();
      e.preventDefault();

      box.style.cursor = 'grabbing';
      box.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;

        // 마우스 이동 거리를 zoom으로 나누어 실제 좌표 계산
        const dx = ((e as MouseEvent).clientX - startX) / zoomLevel;
        const dy = ((e as MouseEvent).clientY - startY) / zoomLevel;

        const newLeft = startLeft + dx;
        const newTop = startTop + dy;

        // Ghost box만 이동 (실제 요소는 레이아웃 유지)
        box.style.left = newLeft + 'px';
        box.style.top = newTop + 'px';
      };

      const onMouseUp = () => {
        if (!dragging) return;

        dragging = false;
        box.style.cursor = 'move';
        box.style.backgroundColor = 'rgba(0, 122, 204, 0.05)';

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const finalLeft = parseFloat(box.style.left) || 0;
        const finalTop = parseFloat(box.style.top) || 0;

        // 드래그가 끝나면 실제 요소의 위치를 업데이트
        if (actualElement && actualElement.parentElement) {
          // 기존 placeholder가 있으면 제거
          const existingPlaceholder = actualElement.parentElement.querySelector(`[data-placeholder-for="${elementId}"]`);
          if (existingPlaceholder) {
            existingPlaceholder.remove();
          }
          
          // 실제 요소를 absolute로 변경하기 전에 placeholder 삽입
          // placeholder는 요소의 원래 위치(형제 요소 사이)에 삽입되어야 함
          const nextSibling = actualElement.nextSibling;
          
          // 원래 위치에 placeholder 삽입하여 공간 유지
          // placeholder는 요소가 차지하는 전체 공간(margin 포함)을 유지해야 함
          placeholder = document.createElement('div');
          placeholder.style.width = originalWidth + 'px';
          // 높이는 요소의 height + marginTop + marginBottom (전체 차지 공간)
          placeholder.style.height = (originalHeight + originalMarginTop + originalMarginBottom) + 'px';
          placeholder.style.marginTop = '0';
          placeholder.style.marginBottom = '0';
          placeholder.style.visibility = 'hidden';
          placeholder.style.pointerEvents = 'none';
          placeholder.style.boxSizing = 'border-box';
          placeholder.setAttribute('data-placeholder-for', elementId);
          
          // placeholder를 요소의 다음 형제 위치에 삽입 (요소가 absolute로 변경되기 전)
          if (nextSibling) {
            actualElement.parentElement.insertBefore(placeholder, nextSibling);
          } else {
            actualElement.parentElement.appendChild(placeholder);
          }
          
          // 실제 요소를 absolute로 변경하고 위치 및 크기 설정
          actualElement.style.position = 'absolute';
          actualElement.style.left = finalLeft + 'px';
          actualElement.style.top = finalTop + 'px';
          actualElement.style.width = originalWidth + 'px';
          actualElement.style.height = originalHeight + 'px';
          actualElement.style.margin = '0';
          actualElement.style.opacity = '1'; // 불투명도 복원
        }

        // 코드 업데이트 (위치와 크기 모두 포함)
        updateElementPosition(elementId, { x: finalLeft, y: finalTop });
        const updatedCode = updateElementInCode(code, elementId, {
          position: { x: finalLeft, y: finalTop },
          size: { width: originalWidth, height: originalHeight },
        });
        onCodeChange(updatedCode);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  };

  // 리사이즈 핸들러
  const attachResizeHandlers = (box: HTMLDivElement, elementId: string) => {
    const handles = box.querySelectorAll('.resize-handle');
    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let startWidth = 0;
    let startHeight = 0;
    let direction = '';

    handles.forEach((handle) => {
      handle.addEventListener('mousedown', (e) => {
        const mouseEvent = e as MouseEvent;
        resizing = true;
        startX = mouseEvent.clientX;
        startY = mouseEvent.clientY;
        startLeft = parseFloat(box.style.left) || 0;
        startTop = parseFloat(box.style.top) || 0;
        startWidth = parseFloat(box.style.width) || 0;
        startHeight = parseFloat(box.style.height) || 0;
        direction = (handle as HTMLElement).getAttribute('data-direction') || '';

        e.stopPropagation();
        e.preventDefault();

        const root = reactRootRef.current;
        const actualElement = root?.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;

        const onMouseMove = (e: MouseEvent) => {
          if (!resizing) return;

          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          let newLeft = startLeft;
          let newTop = startTop;
          let newWidth = startWidth;
          let newHeight = startHeight;

          // 방향에 따라 크기 조정
          if (direction.includes('e')) {
            newWidth = startWidth + dx;
          }
          if (direction.includes('w')) {
            newWidth = startWidth - dx;
            newLeft = startLeft + dx;
          }
          if (direction.includes('s')) {
            newHeight = startHeight + dy;
          }
          if (direction.includes('n')) {
            newHeight = startHeight - dy;
            newTop = startTop + dy;
          }

          // 최소 크기 제한
          if (newWidth < 20) newWidth = 20;
          if (newHeight < 20) newHeight = 20;

          box.style.left = newLeft + 'px';
          box.style.top = newTop + 'px';
          box.style.width = newWidth + 'px';
          box.style.height = newHeight + 'px';

          if (actualElement) {
            actualElement.style.position = 'absolute';
            actualElement.style.left = newLeft + 'px';
            actualElement.style.top = newTop + 'px';
            actualElement.style.width = newWidth + 'px';
            actualElement.style.height = newHeight + 'px';
            actualElement.style.margin = '0';
          }
        };

        const onMouseUp = () => {
          if (!resizing) return;

          resizing = false;

          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          const finalLeft = parseFloat(box.style.left) || 0;
          const finalTop = parseFloat(box.style.top) || 0;
          const finalWidth = parseFloat(box.style.width) || 0;
          const finalHeight = parseFloat(box.style.height) || 0;

          updateElementPosition(elementId, {
            x: finalLeft,
            y: finalTop,
            width: finalWidth,
            height: finalHeight,
          });
          const updatedCode = updateElementInCode(code, elementId, {
            position: { x: finalLeft, y: finalTop },
            size: { width: finalWidth, height: finalHeight },
          });
          onCodeChange(updatedCode);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  };

  const renderElement = (node: ComponentNode, depth: number = 0, isRoot: boolean = false, path: number[] = []): JSX.Element | null => {
    if (!node) return null;

    if (depth > 20) {
      return <div>깊이 제한 초과</div>;
    }

    // 편집 가능한 요소 목록
    const editableTags = ['div', 'section', 'header', 'footer', 'main', 'nav', 'aside', 'article', 'button', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'];

    // 일관된 ID 생성
    const elementId = generateElementId(node, depth, path);
    
    // data-element-id 속성 추가 (ghost box 매핑용)
    const dataElementId = elementId;
    
    // Tailwind CSS 클래스 파싱
    const tailwindStyles = node.props?.className 
      ? parseTailwindClasses(node.props.className)
      : {};
    
    // 기존 스타일과 병합
    const baseStyle: React.CSSProperties = {
      ...tailwindStyles,
      ...(node.props?.style || {}),
    };

    // 루트 요소는 relative positioning, 자식은 relative (레이아웃 유지)
    const positioningStyle: React.CSSProperties = isRoot
      ? {
          position: 'relative',
          width: '100%',
        }
      : {
          position: 'relative',
        };

    const isSelected = selectedElementId === elementId;
    
    // padding 처리: 개별 방향이 전체 padding보다 우선
    const paddingStyle: React.CSSProperties = {};
    if (baseStyle.paddingTop || baseStyle.paddingBottom || baseStyle.paddingLeft || baseStyle.paddingRight) {
      // 개별 방향 padding이 있으면 그것만 사용
      if (baseStyle.paddingTop) paddingStyle.paddingTop = baseStyle.paddingTop;
      if (baseStyle.paddingBottom) paddingStyle.paddingBottom = baseStyle.paddingBottom;
      if (baseStyle.paddingLeft) paddingStyle.paddingLeft = baseStyle.paddingLeft;
      if (baseStyle.paddingRight) paddingStyle.paddingRight = baseStyle.paddingRight;
    } else if (baseStyle.padding) {
      // 전체 padding만 있으면 그것 사용
      paddingStyle.padding = baseStyle.padding;
    }
    
    const finalStyle: React.CSSProperties = {
      ...baseStyle,
      ...positioningStyle,
      ...paddingStyle,
      // border는 선택 시에만 표시
      border: isSelected ? '2px solid #007acc' : 'none',
      outline: isSelected ? 'none' : 'none',
      // 편집 가능한 요소는 클릭 가능하도록 커서 변경
      cursor: 'pointer',
      overflow: 'visible',
      boxSizing: 'border-box',
    };

    // 텍스트 노드는 간단하게 렌더링
    if (node.type === 'text') {
      // 텍스트만 렌더링 (객체는 제외)
      let textContent = node.text || 
        (typeof node.props?.children === 'string' ? node.props.children : '') ||
        '';
      
      // JSX 표현식인 경우 props에서 값을 찾기
      if (node.isExpression && node.expressionName) {
        // 부모 컴포넌트의 props에서 값을 찾기
        // 현재는 간단히 표현식 텍스트를 표시
        textContent = node.text || `{${node.expressionName}}`;
      }
      
      if (!textContent) return null;
      
      return (
        <span
          key={elementId}
          data-element-id={dataElementId}
          style={finalStyle}
          onClick={(e) => {
            e.stopPropagation();
            console.log('요소 클릭:', elementId, dataElementId);
            setSelectedElementId(elementId);
          }}
        >
          {textContent}
        </span>
      );
    }

    // Fragment는 children만 렌더링 (스타일 없이)
    if (node.type === 'fragment') {
      return (
        <React.Fragment key={elementId}>
          {node.children?.map((child, idx) => (
            <React.Fragment key={idx}>{renderElement(child, depth + 1, false)}</React.Fragment>
          ))}
        </React.Fragment>
      );
    }

    // Void elements (자식 요소를 가질 수 없는 요소들)
    const voidElements = ['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    const isVoidElement = voidElements.includes(node.type);
    
    // 특수 요소들 (특별한 처리가 필요한 요소들)
    const specialElements = ['option', 'textarea', 'select'];
    const isSpecialElement = specialElements.includes(node.type);
    
    // 컴포넌트 이름 처리: 대문자로 시작하면 React 컴포넌트로 인식
    // motion.div 같은 경우는 이미 getJSXElementName에서 div로 변환됨
    const isReactComponent = /^[A-Z]/.test(node.type);
    
    // React 컴포넌트인 경우 div로 대체하여 렌더링 (외부 라이브러리 컴포넌트는 실제로 로드할 수 없으므로)
    const ElementTag = (isReactComponent ? 'div' : node.type) as keyof JSX.IntrinsicElements;
    
    // Void element는 자식 요소를 렌더링하지 않음
    if (isVoidElement) {
      // props에서 객체가 아닌 값만 전달
      const cleanProps: Record<string, any> = {};
      if (node.props) {
        Object.entries(node.props).forEach(([key, value]) => {
          // 객체가 아닌 값만 전달 (placeholder, type, value 등)
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            cleanProps[key] = value;
          } else if (key === 'style' && typeof value === 'object') {
            // style은 이미 finalStyle에 포함됨
          }
        });
      }
      
      // 편집 가능한 요소인지 확인
      const isEditable = editableTags.includes(node.type.toLowerCase());
      
      return (
        <ElementTag
          key={elementId}
          data-element-id={dataElementId}
          style={finalStyle}
          className={node.props?.className}
          onClick={(e) => {
            e.stopPropagation();
            console.log('Void 요소 클릭:', elementId, '타입:', node.type, '편집 가능:', isEditable);
            if (isEditable) {
              setSelectedElementId(elementId);
            }
          }}
          {...cleanProps}
        />
      );
    }
    
    // Option 요소는 자식 요소를 텍스트로만 렌더링
    if (isSpecialElement && node.type === 'option') {
      const optionText = node.children 
        ? node.children
            .map((child) => {
              if (child.type === 'text') return child.text || '';
              return '';
            })
            .join('')
        : '';
      
      return (
        <ElementTag
          key={elementId}
          data-element-id={dataElementId}
          style={finalStyle}
          className={node.props?.className}
          value={node.props?.value || optionText}
          onClick={(e) => {
            e.stopPropagation();
            const isEditable = editableTags.includes(node.type.toLowerCase());
            console.log('Option 요소 클릭:', elementId, '타입:', node.type, '편집 가능:', isEditable);
            if (isEditable) {
              setSelectedElementId(elementId);
            }
          }}
        >
          {optionText}
        </ElementTag>
      );
    }
    
    // props에서 객체가 아닌 값만 전달
    const cleanProps: Record<string, any> = {};
    if (node.props) {
      Object.entries(node.props).forEach(([key, value]) => {
        // className과 style은 이미 처리됨
        if (key === 'className' || key === 'style' || key === '_spread') return;
        
        // shadcn/ui의 특수 prop 필터링
        if (key === 'asChild') return; // asChild는 DOM 요소에 전달하지 않음
        
        // 객체가 아닌 값만 전달 (문자열, 숫자, 불린, null만)
        if (value === null || value === undefined) {
          // null/undefined는 전달하지 않음
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          cleanProps[key] = value;
        } else if (Array.isArray(value)) {
          // 배열은 전달하지 않음 (일반적으로 props로 사용되지 않음)
        } else if (typeof value === 'object') {
          // 객체는 전달하지 않음 (style 등은 이미 처리됨)
        }
      });
    }
    
    // Space 처리: space-y-* 또는 space-x-* 클래스 확인
    const spaceY = (tailwindStyles as any).__spaceY__;
    const spaceX = (tailwindStyles as any).__spaceX__;
    
    // 자식 요소도 Rnd 없이 렌더링 (드래그는 나중에 필요시 추가)
    const renderChildren = () => {
      if (!node.children || node.children.length === 0) {
        // 빈 요소 표시 (개발 모드에서만, void element가 아닌 경우만)
        if (!isVoidElement && node.type !== 'text' && node.type !== 'img') {
          return (
            <span style={{ 
              color: '#999', 
              fontSize: '11px',
              fontStyle: 'italic',
              opacity: 0.5
            }}>
              {node.props?.['data-slot'] ? `[${node.props['data-slot']}]` : ''}
            </span>
          );
        }
        return null;
      }

      return node.children
        .filter((child) => {
          // null이나 undefined 필터링
          if (!child) return false;
          // 객체가 아닌 경우 필터링
          if (typeof child !== 'object') return false;
          // ComponentNode 타입인지 확인
          if (!('type' in child)) {
            console.warn('유효하지 않은 자식 요소:', child);
            return false;
          }
          // option 내부의 span 등은 텍스트로 변환
          if (node.type === 'option' && child.type !== 'text') {
            return false;
          }
          return true;
        })
        .map((child, idx) => {
          try {
            // ComponentNode 타입 확인
            if (!('type' in child) || typeof child.type !== 'string') {
              console.warn('유효하지 않은 ComponentNode:', child);
              return null;
            }
            
            // space-y-* 또는 space-x-* 처리: 첫 번째 자식은 제외하고 마진 적용
            let childToRender = child as ComponentNode;
            if (idx > 0 && (spaceY || spaceX)) {
              // 첫 번째 자식이 아니면 마진 적용을 위해 새로운 객체 생성
              childToRender = {
                ...child,
                props: {
                  ...child.props,
                  style: {
                    ...(child.props?.style || {}),
                    ...(spaceY ? { marginTop: spaceY } : {}),
                    ...(spaceX ? { marginLeft: spaceX } : {}),
                  },
                },
              } as ComponentNode;
            }
            
            const rendered = renderElement(childToRender, depth + 1, false, [...path, idx]);
            // null이나 유효하지 않은 요소는 렌더링하지 않음
            if (!rendered) return null;
            return (
              <React.Fragment key={idx}>{rendered}</React.Fragment>
            );
          } catch (error) {
            console.warn('자식 요소 렌더링 실패:', child, error);
            return null;
          }
        })
        .filter(Boolean);
    };
    
    // 편집 가능한 요소인지 확인 (header, section 등)
    const isEditable = editableTags.includes(node.type.toLowerCase());
    
    return (
      <ElementTag
        key={elementId}
        data-element-id={dataElementId}
        style={finalStyle}
        className={node.props?.className}
        onClick={(e) => {
          e.stopPropagation();
          console.log('요소 클릭:', elementId, '타입:', node.type, '편집 가능:', isEditable);
          if (isEditable) {
            setSelectedElementId(elementId);
          }
        }}
        {...cleanProps}
      >
        {renderChildren()}
      </ElementTag>
    );
  };

  if (!componentTree) {
    return (
      <div className="canvas-renderer-error">
        <p>컴포넌트를 렌더링할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="canvas-renderer-container"
      style={{
        width: '100%',
        maxWidth: '100%',
        position: 'relative',
      }}
    >
      {/* React 렌더링 영역 */}
      <div 
        ref={reactRootRef}
        id="react-root"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100%',
        }}
      >
        {renderElement(componentTree, 0, true, [])}
      </div>
      
      {/* 편집용 Overlay (Ghost Box) */}
      <div
        ref={overlayRef}
        id="edit-overlay"
        className="edit-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      />
    </div>
  );
}
