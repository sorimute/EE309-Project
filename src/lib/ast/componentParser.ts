import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as recast from 'recast';
import { parseImports } from './importResolver';

export interface ComponentNode {
  id?: string;
  type: string;
  props?: Record<string, any>;
  children?: ComponentNode[];
  text?: string;
  isImported?: boolean;
  importPath?: string;
  isExpression?: boolean; // JSX 표현식인지 여부
  expressionName?: string; // 표현식 변수 이름 (예: "name")
  expressionText?: string; // 표현식 전체 텍스트
  componentObjects?: Record<string, Record<string, string>>; // 컴포넌트 내부 객체 정의 (예: colorClasses)
}

export interface ParseComponentOptions {
  currentFile?: string;
  importedComponents?: Map<string, ComponentNode>;
}

export function parseComponent(code: string, options: ParseComponentOptions = {}): ComponentNode {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
    });

    // Import 문 파싱
    const imports = parseImports(code);
    const importedComponents = options.importedComponents || new Map<string, ComponentNode>();
    
    // Import된 컴포넌트를 비동기로 로드 (나중에 처리)
    console.log('Import된 컴포넌트:', imports);

    // 같은 파일 내의 로컬 컴포넌트 정의 추적 (예: Section, TimelineItem 등)
    const localComponents = new Map<string, ComponentNode>();

    // 변수 선언 추출 (const user = {...}, const contacts = {...}, const EXPERIENCES = [...] 등)
    const variableMap = new Map<string, any>();
    traverse(ast, {
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          const varName = path.node.id.name;
          if (path.node.init) {
            if (t.isObjectExpression(path.node.init)) {
              // 객체 리터럴 파싱
              variableMap.set(varName, parseObjectExpression(path.node.init));
            } else if (t.isArrayExpression(path.node.init)) {
              // 배열 리터럴 파싱 (예: const EXPERIENCES = [...])
              const arrayValue: any[] = [];
              for (const element of path.node.init.elements) {
                if (element && t.isObjectExpression(element)) {
                  arrayValue.push(parseObjectExpression(element));
                } else if (element && t.isStringLiteral(element)) {
                  arrayValue.push(element.value);
                } else if (element && t.isNumericLiteral(element)) {
                  arrayValue.push(element.value);
                }
              }
              variableMap.set(varName, arrayValue);
            } else if (t.isStringLiteral(path.node.init)) {
              variableMap.set(varName, path.node.init.value);
            } else if (t.isNumericLiteral(path.node.init)) {
              variableMap.set(varName, path.node.init.value);
            } else if (t.isBooleanLiteral(path.node.init)) {
              variableMap.set(varName, path.node.init.value);
            }
          }
        }
      },
    });

    let rootNode: ComponentNode | null = null;
    const allComponents: ComponentNode[] = [];

    // 먼저 모든 로컬 컴포넌트 정의를 수집
    traverse(ast, {
      // 함수 선언 (const Section = ({ title }) => ...)
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && funcName[0] === funcName[0].toUpperCase()) {
          // 대문자로 시작하는 함수는 컴포넌트로 간주
          const returnNode = findReturnJSX(path.node.body, importedComponents, variableMap, localComponents);
          if (returnNode) {
            localComponents.set(funcName, returnNode);
          }
        }
      },
      // 화살표 함수 (const Section = ({ title }) => ...)
      VariableDeclarator(path) {
        if (t.isIdentifier(path.node.id)) {
          const varName = path.node.id.name;
          if (varName[0] === varName[0].toUpperCase() && path.node.init) {
            // 대문자로 시작하는 변수는 컴포넌트로 간주
            if (t.isArrowFunctionExpression(path.node.init)) {
              const arrowFunc = path.node.init;
              let componentNode: ComponentNode | null = null;
              if (t.isJSXElement(arrowFunc.body)) {
                componentNode = parseJSXElement(arrowFunc.body, importedComponents, variableMap, localComponents);
              } else if (t.isJSXFragment(arrowFunc.body)) {
                componentNode = {
                  type: 'fragment',
                  children: arrowFunc.body.children.map((child) => parseJSXChild(child, importedComponents, undefined, variableMap)).filter(Boolean) as ComponentNode[],
                };
              } else if (t.isBlockStatement(arrowFunc.body)) {
                componentNode = findReturnJSX(arrowFunc.body, importedComponents, variableMap, localComponents);
              }
              if (componentNode) {
                localComponents.set(varName, componentNode);
              }
            }
          }
        }
      },
    });

    // 함수 컴포넌트의 return 문에서 JSX 찾기
    traverse(ast, {
      // 함수 선언 (export default function Component() { return <div>... })
      FunctionDeclaration(path) {
        const returnNode = findReturnJSX(path.node.body, importedComponents, variableMap, localComponents);
        if (returnNode) {
          allComponents.push(returnNode);
          // 첫 번째 컴포넌트를 rootNode로 설정
          if (!rootNode) {
            rootNode = returnNode;
          }
        }
      },
      // 화살표 함수 (const Component = () => <div>...)
      ArrowFunctionExpression(path) {
        let componentNode: ComponentNode | null = null;
        if (t.isJSXElement(path.node.body)) {
          componentNode = parseJSXElement(path.node.body, importedComponents, variableMap, localComponents);
        } else if (t.isJSXFragment(path.node.body)) {
          componentNode = {
            type: 'fragment',
            children: path.node.body.children.map((child) => parseJSXChild(child, importedComponents, undefined, variableMap)).filter(Boolean) as ComponentNode[],
          };
        } else if (t.isBlockStatement(path.node.body)) {
          componentNode = findReturnJSX(path.node.body, importedComponents, variableMap, localComponents);
        }
        
        if (componentNode) {
          allComponents.push(componentNode);
          if (!rootNode) {
            rootNode = componentNode;
          }
        }
      },
      // 직접 JSX 요소 (fallback)
      JSXElement(path) {
        if (!rootNode) {
          rootNode = parseJSXElement(path.node, importedComponents, variableMap, localComponents);
        }
      },
      JSXFragment(path) {
        if (!rootNode) {
          rootNode = {
            type: 'fragment',
            children: path.node.children.map((child) => parseJSXChild(child, importedComponents, undefined, variableMap)).filter(Boolean) as ComponentNode[],
          };
        }
      },
    });

    // 여러 컴포넌트가 있는 경우, 모두 포함하는 컨테이너로 감싸기
    if (allComponents.length > 1) {
      console.log(`여러 컴포넌트 발견: ${allComponents.length}개`);
      return {
        type: 'div',
        props: { className: 'multi-component-container' },
        children: allComponents.map((comp, idx) => ({
          ...comp,
          id: comp.id || `component-${idx}`,
        })),
      };
    }

    if (!rootNode) {
      console.warn('컴포넌트를 파싱할 수 없습니다. 기본 div를 반환합니다.');
      // 기본 div 컨테이너 반환
      return {
        type: 'div',
        props: {},
        children: [],
      };
    }

    return rootNode;
  } catch (error) {
    console.error('컴포넌트 파싱 오류:', error);
    // 에러 발생 시에도 기본 구조 반환
    return {
      type: 'div',
      props: {},
      children: [
        {
          type: 'text',
          text: '파싱 오류: 컴포넌트를 렌더링할 수 없습니다.',
        },
      ],
    };
  }
}

