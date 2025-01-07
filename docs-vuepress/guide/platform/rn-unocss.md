## 使用原子类

Mpx 使用 unocss 作为原子类引擎，使得在使用 mpx 开发跨端项目也可以使用原子类。如果要在你的项目当中集成原子类的能力，具体操作请参照接入文档。

受限于 RN 平台的样式规则能力限制，绝大部分的 unocss 提供的原子类并不能在跨 RN 项目当中使用，以下是目前所支持的原子类：

> 对于不支持的原子类，在项目编译构建阶段会将不支持的原子类以 error 形式提示，且最终的编译产物当中不会产出对应的原子类结果

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

* Screen Variants

Mobile First

| Varaint          | 规则 | 备注 |
| :------------- | :------: | :---: |
| sm   |    @media (min-width: 640px)    |      |
| md   |    @media (min-width: 768px)    |      |
| lg   |    @media (min-width: 1024px)    |      |
| xl   |    @media (min-width: 1280px)    |      |
| 2xl  |    @media (min-width: 1536px)    |      |

Desktop First

| Varaint          | 规则 | 备注 |
| :------------- | :------: | :---: |
| <sm   |    @media (max-width: 640px)    |      |
| <md   |    @media (max-width: 768px)    |      |
| <lg   |    @media (max-width: 1024px)    |      |
| <xl   |    @media (max-width: 1280px)    |      |
| <2xl  |    @media (max-width: 1536px)    |      |

Only Screen

| Varaint          | 规则 | 备注 |
| :------------- | :------: | :---: |
| @sm   |   @media (min-width: 640px) and (max-width: 768px)    |      |
| @md   |   @media (min-width: 768px) and (max-width: 1024px)    |      |
| @lg   |   @media (min-width: 1024px) and (max-width: 1280px)    |      |
| @xl   |   @media (min-width: 1280px) and (max-width: 1536px)    |      |
| @2xl  |   @media (min-width: 1536px)    |      |

* Pseudo Elements

目前仅支持 `hover`

* Theme Variants
  
| Varaint          | 规则 | 备注 |
| :------------- | :------: | :---: |
| dark   |   暗色模式    |      |
| light   |   亮色模式    |      |

* Orientation Variants

| Varaint          | 规则 | 备注 |
| :------------- | :------: | :---: |
| portrait   |   竖屏    |      |
| landscape   |   横屏    |      |

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

#### [Gradients](https://windicss.org/utilities/backgrounds/gradients.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Gradient Direction   |    是    |      |
| Gradient From    |    是    |      |
| Gradient Via     |    是    |      |
| Gradient To     |    是    |      |

#### [Background Blend Mode](https://windicss.org/utilities/backgrounds/background-blend-mode.html)

不支持

#### [Box Decoration Break](https://windicss.org/utilities/behaviors/box-decoration-break.html)

不支持

#### [Image Rendering](https://windicss.org/utilities/behaviors/image-rendering.html)

不支持

#### [Listing](https://windicss.org/utilities/behaviors/listings.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| List style type   |    否    |      |
| List style position    |    否    |      |
| List style image    |    否    |      |

#### [Overflow](https://windicss.org/utilities/behaviors/overflow.html)

仅支持 `hidden`、`scroll`、`visible` 属性值

#### [Overflow Behavior](https://windicss.org/utilities/behaviors/overscroll-behavior.html)

不支持

#### [Placeholder](https://windicss.org/utilities/behaviors/placeholder.html)

不支持

#### [Border](https://windicss.org/utilities/borders/border.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Border radius   |    是    |  不支持 border-inline-start、border-inline-end、border-block-start、border-block-end 属性，其他都支持    |
| Border width    |    是    |      |
| Border color     |    是    |      |
| Border opacity     |    是    |      |
| Border style     |    是    |  不支持 double 样式，其他都支持   |

#### [Divider](https://windicss.org/utilities/borders/divider.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Divider width   |    否    |     |
| Divider color    |    否    |      |
| Divider opacity    |    否    |      |
| Divider style   |    否    |      |

#### [Outline](https://windicss.org/utilities/borders/outline.html)

| 规则          | 是否支持 | 备注 |
| :------------- | :------: | :---: |
| Outline solid   |    否    |     |
| Outline dotted    |    否    |      |

#### [Ring](https://windicss.org/utilities/borders/ring.html)

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


#### [Filter](https://windicss.org/utilities/filters/filter.html)

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

#### [Backdrop Filter](https://windicss.org/utilities/filters/backdrop-filter.html)

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