import { Visitor } from '@babel/traverse';

export type InjectOptions = {
  path: string;
  framework: 'angular' | 'react';
  library: 'ng-i18n' | 'ngx-translate' | 'i18next' | 'react-i18n';
  /** @default true */
  prettier?: boolean;
  prettierConfig?: string;
};

export type VisitorFunction = Visitor;
