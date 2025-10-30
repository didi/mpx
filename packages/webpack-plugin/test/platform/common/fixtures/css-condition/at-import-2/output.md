## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": true,
        "__mpx_mode__": "ios"
    }
}
```

## Result

```stylus

.layout
  background red

// comment 1
// comment 2

.selector1
  color blue

/// comment 3           2
// @import './s2.styl'
// @import './s1_in_commend.styl'

.layout
  background red


.layout
  background red


.layout
  background red


.layout
  background red


.selector2
  color red

// 111

.layout
  background red

// 111

/** comment 4
@import './s2.styl'
 */

.selector3
  color green /** comment 5 */


.layout-nested-else
  background #fff
  color blue


.text-ellipsis {
  
}



.layout
  background red

```