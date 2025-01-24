/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  getHtmlTagDefinition,
  Node,
  Attribute,
  Text,
  Visitor,
  Element,
  Comment,
  Expansion,
  ExpansionCase,
} from '@angular/compiler';

class _SerializerVisitor implements Visitor {
  visitElement(element: Element, context: any): any {
    if (getHtmlTagDefinition(element.name).isVoid) {
      return `<${element.name}${this._visitAll(element.attrs, ' ', ' ')}/>`;
    }

    return `<${element.name}${this._visitAll(element.attrs, ' ', ' ')}>${this._visitAll(
      element.children,
    )}</${element.name}>`;
  }

  visitAttribute(attribute: Attribute, context: any): any {
    return attribute.value !== undefined && attribute.value !== ''
      ? `${attribute.name}="${attribute.value}"`
      : attribute.name;
  }

  visitText(text: Text, context: any): any {
    return text.value;
  }

  visitComment(comment: Comment, context: any): any {
    return `<!--${comment.value}-->`;
  }

  visitExpansion(expansion: Expansion, context: any): any {
    return `{${expansion.switchValue}, ${expansion.type},${this._visitAll(expansion.cases)}}`;
  }

  visitExpansionCase(expansionCase: ExpansionCase, context: any): any {
    return ` ${expansionCase.value} {${this._visitAll(expansionCase.expression)}}`;
  }

  visitBlock(block: any, context: any) {
    const params =
      block.parameters.length === 0 ? ' ' : ` (${this._visitAll(block.parameters, ';', ' ')}) `;
    return `@${block.name}${params}{${this._visitAll(block.children)}}`;
  }

  visitBlockParameter(parameter: any, context: any) {
    return parameter.expression;
  }

  visitLetDeclaration(decl: any, context: any) {
    return `@let ${decl.name} = ${decl.value};`;
  }

  private _visitAll(nodes: Node[], separator = '', prefix = ''): string {
    return nodes.length > 0 ? prefix + nodes.map(a => a.visit(this, null)).join(separator) : '';
  }
}

const serializerVisitor = new _SerializerVisitor();

export function revertNgTemplate(nodes: Node[]): string {
  return nodes.map(node => node.visit(serializerVisitor, null)).join('');
}
