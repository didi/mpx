## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {},
    "dependencies": [
        "nest1/nest2/s2.styl",
        "nest1/s1.styl"
    ]
}
```

## Result

```stylus



.s2
    color green


.s1
    color: blue


.index
    color: red
```