import * as t from '@babel/types';

import { NodePath } from '@babel/traverse';
import { isTaggedTemplateExpression } from '@babel/types';
import { isTSLiteralType } from '@babel/types';
import { Text, Element, Attribute, Node } from '@angular/compiler';
import { isContainChinese } from '../utils';

const extractAttrKey = (text = '') => /[\w-_]+/.exec(text)?.[0];

export const injectNgI18nKeyInTemplate = (node: Node) => {
  if (node instanceof Text && isContainChinese(node.value)) {
    const parent = node.parent;
    if (parent && parent instanceof Element) {
      if (!parent.attrs) {
        parent.attrs = [];
      }

      const i18nAttr = parent.attrs.find((attr: any) => attr.name === 'i18n');
      if (!i18nAttr) {
        parent.attrs.push(
          new Attribute('i18n', undefined, undefined, undefined, undefined, undefined, undefined),
        );
      }
    }
  } else if (node instanceof Element) {
    // attr value 含中文
    const arrtLen = node.attrs.length;
    for (let i = 0; i < arrtLen; i++) {
      const value = node.attrs[i].value;
      if (isContainChinese(value)) {
        const attrName = extractAttrKey(node.attrs[i].name);
        const i18nKey = `i18n-${attrName}`;
        if (!node.attrs.find(({ name }) => name === i18nKey)) {
          node.attrs.push(
            new Attribute(
              i18nKey,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
            ),
          );
        }
      }
    }

    if (node.children.length > 1) {
      // 给孤立的Text节点加ng-container，防止出现嵌套的i18n关键字
      node.children = node.children.map(child => {
        if (child instanceof Text && isContainChinese(child.value)) {
          return new Element('ng-container', [], [child], undefined, undefined);
        }
        return child;
      });
    }
  }
};

export const NgI18nTemplateTransformer = {
  enter: injectNgI18nKeyInTemplate,
};

export const injectNgI18nKeyInTS = (path: NodePath) => {
  if (isTSLiteralType(path.parent)) {
    return;
  }
  try {
    if (t.isStringLiteral(path.node)) {
      if (isContainChinese(path.node.value!)) {
        path.replaceWith(createTaggedTemplateExpression('$localize', path.node.value));
      }
      path.skip();
    } else if (t.isTemplateLiteral(path.node) && !isTaggedTemplateExpression(path.parent)) {
      if (path.node.quasis.some(quasi => isContainChinese(quasi.value.raw))) {
        path.replaceWith(createTaggedTemplateExpression('$localize', path.node));
      }
      path.skip();
    }
  } catch (e) {
    console.log('replace failed: ', path.node);
    debugger;
  }
};

function createTaggedTemplateExpression(tag: string, template: string | t.TemplateLiteral) {
  return t.taggedTemplateExpression(
    t.identifier(tag),
    typeof template === 'string'
      ? t.templateLiteral([t.templateElement({ raw: template })], [])
      : template,
  );
}

export const NgI18nTSTransformer = {
  enter: injectNgI18nKeyInTS,
};
