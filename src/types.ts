import { Node, VisitNodeFunction } from '@babel/traverse';

export type InjectOptions = {
  path: string;
  framework: 'angular' | 'react';
  library: 'ng-i18n' | 'i18next' | 'react-i18n';
  /** @default true */
  prettier?: boolean;
  prettierConfig?: string;
};

export type ExtractOptions = {
  path: string;
  /** 输出目录 */
  output: string;
  framework: 'angular' | 'react';
  library: 'ng-i18n' | 'i18next' | 'react-i18n';
  /** @default 'zh' */
  language?: string;
};

export type TranslateOptions = {
  source: string;
  target: string;
  /** @default 'zh-CN' */
  sourceLanguage?: string;
  /** @default 'en'  */
  targetLanguage?: string;
  /** @default 'json' */
  format?: 'xlf' | 'xlf2' | 'json';
  model?: string;
  proxy?: string;
};

export type VisitorObject = {
  enter: VisitNodeFunction<Node, Node>;
  exit: VisitNodeFunction<Node, Node>;
};
