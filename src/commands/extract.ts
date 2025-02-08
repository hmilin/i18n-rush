import { exec, spawn } from 'node:child_process';
import { ExtractOptions } from 'src/types';
import path from 'node:path';

export async function extract({
  path: sourcePath,
  output,
  framework,
  library,
  ...oth
}: ExtractOptions) {
  if (framework === 'angular') {
    console.log('please use ng extract-i18n');
  }
  if(framework === 'react') {
    
  }
}