// return 문에서 JSX 찾기
function findReturnJSX(body: t.BlockStatement | null | undefined, importedComponents?: Map<string, ComponentNode>, variableMap?: Map<string, any>, localComponents?: Map<string, ComponentNode>): ComponentNode | null {
  if (!body || !t.isBlockStatement(body)) return null;

  for (const statement of body.body) {
    if (t.isReturnStatement(statement) && statement.argument) {
      if (t.isJSXElement(statement.argument)) {
        return parseJSXElement(statement.argument, importedComponents, variableMap, localComponents);
      } else if (t.isJSXFragment(statement.argument)) {
        return {
          type: 'fragment',
          children: statement.argument.children.map((child) => parseJSXChild(child, importedComponents, undefined, variableMap)).filter(Boolean) as ComponentNode[],
        };
      }
    }
  }
  return null;
}

function parseJSXElement(node: t.JSXElement, importedComponents?: Map<string, ComponentNode>, variableMap?: Map<string, any>, localComponents?: Map<string, ComponentNode>): ComponentNode {
  const openingElement = node.openingElement;
  const name = getJSXElementName(openingElement.name);
  
  // Import된 컴포넌트인지 확인
  const isImportedComponent = importedComponents?.has(name);
  const importedComponent = isImportedComponent ? importedComponents!.get(name) : null;
  
  // 로컬 컴포넌트인지 확인 (같은 파일 내 정의)
  const isLocalComponent = localComponents?.has(name);
  const localComponent = isLocalComponent ? localComponents!.get(name) : null;
  
  const props: Record<string, any> = {};
  const style: Record<string, any> = {};

  // 속성 파싱
  openingElement.attributes.forEach((attr) => {
    if (t.isJSXAttribute(attr)) {
      const key = attr.name.name as string;
      const value = parseJSXAttributeValue(attr.value, variableMap);
      
      if (key === 'style' && typeof value === 'object') {
        Object.assign(style, value);
      } else if (key === 'id') {
        props.id = value;
      } else if (key === 'data-slot') {
        // data-slot 같은 속성도 저장
        props[key] = value;
      } else if (key === 'className') {
        // className 처리: 템플릿 리터럴이나 표현식인 경우 파싱
        if (t.isJSXExpressionContainer(attr.value)) {
          const expr = attr.value.expression;
          if (t.isTemplateLiteral(expr)) {
            // 템플릿 리터럴 파싱 (예: `p-4 ${borderColor[color]}`)
            props.className = parseTemplateLiteral(expr, variableMap);
          } else if (t.isStringLiteral(expr)) {
            props.className = expr.value;
          } else if (t.isCallExpression(expr)) {
            // 함수 호출 처리 (예: cn(badgeVariants({ variant }), className))
            props.className = parseCallExpression(expr, variableMap);
          } else {
            // 기타 표현식은 문자열로 변환
            props.className = recast.print(expr).code;
          }
        } else {
          props.className = value;
        }
      } else {
        props[key] = value;
      }
    } else if (t.isJSXSpreadAttribute(attr)) {
      // {...props} 스프레드 연산자 처리
      // 실제 값은 파싱할 수 없으므로 표시만
      props['_spread'] = true;
    }
  });

  if (Object.keys(style).length > 0) {
    props.style = style;
  }

  // children 파싱 (부모 타입 전달)
  const children: ComponentNode[] = node.children
    .map((child) => parseJSXChild(child, importedComponents, name, variableMap, localComponents))
    .filter(Boolean) as ComponentNode[];

  // children이 없고 self-closing 태그인 경우, 기본 표시용 children 추가
  if (children.length === 0 && node.closingElement === null) {
    // self-closing 태그이지만 표시를 위해 빈 텍스트 추가하지 않음
  }

  // Import된 컴포넌트 또는 로컬 컴포넌트인 경우, 해당 컴포넌트의 구조를 사용
  const targetComponent = isImportedComponent ? importedComponent : (isLocalComponent ? localComponent : null);
  if (targetComponent) {
    // 컴포넌트를 복사하고 props와 children을 병합
    // children은 현재 요소의 children을 우선 사용 (props로 전달된 children)
    const mergedChildren = children.length > 0 
      ? children 
      : (targetComponent.children || []);
    
    // props 병합 (현재 props가 우선) 및 정리
    const mergedProps: Record<string, any> = {};
    
    // 컴포넌트의 props 정리
    if (targetComponent.props) {
      Object.entries(targetComponent.props).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          mergedProps[key] = value;
        }
      });
    }
    
    // 현재 props 추가 (우선순위 높음)
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'style') {
        // style은 이미 처리됨
      } else if (typeof value === 'string' && value.startsWith('__VAR__')) {
        // 변수 참조는 제외 (런타임 값이므로 파싱 불가)
        // 하지만 객체 props는 파싱된 객체를 사용
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        mergedProps[key] = value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 객체 props도 저장 (예: info={user})
        mergedProps[key] = value;
      }
    });
    
    // Import된 컴포넌트의 children에서 props 참조를 실제 값으로 대체 (재귀적으로)
    const replaceExpressionsInNode = (node: ComponentNode, props: Record<string, any>, componentObjects?: Record<string, Record<string, string>>): ComponentNode => {
      // className에서 props 기반 동적 클래스 생성 처리
      if (node.props?.className && typeof node.props.className === 'string') {
        const className = node.props.className;
        let processedClassName = className;
        
        console.log('처리 전 className:', processedClassName);
        console.log('componentObjects:', componentObjects);
        console.log('props:', props);
        
        // __OR__ 패턴 처리 (|| 연산자) - 반복 처리하여 모든 패턴 처리
        let previousClassName = '';
        let iterationCount = 0;
        while (processedClassName !== previousClassName && iterationCount < 10) {
          previousClassName = processedClassName;
          iterationCount++;
          
          // 더 정확한 패턴: __OR__ 다음에 오는 표현식만 매칭
          // left: \w+\[\w+\] 또는 \w+\.\w+
          // right: \w+\[\w+\] 또는 \w+\.\w+ (공백이나 __OR__ 전까지)
          // 패턴을 더 유연하게: [^|\s]+ 로 매칭
          processedClassName = processedClassName.replace(/__OR__([^|]+)\|\|([^|\s]+)(?=\s|$|__OR__)/g, (match, left, right) => {
            console.log('__OR__ 패턴 발견:', match, 'left:', left, 'right:', right);
            
            // left 처리 (예: borderColor[color] 또는 borderColor.color)
            let leftValue: string | null = null;
            const leftBracketMatch = left.match(/^(\w+)\[(\w+)\]$/);
            if (leftBracketMatch) {
              const [, objName, propName] = leftBracketMatch;
              if (componentObjects && componentObjects[objName]) {
                const obj = componentObjects[objName];
                const propValue = props[propName];
                if (propValue !== undefined && obj[propValue]) {
                  leftValue = obj[propValue];
                }
              }
            } else {
              const leftDotMatch = left.match(/^(\w+)\.(\w+)$/);
              if (leftDotMatch) {
                const [, objName, propName] = leftDotMatch;
                if (componentObjects && componentObjects[objName] && componentObjects[objName][propName]) {
                  leftValue = componentObjects[objName][propName];
                }
              }
            }
            
            if (leftValue) {
              console.log('leftValue:', leftValue);
              return leftValue;
            }
            
            // right 처리 (fallback, 예: borderColor.blue 또는 borderColor[blue])
            let rightValue: string | null = null;
            const rightBracketMatch = right.match(/^(\w+)\[(\w+)\]$/);
            if (rightBracketMatch) {
              const [, objName, propName] = rightBracketMatch;
              if (componentObjects && componentObjects[objName] && componentObjects[objName][propName]) {
                rightValue = componentObjects[objName][propName];
              }
            } else {
              const rightDotMatch = right.match(/^(\w+)\.(\w+)$/);
              if (rightDotMatch) {
                const [, objName, propName] = rightDotMatch;
                if (componentObjects && componentObjects[objName] && componentObjects[objName][propName]) {
                  rightValue = componentObjects[objName][propName];
                }
              }
            }
            
            if (rightValue) {
              console.log('rightValue (fallback):', rightValue);
              return rightValue;
            }
            
            console.log('__OR__ 패턴 처리 실패, 원본 반환');
            return match;
          });
        }
        
        // __OBJ__ 패턴 처리 (멤버 표현식)
        // 패턴: __OBJ__objName[propName] 또는 __OBJ__objName.propName
        processedClassName = processedClassName.replace(/__OBJ__(\w+)\[(\w+)\]/g, (match, objName, propName) => {
          console.log('__OBJ__ 패턴 발견:', match, 'objName:', objName, 'propName:', propName);
          // componentObjects에서 객체 찾기 (예: colorClasses, borderColor)
          if (componentObjects && componentObjects[objName]) {
            const obj = componentObjects[objName];
            const propValue = props[propName];
            console.log('obj:', obj, 'propValue:', propValue);
            if (propValue !== undefined && obj[propValue]) {
              console.log('매칭된 값:', obj[propValue]);
              return obj[propValue];
            }
          }
          // componentObjects에 없으면 기본 생성 함수 사용
          const propValue = props[propName];
          if (propValue !== undefined) {
            const generated = generateColorClasses(propValue, objName);
            console.log('기본 생성 함수 결과:', generated);
            return generated;
          }
          console.log('__OBJ__ 패턴 처리 실패, 원본 반환');
          return match;
        });
        
        processedClassName = processedClassName.replace(/__OBJ__(\w+)\.(\w+)/g, (match, objName, propName) => {
          if (componentObjects && componentObjects[objName] && componentObjects[objName][propName]) {
            return componentObjects[objName][propName];
          }
          return match;
        });
        
        // __VARIANT__ 패턴 처리 (variant 함수 호출, 예: badgeVariants({ variant }))
        // 먼저 __VARIANT__를 처리하여 variant 클래스명을 생성
        processedClassName = processedClassName.replace(/__VARIANT__(\w+)/g, (match, variantFuncName) => {
          console.log('__VARIANT__ 패턴 발견:', match, 'variantFuncName:', variantFuncName);
          // variant prop 확인
          const variant = props.variant;
          if (variant && typeof variant === 'string') {
            // variant 값에 따라 기본 클래스명 생성 (예: variant-outline)
            // 실제 variant 함수의 결과는 알 수 없으므로, 기본 클래스명만 반환
            const result = `variant-${variant}`;
            console.log('__VARIANT__ 처리 결과:', result);
            return result;
          }
          // variant prop이 없으면 빈 문자열 반환
          console.log('__VARIANT__ 처리 실패: variant prop 없음');
          return '';
        });
        
        // __PROP__ 패턴 처리 (단순 변수 참조, 예: className prop)
        // 주의: __PROP__className은 외부에서 전달된 className prop을 의미하므로,
        // props.className을 참조하면 순환 참조가 발생할 수 있음
        // 따라서 __PROP__className은 빈 문자열로 처리하거나, 실제 전달된 className prop을 찾아야 함
        processedClassName = processedClassName.replace(/__PROP__(\w+)/g, (match, varName) => {
          console.log('__PROP__ 패턴 발견:', match, 'varName:', varName, '전체 props:', props);
          
          // className prop인 경우, 순환 참조를 피하기 위해 특별 처리
          if (varName === 'className') {
            // __PROP__className은 외부에서 전달된 className prop을 의미
            // 하지만 우리 파서에서는 이 값을 알 수 없으므로, 빈 문자열로 처리
            // 실제로는 컴포넌트 사용 시 전달된 className을 찾아야 하지만, 파싱 단계에서는 불가능
            console.log('__PROP__className 처리: 빈 문자열 반환 (외부 className prop은 파싱 단계에서 알 수 없음)');
            return '';
          }
          
          // 다른 prop은 일반적으로 처리
          const propValue = props[varName];
          if (propValue !== undefined) {
            // className prop인 경우 문자열로 변환
            if (typeof propValue === 'string') {
              console.log('__PROP__ 처리 결과:', propValue);
              return propValue;
            }
            console.log('__PROP__ 처리 결과 (문자열 변환):', String(propValue));
            return String(propValue);
          }
          // prop이 없으면 빈 문자열 반환 (cn() 함수에서 결합될 때 무시됨)
          console.log('__PROP__ 처리 실패: prop 없음');
          return '';
        });
        
        // 기존 패턴도 처리 (하위 호환성)
        // {objName[propName]} 패턴
        processedClassName = processedClassName.replace(/\{(\w+)\[(\w+)\]\}/g, (match, objName, propName) => {
          if (componentObjects && componentObjects[objName]) {
            const obj = componentObjects[objName];
            const propValue = props[propName];
            if (propValue !== undefined && obj[propValue]) {
              return obj[propValue];
            }
          }
          const propValue = props[propName];
          if (propValue !== undefined) {
            return generateColorClasses(propValue, objName);
          }
          return match;
        });
        
        // {objName.propName} 패턴
        processedClassName = processedClassName.replace(/\{(\w+)\.(\w+)\}/g, (match, objName, propName) => {
          if (componentObjects && componentObjects[objName] && componentObjects[objName][propName]) {
            return componentObjects[objName][propName];
          }
          return match;
        });
        
        // className 업데이트
        if (processedClassName !== className) {
          // 불필요한 공백 제거 (앞뒤 공백 및 연속된 공백)
          processedClassName = processedClassName.trim().replace(/\s+/g, ' ');
          console.log('className 업데이트:', className, '->', processedClassName);
          node = {
            ...node,
            props: {
              ...node.props,
              className: processedClassName,
            },
          };
        } else {
          console.log('className 변경 없음:', className);
        }
      }
      
      // 텍스트 노드이고 표현식인 경우
      if (node.type === 'text' && node.isExpression && node.text) {
        let propValue: any = undefined;
        const processedText = node.text;
        
        // __IN__ 패턴 처리 ("prop" in obj && ...)
        if (processedText && processedText.includes('__IN__')) {
          const inMatch = processedText.match(/\{__IN__(\w+)__IN__(\w+)__AND__(.+)\}/);
          if (inMatch) {
            const [, propName, objName, rightExpr] = inMatch;
            const obj = props[objName];
            if (obj && typeof obj === 'object' && propName in obj) {
              // "prop" in obj이 true이면 오른쪽 표현식 처리
              // 오른쪽이 JSX 요소인 경우 파싱 시도
              try {
                const parsed = parser.parse(rightExpr, {
                  sourceType: 'module',
                  plugins: ['jsx', 'typescript'],
                });
                // JSX 요소를 찾아서 파싱
                traverse(parsed, {
                  JSXElement(path) {
                    const jsxNode = parseJSXElement(path.node, undefined, undefined);
                    if (jsxNode) {
                      propValue = jsxNode;
                    }
                  },
                });
              } catch (e) {
                // 파싱 실패 시 원본 텍스트 유지
              }
            }
          }
        }
        
        // __MAP__ 패턴 처리 (item.bullets.map(...))
        if (processedText && processedText.includes('__MAP__') && propValue === undefined) {
          const mapMatch = processedText.match(/\{__MAP__([^_]+)__MAP__(.+)\}/);
          if (mapMatch) {
            const [, arrayExpr, fullExpr] = mapMatch;
            // arrayExpr을 props에서 찾기 (예: item.bullets)
            const parts = arrayExpr.split('.');
            if (parts.length === 2) {
              const [objName, propName] = parts;
              const obj = props[objName];
              if (obj && typeof obj === 'object' && propName in obj) {
                const arrayData = obj[propName];
                if (Array.isArray(arrayData) && arrayData.length > 0) {
                  // 배열의 항목들을 렌더링
                  try {
                    const parsed = parser.parse(fullExpr, {
                      sourceType: 'module',
                      plugins: ['jsx', 'typescript'],
                    });
                    const renderedItems: ComponentNode[] = [];
                    const itemsToRender = arrayData.slice(0, 3); // 최대 3개
                    
                    for (const item of itemsToRender) {
                      traverse(parsed, {
                        JSXElement(path) {
                          const itemMap = new Map();
                          // map 함수의 첫 번째 파라미터 이름 찾기
                          const callExpr = parsed.program.body[0];
                          if (t.isExpressionStatement(callExpr) && 
                              t.isCallExpression(callExpr.expression) &&
                              callExpr.expression.arguments.length > 0 &&
                              t.isArrowFunctionExpression(callExpr.expression.arguments[0])) {
                            const arrowFn = callExpr.expression.arguments[0];
                            if (t.isIdentifier(arrowFn.params[0])) {
                              itemMap.set(arrowFn.params[0].name, item);
                            }
                          }
                          const jsxNode = parseJSXElement(path.node, undefined, itemMap, undefined);
                          if (jsxNode) {
                            renderedItems.push(jsxNode);
                          }
                        },
                      });
                    }
                    
                    if (renderedItems.length > 0) {
                      propValue = {
                        type: 'fragment',
                        children: renderedItems,
                      };
                    }
                  } catch (e) {
                    // 파싱 실패 시 원본 텍스트 유지
                    console.warn('__MAP__ 패턴 파싱 실패:', e);
                  }
                }
              }
            }
          }
        }
        
        // __AND__ 패턴 처리 (obj && ...)
        if (processedText && processedText.includes('__AND__') && propValue === undefined) {
          const andMatch = processedText.match(/\{(\w+)__AND__(.+)\}/);
          if (andMatch) {
            const [, objName, rightExpr] = andMatch;
            const obj = props[objName];
            if (obj && obj !== null && obj !== undefined && obj !== false) {
              // obj가 truthy이면 오른쪽 표현식 처리
              try {
                const parsed = parser.parse(rightExpr, {
                  sourceType: 'module',
                  plugins: ['jsx', 'typescript'],
                });
                traverse(parsed, {
                  JSXElement(path) {
                    const jsxNode = parseJSXElement(path.node, undefined, undefined);
                    if (jsxNode) {
                      propValue = jsxNode;
                    }
                  },
                });
              } catch (e) {
                // 파싱 실패 시 원본 텍스트 유지
              }
            }
          }
        }
        
        // 단순 변수 참조 (예: {name}, {title})
        if (propValue === undefined && node.expressionName) {
          propValue = props[node.expressionName];
        }
        // 멤버 표현식 (예: {info.name}, {item.title})
        else if (propValue === undefined && node.expressionText) {
          // expressionText를 파싱하여 객체 속성 접근
          const parts = node.expressionText.split('.');
          if (parts.length === 2) {
            const [objName, propName] = parts;
            const obj = props[objName];
            if (obj && typeof obj === 'object' && propName in obj) {
              propValue = obj[propName];
            }
          } else if (parts.length === 3) {
            // 중첩된 속성 (예: info.contact1)
            const [objName, ...rest] = parts;
            const obj = props[objName];
            if (obj && typeof obj === 'object') {
              let current = obj;
              for (const part of rest) {
                if (current && typeof current === 'object' && part in current) {
                  current = current[part];
                } else {
                  current = undefined;
                  break;
                }
              }
              propValue = current;
            }
          }
        }
        
        if (propValue !== undefined) {
          // propValue가 ComponentNode인 경우 (조건부 렌더링 결과)
          if (typeof propValue === 'object' && propValue !== null && 'type' in propValue) {
            return propValue as ComponentNode;
          }
          // 일반 값인 경우
          return {
            ...node,
            text: String(propValue),
            isExpression: false,
          };
        }
      }
      
      // children이 있는 경우 재귀적으로 처리
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map((child) => replaceExpressionsInNode(child, props, componentObjects)),
        };
      }
      
      return node;
    };
    
    // Props 기반 동적 Tailwind 클래스 생성 헬퍼 함수
    const generateColorClasses = (color: string, type: string): string => {
      const colorMap: Record<string, Record<string, string>> = {
        colorClasses: {
          red: 'border-red-500 bg-red-50 text-red-800',
          blue: 'border-blue-500 bg-blue-50 text-blue-800',
          green: 'border-green-500 bg-green-50 text-green-800',
          yellow: 'border-yellow-500 bg-yellow-50 text-yellow-800',
          purple: 'border-purple-500 bg-purple-50 text-purple-800',
          gray: 'border-gray-500 bg-gray-50 text-gray-800',
        },
        borderColor: {
          red: 'border-l-red-500',
          blue: 'border-l-blue-500',
          green: 'border-l-green-500',
          yellow: 'border-l-yellow-500',
          purple: 'border-l-purple-500',
          gray: 'border-l-gray-500',
        },
      };
      
      if (type.includes('border') || type === 'borderColor') {
        return colorMap.borderColor[color] || colorMap.borderColor.blue;
      }
      return colorMap.colorClasses[color] || colorMap.colorClasses.blue;
    };
    
    // 컴포넌트의 componentObjects 가져오기
    const componentObjects = (targetComponent as any)?.componentObjects;
    
    // 루트 노드도 처리 (className이 루트에 있을 수 있음)
    const processedRoot = replaceExpressionsInNode(
      {
        ...targetComponent,
        props: Object.keys(mergedProps).length > 0 ? mergedProps : targetComponent.props,
        children: mergedChildren,
      },
      mergedProps,
      componentObjects
    );
    
    return {
      ...processedRoot,
      id: mergedProps.id as string | undefined,
      type: targetComponent.type, // 컴포넌트의 타입 사용
      isImported: isImportedComponent,
    };
  }

  // props에서 객체 값 제거 (문자열, 숫자, 불린만 유지)
  const cleanProps: Record<string, any> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'style') {
      // style은 이미 처리됨
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      cleanProps[key] = value;
    } else if (value === null || value === undefined) {
      // null/undefined는 제외
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 객체 props도 저장 (예: item={...}, info={...})
      cleanProps[key] = value;
    }
    // 배열은 제외
  });

  // children에서 props 참조 처리 (로컬 컴포넌트도 처리)
  // 예: <Section title="Experience">에서 {title} 처리
  const processedChildren = children.map((child) => {
    if (child.type === 'text' && child.isExpression) {
      let propValue: any = undefined;
      
      // 단순 변수 참조 (예: {title}, {children})
      if (child.expressionName) {
        propValue = cleanProps[child.expressionName];
      }
      // 멤버 표현식 (예: {item.title}, {item.period})
      else if (child.expressionText) {
        const parts = child.expressionText.split('.');
        if (parts.length === 2) {
          const [objName, propName] = parts;
          const obj = cleanProps[objName];
          if (obj && typeof obj === 'object' && propName in obj) {
            propValue = obj[propName];
          }
        }
      }
      
      if (propValue !== undefined) {
        return {
          ...child,
          text: String(propValue),
          isExpression: false,
        };
      }
    }
    return child;
  });

  return {
    id: cleanProps.id as string | undefined,
    type: name,
    props: Object.keys(cleanProps).length > 0 ? cleanProps : undefined,
    children: processedChildren.length > 0 ? processedChildren : undefined,
    isImported: isImportedComponent,
  };
}

