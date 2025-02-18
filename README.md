# I18nRush

帮助Angular、React项目快速实现国际化

支持的国际化库：

- [x] @angular/localize
- [x] i18next
- [x] react-i18next
- [ ] ngx-translate

功能点：

- 给使用中文文本的地方插入i18n key
- 提取出源翻译文件
- 调用翻译模型翻译并生成文件

流程图：

![流程图](public/i18n-rush-flow.jpg)

## 安装

```
npm install -g i18n-rush
i18n-rush -h
```

或直接使用npx

```
npx i18n-rush [options] [command]
```

## CLI

### inject i18n key

根据框架和i18n库插入对应关键字

```
i18n-rush inject --path ./src --framework react --library react-i18next
```

| 参数            | 描述                                                         | 默认值  |
| --------------- | ------------------------------------------------------------ | ------- |
| path            | 指定源代码路径                                               | ./src   |
| framework       | 指定项目框架，支持angular和react                             | angular |
| library         | 指定国际化库，支持ng-i18n(angular原生) i18next react-i18next | ng-i18n |
| prettier        | 使用prettier进行格式化                                       | true    |
| prettier-config | prettier配置文件路径                                         | -       |

### extract i18n

根据i18n key提取翻译文件

```
i18n-rush extract --path ./src --output ./src/locales --framework react --library react-i18next
```

| 参数      | 描述                                                         | 默认值        |
| --------- | ------------------------------------------------------------ | ------------- |
| path      | 指定源代码路径                                               | ./src         |
| output    | 指定翻译文件输出路径                                         | ./src/locales |
| framework | 指定项目框架，支持angular和react                             | angular       |
| library   | 指定国际化库，支持ng-i18n(angular原生) i18next react-i18next | ng-i18n       |

### translate

从`huggingface`下载翻译模型进行翻译，生成目标翻译文件

```
i18n-rush translate --source ./src/locales/zh.json --target ./locales/en.json --targetLanguage en --format json --proxy http://127.0.0.1:7897
```

| 参数           | 描述                                                                                                                                                   | 默认值               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| source         | 源文件                                                                                                                                                 | -                    |
| target         | 输出文件                                                                                                                                               | -                    |
| sourceLanguage | 翻译源语言                                                                                                                                             | zh                   |
| targetLanguage | 翻译目标语言，当格式为xlf时，会插入到目标文件中                                                                                                        | en                   |
| format         | 翻译文本格式， 支持xlf、xlf2、json                                                                                                                     | json                 |
| model          | 使用的翻译模型，从[huggingface translation models](https://huggingface.co/models?pipeline_tag=translation&library=transformers.js&sort=trending)中选择 | Xenova/opus-mt-zh-en |
