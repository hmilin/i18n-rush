import { readFileSync, writeFileSync } from 'node:fs';
import {
  injectNgI18nKeyInTemplate,
  injectNgI18nKeyInTS,
  NgI18nTemplateTransformer,
  NgI18nTSTransformer,
} from '../ast/ng-i18n';
import { parseAndTransform } from '../ast/parse';
import type { InjectOptions } from '../types';
import { getAllFiles } from '../utils';
import { resolveConfig, format, resolveConfigFile } from 'prettier';
import { I18nextTransformer } from 'src/ast/i18next';

const rules = [
  {
    extentions: ['.component.html'],
    framework: 'angular',
    library: 'ng-i18n',
    transformer: NgI18nTemplateTransformer,
    prettierParser: 'angular',
  },
  {
    extentions: ['.component.ts'],
    framework: 'angular',
    library: 'ng-i18n',
    transformer: NgI18nTSTransformer,
    prettierParser: 'typescript',
  },
  {
    extentions: ['.tsx', '.jsx', '.ts', '.js'],
    framework: 'react',
    library: 'i18next',
    transformer: I18nextTransformer,
  },
  {
    extentions: ['.tsx', '.jsx', '.ts', '.js'],
    framework: 'react',
    library: 'react-i18next',
  },
];

function getMatchingRules({ framework, library }: Pick<InjectOptions, 'framework' | 'library'>) {
  return rules.filter(rule => framework === rule.framework && library === rule.library);
}

export async function injectCode(
  {
    code,
    fileName,
    framework,
    library,
    prettier: prettierEnabled,
    prettierConfig: prettierConfigPath,
  }: { code: string; fileName: string } & Omit<InjectOptions, 'path'>,
  currentRules?: typeof rules,
) {
  currentRules = currentRules || getMatchingRules({ framework, library });

  let newContent: string;

  for (const rule of currentRules) {
    if (!rule.extentions.some(extention => fileName.endsWith(extention))) continue;
    newContent = parseAndTransform(fileName, code, rule.transformer);

    if (newContent) {
      if (prettierEnabled) {
        const configPath = await resolveConfigFile(prettierConfigPath);
        const prettierConfig = await resolveConfig(configPath, {
          useCache: false,
          editorconfig: false,
        });
        try {
          newContent = await format(newContent, {
            ...prettierConfig,
            filepath: fileName,
            parser: rule.prettierParser,
          });
        } catch (e) {
          console.warn(`${fileName} was formateted failed`, e);
        }
      }
      break;
    }
  }
  return newContent;
}

export async function inject({ path, framework, library, ...options }: InjectOptions) {
  const currentRules = getMatchingRules({ framework, library });

  for (const rule of currentRules) {
    // 遍历所有文件
    const files = await getAllFiles(path, rule.extentions);
    // 转为ast树
    for (const file of files) {
      const code = readFileSync(file, 'utf-8');

      const newContent = await injectCode(
        { code, fileName: file, framework, library, ...options },
        currentRules,
      );

      if (newContent) {
        writeFileSync(file, newContent, 'utf-8');
      }
    }
  }
}
