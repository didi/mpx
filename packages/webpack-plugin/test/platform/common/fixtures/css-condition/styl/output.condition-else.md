## Config

```json
{
    "lang": "stylus",
    "resourcePath": "index.styl",
    "defs": {
        "isMobile": false
    }
}
```

## Result

```stylus

/* @mpx-if (isMobile) *//* @mpx-else */
.desktop { display: block; }
/* @mpx-endif */


/*@mpx-if(!isMobile)*/
.mobile { display: block; }
/* @mpx-endif */

```