function parseJSXChild(node: t.Node, importedComponents?: Map<string, ComponentNode>, parentType?: string, variableMap?: Map<string, any>, localComponents?: Map<string, ComponentNode>): ComponentNode | null {
  // option 태그 내부의 요소들은 모두 텍스트로 변환
  if (parentType === 'option') {
    if (t.isJSXText(node)) {
      const text = node.value.trim();
      if (text) {
        return {
          type: 'text',
          text,
        };
      }
    } else if (t.isJSXElement(node)) {
      // option 내부의 요소는 텍스트로 변환
      const textContent = extractTextFromJSX(node);
      if (textContent) {
        return {
          type: 'text',
          text: textContent,
        };
      }
    } else if (t.isJSXExpressionContainer(node)) {
      // JSX 주석 처리: {/* ... */}는 JSXEmptyExpression으로 파싱됨
      if (t.isJSXEmptyExpression(node.expression)) {
        // 주석은 무시
        return null;
      }
      return {
        type: 'text',
        text: String(node.expression),
      };
    }
    return null;
  }
  
  if (t.isJSXElement(node)) {
    return parseJSXElement(node, importedComponents, variableMap, localComponents);
  } else if (t.isJSXExpressionContainer(node)) {
    // JSX 주석 처리: {/* ... */}는 JSXEmptyExpression으로 파싱됨
    if (t.isJSXEmptyExpression(node.expression)) {
      // 주석은 무시
      return null;
    }
    
    if (t.isJSXElement(node.expression)) {
      return parseJSXElement(node.expression, importedComponents, variableMap, localComponents);
    } else if (t.isIdentifier(node.expression)) {
      // 변수 참조 (예: {name}, {age})는 props를 참조할 수 있으므로 특별한 마커 사용
      return {
        type: 'text',
        text: `{${node.expression.name}}`,
        isExpression: true,
        expressionName: node.expression.name,
      };
    } else if (t.isMemberExpression(node.expression)) {
      // 멤버 표현식 (예: {user.name}, {item.title})도 처리
      const exprText = recast.print(node.expression).code;
      return {
        type: 'text',
        text: `{${exprText}}`,
        isExpression: true,
        expressionText: exprText,
      };
    } else if (t.isLogicalExpression(node.expression)) {
      // 논리 표현식 (예: {"period" in item && <Badge>...})
      // && 연산자의 경우, 왼쪽이 truthy면 오른쪽을 반환
      if (node.expression.operator === '&&') {
        // 왼쪽 표현식 평가 시도
        const leftExpr = node.expression.left;
        // leftValue는 사용되지 않으므로 제거
        
        // "prop" in obj 패턴 처리
        if (t.isBinaryExpression(leftExpr) && leftExpr.operator === 'in') {
          // "period" in item 같은 패턴
          if (t.isStringLiteral(leftExpr.left) && t.isIdentifier(leftExpr.right)) {
            const propName = leftExpr.left.value;
            const objName = leftExpr.right.name;
            // 나중에 props에서 처리하도록 마커 남김
            return {
              type: 'text',
              text: `{__IN__${propName}__IN__${objName}__AND__${recast.print(node.expression.right).code}}`,
              isExpression: true,
              expressionText: recast.print(node.expression).code,
            };
          }
        }
        
        // 단순 Identifier 체크 (예: {item && ...})
        if (t.isIdentifier(leftExpr)) {
          return {
            type: 'text',
            text: `{${leftExpr.name}__AND__${recast.print(node.expression.right).code}}`,
            isExpression: true,
            expressionText: recast.print(node.expression).code,
          };
        }
      }
      
      // 기타 논리 표현식은 텍스트로 처리
      const exprText = recast.print(node.expression).code;
      return {
        type: 'text',
        text: `{${exprText}}`,
        isExpression: true,
        expressionText: exprText,
      };
    } else if (t.isConditionalExpression(node.expression)) {
      // 삼항 연산자 (예: {condition ? a : b})
      const exprText = recast.print(node.expression).code;
      return {
        type: 'text',
        text: `{${exprText}}`,
        isExpression: true,
        expressionText: exprText,
      };
    } else if (t.isCallExpression(node.expression)) {
      // 함수 호출 (예: {EXPERIENCES.map(...)}, {item.bullets.map(...)})
      const callee = node.expression.callee;
      
      // .map() 호출 처리
      if (t.isMemberExpression(callee) && 
          t.isIdentifier(callee.property) && 
          callee.property.name === 'map') {
        // 배열 변수 찾기 (예: EXPERIENCES, item.bullets)
        let arrayData: any[] | null = null;
        
        if (t.isIdentifier(callee.object)) {
          // EXPERIENCES.map(...) 같은 경우
          const arrayName = callee.object.name;
          if (variableMap && variableMap.has(arrayName)) {
            const value = variableMap.get(arrayName);
            if (Array.isArray(value)) {
              arrayData = value;
            }
          }
        } else if (t.isMemberExpression(callee.object)) {
          // item.bullets.map(...) 같은 경우 - 나중에 props에서 처리
          const exprText = recast.print(callee.object).code;
          return {
            type: 'text',
            text: `{__MAP__${exprText}__MAP__${recast.print(node.expression).code}}`,
            isExpression: true,
            expressionText: recast.print(node.expression).code,
          };
        }
        
        // map 함수의 인자 (화살표 함수)
        if (arrayData && arrayData.length > 0 && node.expression.arguments.length > 0) {
          const mapFn = node.expression.arguments[0];
          if (t.isArrowFunctionExpression(mapFn)) {
        // 최대 3개만 렌더링
        const itemsToRender = arrayData.slice(0, 3);
            
            const renderedItems: ComponentNode[] = [];
            
            for (const item of itemsToRender) {
              // map 함수의 body를 파싱
              if (t.isJSXElement(mapFn.body)) {
                const jsxNode = parseJSXElement(mapFn.body, importedComponents, variableMap, localComponents);
                // item 변수를 실제 값으로 대체하기 위해 variableMap에 추가
                const paramName = mapFn.params[0];
                if (t.isIdentifier(paramName)) {
                  const itemMap = new Map(variableMap);
                  itemMap.set(paramName.name, item);
                  // 다시 파싱 (item이 실제 값으로 대체됨)
                  const parsedNode = parseJSXElement(mapFn.body, importedComponents, itemMap, localComponents);
                  if (parsedNode) {
                    renderedItems.push(parsedNode);
                  }
                } else {
                  renderedItems.push(jsxNode);
                }
              } else if (t.isBlockStatement(mapFn.body)) {
                // return 문 찾기
                const returnNode = findReturnJSX(mapFn.body, importedComponents, variableMap, localComponents);
                if (returnNode) {
                  renderedItems.push(returnNode);
                }
              }
            }
            
            if (renderedItems.length > 0) {
              return {
                type: 'fragment',
                children: renderedItems,
              };
            }
          }
        }
      }
      
      // 기타 함수 호출은 텍스트로 처리
      const exprText = recast.print(node.expression).code;
      return {
        type: 'text',
        text: `{${exprText}}`,
        isExpression: true,
        expressionText: exprText,
      };
    }
    // 다른 표현식은 텍스트로 처리
    const exprText = recast.print(node.expression).code;
    return {
      type: 'text',
      text: `{${exprText}}`,
    };
  } else if (t.isJSXText(node)) {
    const text = node.value.trim();
    if (text) {
      return {
        type: 'text',
        text,
      };
    }
  }
  return null;
}

