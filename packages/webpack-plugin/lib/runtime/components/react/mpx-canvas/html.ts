export default `<html><head>
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
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      * {
        user-select: none;
        -ms-user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
      }
    </style>
  </head>
  <body>
  <script>
  var scale = function (ratio) {
    return function (item) {
        if (typeof item === "number") {
            return item * ratio;
        }
        return item;
    };
};
function autoScaleCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    var ratio = window.devicePixelRatio || 1;
    if (ratio !== 1) {
        canvas.width *= ratio;
        canvas.height *= ratio;
        ctx.scale(ratio, ratio);
        ctx.isPointInPath = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return CanvasRenderingContext2D.prototype.isPointInPath.apply(ctx, args.map(scale(ratio)));
        };
    }
    return canvas;
}
window.autoScaleCanvas = autoScaleCanvas;
</script>
<script>

var WEBVIEW_TARGET = '@@WEBVIEW_TARGET';

var ID = function () {
  return Math.random().toString(32).slice(2);
};

var flattenObjectCopyValue = function (flatObj, srcObj, key) {
  var value = srcObj[key];
  if (typeof value === 'function') {
    return;
  }
  if (typeof value === 'object' && value instanceof Node) {
    return;
  }
  flatObj[key] = flattenObject(value);
};

var flattenObject = function (object) {
  if (typeof object !== 'object' || object === null) {
    return object;
  }
  // Handle TypedArray
  if (object instanceof Uint8ClampedArray) {
    return Array.from(object);
  }
  var flatObject = {};
  for (var key in object) {
    flattenObjectCopyValue(flatObject, object, key);
  }
  for (var key in Object.getOwnPropertyNames(object)) {
    flattenObjectCopyValue(flatObject, object, key);
  }
  return flatObject;
};

var AutoScaledCanvas = function (element) {
  this.element = element;
};

AutoScaledCanvas.prototype.toDataURL = function () {
  return this.element.toDataURL.apply(this.element, arguments);
};

AutoScaledCanvas.prototype.autoScale = function () {
  if (this.savedHeight !== undefined) {
    this.element.height = this.savedHeight;
  }
  if (this.savedWidth !== undefined) {
    this.element.width = this.savedWidth;
  }
  window.autoScaleCanvas(this.element);
};

Object.defineProperty(AutoScaledCanvas.prototype, 'width', {
  get: function () {
    return this.element.width;
  },
  set: function (value) {
    this.savedWidth = value;
    this.autoScale();
    return value;
  },
});

Object.defineProperty(AutoScaledCanvas.prototype, 'height', {
  get: function () {
    return this.element.height;
  },
  set: function (value) {
    this.savedHeight = value;
    this.autoScale();
    return value;
  },
});
var toMessage = function (result) {
  if (result instanceof Blob) {
    return {
      type: 'blob',
      payload: btoa(result),
      meta: {},
    };
  }
  if (result instanceof Object) {
    if (!result[WEBVIEW_TARGET]) {
      var id = ID();
      result[WEBVIEW_TARGET] = id;
      targets[id] = result;
    }
    return {
      type: 'json',
      payload: flattenObject(result),
      args: toArgs(flattenObject(result)),
      meta: {
        target: result[WEBVIEW_TARGET],
        constructor: result.__constructorName__ || result.constructor.name,
      },
    };
  }
  return {
    type: 'json',
    payload: typeof result === 'string' ? result : JSON.stringify(result),
    meta: {},
  };
};
var toArgs = function (result) {
    var args = [];
    for (var key in result) {
        if (result[key] !== undefined && key !== '@@WEBVIEW_TARGET') {
            args.push(result[key]);
        }
    }
    return args;
};

var createObjectsFromArgs = function (args) {
    for (var index = 0; index < args.length; index += 1) {
        var currentArg = args[index];
        if (currentArg && currentArg.className !== undefined) {
            var className = currentArg.className, classArgs = currentArg.classArgs;
            // new ImageData，第一个参数需要是 Uint8ClampedArray
            var object = new (Function.prototype.bind.apply(constructors[className], [null].concat(classArgs)))();
            args[index] = object;
        }
    }
    return args;
};

var canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
var autoScaledCanvas = new AutoScaledCanvas(canvas);

var targets = {
  canvas: autoScaledCanvas,
  context2D: canvas.getContext('2d'),
};

var constructors = {
  CanvasGradient: CanvasGradient,
  Image: Image,
  ImageData: ImageData,
  Uint8ClampedArray: Uint8ClampedArray,
};

Image.bind =
  Image.bind ||
  function () {
    return Image;
  };

ImageData.bind =
  ImageData.bind ||
  function () {
    return ImageData;
  };
Uint8ClampedArray.bind =
  Uint8ClampedArray.bind ||
  function () {
    return Uint8ClampedArray;
  };

var populateRefs = function (arg) {
  if (arg && arg.__ref__) {
    return targets[arg.__ref__];
  }
  return arg;
};
document.body.appendChild(canvas);

var mergeObjects = function (target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
  return target;
};

function handleMessage(message) {
  var id = message.id,
      type = message.type,
      payload = message.payload;

  switch (type) {
    case 'exec': {
      var target = payload.target,
          method = payload.method,
          args = payload.args;
      var result = targets[target][method].apply(targets[target], args.map(populateRefs));
      var msg = toMessage(result);

      if (typeof result === 'object' && !msg.meta.constructor) {
        for (var constructorName in constructors) {
          if (result instanceof constructors[constructorName]) {
            msg.meta.constructor = constructorName;
          }
        }
      }
      window.ReactNativeWebView.postMessage(JSON.stringify(mergeObjects({ id: id }, msg)));
      break;
    }
    case 'set': {
      var target = payload.target,
          key = payload.key,
          value = payload.value;
      targets[target][key] = populateRefs(value);
      break;
    }
        case 'construct': {
            var constructor = payload.constructor,
          target = payload.id,
          args = payload.args || [];
            var newArgs = createObjectsFromArgs(args);
            var object;
            try {
                object = new (Function.prototype.bind.apply(constructors[constructor], [null].concat(newArgs)))();
            }
            catch (error) {
                throw new Error('Error while constructing '.concat(constructor, ' ').concat(error.message));
            }
            object.__constructorName__ = constructor;
            var msg = toMessage({});
            targets[target] = object;
            window.ReactNativeWebView.postMessage(JSON.stringify(mergeObjects({ id: id }, msg)));
            break;
        }
            case 'listen': {
      var types = payload.types,
          target = payload.target;
    for (var i = 0; i < types.length; i++) {
    var eventType = types[i];
    targets[target].addEventListener(eventType, function (e) {
          const message = toMessage({
            type: 'event',
            payload: {
                type: e.type,
                target: mergeObjects(flattenObject(targets[target]), {
                [WEBVIEW_TARGET]: target,
            }),
            },
          });
      window.ReactNativeWebView.postMessage(
        JSON.stringify(mergeObjects({ id: id }, message))
      );
    });
  }
  break;
}
    }
}
var handleError = function (err, message) {
  window.ReactNativeWebView.postMessage(JSON.stringify({
    id: message.id,
    type: 'error',
    payload: {
      message: err.message,
      stack: err.stack,
    },
  }));
  document.removeEventListener('message', handleIncomingMessage);
};

function handleIncomingMessage(e) {
  var data = JSON.parse(e.data);
  if (Array.isArray(data)) {
    for (var i = 0; i < data.length; i++) {
      try {
        handleMessage(data[i]);
      } catch (err) {
        handleError(err, data[i]);
      }
    }
  } else {
    try {
      handleMessage(data);
    } catch (err) {
      handleError(err, data);
    }
  }
}

window.addEventListener('message', handleIncomingMessage);
document.addEventListener('message', handleIncomingMessage);
</script>
  

</body></html>`
