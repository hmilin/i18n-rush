import { Node, VisitNodeFunction } from '@babel/traverse';

export type InjectOptions = {
  path: string;
  framework: 'angular' | 'react';
  library: 'ng-i18n' | 'ngx-translate' | 'i18next' | 'react-i18n';
  /** @default true */
  prettier?: boolean;
  prettierConfig?: string;
};

export type ExtractOptions = {
  path: string;
  /** 输出目录 */
  output: string;
  framework: 'angular' | 'react';
  library: 'ng-i18n' | 'ngx-translate' | 'i18next' | 'react-i18n';
};

export type VisitorObject = {
  enter: VisitNodeFunction<Node, Node>;
  exit: VisitNodeFunction<Node, Node>;
};
