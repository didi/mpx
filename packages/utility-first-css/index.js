const path = require('path')
var windicss = require("windicss");
const hash = require('hash-sum')
const windiConfigPath = path.join(process.cwd(),'./windi.config.js')
const windiConfig = require(windiConfigPath)
var import_style = require("windicss/utils/style");
var import_utils3 = require("@antfu/utils");
const regexHtmlTag = /<(\w[\w-]*)([\S\s]*?)\/?>/mg;
var regexClassSplitter = /[\s'"`{}]/g;
var regexClassCheck1 = /^!?[a-z\d@<>.+-](?:\([\w,.%#\(\)+-]*\)|[\w:/\\,%#\[\].$-])*$/;
var regexAttributifyItem = /(?:\s|^)([\w+:_/-]+)\s?=\s?(['"{])((?:\\\2|\\\\|\n|\r|.)*?)(?:\2|\})/gm;
var regexClassCheck2 = /[a-z].*[\w)\]]$/;
var regexClassChecks = [
  regexClassCheck1,
  regexClassCheck2
];
const { RawSource } = require("webpack-sources");
let classesPending = /* @__PURE__ */ {};
const classesGenerated = /* @__PURE__ */ {};
const layerStylesMap = /* @__PURE__ */ {};
const layers = {
    base: {},
    utilities: {},
    components: {}
  };
const commonDir = []
const attributes = [];
const OUTPUTCSSFILENAME = 'index'
const MAINDIR = 'main'
const CSSFILEEXTMAP = {
  'wx': 'wxss',
  'ali': 'acss'
}
const FILESPLIT = path.sep
function validClassName(i) {
    return regexClassChecks.every((r) => i.length > 2 && i.match(r));
}

function include(set, v) {
    for (const i of v)
      set.add(i);
}
function DefaultExtractor(code) {
    const tags = Array.from(code.matchAll(regexHtmlTag));
    const tagNames = tags.map((i) => i[1]);
    return {
      tags: tagNames,
      get classes() {
        return code.split(regexClassSplitter).filter(validClassName);
      },
      get attributes() {
        const attrRanges = [];
        const attributes = {
          names: [],
          values: []
        };
        const attributesBlocklist = ["class", "className"];
        const tagsBlocklist = ["meta", "script", "style", "link"];
        tags.filter((i) => !tagsBlocklist.includes(i[1])).forEach((i) => {
          return Array.from(i[2].matchAll(regexAttributifyItem) || []).forEach((match) => {
            let name = match[1];
            const [full, , , value] = match;
            name = name.replace(/^(:|v-bind:)/, "");
            if (attributesBlocklist.includes(name))
              return;
            attributes.names.push(name);
            attributes.values.push(value);
            if (match.index != null)
              attrRanges.push([match.index, match.index + full.length]);
          });
        });
        return attributes;
      }
    };
}
function applyExtractors(code) {
  const results = [DefaultExtractor].map((extractor) => extractor(code))
  const attributesNames = results.flatMap((v) => {
  var _a, _b;
  return (_b = (_a = v.attributes) == null ? void 0 : _a.names) != null ? _b : [];
  });
  const attributesValues = results.flatMap((v) => {
  var _a, _b;
  return (_b = (_a = v.attributes) == null ? void 0 : _a.values) != null ? _b : [];
  });
  return {
    tags: (0, import_utils3.uniq)(results.flatMap((v) => {
        var _a;
        return (_a = v.tags) != null ? _a : [];
    })),
    ids: (0, import_utils3.uniq)(results.flatMap((v) => {
        var _a;
        return (_a = v.ids) != null ? _a : [];
    })),
    classes: (0, import_utils3.uniq)(results.flatMap((v) => {
        var _a;
        return (_a = v.classes) != null ? _a : [];
    })),
    attributes: attributesNames.length || attributesValues.length ? {
        names: attributesNames,
        values: attributesValues
    } : void 0
  }
}
function addClasses(classes, dir) {
  if(!classesGenerated[dir] || !classesPending[dir]){
    classesGenerated[dir] = new Set()
    classesPending[dir] = new Set()
  }
  classes.forEach((i) => {
      if (!i || classesGenerated[dir].has(i) || classesPending[dir].has(i))
      return;
      classesPending[dir].add(i);
  });
  return classesPending;
}
function extractFileLoader(code, dir) {
  const extractResult = applyExtractors(code);
  if(windiConfig.attributify) {
    const extractedAttrs = extractResult.attributes;
    if (extractedAttrs == null ? void 0 : extractedAttrs.names.length) {
      extractedAttrs.names.forEach((name2, i) => {
        attributes.push([name2, extractedAttrs.values[i]]);
      });
    }
    return addClasses((extractedAttrs == null ? void 0 : extractedAttrs.classes) || extractResult.classes || [], dir)
  } else {
    return addClasses(extractResult.classes || [], dir)
  }
}
function buildLayerCss(layer,dir) {
    var _a;
    const style = new import_style.StyleSheet(Array.from(layerStylesMap[dir].values()).flatMap((i) => i).filter((i) => i.meta.type === layer));
    // style.prefixer = (_a = windiConfigMap[dir].prefixer) != null ? _a : true;
    style.prefixer = (_a = windiConfig.prefixer) != null ? _a : true;
    return `${style.build()}`
}
function buildPendingStyles(dir) {
  // const processor = new windicss(windiConfigMap[dir]);
  const processor = new windicss(windiConfig);
  if(!classesPending[dir]){
    classesPending[dir] = new Set()
  }
  if (classesPending[dir].size) {
    const result = processor.interpret(Array.from(classesPending[dir]).join(" "));
    if (result.success.length) {
      updateLayers(result.styleSheet.children, "__classes", dir, false);
      include(classesGenerated[dir], result.success);
      classesPending[dir].clear();
    }
  }
  function updateLayers(styles, filepath, dir, replace = true) {
    var _a;
    const timestamp = +Date.now();
    const changedLayers = /* @__PURE__ */ new Set();
    styles.forEach((i) => changedLayers.add(i.meta.type));
    if (replace) {
      (_a = layerStylesMap[dir].get(filepath)) == null ? void 0 : _a.forEach((i) => changedLayers.add(i.meta.type));
      layerStylesMap[dir].set(filepath, styles);
    } else {
      const prevStyles = layerStylesMap[dir].get(filepath) || [];
      layerStylesMap[dir].set(filepath, prevStyles.concat(styles));
    }
    for (const name2 of changedLayers) {
      const layer = layers[name2];
      if (layer) {
        layer.timestamp = timestamp;
        layer.cssCache = void 0;
      }
    }
  }
  if (windiConfig.attributify) {
    if (attributes.length) {
      const attributesObject = {};
      attributes.filter((i) => i[0] && i[1]).forEach(([name2, value]) => {
        if (!attributesObject[name2])
          attributesObject[name2] = [];
        attributesObject[name2].push(...String(value).split(regexClassSplitter).filter(Boolean));
      });
      const attributifyStyle = processor.attributify(attributesObject);
      updateLayers(attributifyStyle.styleSheet.children, "__attributify", dir, false);
      attributes.length = 0;
    }
  }
}
function generateCSS(layer,dir) {
  buildPendingStyles(dir);
  return buildLayerCss(layer,dir)
}
function getCommonClass(){
  const allClasses = Object.keys(classesPending).reduce((acc , cur)=> acc.concat(Array.from(classesPending[cur])),[])
  const classTimes = allClasses.reduce((acc, c)=> {acc[c] ? acc[c]++ : acc[c] = 1; return acc},{})
  const commonClass = Object.keys(classTimes).filter(c=> classTimes[c] >= 2)
  let classArray = {}
  Object.keys(classesPending).forEach(key => {
    classArray[key] = Array.from(classesPending[key]).filter(c => !commonClass.includes(c))
    if(Array.from(classesPending[key]).length !== classArray[key].length){
      commonDir.push(key)
    }
  })
  commonClass.length && (classArray[MAINDIR] = commonClass)
  classesPending = Object.keys(classArray).reduce((acc,k) =>{
    acc[k] = new Set(classArray[k])
    return acc
  },{})
}
function relativeFilePath(a, b) {
  return path.relative(a, b)
}

function getDirs(defaultSubpackages) {
  let dirs = []
  if (windiConfig?.extract?.include) {
    windiConfig?.extract?.include.forEach(item => {
      item.replace(/subpackage\/(\w+)/g,(str,$1) => {
        if($1) dirs.push($1)
      });
    })
  } else {
    dirs = Object.keys(defaultSubpackages)
  }
  return dirs
}

function scanCode(dirs, compilation) {
  const mainfiles = compilation.__mpx__.componentsMap.main && Object.values(compilation.__mpx__.componentsMap.main).map(file => path.dirname(file))
  const cache = compilation.getCache ? compilation.getCache('MpxAtomicClassWebpackPlugin') : compilation.cache
  return Promise.all(Object.keys(compilation.assets).map(async name => {
    const dir = name.split(FILESPLIT)[0]
    if(mainfiles.includes(path.dirname(name)) && /\.?ml$/i.test(name)){
      const content = compilation.assets[name].source()
      layerStylesMap[MAINDIR] = new Map()
      const etag = hash(content)
      let traversedInfo = etag && await cache.getPromise(name, etag)
      if (!traversedInfo) {
        traversedInfo = {
          hasChanged: true
        }
        etag && await cache.storePromise(name, etag, traversedInfo)
        return extractFileLoader(content, MAINDIR)
      }
    }
    
    if (/\.?ml$/i.test(name) && dirs.includes(dir)) {
      const content = compilation.assets[name].source()
      if(!layerStylesMap[dir]) layerStylesMap[dir] = new Map()
      const etag = hash(content)
      let traversedInfo = etag && await cache.getPromise(name, etag)
      if (!traversedInfo) {
        traversedInfo = {
          hasChanged: true
        }
        etag && await cache.storePromise(name, etag, traversedInfo)
        return extractFileLoader(content, dir)
      }
    }
  }))
}
function emitCode(dirs, compilation, outputPath) {
  dirs.forEach(dir => {
    const cssData = generateCSS('utilities', dir)
    const fileType = CSSFILEEXTMAP[compilation.__mpx__.mode]
    const relativeSymbol = relativeFilePath(outputPath + FILESPLIT + dir, outputPath)
    const commonWritePath = `${FILESPLIT}${OUTPUTCSSFILENAME}.${fileType}`
    let importStr = ''
    if(commonDir.includes(dir) && dir !== MAINDIR){
      importStr =  `@import '${relativeSymbol}${commonWritePath}';\n`
    }
    const writePath = dir === MAINDIR ? `.${commonWritePath}` : `${dir}${commonWritePath}`
    compilation.emitAsset(writePath, new RawSource(importStr + cssData))
  })

  Object.keys(compilation.assets).map(file => {
    const fileNameArr = file.split(FILESPLIT)
    const fileDirName = fileNameArr[0]
    if (/\.?ml$/i.test(file) && dirs.includes(fileDirName)) { 
      let cssFile = fileNameArr.splice(0, fileNameArr.length-1).join(FILESPLIT) 
      const dirPath = dirs.filter(dir => fileDirName === dir)[0]
      const importFile = relativeFilePath(cssFile , dirPath)
      const commonWritePath = `${FILESPLIT}${OUTPUTCSSFILENAME}.${CSSFILEEXTMAP[compilation.__mpx__.mode]}`
      cssFile = cssFile + commonWritePath
      compilation.emitAsset(cssFile, new RawSource(`@import '${importFile}${commonWritePath}';\n`))
    }
  })
}
class MpxAtomicClassWebpackPlugin {
    apply(compiler) {
      compiler.hooks.emit.tap('MpxAtomicClassWebpackPlugin', async (compilation) => {
        const dirs = getDirs(compilation.__mpx__.componentsMap)
        await scanCode(dirs, compilation)
        getCommonClass()
        emitCode(dirs, compilation, compiler.outputPath)
      })
    }
  }
  
module.exports = MpxAtomicClassWebpackPlugin;