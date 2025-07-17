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

```