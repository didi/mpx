## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": true
    }
}
```

## Result

```stylus
// @import "./s1.styl"


/**
@import "./s2.styl"
*/

.s3
    color green

$namespace = red // hello world

.selector1 // hello world
    color: blue // hello world

.selector2
    color: red
```