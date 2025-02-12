import { ExtractOptions } from 'src/types';
import path from 'node:path';
import { getAllFiles } from '@/utils';
import * as i18nextScanner from 'i18next-scanner';
import { readFileSync, writeFileSync } from 'node:fs';

export async function extract({
  path: sourcePath,
  output,
  framework,
  library,
  language = 'zh',
  ...oth
}: ExtractOptions) {
  if (framework === 'angular') {
    console.log('please use ng extract-i18n');
  }
  if (library?.includes('i18next')) {
    const outputFile = path.resolve(output);
    extractI18next(sourcePath, `${outputFile}/${language}.json`);
  }
}

async function extractI18next(sourcePath: string, output: string) {
  const parser = new i18nextScanner.Parser();
  const files = await getAllFiles(path.resolve(sourcePath), ['.ts', '.tsx', '.js', '.jsx']);

  const translationJSON = {};

  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    parser.parseFuncFromString(
      code,
      {
        list: ['i18next.t', 'i18n.t', 't'],
      },
      function (key: string) {
        parser.set(key, key);
      },
    );

    const codeGen = parser.get();
    Object.assign(translationJSON, codeGen.en.translation);
  }

  writeFileSync(output, JSON.stringify(translationJSON, null, 2));
}
