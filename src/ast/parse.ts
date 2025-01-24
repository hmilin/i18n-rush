import type { VisitorFunction } from '../types';
import traverse from '@babel/traverse';
import { parse } from '@babel/parser';
import traverseTemplate from './angular/traverseTemplate';
import { injectNgI18nKeyInTemplate } from './ng-i18n';
import generate from '@babel/generator';
import { revertNgTemplate } from './angular/revertNgTemplate';
import parseAngularTemplate from './angular/parseNgTemplate';
import { isExportDeclaration } from '@babel/types';
import { isExportNamedDeclaration } from '@babel/types';
import { isClassDeclaration } from '@babel/types';
import traverseNgTS from './angular/traverseNgTS';

/**
 * 解析代码为 AST，遍历处理后重新生成代码
 * @param content 源代码内容
 * @param visitors 访问者对象，key 为节点类型，value 为处理函数
 * @param state 可选的状态对象，会传递给每个访问者函数
 * @returns 处理后的代码
 */
export function parseAndTransform(filename: string, content: string, visitor: any): string {
  if (filename.endsWith('.component.html')) {
    const ast = parseAngularTemplate(content, filename);

    traverseTemplate(ast, visitor);

    // 将 AST 转回代码
    return revertNgTemplate(ast.rootNodes);
  }

  if (filename.endsWith('.component.ts')) {
    const ast = parse(content, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'decorators',
        'decoratorAutoAccessors',
        'doExpressions',
        'exportDefaultFrom',
        'functionBind',
        'importAssertions',
        'regexpUnicodeSets',
      ],
    });

    traverseNgTS(ast, visitor);
    return generate(ast, {
      jsescOption: {
        // 避免中文字符被转为unicode
        minimal: true,
      },
    }).code;
  }

  // const ast = parse(content, {
  //   sourceType: 'module',
  //   plugins: ['decorators'],
  // });
  // traverse(ast, visitors);
  // 将 AST 转回代码
  // return generate(ast);
}
