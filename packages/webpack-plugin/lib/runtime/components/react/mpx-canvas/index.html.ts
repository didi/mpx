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
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
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
<script>var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var WEBVIEW_TARGET = "@@WEBVIEW_TARGET";
var ID = function () { return Math.random().toString(32).slice(2); };
var flattenObjectCopyValue = function (flatObj, srcObj, key) {
    var value = srcObj[key];
    if (typeof value === "function") {
        return;
    }
    if (typeof value === "object" && value instanceof Node) {
        return;
    }
    flatObj[key] = flattenObject(value);
};
var flattenObject = function (object) {
    if (typeof object !== "object" || object === null) {
        return object;
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
var AutoScaledCanvas = (function () {
    function AutoScaledCanvas(element) {
        this.element = element;
    }
    AutoScaledCanvas.prototype.toDataURL = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this.element).toDataURL.apply(_a, args);
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
    Object.defineProperty(AutoScaledCanvas.prototype, "width", {
        get: function () {
            return this.element.width;
        },
        set: function (value) {
            this.savedWidth = value;
            this.autoScale();
            return value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AutoScaledCanvas.prototype, "height", {
        get: function () {
            return this.element.height;
        },
        set: function (value) {
            this.savedHeight = value;
            this.autoScale();
            return value;
        },
        enumerable: false,
        configurable: true
    });
    return AutoScaledCanvas;
}());
var toMessage = function (result) {
    if (result instanceof Blob) {
        return {
            type: "blob",
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
            type: "json",
            payload: flattenObject(result),
            args: toArgs(flattenObject(result)),
            meta: {
                target: result[WEBVIEW_TARGET],
                constructor: result.__constructorName__ || result.constructor.name,
            },
        };
    }
    return {
        type: "json",
        payload: JSON.stringify(result),
        meta: {},
    };
};
var toArgs = function (result) {
    var args = [];
    for (var key in result) {
        if (result[key] !== undefined && key !== "@@WEBVIEW_TARGET") {
            if (typedArrays[result[key].constructor.name] !== undefined) {
                result[key] = Array.from(result[key]);
            }
            args.push(result[key]);
        }
    }
    return args;
};
var createObjectsFromArgs = function (args) {
    var _a;
    for (var index = 0; index < args.length; index += 1) {
        var currentArg = args[index];
        if (currentArg && currentArg.className !== undefined) {
            var className = currentArg.className, classArgs = currentArg.classArgs;
            var object = new ((_a = constructors[className]).bind.apply(_a, __spreadArray([void 0], classArgs, false)))();
            args[index] = object;
        }
    }
    return args;
};
var canvas = document.createElement("canvas");
var autoScaledCanvas = new AutoScaledCanvas(canvas);
var targets = {
    canvas: autoScaledCanvas,
    context2D: canvas.getContext("2d"),
};
var constructors = {
    Image: Image,
    Path2D: Path2D,
    CanvasGradient: CanvasGradient,
    ImageData: ImageData,
    Uint8ClampedArray: Uint8ClampedArray,
};
var typedArrays = {
    Uint8ClampedArray: Uint8ClampedArray,
};

var populateRefs = function (arg) {
    if (arg && arg.__ref__) {
        return targets[arg.__ref__];
    }
    return arg;
};
document.body.appendChild(canvas);
function handleMessage(_a) {
    var _b, _c;
    var id = _a.id, type = _a.type, payload = _a.payload;
    switch (type) {
        case "exec": {
            var target = payload.target, method = payload.method, args = payload.args;
            var result = (_b = targets[target])[method].apply(_b, args.map(populateRefs));
            var message = toMessage(result);
            if (typeof result === "object" && !message.meta.constructor) {
                for (var constructorName in constructors) {
                    if (result instanceof constructors[constructorName]) {
                        message.meta.constructor = constructorName;
                    }
                }
            }
            window.ReactNativeWebView.postMessage(JSON.stringify(__assign({ id: id }, message)));
            break;
        }
        case "set": {
            var target = payload.target, key = payload.key, value = payload.value;
            targets[target][key] = populateRefs(value);
            break;
        }
    }
}
var handleError = function (err, message) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
        id: message.id,
        type: "error",
        payload: {
            message: err.message,
            stack: err.stack,
        },
    }));
    document.removeEventListener("message", handleIncomingMessage);
};
function handleIncomingMessage(e) {
    var data = JSON.parse(e.data);
    if (Array.isArray(data)) {
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var message = data_1[_i];
            try {
                handleMessage(message);
            }
            catch (err) {
                handleError(err, message);
            }
        }
    }
    else {
        try {
            handleMessage(data);
        }
        catch (err) {
            handleError(err, data);
        }
    }
}
window.addEventListener("message", handleIncomingMessage);
document.addEventListener("message", handleIncomingMessage);
</script>
  

</body></html>`
