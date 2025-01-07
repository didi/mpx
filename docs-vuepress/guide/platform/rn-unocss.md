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

不支持

#### Image Rendering

不支持

#### Listing

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| List style type   |    否    |      |
| List style position    |    否    |      |
| List style image    |    否    |      |

#### Overflow

仅支持 `hidden`、`scroll`、`visible` 属性值

#### Overflow Behavior

不支持

#### Placeholder

不支持

#### Border

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Border radius   |    是    |  不支持 border-inline-start、border-inline-end、border-block-start、border-block-end 属性，其他都支持    |
| Border width    |    是    |      |
| Border color     |    是    |      |
| Border opacity     |    是    |      |
| Border style     |    是    |  不支持 double 样式，其他都支持   |

#### Divider

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Divider width   |    否    |     |
| Divider color    |    否    |      |
| Divider opacity    |    否    |      |
| Divider style   |    否    |      |

#### Outline

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Outline solid   |    否    |     |
| Outline dotted    |    否    |      |

#### Ring

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Ring width   |    否    |     |
| Ring color    |    否    |      |
| Ring opacity    |    否    |      |
| Ring offset width    |    否    |      |
| Ring offset color    |    否    |      |


#### [Box Shadow](https://windicss.org/utilities/effects/box-shadow.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Box shadow size   |    是    |     |
| Box shadow color    |    是    |      |

#### [Opacity](https://windicss.org/utilities/effects/opacity.html)

支持

#### [Mix Blend Mode](https://windicss.org/utilities/effects/mix-blend-mode.html)

不支持


#### Filter

RN 0.76 支持，且存在机型的兼容性问题，具体参见 [RN 官方文档](https://reactnative.dev/blog/2024/10/23/release-0.76-new-architecture#box-shadow-and-filter-style-props)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Filter blur   |    是    |      |
| Filter brightness     |    是    |      |
| Filter contrast     |    是    |      |
| Filter drop shadow     |    是    |      |
| Filter grayscale     |    是    |     |
| Filter hue rotate    |    是    |      |
| Filter invert     |    是    |      |
| Filter saturate     |    是    |      |
| Filter Sepia     |    是    |      |

#### Backdrop Filter

不支持

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Backdrop blur   |    否   |      |
| Backdrop brightness     |    否    |      |
| Backdrop contrast     |    否    |      |
| Backdrop drop shadow     |    否    |      |
| Backdrop grayscale     |    否    |     |
| Backdrop hue rotate    |    否    |      |
| Backdrop invert     |    否    |      |
| Backdrop saturate     |    否    |      |
| Backdrop Sepia     |    否    |      |