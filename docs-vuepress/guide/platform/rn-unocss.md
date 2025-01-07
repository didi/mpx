## 使用原子类

Mpx 使用 unocss 作为原子类引擎，使得在使用 mpx 开发跨端项目也可以使用原子类。如果要在你的项目当中集成原子类的能力，具体操作请参照接入文档。

受限于 RN 平台的样式规则能力限制，绝大部分的 unocss 提供的原子类并不能在跨 RN 项目当中使用，以下是目前所支持的原子类：

> 对于不支持的原子类，在编译阶段会有 error 提示，且最终的编译产物当中不会产出对应的原子类结果

#### [Typography](https://windicss.org/utilities/general/typography.html#typography)

| 规则                      | 是否支持 |                         备注                          |
| :------------------------ | :------: | :---------------------------------------------------: |
| Font family               |    是    |                                                       |
| Font size                 |    是    |                                                       |
| Font style                |    是    |                                                       |
| Font weight               |    是    |                                                       |
| Font Variant Numberic     |    否    |                                                       |
| Hyphens                   |    否    |                                                       |
| Letter spacing            |    是    |                                                       |
| Line height               |    是    |                                                       |
| Tab size                  |    否    |                                                       |
| Text alignment            |    是    |                                                       |
| Text color                |    是    |                                                       |
| Text decoration           |    是    |                                                       |
| Text decoration style     |    是    |                 ios 支持，安卓不支持                  |
| Text decoration thickness |    否    |                                                       |
| Text underline offset     |    否    |                                                       |
| Text decoration opacity   |    是    |                                                       |
| Text indent               |    否    |                                                       |
| Text opacity              |    是    |                                                       |
| Text shadow               |    是    |                                                       |
| Text stroke               |    否    |                                                       |
| Text stroke color         |    否    |                                                       |
| Text transform            |    是    |                                                       |
| Vertical alignment        |    是    | 安卓支持，ios 不支持，且只支持 auto/top/bottom/center |
| White space               |    否    |                                                       |
| Word break                |    否    |                                                       |
| Write mode                |    否    |                                                       |
| Writing orientation       |    否    |                                                       |

#### Svg

不支持

#### Variants

#### Screen Readers

不支持

#### Animation

不支持

#### Transforms

| 规则                | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| Transform Type      |    是    |      |
| Transform Origin    |    是    |      |
| Transform Rotate    |    是    |      |
| Transform Scale     |    是    |      |
| Transform Skew      |    是    |      |
| Transform Translate |    是    |      |
| Perspective         |    是    |      |
| Perspective Origin  |    是    |      |

#### Transitions

不支持

#### [Background](https://windicss.org/utilities/backgrounds/background.html)

| 规则                  | 是否支持 |                  备注                  |
| :-------------------- | :------: | :------------------------------------: |
| Background attachment |    否    |                                        |
| Background clip       |    否    |                                        |
| Background color      |    是    |                                        |
| Background opacity    |    是    |                                        |
| Background position   |    是    | 支持 left/right/top/bottom/center/数值 |
| Background repeat     |    是    |            仅支持 no-repeat            |
| Background size       |    是    |                                        |
| Background origin     |    否    |                                        |

#### Gradients

| 规则               | 是否支持 | 备注 |
| :----------------- | :------: | :--: |
| Gradient Direction |    是    |      |
| Gradient From      |    是    |      |
| Gradient Via       |    是    |      |
| Gradient To        |    是    |      |

#### Background Blend Mode

不支持

#### Box Decoration Break

不支持

#### Image Rendering

不支持

#### Listings

| 规则                | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| List Style Type     |    否    |      |
| List Style Position |    否    |      |

#### Overflow

部分属性支持(overflow：hidden/scroll/visible)

#### Overscroll Behavior

不支持

#### Placeholder

不支持

#### Border

| 规则           | 是否支持 |              备注               |
| :------------- | :------: | :-----------------------------: |
| Border Radius  |    是    |       block/inline 不支持       |
| Border Width   |    是    |                                 |
| Border Color   |    是    | transparent/currentColor 不支持 |
| Border Opacity |    是    |                                 |
| Border Style   |    是    |          double 不支持          |

