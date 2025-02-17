import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import parseAngularTemplate from './parseNgTemplate';
import traverseTemplate from './traverseTemplate';
import { injectNgI18nKeyInTemplate } from '../parser/ng-i18n';
import { revertNgTemplate } from './revertNgTemplate';
import { VisitorObject } from '../../types';

type AST = ReturnType<typeof parse>;
export default function traverseNgTS(ast: AST, visitorObj: VisitorObject) {
  traverse(ast, {
    ...visitorObj,
    Decorator: path => {
      // 处理@Component装饰器中的template
      if (path.node.expression.callee.name === 'Component') {
        path.traverse({
          ObjectProperty: subPath => {
            if (subPath.node.key.name === 'template') {
              const template =
                subPath.node.value.type === 'TemplateLiteral'
                  ? subPath.node.value.quasis?.[0]?.value.raw
                  : subPath.node.value.type === 'StringLiteral'
                    ? subPath.node.value.value
                    : null;

              if (template) {
                const ast = parseAngularTemplate(template, 'component.html');
                traverseTemplate(ast, injectNgI18nKeyInTemplate);
                const newTemplate = revertNgTemplate(ast.rootNodes);

                if (subPath.node.value.type === 'TemplateLiteral') {
                  subPath.node.value.quasis[0].value.raw = newTemplate;
                } else if (subPath.node.value.type === 'StringLiteral') {
                  subPath.node.value.value = newTemplate;
                  subPath.node.value.extra = {
                    raw: newTemplate,
                  };
                }
              }
            }
          },
        });
        path.skip();
      }
    },
  });
}
