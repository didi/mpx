// These tag configs are shared between compiler-dom and runtime-dom, so they
// must be extracted in shared to avoid creating a dependency between the two.
const makeMap = require('./make-map')

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element
const HTML_TAGS =
  'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
  'header,hgroup,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,' +
  'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
  'data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,' +
  'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
  'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
  'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
  'option,output,progress,select,textarea,details,dialog,menu,' +
  'summary,template,blockquote,iframe,tfoot'

// https://developer.mozilla.org/en-US/docs/Web/SVG/Element
const SVG_TAGS =
  'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
  'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
  'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
  'feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
  'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
  'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
  'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
  'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
  'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
  'text,textPath,title,tspan,unknown,use,view'

const VOID_TAGS =
  'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
const isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
)

const isRichTextTag = makeMap(
  'a,abbr,address,article,aside,b,bdi,bdo,big,blockquote,br,caption,' +
  'center,cite,code,col,colgroup,dd,del,div,dl,dt,em,fieldset,' +
  'font,footer,h1,h2,h3,h4,h5,h6,header,hr,i,img,ins,label,legend,' +
  'li,mark,nav,ol,p,pre,q,rt,ruby,s,section,small,span,strong,sub,sup,' +
  'table,tbody,td,tfoot,th,thead,tr,tt,u,ul'
)

const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)

// https://developers.weixin.qq.com/miniprogram/dev/component/
// 以后可能在框架中原生支持这些标签，所以需要进行判断
const isNativeMiniTag = makeMap(
  'cover-image,cover-view,match-media,movable-area,movable-view,' +
  'page-container,root-portal,scroll-view,swiper,swiper-item,view,' +
  'icon,progress,rich-text,text,button,checkbox,checkbox-group,editor,' +
  'form,input,keyboard-accessory,label,picker,picker-view,' +
  'picker-view-column,radio,radio-group,slider,switch,textarea,' +
  'grid-view,list-view,share-element,snapshot,span,sticky-header,' +
  'sticky-section,functional-page-navigator,navigator,audio,camera,' +
  'channel-live,channel-video,image,live-player,live-pusher,video,' +
  'voip-room,map,canvas,web-view,ad,ad-custom,official-account,' +
  'open-data,native-component,aria-component,page-meta'
)

/**
 * 是否为mpx内置组件
 * collected from packages/webpack-plugin/lib/runtime/components/web/
 */
const isBuildInTag = makeMap(
  'mpx-image,mpx-picker-view,mpx-slider,mpx-textarea,mpx-input,mpx-picker,' +
  'mpx-swiper-item,mpx-video,mpx-button,mpx-keep-alive,mpx-progress,' +
  'mpx-swiper,mpx-view,mpx-checkbox-group,mpx-movable-area,mpx-radio-group,' +
  'mpx-switch,mpx-web-view,mpx-checkbox,mpx-movable-view,mpx-radio,' +
  'mpx-tab-bar-container,mpx-form,mpx-navigator,mpx-rich-text,mpx-tab-bar,' +
  'mpx-icon,mpx-picker-view-column,mpx-scroll-view,mpx-text'
)

const isSpace = makeMap('ensp,emsp,nbsp')

const isContWidth = makeMap('col,colgroup,img,table,td,th,tr')

const isContHeight = makeMap('img,td,th,tr')

const isContConRow = makeMap('td,th,tr')

const isHTMLTag = makeMap(HTML_TAGS)

const isSVGTag = makeMap(SVG_TAGS)

const isVoidTag = makeMap(VOID_TAGS)

// 是否为原始tag，包括 html tag 和小程序原生 tag
const isOriginTag = (tag) => isHTMLTag(tag) || isSVGTag(tag) || isVoidTag(tag) || isNativeMiniTag(tag)

module.exports = {
  isOriginTag,
  isHTMLTag,
  isSVGTag,
  isVoidTag,
  isNonPhrasingTag,
  isRichTextTag,
  isBuildInTag,
  isUnaryTag,
  isSpace,
  isContWidth,
  isContHeight,
  isNativeMiniTag,
  isContConRow
}