#### Divider

不支持

#### Outline

不支持

#### Ring

不支持

#### Box Shadow

| 规则             | 是否支持 | 备注 |
| :--------------- | :------: | :--: |
| Box Shadow Size  |    是    |      |
| Box Shadow Color |    是    |      |

#### Opacity

支持

#### Mix Blend Mode

不支持

#### Filter

| 规则               | 是否支持 |                    备注                     |
| :----------------- | :------: | :-----------------------------------------: |
| Filter Blur        |    是    | 0.76 版本支持部分属性，且有机型的兼容性问题 |
| Filter Brightness  |    是    |                                             |
| Filter Contrast    |    是    |                                             |
| Filter Drop Shadow |    是    |                                             |
| Filter Grayscale   |    是    |                                             |
| Filter Hue Rotate  |    是    |                                             |
| Filter Invert      |    是    |                                             |
| Filter Saturate    |    是    |                                             |
| Filter Sepia       |    是    |                                             |

#### Backdrop Filter

不支持

#### Accent Color

不支持

#### Appearance

部分支持(backface-visible,backface-hidden)

#### Cursor

不支持，TextInput 有属性控制

#### Caret

| 规则          | 是否支持 | 备注 |
| :------------ | :------: | :--: |
| Caret Color   |    否    |      |
| Caret Opacity |    否    |      |

#### Pointer Events

部分支持(auto,none)

#### Resize

不支持

#### Scroll Behavior

不支持

#### Touch Action

不支持

#### User Select

支持(none,auto,all,text)

#### Will Change

不支持

#### Columns

不支持

#### Container

不支持

#### Display

| 规则                | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| Block               |    否    |      |
| Inline Block        |    否    |      |
| Inline              |    否    |      |
| Flow Root           |    否    |      |
| Contents            |    否    |      |
| Hidden              |    是    |      |
| Visibility          |    否    |      |
| Visibility          |    否    |      |
| Backface Visibility |    否    |      |
| List Item           |    否    |      |

#### Flexbox

| Flex | 是 | |
| Flex Basis | 是 | |
| Inline Flex | 是 | |
| Flex Direction | 是 | |
| Flex Wrap | 是 | |
| Flex Stretch | 是 | |
| Flex Grow | 是 | |
| Flex Shrink | 是 | |

#### Grid

不支持

#### Positioning

| 规则 | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| Justify Content | 是 | 只支持(justify-around,justify-between,justify-center,justify-end,justify-evenly,justify-start) |
| Justify Items | 否 | |
| Justify Self | 否 | |
| Align Content | 是 | |
| Align Items | 是 | |
| Align Self | 是 | |
| Place Content | 否 | |
| Place Items | 否 | |
| Place Self | 否 | |
| Position | 是 | 只支持(absolute,relative) |
| Top / Right / Bottom / Left | 是 | |
| Floats | 否 | |
| Clear | 否 | |
| Isolation | 否 | |
| Object Fit | 否 | |
| Object Position | 否 | |
| Z-Index | 是 | |

#### Sizing

| 规则 | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| Width | 是 | |
| Min-Width | 是 | |
| Max-Width | 是 | |
| Min-Height | 是 | |
| Max-Height | 是 | |
| Box Sizing | 否 | |

#### Spacing

| 规则 | 是否支持 | 备注 |
| :------------------ | :------: | :--: |
| Padding | 是 | |
| Padding Y | 是 | |
| Padding X | 是 | |
| Padding Top | 是 | |
| Padding Left | 是 | |
| Padding Bottom | 是 | |
| Padding Right | 是 | |
| Margin | 是 | |
| Margin Y | 是 | |
| Margin X | 是 | |
| Margin Top | 是 | |
| Margin Left | 是 | |
| Margin Bottom | 是 | |
| Margin Right | 是 | |
| Space Between Y | 否 | |
| Space Between Y Reverse | 否 | |
| Space Between X | 否 | |
| Space Between X Reverse | 否 | |

#### Tables

不支持
