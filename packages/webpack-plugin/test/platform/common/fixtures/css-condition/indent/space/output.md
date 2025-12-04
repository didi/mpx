## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {},
    "dependencies": [
        "foo.styl",
        "foo.styl"
    ]
}
```

## Result

```stylus


.color
    color red



    
    .color
        color red


.color
    color blue
```