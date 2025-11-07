## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": false
    },
    "dependencies": []
}
```

## Result

```stylus

.selector
    /* @mpx-if (isMobile) *//* @mpx-endif */
```