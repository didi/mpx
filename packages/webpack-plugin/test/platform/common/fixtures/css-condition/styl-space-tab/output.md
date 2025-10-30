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
    color red


.e-common-title
  font-size 30px // Here uses \t indentation
.e-font-size2
    font-size 24px // Here uses 4 spaces for indentation

.url
  background-image url('../images/\t/bg.png')

.m
    content: "\t123123"
```