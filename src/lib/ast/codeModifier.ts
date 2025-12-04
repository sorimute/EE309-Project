import * as parser from '@babel/parser';
import * as recast from 'recast';
import * as t from '@babel/types';
import traverse from '@babel/traverse';

/**
 * Canvas에서 변경된 요소의 위치/크기/스타일을 코드에 반영
 */
export function updateElementInCode(
  code: string,
  elementId: string,
  updates: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: Record<string, any>;
  }
): string {
  try {
    const ast = recast.parse(code, {
      parser: {
        parse: (source: string) =>
          parser.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
          }),
      },
    });

    traverse(ast, {
      JSXAttribute(path) {
        if (
          t.isJSXIdentifier(path.node.name) &&
          path.node.name.name === 'id' &&
          t.isStringLiteral(path.node.value) &&
          path.node.value.value === elementId
        ) {
          // 해당 요소를 찾았으므로, 부모 JSXElement를 찾아서 수정
          const jsxElement = path.findParent((p) => t.isJSXElement(p.node)) as any;
          if (jsxElement && t.isJSXElement(jsxElement.node)) {
            updateJSXElementStyle(jsxElement.node, updates);
          }
        }
      },
    });

    return recast.print(ast).code;
  } catch (error) {
    console.error('코드 수정 실패:', error);
    return code;
  }
}

function updateJSXElementStyle(
  element: t.JSXElement,
  updates: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: Record<string, any>;
  }
) {
  const openingElement = element.openingElement;
  let styleAttr = openingElement.attributes.find(
    (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'style'
  ) as t.JSXAttribute | undefined;

  const styleUpdates: Record<string, any> = { ...updates.style };

  if (updates.position) {
    styleUpdates.position = 'absolute';
    styleUpdates.left = `${updates.position.x}px`;
    styleUpdates.top = `${updates.position.y}px`;
  }

  if (updates.size) {
    styleUpdates.width = `${updates.size.width}px`;
    styleUpdates.height = `${updates.size.height}px`;
  }

  if (styleAttr && t.isJSXExpressionContainer(styleAttr.value)) {
    // 기존 style 객체 업데이트
    if (t.isObjectExpression(styleAttr.value.expression)) {
      updateObjectExpression(styleAttr.value.expression, styleUpdates);
    }
  } else {
    // 새로운 style 속성 추가
    const styleObject = t.objectExpression(
      Object.entries(styleUpdates).map(([key, value]) =>
        t.objectProperty(
          t.identifier(key),
          typeof value === 'string' ? t.stringLiteral(value) : t.stringLiteral(String(value))
        )
      )
    );
    const newStyleAttr = t.jsxAttribute(
      t.jsxIdentifier('style'),
      t.jsxExpressionContainer(styleObject)
    );
    openingElement.attributes.push(newStyleAttr);
  }
}

function updateObjectExpression(node: t.ObjectExpression, updates: Record<string, any>) {
  const existingProps = new Map<string, t.ObjectProperty>();

  node.properties.forEach((prop) => {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      existingProps.set(prop.key.name, prop);
    }
  });

  // 업데이트 적용
  Object.entries(updates).forEach(([key, value]) => {
    if (existingProps.has(key)) {
      const prop = existingProps.get(key)!;
      prop.value = typeof value === 'string' ? t.stringLiteral(value) : t.stringLiteral(String(value));
    } else {
      node.properties.push(
        t.objectProperty(
          t.identifier(key),
          typeof value === 'string' ? t.stringLiteral(value) : t.stringLiteral(String(value))
        )
      );
    }
  });
}

/**
 * 기존 React 컴포넌트 코드에 새로운 JSX 요소를 추가
 */
export function addElementToCode(code: string, jsxElementString: string): string {
  try {
    const ast = recast.parse(code, {
      parser: {
        parse: (source: string) =>
          parser.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
          }),
      },
    });

    // JSX 요소 문자열을 파싱
    const elementAst = recast.parse(jsxElementString, {
      parser: {
        parse: (source: string) =>
          parser.parse(source, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties'],
          }),
      },
    });

    let added = false;
    traverse(ast, {
      // 함수 컴포넌트의 return 문 찾기
      ReturnStatement(path) {
        if (added) return;
        
        const returnArg = path.node.argument;
        
        // 새 요소 추출 (Temp 함수의 return에서)
        let newElement: t.JSXElement | null = null;
        if (elementAst.program.body.length > 0) {
          const tempFunction = elementAst.program.body[0];
          if (t.isFunctionDeclaration(tempFunction) && tempFunction.body) {
            const returnStmt = tempFunction.body.body.find(stmt => t.isReturnStatement(stmt));
            if (t.isReturnStatement(returnStmt) && returnStmt.argument) {
              if (t.isJSXElement(returnStmt.argument)) {
                newElement = returnStmt.argument;
              } else if (t.isJSXFragment(returnStmt.argument) && returnStmt.argument.children.length > 0) {
                const firstChild = returnStmt.argument.children[0];
                if (t.isJSXElement(firstChild)) {
                  newElement = firstChild;
                }
              }
            }
          }
        }
        
        if (!newElement) return;
        
        if (t.isJSXElement(returnArg)) {
          // JSX Fragment (<>) 찾기
          if (
            t.isJSXIdentifier(returnArg.openingElement.name) &&
            returnArg.openingElement.name.name === 'Fragment'
          ) {
            // Fragment의 children에 추가
            returnArg.children.push(t.jsxText('\n'));
            returnArg.children.push(newElement);
            returnArg.children.push(t.jsxText('\n'));
            added = true;
          } else {
            // 단일 JSX 요소인 경우, Fragment로 감싸고 추가
            const fragment = t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier('Fragment'), []),
              t.jsxClosingElement(t.jsxIdentifier('Fragment')),
              [
                t.jsxText('\n'),
                returnArg,
                t.jsxText('\n'),
                newElement,
                t.jsxText('\n'),
              ]
            );
            path.node.argument = fragment;
            added = true;
          }
        } else if (t.isJSXFragment(returnArg)) {
          // 이미 Fragment인 경우
          returnArg.children.push(t.jsxText('\n'));
          returnArg.children.push(newElement);
          returnArg.children.push(t.jsxText('\n'));
          added = true;
        }
      },
    });

    // Fragment import 추가 (필요한 경우)
    if (added) {
      let hasReactImport = false;
      let hasFragmentImport = false;
      
      traverse(ast, {
        ImportDeclaration(path) {
          if (t.isStringLiteral(path.node.source) && path.node.source.value === 'react') {
            hasReactImport = true;
            // Fragment가 이미 import되어 있는지 확인
            path.node.specifiers.forEach((spec) => {
              if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === 'Fragment') {
                hasFragmentImport = true;
              }
            });
            
            // Fragment import가 없으면 추가
            if (!hasFragmentImport) {
              path.node.specifiers.push(
                t.importSpecifier(t.identifier('Fragment'), t.identifier('Fragment'))
              );
            }
          }
        },
      });

      // React import가 없으면 추가
      if (!hasReactImport) {
        const program = ast.program;
        program.body.unshift(
          t.importDeclaration(
            [
              t.importDefaultSpecifier(t.identifier('React')),
              t.importSpecifier(t.identifier('Fragment'), t.identifier('Fragment')),
            ],
            t.stringLiteral('react')
          )
        );
      }
    }

    return recast.print(ast).code;
  } catch (error) {
    console.error('요소 추가 실패:', error);
    return code;
  }
}