// JSX 요소에서 텍스트만 추출
function extractTextFromJSX(node: t.JSXElement): string {
  let text = '';
  for (const child of node.children) {
    if (t.isJSXText(child)) {
      text += child.value;
    } else if (t.isJSXElement(child)) {
      text += extractTextFromJSX(child);
    } else if (t.isJSXExpressionContainer(child)) {
      text += String(child.expression);
    }
  }
  return text.trim();
}

function getJSXElementName(name: t.JSXElement['openingElement']['name']): string {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  } else if (t.isJSXMemberExpression(name)) {
    // motion.div 같은 네임스페이스 컴포넌트 처리
    // motion.div는 div로 렌더링
    const memberName = `${getJSXElementName(name.object)}.${name.property.name}`;
    // motion.div, motion.h1 등은 마지막 부분만 사용
    if (memberName.startsWith('motion.')) {
      return name.property.name; // div, h1 등
    }
    return memberName;
  }
  return 'unknown';
}

function parseJSXAttributeValue(value: t.JSXAttribute['value'] | null, variableMap?: Map<string, any>): any {
  if (!value) return true;
  
  if (t.isStringLiteral(value)) {
    return value.value;
  } else if (t.isJSXExpressionContainer(value)) {
    const expr = value.expression;
    
    if (t.isStringLiteral(expr)) {
      return expr.value;
    } else if (t.isNumericLiteral(expr)) {
      return expr.value;
    } else if (t.isBooleanLiteral(expr)) {
      return expr.value;
    } else if (t.isObjectExpression(expr)) {
      // 객체 표현식 파싱 (예: {name: "수민", age: 14})
      return parseObjectExpression(expr);
    } else if (t.isCallExpression(expr)) {
      // 함수 호출 처리 (예: cn(...), badgeVariants(...))
      return parseCallExpression(expr, variableMap);
    } else if (t.isIdentifier(expr)) {
      // 변수 참조: variableMap에서 값을 찾기
      if (variableMap && variableMap.has(expr.name)) {
        return variableMap.get(expr.name);
      }
      // 없으면 마커 사용
      return `__VAR__${expr.name}`;
    } else if (t.isMemberExpression(expr)) {
      // 멤버 표현식 (예: user.name) 처리
      if (variableMap && t.isIdentifier(expr.object)) {
        const objName = expr.object.name;
        const propName = t.isIdentifier(expr.property) ? expr.property.name : null;
        if (variableMap.has(objName) && propName) {
          const obj = variableMap.get(objName);
          if (obj && typeof obj === 'object' && propName in obj) {
            return obj[propName];
          }
        }
      }
      // 없으면 마커 사용
      return `__VAR__${recast.print(expr).code}`;
    } else if (t.isTemplateLiteral(expr)) {
      // 템플릿 리터럴은 문자열로 변환 시도
      return String(expr);
    } else {
      // 기타 표현식은 마커 사용
      return `__VAR__${recast.print(expr).code}`;
    }
  }
  return null;
}

