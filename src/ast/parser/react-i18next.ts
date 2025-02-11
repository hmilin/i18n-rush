import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { isContainChinese } from '@/utils';
import traverse from '@babel/traverse';
import { isFunctionExpression } from 'typescript';

let hookUsed = false;
let componentUsed = false;

let hookWillBeCalled = false;

export const ReactI18nextTransformer = {
  enter(path: NodePath) {
    // 在组件中使用
    // import { useTranslation } from 'react-i18next'
    // t('xxx')
    // 在外层使用
    // import { Translation } from 'react-i18next'
    // <Translation>{(t) => t('xxx')}</Translation>
    if (!path.parent) {
      hookUsed = false;
      componentUsed = false;
    }

    const inReactComponent = isInReactComponent(path);

    if (t.isJSXText(path.node) && isContainChinese(path.node.value)) {
      if (inReactComponent) {
        const i18nCallExpression = t.callExpression(t.identifier('t'), [
          t.stringLiteral(
            // 替换掉前后换行符
            path.node.value.replace(/(^[\s]*)|([\s]*$)/g, ''),
          ),
        ]);
        path.replaceWith(t.jsxExpressionContainer(i18nCallExpression));
        hookUsed = true;
        hookWillBeCalled = true;
      } else {
        const translationJSXElement = t.jsxElement(
          t.jsxOpeningElement(t.jsxIdentifier('Translation'), [], false),
          t.jsxClosingElement(t.jsxIdentifier('Translation')),
          [
            t.jsxExpressionContainer(
              t.arrowFunctionExpression(
                [t.identifier('t')],
                t.callExpression(t.identifier('t'), [
                  t.stringLiteral(path.node.value.replace(/(^[\s]*)|([\s]*$)/g, '')),
                ]),
              ),
            ),
          ],
          false,
        );
        path.replaceWith(translationJSXElement);
        componentUsed = true;
      }

      path.skip();
    }

    if (t.isStringLiteral(path.node)) {
      if (
        t.isCallExpression(path.parent) &&
        t.isIdentifier(path.parent.callee) &&
        path.parent.callee.name === 't'
      ) {
        return path.skip();
      }
      if (isContainChinese(path.node.value)) {
        let i18nCallExpression: t.CallExpression | t.JSXElement;
        if (inReactComponent) {
          i18nCallExpression = t.callExpression(t.identifier('t'), [
            t.stringLiteral(path.node.value),
          ]);
          hookUsed = true;
        } else {
          i18nCallExpression = t.jsxElement(
            t.jsxOpeningElement(t.jsxIdentifier('Translation'), [], false),
            t.jsxClosingElement(t.jsxIdentifier('Translation')),
            [
              t.jsxExpressionContainer(
                t.arrowFunctionExpression(
                  [t.identifier('t')],
                  t.callExpression(t.identifier('t'), [
                    t.stringLiteral(path.node.value.replace(/(^[\s]*)|([\s]*$)/g, '')),
                  ]),
                ),
              ),
            ],
            false,
          );
          componentUsed = true;
        }

        // <Com attr="xxx" />
        if (t.isJSXAttribute(path.parent)) {
          path.replaceWith(t.jsxExpressionContainer(i18nCallExpression));
        } else {
          path.replaceWith(i18nCallExpression);
        }
        path.skip();
      }
    }
  },
  exit(path: NodePath) {
    if (t.isProgram(path.node) && (hookUsed || componentUsed)) {
      const program = path.node;
      if (program) {
        [
          {
            flag: hookUsed,
            specifier: 'useTranslation',
          },
          {
            flag: componentUsed,
            specifier: 'Translation',
          },
        ].forEach(({ flag, specifier }) => {
          const hasImport = hasImportSpecifier(program, specifier);
          if (flag && !hasImport) {
            const importDeclaration = t.importDeclaration(
              [t.importSpecifier(t.identifier(specifier), t.identifier(specifier))],
              t.stringLiteral('react-i18next'),
            );
            program.body.unshift(importDeclaration);
          }
        });
      }
      hookUsed = false;
      componentUsed = false;
      path.skip();
    }

    if (isReactComponent(path) && hookWillBeCalled) {
      let node = path.node
      if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
        node = node.declaration;
      }
      // 在render函数里插入useTranslation调用
      const unshiftInRender = (
        functionNode: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
      ) => {
        const hookCallExpression = t.variableDeclaration('const', [
          t.variableDeclarator(
            t.identifier('t'),
            t.callExpression(t.identifier('useTranslation'), []),
          ),
        ]);
        if (t.isArrowFunctionExpression(functionNode)) {
          // const a = () => {}
          if (t.isBlockStatement(functionNode.body)) {
            functionNode.body.body.unshift(hookCallExpression);
          } // const a = () => ()
          else {
            functionNode.body = t.blockStatement([
              hookCallExpression,
              t.returnStatement(functionNode.body),
            ]);
          }
        } else if (t.isFunctionDeclaration(functionNode) || t.isFunctionExpression(functionNode)) {
          functionNode.body.body.unshift(hookCallExpression);
        }
      };

      if (
        t.isFunctionDeclaration(node) ||
        t.isArrowFunctionExpression(node) ||
        t.isFunctionExpression(node)
      ) {
        unshiftInRender(node);
      } else if (t.isClassDeclaration(node)) {
        const renderMethod = node.body.body.find(
          child => t.isClassMethod(child) && t.isIdentifier(child.key, { name: 'render' }),
        );
        if (renderMethod && t.isBlockStatement(renderMethod.body)) {
          unshiftInRender(renderMethod.body);
        }
      }
      hookWillBeCalled = false;
    }
  },
};

