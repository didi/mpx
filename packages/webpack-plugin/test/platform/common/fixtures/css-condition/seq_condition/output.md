## Config

```json
{
    "lang": "css",
    "resourcePath": "index.css",
    "defs": {
        "isMobile": true,
        "hasFeature": true
    }
}
```

## Result

```css
header {}
/*@mpx-if(isMobile)*/
.mobile { display: block; }
/*@mpx-endif */
body {}
```