function parseObjectExpression(node: t.ObjectExpression): Record<string, any> {
  const obj: Record<string, any> = {};
  
  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      const key = t.isIdentifier(prop.key) ? prop.key.name : String(prop.key);
      const value = parseExpressionValue(prop.value);
      obj[key] = value;
    }
  });
  
  return obj;
}

// 템플릿 리터럴 파싱 (예: `p-4 ${borderColor[color]}`)
function parseTemplateLiteral(node: t.TemplateLiteral, variableMap?: Map<string, any>): string {
  let result = '';
  
  for (let i = 0; i < node.quasis.length; i++) {
    // 정적 문자열 부분
    result += node.quasis[i].value.raw;
    
    // 표현식 부분 (있는 경우)
    if (i < node.expressions.length) {
      const expr = node.expressions[i];
      
      if (t.isStringLiteral(expr)) {
        result += expr.value;
      } else if (t.isNumericLiteral(expr)) {
        result += expr.value;
      } else if (t.isIdentifier(expr)) {
        // 변수 참조: variableMap에서 찾기
        if (variableMap && variableMap.has(expr.name)) {
          result += String(variableMap.get(expr.name));
        } else {
          // props 참조로 표시 (나중에 replaceExpressionsInNode에서 처리)
          result += `__PROP__${expr.name}`;
        }
      } else if (t.isLogicalExpression(expr) && expr.operator === '||') {
        // || 연산자 처리 (예: borderColor[color] || borderColor.blue)
        const left = parseTemplateLiteralExpression(expr.left);
        const right = parseTemplateLiteralExpression(expr.right);
        result += `__OR__${left}||${right}`;
      } else if (t.isMemberExpression(expr)) {
        // 멤버 표현식 (예: borderColor[color], colorClasses[color])
        // 패턴: objName[propName] 또는 objName.propName
        if (t.isIdentifier(expr.object)) {
          const objName = expr.object.name;
          if (t.isIdentifier(expr.property)) {
            // objName.propName 형태 (fallback)
            result += `__OBJ__${objName}.${expr.property.name}`;
          } else if (t.isStringLiteral(expr.property)) {
            // objName["propName"] 형태
            result += `__OBJ__${objName}.${expr.property.value}`;
          } else {
            // objName[propName] 형태 (propName이 변수)
            const propName = recast.print(expr.property).code;
            result += `__OBJ__${objName}[${propName}]`;
          }
        } else {
          const exprText = recast.print(expr).code;
          result += `{${exprText}}`;
        }
      } else {
        // 기타 표현식
        const exprText = recast.print(expr).code;
        result += `{${exprText}}`;
      }
    }
  }
  
  return result;
}

