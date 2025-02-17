# 国际化升级工具

帮助Angular、React项目快速实现国际化

支持的国际化库：

- [x] @angular/localize
- [x] i18next
- [x] react-i18next

功能点：

- 给使用中文文本的地方插入i18n key
- 提取出国际化文件
- 调用翻译模型自动翻译
- 复杂场景比如复数之类的 能识别出来吗？

## CLI


### inject i18n key

```
i18n-rush inject
```

### extract i18n

根据i18n key提取翻译文件，根据对应的国际化库使用现成工具即可

```
i18n-rush extract
```

### translate

从`huggingface`下载翻译模型进行翻译，生成目标翻译文件

```
i18n-rush translate
```

## 流程图


