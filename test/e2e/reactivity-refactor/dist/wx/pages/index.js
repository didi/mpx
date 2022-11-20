
var self = self || {};

self["webpackChunka_mpx"] = require("../bundle.js");
(self["webpackChunka_mpx"] = self["webpackChunka_mpx"] || []).push([[2],{

/***/ 544:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

__webpack_require__.g.currentModuleId = "m2a1818d8"
__webpack_require__.g.currentResource = "/Users/october/Desktop/github-contrib/mpx/test/e2e/a-mpx/src/pages/index.mpx"
__webpack_require__.g.currentCtor = Component
__webpack_require__.g.currentCtorType = "component"
__webpack_require__.g.currentResourceType = "page"
/* template */
__webpack_require__(545)
/* styles */
/* json */
__webpack_require__(546)
/* script */
__webpack_require__.g.currentSrcMode = "wx"
__webpack_require__(547)


/***/ }),

/***/ 547:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _mpxjs_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(519);

(0,_mpxjs_core__WEBPACK_IMPORTED_MODULE_0__["default"])({
  data: {
    name: 'jack',
    info: {
      address: 'shaoxing',
      message: 'hello mpx!!'
    }
  },
  // watch: {
  //   name(newVal, oldVal) {
  //     console.log(newVal, oldVal)
  //     this.info.message = 'hello'
  //   }
  // },
  created() {
    console.log("\u6211\u88AB\u521B\u5EFA\u4E86\uFF01\uFF01\uFF01");
  },
  onLoad() {
    this.name = 'ma';
    console.log("onLoad====");
  }
});

/***/ }),

/***/ 545:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

__webpack_require__.g.currentInject = {
  moduleId: "m2a1818d8",
  render: function () {
    this._c("name", this.name);
    "\\n" + this._c("info.message", this.info.message);
    this._r();
  }
};


/***/ }),

/***/ 546:
/***/ (function() {



/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ var __webpack_exports__ = (__webpack_exec__(544));
/******/ }
]);
//# sourceMappingURL=index.js.map