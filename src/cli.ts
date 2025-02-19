#!/usr/bin/env node

import { inject } from './commands/inject';
import { extract } from './commands/extract';
import { translate } from './commands/translate';
import { ExtractOptions, InjectOptions } from './types';

const { Command } = require('commander');
const program = new Command();

program
  .name('i18n-rush')
  .description('国际化升级工具 - 帮助 Angular、React 项目快速实现国际化')
  .version('1.0.0');

program
  .command('inject')
  .description('给使用中文文本的地方插入 i18n key')
  .requiredOption('-p, --path <path>', '指定源代码路径', './src')
  .option('-f, --framework <framework>', '指定项目类型 (angular|react)', 'angular')
  .option('-l, --library <library>', '指定使用的国际化库(ng-i18n|i18next|react-i18next)', 'ng-i18n')
  .option('-p, --prettier <boolean>', '是否使用prettier进行格式化', true)
  .option('--prettier-config <path>', 'prettier配置文件路径')
  .action(async (options: InjectOptions) => {
    try {
      await inject(options);
      console.log('执行成功');
    } catch (error) {
      console.error('注入失败:', error);
      process.exit(1);
    }
  });

program
  .command('extract')
  .description('根据 i18n key 提取翻译文件')
  .requiredOption('-p, --path <path>', '指定源代码路径', './src')
  .requiredOption('-o, --output <output>', '指定输出路径', './src/locales')
  .option('-f, --framework <framework>', '指定项目类型 (angular|react)', 'angular')
  .option('-l, --library <library>', '指定使用的国际化库(ng-i18n|i18next|react-i18n)', 'ng-i18n')
  .action(async (options: ExtractOptions) => {
    try {
      await extract(options);
      console.log('执行成功');
    } catch (error) {
      console.error('提取失败:', error);
      process.exit(1);
    }
  });

program
  .command('translate')
  .description('调用翻译服务或模型自动翻译')
  .requiredOption('-s, --source <source>', '源文件')
  .requiredOption('-t, --target <target>', '输出文件')
  .option('--sourceLanguage <source>', '源语言', 'zh')
  .option('--targetLanguage <target>', '目标语言', 'en')
  .option('-f, --format <format>', '格式 支持xlf、xlf2、json', 'json')
  .option('--proxy <proxyUrl>', '调用fetch接口时使用代理')
  .action(
    async (options: {
      source: string;
      target: string;
      path: string;
      engine: 'google' | 'openai';
    }) => {
      try {
        await translate(options);
        console.log('执行成功');
      } catch (error) {
        console.error('翻译失败:', error);
        process.exit(1);
      }
    },
  );

program.parse();
