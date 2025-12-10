## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {},
    "dependencies": [
        "nested.styl",
        "foo.styl"
    ]
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