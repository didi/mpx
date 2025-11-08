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
body { margin: 0; }
/*@mpx-if(isMobile)*/
.mobile {
  display: block;
  /*@mpx-if(hasFeature)*/
  .feature { color: red; }
  /*@mpx-endif*/
}
/*@mpx-endif*/
header { color: red }
```