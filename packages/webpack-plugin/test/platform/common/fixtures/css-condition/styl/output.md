## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": true
    },
    "dependencies": []
}
```

## Result

```stylus

/* @mpx-if (isMobile) */
.mobile { display: block; }
/* @mpx-endif */


/*@mpx-if(!isMobile)*//* @mpx-else */
.desktop { display: block; }
/* @mpx-endif */

```