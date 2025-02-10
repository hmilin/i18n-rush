import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { isContainChinese } from '@/utils';

let injected = false;

export const I18nextTransformer = {
  enter(path: NodePath) {
    // import { t } from 'i18next'
    // t('xxx')
    if (!path.parent) injected = false;

    if (t.isJSXText(path.node) && isContainChinese(path.node.value)) {
      const i18nCallExpression = t.callExpression(t.identifier('t'), [
        t.stringLiteral(
          // 替换掉前后换行符
          path.node.value.replace(/(^[\s]*)|([\s]*$)/g, ''),
        ),
      ]);
      path.replaceWith(t.jsxExpressionContainer(i18nCallExpression));
      path.skip();
      injected = true;
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
        const i18nCallExpression = t.callExpression(t.identifier('t'), [
          t.stringLiteral(path.node.value),
        ]);

        if (t.isJSXAttribute(path.parent)) {
          path.replaceWith(t.jsxExpressionContainer(i18nCallExpression));
        } else {
          path.replaceWith(i18nCallExpression);
        }
        path.skip();
        injected = true;
      }
    }
  },
  exit(path: NodePath) {
    if (t.isProgram(path.node) && injected) {
      const program = path.node;
      if (program) {
        const hasImport = program.body.some(
          node =>
            t.isImportDeclaration(node) &&
            node.source.value === 'i18next' &&
            node.specifiers.some(
              specifier => t.isImportSpecifier(specifier) && specifier.imported.name === 't',
            ),
        );

        if (!hasImport) {
          const importDeclaration = t.importDeclaration(
            [t.importSpecifier(t.identifier('t'), t.identifier('t'))],
            t.stringLiteral('i18next'),
          );
          program.body.unshift(importDeclaration);
        }
      }
      injected = false;
      path.skip();
    }
  },
};
