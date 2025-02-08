import { readdir } from 'fs/promises';
import { join, extname } from 'path';

/**
 * 遍历目录获取所有指定后缀的文件路径
 * @param dir 要遍历的目录路径
 * @param extensions 文件后缀数组 (例如: ['.ts', '.tsx'])
 * @returns 符合条件的文件路径数组
 */
export async function getAllFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // 递归遍历子目录
        await traverse(fullPath);
      } else if (entry.isFile()) {
        // 检查文件后缀是否匹配=
        if (extensions.some(extension => entry.name.endsWith(extension))) {
          files.push(fullPath);
        }
      }
    }
  }

  await traverse(dir);
  return files;
}

export const isContainChinese = (text = '') => /[\u4e00-\u9fa5]/.test(text);
