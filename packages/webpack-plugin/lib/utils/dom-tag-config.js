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

const isSpace = makeMap('ensp,emsp,nbsp')

const isContWidth = makeMap('col,colgroup,img,table,td,th,tr')

const isContHeight = makeMap('img,td,th,tr')

const isContConRow = makeMap('td,th,tr')

const isHTMLTag = makeMap(HTML_TAGS)

const isSVGTag = makeMap(SVG_TAGS)

const isVoidTag = makeMap(VOID_TAGS)

const isOriginTag = (tag) => isHTMLTag(tag) || isSVGTag(tag) || isVoidTag(tag)

module.exports = {
  isOriginTag,
  isHTMLTag,
  isSVGTag,
  isVoidTag,
  isNonPhrasingTag,
  isRichTextTag,
  isUnaryTag,
  isSpace,
  isContWidth,
  isContHeight,
  isContConRow
}
