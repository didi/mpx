## Config

```json
{
    "lang": "css",
    "resourcePath": "index.css",
    "defs": {
        "isMobile": true,
        "showHeader": true
    }
}
```

## Result

```css
/*@mpx-if(isMobile)*/
.mobile {
  display: block;
}
/*@mpx-endif*/

/*@mpx-if(showHeader)*/
.header {
  height: 100px;
}
/*@mpx-endif*/

```