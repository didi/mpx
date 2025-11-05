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

/* @mpx-if (isMobile) */
.mobile { display: block; }
/* @mpx-endif */


/*@mpx-if(!isMobile)*//* @mpx-else */
.desktop { display: block; }
/* @mpx-endif */

```