// 템플릿 리터럴 내부 표현식 파싱 헬퍼
function parseTemplateLiteralExpression(expr: t.Expression): string {
  if (t.isMemberExpression(expr)) {
    const objName = t.isIdentifier(expr.object) ? expr.object.name : '';
    if (t.isIdentifier(expr.property)) {
      // objName[propName] 형태 (propName이 변수)
      return `${objName}[${expr.property.name}]`;
    } else if (t.isStringLiteral(expr.property)) {
      // objName["propName"] 형태
      return `${objName}.${expr.property.value}`;
    } else {
      // 기타
      const propName = recast.print(expr.property).code;
      return `${objName}[${propName}]`;
    }
  }
  return recast.print(expr).code;
}

function parseExpressionValue(node: t.Node): any {
  if (!t.isExpression(node)) {
    return null;
  }
  if (t.isStringLiteral(node)) {
    return node.value;
  } else if (t.isNumericLiteral(node)) {
    return node.value;
  } else if (t.isBooleanLiteral(node)) {
    return node.value;
  } else if (t.isObjectExpression(node)) {
    return parseObjectExpression(node);
  }
  return null;
}

// 함수 호출 파싱 (예: cn(badgeVariants({ variant }), className))
function parseCallExpression(node: t.CallExpression, variableMap?: Map<string, any>): string {
  // cn() 함수 호출 처리
  if (t.isIdentifier(node.callee) && node.callee.name === 'cn') {
    // cn() 함수의 인자들을 파싱하여 결합
    const args: string[] = [];
    for (const arg of node.arguments) {
      if (t.isStringLiteral(arg)) {
        args.push(arg.value);
      } else if (t.isCallExpression(arg)) {
        // 중첩된 함수 호출 (예: badgeVariants({ variant }))
        // variant 함수는 나중에 props에서 처리하므로 마커만 남김
        if (t.isIdentifier(arg.callee) && arg.callee.name.endsWith('Variants')) {
          // variant 함수 호출은 마커로 표시 (나중에 replaceExpressionsInNode에서 처리)
          args.push(`__VARIANT__${arg.callee.name}`);
        } else {
          const nestedResult = parseCallExpression(arg, variableMap);
          if (nestedResult) {
            args.push(nestedResult);
          }
        }
      } else if (t.isIdentifier(arg)) {
        // 변수 참조 (예: className)
        if (variableMap && variableMap.has(arg.name)) {
          args.push(String(variableMap.get(arg.name)));
        } else {
          // props 참조로 표시 (나중에 처리)
          args.push(`__PROP__${arg.name}`);
        }
      } else if (t.isObjectExpression(arg)) {
        // 객체 표현식은 무시 (variant 객체 등)
        // 실제로는 variant prop에서 값을 가져와야 하지만, 일단 무시
      } else {
        // 기타는 문자열로 변환
        const argStr = recast.print(arg).code;
        // 함수 호출이 아닌 경우만 추가
        if (!argStr.includes('(')) {
          args.push(argStr);
        }
      }
    }
    // 공백으로 구분하여 결합 (cn() 함수는 보통 클래스명을 결합)
    return args.filter(Boolean).join(' ');
  }
  
  // badgeVariants(), buttonVariants() 등의 variant 함수 호출 처리
  if (t.isIdentifier(node.callee) && node.callee.name.endsWith('Variants')) {
    // variant 함수는 객체 인자를 받음 (예: { variant: "outline" })
    // 실제 클래스명은 variant prop에서 가져와야 하지만, 일단 마커 반환
    // 나중에 props에서 variant 값을 확인하여 처리
    return `__VARIANT__${node.callee.name}`;
  }
  
  // 기타 함수 호출은 문자열로 변환
  return recast.print(node).code;
}

