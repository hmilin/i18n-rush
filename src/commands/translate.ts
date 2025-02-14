import { TranslateOptions } from '@/types';
import { TranslationPipeline } from '@huggingface/transformers';
import { pipeline } from '@huggingface/transformers';
import { lstat, readFileSync, writeFileSync } from 'node:fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch from 'node-fetch';
import { xliff12ToJs, jsToXliff12, xliff2js, js2xliff } from 'xliff';
import path from 'node:path';

export async function translate({
  source,
  target,
  sourceLanguage,
  targetLanguage,
  format = 'json',
  model = 'Xenova/opus-mt-zh-en',
  proxy,
}: TranslateOptions) {
  if (proxy) {
    const agent = new HttpsProxyAgent(proxy);
    global.fetch = async (req, option = {}) => {
      return await nodeFetch(req, { ...option, agent });
    };
  }

  const code = await readFileSync(path.resolve(source), 'utf-8');
  // 识别xlf和json，提取出源文本
  if (format === 'xlf' || format === 'xlf2') {
    const xlfToJs = format === 'xlf' ? xliff12ToJs : xliff2js;
    const jsToXlf = format === 'xlf' ? jsToXliff12 : js2xliff;
    xlfToJs(code, async (err, res) => {
      if (err) {
        console.error('Error parsing XLIFF:', err);
        return;
      }
      const { resources } = res;
      if (resources) {
        for (const ns in resources) {
          for (const unitId in resources[ns]) {
            const source = resources[ns][unitId].source;
            if (typeof source === 'string') {
              resources[ns][unitId].target = await translateSingleText(source, model);
            }
            if (Array.isArray(source)) {
              resources[ns][unitId].target = resources[ns][unitId].source.map(async item => {
                if (typeof item === 'string') {
                  return await translateSingleText(item, model);
                }
                return item;
              });
            }
          }
        }
      }
      res.targetLanguage = targetLanguage;
      jsToXlf(res, (err, targetCode) => {
        if (err) {
          console.error('Error generate XLIFF:', err);
          return;
        }
        writeFileSync(path.resolve(target), targetCode, 'utf-8');
      });
    });
  } else if (format === 'json') {
    const translationJson = JSON.parse(code);
    await traverseJSONText(translationJson, async text => await translateSingleText(text, model));
    writeFileSync(path.resolve(target), JSON.stringify(translationJson, null, 2), 'utf-8');
  }
}

async function traverseJSONText(
  json: Record<string, any>,
  transform: (v: string) => Promise<string> | string,
) {
  const keys = Object.keys(json);
  for (const key of keys) {
    if (Object.prototype.toString.call(json[key]) === '[object Object]') {
      json[key] = await traverseJSONText(json[key], transform);
    } else if (typeof json[key] === 'string') {
      json[key] = await transform(json[key]);
    }
  }

  return json;
}

// 创建翻译管道
async function createTranslationPipeline(model: string) {
  const translate = await pipeline('translation', model);
  return translate;
}
class Translation {
  private static instance: TranslationPipeline;

  private constructor() {}

  public static async getInstance(model: string) {
    if (!Translation.instance) {
      Translation.instance = await createTranslationPipeline(model);
    }
    return Translation.instance;
  }
}

async function translateSingleText(text: string, model: string) {
  const translate = await Translation.getInstance(model);
  try {
    const res = await translate(text);
    const translationText = res[0].translation_text as string;
    console.log(`translate successful, word: ${text}, result ===> `, translationText);
    return translationText;
  } catch (e) {
    console.error(`translate failed, word: ${text}, error ===> `, e);
  }
  return text;
}
