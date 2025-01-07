## 使用原子类

Mpx 使用 unocss 作为原子类引擎，使得在使用 mpx 开发跨端项目也可以使用原子类。如果要在你的项目当中集成原子类的能力，具体操作请参照接入文档。

受限于 RN 平台的样式规则能力限制，绝大部分的 unocss 提供的原子类并不能在跨 RN 项目当中使用，以下是目前所支持的原子类：

> 对于不支持的原子类，在编译阶段会有 error 提示，且最终的编译产物当中不会产出对应的原子类结果

#### [Typography](https://windicss.org/utilities/general/typography.html#typography)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Font family   |    是    |      |
| Font size     |    是    |      |
| Font style | 是 |   |
| Font weight | 是 | | 
| Font Variant Numberic | 否 | |
| Hyphens | 否 | |
| Letter spacing | 是 | |
| Line height | 是 | |
| Tab size | 否 | |
| Text alignment | 是 | |
| Text color | 是 | |
| Text decoration | 是 | |
| Text decoration style | 是 | ios支持，安卓不支持 |
| Text decoration thickness | 否 | |
| Text underline offset | 否 | |
| Text decoration opacity | 是 | |
| Text indent | 否 | |
| Text opacity | 是 | |
| Text shadow | 是 | |
| Text stroke | 否 | |
| Text stroke color | 否 | |
| Text transform | 是 | |
| Vertical alignment | 是 | 安卓支持，ios不支持，且只支持 auto/top/bottom/center |
| White space | 否 | |
| Word break | 否 | |
| Write mode | 否 | |
| Writing orientation | 否 | |

#### Svg

不支持

#### Variants

#### Screen Readers

不支持

#### [Background](https://windicss.org/utilities/backgrounds/background.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Background attachment   |    否    |      |
| Background clip     |    否    |      |
| Background color     |    是    |      |
| Background opacity     |    是    |      |
| Background position     |    是    |  支持 left/right/top/bottom/center/数值    |
| Background repeat     |    是    |   仅支持 no-repeat   |
| Background size     |    是    |      |
| Background origin     |    否    |      |

#### Gradients

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Gradient Direction   |    是    |      |
| Gradient From    |    是    |      |
| Gradient Via     |    是    |      |
| Gradient To     |    是    |      |

#### Background Blend Mode

不支持

#### Box Decoration Break