function hasImportSpecifier(program: t.Program, specifierName: string) {
  return program.body.some(
    node =>
      t.isImportDeclaration(node) &&
      node.source.value === 'react-i18next' &&
      node.specifiers.some(
        specifier => t.isImportSpecifier(specifier) && specifier.imported.name === specifierName,
      ),
  );
}

function isInReactComponent(path: NodePath) {
  return path.findParent(p => isReactComponent(p));
}

function isReactComponent(path: NodePath) {
  let node = path.node;
  if (t.isExportNamedDeclaration(node) || t.isExportDefaultDeclaration(node)) {
    node = node.declaration;
  }
  if (
    t.isFunctionDeclaration(node) ||
    t.isFunctionExpression(node) ||
    t.isArrowFunctionExpression(node)
  ) {
    // 被react组件包裹在内
    if (path.findParent(p => isReactComponent(p))) {
      return false;
    }
  }

  return isFunctionComponent(node) || isClassComponent(node);
}

function isFunctionComponent(node: NodePath['node']) {
  if (
    t.isFunctionDeclaration(node) ||
    t.isFunctionExpression(node) ||
    t.isArrowFunctionExpression(node)
  ) {
    if (t.isArrowFunctionExpression(node)) {
      // const a = () => {}
      if (t.isBlockStatement(node.body)) {
        const returnStatement = node.body.body.find(child => t.isReturnStatement(child))?.argument;
        return returnStatement && isReactComReturn(returnStatement);
      } // const a = () => ()
      else {
        return isReactComReturn(node.body);
      }
    } else {
      const returnStatement = node.body.body.find(child => t.isReturnStatement(child))?.argument;
      return returnStatement && isReactComReturn(returnStatement);
    }
  }
  return false;
}

function isReactComReturn(node: NodePath['node']) {
  if (t.isJSXElement(node)) {
    return true;
  }
  if (t.isCallExpression(node)) {
    if (
      t.isMemberExpression(node.callee) &&
      t.isIdentifier(node.callee.object, { name: 'React' }) &&
      t.isIdentifier(node.callee.property, { name: 'createElement' })
    ) {
      return true;
    }
    return false;
  }
}

function isClassComponent(node: NodePath['node']) {
  return (
    t.isClassDeclaration(node) &&
    node.superClass &&
    (t.isIdentifier(node.superClass, { name: 'Component' }) ||
      t.isIdentifier(node.superClass, { name: 'PureComponent' }) ||
      (t.isMemberExpression(node.superClass) &&
        t.isIdentifier(node.superClass.object, { name: 'React' }) &&
        (t.isIdentifier(node.superClass.property, { name: 'Component' }) ||
          t.isIdentifier(node.superClass.property, { name: 'PureComponent' }))))
  );
}
