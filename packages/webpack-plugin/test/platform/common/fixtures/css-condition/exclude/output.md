## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {}
}
```

## Result

```stylus


.foo
    background: red;

@import url('./bar.styl');

@import url('./bar.styl');

.n1
    background: yellow;

```