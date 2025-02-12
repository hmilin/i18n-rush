import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
import traverseTemplate from '../angular/traverseTemplate';
import { injectNgI18nKeyInTemplate } from './ng-i18n';
import generate from '@babel/generator';
import { revertNgTemplate } from '../angular/revertNgTemplate';
import parseAngularTemplate from '../angular/parseNgTemplate';
import { isExportDeclaration } from '@babel/types';
import { isExportNamedDeclaration } from '@babel/types';
import { isClassDeclaration } from '@babel/types';
import traverseNgTS from '../angular/traverseNgTS';

/**
 * 解析代码为 AST，遍历处理后重新生成代码
 * @param content 源代码内容
 * @param visitors 访问者对象，key 为节点类型，value 为处理函数
 * @param state 可选的状态对象，会传递给每个访问者函数
 * @returns 处理后的代码
 */
export function parseAndTransform(filename: string, content: string, visitorObj: any): string {
  try {
    if (filename.endsWith('.component.html')) {
      const ast = parseAngularTemplate(content, filename);

      traverseTemplate(ast, visitorObj.enter);

      // 将 AST 转回代码
      return revertNgTemplate(ast.rootNodes);
    }

    if (filename.endsWith('.component.ts')) {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          // 'decorators',
          'decoratorAutoAccessors',
          'decorators-legacy',
          'doExpressions',
          'exportDefaultFrom',
          'functionBind',
          'importAssertions',
          'regexpUnicodeSets',
        ],
      });

      traverseNgTS(ast, visitorObj);
      return generate(ast, {
        retainLines: true,
        jsescOption: {
          // 避免中文字符被转为unicode
          minimal: true,
        },
      }).code;
    }

    // 其他ts或js文件
    if (/[jt]sx?$/.test(filename)) {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators',
          'decoratorAutoAccessors',
          'doExpressions',
          'exportDefaultFrom',
          'functionBind',
          'importAssertions',
          'regexpUnicodeSets',
        ],
      });
      traverse(ast, visitorObj);
      return generate(ast, {
        retainLines: true,
        jsescOption: {
          // 避免中文字符被转为unicode
          minimal: true,
        },
      }).code;
    }
  } catch (e) {
    console.error(`transform file:${filename}  failed ===> error:`, e);
  }

  return content;
}
