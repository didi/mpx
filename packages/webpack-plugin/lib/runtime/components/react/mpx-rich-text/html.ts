
export const generateHTML = (html: string) => {
  return `<html><head>
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scaleable=no" name="viewport">
    <style>
      html {
        -ms-content-zooming: none;
        -ms-touch-action: pan-x pan-y;
      }
      body {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        overflow: hidden;
      }
      html,body {
        margin: 0;
        padding: 0;
      }
      * {
        user-select: none;
        -ms-user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
      }
    </style>
  </head>
  <body><div id="rich-text">${html}</div>
  <script>
    function sendHeight() {
      const dom = document.getElementById('rich-text')
      window.ReactNativeWebView.postMessage(height: dom.scrollHeight, width: dom.scrollWidth);
    }
    window.onload = sendHeight;
</script>
</body
></html>`
}
