## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": true
    },
    "dependencies": [
        "s1.styl"
    ]
}
```

## Result

```stylus

.layout
  background red
  /* @mpx-if (isMobile) */
  color yellow
  .driver
    color blue
  /* @mpx-endif */



.wrapper
  background red
  /* @mpx-if (isMobile) */
  color yellow
  .child
    color blue
  /* @mpx-endif */

```
